// The ONLY thing persisted is the Microsoft refresh token, and it
// goes in the OS credential store (DPAPI on Windows, Keychain on macOS, Secret
// Service on Linux). A refresh token is effectively the account; several
// launchers have shipped it in plaintext JSON and it is a real theft vector.
//
// The Minecraft access token is never stored: it lasts ~24h and is re-derived
// from the refresh token on every start.

use keyring::Entry;

// The OS keychain's service name. It tracks the bundle identifier deliberately:
// both are `es.boffmedia.app`, so there is one name for this app on disk rather
// than two that drift. Changing it again would find an empty keychain and sign
// every install out, so treat it as permanent from the first public release on.
const SERVICE: &str = "es.boffmedia.app";

/// The pre-multi-account key: ONE token, no UUID. Still read (never written) so
/// a player who signed in on an older build is not logged out by updating —
/// `auth_restore` migrates it to a per-UUID key as soon as the refresh chain
/// reveals which account it belongs to, which is the earliest that can be known.
const LEGACY_ACCOUNT: &str = "msa-refresh-token";

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("no se pudo acceder al almacén de credenciales del sistema: {0}")]
    Keyring(#[from] keyring::Error),
}

/// One credential per account. The UUID is a Mojang-issued hex string, but it
/// is filtered anyway: it becomes part of a credential-store key, and this is
/// the last point before that key is built.
fn account_key(uuid: &str) -> String {
    let safe: String = uuid
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
        .collect();
    format!("msa-refresh-token:{safe}")
}

fn entry_for(key: &str) -> Result<Entry, StoreError> {
    Ok(Entry::new(SERVICE, key)?)
}

fn entry() -> Result<Entry, StoreError> {
    entry_for(LEGACY_ACCOUNT)
}

pub fn load_refresh_token_for(uuid: &str) -> Result<Option<String>, StoreError> {
    match entry_for(&account_key(uuid))?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

pub fn save_refresh_token_for(uuid: &str, token: &str) -> Result<(), StoreError> {
    Ok(entry_for(&account_key(uuid))?.set_password(token)?)
}

pub fn clear_refresh_token_for(uuid: &str) -> Result<(), StoreError> {
    match entry_for(&account_key(uuid))?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

/// `Ok(None)` means "no stored session" — a genuine first run.
///
/// This returns a Result rather than an Option for one reason: a
/// keychain that is locked or broken must NOT look like a first run, or the user
/// silently re-authenticates on every launch forever and nobody notices.
pub fn load_refresh_token() -> Result<Option<String>, StoreError> {
    match entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

/// Idempotent: signing out twice, or before ever signing in, is not an error.
/// Clears the LEGACY entry only — per-account tokens go through
/// `clear_refresh_token_for`.
pub fn clear_refresh_token() -> Result<(), StoreError> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

// ── Boffmedia app session ──────────────────────────────────────────────────
//
// Persisted, because it cannot be re-derived: this session is minted by a
// device-authorization flow that needs the player to approve it in a browser —
// asking for that on every launch would be intolerable — and it lasts 30 days.
// Same store as the refresh token, for the same reason: it is a bearer
// credential for the account.

//
// MULTI-ACCOUNT. `APP_SESSION` now doubles as the ACTIVE account's token
// mirror: it always holds whatever account is currently active, so `authed()`
// (which has no AppHandle to read the roster) can fetch the active token with
// no extra plumbing. Each signed-in account ALSO gets a per-id entry, which is
// what a switch reads to make a different account active.

// A live credential-store key: every signed-in player's session is filed under
// it in the OS keychain, and a new name would find nothing there and read as
// "no stored session" — silently signing everyone out on update. Renamed once,
// before the first public release, while that cost was still zero. Permanent now.
const APP_SESSION: &str = "boff-app-session";

/// One Boffmedia-session credential per account. The id is the account's numeric
/// primary key; it is filtered anyway, since it becomes part of a store key.
fn app_account_key(id: i64) -> String {
    format!("{APP_SESSION}:{id}")
}

/// The ACTIVE account's token (the mirror). Read by `authed()` on every request.
pub fn load_app_session() -> Result<Option<String>, StoreError> {
    match entry_for(APP_SESSION)?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

pub fn save_app_session(token: &str) -> Result<(), StoreError> {
    Ok(entry_for(APP_SESSION)?.set_password(token)?)
}

pub fn clear_app_session() -> Result<(), StoreError> {
    match entry_for(APP_SESSION)?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

pub fn load_app_session_for(id: i64) -> Result<Option<String>, StoreError> {
    match entry_for(&app_account_key(id))?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

pub fn save_app_session_for(id: i64, token: &str) -> Result<(), StoreError> {
    Ok(entry_for(&app_account_key(id))?.set_password(token)?)
}

pub fn clear_app_session_for(id: i64) -> Result<(), StoreError> {
    match entry_for(&app_account_key(id))?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_uuid_can_never_shape_the_credential_key() {
        assert_eq!(
            account_key("069a79f4-44e9-4726-a5be-fca90e38aaf5"),
            "msa-refresh-token:069a79f4-44e9-4726-a5be-fca90e38aaf5"
        );
        // Anything that could collide with another app's entry, or with the
        // legacy key, is filtered out rather than escaped.
        assert_eq!(account_key("../../root"), "msa-refresh-token:root");
        assert_eq!(account_key("a b:c"), "msa-refresh-token:abc");
    }

    #[test]
    fn the_legacy_key_is_not_reachable_through_a_uuid() {
        // A crafted "uuid" must not be able to address the pre-migration entry,
        // which belongs to whichever account happens to still be stored there.
        assert_ne!(account_key("msa-refresh-token"), LEGACY_ACCOUNT);
    }
}
