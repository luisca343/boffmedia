//! Native file/folder pickers, exposed as commands the renderer invokes. The
//! dialog is opened HERE (Rust), the same pattern the local-pack import/export
//! and image pickers use — there is no file-picker plugin on the JS side of the
//! Tauri boundary. Each resolves to the chosen absolute path, or `null` when the
//! player cancels.

use tauri_plugin_dialog::DialogExt;

use crate::install::InstallFailure;

#[tauri::command]
pub async fn file_picker(app: tauri::AppHandle) -> Result<Option<String>, InstallFailure> {
    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || dialog.file().blocking_pick_file())
        .await
        .map_err(|e| InstallFailure::message(format!("El selector se interrumpió: {e}")))?;
    path_of(chosen)
}

#[tauri::command]
pub async fn folder_picker(app: tauri::AppHandle) -> Result<Option<String>, InstallFailure> {
    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || dialog.file().blocking_pick_folder())
        .await
        .map_err(|e| InstallFailure::message(format!("El selector se interrumpió: {e}")))?;
    path_of(chosen)
}

fn path_of(
    chosen: Option<tauri_plugin_dialog::FilePath>,
) -> Result<Option<String>, InstallFailure> {
    match chosen {
        Some(picked) => Ok(Some(
            picked
                .into_path()
                .map_err(|e| InstallFailure::message(format!("Ruta inválida: {e}")))?
                .to_string_lossy()
                .into_owned(),
        )),
        None => Ok(None),
    }
}
