// Auto-update (Tauri v2 updater plugin) against the API feed in
// `apps/api/src/api/launcher-updates/`.
//
// The check runs HERE rather than from the renderer for one reason: the feed
// host has to follow BOFF_API_URL exactly like `api::base_url()` does, and the
// endpoint list in tauri.conf.json is baked in at build time. Overriding it
// through `updater_builder().endpoints()` is the only place a runtime value can
// win, and that builder only exists in Rust.
//
// The endpoint template is `.../{{target}}-{{arch}}/{{current_version}}`.
// `{{target}}` alone is just the OS ("windows"); the feed is keyed on the full
// platform key ("windows-x86_64"), which is `{{target}}-{{arch}}`. Dropping the
// `-{{arch}}` makes every lookup miss and the launcher silently never updates.

use serde::Serialize;
use tauri::{Emitter, Manager};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::sync::Mutex;

pub const EVENT_UPDATE_PROGRESS: &str = "update://progress";

/// The update found by the last successful check, kept so that pressing
/// «Instalar» does not have to hit the network a second time (and cannot end up
/// installing a different release than the one the banner described).
#[derive(Default)]
pub struct UpdateState {
    pending: Mutex<Option<Update>>,
}

/// What the banner renders. `notes` is the release body from the feed, shown
/// verbatim to the player.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub notes: Option<String>,
    pub date: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateProgress {
    downloaded_bytes: u64,
    /// `None` until the server's Content-Length is known — the UI must show an
    /// indeterminate bar rather than a fake 0 %.
    total_bytes: Option<u64>,
}

fn endpoint() -> String {
    format!(
        "{}/desktop/updates/{{{{target}}}}-{{{{arch}}}}/{{{{current_version}}}}",
        crate::api::base_url()
    )
}

fn updater(app: &tauri::AppHandle) -> Result<tauri_plugin_updater::Updater, String> {
    let url = endpoint()
        .parse()
        .map_err(|e| format!("Endpoint de actualización inválido: {e}"))?;

    // Get the stable per-installation ID for rollout bucketing. This is an opaque
    // random UUID, NOT tied to user identity or hardware. It is used by the API
    // solely to bucket this installation into a deterministic subset of clients
    // for staged rollouts; it is never logged or tracked as telemetry.
    let install_id = crate::install_id::get_or_create(app)?;

    app.updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .header("x-boff-install-id", &install_id)
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())
}

/// Ask the feed whether there is something newer. `Ok(None)` covers BOTH "you
/// are up to date" (the feed answers 204) and, deliberately, nothing else —
/// errors are returned so the caller can log them, but the renderer swallows
/// them: a player who is offline must not see an error banner.
/// A portable build (`BOFF_PORTABLE=1`, see scripts/portable.mjs) is a bare
/// .exe sitting wherever the user dropped it. The updater only knows how to
/// hand an .msi/.exe to Windows' installer, which would silently install a
/// SECOND, installed copy next to the portable one and restart into it — so a
/// portable build reports "up to date" forever and updates by re-downloading
/// the zip.
const PORTABLE: bool = option_env!("BOFF_PORTABLE").is_some();

#[tauri::command]
pub async fn updates_check(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
    if PORTABLE {
        return Ok(None);
    }
    let found = updater(&app)?
        .check()
        .await
        .map_err(|e| format!("No se pudo comprobar si hay actualizaciones: {e}"))?;

    let Some(update) = found else {
        *app.state::<UpdateState>().pending.lock().await = None;
        return Ok(None);
    };

    let info = UpdateInfo {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        notes: update.body.clone().filter(|b| !b.trim().is_empty()),
        date: update.date.map(|d| d.to_string()),
    };
    *app.state::<UpdateState>().pending.lock().await = Some(update);
    Ok(Some(info))
}

/// Where a retained build for `version` is kept.
pub fn backup_path(backup_dir: &std::path::Path, version: &str) -> std::path::PathBuf {
    // The version is a filename component, so anything that could climb out of
    // the directory is flattened rather than trusted.
    let safe: String = version
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '.' || c == '-' { c } else { '_' })
        .collect();
    backup_dir.join(format!("{safe}{}", std::env::consts::EXE_SUFFIX))
}

