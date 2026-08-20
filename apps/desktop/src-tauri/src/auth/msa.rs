// The Microsoft → Xbox Live → XSTS → Minecraft chain, HANDOFF §5.
//
// Hand-rolled rather than delegated to portablemc::msa for one reason: that
// crate's `Account` exposes no refresh token and implements neither Serialize
// nor Deserialize, so its only persistence is a file-backed `Database`. §5.7 is
// explicit that the refresh token belongs in the OS credential store, and a
// refresh token IS the account. portablemc still owns all of §6.
//
// Every endpoint, payload shape and trap below is transcribed from §5 and the
// working reference in docs/mc_auth.py. The comments record the traps because
// none of them are visible from the code afterwards.

use std::time::Duration;

use serde::{Deserialize, Serialize};

const DEVICE_CODE_URL: &str =
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode";
const TOKEN_URL: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
const XBL_URL: &str = "https://user.auth.xboxlive.com/user/authenticate";
const XSTS_URL: &str = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MC_LOGIN_URL: &str = "https://api.minecraftservices.com/authentication/login_with_xbox";
const MC_PROFILE_URL: &str = "https://api.minecraftservices.com/minecraft/profile";

/// The Minecraft relying party. XUID lives on a different one — see `fetch_xuid`.
const RP_MINECRAFT: &str = "rp://api.minecraftservices.com/";
const RP_XBOXLIVE: &str = "http://xboxlive.com";

/// Public client id from the approved Azure registration (HANDOFF §2 — not a
/// secret, and the registration is a public client so there is no secret at all).
pub const CLIENT_ID: &str = "72c3e158-bb47-4ef7-a50c-f3ce51698108";

