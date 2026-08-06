// The pack registry client (HANDOFF §7). Lives in Rust rather than the renderer
// for one reason: minting a pack session needs the MINECRAFT access token to
// complete Mojang's `join` handshake, and that token never leaves `auth`. Doing
// the HTTP here also sidesteps CORS entirely — this is not a browser.
//
// Two tokens, never confused:
//   * the Minecraft access token — auth::AuthState, used only against Mojang.
//   * the LAUNCHER session JWT   — this module, used only against our API.

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::auth::{AuthState, AuthFailure};

const JOIN_URL: &str = "https://sessionserver.mojang.com/session/minecraft/join";

/// Where the pack registry lives. A runtime env var wins so a QA build can be
/// pointed at a staging API without a rebuild; the compile-time value is what
/// packaged builds carry.
pub fn base_url() -> String {
    if let Ok(url) = std::env::var("BOFF_API_URL") {
        if !url.trim().is_empty() {
            return url.trim_end_matches('/').to_string();
        }
    }
    option_env!("BOFF_API_URL")
        .unwrap_or("https://api.boffmedia.es")
        .trim_end_matches('/')
        .to_string()
}

/// The launcher session. Held in memory only: it is derived from the Minecraft
/// session in a couple of round-trips, so persisting it would buy nothing and
/// widen the blast radius of a stolen profile directory.
pub struct ApiState {
    http: reqwest::Client,
    token: Mutex<Option<String>>,
    /// Held across the whole mint, unlike `token` which is only held long
    /// enough to read or write it. See `current_token`.
    minting: Mutex<()>,
}

impl Default for ApiState {
    fn default() -> Self {
        Self {
            http: reqwest::Client::builder()
                .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
                .build()
                .unwrap_or_default(),
            token: Mutex::new(None),
            minting: Mutex::new(()),
        }
    }
}

impl ApiState {
    /// Called on sign-out: the next request must not reuse the previous
    /// player's entitlements.
    pub async fn forget_session(&self) {
        *self.token.lock().await = None;
    }
}

// ── Wire types ─────────────────────────────────────────────────────────────
// Every successful response is wrapped by the API's global ResponseInterceptor
// as `{ success, statusCode, data }`. Errors are NOT wrapped — the exception
// filter writes its own body — so the two are decoded separately.

#[derive(Deserialize)]
struct Envelope<T> {
    data: T,
}

