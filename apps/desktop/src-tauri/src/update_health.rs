// D3, the half that was missing: reverting to the build `retain_current_build`
// kept.
//
// WHY THIS IS NOT SIMPLY "A ROLLBACK BUTTON". The failure it exists for is an
// update that does not START. A build that crashes before its window appears
// cannot show a button, so the decision has to be taken by the NEXT process,
// from state on disk, before any of the code that might be broken runs.
//
// So there are two halves and they live at opposite ends of a launch:
//
//   record_boot()   very early in setup. Counts this attempt, and decides.
//   mark_healthy()  once the RENDERER has mounted. Promotes the version.
//
// Between them is everything that can go wrong. A build that dies in between
// increments the counter and never clears it, so the next launch sees a second
// attempt, and the one after that reverts. Two failed launches rather than one,
// deliberately: a single crash can be a bad driver, a locked file, an antivirus
// scanner mid-write. Reverting on the first would make a transient failure
// permanent by throwing away a good update.
//
// WHAT CANNOT BE TESTED HERE, said plainly. The end-to-end condition -- "the new
// build fails on first launch and the old one comes back" -- needs a real signed
// release, a real install and a deliberately broken binary. No CI exercises
// that, which is exactly why D3 sat unbuilt. What IS tested is the part that
// decides: `decide()` is pure, takes the state and the running version, and
// returns what to do. Every branch below has a test, including the two that
// must NOT revert. The IO around it is deliberately thin.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

/// Two failed launches before reverting. See the header for why not one.
pub const MAX_ATTEMPTS: u32 = 2;

/// `<data_root>/desktop/update-health.json`.
#[derive(Debug, Default, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct UpdateHealth {
    /// The newest version that reached `mark_healthy`. The revert target.
    pub last_good: Option<String>,
    /// The version an update installed, until it proves itself.
    pub pending: Option<String>,
    /// Launches of `pending` that have not reached `mark_healthy`.
    pub attempts: u32,
}

#[derive(Debug, PartialEq)]
pub enum Verdict {
    /// Nothing on trial, or this is not the version that was.
    Nothing,
    /// On trial, and it has attempts left. Carries the attempt number.
    Trying(u32),
    /// Out of attempts, and there is a build to go back to.
    Revert { to: String },
    /// Out of attempts with NO retained build. There is nothing to do but let
    /// it try again -- reverting to nothing would leave the user with no app.
    GiveUp,
}

/// The whole decision, as one pure function.
///
/// `current` is the version of the process running right now, which is the only
/// trustworthy statement about what actually launched. Comparing against
/// `pending` is what makes this safe when a user sidesteps the updater: if they
/// install a third version by hand, `pending` does not match, nothing is on
/// trial, and the counter is not touched.
pub fn decide(state: &UpdateHealth, current: &str, max_attempts: u32) -> Verdict {
    let Some(pending) = state.pending.as_deref() else {
        return Verdict::Nothing;
    };
    if pending != current {
        // The running build is not the one on trial. Someone installed over it,
        // or a revert already happened and this IS the old build.
        return Verdict::Nothing;
    }

    let attempt = state.attempts + 1;
    if attempt <= max_attempts {
        return Verdict::Trying(attempt);
    }

    match state.last_good.as_deref() {
        // Never revert to the version we are already running. It would copy a
        // build over itself, restart, and do it again -- forever.
        Some(good) if good != current => Verdict::Revert { to: good.to_string() },
        _ => Verdict::GiveUp,
    }
}

/// Where the state file lives.
pub fn state_path(root: &Path) -> PathBuf {
    root.join("desktop").join("update-health.json")
}

/// Where retained builds live.
///
/// Under `datadir::data_root`, NOT Tauri's `app_data_dir()`. The first cut of
/// D3 used the latter, which is the only place in the crate that did: it
/// resolves to `%APPDATA%\es.boffmedia.app` while everything else -- settings,
/// install_id, instances -- lives in `%APPDATA%\Boffmedia`. The backup would
/// have been written to one tree and looked for in the other by anyone
/// following the rest of the code.
pub fn backup_dir(root: &Path) -> PathBuf {
    root.join("desktop").join("backup")
}

pub fn load(root: &Path) -> UpdateHealth {
    // A missing or unreadable file is "nothing on trial", never an error: this
    // runs before the window exists, and refusing to start because a JSON file
    // is corrupt would be a worse outage than the one it guards against.
    std::fs::read_to_string(state_path(root))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save(root: &Path, state: &UpdateHealth) -> Result<(), String> {
    let path = state_path(root);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("no se pudo crear {}: {e}", parent.display()))?;
    }
    let body = serde_json::to_string_pretty(state)
        .map_err(|e| format!("no se pudo serializar el estado de actualización: {e}"))?;
    std::fs::write(&path, body)
        .map_err(|e| format!("no se pudo escribir {}: {e}", path.display()))
}

