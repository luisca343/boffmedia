// Pack payload downloads. Deliberately NOT portablemc's downloader: it verifies
// sha1, and every file in a Boffmedia manifest carries a mandatory sha512
// (packages/pack-schema/src/boffmedia.ts). Verifying the weaker hash when the
// manifest hands us the stronger one would be a downgrade we chose.
//
// §9 "delta updates" is the reason for the content-addressed cache: a file is
// keyed by its sha512, so an update that changes 3 of 400 mods downloads 3.
// A file already correct on disk is not even re-copied.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use sha2::{Digest, Sha512};
use tokio::sync::Semaphore;

use super::paths::Layout;
use super::progress::{ByteCounter, Phase, Reporter};
use super::resolve::{Fetch, PlannedFile};
use super::InstallFailure;

/// Enough to saturate a home connection without making the CDN think it is
/// being scraped. Modrinth's docs ask for restraint rather than a hard number.
const CONCURRENCY: usize = 6;

const MODRINTH_API: &str = "https://api.modrinth.com/v2";

#[derive(serde::Deserialize)]
struct ModrinthVersion {
    files: Vec<ModrinthFile>,
}

#[derive(serde::Deserialize)]
struct ModrinthFile {
    url: String,
    #[serde(default)]
    primary: bool,
    #[serde(default)]
    hashes: ModrinthHashes,
}

#[derive(Default, serde::Deserialize)]
struct ModrinthHashes {
    #[serde(default)]
    sha512: Option<String>,
}

pub fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Hash a file that is already on disk. Returns None when it cannot be read at
/// all, which the callers treat as "missing" rather than as an error.
fn sha512_of(path: &Path) -> Option<String> {
    let mut file = std::fs::File::open(path).ok()?;
    let mut hasher = Sha512::new();
    std::io::copy(&mut file, &mut hasher).ok()?;
    Some(hex(&hasher.finalize()))
}

fn cache_path(layout: &Layout, sha512: &str) -> PathBuf {
    // Two-level fan-out: a single directory with 20k blobs is slow to enumerate
    // on Windows, which is where most players are.
    let prefix = &sha512[..2.min(sha512.len())];
    layout.cache_dir().join(prefix).join(sha512)
}

