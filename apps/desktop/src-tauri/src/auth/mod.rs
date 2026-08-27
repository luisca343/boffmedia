// The launcher's identity layer. Two distinct things live here and must not be
// confused:
//
//   1. The MINECRAFT session — proves who the player is to Mojang, and is
//      what the game itself is launched with.
//   2. The PACK session — proves that same UUID to our own API, via
//      Mojang's hasJoined handshake, WITHOUT ever sending it a Microsoft or
//      Minecraft token.
//
// The second is derived from the first and is the only one our server sees.

pub mod accounts;
pub mod msa;
pub mod store;

use serde::Serialize;
use tokio::sync::Mutex;

use msa::{DeviceCode, McSession};

/// Everything the renderer is allowed to know about the signed-in player.
/// Tokens are deliberately absent — see the `skip_serializing` on McSession.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountView {
    pub uuid: String,
    pub username: String,
    /// Full skin sheet URL, empty when the player has no skin. See McSession.
    pub skin_url: String,
    /// Set when the identity resolved but could not be written down. The player
    /// IS signed in — the session in memory is live and the game will launch —
    /// but the link will not survive a restart, so the renderer says so instead
    /// of pretending nothing happened. `None` on the happy path, and skipped on
    /// the wire so the renderer sees the field only when it means something.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning: Option<String>,
}

/// A roster row for the switcher. Separate from `AccountView` because it
/// describes an account the launcher merely KNOWS about — only the active one
/// has a live session behind it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountEntry {
    pub uuid: String,
    pub username: String,
    pub active: bool,
    /// From the roster, so the switcher shows a face for accounts that have no
    /// live session — the whole point of a switcher is the accounts you are NOT
    /// currently signed in as, and none of those can be asked for a profile.
    pub skin_url: String,
}

impl From<&McSession> for AccountView {
    fn from(s: &McSession) -> Self {
        Self {
            uuid: s.uuid.clone(),
            username: s.username.clone(),
            skin_url: s.skin_url.clone(),
            warning: None,
        }
    }
}

/// What `persist_session` managed to write down.
struct Persisted {
    /// False when the refresh token did not reach the credential store, which
    /// is the half that decides whether the link survives a restart.
    token_saved: bool,
    /// Player-facing, already worded for the log and the toast.
    warning: Option<String>,
}

/// Write a resolved identity through to disk: the refresh token to the OS
/// credential store, the name and face to the roster.
///
/// BEST-EFFORT ON PURPOSE, and this is the whole point of the function. It used
/// to be three `?`s inline, so a credential store that refused the write failed
/// the entire sign-in — after the player had already finished on microsoft.com.
/// The live session was then thrown away along with it, the code screen just
/// closed, and the launcher asked for the link again at the next pack launch
/// with nothing on screen to explain why. A session that cannot be SAVED is
/// still a session that can be PLAYED; only the surviving-a-restart part is
/// lost, and that is what the warning says.
///
/// The roster row is written even when the token was not: the switcher should
/// show the account you are actually signed in as, and a row whose token is
/// missing is already a case `auth_restore`/`auth_switch` prune on sight.
fn persist_session(app: &tauri::AppHandle, session: &McSession) -> Persisted {
    let token_err = store::save_refresh_token_for(&session.uuid, &session.refresh_token).err();

    let mut roster = accounts::load(app);
    accounts::upsert_active(&mut roster, &session.uuid, &session.username, &session.skin_url);
    let roster_err = accounts::save(app, &roster).err();

    let warning = match (&token_err, &roster_err) {
        (None, None) => None,
        (Some(err), _) => Some(format!(
            "Has entrado como {}, pero no se pudo guardar la sesión en el almacén \
             de credenciales del sistema ({err}). Podrás jugar ahora, pero tendrás \
             que vincular la cuenta otra vez la próxima vez que abras la app.",
            session.username
        )),
        (None, Some(message)) => Some(format!(
            "Has entrado como {}, pero no se pudo guardar la lista de cuentas \
             ({message}).",
            session.username
        )),
    };

    Persisted {
        token_saved: token_err.is_none(),
        warning,
    }
}