/// Put a version on trial. Called by `updates_install` just before the swap.
pub fn arm(root: &Path, installing: &str, currently_running: &str) -> Result<(), String> {
    let mut state = load(root);
    // The build about to be replaced is, by definition, one that starts: it is
    // the one running this line.
    state.last_good = Some(currently_running.to_string());
    state.pending = Some(installing.to_string());
    state.attempts = 0;
    save(root, &state)
}

/// The renderer mounted, so this version works. Clears the trial.
pub fn mark_healthy(root: &Path, current: &str) -> Result<(), String> {
    let mut state = load(root);
    if state.pending.as_deref() != Some(current) && state.last_good.as_deref() == Some(current) {
        return Ok(()); // Already promoted; nothing to write.
    }
    state.last_good = Some(current.to_string());
    if state.pending.as_deref() == Some(current) {
        state.pending = None;
        state.attempts = 0;
    }
    save(root, &state)
}

/// Count this launch and say what to do. Called early in `setup`.
pub fn record_boot(root: &Path, current: &str) -> Verdict {
    let mut state = load(root);
    let verdict = decide(&state, current, MAX_ATTEMPTS);
    if let Verdict::Trying(n) = verdict {
        state.attempts = n;
        let _ = save(root, &state);
    }
    verdict
}

/// Swap the retained build back into place.
///
/// ON WINDOWS THE RUNNING IMAGE CANNOT BE OVERWRITTEN, but it CAN be renamed --
/// that asymmetry is the whole technique, and it is why this is a rename
/// followed by a copy rather than a single copy. The displaced file is left as
/// `.old` for the next launch to sweep, because it is still locked by this
/// process and cannot be deleted from inside it.
pub fn revert_to(
    root: &Path,
    current_exe: &Path,
    version: &str,
) -> Result<(), String> {
    let backup = crate::updates::backup_path(&backup_dir(root), version);
    if !backup.is_file() {
        return Err(format!(
            "no hay una copia guardada de la versión {version} en {}",
            backup.display()
        ));
    }

    let displaced = current_exe.with_extension("old");
    // A leftover from an earlier revert: now unlocked, so it can go.
    let _ = std::fs::remove_file(&displaced);
    std::fs::rename(current_exe, &displaced)
        .map_err(|e| format!("no se pudo apartar el ejecutable actual: {e}"))?;

    if let Err(e) = std::fs::copy(&backup, current_exe) {
        // Put it back. A failed revert must not leave the user with NO
        // executable, which is a far worse outcome than the bad update.
        let _ = std::fs::rename(&displaced, current_exe);
        return Err(format!("no se pudo restaurar la versión {version}: {e}"));
    }

    let mut state = load(root);
    // The trial is over and it failed. Clearing `pending` is what stops the
    // next launch -- which is the reverted build -- from counting itself.
    state.pending = None;
    state.attempts = 0;
    let _ = save(root, &state);
    Ok(())
}

