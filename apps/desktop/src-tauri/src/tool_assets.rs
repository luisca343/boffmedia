//! `boffasset://` — the shared asset tree, served to the renderer from an
//! on-disk cache that fills itself on first sight.
//!
//! Tools address images by ROOT-RELATIVE paths into the shared tree
//! (`/boffmedia/tools/tcg/...`, `/smartrotom/img/...`), because that is the one
//! form both hosts can agree on. In a browser those resolve against the page
//! origin, which serves them. Here they would resolve against `tauri://localhost`,
//! where only what this app bundles exists — so `assetUrl` in the renderer sends
//! everything else through this scheme instead.
//!
//! # Why a scheme and not the two mechanisms already in the tree
//!
//! **Not the asset protocol.** `icons.rs` documents why that one is barred: its
//! static `$APPDATA` scope resolves under the bundle identifier while
//! `datadir.rs` uses `%APPDATA%\Boffmedia[ Dev]`, so the scope never matched the
//! real cache, and WebView2 refused the encoded paths even with a runtime grant.
//! Nothing here touches it. A registered scheme has no scope at all: the handler
//! below IS the authority on what it will serve, and it answers with bytes
//! rather than handing the webview a path to go and open.
//!
//! **Not `data:` URLs like `icon_cache`.** That shape is right for a mod icon
//! and wrong at this scale. The art-heavy tools ask for hundreds of images in
//! one grid; as `data:` that is one `invoke` per image, each answered by a
//! base64 string ~1.33x the bytes, all resident in JS at once, and every one of
//! them an async hop the `<img>` has to wait on. Through a scheme the renderer
//! writes an ordinary synchronous `src` and the webview streams it.
//!
//! # What it costs the user
//!
//! Only what they look at. The three art-heavy tools are 708 MB of tree between
//! them (mewgenics 389, battlesim 172, tcg 147) — far past bundling, and most of
//! it nobody ever opens. A player who browses forty cards stores forty cards,
//! and stores them for good: the second look is free and works with no network.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, SystemTime};

use sha2::{Digest, Sha256};
use tauri::http::{header, Request, Response, StatusCode};
use tauri::{UriSchemeContext, UriSchemeResponder};

/// The scheme the renderer builds its URLs with. Kept in step with
/// `ASSET_ORIGIN` in `src/tool-host.ts` and with `img-src` in tauri.conf.json —
/// a mismatch in any of the three is a blank image and nothing in the console.
pub const SCHEME: &str = "boffasset";

/// One asset. Art, not archives: anything larger is not a thing a tool grid
/// should be putting on screen, and refusing it early keeps a misconfigured
/// path from filling the player's disk in one request.
const MAX_ASSET_BYTES: u64 = 16 * 1024 * 1024;

/// How much of the tree may sit on disk before the oldest goes. 512 MiB is
/// comfortably more than any one tool's working set and comfortably less than
/// the 708 MiB the three art-heavy trees would total if we mirrored them whole.
const CACHE_CAP_BYTES: u64 = 512 * 1024 * 1024;

/// Writes between sweeps. A sweep walks the directory, so doing one per write
/// would make a cold grid of 200 images walk it 200 times.
const SWEEP_EVERY: u64 = 64;

static WRITES: AtomicU64 = AtomicU64::new(0);

/// Where the asset tree is published. Mirrors `api::base_url`'s shape — a
/// runtime env var wins so a QA build can be pointed elsewhere without a
/// rebuild, then the compile-time value, then the site.
pub fn web_base_url() -> String {
    if let Ok(url) = std::env::var("BOFF_WEB_URL") {
        if !url.trim().is_empty() {
            return url.trim_end_matches('/').to_string();
        }
    }
    option_env!("BOFF_WEB_URL")
        .unwrap_or("https://boffmedia.es")
        .trim_end_matches('/')
        .to_string()
}

// Concrete `AppHandle`, not a `R: Runtime` generic: `datadir::data_root` is
// concrete too, and this crate only ever builds for the Wry desktop runtime
// (same reasoning as updates.rs — there is no mobile target to keep open for).
fn cache_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
    let dir = crate::datadir::data_root(app).ok()?.join("asset-cache");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