/// §3.1 — must be the `consumers` tenant and exactly these scopes.
const SCOPE: &str = "XboxLive.signin offline_access";

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("no se pudo contactar con el servicio de autenticación: {0}")]
    Http(#[from] reqwest::Error),

    /// The user never finished, or took too long.
    #[error("el código ha caducado; vuelve a intentarlo")]
    Expired,
    #[error("has cancelado el acceso desde Microsoft")]
    Declined,

    /// §5.3 — mapped from XErr, because a raw code tells a player nothing.
    #[error("{0}")]
    Xbox(String),

    /// §5.5 — a 404 here is the "you don't own the game" case.
    #[error("{0}")]
    NoProfile(String),

    /// §5.4 — pre-approval this is 403 "Invalid app registration". Reaching it
    /// proves the whole upstream chain is correct.
    #[error("el registro de la aplicación no está aprobado por Microsoft")]
    AppNotApproved,

    /// Minecraft's services rate-limit per account, and the whole chain runs
    /// again on every restore. Signing in again does NOT fix this — waiting
    /// does — so it must never be reported as a session problem.
    #[error("Minecraft está limitando las peticiones de tu cuenta. Espera un minuto y vuelve a intentarlo.")]
    RateLimited,

    #[error("respuesta inesperada de {0}: {1}")]
    Unexpected(&'static str, String),
}

/// What the user is shown while they authorise in a browser (§5.1).
#[derive(Debug, Clone, Serialize)]
pub struct DeviceCode {
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    /// Seconds between polls; `slow_down` pushes this up by 5.
    pub interval: u64,
    #[serde(skip)]
    pub device_code: String,
}

/// A fully resolved Minecraft session. The access token is deliberately NOT
/// persisted (§5.7 — ~24h, re-derived per session).
#[derive(Debug, Clone, Serialize)]
pub struct McSession {
    /// Dashed, lowercase. Mojang returns it undashed; `rotom_users.uuid` and the
    /// pack ACL are char(36) dashed, so normalising here keeps every downstream
    /// comparison honest.
    pub uuid: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub access_token: String,
    /// Empty is legal — §5.6, it only matters for Xbox social features.
    pub xuid: String,
    #[serde(skip_serializing)]
    pub refresh_token: String,
    /// The player's ACTIVE skin PNG on textures.minecraft.net. Empty when the
    /// account has never set one. Not a head render — the full 64×64 sheet; the
    /// renderer crops the head out of it in CSS, which is why nothing here
    /// needs an image library or a third-party avatar service.
    pub skin_url: String,
}

#[derive(Deserialize)]
struct DeviceCodeResponse {
    user_code: String,
    device_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: String,
}

#[derive(Deserialize)]
struct TokenError {
    error: String,
}

#[derive(Deserialize)]
struct XblResponse {
    #[serde(rename = "Token")]
    token: String,
    #[serde(rename = "DisplayClaims")]
    display_claims: DisplayClaims,
}

#[derive(Deserialize)]
struct DisplayClaims {
    xui: Vec<XuiClaim>,
}

#[derive(Deserialize)]
struct XuiClaim {
    uhs: Option<String>,
    /// Only present on the xboxlive.com relying party (§5.6).
    xid: Option<String>,
}

#[derive(Deserialize)]
struct XstsError {
    #[serde(rename = "XErr")]
    xerr: Option<u64>,
}

#[derive(Deserialize)]
struct McLoginResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct ProfileResponse {
    id: String,
    name: String,
    /// Present on every real profile, but `default` anyway: a player who has
    /// never set a skin is a legitimate account, and losing the whole sign-in
    /// over a missing cosmetic would be absurd.
    #[serde(default)]
    skins: Vec<ProfileSkin>,
}

#[derive(Deserialize)]
struct ProfileSkin {
    /// "ACTIVE" or "INACTIVE" — the array carries the player's skin HISTORY,
    /// not just what they are wearing, so taking `[0]` puts old skins on faces.
    #[serde(default)]
    state: String,
    url: String,
}

impl ProfileResponse {
    /// The skin the player is actually wearing, if any.
    fn active_skin(&self) -> String {
        self.skins
            .iter()
            .find(|s| s.state.eq_ignore_ascii_case("ACTIVE"))
            .map(|s| s.url.clone())
            .unwrap_or_default()
    }
}

fn client() -> Result<reqwest::Client, AuthError> {
    Ok(reqwest::Client::builder()
        // §3.3's courtesy rule for Modrinth; harmless and polite everywhere else.
        .user_agent("BoffmediaApp/0.1 (+https://boffmedia.es)")
        .timeout(Duration::from_secs(30))
        .build()?)
}

/// Step 1 — ask Microsoft for a code the user types at the verification URI.
pub async fn request_device_code() -> Result<DeviceCode, AuthError> {
    let res = client()?
        .post(DEVICE_CODE_URL)
        .form(&[("client_id", CLIENT_ID), ("scope", SCOPE)])
        .send()
        .await?;

    let status = res.status();
    let body = res.text().await?;
    if !status.is_success() {
        return Err(AuthError::Unexpected("devicecode", body));
    }

    let parsed: DeviceCodeResponse = serde_json::from_str(&body)
        .map_err(|e| AuthError::Unexpected("devicecode", e.to_string()))?;

    Ok(DeviceCode {
        user_code: parsed.user_code,
        verification_uri: parsed.verification_uri,
        expires_in: parsed.expires_in,
        interval: parsed.interval.max(1),
        device_code: parsed.device_code,
    })
}

/// Step 2 — poll until the user finishes in the browser. Blocks (asynchronously)
/// for as long as the code is valid, so callers should treat this as long-running.
pub async fn poll_for_tokens(code: &DeviceCode) -> Result<(String, String), AuthError> {
    let http = client()?;
    let mut interval = code.interval;
    let deadline = std::time::Instant::now() + Duration::from_secs(code.expires_in);

    loop {
        if std::time::Instant::now() >= deadline {
            return Err(AuthError::Expired);
        }
        tokio::time::sleep(Duration::from_secs(interval)).await;

        let res = http
            .post(TOKEN_URL)
            .form(&[
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
                ("client_id", CLIENT_ID),
                ("device_code", code.device_code.as_str()),
            ])
            .send()
            .await?;

        let status = res.status();
        let body = res.text().await?;

        if status.is_success() {
            let tokens: TokenResponse = serde_json::from_str(&body)
                .map_err(|e| AuthError::Unexpected("token", e.to_string()))?;
            return Ok((tokens.access_token, tokens.refresh_token));
        }

        // §5.1 — the polling error vocabulary. Anything else is terminal.
        let err: TokenError = serde_json::from_str(&body)
            .map_err(|e| AuthError::Unexpected("token", e.to_string()))?;
        match err.error.as_str() {
            "authorization_pending" => continue,
            "slow_down" => {
                interval += 5;
                continue;
            }
            "expired_token" => return Err(AuthError::Expired),
            "authorization_declined" => return Err(AuthError::Declined),
            other => return Err(AuthError::Unexpected("token", other.to_string())),
        }
    }
}

/// Exchange a stored refresh token for a fresh pair (§5.7 — this is what makes
/// silent sign-in possible, and the only thing worth persisting).
pub async fn refresh_tokens(refresh_token: &str) -> Result<(String, String), AuthError> {
    let res = client()?
        .post(TOKEN_URL)
        .form(&[
            ("grant_type", "refresh_token"),
            ("client_id", CLIENT_ID),
            ("refresh_token", refresh_token),
            ("scope", SCOPE),
        ])
        .send()
        .await?;

    let status = res.status();
    let body = res.text().await?;
    if !status.is_success() {
        // A revoked token (password change, MFA reset) lands here. The caller
        // must treat it as "sign in again", not as a transport failure.
        return Err(AuthError::Expired);
    }

    let tokens: TokenResponse = serde_json::from_str(&body)
        .map_err(|e| AuthError::Unexpected("refresh", e.to_string()))?;
    Ok((tokens.access_token, tokens.refresh_token))
}

/// Steps 3–6 — everything downstream of a Microsoft access token.
pub async fn minecraft_session(
    ms_access_token: &str,
    refresh_token: String,
) -> Result<McSession, AuthError> {
    let http = client()?;

    // §5.2 — the `d=` prefix is MANDATORY for tokens from an Azure app
    // registration. Omitting it is the single most common mistake in this chain
    // and fails with an opaque Xbox error.
    let xbl: XblResponse = {
        let res = http
            .post(XBL_URL)
            .json(&serde_json::json!({
                "Properties": {
                    "AuthMethod": "RPS",
                    "SiteName": "user.auth.xboxlive.com",
                    "RpsTicket": format!("d={ms_access_token}"),
                },
                "RelyingParty": "http://auth.xboxlive.com",
                "TokenType": "JWT",
            }))
            .send()
            .await?;
        let status = res.status();
        let body = res.text().await?;
        if !status.is_success() {
            return Err(AuthError::Unexpected("xbl", body));
        }
        serde_json::from_str(&body).map_err(|e| AuthError::Unexpected("xbl", e.to_string()))?
    };

    let uhs = xbl
        .display_claims
        .xui
        .first()
        .and_then(|c| c.uhs.clone())
        .ok_or_else(|| AuthError::Unexpected("xbl", "sin uhs".into()))?;

    let xsts = xsts_authorize(&http, &xbl.token, RP_MINECRAFT).await?;

    // §5.4 — literal `XBL3.0 x=`, user hash, semicolon, XSTS token.
    let mc_access_token = {
        let res = http
            .post(MC_LOGIN_URL)
            .json(&serde_json::json!({
                "identityToken": format!("XBL3.0 x={uhs};{}", xsts.0),
            }))
            .send()
            .await?;
        let status = res.status();
        let body = res.text().await?;
        if status == reqwest::StatusCode::FORBIDDEN {
            return Err(AuthError::AppNotApproved);
        }
        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err(AuthError::RateLimited);
        }
        if !status.is_success() {
            return Err(AuthError::Unexpected("login_with_xbox", body));
        }
        // TRAP (§5.4): this response also carries a `username` field, and it is
        // an internal account id, NOT the Minecraft username. The real name only
        // comes from the profile call below.
        let parsed: McLoginResponse = serde_json::from_str(&body)
            .map_err(|e| AuthError::Unexpected("login_with_xbox", e.to_string()))?;
        parsed.access_token
    };

    // §5.5
    let profile = {
        let res = http
            .get(MC_PROFILE_URL)
            .bearer_auth(&mc_access_token)
            .send()
            .await?;
        if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err(AuthError::RateLimited);
        }
        if res.status() == reqwest::StatusCode::NOT_FOUND {
            return Err(AuthError::NoProfile(
                "Esta cuenta no tiene un perfil de Minecraft: Java Edition. \
                 O no posee el juego, o es una cuenta de Game Pass que todavía no \
                 ha elegido nombre en el launcher oficial."
                    .into(),
            ));
        }
        let status = res.status();
        let body = res.text().await?;
        if !status.is_success() {
            return Err(AuthError::Unexpected("profile", body));
        }
        let parsed: ProfileResponse = serde_json::from_str(&body)
            .map_err(|e| AuthError::Unexpected("profile", e.to_string()))?;
        parsed
    };

    // §5.6 — best-effort: an empty XUID plays fine on ordinary servers, so a
    // failure here must not sink an otherwise good sign-in.
    let xuid = fetch_xuid(&http, &xbl.token).await.unwrap_or_default();

    Ok(McSession {
        uuid: dash_uuid(&profile.id),
        skin_url: profile.active_skin(),
        username: profile.name,
        access_token: mc_access_token,
        xuid,
        refresh_token,
    })
}

