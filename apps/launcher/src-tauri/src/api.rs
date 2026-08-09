// The pack registry client (HANDOFF §7). Lives in Rust rather than the renderer
// so the HTTP sidesteps CORS entirely — this is not a browser — and so the
// launcher session never has to exist in JavaScript.
//
// Identity is a BOFFMEDIA account, obtained through a device-authorization
// flow: the launcher shows a short code, the player approves it on the website
// where they are already signed in, and we receive a 30-day session. It used to
// be a Minecraft identity proved through Mojang's `hasJoined` handshake, which
// meant a paid Minecraft account was required to open an emulator pack.
//
// Three tokens, never confused:
//   * the Minecraft access token  — auth::AuthState, used only against Mojang,
//     and only when a MINECRAFT pack is installed or launched.
//   * the LAUNCHER session JWT    — this module, used only against our API.
//   * the Microsoft refresh token — auth::store, never leaves the credential store.

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::auth::{store, AuthFailure};

/// The game modules THIS binary actually implements — install, launch, the lot.
/// Adding a module here is what makes the server willing to hand us its packs,
/// so the list must never run ahead of the code: a pack we cannot parse is a
/// 409 the player reads as "update your launcher", which is the correct answer
/// only when it is true.
const GAME_MODULES: &[&str] = &["minecraft", "emulator"];

/// Sent on every pack list / manifest call. Derived from GAME_MODULES rather
/// than hand-written, so a new module cannot ship with a stale header.
fn game_types_header() -> String {
    GAME_MODULES.join(",")
}

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

/// The launcher session, cached in memory and mirrored into the OS credential
/// store. Unlike the old pack session — re-derived from a live Minecraft
/// session on demand — this one costs the player a browser round-trip to mint,
/// so losing it on every restart would be intolerable.
pub struct ApiState {
    http: reqwest::Client,
    token: Mutex<Option<String>>,
    /// The device-authorization request currently awaiting approval.
    pending: Mutex<Option<String>>,
}

impl Default for ApiState {
    fn default() -> Self {
        Self {
            http: reqwest::Client::builder()
                .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
                .build()
                .unwrap_or_default(),
            token: Mutex::new(None),
            pending: Mutex::new(None),
        }
    }
}

impl ApiState {
    /// Called on sign-out: the next request must not reuse the previous
    /// player's entitlements, and the stored credential must not outlive them.
    pub async fn forget_session(&self) {
        *self.token.lock().await = None;
        let _ = store::clear_launcher_session();
    }

    /// The current launcher session JWT, from memory or the credential store.
    /// Used by randomizer and other authenticated endpoints.
    pub async fn current_token(&self) -> Result<String, ApiError> {
        current_token(self).await
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

/// What the player is shown while they approve in a browser.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceAuthorization {
    #[serde(skip_serializing)]
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval_seconds: u64,
}

/// The signed-in Boffmedia account. `mc_uuid` is present only when the account
/// has linked Minecraft, and nothing outside the Minecraft module may require it.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoffAccount {
    pub id: i64,
    pub username: String,
    #[serde(default)]
    pub mc_uuid: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DevicePoll {
    status: String,
    #[serde(default)]
    token: Option<String>,
    #[serde(default)]
    user: Option<BoffAccount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherVersion {
    pub id: String,
    pub name: String,
    /// Null for non-minecraft packs — the API sends null and the renderer's
    /// `PackVersionSummary.minecraft` is nullable to match.
    #[serde(default)]
    pub minecraft: Option<String>,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub file_count: u32,
    /// Present for emulator packs (`"mgba"`/`"melonds"`) so the library sidebar
    /// can map the pack to its system without a manifest fetch.
    #[serde(default)]
    pub emulator_kind: Option<String>,
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
    /// The pack's game type, resolved by the API (NULL column → "minecraft").
    /// WITHOUT this field serde silently drops the API's `gameType`, and every
    /// pack — emulator included — reads back as minecraft in the library. The
    /// renderer's `PackSummary.gameType` is populated from here. `#[serde(default)]`
    /// keeps an old API's response (no gameType) deserializing as minecraft.
    #[serde(default)]
    pub game_type: Option<String>,
    pub name: String,
    pub summary: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub icon_url: Option<String>,
    #[serde(default)]
    pub gallery: Vec<LauncherGalleryImage>,
    pub access_kind: String,
    #[serde(default)]
    pub server: Option<LauncherServer>,
    pub latest_version: Option<LauncherVersion>,
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

/// Step 1 — ask for a code and show it to the player.
#[tauri::command]
pub async fn boff_device_start(
    api: tauri::State<'_, ApiState>,
) -> Result<DeviceAuthorization, ApiError> {
    let label = format!(
        "Boff Launcher {} · {}",
        env!("CARGO_PKG_VERSION"),
        std::env::consts::OS
    );

    let res = api
        .http
        .post(format!("{}/packs/launcher/auth/device", base_url()))
        .json(&serde_json::json!({ "clientLabel": label }))
        .send()
        .await?;

    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "El servidor de packs no está disponible.").await,
        ));
    }

    let body: Envelope<DeviceAuthorization> = res.json().await?;
    *api.pending.lock().await = Some(body.data.device_code.clone());
    Ok(body.data)
}