/// The path a URL may ask for, or `None`.
///
/// Deliberately strict rather than clever: the handler fetches whatever comes
/// back out of here from the website and writes it to the player's disk, so
/// "looks like a path in the asset tree" is the whole security boundary. A
/// traversal segment, a scheme, a host or a backslash is a refusal, not
/// something to normalise into something plausible.
fn sanitize(raw: &str) -> Option<String> {
    let decoded = percent_decode(raw)?;
    if !decoded.starts_with('/') || decoded.contains('\\') || decoded.contains("//") {
        return None;
    }
    if decoded.split('/').any(|seg| seg == ".." || seg == ".") {
        return None;
    }
    // A path that is only slashes, or that carries a query or fragment, is not
    // an asset. (The webview strips those before `path()`, but this function is
    // the boundary and must not depend on that.)
    if decoded.len() < 2 || decoded.contains('?') || decoded.contains('#') {
        return None;
    }
    Some(decoded)
}

/// Minimal percent-decoding. Rejects malformed escapes and any byte that decodes
/// to a control character or a non-UTF-8 sequence, both of which mean this was
/// never a path from our own tree.
fn percent_decode(raw: &str) -> Option<String> {
    let bytes = raw.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' => {
                let hex = raw.get(i + 1..i + 3)?;
                out.push(u8::from_str_radix(hex, 16).ok()?);
                i += 3;
            }
            b => {
                out.push(b);
                i += 1;
            }
        }
    }
    let text = String::from_utf8(out).ok()?;
    if text.chars().any(|c| c.is_control()) {
        return None;
    }
    Some(text)
}

/// Cache file name: the path's digest plus its real extension, so the directory
/// stays flat (no mirrored tree to migrate when a prefix changes) while the
/// extension keeps a file identifiable by eye when someone opens the folder.
fn cache_name(path: &str) -> String {
    let digest = Sha256::digest(path.as_bytes());
    let hex = digest.iter().fold(String::new(), |mut acc, b| {
        use std::fmt::Write as _;
        let _ = write!(acc, "{b:02x}");
        acc
    });
    match extension(path) {
        Some(ext) => format!("{hex}.{ext}"),
        None => hex,
    }
}

fn extension(path: &str) -> Option<String> {
    let name = path.rsplit('/').next()?;
    let ext = name.rsplit_once('.')?.1;
    if ext.is_empty() || ext.len() > 8 || !ext.chars().all(|c| c.is_ascii_alphanumeric()) {
        return None;
    }
    Some(ext.to_ascii_lowercase())
}

/// Content type from the extension. Unlike `icons.rs` this does NOT sniff the
/// bytes: the paths come from our own asset tree, where the extension is
/// authoritative, and a sniff would have to happen on the cache-hit path too —
/// the one that has to stay cheap.
fn mime_of(path: &str) -> &'static str {
    match extension(path).as_deref() {
        Some("png") => "image/png",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("avif") => "image/avif",
        Some("svg") => "image/svg+xml",
        Some("json") => "application/json",
        Some("txt") => "text/plain; charset=utf-8",
        Some("mp3") => "audio/mpeg",
        Some("ogg") => "audio/ogg",
        Some("wav") => "audio/wav",
        Some("mp4") => "video/mp4",
        Some("webm") => "video/webm",
        _ => "application/octet-stream",
    }
}

fn respond_bytes(responder: UriSchemeResponder, mime: &str, bytes: Vec<u8>) {
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, mime)
        // Content-addressed by path in a tree whose files are replaced rather
        // than edited, so the webview may hold it as long as it likes. The
        // disk cache below is what actually persists it.
        .header(header::CACHE_CONTROL, "public, max-age=31536000, immutable")
        .body(bytes)
        .expect("static response builder cannot fail");
    responder.respond(response);
}

fn respond_status(responder: UriSchemeResponder, status: StatusCode) {
    let response = Response::builder()
        .status(status)
        .body(Vec::new())
        .expect("static response builder cannot fail");
    responder.respond(response);
}

/// Serve one asset request. Registered on the builder, so it runs for every
/// `boffasset://` URL the renderer puts in a `src`.
pub fn handle(
    ctx: UriSchemeContext<'_, tauri::Wry>,
    request: Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let app = ctx.app_handle().clone();

    // A cross-origin fetch of a cached asset is not a thing any tool does; only
    // GET is served so a page cannot use this handler as a writable surface.
    if request.method() != tauri::http::Method::GET {
        respond_status(responder, StatusCode::METHOD_NOT_ALLOWED);
        return;
    }

    let Some(path) = sanitize(request.uri().path()) else {
        respond_status(responder, StatusCode::BAD_REQUEST);
        return;
    };

    let Some(dir) = cache_dir(&app) else {
        // No data directory means no cache, and fetching without one would
        // re-download on every render. Fail visibly instead.
        respond_status(responder, StatusCode::INTERNAL_SERVER_ERROR);
        return;
    };
    let file = dir.join(cache_name(&path));

    // The hit path is the whole point of the module: no network, no async hop,
    // and it is what makes the tool work with no connection at all.
    if file.is_file() {
        match std::fs::read(&file) {
            Ok(bytes) => respond_bytes(responder, mime_of(&path), bytes),
            Err(_) => respond_status(responder, StatusCode::INTERNAL_SERVER_ERROR),
        }
        return;
    }

    tauri::async_runtime::spawn(async move {
        match download(&path).await {
            Ok(bytes) => {
                store(&dir, &file, &bytes);
                respond_bytes(responder, mime_of(&path), bytes);
            }
            // 404 rather than a placeholder image: the tool's own `onError` is
            // what decides how a missing asset looks, and a shell that invents
            // one would take that decision away from every tool at once.
            Err(status) => respond_status(responder, status),
        }
    });
}