#[derive(Deserialize)]
struct ApiErrorBody {
    #[serde(default)]
    #[serde(rename = "userMessage")]
    user_message: Option<String>,
    #[serde(default)]
    message: Option<serde_json::Value>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct JoinChallenge {
    server_id: String,
}

#[derive(Deserialize)]
struct LauncherSession {
    token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherVersion {
    pub id: String,
    pub name: String,
    /// Null for a non-Minecraft version.
    #[serde(default)]
    pub minecraft: Option<String>,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub file_count: u32,
    pub created_at: String,
}

/** A promotional gallery image, mirrored from the registry's pack listing. */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherGalleryImage {
    pub url: String,
    #[serde(default)]
    pub alt: Option<String>,
}

/** The Quick Play target, mirrored from the registry's pack listing. Present
 *  only for "server packs". Both fields are optional and defaulted: `port` is
 *  absent for a bare SRV host, and a malformed/empty `{}` (legacy data) must
 *  deserialize to a hostless server rather than failing the WHOLE packs_list —
 *  one bad row used to blank the entire managed library. A hostless server is
 *  still a server pack; the renderer shows it as "unavailable". */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherServer {
    #[serde(default)]
    pub host: Option<String>,
    #[serde(default)]
    pub port: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherPack {
    pub id: String,
    pub slug: String,
    pub name: String,
    pub summary: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub icon_url: Option<String>,
    #[serde(default)]
    pub gallery: Vec<LauncherGalleryImage>,
    pub access_kind: String,
    /// Defaulted so an older API (which never sends it) lists as Minecraft.
    #[serde(default = "default_game_type")]
    pub game_type: String,
    #[serde(default)]
    pub server: Option<LauncherServer>,
    pub latest_version: Option<LauncherVersion>,
}

fn default_game_type() -> String {
    "minecraft".to_string()
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedeemResult {
    pack_id: String,
}

// ── Errors ─────────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum ApiError {
    /// No Minecraft session, or the server rejected the one we proved.
    NeedsSignin(String),
    /// Authenticated fine; this player simply is not entitled.
    Denied(String),
    Message(String),
}

impl From<reqwest::Error> for ApiError {
    fn from(err: reqwest::Error) -> Self {
        // Network failures are the common case here (the player is offline, or
        // the API is down) and must never read as "you were kicked out".
        ApiError::Message(format!("No se pudo contactar con el servidor: {err}"))
    }
}

impl From<ApiError> for AuthFailure {
    fn from(err: ApiError) -> Self {
        match err {
            ApiError::NeedsSignin(message) => AuthFailure {
                message,
                needs_signin: true,
            },
            ApiError::Denied(message) | ApiError::Message(message) => AuthFailure {
                message,
                needs_signin: false,
            },
        }
    }
}

impl serde::Serialize for ApiError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        AuthFailure::from(match self {
            ApiError::NeedsSignin(m) => ApiError::NeedsSignin(m.clone()),
            ApiError::Denied(m) => ApiError::Denied(m.clone()),
            ApiError::Message(m) => ApiError::Message(m.clone()),
        })
        .serialize(s)
    }
}

/// Pull the most human sentence out of an error body. `userMessage` is the only
/// field the API marks as safe to show verbatim; `message` is developer text
/// and is used solely as a last resort so a failure is never a blank dialog.
async fn error_message(res: reqwest::Response, fallback: &str) -> String {
    let Ok(body) = res.json::<ApiErrorBody>().await else {
        return fallback.to_string();
    };
    if let Some(text) = body.user_message {
        return text;
    }
    match body.message {
        Some(serde_json::Value::String(text)) => text,
        // class-validator returns an array of strings for a 400.
        Some(serde_json::Value::Array(items)) => items
            .into_iter()
            .filter_map(|v| v.as_str().map(str::to_string))
            .next()
            .unwrap_or_else(|| fallback.to_string()),
        _ => fallback.to_string(),
    }
}

// ── Session ────────────────────────────────────────────────────────────────

/// §7.2 in three hops: ask our API for a serverId, prove it to Mojang with the
/// Minecraft access token, then exchange it for a launcher JWT. Our API never
/// sees a Microsoft or Minecraft token — only a username and the serverId it
/// issued itself.
async fn mint_session(api: &ApiState, auth: &AuthState) -> Result<String, ApiError> {
    let session = auth.session().await.ok_or_else(|| {
        ApiError::NeedsSignin("Inicia sesión con tu cuenta de Minecraft para ver tus packs.".into())
    })?;

    let base = base_url();

    let res = api
        .http
        .post(format!("{base}/packs/launcher/auth/challenge"))
        .send()
        .await?;
    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "El servidor de packs no está disponible.").await,
        ));
    }
    let challenge: Envelope<JoinChallenge> = res.json().await?;
    let server_id = challenge.data.server_id;

    // Mojang wants the profile id UNDASHED here, unlike everywhere else in this
    // launcher — auth::msa normalises to dashed on arrival because that is what
    // our own char(36) columns hold.
    let join = api
        .http
        .post(JOIN_URL)
        .json(&serde_json::json!({
            "accessToken": session.access_token,
            "selectedProfile": session.uuid.replace('-', ""),
            "serverId": server_id,
        }))
        .send()
        .await?;
    if !join.status().is_success() {
        // 403 here means the Minecraft token is stale or the account is not
        // entitled to the game; either way signing in again is the fix.
        return Err(ApiError::NeedsSignin(
            "Mojang rechazó tu sesión. Vuelve a iniciar sesión.".into(),
        ));
    }

    let res = api
        .http
        .post(format!("{base}/packs/launcher/auth/verify"))
        .json(&serde_json::json!({
            "username": session.username,
            "serverId": server_id,
        }))
        .send()
        .await?;
    if !res.status().is_success() {
        return Err(ApiError::NeedsSignin(
            error_message(res, "No se pudo verificar tu sesión con Boffmedia.").await,
        ));
    }
    let verified: Envelope<LauncherSession> = res.json().await?;

    *api.token.lock().await = Some(verified.data.token.clone());
    Ok(verified.data.token)
}

async fn current_token(api: &ApiState, auth: &AuthState) -> Result<String, ApiError> {
    if let Some(token) = api.token.lock().await.clone() {
        return Ok(token);
    }

    // Minting is SERIALISED. The handshake in `mint_session` is stateful on
    // Mojang's side: a serverId is proven by a `hasJoined` call against the
    // player's profile, and a second concurrent join overwrites the first, so
    // whichever challenge our API then tries to verify has already been
    // invalidated. Two callers arriving here at once — the pack list and
    // anything else authenticated — both saw `None` above and both minted, and
    // one of them failed with "Mojang rechazó tu sesión" or "no se pudo
    // verificar tu sesión". Intermittent, and entirely a race.
    let _minting = api.minting.lock().await;

    // Whoever we queued behind may have already minted one for us.
    if let Some(token) = api.token.lock().await.clone() {
        return Ok(token);
    }
    mint_session(api, auth).await
}