/// Step 2 — one poll. The renderer sets the cadence, so a ten-minute wait never
/// parks a Tauri worker on a sleeping future.
#[tauri::command]
pub async fn boff_device_poll(
    api: tauri::State<'_, ApiState>,
) -> Result<DevicePollView, ApiError> {
    let device_code = api.pending.lock().await.clone().ok_or_else(|| {
        ApiError::Message("No hay ninguna autorización en curso.".into())
    })?;

    let res = api
        .http
        .post(format!("{}/packs/launcher/auth/device/poll", base_url()))
        .json(&serde_json::json!({ "deviceCode": device_code }))
        .send()
        .await?;

    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "No se pudo comprobar la autorización.").await,
        ));
    }

    let body: Envelope<DevicePoll> = res.json().await?;
    if body.data.status == "approved" {
        let token = body.data.token.clone().ok_or_else(|| {
            ApiError::Message("El servidor aprobó la sesión sin devolverla.".into())
        })?;
        // Store first: a session we hold but never persisted would silently
        // vanish on restart and read as "it logged me out again".
        store::save_launcher_session(&token)
            .map_err(|e| ApiError::Message(e.to_string()))?;
        *api.token.lock().await = Some(token);
        *api.pending.lock().await = None;
    } else if body.data.status != "pending" {
        *api.pending.lock().await = None;
    }

    Ok(DevicePollView {
        status: body.data.status,
        user: body.data.user,
    })
}

/// The stored session, if any. Called on start so a returning player never sees
/// the sign-in screen.
#[tauri::command]
pub async fn boff_session_restore(
    api: tauri::State<'_, ApiState>,
) -> Result<Option<BoffAccount>, ApiError> {
    let token = match store::load_launcher_session() {
        Ok(Some(token)) => token,
        // A locked or broken keychain must not look like a first run, or the
        // player re-authorises on every launch and nobody ever notices why.
        Ok(None) => return Ok(None),
        Err(e) => return Err(ApiError::Message(e.to_string())),
    };
    *api.token.lock().await = Some(token);

    // `/me` doubles as the liveness check: a 30-day session outlives plenty of
    // reasons to be revoked, and finding out at sign-in beats finding out
    // halfway through an install.
    match boff_me(&api).await {
        Ok(account) => Ok(Some(account)),
        Err(ApiError::NeedsSignin(_)) => {
            api.forget_session().await;
            Ok(None)
        }
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn boff_sign_out(api: tauri::State<'_, ApiState>) -> Result<(), ApiError> {
    api.forget_session().await;
    Ok(())
}

async fn boff_me(api: &ApiState) -> Result<BoffAccount, ApiError> {
    let res = authed(api, |http, base| {
        http.get(format!("{base}/packs/launcher/me"))
    })
    .await?;

    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err(ApiError::NeedsSignin("Tu sesión ha caducado.".into()));
    }
    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "No se pudo leer tu cuenta.").await,
        ));
    }
    let body: Envelope<BoffAccount> = res.json().await?;
    Ok(body.data)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DevicePollView {
    pub status: String,
    pub user: Option<BoffAccount>,
}

async fn current_token(api: &ApiState) -> Result<String, ApiError> {
    if let Some(token) = api.token.lock().await.clone() {
        return Ok(token);
    }

    match store::load_launcher_session() {
        Ok(Some(token)) => {
            *api.token.lock().await = Some(token.clone());
            Ok(token)
        }
        Ok(None) => Err(ApiError::NeedsSignin(
            "Autoriza este launcher con tu cuenta de Boffmedia para ver tus packs.".into(),
        )),
        Err(e) => Err(ApiError::Message(e.to_string())),
    }
}

/// Send an authenticated request. There is nothing to re-mint on a 401 any
/// more: a launcher session is approved by a human in a browser, so an expired
/// or revoked one has to be re-approved. Dropping it here is what makes the
/// next call surface `NeedsSignin` instead of looping on 401s.
async fn authed(
    api: &ApiState,
    build: impl Fn(&reqwest::Client, &str) -> reqwest::RequestBuilder,
) -> Result<reqwest::Response, ApiError> {
    let token = current_token(api).await?;
    let res = build(&api.http, &base_url())
        .bearer_auth(&token)
        .send()
        .await?;

    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        api.forget_session().await;
    }
    Ok(res)
}

// ── Commands ───────────────────────────────────────────────────────────────