/// Process-wide auth state. The Minecraft access token never leaves this struct
/// — not to the renderer, not to disk, and not to our own API.
#[derive(Default)]
pub struct AuthState {
    pending: Mutex<Option<DeviceCode>>,
    session: Mutex<Option<McSession>>,
    /// Serialises `auth_restore`. React StrictMode invokes the restore effect
    /// TWICE in dev, and two concurrent runs of the four-hop chain get the
    /// second one rate-limited by Minecraft (429 TOO_MANY_REQUESTS) — which
    /// then surfaced as a bogus "the credential store failed". Guarding here
    /// rather than only in the renderer means a window reload, a retry and a
    /// future caller are all covered by the same lock.
    restoring: Mutex<()>,
}

impl AuthState {
    pub async fn session(&self) -> Option<McSession> {
        self.session.lock().await.clone()
    }

    /// Drop the live Minecraft session AND any pending device flow. Called on a
    /// Boffmedia switch/sign-out: the MSA identity is a credential linked under
    /// the departing account and must not survive into the next one.
    pub async fn clear_session(&self) {
        *self.session.lock().await = None;
        *self.pending.lock().await = None;
    }
}

/// Serialisable error for the renderer. Every variant of the underlying errors
/// already carries a message written for a player rather than a developer, so
/// this just carries it across the IPC boundary.
#[derive(Debug, Serialize)]
pub struct AuthFailure {
    pub message: String,
    /// True when signing in again resolves it, as opposed to "try later".
    pub needs_signin: bool,
}

impl From<msa::AuthError> for AuthFailure {
    fn from(err: msa::AuthError) -> Self {
        let needs_signin = matches!(
            err,
            msa::AuthError::Expired | msa::AuthError::Declined | msa::AuthError::NoProfile(_)
        );
        Self {
            message: err.to_string(),
            needs_signin,
        }
    }
}

impl From<store::StoreError> for AuthFailure {
    fn from(err: store::StoreError) -> Self {
        Self {
            message: err.to_string(),
            needs_signin: false,
        }
    }
}

/// Step 1 of sign-in: hand the renderer a code to display.
///
/// Deliberately split from `auth_await` so the UI can render the code while the
/// long poll runs — the SignIn screen shows exactly these two fields.
#[tauri::command]
pub async fn auth_begin(state: tauri::State<'_, AuthState>) -> Result<DeviceCode, AuthFailure> {
    let code = msa::request_device_code().await?;
    *state.pending.lock().await = Some(code.clone());
    Ok(code)
}

/// Step 2: block until the user finishes in their browser, then resolve the full
/// chain. Long-running by nature — the code is valid for ~15 minutes.
#[tauri::command]
pub async fn auth_await(
    app: tauri::AppHandle,
    state: tauri::State<'_, AuthState>,
) -> Result<AccountView, AuthFailure> {
    let code = state
        .pending
        .lock()
        .await
        .clone()
        .ok_or_else(|| AuthFailure {
            message: "No hay ningún acceso en curso.".into(),
            needs_signin: true,
        })?;

    let (ms_access, refresh) = msa::poll_for_tokens(&code).await?;
    let session = msa::minecraft_session(&ms_access, refresh).await?;

    *state.pending.lock().await = None;

    // THE LIVE SESSION FIRST, persistence second. The player has finished with
    // Microsoft by this point and the identity is fully resolved; nothing that
    // happens to a disk or a keychain afterwards should be able to take that
    // away from them. See `persist_session`.
    //
    // Signing into Minecraft is a sub-step of launching a Minecraft pack, NOT
    // the launcher session. It links (or relinks) an MSA identity under the
    // active Boffmedia account, so it must leave the Boffmedia session — and the
    // pack library that keys on it — completely untouched.
    let mut view = AccountView::from(&session);
    let persisted = persist_session(&app, &session);
    view.warning = persisted.warning;
    *state.session.lock().await = Some(session);
    Ok(view)
}

