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

/// Sent on every pack list / manifest call: the game modules THIS binary
/// actually implements, so a pack we cannot parse never reaches the library.
///
/// Structurally tied to the real code rather than hand-written: the tokens come
/// from `GameType::module_header`, a match that the compiler forces to cover
/// every variant. Adding a `GameType` (with its `resolve::PlannedGame` arm) will
/// not compile until its header membership is decided — the header can no longer
/// go stale behind a new module.
fn game_types_header() -> String {
    crate::install::instance::GameType::ALL
        .iter()
        .map(|g| g.module_header())
        .collect::<Vec<_>>()
        .join(",")
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
    /// Held for the WHOLE body of every session-mutating command (switch,
    /// sign-out, restore, device poll). Without it a switch racing a background
    /// add-account poll leaves roster.active last-write-wins and the wrong
    /// account dispatched to the renderer.
    session_op: Mutex<()>,
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
            session_op: Mutex::new(()),
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

/// A row in the Boffmedia account switcher. `active` flags the one whose token
/// `authed()` is currently sending; the rest are accounts the launcher knows and
/// can switch to without a fresh browser round-trip.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoffAccountEntry {
    pub id: i64,
    pub username: String,
    #[serde(default)]
    pub mc_uuid: Option<String>,
    #[serde(default)]
    pub active: bool,
}

// ── Boffmedia account roster ────────────────────────────────────────────────
//
// The mirror of the Minecraft roster (auth/accounts.rs): which Boffmedia
// accounts this launcher knows and which one is active. The SECRETS — the 30-day
// session JWTs — live in the OS credential store, one entry per account id, plus
// the legacy key mirroring the active account's token (store.rs). This file is
// just the enumerable list, so the switcher can render offline. It and the
// credential store can disagree (a cleared keychain), so a switch treats a
// missing token as "signed out" and prunes the row.

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BoffRosterEntry {
    id: i64,
    username: String,
    #[serde(default)]
    mc_uuid: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BoffRoster {
    #[serde(default)]
    active: Option<i64>,
    #[serde(default)]
    accounts: Vec<BoffRosterEntry>,
}

fn boff_roster_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    Ok(crate::datadir::data_root(app)?.join("boff_accounts.json"))
}

/// Best-effort, exactly like the Minecraft roster: an unreadable list reads as
/// "no accounts", which lands on the sign-in screen rather than failing boot.
fn load_boff_roster(app: &tauri::AppHandle) -> BoffRoster {
    let Ok(path) = boff_roster_path(app) else {
        return BoffRoster::default();
    };
    let Ok(raw) = std::fs::read(&path) else {
        return BoffRoster::default();
    };
    serde_json::from_slice(&raw).unwrap_or_default()
}

fn save_boff_roster(app: &tauri::AppHandle, roster: &BoffRoster) -> Result<(), String> {
    let path = boff_roster_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let raw = serde_json::to_vec_pretty(roster).map_err(|e| e.to_string())?;
    // tmp + rename: a crash mid-write must not truncate the roster to empty and
    // hide every account behind the sign-in screen.
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, raw).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

/// Add or update an account and make it active. Matches on id, so re-signing an
/// account already present updates its name in place instead of listing it twice.
fn upsert_active_boff(roster: &mut BoffRoster, account: &BoffAccount) {
    match roster.accounts.iter_mut().find(|a| a.id == account.id) {
        Some(existing) => {
            existing.username = account.username.clone();
            existing.mc_uuid = account.mc_uuid.clone();
        }
        None => roster.accounts.push(BoffRosterEntry {
            id: account.id,
            username: account.username.clone(),
            mc_uuid: account.mc_uuid.clone(),
        }),
    }
    roster.active = Some(account.id);
}

/// Drop an account. Returns the id that should become active — the first one
/// left, or None when that was the last.
fn remove_boff(roster: &mut BoffRoster, id: i64) -> Option<i64> {
    roster.accounts.retain(|a| a.id != id);
    if roster.active == Some(id) {
        roster.active = roster.accounts.first().map(|a| a.id);
    }
    roster.active
}

/// Make `id`'s token the one `authed()` sends: cache it and mirror it into the
/// legacy key (which `current_token` reads with no AppHandle). Returns false when
/// that account has no stored token, so the caller can prune the dead row.
async fn activate_boff(api: &ApiState, id: i64) -> Result<bool, ApiError> {
    let Some(token) =
        store::load_launcher_session_for(id).map_err(|e| ApiError::Store(e.to_string()))?
    else {
        return Ok(false);
    };
    store::save_launcher_session(&token).map_err(|e| ApiError::Store(e.to_string()))?;
    *api.token.lock().await = Some(token);
    Ok(true)
}

