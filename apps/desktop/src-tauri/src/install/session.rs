// The auth bridge, and the one place the Minecraft access token touches the
// launch path.
//
// WHY THIS IS NOT `moj::Installer::set_auth_msa`
// ----------------------------------------------
// portablemc's online auth path is built around `msa::Account`, which is
// produced and stored by `msa::Database` — and that database is an on-disk JSON
// file holding the refresh AND access tokens in plaintext. HANDOFF §5.7 rules
// that out explicitly: the refresh token is effectively the account, it lives in
// the OS credential store (auth/store.rs), and the access token is never
// persisted at all. Adopting `set_auth_msa` would mean adopting `msa::Account`,
// which we cannot construct without going through that database.
//
// So the installer is configured OFFLINE — which is what actually determines the
// correct `--uuid` and `--username`, the two values portablemc bakes into the
// command line — and the remaining three online values are patched into
// `Game.game_args` in memory, after `install()` returns.
//
// This works because moj/mod.rs:516-531 already substituted every auth
// placeholder: with offline auth `auth_access_token`, `auth_xuid`, `user_type`
// and `auth_session` all resolve to the EMPTY STRING. The flags are therefore
// present in `game_args` with empty values, and only the values need filling —
// no argument is ever added or removed here.
//
// The token goes from AuthState into a process argv and nowhere else: not to
// disk, not over IPC, not into a log line.

use portablemc::base;
use uuid::Uuid;

use crate::auth::msa::McSession;

use super::InstallFailure;

pub struct GameSession {
    pub uuid: Uuid,
    pub username: String,
    access_token: String,
    xuid: String,
}

impl GameSession {
    /// `McSession.uuid` is dashed (auth/msa.rs normalises it); portablemc wants
    /// a `Uuid`, and the legacy `--session` argument wants it undashed. Both
    /// come from this one parse.
    pub fn from_mc(session: &McSession) -> Result<Self, InstallFailure> {
        let uuid = Uuid::parse_str(&session.uuid).map_err(|e| {
            InstallFailure::needs_signin(format!("Tu perfil de Minecraft no es válido: {e}"))
        })?;
        Ok(Self {
            uuid,
            username: session.username.clone(),
            access_token: session.access_token.clone(),
            xuid: session.xuid.clone(),
        })
    }
}

/// Fill in the online auth values portablemc left empty.
///
/// Patched by FLAG INDEX, not by value: the empty placeholders are
/// indistinguishable from each other, so the only safe anchor is the flag that
/// precedes each one. An unknown flag is left alone.
pub fn patch_game_args(game: &mut base::Game, session: &GameSession) {
    let simple = session.uuid.as_simple().to_string();
    let mut index = 0;

    while index + 1 < game.game_args.len() {
        let value = match game.game_args[index].as_str() {
            "--accessToken" => Some(session.access_token.clone()),
            "--xuid" => Some(session.xuid.clone()),
            // §6.2 — `msa` for a Microsoft account. `mojang`/`legacy` are dead.
            "--userType" => Some("msa".to_string()),
            // Pre-1.6 versions take one combined argument instead. Only filled
            // when the version actually declares it.
            "--session" => Some(format!("token:{}:{simple}", session.access_token)),
            _ => None,
        };

        if let Some(value) = value {
            game.game_args[index + 1] = value;
            index += 2;
        } else {
            index += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn game(args: &[&str]) -> base::Game {
        base::Game {
            jvm_file: PathBuf::from("java"),
            mc_dir: PathBuf::from("."),
            main_class: "net.minecraft.client.main.Main".into(),
            jvm_args: Vec::new(),
            game_args: args.iter().map(|a| a.to_string()).collect(),
        }
    }

    fn session() -> GameSession {
        GameSession {
            uuid: Uuid::parse_str("11111111-2222-3333-4444-555555555555").unwrap(),
            username: "Boff".into(),
            access_token: "TOKEN".into(),
            xuid: "9876".into(),
        }
    }

    #[test]
    fn fills_the_empty_placeholders_left_by_offline_auth() {
        let mut g = game(&[
            "--username",
            "Boff",
            "--uuid",
            "1111",
            "--accessToken",
            "",
            "--xuid",
            "",
            "--userType",
            "",
        ]);
        patch_game_args(&mut g, &session());
        assert_eq!(g.game_args[5], "TOKEN");
        assert_eq!(g.game_args[7], "9876");
        assert_eq!(g.game_args[9], "msa");
        // Nothing added, nothing removed.
        assert_eq!(g.game_args.len(), 10);
    }

    #[test]
    fn legacy_session_argument_gets_the_undashed_uuid() {
        let mut g = game(&["--session", ""]);
        patch_game_args(&mut g, &session());
        assert_eq!(
            g.game_args[1],
            "token:TOKEN:11111111222233334444555555555555"
        );
    }

    #[test]
    fn a_flag_shaped_value_is_not_mistaken_for_a_flag() {
        // Skipping past the value we just wrote is what prevents this: a token
        // that happened to read "--xuid" must not be treated as the next flag.
        let mut g = game(&["--accessToken", "", "--xuid", ""]);
        patch_game_args(&mut g, &session());
        assert_eq!(g.game_args[1], "TOKEN");
        assert_eq!(g.game_args[3], "9876");
    }

    #[test]
    fn unknown_flags_are_left_untouched() {
        let mut g = game(&["--width", "1280", "--userType", ""]);
        patch_game_args(&mut g, &session());
        assert_eq!(g.game_args[1], "1280");
        assert_eq!(g.game_args[3], "msa");
    }
}
