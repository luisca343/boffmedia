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

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
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
pub(crate) fn cache_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
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
/// The query a URL may carry, or `None` for "there was none".
///
/// Only a cache-busting stamp is meaningful here — `?v=<dataset version>`, the
/// one Mewgenics appends to every asset it asks for — so this accepts the shape
/// of one and refuses anything else rather than reasoning about it. It ends up
/// in a FILE NAME (through `cache_name`) and in an outbound URL, so the same
/// "strict rather than clever" rule as `sanitize` applies.
fn sanitize_query(raw: Option<&str>) -> Option<String> {
    let raw = raw?;
    if raw.is_empty() || raw.len() > 64 {
        return None;
    }
    if !raw
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '=' | '&' | '.' | '-' | '_'))
    {
        return None;
    }
    Some(raw.to_string())
}

/// The cache file for one request.
///
/// `key` is what identifies the bytes (the path, plus any version stamp) and
/// `path` is only where the extension comes from — a stamped key ends in
/// `.json?v=3`, which is not an extension, and a cache directory full of
/// extensionless blobs is harder to look at when something goes wrong.
fn cache_name(key: &str, path: &str) -> String {
    let digest = Sha256::digest(key.as_bytes());
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

/// The renderer runs on `tauri://localhost` and this scheme is a DIFFERENT
/// origin, so everything the webview does here is a cross-origin request. For
/// an `<img src>` that only meant a tainted canvas — until a tool needed to
/// read the pixels back (Mewgenics recolours its cats from a palette PNG), and
/// `crossOrigin="anonymous"` turns a missing header into a load FAILURE rather
/// than a taint. `fetch()` of a JSON dataset never worked without it at all.
///
/// `*` is the honest value: this scheme serves one app's own public assets to
/// that app, it is not reachable from a browser, and it is GET-only.
/// NOTE: the header is only half of it. `tauri.conf.json`'s CSP must also list
/// this scheme in **connect-src**, not just `img-src`/`media-src` — those cover
/// an `<img>` and a `<video>`, and a tool that FETCHES a JSON dataset through
/// the scheme (Mewgenics is the first) is refused by the policy before the
/// request is ever made, with nothing but "Failed to fetch" to show for it.
fn cors(builder: tauri::http::response::Builder) -> tauri::http::response::Builder {
    builder.header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
}

fn respond_bytes(responder: UriSchemeResponder, mime: &str, bytes: Vec<u8>) {
    let response = cors(Response::builder())
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
    let response = cors(Response::builder())
        .status(status)
        .body(Vec::new())
        .expect("static response builder cannot fail");
    responder.respond(response);
}

/// Serve one asset request. Registered on the builder, so it runs for every
/// `boffasset://` URL the renderer puts in a `src`. Kept to sanitizing the
/// request and spawning: the whole hit-or-fetch path lives in `resolve`,
/// off the protocol thread and free of `UriSchemeResponder` so it can be
/// driven directly from a test.
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
    // The version stamp is part of the IDENTITY of what was asked for, not
    // noise to drop. Keying the cache on the path alone meant a re-scraped
    // dataset could never reach a player who had already opened the tool once:
    // the new `?v=` asked for a new file and got the old one back, forever.
    let query = sanitize_query(request.uri().query());
    let keyed = match &query {
        Some(q) => format!("{path}?{q}"),
        None => path.clone(),
    };

    let Some(dir) = cache_dir(&app) else {
        // No data directory means no cache, and fetching without one would
        // re-download on every render. Fail visibly instead.
        respond_status(responder, StatusCode::INTERNAL_SERVER_ERROR);
        return;
    };

    tauri::async_runtime::spawn(async move {
        // A pack hit wins BEFORE is_revalidated() and before the asset
        // cache (D-10): once a tool's data pack is installed, its files ARE
        // the version of record, and the query string (the loose-file
        // cache's version stamp) is ignored entirely — see
        // `tool_packs::resolve`. A stale pointer whose target went missing
        // falls straight through to the normal path below rather than
        // erroring.
        if let Some(file) = crate::tool_packs::resolve(&app, &path) {
            if let Ok(bytes) = tokio::fs::read(&file).await {
                respond_bytes(responder, mime_of(&path), bytes);
                return;
            }
        }
        let result = resolve(&web_base_url(), client(), &dir, &path, query.as_deref(), &keyed).await;
        match result {
            Ok(bytes) => respond_bytes(responder, mime_of(&path), bytes),
            // 404 rather than a placeholder image: the tool's own `onError`
            // is what decides how a missing asset looks, and a shell that
            // invents one would take that decision away from every tool at
            // once.
            Err(status) => respond_status(responder, status),
        }
    });
}