/// Returns `(token, uhs)`. §5.3 — user-specific failures arrive as 401 + XErr.
async fn xsts_authorize(
    http: &reqwest::Client,
    xbl_token: &str,
    relying_party: &str,
) -> Result<(String, String), AuthError> {
    let res = http
        .post(XSTS_URL)
        .json(&serde_json::json!({
            "Properties": { "SandboxId": "RETAIL", "UserTokens": [xbl_token] },
            "RelyingParty": relying_party,
            "TokenType": "JWT",
        }))
        .send()
        .await?;

    let status = res.status();
    let body = res.text().await?;

    if status == reqwest::StatusCode::UNAUTHORIZED {
        let err: XstsError = serde_json::from_str(&body).unwrap_or(XstsError { xerr: None });
        return Err(AuthError::Xbox(describe_xerr(err.xerr)));
    }
    if !status.is_success() {
        return Err(AuthError::Unexpected("xsts", body));
    }

    let parsed: XblResponse =
        serde_json::from_str(&body).map_err(|e| AuthError::Unexpected("xsts", e.to_string()))?;
    let uhs = parsed
        .display_claims
        .xui
        .first()
        .and_then(|c| c.uhs.clone())
        .unwrap_or_default();
    Ok((parsed.token, uhs))
}

/// §5.6 — the Minecraft relying party's claims carry only `uhs`; the XUID lives
/// on the xboxlive.com relying party, which needs its own call.
async fn fetch_xuid(http: &reqwest::Client, xbl_token: &str) -> Result<String, AuthError> {
    let res = http
        .post(XSTS_URL)
        .json(&serde_json::json!({
            "Properties": { "SandboxId": "RETAIL", "UserTokens": [xbl_token] },
            "RelyingParty": RP_XBOXLIVE,
            "TokenType": "JWT",
        }))
        .send()
        .await?;

    if !res.status().is_success() {
        return Ok(String::new());
    }
    let parsed: XblResponse = res.json().await?;
    Ok(parsed
        .display_claims
        .xui
        .first()
        .and_then(|c| c.xid.clone())
        .unwrap_or_default())
}

