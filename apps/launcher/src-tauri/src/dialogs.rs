//! Native file/folder pickers, exposed as commands the renderer invokes. The
//! dialog is opened HERE (Rust), the same pattern the local-pack import/export
//! and image pickers use — there is no file-picker plugin on the JS side of the
//! Tauri boundary. Each resolves to the chosen absolute path, or `null` when the
//! player cancels.

use std::collections::HashMap;
use std::fs::File;
use std::io::{BufWriter, Write};
use std::sync::Mutex;

use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

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

// ── Streamed save (tool exports) ─────────────────────────────────────────────
//
// The Schematic Compat tool can emit a multi-GB `.prefab`. Handing that back as
// one `invoke` argument would serialise the whole payload into a single IPC
// message — so instead the renderer opens a session, pushes chunks, and closes
// it. Only one chunk is ever in flight, and nothing buffers the full file on
// either side of the boundary.
//
// Sessions are keyed by an opaque token; a renderer that dies mid-write just
// leaves an entry behind, which costs one open file handle until the app exits.
// That is deliberate: silently deleting a half-written file the user chose is
// worse than leaving it for them to see.

#[derive(Default)]
pub struct SaveSessions(Mutex<HashMap<String, BufWriter<File>>>);

/// Native save dialog. Returns the chosen absolute path, or `null` on cancel.
#[tauri::command]
pub async fn save_dialog(
    app: tauri::AppHandle,
    suggested_name: String,
    filters: Option<Vec<(String, Vec<String>)>>,
) -> Result<Option<String>, InstallFailure> {
    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        let mut builder = dialog.file().set_file_name(&suggested_name);
        for (name, extensions) in filters.unwrap_or_default() {
            let refs: Vec<&str> = extensions.iter().map(String::as_str).collect();
            builder = builder.add_filter(&name, &refs);
        }
        builder.blocking_save_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("El selector se interrumpió: {e}")))?;
    path_of(chosen)
}

/// Truncates/creates the file and returns the token the chunk calls use.
#[tauri::command]
pub fn save_stream_begin(
    sessions: tauri::State<'_, SaveSessions>,
    path: String,
) -> Result<String, InstallFailure> {
    let file = File::create(&path)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear «{path}»: {e}")))?;
    let token = Uuid::new_v4().to_string();
    sessions
        .0
        .lock()
        .map_err(|_| InstallFailure::message("El estado de guardado quedó envenenado"))?
        .insert(token.clone(), BufWriter::new(file));
    Ok(token)
}

/// Appends one chunk. The renderer sends these strictly in order.
#[tauri::command]
pub fn save_stream_chunk(
    sessions: tauri::State<'_, SaveSessions>,
    token: String,
    chunk: Vec<u8>,
) -> Result<(), InstallFailure> {
    let mut guard = sessions
        .0
        .lock()
        .map_err(|_| InstallFailure::message("El estado de guardado quedó envenenado"))?;
    let writer = guard
        .get_mut(&token)
        .ok_or_else(|| InstallFailure::message("Sesión de guardado desconocida o ya cerrada"))?;
    writer
        .write_all(&chunk)
        .map_err(|e| InstallFailure::message(format!("Error al escribir en disco: {e}")))
}

/// Flushes and closes. Dropping the writer without flushing would silently lose
/// the tail of the file, so the flush error is surfaced rather than ignored.
#[tauri::command]
pub fn save_stream_finish(
    sessions: tauri::State<'_, SaveSessions>,
    token: String,
) -> Result<(), InstallFailure> {
    let mut writer = sessions
        .0
        .lock()
        .map_err(|_| InstallFailure::message("El estado de guardado quedó envenenado"))?
        .remove(&token)
        .ok_or_else(|| InstallFailure::message("Sesión de guardado desconocida o ya cerrada"))?;
    writer
        .flush()
        .map_err(|e| InstallFailure::message(format!("Error al cerrar el archivo: {e}")))
}

/// Drops the session. The partial file stays on disk on purpose (see above).
#[tauri::command]
pub fn save_stream_abort(
    sessions: tauri::State<'_, SaveSessions>,
    token: String,
) -> Result<(), InstallFailure> {
    sessions
        .0
        .lock()
        .map_err(|_| InstallFailure::message("El estado de guardado quedó envenenado"))?
        .remove(&token);
    Ok(())
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