/// Files that describe the rest of the tree, and so cannot be cached against
/// their own contents. Kept as a suffix list rather than a full path so a
/// second tool with a manifest of its own needs no change here. `packs/index.json`
/// (RF3) is the same shape: it is rewritten in place on every publish and
/// names the version of record for every pack.
fn is_revalidated(path: &str) -> bool {
    path.ends_with("/manifest.json") || path.ends_with("/packs/index.json")
}

/// The whole hit-or-fetch path for one request: cache hit, in-flight dedupe,
/// network fetch (conditional where the path is revalidated), and a stale
/// cache fallback on error. Free of `UriSchemeResponder` on purpose — `handle`
/// is the only caller that needs one, tests drive this directly.
async fn resolve(
    base: &str,
    client: &reqwest::Client,
    dir: &Path,
    path: &str,
    query: Option<&str>,
    keyed: &str,
) -> Result<Vec<u8>, StatusCode> {
    let file = dir.join(cache_name(keyed, path));
    let revalidated = is_revalidated(path);

    // The hit path is the whole point of the module: no network, no async hop,
    // and it is what makes the tool work with no connection at all.
    //
    // Except for the handful of files that ANNOUNCE a new dataset. Those carry
    // no version stamp of their own — they are what the stamp is read from —
    // so serving them from cache unconditionally would freeze a tool on the
    // first dataset it ever saw.
    if !revalidated {
        if let Ok(bytes) = tokio::fs::read(&file).await {
            return Ok(bytes);
        }
    }

    // Serialize identical requests: a cold grid asks for the same never-seen
    // icon, or the same manifest, many times over in one paint, and only one
    // of them should ever reach the network.
    let guard = inflight(keyed.to_string()).await;

    if !revalidated {
        // Re-check: whoever held the lock before us may have just filled
        // this exact file while we were waiting for it.
        if let Ok(bytes) = tokio::fs::read(&file).await {
            return Ok(bytes);
        }
        let result = match download_from(base, client, path, query, None).await {
            Ok(Downloaded::Body { bytes, .. }) => {
                store(dir, &file, &bytes);
                Ok(bytes)
            }
            // No If-None-Match was sent, so a 304 here is the upstream
            // misbehaving rather than anything this module asked for.
            Ok(Downloaded::NotModified) => Err(StatusCode::BAD_GATEWAY),
            Err(status) => match tokio::fs::read(&file).await {
                // The stale copy beats an error: this is the offline launch.
                Ok(bytes) => Ok(bytes),
                Err(_) => Err(status),
            },
        };
        drop(guard);
        return result;
    }

    let etag = read_etag(&file).await;
    let result = match download_from(base, client, path, query, etag.as_deref()).await {
        Ok(Downloaded::NotModified) => match tokio::fs::read(&file).await {
            Ok(bytes) => Ok(bytes),
            // A sweep can evict the body and leave the tiny sidecar behind;
            // a 304 with nothing to serve means the conditional GET was a
            // false economy, so ask again with no condition at all.
            Err(_) => match download_from(base, client, path, query, None).await {
                Ok(Downloaded::Body { bytes, etag }) => {
                    store(dir, &file, &bytes);
                    if let Some(etag) = etag {
                        write_etag(&file, &etag).await;
                    }
                    Ok(bytes)
                }
                // No If-None-Match was sent, so a 304 here is the upstream
                // misbehaving rather than anything this module asked for.
                Ok(Downloaded::NotModified) => Err(StatusCode::BAD_GATEWAY),
                Err(status) => Err(status),
            },
        },
        Ok(Downloaded::Body { bytes, etag }) => {
            store(dir, &file, &bytes);
            if let Some(etag) = etag {
                write_etag(&file, &etag).await;
            }
            Ok(bytes)
        }
        Err(status) => match tokio::fs::read(&file).await {
            Ok(bytes) => Ok(bytes),
            Err(_) => Err(status),
        },
    };
    drop(guard);
    result
}

