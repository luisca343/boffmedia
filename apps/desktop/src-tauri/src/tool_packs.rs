//! A tool's own heavy-art bundle, resolved through `boffasset://` AHEAD of the
//! per-file network path `tool_assets.rs` implements.
//!
//! # Layout
//!
//! Everything lives under `data_root/tool-packs/`:
//!
//! ```text
//! tool-packs/
//!   index.json         cached copy of <web_base_url>/boffmedia/tools/packs/index.json
//!   index.etag         sidecar for the conditional GET above
//!   <tool>/
//!     current           a TEXT file holding the installed version string
//!     <version>/        the extracted pack, rooted the same way the zip is
//!     <version>.zip.part  transient — never survives a finished or cancelled install
//! ```
//!
//! `current` is a file, not a symlink: Windows symlinks need a privilege this
//! app does not ask for. It is written last, via a `.part` + rename, so a
//! reader can never observe a pointer naming a version whose directory is not
//! fully there yet (D-08).
//!
//! # Resolution order
//!
//! `tool_assets::handle()` calls `resolve()` here BEFORE it touches the asset
//! cache or `is_revalidated()`. Once a pack is installed, its own files ARE
//! the version of record — revalidating them against the network would
//! reintroduce exactly the freeze the `?v=` stamp exists to prevent, so a
//! pack hit ignores the query string entirely (D-10). A cold codex grid asks
//! for ~300 paths, so the `<tool>/current` pointer is memoised in a static
//! `RwLock`, filled lazily and invalidated by `install`/`remove` (D-09) —
//! nothing here re-reads that file per request.
//!
//! # Cancellation
//!
//! One `Arc<AtomicBool>` per tool, held in the managed `PackState`, checked
//! once per downloaded chunk and once per extracted zip entry (D-12). On
//! cancel or on any failure the `.part` file and the partial `<version>/`
//! directory are both removed, so `current` can never end up pointing at
//! (or racing against) a half-extracted tree.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock, RwLock};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::Emitter;

use crate::install::files::hex;
use crate::tool_assets::{cache_dir, client, pack_client, web_base_url};

pub const EVENT_PROGRESS: &str = "pack://progress";
pub const EVENT_DONE: &str = "pack://done";
pub const EVENT_ERROR: &str = "pack://error";

/// A hard ceiling on one pack download, well above the ~40-50 MB the design
/// estimates (D-11) and matched to the asset cache's own cap — a broken or
/// hostile index entry must not be able to fill the player's disk.
const MAX_PACK_BYTES: u64 = 512 * 1024 * 1024;

