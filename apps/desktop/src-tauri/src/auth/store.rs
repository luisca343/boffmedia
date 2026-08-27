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

// ── Chunking ───────────────────────────────────────────────────────────────
//
// WHY THIS EXISTS, because it is not obvious and it cost a release:
//
// Windows caps a Generic credential's blob at CRED_MAX_CREDENTIAL_BLOB_SIZE
// (2560 bytes) and `keyring` stores the secret as UTF-16 — so 1280 ASCII
// characters, no more, and it rejects a longer write outright with
// `Error::TooLong` BEFORE talking to the credential manager.
//
// A Microsoft refresh token for the `consumers` tenant routinely runs past
// that. The failure was invisible in exactly the worst way: the sign-in
// itself had already succeeded, so the player finished on microsoft.com,
// the code screen closed, and the launcher then asked them to link again at
// the next launch AND at the next pack launch — a "linking that does not
// stick" with nothing on screen to say why.
//
// So a long secret is split across several credential entries — the same
// thing the Azure CLI does on Windows — and the primary key holds a header
// naming how many. Everything below goes through `read_secret`/`write_secret`
// /`delete_secret`; nothing calls `get_password` directly any more.

/// Comfortably under the 1280-character ceiling, so the header arithmetic and
/// any future non-ASCII never brush against it.
const CHUNK_UTF16_UNITS: usize = 1000;

/// Marks the primary entry as a header rather than the secret itself. `@` is
/// not in base64url and cannot open a JWT or an MSA token, so a real secret can
/// never be mistaken for one of these.
const CHUNKED_MARKER: &str = "@@boff-chunks:";

/// A ceiling on the walk, so a corrupt header cannot spin. 32 chunks is ~32k
/// characters — far past anything an OAuth provider will ever mint.
const MAX_CHUNKS: usize = 32;

fn chunk_key(key: &str, index: usize) -> String {
    format!("{key}#{index}")
}

/// Split a secret into pieces that each fit the credential blob. Splits on CHAR
/// boundaries and measures UTF-16 units, because that is what the Windows limit
/// actually counts.
fn split_secret(value: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut current = String::new();
    let mut units = 0usize;
    for ch in value.chars() {
        let width = ch.len_utf16();
        if units + width > CHUNK_UTF16_UNITS && !current.is_empty() {
            out.push(std::mem::take(&mut current));
            units = 0;
        }
        current.push(ch);
        units += width;
    }
    if out.is_empty() || !current.is_empty() {
        out.push(current);
    }
    out
}

/// How many chunks the primary value claims, or None when it is a plain secret.
fn chunk_count(head: &str) -> Option<usize> {
    let rest = head.strip_prefix(CHUNKED_MARKER)?;
    rest.trim().parse::<usize>().ok().filter(|n| *n <= MAX_CHUNKS)
}

/// Best-effort: drop chunk entries from `from` onwards. Used to clean up after a
/// secret that got shorter (or stopped needing chunks at all); a leftover that
/// refuses to delete is harmless, because the header is what decides how many
/// are read back.
fn prune_chunks_from(key: &str, from: usize) {
    for index in from..MAX_CHUNKS {
        let Ok(entry) = entry_for(&chunk_key(key, index)) else {
            return;
        };
        match entry.delete_credential() {
            Ok(()) => {}
            // Nothing there: everything past it is empty too.
            Err(keyring::Error::NoEntry) => return,
            Err(_) => return,
        }
    }
}

/// `Ok(None)` is "nothing stored", including the case of a header whose chunks
/// have gone missing — half a refresh token is worse than none, and asking for
/// a fresh sign-in is the only honest recovery.
fn read_secret(key: &str) -> Result<Option<String>, StoreError> {
    let head = match entry_for(key)?.get_password() {
        Ok(value) => value,
        Err(keyring::Error::NoEntry) => return Ok(None),
        Err(err) => return Err(StoreError::Keyring(err)),
    };
    let Some(count) = chunk_count(&head) else {
        return Ok(Some(head));
    };
    let mut joined = String::new();
    for index in 0..count {
        match entry_for(&chunk_key(key, index))?.get_password() {
            Ok(part) => joined.push_str(&part),
            Err(keyring::Error::NoEntry) => return Ok(None),
            Err(err) => return Err(StoreError::Keyring(err)),
        }
    }
    Ok(Some(joined))
}

/// Chunks are written BEFORE the header and leftovers pruned after, so an
/// interrupted write leaves the previous secret readable rather than a
/// half-assembled one: until the header changes, the old header is what
/// `read_secret` follows.
fn write_secret(key: &str, value: &str) -> Result<(), StoreError> {
    let chunks = split_secret(value);
    if chunks.len() <= 1 {
        entry_for(key)?.set_password(value)?;
        prune_chunks_from(key, 0);
        return Ok(());
    }
    for (index, part) in chunks.iter().enumerate() {
        entry_for(&chunk_key(key, index))?.set_password(part)?;
    }
    entry_for(key)?.set_password(&format!("{CHUNKED_MARKER}{}", chunks.len()))?;
    prune_chunks_from(key, chunks.len());
    Ok(())
}

/// Idempotent, like every clear in this module: deleting twice, or before ever
/// writing, is not an error.
fn delete_secret(key: &str) -> Result<(), StoreError> {
    prune_chunks_from(key, 0);
    match entry_for(key)?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(StoreError::Keyring(err)),
    }
}

pub fn load_refresh_token_for(uuid: &str) -> Result<Option<String>, StoreError> {
    read_secret(&account_key(uuid))
}

pub fn save_refresh_token_for(uuid: &str, token: &str) -> Result<(), StoreError> {
    write_secret(&account_key(uuid), token)
}