/// Delete the `.old` left by a revert. Best-effort, on every launch.
pub fn sweep_displaced(current_exe: &Path) {
    let _ = std::fs::remove_file(current_exe.with_extension("old"));
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("boff-health-{}-{tag}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn nothing_is_on_trial_by_default() {
        assert_eq!(decide(&UpdateHealth::default(), "1.0.0", 2), Verdict::Nothing);
    }

    #[test]
    fn a_pending_version_counts_its_launches_then_reverts() {
        let mut s = UpdateHealth {
            last_good: Some("1.0.0".into()),
            pending: Some("1.1.0".into()),
            attempts: 0,
        };
        assert_eq!(decide(&s, "1.1.0", 2), Verdict::Trying(1));
        s.attempts = 1;
        assert_eq!(decide(&s, "1.1.0", 2), Verdict::Trying(2));
        s.attempts = 2;
        assert_eq!(decide(&s, "1.1.0", 2), Verdict::Revert { to: "1.0.0".into() });
    }

    #[test]
    fn one_bad_launch_is_not_enough() {
        // A single crash can be a driver, a locked file, an antivirus scanner.
        // Reverting on the first would make a transient failure permanent.
        let s = UpdateHealth {
            last_good: Some("1.0.0".into()),
            pending: Some("1.1.0".into()),
            attempts: 0,
        };
        assert!(matches!(decide(&s, "1.1.0", 2), Verdict::Trying(_)));
    }

    #[test]
    fn a_version_that_is_not_the_one_on_trial_is_left_alone() {
        // The user installed 1.2.0 by hand over a failing 1.1.0. Counting its
        // launches against 1.1.0's trial would revert a build nobody accused.
        let s = UpdateHealth {
            last_good: Some("1.0.0".into()),
            pending: Some("1.1.0".into()),
            attempts: 5,
        };
        assert_eq!(decide(&s, "1.2.0", 2), Verdict::Nothing);
    }

    #[test]
    fn never_reverts_to_the_version_already_running() {
        // Otherwise: copy the build over itself, restart, decide again, forever.
        let s = UpdateHealth {
            last_good: Some("1.1.0".into()),
            pending: Some("1.1.0".into()),
            attempts: 9,
        };
        assert_eq!(decide(&s, "1.1.0", 2), Verdict::GiveUp);
    }

    #[test]
    fn gives_up_rather_than_reverting_to_nothing() {
        let s = UpdateHealth {
            last_good: None,
            pending: Some("1.1.0".into()),
            attempts: 9,
        };
        assert_eq!(decide(&s, "1.1.0", 2), Verdict::GiveUp);
    }

    #[test]
    fn a_healthy_launch_ends_the_trial() {
        let root = tmp("healthy");
        arm(&root, "1.1.0", "1.0.0").unwrap();
        assert_eq!(record_boot(&root, "1.1.0"), Verdict::Trying(1));

        mark_healthy(&root, "1.1.0").unwrap();
        let s = load(&root);
        assert_eq!(s.pending, None);
        assert_eq!(s.attempts, 0);
        assert_eq!(s.last_good.as_deref(), Some("1.1.0"));
        // And a later launch of the same build is not on trial at all.
        assert_eq!(record_boot(&root, "1.1.0"), Verdict::Nothing);

        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn the_counter_survives_across_launches() {
        // The property the whole feature rests on: nothing in the failing build
        // gets a chance to clear it, because only mark_healthy does.
        let root = tmp("counter");
        arm(&root, "1.1.0", "1.0.0").unwrap();
        assert_eq!(record_boot(&root, "1.1.0"), Verdict::Trying(1));
        assert_eq!(record_boot(&root, "1.1.0"), Verdict::Trying(2));
        assert_eq!(
            record_boot(&root, "1.1.0"),
            Verdict::Revert { to: "1.0.0".into() }
        );
        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn a_corrupt_state_file_does_not_stop_the_app() {
        let root = tmp("corrupt");
        std::fs::create_dir_all(root.join("desktop")).unwrap();
        std::fs::write(state_path(&root), b"{ not json").unwrap();
        assert_eq!(load(&root), UpdateHealth::default());
        assert_eq!(record_boot(&root, "1.0.0"), Verdict::Nothing);
        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn reverting_puts_the_old_build_back_and_keeps_the_new_one_aside() {
        let root = tmp("revert");
        let exe = root.join("app.exe");
        std::fs::write(&exe, b"BROKEN NEW BUILD").unwrap();
        std::fs::create_dir_all(backup_dir(&root)).unwrap();
        std::fs::write(
            crate::updates::backup_path(&backup_dir(&root), "1.0.0"),
            b"GOOD OLD BUILD",
        )
        .unwrap();

        arm(&root, "1.1.0", "1.0.0").unwrap();
        revert_to(&root, &exe, "1.0.0").unwrap();

        assert_eq!(std::fs::read(&exe).unwrap(), b"GOOD OLD BUILD");
        // Renamed, not deleted: on Windows it is still locked by this process.
        assert_eq!(
            std::fs::read(exe.with_extension("old")).unwrap(),
            b"BROKEN NEW BUILD"
        );
        // And the trial is over, so the reverted build does not count itself.
        assert_eq!(load(&root).pending, None);
        assert_eq!(record_boot(&root, "1.0.0"), Verdict::Nothing);

        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn a_failed_revert_leaves_the_app_runnable() {
        // The outcome that must never happen is "no executable at all". If the
        // copy fails after the rename, the rename is undone.
        let root = tmp("failed-revert");
        let exe = root.join("app.exe");
        std::fs::write(&exe, b"NEW BUILD").unwrap();
        // No backup file for 9.9.9 at all.
        let err = revert_to(&root, &exe, "9.9.9").unwrap_err();
        assert!(err.contains("9.9.9"), "unhelpful error: {err}");
        assert_eq!(std::fs::read(&exe).unwrap(), b"NEW BUILD");
        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn the_sweep_removes_a_displaced_build() {
        let root = tmp("sweep");
        let exe = root.join("app.exe");
        std::fs::write(&exe, b"current").unwrap();
        std::fs::write(exe.with_extension("old"), b"displaced").unwrap();
        sweep_displaced(&exe);
        assert!(!exe.with_extension("old").exists());
        assert!(exe.is_file());
        std::fs::remove_dir_all(&root).ok();
    }
}