/// Send an authenticated request, re-minting the session ONCE on a 401. The
/// launcher session is short-lived and the app stays open for hours, so an
/// expired token is the normal case, not an error worth showing anyone.
async fn authed(
    api: &ApiState,
    auth: &AuthState,
    build: impl Fn(&reqwest::Client, &str) -> reqwest::RequestBuilder,
) -> Result<reqwest::Response, ApiError> {
    let token = current_token(api, auth).await?;
    let res = build(&api.http, &base_url())
        .bearer_auth(&token)
        .send()
        .await?;

    if res.status() != reqwest::StatusCode::UNAUTHORIZED {
        return Ok(res);
    }

    // Through `current_token`, not `mint_session` directly: the expiry that
    // produced this 401 hits every in-flight request at once, so this is
    // precisely where several callers would otherwise mint in parallel.
    *api.token.lock().await = None;
    let token = current_token(api, auth).await?;
    Ok(build(&api.http, &base_url())
        .bearer_auth(&token)
        .send()
        .await?)
}

// ── Commands ───────────────────────────────────────────────────────────────

/// The packs this UUID may see. Access filtering is the server's job — a pack
/// the player cannot install must never reach this list in the first place.
#[tauri::command]
pub async fn packs_list(
    api: tauri::State<'_, ApiState>,
    auth: tauri::State<'_, AuthState>,
) -> Result<Vec<LauncherPack>, ApiError> {
    let res = authed(&api, &auth, |http, base| {
        http.get(format!("{base}/packs/launcher/packs"))
            // What this build can install. The server filters the listing by it,
            // so an old launcher (which never sends the header) keeps seeing
            // only Minecraft packs — the ones it knows how to parse.
            .header("X-Boff-Game-Types", "minecraft,emulator")
    })
    .await?;

    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "No se pudo cargar la lista de packs.").await,
        ));
    }
    let body: Envelope<Vec<LauncherPack>> = res.json().await?;
    Ok(body.data)
}

/// The manifest to install from. Returned to the renderer as raw JSON on
/// purpose: it is validated here with the generated types + the hand-mirrored
/// refinements, and the installer (§6) will read it from the same bytes.
#[tauri::command]
pub async fn pack_manifest(
    pack_id: String,
    password: Option<String>,
    api: tauri::State<'_, ApiState>,
    auth: tauri::State<'_, AuthState>,
) -> Result<serde_json::Value, ApiError> {
    let query: Vec<(String, String)> = password
        .filter(|p| !p.is_empty())
        .map(|p| vec![("password".to_string(), p)])
        .unwrap_or_default();

    let res = authed(&api, &auth, |http, base| {
        http.get(format!("{base}/packs/launcher/packs/{pack_id}/manifest"))
            .query(&query)
    })
    .await?;

    let status = res.status();
    if !status.is_success() {
        let message = error_message(res, "No se pudo obtener el manifiesto.").await;
        return Err(if status == reqwest::StatusCode::FORBIDDEN {
            ApiError::Denied(message)
        } else {
            ApiError::Message(message)
        });
    }

    let body: Envelope<serde_json::Value> = res.json().await?;

    // Validate before it reaches the renderer or the installer: a manifest that
    // fails here is a server bug, and failing at the boundary is the only place
    // it is debuggable.
    let raw = serde_json::to_string(&body.data)
        .map_err(|e| ApiError::Message(format!("Manifiesto ilegible: {e}")))?;
    crate::pack::parse_manifest(&raw)
        .map_err(|e| ApiError::Message(format!("El manifiesto del pack no es válido: {e}")))?;

    Ok(body.data)
}

// ── Payload downloads (§4.5, §7.2) ─────────────────────────────────────────

/// Which of the two streaming routes to hit. Kept as an enum rather than a raw
/// path so the 404 case can say something true: the two routes fail for very
/// different reasons and the player can only act on one of them.
#[derive(Debug, Clone)]
pub enum PackFile {
    /// §4.5 — proxied because edge.forgecdn.net 401s without `x-api-key`, and a
    /// key shipped in the launcher is a key that gets extracted and revoked.
    Curseforge { project_id: i64, file_id: i64 },
    /// §7.2 — an authenticated stream, NOT a presigned URL. The blobs live on
    /// the API's disk (PACK_BLOB_DIR); there is no object storage, so there is
    /// nothing to sign and no indirection to build.
    Override { sha512: String },
}

impl PackFile {
    fn route(&self) -> String {
        match self {
            PackFile::Curseforge {
                project_id,
                file_id,
            } => format!("curseforge/{project_id}/{file_id}"),
            PackFile::Override { sha512 } => format!("override/{sha512}"),
        }
    }
}