pub fn clear_refresh_token_for(uuid: &str) -> Result<(), StoreError> {
    delete_secret(&account_key(uuid))
}

/// `Ok(None)` means "no stored session" — a genuine first run.
///
/// This returns a Result rather than an Option for one reason: a
/// keychain that is locked or broken must NOT look like a first run, or the user
/// silently re-authenticates on every launch forever and nobody notices.
pub fn load_refresh_token() -> Result<Option<String>, StoreError> {
    read_secret(LEGACY_ACCOUNT)
}

/// Idempotent: signing out twice, or before ever signing in, is not an error.
/// Clears the LEGACY entry only — per-account tokens go through
/// `clear_refresh_token_for`.
pub fn clear_refresh_token() -> Result<(), StoreError> {
    delete_secret(LEGACY_ACCOUNT)
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
    read_secret(APP_SESSION)
}

pub fn save_app_session(token: &str) -> Result<(), StoreError> {
    write_secret(APP_SESSION, token)
}

pub fn clear_app_session() -> Result<(), StoreError> {
    delete_secret(APP_SESSION)
}

pub fn load_app_session_for(id: i64) -> Result<Option<String>, StoreError> {
    read_secret(&app_account_key(id))
}

pub fn save_app_session_for(id: i64, token: &str) -> Result<(), StoreError> {
    write_secret(&app_account_key(id), token)
}

pub fn clear_app_session_for(id: i64) -> Result<(), StoreError> {
    delete_secret(&app_account_key(id))
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
    fn a_short_secret_is_stored_whole() {
        // One chunk means `write_secret` takes the plain path and nothing about
        // the on-disk shape changes for the secrets that already fit — which is
        // every app-session JWT and every pre-existing entry.
        let chunks = split_secret("short");
        assert_eq!(chunks, vec!["short".to_string()]);
    }

    #[test]
    fn a_token_past_the_windows_ceiling_is_split() {
        // 2600 ASCII characters: 5200 bytes as UTF-16, comfortably past the
        // 2560-byte blob limit that used to fail the whole sign-in.
        let token = "A".repeat(2600);
        let chunks = split_secret(&token);
        assert_eq!(chunks.len(), 3);
        for chunk in &chunks {
            assert!(chunk.encode_utf16().count() * 2 <= 2560);
        }
        assert_eq!(chunks.concat(), token);
    }

    #[test]
    fn splitting_counts_utf16_units_not_bytes() {
        // An astral char is ONE `char` but TWO UTF-16 units, which is what
        // Windows measures. Counting chars (or bytes) would overshoot the limit
        // in one direction and waste half the blob in the other.
        let value = "\u{1F600}".repeat(600);
        let chunks = split_secret(&value);
        for chunk in &chunks {
            assert!(chunk.encode_utf16().count() <= CHUNK_UTF16_UNITS);
        }
        assert_eq!(chunks.concat(), value);
    }

    #[test]
    fn an_empty_secret_still_produces_one_chunk() {
        assert_eq!(split_secret(""), vec![String::new()]);
    }

    #[test]
    fn a_plain_secret_is_never_read_as_a_header() {
        // The whole scheme rests on this: a real token must not be able to
        // impersonate the chunk header and send the reader off to entries that
        // do not exist.
        assert_eq!(chunk_count("eyJhbGciOiJIUzI1NiJ9.abc"), None);
        assert_eq!(chunk_count("M.C107_BAY.0.U.-Cl0abcdef"), None);
        assert_eq!(chunk_count("@@boff-chunks:3"), Some(3));
    }

    #[test]
    fn a_corrupt_header_does_not_become_an_unbounded_walk() {
        assert_eq!(chunk_count("@@boff-chunks:not-a-number"), None);
        assert_eq!(chunk_count("@@boff-chunks:99999"), None);
    }

    /// The regression this whole module exists for, against the REAL credential
    /// store. Ignored by default because it writes to the machine's keychain,
    /// which a test run has no business doing unattended: `cargo test --
    /// --ignored` when touching the chunking.
    ///
    /// Before chunking, the `write_secret` here failed outright with keyring's
    /// `TooLong`, which is what silently cost players their Microsoft link.
    #[test]
    #[ignore = "writes to the OS credential store"]
    fn a_long_token_survives_a_round_trip_through_the_real_store() {
        let key = "msa-refresh-token:test-chunking";
        // The shape of a real MSA refresh token: long, and ASCII.
        let token: String = std::iter::repeat("M.C107_BAY.0.U.-Cl0abcdefghij")
            .take(120)
            .collect();
        assert!(token.encode_utf16().count() * 2 > 2560, "must exceed the cap");

        write_secret(key, &token).expect("a long secret must be storable");
        assert_eq!(read_secret(key).unwrap().as_deref(), Some(token.as_str()));

        // A shorter secret over the same key must leave no stale chunk behind
        // for the reader to trip over.
        write_secret(key, "short").expect("rewrite");
        assert_eq!(read_secret(key).unwrap().as_deref(), Some("short"));

        delete_secret(key).expect("clear");
        assert_eq!(read_secret(key).unwrap(), None);
    }

    #[test]
    fn chunk_keys_hang_off_the_primary_key() {
        assert_eq!(chunk_key("msa-refresh-token:u1", 2), "msa-refresh-token:u1#2");
    }

    #[test]
    fn the_legacy_key_is_not_reachable_through_a_uuid() {
        // A crafted "uuid" must not be able to address the pre-migration entry,
        // which belongs to whichever account happens to still be stored there.
        assert_ne!(account_key("msa-refresh-token"), LEGACY_ACCOUNT);
    }
}