/// Copy the running binary aside before an update overwrites it.
///
/// Groundwork for D3 only: nothing reverts to this copy yet, and doing so
/// automatically needs a first-launch health signal that cannot be exercised
/// without a real Windows update cycle (see docs/desktop-update-rollback-plan.md).
/// Retaining the build is the half that is safe to land now — without it there is
/// nothing to revert TO, so a rollback path could never be added after the fact
/// for a release already in the wild.
///
/// Copy, never rename: on Windows the running image is locked, and a failure
/// here must not block the update. The caller logs and carries on.
pub fn retain_current_build(
    current_exe: &std::path::Path,
    backup_dir: &std::path::Path,
    version: &str,
) -> Result<std::path::PathBuf, String> {
    std::fs::create_dir_all(backup_dir)
        .map_err(|e| format!("no se pudo crear el directorio de respaldo: {e}"))?;
    let dest = backup_path(backup_dir, version);
    std::fs::copy(current_exe, &dest)
        .map_err(|e| format!("no se pudo respaldar la versión actual: {e}"))?;
    Ok(dest)
}

/// Download, verify the minisign signature, install, and restart into the new
/// build. Does not return on success: `app.restart()` replaces the process.
#[tauri::command]
pub async fn updates_install(app: tauri::AppHandle) -> Result<(), String> {
    if PORTABLE {
        return Err(
            "Esta es la versión portable: descarga el nuevo .zip desde la web para actualizar."
                .to_string(),
        );
    }
    let pending = app.state::<UpdateState>().pending.lock().await.clone();
    let update = match pending {
        Some(update) => update,
        // The banner can outlive its check (the state is cleared on a restart,
        // or the user left the window open for hours), so re-check rather than
        // failing with something the player cannot act on.
        None => updater(&app)?
            .check()
            .await
            .map_err(|e| format!("No se pudo comprobar si hay actualizaciones: {e}"))?
            .ok_or_else(|| "Ya tienes la última versión.".to_string())?,
    };

    // Keep the build we are about to replace. Best-effort by design: a failure
    // to back up is not a reason to refuse an update the user asked for, and the
    // rollback that would consume it is not built yet.
    match (std::env::current_exe(), app.path().app_data_dir()) {
        (Ok(exe), Ok(data_dir)) => {
            let dir = data_dir.join("desktop").join("backup");
            match retain_current_build(&exe, &dir, app.package_info().version.to_string().as_str())
            {
                Ok(path) => eprintln!("[updates] versión anterior respaldada en {}", path.display()),
                Err(e) => eprintln!("[updates] no se pudo respaldar la versión anterior: {e}"),
            }
        }
        _ => eprintln!("[updates] no se localizó el ejecutable actual; no se respaldó nada"),
    }

    let mut downloaded: u64 = 0;
    update
        .download_and_install(
            |chunk, total| {
                downloaded += chunk as u64;
                let _ = app.emit(
                    EVENT_UPDATE_PROGRESS,
                    UpdateProgress {
                        downloaded_bytes: downloaded,
                        total_bytes: total,
                    },
                );
            },
            || {},
        )
        .await
        .map_err(|e| format!("No se pudo instalar la actualización: {e}"))?;

    app.restart();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_endpoint_carries_arch_not_just_target() {
        std::env::set_var("BOFF_API_URL", "https://example.test");
        let url = endpoint();
        std::env::remove_var("BOFF_API_URL");
        assert_eq!(
            url,
            "https://example.test/desktop/updates/{{target}}-{{arch}}/{{current_version}}",
        );
        // The whole point: `{{target}}` on its own resolves to "windows", and
        // the feed is keyed on "windows-x86_64".
        assert!(url.contains("{{target}}-{{arch}}"));
    }
    #[test]
    fn a_retained_build_is_copied_not_moved() {
        let dir = std::env::temp_dir().join(format!("boff-upd-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let exe = dir.join("current.bin");
        std::fs::write(&exe, b"old build").unwrap();

        let backups = dir.join("backup");
        let dest = retain_current_build(&exe, &backups, "1.2.3").unwrap();

        // The running image stays put — on Windows it is locked, and a move
        // would take the app out from under itself.
        assert!(exe.is_file());
        assert_eq!(std::fs::read(&dest).unwrap(), b"old build");

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn a_version_cannot_climb_out_of_the_backup_directory() {
        let dir = std::path::Path::new("/backups");
        let escaped = backup_path(dir, "../../evil");
        // Dots survive because real versions contain them; separators do not,
        // which is what actually keeps the result a single name inside `dir`.
        assert_eq!(escaped.parent().unwrap(), dir);
        assert_eq!(escaped.components().count(), dir.components().count() + 1);
    }
}
