// The launcher's identity layer. Two distinct things live here and must not be
// confused:
//
//   1. The MINECRAFT session (§5) — proves who the player is to Mojang, and is
//      what the game itself is launched with.
//   2. The PACK session (§7.2) — proves that same UUID to our own API, via
//      Mojang's hasJoined handshake, WITHOUT ever sending it a Microsoft or
//      Minecraft token.
//
// The second is derived from the first and is the only one our server sees.

pub mod msa;
pub mod store;

use serde::Serialize;
use tokio::sync::Mutex;

use msa::{DeviceCode, McSession};

/// Everything the renderer is allowed to know about the signed-in player.
/// Tokens are deliberately absent — see the `skip_serializing` on McSession.
#[derive(Debug, Clone, Serialize)]
pub struct AccountView {
    pub uuid: String,
    pub username: String,
}

impl From<&McSession> for AccountView {
    fn from(s: &McSession) -> Self {
        Self {
            uuid: s.uuid.clone(),
            username: s.username.clone(),
        }
    }
}

/// Process-wide auth state. The Minecraft access token never leaves this struct
/// — not to the renderer, not to disk, and not to our own API.
#[derive(Default)]
pub struct AuthState {
    pending: Mutex<Option<DeviceCode>>,
    session: Mutex<Option<McSession>>,
}

impl AuthState {
    pub async fn session(&self) -> Option<McSession> {
        self.session.lock().await.clone()
    }
}

/// Serialisable error for the renderer. Every variant of the underlying errors
/// already carries a message written for a player rather than a developer, so
/// this just carries it across the IPC boundary.
#[derive(Debug, Serialize)]
pub struct AuthFailure {
    pub message: String,
    /// True when signing in again is the fix, as opposed to "try later".
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

/// Step 1 of sign-in: hand the renderer a code to display (§5.1).
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
    state: tauri::State<'_, AuthState>,
    api: tauri::State<'_, crate::api::ApiState>,
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

    // Persist ONLY the refresh token, and only after the whole chain succeeded —
    // storing earlier would leave a token behind for an account that turned out
    // to have no Java profile.
    store::save_refresh_token(&session.refresh_token)?;

    *state.pending.lock().await = None;
    // A sign-in may be a DIFFERENT account than the one this process last held,
    // so any launcher session minted earlier is now for the wrong UUID.
    api.forget_session().await;
    let view = AccountView::from(&session);
    *state.session.lock().await = Some(session);
    Ok(view)
}

/// Silent sign-in on launch. `Ok(None)` means "no stored session, show the
/// sign-in screen"; an Err means the credential store itself failed, which
/// §5.7 insists must not be mistaken for a first run.
#[tauri::command]
pub async fn auth_restore(
    state: tauri::State<'_, AuthState>,
) -> Result<Option<AccountView>, AuthFailure> {
    let Some(refresh) = store::load_refresh_token()? else {
        return Ok(None);
    };

    let (ms_access, new_refresh) = match msa::refresh_tokens(&refresh).await {
        Ok(pair) => pair,
        Err(msa::AuthError::Expired) => {
            // Revoked by a password change or MFA reset. Drop it rather than
            // retrying forever on every start.
            store::clear_refresh_token()?;
            return Ok(None);
        }
        Err(err) => return Err(err.into()),
    };

    let session = msa::minecraft_session(&ms_access, new_refresh).await?;
    // Microsoft rotates refresh tokens; persisting the new one is what keeps
    // silent sign-in working past the first refresh.
    store::save_refresh_token(&session.refresh_token)?;

    let view = AccountView::from(&session);
    *state.session.lock().await = Some(session);
    Ok(Some(view))
}

/// Signing out drops the launcher session as well as the Minecraft one: the two
/// are separate tokens (see `api`), and keeping the pack JWT would leave the
/// next player able to list the previous player's packs.
#[tauri::command]
pub async fn auth_logout(
    state: tauri::State<'_, AuthState>,
    api: tauri::State<'_, crate::api::ApiState>,
) -> Result<(), AuthFailure> {
    store::clear_refresh_token()?;
    *state.session.lock().await = None;
    *state.pending.lock().await = None;
    api.forget_session().await;
    Ok(())
}