/// The packs this UUID may see. Access filtering is the server's job — a pack
/// the player cannot install must never reach this list in the first place.
#[tauri::command]
pub async fn packs_list(
    api: tauri::State<'_, ApiState>,
) -> Result<Vec<LauncherPack>, ApiError> {
    let res = authed(&api, |http, base| {
        http.get(format!("{base}/packs/launcher/packs"))
            .header("X-Boff-Game-Types", game_types_header())
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
) -> Result<serde_json::Value, ApiError> {
    let query: Vec<(String, String)> = password
        .filter(|p| !p.is_empty())
        .map(|p| vec![("password".to_string(), p)])
        .unwrap_or_default();

    let res = authed(&api, |http, base| {
        http.get(format!("{base}/packs/launcher/packs/{pack_id}/manifest"))
            .header("X-Boff-Game-Types", game_types_header())
            .query(&query)
    })
    .await?;

    let status = res.status();
    if !status.is_success() {
        let message = error_message(res, "No se pudo obtener el manifiesto.").await;
        return Err(if status == reqwest::StatusCode::FORBIDDEN {
            ApiError::Denied(message)
        } else if status == reqwest::StatusCode::CONFLICT {
            ApiError::Message(format!(
                "Este pack necesita una versión más reciente del launcher. Por favor, actualiza el launcher desde el sitio oficial."
            ))
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

    // Same precedent as the manifest call: a password gates the whole pack, so
    // it has to ride on every download too, not just the first request.
    let query: Vec<(String, String)> = password
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .map(|p| vec![("password".to_string(), p.to_string())])
        .unwrap_or_default();

    let route = file.route();
    let res = authed(&api, |http, base| {
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
) -> Result<String, ApiError> {
    let payload = serde_json::json!({ "code": code });
    let res = authed(&api, |http, base| {
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
    use std::sync::Mutex;

    // BOFF_API_URL is process-global; two tests mutating it in parallel race and
    // one reads the other's value. Serialise every env-touching test on this lock.
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    #[test]
    fn base_url_has_no_trailing_slash() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|p| p.into_inner());
        // Every call site interpolates `{base}/packs/...`; a trailing slash
        // would produce `//packs` and a 404 that looks like a routing bug.
        std::env::set_var("BOFF_API_URL", "https://example.test/");
        assert_eq!(base_url(), "https://example.test");
        std::env::remove_var("BOFF_API_URL");
    }

    #[test]
    fn blank_env_falls_back_to_the_built_in_url() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|p| p.into_inner());
        std::env::set_var("BOFF_API_URL", "   ");
        assert!(base_url().starts_with("https://"));
        std::env::remove_var("BOFF_API_URL");
    }

    #[test]
    fn launcher_pack_deserializes_game_type_and_emulator_kind() {
        // Regression: without `game_type` on LauncherPack, serde silently drops
        // the API's `gameType` and every pack reads back as minecraft — an
        // emulator pack then shows in the library as "Minecraft Vanilla".
        let json = r#"{
            "id":"pk","slug":"esmeralda","name":"Esmeralda","summary":null,
            "iconUrl":null,"accessKind":"public","gameType":"emulator",
            "latestVersion":{"id":"v1","name":"1.0","minecraft":null,"loader":null,
              "loaderVersion":null,"fileCount":1,"emulatorKind":"mgba",
              "createdAt":"2026-08-07T00:00:00Z"}
        }"#;
        let pack: LauncherPack = serde_json::from_str(json).unwrap();
        assert_eq!(pack.game_type.as_deref(), Some("emulator"));
        let version = pack.latest_version.unwrap();
        assert_eq!(version.minecraft, None);
        assert_eq!(version.emulator_kind.as_deref(), Some("mgba"));
    }

    #[test]
    fn a_minecraft_pack_without_game_type_still_deserializes() {
        // An older API (or a plain minecraft pack) sends no gameType — it must
        // deserialize (as None → resolved to minecraft downstream), never fail.
        let json = r#"{
            "id":"pk","slug":"smp","name":"SMP","summary":null,"iconUrl":null,
            "accessKind":"public",
            "latestVersion":{"id":"v1","name":"1.0","minecraft":"1.21.4","loader":null,
              "loaderVersion":null,"fileCount":1,"createdAt":"2026-08-07T00:00:00Z"}
        }"#;
        let pack: LauncherPack = serde_json::from_str(json).unwrap();
        assert_eq!(pack.game_type, None);
        assert_eq!(pack.latest_version.unwrap().minecraft.as_deref(), Some("1.21.4"));
    }

    #[test]
    fn api_errors_carry_the_signin_hint() {
        let failure = AuthFailure::from(ApiError::NeedsSignin("x".into()));
        assert!(failure.needs_signin);
        let failure = AuthFailure::from(ApiError::Denied("x".into()));
        assert!(!failure.needs_signin, "denial is not fixed by signing in again");
    }
}