/// Open Microsoft's verification page in the SYSTEM browser.
///
/// Takes no URL from the renderer on purpose: it can only ever open the code
/// currently pending, so it cannot be turned into a general "open any URL"
/// primitive. That is also why `tauri-plugin-opener` is not used — the plugin
/// exists to give the *renderer* an opener, which this app does not want.
///
/// Letting the `<a href>` navigate instead puts Microsoft's login inside our
/// own window — an embedded-webview sign-in, which Microsoft disallows.
#[tauri::command]
pub async fn auth_open_verification(state: tauri::State<'_, AuthState>) -> Result<(), AuthFailure> {
    let code = state
        .pending
        .lock()
        .await
        .clone()
        .ok_or_else(|| AuthFailure {
            message: "No hay ningún acceso en curso.".into(),
            needs_signin: true,
        })?;

    // EXACTLY the URL Microsoft handed us, with nothing appended.
    //
    // This used to add `?otc=<user_code>` to pre-fill the code, on the theory
    // that an endpoint which does not understand the parameter would just show
    // its normal entry form. It does not: microsoft.com/link answers the
    // pre-filled link with "that code is invalid" — while the very same URL,
    // copied and pasted by hand, works. So the button was the ONE path through
    // this screen that could not complete, and the copy button beside it was
    // the workaround. The code goes to the clipboard from the renderer instead
    // (see SignIn.tsx), which costs a paste and always works.
    //
    // Detached: `open::that` waits on the spawned process, which would hold
    // this command open for as long as the browser runs.
    open::that_detached(&code.verification_uri).map_err(|e| AuthFailure {
        message: format!("No se pudo abrir el navegador: {e}"),
        needs_signin: false,
    })
}

/// Open an ARBITRARY external URL in the system browser.
///
/// Unlike `auth_open_verification`, which can only open the pending Microsoft
/// device code, this takes the URL from the renderer — the Boffmedia device
/// flow's verification page and the randomizer's event link both live in the
/// pack API / website, not in `AuthState.pending`. Only http(s) is accepted, so
/// the renderer cannot turn this into a launcher for `file://` or a custom
/// scheme handler.
#[tauri::command]
pub async fn open_url(url: String) -> Result<(), AuthFailure> {
    let trimmed = url.trim();
    let invalid = || AuthFailure {
        message: "Enlace no válido.".into(),
        needs_signin: false,
    };
    // A real parse, not a prefix test: "https://" alone, userinfo tricks and
    // whitespace smuggling all fail here. Plain http is for local dev only.
    let parsed = reqwest::Url::parse(trimmed).map_err(|_| invalid())?;
    match parsed.scheme() {
        "https" => {}
        "http"
            if matches!(
                parsed.host_str(),
                Some("localhost" | "127.0.0.1" | "[::1]" | "::1")
            ) => {}
        _ => return Err(invalid()),
    }
    open::that_detached(trimmed).map_err(|e| AuthFailure {
        message: format!("No se pudo abrir el navegador: {e}"),
        needs_signin: false,
    })
}

/// Silent sign-in on launch. `Ok(None)` means "no stored session, show the
/// sign-in screen"; an Err means the credential store itself failed, which
/// must not be mistaken for a first run.
#[tauri::command]
pub async fn auth_restore(
    app: tauri::AppHandle,
    state: tauri::State<'_, AuthState>,
) -> Result<Option<AccountView>, AuthFailure> {
    // Only one restore may be in flight; a second caller waits here rather than
    // starting a competing chain that Minecraft would rate-limit.
    let _restoring = state.restoring.lock().await;

    // Whoever we queued behind may have already finished the work.
    if let Some(session) = state.session.lock().await.as_ref() {
        return Ok(Some(AccountView::from(session)));
    }

    let mut roster = accounts::load(&app);

    // Which token to restore: the active account's, or — on the first run of a
    // multi-account build — the single legacy entry, whose UUID is not known
    // until the chain below resolves. `migrating` carries that distinction to
    // the migration step at the end.
    let (refresh, migrating) = match roster.active.clone() {
        Some(uuid) => match store::load_refresh_token_for(&uuid)? {
            Some(token) => (token, false),
            None => {
                // Roster and keychain disagree (see accounts.rs): the account is
                // listed but its token is gone. Prune it rather than reporting a
                // failure the player cannot act on.
                accounts::remove(&mut roster, &uuid);
                let _ = accounts::save(&app, &roster);
                return Ok(None);
            }
        },
        None => match store::load_refresh_token()? {
            Some(token) => (token, true),
            None => return Ok(None),
        },
    };

    let (ms_access, new_refresh) = match msa::refresh_tokens(&refresh).await {
        Ok(pair) => pair,
        Err(msa::AuthError::Expired) => {
            // Revoked by a password change or MFA reset. Drop it rather than
            // retrying forever on every start.
            if migrating {
                store::clear_refresh_token()?;
            } else if let Some(uuid) = roster.active.clone() {
                store::clear_refresh_token_for(&uuid)?;
                accounts::remove(&mut roster, &uuid);
                let _ = accounts::save(&app, &roster);
            }
            return Ok(None);
        }
        Err(err) => return Err(err.into()),
    };

    let session = msa::minecraft_session(&ms_access, new_refresh).await?;

    // Microsoft rotates refresh tokens; persisting the new one is what keeps
    // silent sign-in working past the first refresh. Best-effort for the same
    // reason as in `auth_await`: this restore has ALREADY succeeded, and a
    // credential store that refuses the rotated token must cost the player the
    // next launch at worst, not this one. The UUID is only knowable here, which
    // is why the legacy entry cannot be migrated at startup — it is an opaque
    // token until the chain resolves it.
    let mut view = AccountView::from(&session);
    let persisted = persist_session(&app, &session);
    view.warning = persisted.warning;

    // Clearing the legacy entry LAST, and only once the per-UUID one is really
    // there: an interrupted (or refused) migration retries next launch instead
    // of stranding the account with no token under either key.
    if migrating && persisted.token_saved {
        let _ = store::clear_refresh_token();
    }

    *state.session.lock().await = Some(session);
    Ok(Some(view))
}