/// The id of the active Boffmedia account, straight from the on-disk roster.
/// Used by the MSA roster (auth/accounts.rs) to scope Minecraft identities to
/// the Boffmedia account that linked them.
pub fn active_boff_id(app: &tauri::AppHandle) -> Option<i64> {
    load_boff_roster(app).active
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
    /// The OS credential store itself failed (locked keychain, broken Secret
    /// Service). Kept apart from `Message` because the renderer must not offer
    /// "play offline" for it — the stored token cannot be read either.
    Store(String),
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
            ApiError::Denied(message) | ApiError::Message(message) | ApiError::Store(message) => {
                AuthFailure {
                    message,
                    needs_signin: false,
                }
            }
        }
    }
}

impl serde::Serialize for ApiError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        #[derive(Serialize)]
        struct Wire<'a> {
            message: &'a str,
            needs_signin: bool,
            #[serde(skip_serializing_if = "Option::is_none")]
            code: Option<&'a str>,
        }
        let (message, needs_signin, code) = match self {
            ApiError::NeedsSignin(m) => (m.as_str(), true, None),
            ApiError::Denied(m) => (m.as_str(), false, None),
            ApiError::Message(m) => (m.as_str(), false, None),
            ApiError::Store(m) => (m.as_str(), false, Some("store_error")),
        };
        Wire {
            message,
            needs_signin,
            code,
        }
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
    app: tauri::AppHandle,
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
    let mut user = body.data.user.clone();
    if body.data.status == "approved" {
        // Session-mutating from here on: serialise against switch/sign-out.
        let _op = api.session_op.lock().await;

        let token = body.data.token.clone().ok_or_else(|| {
            ApiError::Message("El servidor aprobó la sesión sin devolverla.".into())
        })?;

        // Which account this token belongs to — the poll usually says, but fall
        // back to /me so we always have an id to key the per-account entry by.
        let account = match user.clone() {
            Some(account) => account,
            None => boff_me_with(&api, &token).await?,
        };

        // Persistence order matters: the roster is the ONLY enumeration of
        // accounts, so a credential written without a roster row would be a
        // permanently orphaned token. Roster row first; per-account credential
        // second (rolling the row back if it fails); the active mirror and the
        // in-memory cache last, once the account is fully recorded.
        let mut roster = load_boff_roster(&app);
        upsert_active_boff(&mut roster, &account);
        save_boff_roster(&app, &roster).map_err(ApiError::Message)?;
        if let Err(e) = store::save_launcher_session_for(account.id, &token) {
            let mut roster = load_boff_roster(&app);
            remove_boff(&mut roster, account.id);
            let _ = save_boff_roster(&app, &roster);
            return Err(ApiError::Store(e.to_string()));
        }
        store::save_launcher_session(&token).map_err(|e| ApiError::Store(e.to_string()))?;
        *api.token.lock().await = Some(token);

        user = Some(account);
        *api.pending.lock().await = None;
    } else if body.data.status != "pending" {
        *api.pending.lock().await = None;
    }

    Ok(DevicePollView {
        status: body.data.status,
        user,
    })
}

/// Abandon the pending device authorization. Local-only on purpose: server-side
/// codes expire on their own within minutes, and clearing `pending` is what
/// guarantees a late approval can never be committed by a stray poll.
#[tauri::command]
pub async fn boff_device_cancel(api: tauri::State<'_, ApiState>) -> Result<(), ApiError> {
    *api.pending.lock().await = None;
    Ok(())
}

