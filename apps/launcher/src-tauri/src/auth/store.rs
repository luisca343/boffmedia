// HANDOFF §5.7 — the ONLY thing persisted is the Microsoft refresh token, and it
// goes in the OS credential store (DPAPI on Windows, Keychain on macOS, Secret
// Service on Linux). A refresh token is effectively the account; several
// launchers have shipped it in plaintext JSON and it is a real theft vector.
//
// The Minecraft access token is never stored: it lasts ~24h and is re-derived
// from the refresh token on every start.

use keyring::Entry;

const SERVICE: &str = "es.boffmedia.launcher";
const ACCOUNT: &str = "msa-refresh-token";

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("no se pudo acceder al almacén de credenciales del sistema: {0}")]
    Keyring(#[from] keyring::Error),
}

fn entry() -> Result<Entry, StoreError> {
    Ok(Entry::new(SERVICE, ACCOUNT)?)
}

/// `Ok(None)` means "no stored session" — a genuine first run.
///
/// §5.7's warning is the reason this returns a Result rather than an Option: a
/// keychain that is locked or broken must NOT look like a first run, or the user
/// silently re-authenticates on every launch forever and nobody notices.
pub fn load_refresh_token() -> Result<Option<String>, StoreError> {
    match entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

pub fn save_refresh_token(token: &str) -> Result<(), StoreError> {
    Ok(entry()?.set_password(token)?)
}

/// Idempotent: signing out twice, or before ever signing in, is not an error.
pub fn clear_refresh_token() -> Result<(), StoreError> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}
