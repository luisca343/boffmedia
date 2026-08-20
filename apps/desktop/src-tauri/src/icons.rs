// On-disk cache for catalog art (mod icons), served to the webview as data: URLs.
//
// The webview cannot simply load these URLs. `app.security.csp` in
// tauri.conf.json is deliberately tight — `default-src 'self'` — and widening
// `img-src` to every host a catalog might serve art from is a losing game: it
// is an allowlist that has to be guessed in advance, it silently renders a
// blank square when it is wrong, and it re-downloads every icon on every
// render because the webview has no persistent HTTP cache.
//
// So the bytes come down here instead, are stored under `<app-data>/icon-cache`
// and are handed back as a `data:` URL the renderer drops straight into an
// <img>. Any host works, the second look is free, and a player with no
// connection still sees the icons of mods they have browsed.
//
// Do NOT hand back a file path for the asset protocol instead. The static
// `$APPDATA` scope in tauri.conf.json resolves under the bundle identifier while
// datadir.rs deliberately uses `%APPDATA%\Boffmedia[ Dev]`, so the scope never
// matches the real cache — and even a runtime `allow_directory` grant leaves
// WebView2 refusing the encoded paths. A data: URL has no scope, no protocol
// handler and no extension-derived content type to get wrong; the MIME is
// sniffed from the bytes themselves (`mime_of`), which browsers never do for
// SVG.

use std::path::PathBuf;
use std::time::Duration;

use base64::Engine as _;
use sha2::{Digest, Sha256};

/// Art is small. Anything larger is not an icon, and refusing it early keeps a
/// hostile or misconfigured URL from filling the player's disk.
const MAX_ICON_BYTES: u64 = 4 * 1024 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum IconError {
    #[error("No se ha podido descargar el icono.")]
    Unreachable,
    #[error("El icono es demasiado grande.")]
    TooLarge,
    #[error("No se ha podido guardar el icono en caché.")]
    Cache,
}

pub struct IconErrorWire(String);

impl serde::Serialize for IconErrorWire {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut map = std::collections::BTreeMap::new();
        map.insert("message", self.0.as_str());
        serde::Serialize::serialize(&map, s)
    }
}

impl From<IconError> for IconErrorWire {
    fn from(err: IconError) -> Self {
        Self(err.to_string())
    }
}

/// Content-addressed by URL, not by filename: two projects can both call their
/// art `icon.png`, and the URL is the only thing guaranteed to be distinct.
fn cache_name(url: &str) -> String {
    let digest = Sha256::digest(url.as_bytes());
    let hex: String = digest.iter().map(|b| format!("{b:02x}")).collect();
    // The extension is cosmetic since `mime_of` sniffs the bytes at serve
    // time, but keeping it makes the cache folder legible to a human and to
    // the extension fallback for formats the sniffer does not know.
    let ext = url
        .split('?')
        .next()
        .unwrap_or(url)
        .rsplit('.')
        .next()
        .filter(|e| {
            matches!(
                e.to_lowercase().as_str(),
                "png" | "jpg" | "jpeg" | "webp" | "gif" | "svg"
            )
        })
        .unwrap_or("png")
        .to_lowercase();
    format!("{hex}.{ext}")
}

fn cache_dir(app: &tauri::AppHandle) -> Result<PathBuf, IconError> {
    let dir = crate::datadir::data_root(app)
        .map_err(|_| IconError::Cache)?
        .join("icon-cache");
    std::fs::create_dir_all(&dir).map_err(|_| IconError::Cache)?;
    Ok(dir)
}

/// The MIME the data: URL declares. Magic numbers first: the URL's extension
/// lies often enough (query strings, extension-less CDN paths, an old cache
/// that renamed everything unknown to `.png`) that the bytes are the only
/// witness worth trusting. SVG is the case that makes this mandatory —
/// browsers sniff raster formats but never SVG, so a wrong label there renders
/// nothing at all.
fn mime_of(bytes: &[u8], name: &str) -> &'static str {
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        return "image/png";
    }
    if bytes.starts_with(b"\xff\xd8\xff") {
        return "image/jpeg";
    }
    if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        return "image/gif";
    }
    if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        return "image/webp";
    }
    // SVG is text that may open with a BOM, an XML prolog or a comment before
    // the root element, so look for the tag anywhere in the head of the file.
    let head = &bytes[..bytes.len().min(1024)];
    if std::str::from_utf8(head).is_ok_and(|s| s.contains("<svg")) {
        return "image/svg+xml";
    }
    match name.rsplit('.').next().map(str::to_ascii_lowercase).as_deref() {
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("svg") => "image/svg+xml",
        _ => "image/png",
    }
}

