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
        "{}/launcher/updates/{{{{target}}}}-{{{{arch}}}}/{{{{current_version}}}}",
        crate::api::base_url()
    )
}

fn updater(app: &tauri::AppHandle) -> Result<tauri_plugin_updater::Updater, String> {
    let url = endpoint()
        .parse()
        .map_err(|e| format!("Endpoint de actualización inválido: {e}"))?;
    app.updater_builder()
        .endpoints(vec![url])
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
            "https://example.test/launcher/updates/{{target}}-{{arch}}/{{current_version}}",
        );
        // The whole point: `{{target}}` on its own resolves to "windows", and
        // the feed is keyed on "windows-x86_64".
        assert!(url.contains("{{target}}-{{arch}}"));
    }
}