/// Every account this launcher knows about. Cheap and offline: it reads the
/// roster, never the network, so the switcher can render instantly.
#[tauri::command]
pub async fn auth_accounts(app: tauri::AppHandle) -> Result<Vec<AccountEntry>, AuthFailure> {
    let roster = accounts::load(&app);
    Ok(roster
        .accounts
        .iter()
        .map(|a| AccountEntry {
            uuid: a.uuid.clone(),
            username: a.username.clone(),
            active: roster.active.as_deref() == Some(a.uuid.as_str()),
            skin_url: a.skin_url.clone(),
        })
        .collect())
}

/// Enter OFFLINE mode as the last active account.
///
/// What this is for: a player with no connection currently cannot get past the
/// sign-in screen, because the silent restore needs four network hops to
/// succeed. Everything they might actually want to do — launch a pack that is
/// already fully installed on their disk — needs none of them.
///
/// What makes this safe rather than an authentication bypass:
///
///   * It requires a refresh token to be present in the OS credential store
///     for that UUID. That token can only get there by a real, completed
///     Microsoft sign-in on this machine, so this proves prior authentication;
///     it does not grant new access. Someone typing a stranger's username gets
///     nothing, because there is no roster entry and no keychain entry.
///   * The session it builds has an EMPTY access token. That is precisely
///     portablemc's offline configuration (install/session.rs), so the game
///     launches into singleplayer and every online server rejects it — the
///     server, not us, enforces that. Nothing here mints a credential.
///   * It never touches the pack API: a launcher session needs Mojang's
///     hasJoined handshake, which is exactly the network this mode does not
///     have. Offline means locally installed packs only.
#[tauri::command]
pub async fn auth_offline(
    app: tauri::AppHandle,
    state: tauri::State<'_, AuthState>,
) -> Result<AccountView, AuthFailure> {
    let roster = accounts::load(&app);
    let uuid = roster.active.clone().ok_or_else(|| AuthFailure {
        message: "No hay ninguna cuenta guardada en este equipo.".into(),
        needs_signin: true,
    })?;
    let entry = roster
        .accounts
        .iter()
        .find(|a| a.uuid == uuid)
        .ok_or_else(|| AuthFailure {
            message: "No hay ninguna cuenta guardada en este equipo.".into(),
            needs_signin: true,
        })?;

    // The proof. Without a stored token this account was never really signed in
    // here, and offline mode must not invent an identity.
    if store::load_refresh_token_for(&uuid)?.is_none() {
        return Err(AuthFailure {
            message: "Necesitas iniciar sesión al menos una vez con conexión antes de \
                      jugar sin ella."
                .into(),
            needs_signin: true,
        });
    }

    let session = McSession {
        uuid: entry.uuid.clone(),
        username: entry.username.clone(),
        skin_url: entry.skin_url.clone(),
        // Empty on purpose — see the doc comment. This is the offline launch.
        access_token: String::new(),
        xuid: String::new(),
        refresh_token: String::new(),
    };

    let view = AccountView::from(&session);
    *state.session.lock().await = Some(session);
    Ok(view)
}