/// The client every request shares: built once, kept alive across requests
/// (connection pooling matters when a cold grid fires ~300 of these), and
/// compiled with the gzip + brotli features so it negotiates compression
/// with whatever sits in front of `boffmedia.es`.
///
/// A decompressed response has no `Content-Length` (reqwest drops the header
/// once it has transparently inflated the body), which is why the byte cap in
/// `download_from` is enforced on the bytes actually streamed off the wire,
/// never on that header alone.
pub(crate) fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent(concat!(
                "FicusLabs/BoffmediaApp/",
                env!("CARGO_PKG_VERSION"),
                " (boffmedia.es)"
            ))
            .timeout(Duration::from_secs(20))
            .build()
            .expect("static reqwest client config is never invalid")
    })
}

/// The client for `tool_packs.rs`'s bulk ZIP downloads ONLY — never reuse
/// `client()` above for a response body that can run to tens of megabytes.
///
/// `client()`'s `.timeout(20s)` is reqwest's TOTAL request timeout: it covers
/// the entire response, headers through last byte, not just "is the server
/// answering". That is exactly right for the small per-file assets `client()`
/// serves (a slow single icon should fail fast), but it is a trap for a bulk
/// download — a 53 MB pack streamed at anything under ~2.7 MB/s hits the cap
/// and aborts no matter how much real progress is being made (found by a
/// throttled test: two installs each died at exactly 20 s, one at 19% down).
///
/// This client instead has NO total `.timeout()`. It sets `connect_timeout`
/// (fail fast if the server never answers at all) and `read_timeout`, which
/// reqwest documents as resetting after every successful read — an IDLE/stall
/// timeout, not a total one — so a connection that stops sending bytes for
/// 20 s still fails, but a slow-and-steady one runs to completion.
///
/// A second `OnceLock` (its own connection pool) rather than a per-request
/// override is deliberate: reqwest 0.12's `RequestBuilder::timeout()` can
/// override the total timeout per call, but `read_timeout` is a client-only
/// setting with no per-request equivalent, and `client()` already bakes in a
/// total timeout that would need overriding to `None` — which reqwest does
/// not support. Two pools for two very different traffic shapes (many small
/// concurrent fetches vs. one big sequential one) is an acceptable trade.
pub(crate) fn pack_client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent(concat!(
                "FicusLabs/BoffmediaApp/",
                env!("CARGO_PKG_VERSION"),
                " (boffmedia.es)"
            ))
            .connect_timeout(Duration::from_secs(20))
            .read_timeout(Duration::from_secs(20))
            .build()
            .expect("static reqwest client config is never invalid")
    })
}

/// One in-flight-dedupe map, keyed the same way the cache file is: the path
/// plus any version stamp. An RAII guard (below) removes an entry once
/// nothing is waiting on it, so this cannot grow to the size of the tree.
fn inflight_map() -> &'static Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>> {
    static MAP: OnceLock<Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>> = OnceLock::new();
    MAP.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Held for the duration of one request's network work. A second caller for
/// the same key blocks on `inflight` until this drops, then re-checks the
/// cache file rather than assuming it must now exist (`resolve` does that
/// re-check, not this guard).
struct InflightGuard {
    key: String,
    arc: Arc<tokio::sync::Mutex<()>>,
    // `Option` so `Drop` can release the lock before touching the map,
    // instead of holding it until the guard's fields are torn down in
    // declaration order.
    permit: Option<tokio::sync::OwnedMutexGuard<()>>,
}

async fn inflight(key: String) -> InflightGuard {
    let arc = {
        let mut map = inflight_map().lock().unwrap();
        map.entry(key.clone())
            .or_insert_with(|| Arc::new(tokio::sync::Mutex::new(())))
            .clone()
    };
    let permit = arc.clone().lock_owned().await;
    InflightGuard { key, arc, permit: Some(permit) }
}