/// Download every planned file into `dest_root`, verifying sha512.
///
/// `phase` selects which slice of the progress bar this batch moves — mods and
/// overrides are two calls, not one, because the UI shows them as two steps.
#[allow(clippy::too_many_arguments)]
pub async fn download_all(
    app: &tauri::AppHandle,
    http: &reqwest::Client,
    layout: &Layout,
    dest_root: &Path,
    pack_id: &str,
    password: Option<&str>,
    files: &[PlannedFile],
    phase: Phase,
    reporter: &Reporter,
) -> Result<(), InstallFailure> {
    if files.is_empty() {
        reporter.emit(phase, 1.0, "", 0, 0);
        return Ok(());
    }

    let total: u64 = files.iter().map(|f| f.size).sum();
    // Per batch, not per install: each phase owns its own slice of the bar, so
    // a counter shared across phases would report mods' bytes inside overrides.
    let counter = Arc::new(ByteCounter::default());
    let semaphore = Arc::new(Semaphore::new(CONCURRENCY));
    let mut handles = Vec::with_capacity(files.len());

    for file in files {
        let permit_source = Arc::clone(&semaphore);
        // Owned, because the task outlives this loop. The AppHandle is what
        // lets a proxied download reach ApiState/AuthState — and therefore
        // re-mint an expired launcher session — from inside a spawned task.
        let app = app.clone();
        let http = http.clone();
        let layout = layout.clone();
        let dest_root = dest_root.to_path_buf();
        let pack_id = pack_id.to_string();
        let password = password.map(str::to_string);
        let file = file.clone();
        let reporter = reporter.clone();
        let counter = Arc::clone(&counter);

        handles.push(tauri::async_runtime::spawn(async move {
            let _permit = permit_source
                .acquire()
                .await
                .map_err(|_| InstallFailure::message("La descarga fue cancelada."))?;

            let outcome = fetch_one(
                &app,
                &http,
                &layout,
                &dest_root,
                &pack_id,
                password.as_deref(),
                &file,
            )
            .await;

            // Skipped files still advance the bar: from the player's point of
            // view an already-correct file IS progress, and a bar that sits at
            // 0% through a no-op update reads as a hang.
            let done = counter.add(file.size);
            reporter.emit(
                phase,
                if total > 0 {
                    done.min(total) as f32 / total as f32
                } else {
                    1.0
                },
                &file.path,
                done,
                total,
            );
            outcome
        }));
    }

    for handle in handles {
        match handle.await {
            Ok(Ok(())) => {}
            Ok(Err(failure)) => return Err(failure),
            Err(err) => {
                return Err(InstallFailure::message(format!(
                    "Una descarga terminó de forma inesperada: {err}"
                )))
            }
        }
    }

    reporter.emit(phase, 1.0, "", total, total);
    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn fetch_one(
    app: &tauri::AppHandle,
    http: &reqwest::Client,
    layout: &Layout,
    dest_root: &Path,
    pack_id: &str,
    password: Option<&str>,
    file: &PlannedFile,
) -> Result<(), InstallFailure> {
    let dest = dest_root.join(file.path.replace('\\', "/"));
    let sha512 = file.sha512.to_lowercase();

    // 1. Already correct on disk? Nothing to do — this is the whole point of
    //    §9's delta updates.
    if let Ok(meta) = std::fs::metadata(&dest) {
        if meta.is_file()
            && (file.size == 0 || meta.len() == file.size)
            && sha512_of(&dest).as_deref() == Some(sha512.as_str())
        {
            return Ok(());
        }
    }

    let blob = cache_path(layout, &sha512);

    // 2. In the content-addressed cache from another pack or an earlier
    //    version? Copy rather than re-download.
    if blob.is_file() && sha512_of(&blob).as_deref() == Some(sha512.as_str()) {
        return place(&blob, &dest);
    }

    // 3. Actually fetch it. Public sources are one GET; the proxied ones go
    //    through the launcher session so the API can re-check entitlement —
    //    §7.4, the listing and the download are separate requests and access
    //    can be revoked between them.
    let response = match &file.fetch {
        Fetch::Proxied(pack_file) => {
            crate::api::fetch_pack_file(app, pack_id, password, pack_file).await?
        }
        _ => {
            let url = resolve_url(http, file).await?;
            let res = http.get(&url).send().await.map_err(|e| {
                InstallFailure::message(format!("No se pudo descargar «{}»: {e}", file.path))
            })?;
            if !res.status().is_success() {
                return Err(InstallFailure::message(format!(
                    "No se pudo descargar «{}»: el servidor respondió {}.",
                    file.path,
                    res.status()
                )));
            }
            res
        }
    };

    // The sha512 check stays on OUR side for every source. The server streaming
    // the bytes proves who may have them, not that they arrived intact — and
    // for a CurseForge proxy it is also the only thing verifying what upstream
    // actually served.
    stream_to_cache(response, &blob, &sha512, &file.path).await?;
    place(&blob, &dest)
}

/// Turn a `Fetch` into a URL. Only Modrinth needs a round-trip: the manifest
/// stores a version id, and the CDN path is not derivable from it.
async fn resolve_url(http: &reqwest::Client, file: &PlannedFile) -> Result<String, InstallFailure> {
    match &file.fetch {
        Fetch::Direct(url) => Ok(url.clone()),
        // Unreachable by construction: `fetch_one` routes these to the API
        // before it ever asks for a URL, because there is no public one.
        Fetch::Proxied(_) => Err(InstallFailure::message(format!(
            "«{}» solo puede descargarse a través del servidor de Boffmedia.",
            file.path
        ))),
        Fetch::ModrinthVersion { version_id } => {
            let res = http
                .get(format!("{MODRINTH_API}/version/{version_id}"))
                .send()
                .await
                .map_err(|e| {
                    InstallFailure::message(format!("No se pudo contactar con Modrinth: {e}"))
                })?;
            if !res.status().is_success() {
                return Err(InstallFailure::message(format!(
                    "Modrinth no reconoce la versión {version_id} de «{}» ({}).",
                    file.path,
                    res.status()
                )));
            }
            let version: ModrinthVersion = res.json().await.map_err(|e| {
                InstallFailure::message(format!("Respuesta de Modrinth ilegible: {e}"))
            })?;

            // A Modrinth version can carry several files (a jar plus its
            // sources). Match on the hash the manifest pinned; fall back to the
            // primary file only when no hash matches, so a pack that pinned a
            // sources jar still installs the file it asked for.
            version
                .files
                .iter()
                .find(|f| {
                    f.hashes
                        .sha512
                        .as_deref()
                        .is_some_and(|h| h.eq_ignore_ascii_case(&file.sha512))
                })
                .or_else(|| version.files.iter().find(|f| f.primary))
                .or_else(|| version.files.first())
                .map(|f| f.url.clone())
                .ok_or_else(|| {
                    InstallFailure::message(format!(
                        "La versión {version_id} de Modrinth no tiene ningún archivo."
                    ))
                })
        }
    }
}

/// Stream a response to a temp file beside the cache, verify, then rename. The
/// rename is what makes the cache atomic: a blob under its final name has been
/// hashed, so a launcher killed mid-download leaves a `.part`, never a corrupt
/// "cache hit" that then fails to load in-game with no explanation.
///
/// Takes an already-started `Response` because the proxied and the public paths
/// differ only in how the request is authorised — the bytes are handled, and
/// verified, identically.
async fn stream_to_cache(
    mut res: reqwest::Response,
    blob: &Path,
    expected: &str,
    label: &str,
) -> Result<(), InstallFailure> {
    let parent = blob.parent().unwrap_or(blob);
    std::fs::create_dir_all(parent).map_err(|e| {
        InstallFailure::message(format!("No se pudo crear {}: {e}", parent.display()))
    })?;

    let temp = parent.join(format!("{}.part", uuid::Uuid::new_v4()));

    let mut hasher = Sha512::new();
    {
        let mut out = std::fs::File::create(&temp).map_err(|e| {
            InstallFailure::message(format!("No se pudo escribir {}: {e}", temp.display()))
        })?;
        while let Some(chunk) = res.chunk().await.map_err(|e| {
            InstallFailure::message(format!("Se cortó la descarga de «{label}»: {e}"))
        })? {
            hasher.update(&chunk);
            out.write_all(&chunk).map_err(|e| {
                InstallFailure::message(format!("No se pudo escribir {}: {e}", temp.display()))
            })?;
        }
        out.flush().ok();
    }

    let actual = hex(&hasher.finalize());
    if actual != expected {
        let _ = std::fs::remove_file(&temp);
        return Err(InstallFailure::message(format!(
            "«{label}» no coincide con el hash del manifiesto. La descarga está corrupta o el \
             archivo ha cambiado en el origen."
        )));
    }

    std::fs::rename(&temp, blob).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        InstallFailure::message(format!("No se pudo guardar {}: {e}", blob.display()))
    })
}

/// Put a verified blob at its target path. A copy, not a hard link: configs are
/// meant to be edited, and a link would silently corrupt the cache the moment a
/// player changed one.
fn place(blob: &Path, dest: &Path) -> Result<(), InstallFailure> {
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            InstallFailure::message(format!("No se pudo crear {}: {e}", parent.display()))
        })?;
    }
    std::fs::copy(blob, dest)
        .map(|_| ())
        .map_err(|e| InstallFailure::message(format!("No se pudo instalar {}: {e}", dest.display())))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_is_lowercase_and_padded() {
        // The manifest's regex is ^[a-f0-9]{128}$, so an uppercase or unpadded
        // rendering would fail every comparison for a correct download.
        assert_eq!(hex(&[0x00, 0x0f, 0xff]), "000fff");
    }

    #[test]
    fn cache_is_fanned_out_by_the_first_byte() {
        let layout = Layout::for_tests(PathBuf::from("/tmp/boff"));
        let path = cache_path(&layout, "ab1234");
        assert!(path.ends_with("ab/ab1234"));
    }

    #[test]
    fn hashing_a_missing_file_is_not_a_panic() {
        assert!(sha512_of(Path::new("/definitely/not/here")).is_none());
    }
}