/// Make a known account the active one, resolving its Minecraft session.
///
/// The full refresh chain runs here rather than being cached per account: a
/// Minecraft access token lasts ~24h and holding several live sessions in
/// memory would mean refreshing all of them on a schedule, for accounts the
/// player is not using.
#[tauri::command]
pub async fn auth_switch(
    app: tauri::AppHandle,
    uuid: String,
    state: tauri::State<'_, AuthState>,
) -> Result<AccountView, AuthFailure> {
    let _restoring = state.restoring.lock().await;

    let mut roster = accounts::load(&app);
    let Some(refresh) = store::load_refresh_token_for(&uuid)? else {
        accounts::remove(&mut roster, &uuid);
        let _ = accounts::save(&app, &roster);
        return Err(AuthFailure {
            message: "Esa cuenta ya no tiene sesión guardada. Vuelve a añadirla.".into(),
            needs_signin: true,
        });
    };

    let (ms_access, new_refresh) = match msa::refresh_tokens(&refresh).await {
        Ok(pair) => pair,
        Err(msa::AuthError::Expired) => {
            store::clear_refresh_token_for(&uuid)?;
            accounts::remove(&mut roster, &uuid);
            let _ = accounts::save(&app, &roster);
            return Err(AuthFailure {
                message: "La sesión de esa cuenta ha caducado. Vuelve a añadirla.".into(),
                needs_signin: true,
            });
        }
        Err(err) => return Err(err.into()),
    };

    let session = msa::minecraft_session(&ms_access, new_refresh).await?;

    // A Minecraft identity is a LINKED credential under the active Boffmedia
    // account now, not the launcher session — switching it leaves the Boffmedia
    // session (and the pack library that keys on it) alone. Persistence is
    // best-effort here too: the switch itself has already worked.
    let mut view = AccountView::from(&session);
    view.warning = persist_session(&app, &session).warning;
    *state.session.lock().await = Some(session);
    Ok(view)
}

/// Forget one account. Returns the account that is active afterwards, or None
/// when that was the last one and the sign-in screen is due.
///
/// Removing the ACTIVE account has to resolve a session for whoever is promoted
/// in its place — otherwise the launcher would show a signed-in username in the
/// switcher while holding no session to launch the game with.
#[tauri::command]
pub async fn auth_remove(
    app: tauri::AppHandle,
    uuid: String,
    state: tauri::State<'_, AuthState>,
) -> Result<Option<AccountView>, AuthFailure> {
    let mut roster = accounts::load(&app);
    let was_active = roster.active.as_deref() == Some(uuid.as_str());
    store::clear_refresh_token_for(&uuid)?;
    let next = accounts::remove(&mut roster, &uuid);
    accounts::save(&app, &roster).map_err(|message| AuthFailure {
        message,
        needs_signin: false,
    })?;

    if !was_active {
        // Someone else is still signed in and their session is untouched.
        return Ok(state.session.lock().await.as_ref().map(AccountView::from));
    }

    *state.session.lock().await = None;

    match next {
        Some(next_uuid) => auth_switch(app, next_uuid, state).await.map(Some),
        None => Ok(None),
    }
}

/// Sign out of EVERY account, and forget them all.
///
/// Kept as the "leave this machine clean" action now that `auth_remove` covers
/// signing out of one account: on a shared PC, "cerrar sesión" that silently
/// left three other accounts signed in would be a nasty surprise.
///
/// Dropping the launcher session as well as the Minecraft one is deliberate:
/// the two are separate tokens (see `api`), and keeping the pack JWT would
/// leave the next player able to list the previous player's packs.
#[tauri::command]
pub async fn auth_logout(
    app: tauri::AppHandle,
    state: tauri::State<'_, AuthState>,
    api: tauri::State<'_, crate::api::ApiState>,
) -> Result<(), AuthFailure> {
    let roster = accounts::load(&app);
    for account in &roster.accounts {
        // Best-effort per account: one keychain entry that refuses to delete
        // must not leave the other accounts signed in.
        let _ = store::clear_refresh_token_for(&account.uuid);
    }
    // The pre-migration entry too, in case this build never restored it.
    store::clear_refresh_token()?;
    let _ = accounts::save(&app, &accounts::Roster::default());

    *state.session.lock().await = None;
    *state.pending.lock().await = None;
    api.forget_session().await;
    Ok(())
}