// ── Wire types (apps/desktop/src/services/types.ts) ────────────────────────
// Field names and casing must match EXACTLY — see the "Tool asset packs"
// section there.

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolPackInstalled {
    pub version: String,
    pub bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolPackAvailable {
    pub version: String,
    pub bytes: u64,
    pub sha256: String,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolPackSource {
    Cached,
    Network,
    Offline,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolPackStatus {
    pub installed: Option<ToolPackInstalled>,
    pub available: Option<ToolPackAvailable>,
    pub source: ToolPackSource,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolPackSummary {
    pub tool: String,
    pub version: String,
    pub bytes: u64,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
enum ToolPackPhase {
    Download,
    Verify,
    Extract,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload<'a> {
    tool: &'a str,
    downloaded: u64,
    total: u64,
    phase: ToolPackPhase,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DoneEvent {
    tool: String,
    version: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorEvent {
    tool: String,
    message: String,
}

// ── The published index (RF2's index.json) ─────────────────────────────────
// Rust reads only this — never `pack.toon` (D-07). Unknown fields (like
// `builtAt`, which nothing here needs) are ignored rather than modelled.

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackIndexEntry {
    tool: String,
    version: String,
    url: String,
    bytes: u64,
    sha256: String,
}

#[derive(Debug, Clone, Deserialize, Default)]
struct PackIndex {
    #[serde(default)]
    packs: Vec<PackIndexEntry>,
}

// ── Managed state: one cancel flag per tool currently installing ───────────

#[derive(Default)]
pub struct PackState {
    cancel: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

impl PackState {
    /// Registers a fresh, unset flag for `tool`, replacing any left over from
    /// a previous install — a stale flag from a finished install must never
    /// cancel the next one.
    fn begin(&self, tool: &str) -> Arc<AtomicBool> {
        let flag = Arc::new(AtomicBool::new(false));
        self.cancel
            .lock()
            .unwrap_or_else(|p| p.into_inner())
            .insert(tool.to_string(), flag.clone());
        flag
    }

    /// A no-op, not an error, when nothing is installing for `tool` — the
    /// renderer may call this from a gate that already moved on.
    fn request_cancel(&self, tool: &str) {
        if let Some(flag) = self.cancel.lock().unwrap_or_else(|p| p.into_inner()).get(tool) {
            flag.store(true, Ordering::SeqCst);
        }
    }
}

// ── Paths ────────────────────────────────────────────────────────────────

fn packs_root(app: &tauri::AppHandle) -> Option<PathBuf> {
    let dir = crate::datadir::data_root(app).ok()?.join("tool-packs");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

/// Sum of every file's size under `dir`, recursively. Used only where a
/// human is about to look at the number (a status check, the Settings
/// storage list) — never on the `boffasset://` hot path.
fn dir_bytes(dir: &Path) -> u64 {
    let mut total = 0u64;
    let mut stack = vec![dir.to_path_buf()];
    while let Some(current) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&current) else {
            continue;
        };
        for entry in entries.flatten() {
            let Ok(meta) = entry.metadata() else { continue };
            if meta.is_dir() {
                stack.push(entry.path());
            } else {
                total += meta.len();
            }
        }
    }
    total
}

// ── The published index, fetched and cached like a revalidated asset ──────
// Deliberately NOT routed through `tool_assets::resolve()`: that path exists
// to serve BYTES to the renderer through the scheme, while this is Rust's
// own read of the index to answer `tool_packs_status`/`_install`. Both reuse
// the same `client()` and the same conditional-GET shape, nothing else.

async fn fetch_index(app: &tauri::AppHandle) -> (Option<PackIndex>, ToolPackSource) {
    let Some(root) = packs_root(app) else {
        return (None, ToolPackSource::Offline);
    };
    let index_file = root.join("index.json");
    let etag_file = root.join("index.etag");

    let etag = tokio::fs::read_to_string(&etag_file)
        .await
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let url = format!("{}/boffmedia/tools/packs/index.json", web_base_url());
    let mut req = client().get(&url);
    if let Some(etag) = &etag {
        req = req.header(reqwest::header::IF_NONE_MATCH, etag);
    }

    match req.send().await {
        Ok(res) if res.status() == reqwest::StatusCode::NOT_MODIFIED => cached_index(&index_file).await,
        Ok(res) if res.status().is_success() => {
            let new_etag = res
                .headers()
                .get(reqwest::header::ETAG)
                .and_then(|v| v.to_str().ok())
                .map(str::to_string);
            match res.text().await {
                Ok(text) => {
                    let parsed = serde_json::from_str(&text).ok();
                    let _ = tokio::fs::write(&index_file, &text).await;
                    if let Some(etag) = new_etag {
                        let _ = tokio::fs::write(&etag_file, etag).await;
                    }
                    (parsed, ToolPackSource::Network)
                }
                // A response we could not even read as text: the cached copy,
                // if any, is still a better answer than nothing.
                Err(_) => cached_index(&index_file).await,
            }
        }
        // Any other status, or no connection at all: never an error to the
        // renderer (RF3's contract) — just "nothing new to offer".
        _ => cached_index(&index_file).await,
    }
}

async fn cached_index(index_file: &Path) -> (Option<PackIndex>, ToolPackSource) {
    match tokio::fs::read_to_string(index_file).await {
        Ok(text) => (serde_json::from_str(&text).ok(), ToolPackSource::Cached),
        Err(_) => (None, ToolPackSource::Offline),
    }
}

// ── Resolution cache (D-09) ─────────────────────────────────────────────

/// Keyed by the tool's OWN directory rather than its bare name: the pointer
/// file lives at `<tool_dir>/current`, and keying on the full path is what
/// keeps this static safe to exercise from tests with different roots
/// running in the same process.
fn pack_cache() -> &'static RwLock<HashMap<PathBuf, Option<PathBuf>>> {
    static CACHE: OnceLock<RwLock<HashMap<PathBuf, Option<PathBuf>>>> = OnceLock::new();
    CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

fn cached_version_dir(tool_dir: &Path) -> Option<PathBuf> {
    if let Some(hit) = pack_cache()
        .read()
        .unwrap_or_else(|p| p.into_inner())
        .get(tool_dir)
    {
        return hit.clone();
    }
    let resolved = std::fs::read_to_string(tool_dir.join("current"))
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .map(|version| tool_dir.join(version));
    pack_cache()
        .write()
        .unwrap_or_else(|p| p.into_inner())
        .insert(tool_dir.to_path_buf(), resolved.clone());
    resolved
}

fn invalidate(tool_dir: &Path) {
    pack_cache().write().unwrap_or_else(|p| p.into_inner()).remove(tool_dir);
}

/// Pure path arithmetic, with no existence check — the seam `resolve()`
/// below builds on. `path` is already the sanitized `boffasset://` request
/// path (leading slash, no `..`, no backslash); this only asks whether it
/// falls under an installed tool's tree, and if so, where.
fn resolve_under(root: &Path, path: &str) -> Option<PathBuf> {
    let rest = path.strip_prefix("/boffmedia/tools/")?;
    let (tool, sub) = rest.split_once('/')?;
    if tool.is_empty() || sub.is_empty() {
        return None;
    }
    let version_dir = cached_version_dir(&root.join(tool))?;
    Some(version_dir.join(sub))
}

/// Maps a `boffasset://` request path to a file inside an installed pack.
/// `None` means "no pack has this" — the caller falls back to the asset
/// cache / network path, same as if this module did not exist. There is no
/// query parameter here at all: a pack hit is already version-keyed, so the
/// `?v=` stamp `tool_assets.rs` keys the loose-file cache on is simply never
/// looked at for a pack (D-10).
pub fn resolve(app: &tauri::AppHandle, path: &str) -> Option<PathBuf> {
    let root = packs_root(app)?;
    let candidate = resolve_under(&root, path)?;
    candidate.is_file().then_some(candidate)
}

// ── Zip entry validation (D-06, T13) ────────────────────────────────────

/// Windows reserved device names — refused with or without an extension,
/// case-insensitively, exactly as the OS treats them.
const RESERVED_NAMES: [&str; 22] = [
    "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
    "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/// Validates one zip entry name against `boffmedia/tools/<tool>/` and, if it
/// belongs there, returns the path to extract it to — relative to the
/// pack's `<version>/` directory.
///
/// `None` covers two different things on purpose, both handled the same
/// way (skip, never write): an entry for a DIFFERENT tool or for
/// provenance (`pack.toon` at the zip root), and an entry crafted to escape
/// the target directory. Refusing to reuse `mrpack.rs`'s private
/// `is_valid_relative` is deliberate (D-06's design note): these bytes come
/// off the network, not from a file the player chose, and need the fuller
/// Windows-specific checks below.
fn safe_entry(name: &str, tool: &str) -> Option<PathBuf> {
    // A literal backslash is refused outright rather than normalised away —
    // a zip crafted for this scheme never needs one, since entries are
    // written by `pack-tool-assets.mjs` with forward slashes only.
    if name.contains('\\') {
        return None;
    }
    let prefix = format!("boffmedia/tools/{tool}/");
    let rel = name.strip_prefix(prefix.as_str())?;
    if rel.is_empty() || rel.starts_with('/') {
        return None;
    }
    // A drive letter (`C:/...`) surviving the prefix strip is only possible
    // if the entry never really started with the prefix at all in spirit —
    // still explicit, since "strict rather than clever" is the rule
    // `tool_assets.rs::sanitize` sets for anything off the network.
    if rel.as_bytes().get(1) == Some(&b':') {
        return None;
    }

    let mut out = PathBuf::new();
    for seg in rel.split('/') {
        if seg.is_empty() || seg == "." || seg == ".." {
            return None;
        }
        if seg.ends_with('.') || seg.ends_with(' ') {
            return None;
        }
        let stem = seg.split('.').next().unwrap_or(seg).to_ascii_uppercase();
        if RESERVED_NAMES.contains(&stem.as_str()) {
            return None;
        }
        out.push(seg);
    }
    Some(out)
}

// ── Extraction ───────────────────────────────────────────────────────────

#[derive(Debug)]
enum ExtractError {
    Cancelled,
    Io(String),
}

/// Synchronous by necessity (the `zip` crate reads a `Seek`-able file, not a
/// stream) — always run inside `spawn_blocking`. Checks `cancel` once per
/// entry (T16); an entry `safe_entry` refuses is silently skipped rather
/// than failing the whole install, which is strictly safer than aborting
/// with a half-written tree and costs nothing but that one file.
fn extract_zip(part: &Path, tool: &str, version_dir: &Path, cancel: &AtomicBool) -> Result<(), ExtractError> {
    let file = std::fs::File::open(part).map_err(|e| ExtractError::Io(e.to_string()))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| ExtractError::Io(e.to_string()))?;

    for i in 0..archive.len() {
        if cancel.load(Ordering::SeqCst) {
            return Err(ExtractError::Cancelled);
        }
        let mut entry = archive.by_index(i).map_err(|e| ExtractError::Io(e.to_string()))?;
        let name = entry.name().to_string();
        let Some(rel) = safe_entry(&name, tool) else {
            continue;
        };
        let dest = version_dir.join(&rel);

        if entry.is_dir() {
            std::fs::create_dir_all(&dest).map_err(|e| ExtractError::Io(e.to_string()))?;
            continue;
        }
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent).map_err(|e| ExtractError::Io(e.to_string()))?;
        }
        let mut out = std::fs::File::create(&dest).map_err(|e| ExtractError::Io(e.to_string()))?;
        std::io::copy(&mut entry, &mut out).map_err(|e| ExtractError::Io(e.to_string()))?;
    }
    Ok(())
}

fn cleanup_partial(part: &Path, version_dir: &Path) {
    let _ = std::fs::remove_file(part);
    let _ = std::fs::remove_dir_all(version_dir);
}

#[derive(Debug)]
enum InstallOutcome {
    Cancelled,
    Failed(String),
}

/// Extract, then clean up on ANY outcome that is not a clean success — a
/// cancel and an I/O failure leave the tree in the same "as if this install
/// never started" state (X6), so both branches call the same cleanup.
fn finish_extraction(
    part: &Path,
    tool: &str,
    version_dir: &Path,
    cancel: &AtomicBool,
) -> Result<(), InstallOutcome> {
    match extract_zip(part, tool, version_dir, cancel) {
        Ok(()) => {
            let _ = std::fs::remove_file(part);
            Ok(())
        }
        Err(ExtractError::Cancelled) => {
            cleanup_partial(part, version_dir);
            Err(InstallOutcome::Cancelled)
        }
        Err(ExtractError::Io(message)) => {
            cleanup_partial(part, version_dir);
            Err(InstallOutcome::Failed(message))
        }
    }
}

// ── Install: download, verify, extract, publish the pointer ───────────────

/// The whole install for one pack entry, with the `AppHandle`/event
/// plumbing factored out into `on_progress` — the same seam `tool_assets.rs`
/// uses (`download_from(base, client, ..)`, D-15) so this can be driven from
/// a test without a real Tauri context.
async fn install_pack_files(
    base: &str,
    client: &reqwest::Client,
    tool_dir: &Path,
    entry: &PackIndexEntry,
    cancel: &Arc<AtomicBool>,
    mut on_progress: impl FnMut(u64, u64, ToolPackPhase),
) -> Result<(), InstallOutcome> {
    tokio::fs::create_dir_all(tool_dir)
        .await
        .map_err(|e| InstallOutcome::Failed(format!("No se pudo crear {}: {e}", tool_dir.display())))?;

    let part = tool_dir.join(format!("{}.zip.part", entry.version));
    let version_dir = tool_dir.join(&entry.version);

    let url = format!("{base}{}", entry.url);
    let mut res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| InstallOutcome::Failed(format!("No se pudo descargar el pack: {e}")))?;
    if !res.status().is_success() {
        return Err(InstallOutcome::Failed(format!(
            "El servidor respondió {} al pedir el pack.",
            res.status()
        )));
    }

    let mut file = tokio::fs::File::create(&part)
        .await
        .map_err(|e| InstallOutcome::Failed(format!("No se pudo escribir {}: {e}", part.display())))?;
    let mut hasher = Sha256::new();
    let mut downloaded: u64 = 0;
    let total = entry.bytes;

    loop {
        if cancel.load(Ordering::SeqCst) {
            drop(file);
            cleanup_partial(&part, &version_dir);
            return Err(InstallOutcome::Cancelled);
        }
        use tokio::io::AsyncWriteExt as _;
        match res.chunk().await {
            Ok(Some(chunk)) => {
                downloaded += chunk.len() as u64;
                if downloaded > MAX_PACK_BYTES {
                    drop(file);
                    cleanup_partial(&part, &version_dir);
                    return Err(InstallOutcome::Failed(
                        "El pack supera el tamaño máximo permitido.".to_string(),
                    ));
                }
                hasher.update(&chunk);
                if let Err(e) = file.write_all(&chunk).await {
                    drop(file);
                    cleanup_partial(&part, &version_dir);
                    return Err(InstallOutcome::Failed(format!("No se pudo escribir el pack: {e}")));
                }
                on_progress(downloaded, total, ToolPackPhase::Download);
            }
            Ok(None) => break,
            Err(e) => {
                drop(file);
                cleanup_partial(&part, &version_dir);
                return Err(InstallOutcome::Failed(format!("Se cortó la descarga del pack: {e}")));
            }
        }
    }
    drop(file);

    let digest = hex(&hasher.finalize());
    if digest != entry.sha256.to_lowercase() {
        cleanup_partial(&part, &version_dir);
        return Err(InstallOutcome::Failed(
            "El pack descargado no coincide con la firma publicada.".to_string(),
        ));
    }
    on_progress(downloaded, total, ToolPackPhase::Verify);

    if cancel.load(Ordering::SeqCst) {
        cleanup_partial(&part, &version_dir);
        return Err(InstallOutcome::Cancelled);
    }

    // Extraction is CPU/IO-bound sync work over a `Seek`-able file, so it
    // runs off the async runtime; the cancel flag is cloned in, not
    // borrowed, because the closure must be `'static`.
    let tool_name = entry.tool.clone();
    let part_for_extract = part.clone();
    let version_dir_for_extract = version_dir.clone();
    let cancel_for_extract = Arc::clone(cancel);
    let extraction = tauri::async_runtime::spawn_blocking(move || {
        finish_extraction(
            &part_for_extract,
            &tool_name,
            &version_dir_for_extract,
            cancel_for_extract.as_ref(),
        )
    })
    .await
    .map_err(|e| InstallOutcome::Failed(format!("La extracción del pack falló: {e}")))?;
    extraction?;

    on_progress(total, total, ToolPackPhase::Extract);

    // The pointer, written LAST and atomically (D-08): a reader can never
    // observe `current` naming a version whose directory is not complete.
    let current = tool_dir.join("current");
    let current_part = tool_dir.join("current.part");
    tokio::fs::write(&current_part, &entry.version)
        .await
        .map_err(|e| InstallOutcome::Failed(format!("No se pudo actualizar el puntero: {e}")))?;
    tokio::fs::rename(&current_part, &current)
        .await
        .map_err(|e| InstallOutcome::Failed(format!("No se pudo actualizar el puntero: {e}")))?;

    // Older extracted versions are dead weight once `current` points past
    // them.
    if let Ok(mut entries) = tokio::fs::read_dir(tool_dir).await {
        while let Ok(Some(dir_entry)) = entries.next_entry().await {
            let is_dir = dir_entry.file_type().await.map(|t| t.is_dir()).unwrap_or(false);
            if is_dir && dir_entry.file_name().to_string_lossy() != entry.version.as_str() {
                let _ = tokio::fs::remove_dir_all(dir_entry.path()).await;
            }
        }
    }

    Ok(())
}

async fn run_install(app: &tauri::AppHandle, tool: &str, cancel: Arc<AtomicBool>) {
    let (index, _source) = fetch_index(app).await;
    let Some(entry) = index.and_then(|idx| idx.packs.into_iter().find(|p| p.tool == tool)) else {
        let _ = app.emit(
            EVENT_ERROR,
            ErrorEvent {
                tool: tool.to_string(),
                message: "No hay ningún pack publicado para esta herramienta.".to_string(),
            },
        );
        return;
    };
    let Some(root) = packs_root(app) else {
        let _ = app.emit(
            EVENT_ERROR,
            ErrorEvent {
                tool: tool.to_string(),
                message: "No se pudo acceder al almacenamiento local.".to_string(),
            },
        );
        return;
    };
    let tool_dir = root.join(&entry.tool);
    let base = web_base_url();
    let app_for_progress = app.clone();
    let progress_tool = entry.tool.clone();

    // The ZIP body can run to tens of MB — `pack_client()`, not `client()`
    // (see its doc comment for why the two must not be shared: `client()`'s
    // total timeout aborts any slow-but-healthy bulk download).
    let result = install_pack_files(&base, pack_client(), &tool_dir, &entry, &cancel, |downloaded, total, phase| {
        let _ = app_for_progress.emit(
            EVENT_PROGRESS,
            ProgressPayload {
                tool: &progress_tool,
                downloaded,
                total,
                phase,
            },
        );
    })
    .await;

    match result {
        Ok(()) => {
            invalidate(&tool_dir);
            let _ = app.emit(
                EVENT_DONE,
                DoneEvent {
                    tool: entry.tool.clone(),
                    version: entry.version.clone(),
                },
            );
        }
        // No event: the gate simply re-asks `tool_packs_status`, which now
        // reports "not installed" again, exactly as if Download had never
        // been pressed.
        Err(InstallOutcome::Cancelled) => {}
        Err(InstallOutcome::Failed(message)) => {
            let _ = app.emit(
                EVENT_ERROR,
                ErrorEvent {
                    tool: entry.tool.clone(),
                    message,
                },
            );
        }
    }
}

// ── Commands ─────────────────────────────────────────────────────────────

/// Never rejects: an unreachable index resolves to `available: None,
/// source: Offline` (RF3's contract) rather than throwing in the renderer.
#[tauri::command]
pub async fn tool_packs_status(app: tauri::AppHandle, tool: String) -> ToolPackStatus {
    let installed = installed_of(&app, &tool);
    let (index, source) = fetch_index(&app).await;
    let available = index
        .and_then(|idx| idx.packs.into_iter().find(|p| p.tool == tool))
        .map(|e| ToolPackAvailable {
            version: e.version,
            bytes: e.bytes,
            sha256: e.sha256,
        });
    ToolPackStatus {
        installed,
        available,
        source,
    }
}

fn installed_of(app: &tauri::AppHandle, tool: &str) -> Option<ToolPackInstalled> {
    let root = packs_root(app)?;
    let tool_dir = root.join(tool);
    let version = std::fs::read_to_string(tool_dir.join("current")).ok()?;
    let version = version.trim().to_string();
    if version.is_empty() {
        return None;
    }
    let bytes = dir_bytes(&tool_dir.join(&version));
    Some(ToolPackInstalled { version, bytes })
}

/// Settles once the install is ACCEPTED — progress, completion and failure
/// all arrive later, over `pack://progress`/`pack://done`/`pack://error`.
#[tauri::command]
pub async fn tool_packs_install(
    app: tauri::AppHandle,
    state: tauri::State<'_, PackState>,
    tool: String,
) -> Result<(), String> {
    let cancel = state.begin(&tool);
    tauri::async_runtime::spawn(async move {
        run_install(&app, &tool, cancel).await;
    });
    Ok(())
}

/// A no-op, not an error, if nothing is installing for `tool`.
#[tauri::command]
pub fn tool_packs_cancel(state: tauri::State<'_, PackState>, tool: String) {
    state.request_cancel(&tool);
}

/// Deletes `<tool>/` entirely, reverting the tool to the asset cache /
/// network path.
#[tauri::command]
pub async fn tool_packs_remove(app: tauri::AppHandle, tool: String) -> Result<(), String> {
    if let Some(root) = packs_root(&app) {
        let tool_dir = root.join(&tool);
        let _ = tokio::fs::remove_dir_all(&tool_dir).await;
        invalidate(&tool_dir);
    }
    Ok(())
}

/// Every tool pack currently on disk — what the Settings Storage section
/// lists.
#[tauri::command]
pub async fn tool_packs_list(app: tauri::AppHandle) -> Vec<ToolPackSummary> {
    let Some(root) = packs_root(&app) else {
        return Vec::new();
    };
    let Ok(entries) = std::fs::read_dir(&root) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for entry in entries.flatten() {
        let tool_dir = entry.path();
        if !tool_dir.is_dir() {
            // Skips `index.json` / `index.etag`, which sit beside the
            // per-tool directories at this same level.
            continue;
        }
        let Ok(version) = std::fs::read_to_string(tool_dir.join("current")) else {
            continue;
        };
        let version = version.trim().to_string();
        if version.is_empty() {
            continue;
        }
        let tool = entry.file_name().to_string_lossy().to_string();
        let bytes = dir_bytes(&tool_dir.join(&version));
        out.push(ToolPackSummary { tool, version, bytes });
    }
    out
}

/// Bytes currently held by the `boffasset://` disk cache — loose, per-file
/// assets, separate from any installed pack.
#[tauri::command]
pub async fn asset_cache_bytes(app: tauri::AppHandle) -> u64 {
    match cache_dir(&app) {
        Some(dir) => dir_bytes(&dir),
        None => 0,
    }
}

/// Empties the `boffasset://` disk cache. Never touches installed packs.
#[tauri::command]
pub async fn asset_cache_clear(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(dir) = cache_dir(&app) {
        let _ = tokio::fs::remove_dir_all(&dir).await;
        let _ = tokio::fs::create_dir_all(&dir).await;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write as _;

    fn temp_dir(label: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("boff-tool-packs-{label}-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// A zip with the given `name -> bytes` entries, built the same way
    /// `pack-tool-assets.mjs` builds one: forward slashes, no directory
    /// entries required.
    fn minimal_zip(entries: &[(&str, &[u8])]) -> Vec<u8> {
        let mut buf = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(std::io::Cursor::new(&mut buf));
            let options = zip::write::SimpleFileOptions::default();
            for (name, contents) in entries {
                writer.start_file(*name, options).unwrap();
                writer.write_all(contents).unwrap();
            }
            writer.finish().unwrap();
        }
        buf
    }

    // X4 — safe_entry refuses traversal, absolute, backslash, drive letter,
    // Windows device names and trailing-dot/space segments; accepts a real
    // `boffmedia/tools/<tool>/` entry.
    #[test]
    fn safe_entry_accepts_a_real_entry_and_refuses_everything_unsafe() {
        assert_eq!(
            safe_entry("boffmedia/tools/mewgenics/icons/1.webp", "mewgenics"),
            Some(PathBuf::from("icons").join("1.webp"))
        );

        for bad in [
            "boffmedia/tools/mewgenics/../../evil.txt",
            "boffmedia/tools/mewgenics/nested/../../evil.txt",
            "/etc/passwd",
            "boffmedia/tools/mewgenics/C:/evil.txt",
            "boffmedia\\tools\\mewgenics\\evil.txt",
            "boffmedia/tools/mewgenics/CON.txt",
            "boffmedia/tools/mewgenics/nested/con",
            "boffmedia/tools/mewgenics/nested/COM1.dat",
            "boffmedia/tools/mewgenics/trailing./x.txt",
            "boffmedia/tools/mewgenics/trailing /x.txt",
            "pack.toon",
            "boffmedia/tools/othertool/icons/1.webp",
        ] {
            assert!(safe_entry(bad, "mewgenics").is_none(), "should have refused {bad}");
        }
    }

    // X5 — resolve() maps a path under /boffmedia/tools/<tool>/ into the pack
    // dir, ignores the query (structural: the function takes no query
    // parameter at all, so a hit is version-keyed by construction), and
    // returns none for another tool's path or a missing current pointer.
    #[test]
    fn resolve_maps_installed_tools_and_refuses_the_rest() {
        let root = temp_dir("x5");
        let tool_dir = root.join("mewgenics");
        std::fs::create_dir_all(&tool_dir).unwrap();
        std::fs::write(tool_dir.join("current"), "20260902120000").unwrap();

        assert_eq!(
            resolve_under(&root, "/boffmedia/tools/mewgenics/icons/1.webp"),
            Some(tool_dir.join("20260902120000").join("icons/1.webp"))
        );

        // A tool with no pack directory at all.
        assert!(resolve_under(&root, "/boffmedia/tools/tcg/icons/1.webp").is_none());

        // A tool directory that exists but has never finished an install.
        let empty_dir = root.join("battlesim");
        std::fs::create_dir_all(&empty_dir).unwrap();
        assert!(resolve_under(&root, "/boffmedia/tools/battlesim/icons/1.webp").is_none());

        let _ = std::fs::remove_dir_all(&root);
    }

    // X6 — a cancelled install leaves neither a .part nor a <version>/ dir,
    // and `current` still names the previous version. Simulated by flipping
    // the cancel flag before extraction runs, per the task's own suggestion
    // — no network needed, since `finish_extraction` is the exact seam a
    // real cancel goes through too.
    #[test]
    fn a_cancelled_install_leaves_no_partial_state() {
        let root = temp_dir("x6");
        let tool_dir = root.join("mewgenics");
        std::fs::create_dir_all(&tool_dir).unwrap();
        std::fs::write(tool_dir.join("current"), "old-version").unwrap();
        std::fs::create_dir_all(tool_dir.join("old-version")).unwrap();
        std::fs::write(tool_dir.join("old-version").join("marker.txt"), "old").unwrap();

        let part = tool_dir.join("new-version.zip.part");
        let version_dir = tool_dir.join("new-version");
        // A stray leftover from an earlier, interrupted attempt — proves the
        // cleanup path actually removes an existing tree, not just a
        // never-created one.
        std::fs::create_dir_all(&version_dir).unwrap();
        std::fs::write(version_dir.join("stray.webp"), b"partial").unwrap();
        std::fs::write(
            &part,
            minimal_zip(&[("boffmedia/tools/mewgenics/icons/1.webp", b"x")]),
        )
        .unwrap();

        let cancel = AtomicBool::new(true);
        let result = finish_extraction(&part, "mewgenics", &version_dir, &cancel);

        assert!(matches!(result, Err(InstallOutcome::Cancelled)));
        assert!(!part.exists(), "the .part file must be gone");
        assert!(!version_dir.exists(), "the partial version dir must be gone");
        assert_eq!(
            std::fs::read_to_string(tool_dir.join("current")).unwrap(),
            "old-version",
            "current must still name the previous version"
        );
        assert!(tool_dir.join("old-version").join("marker.txt").is_file());

        let _ = std::fs::remove_dir_all(&root);
    }

    // N1 (point 2) — a genuinely FAILED install (not merely cancelled) must
    // give the same guarantee X6 proved for cancellation: `cleanup_partial`
    // removes only THIS attempt's `.part` and `<version>/`, and never
    // touches `current` or any other already-installed version. A corrupt
    // `.part` (not a valid zip at all) drives `finish_extraction` into the
    // `ExtractError::Io` branch, exercising the other arm of the same
    // cleanup call that a bad chunk read or a sha256 mismatch also hits in
    // `install_pack_files`.
    #[test]
    fn a_failed_extraction_leaves_no_partial_state_and_keeps_the_old_version() {
        let root = temp_dir("failed-extract");
        let tool_dir = root.join("mewgenics");
        std::fs::create_dir_all(&tool_dir).unwrap();
        std::fs::write(tool_dir.join("current"), "old-version").unwrap();
        std::fs::create_dir_all(tool_dir.join("old-version")).unwrap();
        std::fs::write(tool_dir.join("old-version").join("marker.txt"), "old").unwrap();

        let part = tool_dir.join("new-version.zip.part");
        let version_dir = tool_dir.join("new-version");
        // Not a valid zip archive — simulates a body that was cut short or
        // corrupted in transit, the same shape a failed pack download leaves
        // on disk before this cleanup path runs.
        std::fs::write(&part, b"not a zip file").unwrap();

        let cancel = AtomicBool::new(false);
        let result = finish_extraction(&part, "mewgenics", &version_dir, &cancel);

        assert!(matches!(result, Err(InstallOutcome::Failed(_))), "{result:?}");
        assert!(!part.exists(), "the .part file must be gone");
        assert!(!version_dir.exists(), "the partial version dir must be gone");
        assert_eq!(
            std::fs::read_to_string(tool_dir.join("current")).unwrap(),
            "old-version",
            "a failed install must never touch the pointer to the already-installed version"
        );
        assert!(
            tool_dir.join("old-version").join("marker.txt").is_file(),
            "the previously installed version's files must survive a failed install"
        );

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn extraction_ignores_entries_outside_the_tool_root() {
        let root = temp_dir("extract");
        let part = root.join("v.zip");
        let version_dir = root.join("v");
        std::fs::write(
            &part,
            minimal_zip(&[
                ("pack.toon", b"tool = \"mewgenics\""),
                ("boffmedia/tools/mewgenics/icons/1.webp", b"art"),
                ("boffmedia/tools/othertool/icons/1.webp", b"nope"),
            ]),
        )
        .unwrap();

        let cancel = AtomicBool::new(false);
        extract_zip(&part, "mewgenics", &version_dir, &cancel).unwrap();

        assert_eq!(
            std::fs::read(version_dir.join("icons").join("1.webp")).unwrap(),
            b"art"
        );
        assert!(!version_dir.join("pack.toon").exists());
        assert!(!root.join("othertool").exists());

        let _ = std::fs::remove_dir_all(&root);
    }
}