/// Fetch one pack payload file, authenticated with the launcher session.
///
/// Returns the RAW response for streaming. These routes answer with bytes —
/// `StreamableFile` passes through the global ResponseInterceptor untouched —
/// so there is no `{ success, data }` envelope, and trying to decode one on
/// success would consume the body and fail on the first jar.
///
/// Takes an `AppHandle` rather than `tauri::State` so a download task can own
/// it: `authed` re-mints an expired session on a 401, and a multi-minute
/// install is long enough for the launcher JWT to expire mid-batch.
pub async fn fetch_pack_file(
    app: &tauri::AppHandle,
    pack_id: &str,
    password: Option<&str>,
    file: &PackFile,
) -> Result<reqwest::Response, ApiError> {
    use tauri::Manager;

    let api = app.state::<ApiState>();
    let auth = app.state::<AuthState>();

    // Same precedent as the manifest call: a password gates the whole pack, so
    // it has to ride on every download too, not just the first request.
    let query: Vec<(String, String)> = password
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .map(|p| vec![("password".to_string(), p.to_string())])
        .unwrap_or_default();

    let route = file.route();
    let res = authed(&api, &auth, |http, base| {
        http.get(format!("{base}/packs/launcher/packs/{pack_id}/files/{route}"))
            .query(&query)
    })
    .await?;

    let status = res.status();
    if status.is_success() {
        return Ok(res);
    }

    Err(match status {
        // The 404 body carries an actionable `userMessage` — for CurseForge it
        // is the `allowModDistribution: false` case, where the ONLY fix is the
        // player downloading the file by hand. Surfacing a generic "not found"
        // instead would strand them with no idea what to do.
        reqwest::StatusCode::NOT_FOUND => ApiError::Message(
            error_message(res, &missing_fallback(file)).await,
        ),
        // Entitlement revoked between listing and download — §7.4's whole
        // point. A hard failure, but not one that signing in again fixes.
        reqwest::StatusCode::FORBIDDEN => ApiError::Denied(
            error_message(res, "Ya no tienes acceso a este pack.").await,
        ),
        // Our CurseForge key is missing or was rejected: a server-side problem
        // the player can do nothing about except retry later.
        reqwest::StatusCode::SERVICE_UNAVAILABLE => ApiError::Message(
            error_message(
                res,
                "El servidor no puede descargar de CurseForge ahora mismo. Inténtalo más tarde.",
            )
            .await,
        ),
        reqwest::StatusCode::BAD_GATEWAY => ApiError::Message(
            error_message(res, "CurseForge no responde. Inténtalo más tarde.").await,
        ),
        other => ApiError::Message(
            error_message(res, &format!("La descarga falló ({other})."))
                .await,
        ),
    })
}

fn missing_fallback(file: &PackFile) -> String {
    match file {
        PackFile::Curseforge { .. } => {
            "El servidor no encuentra este archivo de CurseForge para esta versión del pack."
                .to_string()
        }
        // Distinguishable on purpose: this is overwhelmingly "nobody ran the
        // admin blob upload for this version yet", not a network fault.
        PackFile::Override { sha512 } => format!(
            "El servidor no tiene el archivo de configuración {}… de este pack. Falta subirlo.",
            &sha512[..8.min(sha512.len())]
        ),
    }
}

/// Redeem an invite code (§7.3). Returns the pack it unlocked so the UI can
/// jump straight to it.
#[tauri::command]
pub async fn invite_redeem(
    code: String,
    api: tauri::State<'_, ApiState>,
    auth: tauri::State<'_, AuthState>,
) -> Result<String, ApiError> {
    let payload = serde_json::json!({ "code": code });
    let res = authed(&api, &auth, |http, base| {
        http.post(format!("{base}/packs/launcher/invites/redeem"))
            .json(&payload)
    })
    .await?;

    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "No se pudo canjear el código.").await,
        ));
    }
    let body: Envelope<RedeemResult> = res.json().await?;
    Ok(body.data.pack_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    // ONE test, deliberately: both cases mutate the process-global
    // BOFF_API_URL, and cargo runs tests in parallel threads that share it —
    // as two tests they race each other and fail flakily depending on
    // scheduling. Sequential within a single test, the mutation is safe.
    #[test]
    fn base_url_env_override_trims_and_blank_falls_back() {
        // Every call site interpolates `{base}/packs/...`; a trailing slash
        // would produce `//packs` and a 404 that looks like a routing bug.
        std::env::set_var("BOFF_API_URL", "https://example.test/");
        assert_eq!(base_url(), "https://example.test");

        std::env::set_var("BOFF_API_URL", "   ");
        assert!(base_url().starts_with("https://"));
        std::env::remove_var("BOFF_API_URL");
    }

    #[test]
    fn api_errors_carry_the_signin_hint() {
        let failure = AuthFailure::from(ApiError::NeedsSignin("x".into()));
        assert!(failure.needs_signin);
        let failure = AuthFailure::from(ApiError::Denied("x".into()));
        assert!(!failure.needs_signin, "denial is not fixed by signing in again");
    }
}