/// The stored session, if any. Called on start so a returning player never sees
/// the sign-in screen.
#[tauri::command]
pub async fn boff_session_restore(
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<Option<BoffAccount>, ApiError> {
    let _op = api.session_op.lock().await;
    let mut roster = load_boff_roster(&app);

    // First run of a multi-account build: no roster yet, but an older build may
    // have left a single session under the legacy key. Adopt it — validating it
    // reveals which account it is, which is the earliest the id can be known.
    if roster.accounts.is_empty() {
        match store::load_launcher_session() {
            Ok(Some(token)) => {
                *api.token.lock().await = Some(token.clone());
                return match boff_me(&api).await {
                    Ok(account) => {
                        store::save_launcher_session_for(account.id, &token)
                            .map_err(|e| ApiError::Store(e.to_string()))?;
                        upsert_active_boff(&mut roster, &account);
                        save_boff_roster(&app, &roster).map_err(ApiError::Message)?;
                        Ok(Some(account))
                    }
                    Err(ApiError::NeedsSignin(_)) => {
                        api.forget_session().await;
                        Ok(None)
                    }
                    Err(e) => Err(e),
                };
            }
            // A locked or broken keychain must not look like a first run, or the
            // player re-authorises every launch and nobody notices why.
            Ok(None) => return Ok(None),
            Err(e) => return Err(ApiError::Store(e.to_string())),
        }
    }

    // Restore the active account, then any other known account, until one is
    // still live. `/me` doubles as the liveness check: a 30-day session outlives
    // plenty of reasons to be revoked, and finding out here beats finding out
    // halfway through an install. A pruned account is written back so the dead
    // row does not reappear next launch.
    let ordered: Vec<i64> = roster
        .active
        .into_iter()
        .chain(roster.accounts.iter().map(|a| a.id))
        .collect();
    let mut tried = std::collections::HashSet::new();
    // A store failure for ONE account must not abort the walk: the other
    // accounts' entries may read fine, and any live one beats an error. The
    // failing row is skipped WITHOUT pruning — its token may still exist behind
    // a locked keychain.
    let mut store_failure: Option<ApiError> = None;

    for id in ordered {
        if !tried.insert(id) {
            continue;
        }
        match activate_boff(&api, id).await {
            Err(e) => {
                if store_failure.is_none() {
                    store_failure = Some(e);
                }
            }
            Ok(false) => {
                // Roster lists it but the keychain lost the token: prune it.
                remove_boff(&mut roster, id);
            }
            Ok(true) => match boff_me(&api).await {
                Ok(account) => {
                    upsert_active_boff(&mut roster, &account);
                    // Startup reconciliation: any OTHER row whose credential is
                    // demonstrably gone is pruned now, so it cannot linger as a
                    // switch target that can only fail.
                    let dead: Vec<i64> = roster
                        .accounts
                        .iter()
                        .map(|a| a.id)
                        .filter(|other| {
                            *other != account.id
                                && matches!(store::load_launcher_session_for(*other), Ok(None))
                        })
                        .collect();
                    for id in dead {
                        remove_boff(&mut roster, id);
                    }
                    save_boff_roster(&app, &roster).map_err(ApiError::Message)?;
                    return Ok(Some(account));
                }
                Err(ApiError::NeedsSignin(_)) => {
                    let _ = store::clear_launcher_session_for(id);
                    remove_boff(&mut roster, id);
                }
                Err(e) => return Err(e),
            },
        }
    }

    // Nobody restored. A credential-store failure outranks "first run": §5.7's
    // rule, a locked keychain must never look like a signed-out machine.
    if let Some(err) = store_failure {
        return Err(err);
    }
    api.forget_session().await;
    let _ = save_boff_roster(&app, &roster);
    Ok(None)
}

/// Every Boffmedia account this launcher knows, active one flagged. Offline and
/// cheap: reads the roster, never the network.
#[tauri::command]
pub async fn boff_accounts(app: tauri::AppHandle) -> Result<Vec<BoffAccountEntry>, ApiError> {
    let roster = load_boff_roster(&app);
    Ok(roster
        .accounts
        .iter()
        .map(|a| BoffAccountEntry {
            id: a.id,
            username: a.username.clone(),
            mc_uuid: a.mc_uuid.clone(),
            active: roster.active == Some(a.id),
        })
        .collect())
}

/// Refuse a session mutation while an install is downloading or a game is
/// running: the process-global token is what those operations authenticate
/// with, and swapping it under them re-authenticates their remaining requests
/// as somebody else (C1).
async fn ensure_idle(manager: &crate::install::InstallManager) -> Result<(), ApiError> {
    if manager.is_busy().await {
        return Err(ApiError::Message(
            "No puedes cambiar de cuenta mientras hay una instalación en curso o un juego \
             abierto."
                .into(),
        ));
    }
    Ok(())
}

/// The commit half of a switch. Validates the CANDIDATE token against `/me`
/// BEFORE touching the mirror, the memory cache or the roster, so a transient
/// failure leaves the previous account fully active — disk, keychain and memory
/// all still agree. Caller must hold `session_op`.
async fn switch_inner(
    app: &tauri::AppHandle,
    api: &ApiState,
    id: i64,
) -> Result<BoffAccount, ApiError> {
    let mut roster = load_boff_roster(app);
    let Some(candidate) =
        store::load_launcher_session_for(id).map_err(|e| ApiError::Store(e.to_string()))?
    else {
        remove_boff(&mut roster, id);
        let _ = save_boff_roster(app, &roster);
        return Err(ApiError::NeedsSignin(
            "Esa cuenta ya no tiene sesión guardada. Vuelve a añadirla.".into(),
        ));
    };

    match boff_me_with(api, &candidate).await {
        Ok(account) => {
            store::save_launcher_session(&candidate)
                .map_err(|e| ApiError::Store(e.to_string()))?;
            *api.token.lock().await = Some(candidate);
            upsert_active_boff(&mut roster, &account);
            save_boff_roster(app, &roster).map_err(ApiError::Message)?;
            Ok(account)
        }
        Err(ApiError::NeedsSignin(m)) => {
            // The candidate is dead. The previous account was never displaced.
            let _ = store::clear_launcher_session_for(id);
            remove_boff(&mut roster, id);
            let _ = save_boff_roster(app, &roster);
            Err(ApiError::NeedsSignin(m))
        }
        // Transient (network) failure: nothing was committed, nothing to undo.
        Err(e) => Err(e),
    }
}

/// Make a known Boffmedia account the active one. Validates the candidate's
/// token against `/me` BEFORE committing anything; a dead account is pruned
/// rather than reported as an error the player cannot act on.
#[tauri::command]
pub async fn boff_switch(
    app: tauri::AppHandle,
    id: i64,
    api: tauri::State<'_, ApiState>,
    auth: tauri::State<'_, crate::auth::AuthState>,
    manager: tauri::State<'_, crate::install::InstallManager>,
) -> Result<BoffAccount, ApiError> {
    let _op = api.session_op.lock().await;
    ensure_idle(&manager).await?;
    let account = switch_inner(&app, &api, id).await?;
    // The Minecraft identity is a credential LINKED under the departing
    // Boffmedia account; the incoming one restores (or links) its own.
    auth.clear_session().await;
    Ok(account)
}

/// Sign out of the ACTIVE Boffmedia account. Returns whoever is active
/// afterwards — the launcher promotes another known account when one is left —
/// or None when that was the last and the sign-in screen is due.
#[tauri::command]
pub async fn boff_sign_out(
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
    auth: tauri::State<'_, crate::auth::AuthState>,
    manager: tauri::State<'_, crate::install::InstallManager>,
) -> Result<Option<BoffAccount>, ApiError> {
    let _op = api.session_op.lock().await;
    ensure_idle(&manager).await?;
    auth.clear_session().await;

    let mut roster = load_boff_roster(&app);
    let Some(active) = roster.active else {
        api.forget_session().await;
        return Ok(None);
    };

    let _ = store::clear_launcher_session_for(active);
    let next = remove_boff(&mut roster, active);
    save_boff_roster(&app, &roster).map_err(ApiError::Message)?;

    match next {
        // Promote the next account. A DEAD next (no token, or the server says
        // needs-signin) resolves to the sign-in screen; a TRANSIENT failure is
        // an error the renderer can retry. Either way the signed-out account's
        // session must not stay live in this process.
        Some(id) => match switch_inner(&app, &api, id).await {
            Ok(account) => Ok(Some(account)),
            Err(ApiError::NeedsSignin(_)) => {
                api.forget_session().await;
                Ok(None)
            }
            Err(e) => {
                api.forget_session().await;
                Err(e)
            }
        },
        None => {
            api.forget_session().await;
            Ok(None)
        }
    }
}

/// Enter OFFLINE mode as the last active Boffmedia account. Requires a stored
/// session token — proof of a real, completed sign-in on this machine — but
/// deliberately does NOT call the network: this exists precisely for when the
/// network is gone. Grants nothing server-side; only locally installed packs
/// are playable, and every API call still fails until connectivity returns.
#[tauri::command]
pub async fn boff_offline(
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<BoffAccount, ApiError> {
    let _op = api.session_op.lock().await;
    let roster = load_boff_roster(&app);
    let no_account = || {
        ApiError::NeedsSignin("No hay ninguna cuenta de Boffmedia guardada en este equipo.".into())
    };
    let active = roster.active.ok_or_else(no_account)?;
    let entry = roster
        .accounts
        .iter()
        .find(|a| a.id == active)
        .ok_or_else(no_account)?;

    // The proof: the token only exists after a completed device flow.
    let Some(token) =
        store::load_launcher_session_for(active).map_err(|e| ApiError::Store(e.to_string()))?
    else {
        return Err(no_account());
    };
    // Keep it live in memory so the first request after connectivity returns
    // authenticates without a restart.
    *api.token.lock().await = Some(token);

    Ok(BoffAccount {
        id: entry.id,
        username: entry.username.clone(),
        mc_uuid: entry.mc_uuid.clone(),
    })
}

/// Re-run `/me` against the STORED active token — the fix for "packs stopped
/// loading / 401" mid-session. A live answer refreshes the roster row; a 401
/// prunes the dead account and resolves None so the renderer can land on the
/// sign-in screen instead of looping.
#[tauri::command]
pub async fn boff_revalidate(
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<Option<BoffAccount>, ApiError> {
    let _op = api.session_op.lock().await;
    let mut roster = load_boff_roster(&app);
    let Some(active) = roster.active else {
        return Ok(None);
    };
    if !activate_boff(&api, active).await? {
        remove_boff(&mut roster, active);
        let _ = save_boff_roster(&app, &roster);
        return Ok(None);
    }
    match boff_me(&api).await {
        Ok(account) => {
            upsert_active_boff(&mut roster, &account);
            save_boff_roster(&app, &roster).map_err(ApiError::Message)?;
            Ok(Some(account))
        }
        Err(ApiError::NeedsSignin(_)) => {
            let _ = store::clear_launcher_session_for(active);
            remove_boff(&mut roster, active);
            api.forget_session().await;
            let _ = save_boff_roster(&app, &roster);
            Ok(None)
        }
        Err(e) => Err(e),
    }
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

/// `/me` with an EXPLICIT bearer token — the validation probe. Never touches
/// the cached token or the credential store, so a candidate can be judged
/// without displacing whoever is currently active.
async fn boff_me_with(api: &ApiState, token: &str) -> Result<BoffAccount, ApiError> {
    let res = api
        .http
        .get(format!("{}/packs/launcher/me", base_url()))
        .bearer_auth(token)
        .send()
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
        Err(e) => Err(ApiError::Store(e.to_string())),
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

/// Authenticated GET against an API path (leading-slash), through the shared
/// client. Same session handling and `X-Boff-Game-Types` header as every other
/// authed call — the randomizer used to build its own `reqwest::Client` and so
/// shared neither, drifting from the rest of the app on session invalidation.
pub async fn authed_get(api: &ApiState, path: &str) -> Result<reqwest::Response, ApiError> {
    authed(api, |http, base| {
        http.get(format!("{base}{path}"))
            .header("X-Boff-Game-Types", game_types_header())
    })
    .await
}

// ── Commands ───────────────────────────────────────────────────────────────

/// Filesystem-safe rendering of an id used as a cache filename.
fn safe_cache_key(id: &str) -> String {
    id.chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_'))
        .collect()
}

fn packs_cache_path(app: &tauri::AppHandle, account_id: i64) -> Option<std::path::PathBuf> {
    Some(
        crate::datadir::data_root(app)
            .ok()?
            .join(format!("packs_cache_{account_id}.json")),
    )
}

fn manifest_cache_path(app: &tauri::AppHandle, pack_id: &str) -> Option<std::path::PathBuf> {
    Some(
        crate::datadir::data_root(app)
            .ok()?
            .join("manifest_cache")
            .join(format!("{}.json", safe_cache_key(pack_id))),
    )
}

fn write_json_cache(path: Option<std::path::PathBuf>, value: &impl Serialize) {
    let Some(path) = path else { return };
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(raw) = serde_json::to_vec(value) {
        let tmp = path.with_extension("json.tmp");
        if std::fs::write(&tmp, raw).is_ok() {
            let _ = std::fs::rename(&tmp, &path);
        }
    }
}

fn read_json_cache<T: serde::de::DeserializeOwned>(path: Option<std::path::PathBuf>) -> Option<T> {
    let raw = std::fs::read(path?).ok()?;
    serde_json::from_slice(&raw).ok()
}

/// The packs this account may see. Access filtering is the server's job — a pack
/// the player cannot install must never reach this list in the first place.
///
/// Offline: the last-good list for the ACTIVE account is cached on disk and
/// served when the network is unreachable, so an installed pack does not vanish
/// from the library on a train. Never used for a NeedsSignin/Denied answer —
/// those are the server revoking access, which the cache must not outlive.
#[tauri::command]
pub async fn packs_list(
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<Vec<LauncherPack>, ApiError> {
    let account_id = active_boff_id(&app);
    let res = match authed(&api, |http, base| {
        http.get(format!("{base}/packs/launcher/packs"))
            .header("X-Boff-Game-Types", game_types_header())
    })
    .await
    {
        Ok(res) => res,
        Err(err @ ApiError::Message(_)) => {
            if let Some(id) = account_id {
                if let Some(cached) = read_json_cache::<Vec<LauncherPack>>(packs_cache_path(&app, id)) {
                    return Ok(cached);
                }
            }
            return Err(err);
        }
        Err(err) => return Err(err),
    };

    if !res.status().is_success() {
        return Err(ApiError::Message(
            error_message(res, "No se pudo cargar la lista de packs.").await,
        ));
    }
    let body: Envelope<Vec<LauncherPack>> = res.json().await?;
    if let Some(id) = account_id {
        write_json_cache(packs_cache_path(&app, id), &body.data);
    }
    Ok(body.data)
}

/// The manifest to install from. Returned to the renderer as raw JSON on
/// purpose: it is validated here with the generated types + the hand-mirrored
/// refinements, and the installer (§6) will read it from the same bytes.
#[tauri::command]
pub async fn pack_manifest(
    pack_id: String,
    password: Option<String>,
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<serde_json::Value, ApiError> {
    let query: Vec<(String, String)> = password
        .filter(|p| !p.is_empty())
        .map(|p| vec![("password".to_string(), p)])
        .unwrap_or_default();

    let res = match authed(&api, |http, base| {
        http.get(format!("{base}/packs/launcher/packs/{pack_id}/manifest"))
            .header("X-Boff-Game-Types", game_types_header())
            .query(&query)
    })
    .await
    {
        Ok(res) => res,
        // Network unreachable: fall back to the last manifest this pack
        // installed with, so an already-installed pack stays LAUNCHABLE
        // offline. Only for transport failures — a revoked entitlement or a
        // dead session must never be papered over by a cache.
        Err(err @ ApiError::Message(_)) => {
            if let Some(cached) =
                read_json_cache::<serde_json::Value>(manifest_cache_path(&app, &pack_id))
            {
                return Ok(cached);
            }
            return Err(err);
        }
        Err(err) => return Err(err),
    };

    let status = res.status();
    if !status.is_success() {
        let message = error_message(res, "No se pudo obtener el manifiesto.").await;
        return Err(if status == reqwest::StatusCode::FORBIDDEN {
            ApiError::Denied(message)
        } else if status == reqwest::StatusCode::CONFLICT {
            ApiError::Message(
                "Este pack necesita una versión más reciente del launcher. Por favor, actualiza el launcher desde el sitio oficial.".to_string()
            )
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

    // Last-good manifest, for the offline fallback above.
    write_json_cache(manifest_cache_path(&app, &pack_id), &body.data);

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
/// it. `token` is the session captured ONCE at operation start: a multi-minute
/// install must keep authenticating as the account that started it, not as
/// whatever the process-global token says mid-way through an account switch.
/// `None` (a local pack installed with no session) falls back to the global
/// token, which will surface `NeedsSignin` if there is none. A 401 only forgets
/// the stored session — there is nothing to re-mint; the player has to
/// re-approve in a browser.
pub async fn fetch_pack_file(
    app: &tauri::AppHandle,
    pack_id: &str,
    password: Option<&str>,
    file: &PackFile,
    token: Option<&str>,
) -> Result<reqwest::Response, ApiError> {
    use tauri::Manager;

    let api = app.state::<ApiState>();
    let token = match token {
        Some(t) => t.to_string(),
        None => current_token(&api).await?,
    };

    // Same precedent as the manifest call: a password gates the whole pack, so
    // it has to ride on every download too, not just the first request.
    let query: Vec<(String, String)> = password
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .map(|p| vec![("password".to_string(), p.to_string())])
        .unwrap_or_default();

    let route = file.route();
    let res = api
        .http
        .get(format!(
            "{}/packs/launcher/packs/{pack_id}/files/{route}",
            base_url()
        ))
        .query(&query)
        .bearer_auth(&token)
        .send()
        .await?;
    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        api.forget_session().await;
    }

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