impl Drop for InflightGuard {
    fn drop(&mut self) {
        // Let a waiter proceed before spending any time on map bookkeeping.
        self.permit.take();
        let mut map = inflight_map().lock().unwrap();
        // Two references left (the map's own entry, plus this guard's clone)
        // means nobody else is waiting on this key, so the entry can go.
        if Arc::strong_count(&self.arc) <= 2 {
            map.remove(&self.key);
        }
    }
}

/// Either a fresh body (with whatever `ETag` the response carried) or a 304.
enum Downloaded {
    Body { bytes: Vec<u8>, etag: Option<String> },
    NotModified,
}

/// `base` and `client` are parameters — not `web_base_url()` and `client()`
/// read directly — so a test can point this at a one-shot fake server
/// instead of the real site.
async fn download_from(
    base: &str,
    client: &reqwest::Client,
    path: &str,
    query: Option<&str>,
    if_none_match: Option<&str>,
) -> Result<Downloaded, StatusCode> {
    let url = match query {
        Some(q) => format!("{base}{path}?{q}"),
        None => format!("{base}{path}"),
    };
    let mut req = client.get(&url);
    if let Some(etag) = if_none_match {
        req = req.header(header::IF_NONE_MATCH, etag);
    }

    let mut res = req.send().await.map_err(|_| StatusCode::BAD_GATEWAY)?;

    if res.status() == StatusCode::NOT_MODIFIED {
        return Ok(Downloaded::NotModified);
    }
    if !res.status().is_success() {
        // The upstream status is passed through where it is meaningful, so a
        // genuinely missing asset reads as 404 in devtools rather than as an
        // outage.
        return Err(StatusCode::from_u16(res.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY));
    }
    // Best-effort only (see `client`'s doc comment): a compressed response
    // has no Content-Length at all, and even when the header is present the
    // authoritative check is the streamed total below.
    if res
        .content_length()
        .is_some_and(|len| len > MAX_ASSET_BYTES)
    {
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }
    let etag = res
        .headers()
        .get(header::ETAG)
        .and_then(|v| v.to_str().ok())
        .map(str::to_string);

    let mut bytes: Vec<u8> = Vec::new();
    while let Some(chunk) = res.chunk().await.map_err(|_| StatusCode::BAD_GATEWAY)? {
        if bytes.len() as u64 + chunk.len() as u64 > MAX_ASSET_BYTES {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(Downloaded::Body { bytes, etag })
}

/// The sidecar file an ETag lives in, next to the cached body it describes.
fn etag_file(file: &Path) -> PathBuf {
    let mut name = file.as_os_str().to_os_string();
    name.push(".etag");
    PathBuf::from(name)
}

async fn read_etag(file: &Path) -> Option<String> {
    let text = tokio::fs::read_to_string(etag_file(file)).await.ok()?;
    let trimmed = text.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

async fn write_etag(file: &Path, etag: &str) {
    // Best-effort, like `store`: a failed write only costs one more
    // unconditional fetch next time, never a broken response now.
    let _ = tokio::fs::write(etag_file(file), etag).await;
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
        let a = cache_name("/boffmedia/tools/tcg/a1/001.webp", "/boffmedia/tools/tcg/a1/001.webp");
        assert_eq!(
            a,
            cache_name("/boffmedia/tools/tcg/a1/001.webp", "/boffmedia/tools/tcg/a1/001.webp")
        );
        assert!(a.ends_with(".webp"));
        assert_ne!(
            a,
            cache_name("/boffmedia/tools/tcg/a1/002.webp", "/boffmedia/tools/tcg/a1/002.webp")
        );
        // A version stamp is part of the identity: same path, different bytes.
        let stamped = cache_name(
            "/boffmedia/tools/mewgenics/items.json?v=3",
            "/boffmedia/tools/mewgenics/items.json",
        );
        assert_ne!(
            stamped,
            cache_name(
                "/boffmedia/tools/mewgenics/items.json?v=4",
                "/boffmedia/tools/mewgenics/items.json",
            )
        );
        assert!(stamped.ends_with(".json"));
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

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn concurrent_requests_for_one_key_hit_upstream_once() {
        let server = fake_server::spawn(|_if_none_match| fake_server::ok(b"hello", None)).await;
        let base = format!("http://{}", server.addr);
        let client = reqwest::Client::new();
        let dir = tempdir::TempCacheDir::new();
        let path = "/boffmedia/tools/tcg/a1/001.webp";

        let (a, b) = tokio::join!(
            resolve(&base, &client, dir.path(), path, None, path),
            resolve(&base, &client, dir.path(), path, None, path),
        );
        assert_eq!(a.unwrap(), b"hello");
        assert_eq!(b.unwrap(), b"hello");
        assert_eq!(
            server.requests.load(Ordering::SeqCst),
            1,
            "two concurrent requests for the same key must reach the upstream once"
        );
    }

    #[tokio::test]
    async fn revalidated_path_sends_if_none_match_and_serves_cached_on_304() {
        const ETAG: &str = "\"v1\"";
        let server = fake_server::spawn(|if_none_match| {
            if if_none_match.as_deref() == Some(ETAG) {
                fake_server::not_modified()
            } else {
                fake_server::ok(b"{\"version\":1}", Some(ETAG))
            }
        })
        .await;
        let base = format!("http://{}", server.addr);
        let client = reqwest::Client::new();
        let dir = tempdir::TempCacheDir::new();
        let path = "/boffmedia/tools/mewgenics/manifest.json";

        let first = resolve(&base, &client, dir.path(), path, None, path)
            .await
            .unwrap();
        assert_eq!(first, b"{\"version\":1}");
        assert_eq!(server.requests.load(Ordering::SeqCst), 1);

        // Second time: the sidecar etag makes this a conditional GET, and the
        // fake server answers 304 — served from cache, no re-store.
        let second = resolve(&base, &client, dir.path(), path, None, path)
            .await
            .unwrap();
        assert_eq!(second, b"{\"version\":1}");
        assert_eq!(
            server.requests.load(Ordering::SeqCst),
            2,
            "a revalidated path still asks the network, conditionally"
        );

        // A sweep can evict the body and leave the sidecar behind. The next
        // 304 then has nothing to serve, so it must retry unconditionally
        // rather than surface an error.
        let file = dir.path().join(cache_name(path, path));
        std::fs::remove_file(&file).unwrap();
        assert!(etag_file(&file).exists(), "sidecar should survive the eviction");

        let third = resolve(&base, &client, dir.path(), path, None, path)
            .await
            .unwrap();
        assert_eq!(third, b"{\"version\":1}");
        assert_eq!(
            server.requests.load(Ordering::SeqCst),
            4,
            "a 304 with no cached body must retry unconditionally (one more \
             conditional request, then one unconditional one)"
        );
    }

    // N1 — the per-file asset client keeps its 20 s TOTAL timeout (small
    // assets should keep failing fast), while the bulk-pack client trades
    // that for connect + idle (read) timeouts, so a 53 MB download streamed
    // slowly-but-steadily is never killed mid-flight the way the blocker
    // reproduced (two installs each aborted at exactly 20 s).
    //
    // reqwest 0.12 exposes no public getter for a built `Client`'s timeout
    // config, so this reads it back off `Client`'s `Debug` impl, which is
    // deliberately built to surface exactly this: `ClientRef::fmt_fields`
    // (reqwest src/async_impl/client.rs) prints a `read_timeout` field when
    // one is set, and prints the total-timeout field (via
    // `RequestConfig<TotalTimeout>::fmt_as_field`) only when `.timeout(..)`
    // was set on the builder. A behavioural test that actually waits out a
    // 20 s+ trickling body belongs in a manual/perf run, not this suite.
    #[test]
    fn pack_client_drops_the_total_timeout_the_asset_client_keeps() {
        let asset = format!("{:?}", client());
        assert!(
            asset.contains("TotalTimeout"),
            "asset client() must still report a total timeout (small assets should fail fast): {asset}"
        );
        assert!(
            !asset.contains("read_timeout"),
            "asset client() should not be carrying a read/idle timeout: {asset}"
        );

        let pack = format!("{:?}", pack_client());
        assert!(
            !pack.contains("TotalTimeout"),
            "pack_client() must NOT have a total request timeout — that is the 20s trap this test \
             guards against (N1): {pack}"
        );
        assert!(
            pack.contains("read_timeout"),
            "pack_client() must configure a read/idle timeout so a stalled connection still fails: {pack}"
        );

        // `connect_timeout` is not one of the fields the BUILT `Client`'s
        // `Debug` impl exposes (only `ClientBuilder`'s pre-build Debug prints
        // it) — asserted here instead on an equivalently-configured builder,
        // to catch a future edit that drops the call from `pack_client()`.
        let builder_debug = format!(
            "{:?}",
            reqwest::Client::builder()
                .connect_timeout(Duration::from_secs(20))
                .read_timeout(Duration::from_secs(20))
        );
        assert!(
            builder_debug.contains("connect_timeout"),
            "pack_client()'s recipe must set a connect timeout so an unreachable host fails fast: {builder_debug}"
        );
    }

    /// A one-shot fake HTTP/1.1 server on a real `TcpListener`, for the two
    /// tests above. There is no HTTP client mocking crate in this workspace,
    /// and `download_from` takes `base`/`client` as parameters (D-15)
    /// precisely so a real socket is the smallest seam that makes a genuine
    /// concurrency test possible.
    mod fake_server {
        use std::net::SocketAddr;
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::sync::Arc;

        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        use tokio::net::TcpListener;

        pub struct FakeServer {
            pub addr: SocketAddr,
            pub requests: Arc<AtomicUsize>,
        }

        /// Spawns a background task that answers every connection with
        /// whatever `respond` returns for that request's `If-None-Match`
        /// value (raw HTTP bytes, status line included). The task outlives
        /// the function call; a `#[tokio::test]`'s runtime aborts it for us
        /// when the test ends, so nothing here needs an explicit shutdown.
        pub async fn spawn(
            respond: impl Fn(Option<String>) -> Vec<u8> + Send + Sync + 'static,
        ) -> FakeServer {
            let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
            let addr = listener.local_addr().unwrap();
            let requests = Arc::new(AtomicUsize::new(0));
            let counter = requests.clone();
            let respond = Arc::new(respond);
            tokio::spawn(async move {
                loop {
                    let Ok((socket, _)) = listener.accept().await else {
                        break;
                    };
                    let counter = counter.clone();
                    let respond = respond.clone();
                    tokio::spawn(async move {
                        serve_one(socket, &counter, respond.as_ref()).await;
                    });
                }
            });
            FakeServer { addr, requests }
        }

        async fn serve_one(
            mut socket: tokio::net::TcpStream,
            counter: &AtomicUsize,
            respond: &(dyn Fn(Option<String>) -> Vec<u8> + Send + Sync),
        ) {
            let mut buf = vec![0u8; 8192];
            let mut total = 0usize;
            loop {
                let n = socket.read(&mut buf[total..]).await.unwrap_or(0);
                if n == 0 {
                    return;
                }
                total += n;
                if buf[..total].windows(4).any(|w| w == b"\r\n\r\n") {
                    break;
                }
                if total == buf.len() {
                    buf.resize(buf.len() * 2, 0);
                }
            }
            let text = String::from_utf8_lossy(&buf[..total]);
            let if_none_match = text.lines().find_map(|line| {
                let (name, value) = line.split_once(':')?;
                name.trim()
                    .eq_ignore_ascii_case("if-none-match")
                    .then(|| value.trim().to_string())
            });
            counter.fetch_add(1, Ordering::SeqCst);
            let response = respond(if_none_match);
            let _ = socket.write_all(&response).await;
        }

        pub fn ok(body: &[u8], etag: Option<&str>) -> Vec<u8> {
            let mut head = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: application/octet-stream\r\nConnection: close\r\n",
                body.len()
            );
            if let Some(etag) = etag {
                head.push_str(&format!("ETag: {etag}\r\n"));
            }
            head.push_str("\r\n");
            let mut out = head.into_bytes();
            out.extend_from_slice(body);
            out
        }

        pub fn not_modified() -> Vec<u8> {
            b"HTTP/1.1 304 Not Modified\r\nConnection: close\r\n\r\n".to_vec()
        }
    }
}
