// The roster: which accounts this launcher knows about, and which one is
// active. Deliberately NOT where the secrets live.
//
// A refresh token is effectively the account (store.rs §5.7), so it stays in
// the OS credential store, one entry per UUID. What is left over — a UUID, a
// username, and a pointer to the active one — is public information that the
// player's own skin URL already exposes, and it needs to be enumerable: a
// keychain can be asked for a key it is given, but not "list everything you
// hold for this app". Without a roster on disk there is no way to show a
// switcher at all without the player retyping every account.
//
// The consequence to keep in mind: this file and the credential store can
// disagree. A player who clears their keychain leaves a roster full of
// accounts whose tokens are gone, so `switch` treats a missing token as
// "signed out" and prunes the entry rather than erroring.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RosterEntry {
    pub uuid: String,
    pub username: String,
    /// Cached so the switcher can draw a face for an account with no live
    /// session. `default` because rosters written before avatars existed have
    /// no such field and must still parse — losing the whole roster over a
    /// cosmetic would sign every account out.
    #[serde(default)]
    pub skin_url: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Roster {
    /// UUID of the active account, when there is one.
    #[serde(default)]
    pub active: Option<String>,
    #[serde(default)]
    pub accounts: Vec<RosterEntry>,
}

fn roster_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(crate::datadir::data_root(app)?.join("accounts.json"))
}

/// Best-effort by design: a corrupt or unreadable roster reads as "no accounts
/// known", which shows the sign-in screen. Failing the whole launcher because a
/// list of usernames would not parse is the wrong trade.
pub fn load(app: &tauri::AppHandle) -> Roster {
    let Ok(path) = roster_path(app) else {
        return Roster::default();
    };
    let Ok(raw) = std::fs::read(&path) else {
        return Roster::default();
    };
    serde_json::from_slice(&raw).unwrap_or_default()
}

pub fn save(app: &tauri::AppHandle, roster: &Roster) -> Result<(), String> {
    let path = roster_path(app).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let raw = serde_json::to_vec_pretty(roster).map_err(|e| e.to_string())?;
    // tmp + rename, like the manifest writer: a crash mid-write must not leave
    // a roster that parses as empty and hides every account the player has.
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, raw).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

/// Add or update an account and make it the active one. Matching on UUID rather
/// than username: a player may rename, and re-adding an account after a rename
/// must update the name in place instead of listing them twice.
pub fn upsert_active(roster: &mut Roster, uuid: &str, username: &str, skin_url: &str) {
    match roster.accounts.iter_mut().find(|a| a.uuid == uuid) {
        Some(existing) => {
            existing.username = username.to_string();
            // An empty incoming skin does NOT clear a cached one. "We did not
            // learn a skin this time" and "this player removed their skin" look
            // identical here, and blanking the face on every restore that
            // happens to come back thin is the worse of the two mistakes.
            if !skin_url.is_empty() {
                existing.skin_url = skin_url.to_string();
            }
        }
        None => roster.accounts.push(RosterEntry {
            uuid: uuid.to_string(),
            username: username.to_string(),
            skin_url: skin_url.to_string(),
        }),
    }
    roster.active = Some(uuid.to_string());
}

/// Drop an account. Returns the UUID that should become active — the first one
/// left, or None when that was the last account.
pub fn remove(roster: &mut Roster, uuid: &str) -> Option<String> {
    roster.accounts.retain(|a| a.uuid != uuid);
    if roster.active.as_deref() == Some(uuid) {
        roster.active = roster.accounts.first().map(|a| a.uuid.clone());
    }
    roster.active.clone()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn re_adding_an_account_updates_its_name_instead_of_duplicating_it() {
        let mut roster = Roster::default();
        upsert_active(&mut roster, "u1", "Steve", "");
        upsert_active(&mut roster, "u1", "SteveRenamed", "");
        assert_eq!(roster.accounts.len(), 1);
        assert_eq!(roster.accounts[0].username, "SteveRenamed");
        assert_eq!(roster.active.as_deref(), Some("u1"));
    }

    #[test]
    fn a_thin_upsert_does_not_erase_a_cached_skin() {
        // A restore that comes back without a skin URL must not blank the face
        // the switcher has been drawing — see the comment in upsert_active.
        let mut roster = Roster::default();
        upsert_active(&mut roster, "u1", "Steve", "https://textures.test/abc");
        upsert_active(&mut roster, "u1", "Steve", "");
        assert_eq!(roster.accounts[0].skin_url, "https://textures.test/abc");
    }

    #[test]
    fn a_new_skin_replaces_the_cached_one() {
        let mut roster = Roster::default();
        upsert_active(&mut roster, "u1", "Steve", "https://textures.test/old");
        upsert_active(&mut roster, "u1", "Steve", "https://textures.test/new");
        assert_eq!(roster.accounts[0].skin_url, "https://textures.test/new");
    }

    #[test]
    fn a_roster_written_before_avatars_still_parses() {
        // Real accounts.json from an older build. If this stops deserialising,
        // every account on that machine silently disappears.
        let raw = br#"{"active":"u1","accounts":[{"uuid":"u1","username":"Steve"}]}"#;
        let roster: Roster = serde_json::from_slice(raw).expect("legacy roster must parse");
        assert_eq!(roster.accounts.len(), 1);
        assert_eq!(roster.accounts[0].skin_url, "");
    }

    #[test]
    fn removing_the_active_account_promotes_another() {
        let mut roster = Roster::default();
        upsert_active(&mut roster, "u1", "Steve", "");
        upsert_active(&mut roster, "u2", "Alex", "");
        assert_eq!(roster.active.as_deref(), Some("u2"));

        let next = remove(&mut roster, "u2");
        assert_eq!(next.as_deref(), Some("u1"));
        assert_eq!(roster.active.as_deref(), Some("u1"));
    }

    #[test]
    fn removing_an_inactive_account_leaves_the_active_one_alone() {
        let mut roster = Roster::default();
        upsert_active(&mut roster, "u1", "Steve", "");
        upsert_active(&mut roster, "u2", "Alex", "");
        let next = remove(&mut roster, "u1");
        assert_eq!(next.as_deref(), Some("u2"));
        assert_eq!(roster.accounts.len(), 1);
    }

    #[test]
    fn removing_the_last_account_leaves_nothing_active() {
        let mut roster = Roster::default();
        upsert_active(&mut roster, "u1", "Steve", "");
        assert_eq!(remove(&mut roster, "u1"), None);
        assert!(roster.accounts.is_empty());
        assert!(roster.active.is_none());
    }
}
