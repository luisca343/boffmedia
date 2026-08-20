// Pack payload downloads. Deliberately NOT portablemc's downloader: it verifies
// sha1, and every file in a Boffmedia manifest carries a mandatory sha512
// (packages/pack-schema/src/boffmedia.ts). Verifying the weaker hash when the
// manifest hands us the stronger one would be a downgrade we chose.
//
// Delta updates are the reason for the content-addressed cache: a file is
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
/// Also the sweep's only test of "is this still the file we installed?" — see
/// `instance::sweep_with`. A file that no longer hashes to the marker's value
/// belongs to the player now and is never deleted.
pub fn sha512_of(path: &Path) -> Option<String> {
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

/// Same addressing as `cache_path`, in the store that is never purged — see
/// `Layout::local_blobs_dir`. This is where an imported `.mrpack`'s overrides
/// live, and it is the only copy of them.
pub fn local_blob_path(layout: &Layout, sha512: &str) -> PathBuf {
    let prefix = &sha512[..2.min(sha512.len())];
    layout.local_blobs_dir().join(prefix).join(sha512)
}

/// Store `bytes` in the local blob store under their own sha512, and return
/// that hash. Content-addressed, so re-importing the same pack twice writes
/// nothing the second time and two packs sharing a config share one blob.
pub fn put_local_blob(layout: &Layout, bytes: &[u8]) -> Result<String, InstallFailure> {
    let mut hasher = Sha512::new();
    hasher.update(bytes);
    let sha512 = hex(&hasher.finalize());
    let dest = local_blob_path(layout, &sha512);
    if dest.is_file() {
        return Ok(sha512);
    }
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            InstallFailure::message(format!("No se pudo crear el almacén local: {e}"))
        })?;
    }
    // tmp + rename so a crash mid-write cannot leave a truncated file sitting
    // at an address that says it is complete.
    let tmp = dest.with_extension("part");
    std::fs::write(&tmp, bytes)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar el archivo: {e}")))?;
    std::fs::rename(&tmp, &dest)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar el archivo: {e}")))?;
    Ok(sha512)
}

/// Download every planned file into `dest_root`, verifying sha512.
///
/// `phase` selects which slice of the progress bar this batch moves — mods and
/// overrides are two calls, not one, because the UI shows them as two steps.
/// `skip_paths` (optional) are file paths to skip during download — used for
/// randomizer ROM slots which are managed exclusively by the randomizer.
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
    download_all_with_skips(app, http, layout, dest_root, pack_id, password, files, phase, reporter, &[]).await
}