/// §5.3's table. A raw XErr is useless to a player; these are the five that
/// actually happen.
fn describe_xerr(xerr: Option<u64>) -> String {
    match xerr {
        Some(2148916227) => "Esta cuenta está bloqueada en los servicios de Xbox.".into(),
        Some(2148916233) => {
            "Esta cuenta no tiene perfil de Xbox. Crea uno en xbox.com y vuelve a intentarlo.".into()
        }
        Some(2148916235) => "Los servicios de Xbox no están disponibles en esta región.".into(),
        Some(2148916236) | Some(2148916237) => {
            "Esta cuenta necesita verificación de adulto para usar los servicios de Xbox.".into()
        }
        Some(2148916238) => {
            "Esta cuenta es de un menor y debe añadirse a un grupo Microsoft Family.".into()
        }
        Some(other) => format!("Xbox rechazó la sesión (XErr {other})."),
        None => "Xbox rechazó la sesión.".into(),
    }
}

/// Mojang returns 32-hex with no dashes; everything on our side stores char(36).
fn dash_uuid(raw: &str) -> String {
    if raw.contains('-') || raw.len() != 32 {
        return raw.to_lowercase();
    }
    let h = raw.to_lowercase();
    format!(
        "{}-{}-{}-{}-{}",
        &h[0..8],
        &h[8..12],
        &h[12..16],
        &h[16..20],
        &h[20..32]
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picks_the_active_skin_not_the_first_one() {
        // The profile carries the player's skin HISTORY. Taking [0] is how a
        // player ends up wearing a skin they replaced two years ago.
        let raw = br#"{
            "id": "069a79f444e94726a5befca90e38aaf5",
            "name": "Steve",
            "skins": [
                {"state": "INACTIVE", "url": "https://textures.test/old"},
                {"state": "ACTIVE", "url": "https://textures.test/current"}
            ]
        }"#;
        let profile: ProfileResponse = serde_json::from_slice(raw).unwrap();
        assert_eq!(profile.active_skin(), "https://textures.test/current");
    }

    #[test]
    fn a_profile_with_no_skin_is_still_a_valid_profile() {
        let raw = br#"{"id": "069a79f444e94726a5befca90e38aaf5", "name": "Steve"}"#;
        let profile: ProfileResponse = serde_json::from_slice(raw).unwrap();
        assert_eq!(profile.active_skin(), "");
    }

    #[test]
    fn dashes_a_bare_mojang_uuid() {
        assert_eq!(
            dash_uuid("069a79f444e94726a5befca90e38aaf5"),
            "069a79f4-44e9-4726-a5be-fca90e38aaf5"
        );
    }

    #[test]
    fn leaves_an_already_dashed_uuid_alone() {
        let dashed = "069a79f4-44e9-4726-a5be-fca90e38aaf5";
        assert_eq!(dash_uuid(dashed), dashed);
    }

    #[test]
    fn maps_the_no_xbox_profile_error_to_something_actionable() {
        assert!(describe_xerr(Some(2148916233)).contains("xbox.com"));
    }

    #[test]
    fn falls_back_rather_than_panicking_on_an_unknown_xerr() {
        assert!(describe_xerr(Some(1)).contains("XErr 1"));
        assert!(!describe_xerr(None).is_empty());
    }
}