async fn download(path: &str) -> Result<Vec<u8>, StatusCode> {
    let url = format!("{}{}", web_base_url(), path);
    let client = reqwest::Client::builder()
        .user_agent(concat!(
            "FicusLabs/BoffmediaApp/",
            env!("CARGO_PKG_VERSION"),
            " (boffmedia.es)"
        ))
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    let mut res = client
        .get(&url)
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;
    if !res.status().is_success() {
        // The upstream status is passed through where it is meaningful, so a
        // genuinely missing asset reads as 404 in devtools rather than as an
        // outage.
        return Err(StatusCode::from_u16(res.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY));
    }
    if res
        .content_length()
        .is_some_and(|len| len > MAX_ASSET_BYTES)
    {
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }

    let mut bytes: Vec<u8> = Vec::new();
    while let Some(chunk) = res.chunk().await.map_err(|_| StatusCode::BAD_GATEWAY)? {
        if bytes.len() as u64 + chunk.len() as u64 > MAX_ASSET_BYTES {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}

/// Write through a temp file so an interrupted write can never leave a
/// truncated image to be served from cache forever. A failure here is not
/// fatal: the bytes in hand still render, they just cost another fetch later.
fn store(dir: &Path, file: &Path, bytes: &[u8]) {
    let temp = file.with_extension("part");
    if std::fs::write(&temp, bytes).is_ok() && std::fs::rename(&temp, file).is_ok() {
        if WRITES.fetch_add(1, Ordering::Relaxed) % SWEEP_EVERY == 0 {
            let dir = dir.to_path_buf();
            tauri::async_runtime::spawn_blocking(move || sweep(&dir));
        }
    } else {
        let _ = std::fs::remove_file(&temp);
    }
}

/// Enforce the cap, oldest first.
///
/// Least-recently-WRITTEN, not least-recently-used: reads do not touch mtime,
/// so a file that is displayed on every launch still ages out eventually. That
/// is the honest trade for not writing to disk on every cache hit — the cost of
/// being wrong is one re-download, and pruning to 80% means it is not a
/// thrash-on-every-write either.
pub fn sweep(dir: &Path) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut files: Vec<(SystemTime, u64, PathBuf)> = Vec::new();
    let mut total: u64 = 0;
    for entry in entries.flatten() {
        let Ok(meta) = entry.metadata() else { continue };
        if !meta.is_file() {
            continue;
        }
        let modified = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
        total += meta.len();
        files.push((modified, meta.len(), entry.path()));
    }
    if total <= CACHE_CAP_BYTES {
        return;
    }

    files.sort_by_key(|(modified, _, _)| *modified);
    let target = CACHE_CAP_BYTES / 5 * 4;
    for (_, len, path) in files {
        if total <= target {
            break;
        }
        if std::fs::remove_file(&path).is_ok() {
            total = total.saturating_sub(len);
        }
    }
}

/// One sweep at startup, off the launch path. Without it a cache that went over
/// the cap in a session that then wrote nothing more would stay over it
/// forever, since sweeps otherwise only happen on a write.
pub fn sweep_on_startup(app: &tauri::AppHandle) {
    let Some(dir) = cache_dir(app) else { return };
    tauri::async_runtime::spawn_blocking(move || sweep(&dir));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_real_asset_path() {
        assert_eq!(
            sanitize("/boffmedia/tools/tcg/a1/001.webp").as_deref(),
            Some("/boffmedia/tools/tcg/a1/001.webp")
        );
    }

    #[test]
    fn rejects_traversal_and_absolute_forms() {
        for raw in [
            "/../../secrets.json",
            "/tools/../../etc/passwd",
            "/tools/%2e%2e/x.png",
            "\\tools\\x.png",
            "//evil.example.com/x.png",
            "relative/x.png",
            "/",
        ] {
            assert!(sanitize(raw).is_none(), "should have refused {raw}");
        }
    }

    #[test]
    fn decodes_the_escapes_a_real_tree_contains() {
        // Spaces and accents are real in this tree ("Pokémon Red (USA).zip").
        assert_eq!(
            sanitize("/smartrotom/img/Pok%C3%A9mon%20Red.png").as_deref(),
            Some("/smartrotom/img/Pokémon Red.png")
        );
    }

    #[test]
    fn names_are_stable_and_carry_the_extension() {
        let a = cache_name("/boffmedia/tools/tcg/a1/001.webp");
        assert_eq!(a, cache_name("/boffmedia/tools/tcg/a1/001.webp"));
        assert!(a.ends_with(".webp"));
        assert_ne!(a, cache_name("/boffmedia/tools/tcg/a1/002.webp"));
    }

    /// A cache directory holding `count` files of `size` bytes, oldest first by
    /// mtime — `sweep` orders by mtime, so the fixture has to make that order
    /// real rather than assume creation order survives the filesystem.
    fn seeded_cache(count: usize, size: usize) -> tempdir::TempCacheDir {
        let dir = tempdir::TempCacheDir::new();
        for i in 0..count {
            let path = dir.path().join(format!("{i:04}.png"));
            std::fs::write(&path, vec![0u8; size]).unwrap();
            let when = SystemTime::UNIX_EPOCH + Duration::from_secs(1_700_000_000 + i as u64 * 60);
            filetime_set(&path, when);
        }
        dir
    }

    fn filetime_set(path: &Path, when: SystemTime) {
        let file = std::fs::OpenOptions::new().write(true).open(path).unwrap();
        file.set_modified(when).unwrap();
    }

    fn total_bytes(dir: &Path) -> u64 {
        std::fs::read_dir(dir)
            .unwrap()
            .flatten()
            .filter_map(|e| e.metadata().ok())
            .filter(|m| m.is_file())
            .map(|m| m.len())
            .sum()
    }

    #[test]
    fn store_writes_the_file_and_leaves_no_partial() {
        let dir = tempdir::TempCacheDir::new();
        let file = dir.path().join("a.png");
        store(dir.path(), &file, b"bytes");
        assert_eq!(std::fs::read(&file).unwrap(), b"bytes");
        assert!(!file.with_extension("part").exists());
    }

    #[test]
    fn sweep_leaves_a_cache_under_the_cap_alone() {
        let dir = seeded_cache(4, 16);
        sweep(dir.path());
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 4);
    }

    #[test]
    fn sweep_evicts_oldest_first_down_to_the_low_water_mark() {
        // Ten files of a tenth of the cap each: 25% over, so the sweep has to
        // drop enough to reach 80% and no more.
        let size = (CACHE_CAP_BYTES / 8) as usize;
        let dir = seeded_cache(10, size);
        assert!(total_bytes(dir.path()) > CACHE_CAP_BYTES);

        sweep(dir.path());

        let after = total_bytes(dir.path());
        assert!(after <= CACHE_CAP_BYTES / 5 * 4, "still over: {after}");
        // The survivors are the NEWEST ones: eviction by age, not by name.
        assert!(!dir.path().join("0000.png").exists());
        assert!(dir.path().join("0009.png").exists());
    }

    /// A self-cleaning temp directory. `tempfile` is not a dependency of this
    /// crate and one test module is a poor reason to add one.
    mod tempdir {
        use std::path::{Path, PathBuf};

        pub struct TempCacheDir(PathBuf);

        impl TempCacheDir {
            pub fn new() -> Self {
                let path = std::env::temp_dir()
                    .join("boff-asset-cache-test")
                    .join(uuid::Uuid::new_v4().to_string());
                std::fs::create_dir_all(&path).unwrap();
                Self(path)
            }
            pub fn path(&self) -> &Path {
                &self.0
            }
        }

        impl Drop for TempCacheDir {
            fn drop(&mut self) {
                let _ = std::fs::remove_dir_all(&self.0);
            }
        }
    }

    #[test]
    fn mime_comes_from_the_extension() {
        assert_eq!(mime_of("/x/y.png"), "image/png");
        assert_eq!(mime_of("/x/y.WEBP"), "image/webp");
        assert_eq!(mime_of("/x/y.svg"), "image/svg+xml");
        assert_eq!(mime_of("/x/y"), "application/octet-stream");
    }
}