/// Returns the icon as a `data:` URL, downloading and caching it on first
/// sight. The renderer never sees a file path: paths meant an asset-protocol
/// scope to keep aligned with the custom data root, and that alignment is
/// exactly what silently broke (see the module comment).
#[tauri::command]
pub async fn icon_cache(app: tauri::AppHandle, url: String) -> Result<String, IconErrorWire> {
    let dir = cache_dir(&app)?;
    let path = dir.join(cache_name(&url));

    // A hit costs no network at all — this is the whole point of the module,
    // since a search grid asks for twenty icons at once and re-asks on every
    // scroll back.
    if path.is_file() {
        let bytes = std::fs::read(&path).map_err(|_| IconError::Cache)?;
        return Ok(as_data_url(&bytes, &path));
    }

    let client = reqwest::Client::builder()
        .user_agent(concat!(
            "FicusLabs/BoffmediaApp/",
            env!("CARGO_PKG_VERSION"),
            " (boffmedia.es)"
        ))
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|_| IconError::Unreachable)?;

    let mut res = client
        .get(&url)
        .send()
        .await
        .map_err(|_| IconError::Unreachable)?;
    if !res.status().is_success() {
        return Err(IconError::Unreachable.into());
    }
    if res.content_length().is_some_and(|len| len > MAX_ICON_BYTES) {
        return Err(IconError::TooLarge.into());
    }

    let mut bytes: Vec<u8> = Vec::new();
    while let Some(chunk) = res.chunk().await.map_err(|_| IconError::Unreachable)? {
        if bytes.len() as u64 + chunk.len() as u64 > MAX_ICON_BYTES {
            return Err(IconError::TooLarge.into());
        }
        bytes.extend_from_slice(&chunk);
    }

    // Write beside the target and rename, so a cancelled download can never
    // leave a truncated image that would then be served from cache forever.
    // A write failure is deliberately NOT fatal: the cache is an optimisation,
    // and the bytes in hand render fine without it.
    let temp = path.with_extension("part");
    if std::fs::write(&temp, &bytes).is_ok() {
        let _ = std::fs::rename(&temp, &path);
    }

    Ok(as_data_url(&bytes, &path))
}

fn as_data_url(bytes: &[u8], path: &std::path::Path) -> String {
    let name = path.file_name().map(|n| n.to_string_lossy()).unwrap_or_default();
    let mime = mime_of(bytes, &name);
    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
    format!("data:{mime};base64,{encoded}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_url_not_the_filename_addresses_the_cache() {
        // Both projects call their art icon.png; colliding on the basename is
        // how one mod ends up wearing another's icon.
        let a = cache_name("https://cdn.modrinth.com/data/AAA/icon.png");
        let b = cache_name("https://cdn.modrinth.com/data/BBB/icon.png");
        assert_ne!(a, b);
        assert!(a.ends_with(".png"));
    }

    #[test]
    fn a_query_string_does_not_become_the_extension() {
        assert!(cache_name("https://x.test/icon.png?v=2").ends_with(".png"));
    }

    #[test]
    fn an_unknown_extension_falls_back_to_png() {
        assert!(cache_name("https://x.test/icon").ends_with(".png"));
        assert!(cache_name("https://x.test/a.exe").ends_with(".png"));
    }

    #[test]
    fn svg_keeps_its_extension() {
        assert!(cache_name("https://cdn.modrinth.com/data/bXX9h73M/icon.svg").ends_with(".svg"));
    }

    #[test]
    fn mime_comes_from_the_bytes_not_the_name() {
        // Sniffed rather than taken from the extension, so a file cached under
        // the wrong one still serves with the right type.
        assert_eq!(mime_of(b"\x89PNG\r\n\x1a\nrest", "x.svg"), "image/png");
        assert_eq!(mime_of(b"\xff\xd8\xff\xe0rest", "x.png"), "image/jpeg");
        assert_eq!(mime_of(b"GIF89a...", "x.png"), "image/gif");
        assert_eq!(mime_of(b"RIFF\x00\x00\x00\x00WEBPVP8 ", "x.png"), "image/webp");
        assert_eq!(
            mime_of(b"<?xml version=\"1.0\"?>\n<svg xmlns=\"a\"></svg>", "x.png"),
            "image/svg+xml"
        );
    }

    #[test]
    fn unrecognised_bytes_fall_back_to_the_extension() {
        assert_eq!(mime_of(b"????", "x.webp"), "image/webp");
        assert_eq!(mime_of(b"????", "x"), "image/png");
    }

    #[test]
    fn the_data_url_is_wellformed() {
        let url = as_data_url(b"\x89PNG\r\n\x1a\n", std::path::Path::new("whatever.bin"));
        assert!(url.starts_with("data:image/png;base64,"));
    }

    #[test]
    fn the_same_url_is_always_the_same_file() {
        assert_eq!(
            cache_name("https://x.test/a/icon.webp"),
            cache_name("https://x.test/a/icon.webp")
        );
        assert!(cache_name("https://x.test/a/icon.webp").ends_with(".webp"));
    }
}