/// Same as `download_all`, but with an option to skip certain paths.
#[allow(clippy::too_many_arguments)]
pub async fn download_all_with_skips(
    app: &tauri::AppHandle,
    http: &reqwest::Client,
    layout: &Layout,
    dest_root: &Path,
    pack_id: &str,
    password: Option<&str>,
    files: &[PlannedFile],
    phase: Phase,
    reporter: &Reporter,
    skip_paths: &[String],
) -> Result<(), InstallFailure> {
    if files.is_empty() {
        reporter.emit(phase, 1.0, "", 0, 0);
        return Ok(());
    }

    let norm = |p: &str| p.to_lowercase().replace('\\', "/");
    let skip_norm: Vec<String> = skip_paths.iter().map(|p| norm(p)).collect();

    let total: u64 = files.iter().map(|f| f.size).sum();
    // Per batch, not per install: each phase owns its own slice of the bar, so
    // a counter shared across phases would report mods' bytes inside overrides.
    let counter = Arc::new(ByteCounter::default());
    let semaphore = Arc::new(Semaphore::new(CONCURRENCY));
    let mut handles = Vec::with_capacity(files.len());

    for file in files {
        // Skip randomizer-managed ROM slots
        if skip_norm.iter().any(|s| norm(&file.path) == *s) {
            // Still advance the progress bar for skipped files
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
            continue;
        }

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

/// A download failed part-way. `Transient` errors — a dropped connection, a
/// 5xx, a 429, a truncated transfer — are worth retrying; `Permanent` ones — a
/// 404, a hash mismatch, a disk error — are not, because a second attempt fails
/// the same way and only delays the honest error the player needs to see.
enum FetchError {
    Transient(InstallFailure),
    Permanent(InstallFailure),
}

/// Total attempts for the network leg of one file (1 try + 2 retries). One flaky
/// mod out of 400 should not fail the whole install when a retry would land it.
const MAX_ATTEMPTS: u32 = 3;

/// Exponential backoff with a little jitter, so the 6 concurrent downloads that
/// all hit the same 429 do not then retry in lockstep. ~400ms, then ~800ms.
fn backoff_delay(attempt: u32) -> std::time::Duration {
    let base = 400u64.saturating_mul(2u64.saturating_pow(attempt - 1));
    let jitter = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| u64::from(d.subsec_nanos()) % 250)
        .unwrap_or(0);
    std::time::Duration::from_millis(base + jitter)
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

    // 1. Already correct on disk? Nothing to do — the whole point of the
    //    delta updates.
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

    // 2b. In the local blob store? This is how an imported third-party
    //     `.mrpack`'s overrides install: they are `source: override` entries
    //     that the API has never heard of, so the only copy is the one the
    //     import extracted out of the zip. Checked AFTER the cache and with the
    //     same hash verification — a blob that does not hash to its own address
    //     is treated as missing and falls through to the network, which will
    //     then fail loudly rather than install corrupt bytes.
    let local = local_blob_path(layout, &sha512);
    if local.is_file() && sha512_of(&local).as_deref() == Some(sha512.as_str()) {
        return place(&local, &dest);
    }

    // 2c. A user-provided file the checks above did not satisfy is NOT an install
    //     failure: the server never hosts its bytes (a ROM, a BIOS), so there is
    //     nothing to fetch. The player supplies it later via `instance_provide_file`
    //     and the install result reports it through `missingUserFiles`. Skipping
    //     here — rather than erroring in `resolve_url` — is what lets the rest of
    //     the pack install and stay merely "not launchable yet".
    if matches!(file.fetch, Fetch::UserProvided { .. }) {
        return Ok(());
    }

    // 3. Actually fetch it, retrying the network leg a few times. The cache
    //    checks above are deterministic and are never part of the retry; only
    //    the parts that touch the network are.
    let mut attempt = 0;
    loop {
        attempt += 1;
        match fetch_and_stream(app, http, pack_id, password, file, &blob, &sha512).await {
            Ok(()) => break,
            Err(FetchError::Permanent(failure)) => return Err(failure),
            Err(FetchError::Transient(failure)) => {
                if attempt >= MAX_ATTEMPTS {
                    return Err(failure);
                }
                tokio::time::sleep(backoff_delay(attempt)).await;
            }
        }
    }
    place(&blob, &dest)
}

/// The network leg of one download: acquire the response, then stream+verify it
/// into the content-addressed cache. Separated from `fetch_one` so the retry
/// loop there wraps exactly the fallible-over-the-wire part and nothing else.
async fn fetch_and_stream(
    app: &tauri::AppHandle,
    http: &reqwest::Client,
    pack_id: &str,
    password: Option<&str>,
    file: &PlannedFile,
    blob: &Path,
    sha512: &str,
) -> Result<(), FetchError> {
    // Public sources are one GET; the proxied ones go through the launcher
    // session so the API can re-check entitlement: the listing and the download
    // are separate requests, and access can be revoked between them.
    let response = match &file.fetch {
        Fetch::Proxied(pack_file) => {
            // The proxy re-mints an expired session internally, so a failure
            // here is most often a network blip; let the loop try again.
            crate::api::fetch_pack_file(app, pack_id, password, pack_file, None)
                .await
                .map_err(|e| FetchError::Transient(InstallFailure::from(e)))?
        }
        _ => {
            // Only Modrinth's resolve does a network round-trip that a retry can
            // rescue; a UserProvided or Patched source reaching here is a logic
            // error (they are placed from the blob store / materialized, never
            // fetched), so it is Permanent — retrying only delays the real error.
            let url = resolve_url(http, file).await.map_err(|e| match file.fetch {
                Fetch::ModrinthVersion { .. } | Fetch::Direct(_) => FetchError::Transient(e),
                _ => FetchError::Permanent(e),
            })?;
            let res = http.get(&url).send().await.map_err(|e| {
                FetchError::Transient(InstallFailure::message(format!(
                    "No se pudo descargar «{}»: {e}",
                    file.path
                )))
            })?;
            let status = res.status();
            if !status.is_success() {
                let failure = InstallFailure::message(format!(
                    "No se pudo descargar «{}»: el servidor respondió {}.",
                    file.path, status
                ));
                // 5xx and 429 are worth another go; a 404/403 will not fix
                // itself, so fail it now rather than three times.
                return Err(
                    if status.is_server_error() || status == reqwest::StatusCode::TOO_MANY_REQUESTS {
                        FetchError::Transient(failure)
                    } else {
                        FetchError::Permanent(failure)
                    },
                );
            }
            res
        }
    };

    // The sha512 check stays on OUR side for every source. The server streaming
    // the bytes proves who may have them, not that they arrived intact — and
    // for a CurseForge proxy it is also the only thing verifying what upstream
    // actually served.
    stream_to_cache(response, blob, sha512, &file.path).await
}

/// Turn a `Fetch` into a URL. Only Modrinth needs a round-trip: the manifest
/// stores a version id, and the CDN path is not derivable from it.
pub(crate) async fn resolve_url(http: &reqwest::Client, file: &PlannedFile) -> Result<String, InstallFailure> {
    match &file.fetch {
        Fetch::Direct(url) => Ok(url.clone()),
        // Unreachable by construction: `fetch_one` routes these to the API
        // before it ever asks for a URL, because there is no public one.
        Fetch::Proxied(_) => Err(InstallFailure::message(format!(
            "«{}» solo puede descargarse a través del servidor de Boffmedia.",
            file.path
        ))),
        // User-provided files are never downloaded; they are provided by the
        // player and this error should never occur.
        Fetch::UserProvided { hint } => Err(InstallFailure::message(format!(
            "«{}» debe ser proporcionado por el jugador ({}); la app no puede descargarlo.",
            file.path, hint
        ))),
        // Patched files are materialized in a dedicated pass (materialize_patched)
        // after the normal downloads, never fetched by URL. Unreachable in
        // practice — install_payload excludes them from download_all.
        Fetch::Patched { .. } => Err(InstallFailure::message(format!(
            "«{}» es un romhack; se genera localmente, no se descarga.",
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
) -> Result<(), FetchError> {
    let parent = blob.parent().unwrap_or(blob);
    std::fs::create_dir_all(parent).map_err(|e| {
        FetchError::Permanent(InstallFailure::message(format!(
            "No se pudo crear {}: {e}",
            parent.display()
        )))
    })?;

    let temp = parent.join(format!("{}.part", uuid::Uuid::new_v4()));

    let mut hasher = Sha512::new();
    {
        let mut out = std::fs::File::create(&temp).map_err(|e| {
            FetchError::Permanent(InstallFailure::message(format!(
                "No se pudo escribir {}: {e}",
                temp.display()
            )))
        })?;
        // A cut connection mid-stream leaves a `.part` behind: drop it before
        // bubbling the transient error so the retry starts from a clean slate.
        loop {
            match res.chunk().await {
                Ok(Some(chunk)) => {
                    hasher.update(&chunk);
                    out.write_all(&chunk).map_err(|e| {
                        FetchError::Permanent(InstallFailure::message(format!(
                            "No se pudo escribir {}: {e}",
                            temp.display()
                        )))
                    })?;
                }
                Ok(None) => break,
                Err(e) => {
                    drop(out);
                    let _ = std::fs::remove_file(&temp);
                    return Err(FetchError::Transient(InstallFailure::message(format!(
                        "Se cortó la descarga de «{label}»: {e}"
                    ))));
                }
            }
        }
        out.flush().ok();
    }

    let actual = hex(&hasher.finalize());
    if actual != expected {
        let _ = std::fs::remove_file(&temp);
        return Err(FetchError::Permanent(InstallFailure::message(format!(
            "«{label}» no coincide con el hash del manifiesto. La descarga está corrupta o el \
             archivo ha cambiado en el origen."
        ))));
    }

    std::fs::rename(&temp, blob).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        FetchError::Permanent(InstallFailure::message(format!(
            "No se pudo guardar {}: {e}",
            blob.display()
        )))
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

/// Materialize `patched` (romhack) files AFTER the normal downloads, so
/// each hack's `base` (a user-provided dump) and `patch` (a downloaded blob) are
/// already on disk. Applies the patch in Rust, verifies the output against the
/// entry's pinned sha512, caches the (reproducible) result content-addressed,
/// and places it. A base/patch not yet present is skipped, not an error — the
/// missing base surfaces via `missingUserFiles` and blocks launch until supplied.
pub fn materialize_patched(
    layout: &Layout,
    dest_root: &Path,
    files: &[PlannedFile],
    reporter: &Reporter,
) -> Result<(), InstallFailure> {
    for file in files {
        let Fetch::Patched {
            base,
            patch,
            format,
        } = &file.fetch
        else {
            continue;
        };
        let dest = dest_root.join(file.path.replace('\\', "/"));
        let sha512 = file.sha512.to_lowercase();

        // Already correct on disk, or reproducible from the content cache.
        if let Ok(meta) = std::fs::metadata(&dest) {
            if meta.is_file()
                && (file.size == 0 || meta.len() == file.size)
                && sha512_of(&dest).as_deref() == Some(sha512.as_str())
            {
                continue;
            }
        }
        let cached = cache_path(layout, &sha512);
        if cached.is_file() && sha512_of(&cached).as_deref() == Some(sha512.as_str()) {
            place(&cached, &dest)?;
            continue;
        }

        let base_path = dest_root.join(base.replace('\\', "/"));
        let patch_path = dest_root.join(patch.replace('\\', "/"));
        let (Ok(base_bytes), Ok(patch_bytes)) =
            (std::fs::read(&base_path), std::fs::read(&patch_path))
        else {
            reporter.log(
                "info",
                &format!(
                    "«{}» aún no se puede generar: falta el ROM base o el parche.",
                    file.path
                ),
            );
            continue;
        };

        // A base-CRC failure here is the player's dump being the wrong revision —
        // a distinct, actionable error, not a transient one.
        let output = crate::install::patch::apply(*format, &base_bytes, &patch_bytes).map_err(
            |e| {
                InstallFailure::message(format!(
                    "No se pudo aplicar el parche a «{}»: {e}",
                    file.path
                ))
            },
        )?;

        // The entry pins the PATCHED output; a mismatch is a pack-authoring error
        // (the manifest declared a different result than the patch produces).
        let actual = {
            use sha2::{Digest, Sha512};
            let mut hasher = Sha512::new();
            hasher.update(&output);
            hex(&hasher.finalize())
        };
        if actual != sha512 {
            return Err(InstallFailure::message(format!(
                "El parche de «{}» no produjo el resultado que el pack esperaba (error de autoría).",
                file.path
            )));
        }

        if let Some(parent) = cached.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(&cached, &output);
        if let Some(parent) = dest.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        std::fs::write(&dest, &output).map_err(|e| {
            InstallFailure::message(format!("No se pudo escribir «{}»: {e}", file.path))
        })?;
        reporter.log("info", &format!("Romhack «{}» generado.", file.path));
    }
    Ok(())
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
