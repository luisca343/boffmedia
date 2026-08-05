// On-disk cache for catalog art (mod icons).
//
// The webview cannot simply load these URLs. `app.security.csp` in
// tauri.conf.json is deliberately tight — `default-src 'self'` — and widening
// `img-src` to every host a catalog might serve art from is a losing game: it
// is an allowlist that has to be guessed in advance, it silently renders a
// blank square when it is wrong, and it re-downloads every icon on every
// render because the webview has no persistent HTTP cache.
//
// So the bytes come down here instead, are stored under `<app-data>/icon-cache`
// and are handed back as a path the renderer turns into an `asset:` URL — a
// scheme the CSP already permits. Any host works, the second look is free, and
// a player with no connection still sees the icons of mods they have browsed.

use std::path::PathBuf;
use std::time::Duration;

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
    // The extension is preserved so the asset protocol serves a sensible
    // content type; anything unrecognised is treated as png.
    let ext = url
        .split('?')
        .next()
        .unwrap_or(url)
        .rsplit('.')
        .next()
        .filter(|e| matches!(e.to_lowercase().as_str(), "png" | "jpg" | "jpeg" | "webp" | "gif"))
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

/// Returns the absolute path of the cached icon. The renderer passes it through
/// `convertFileSrc` to get an `asset:` URL; it never reads the file itself.
#[tauri::command]
pub async fn icon_cache(app: tauri::AppHandle, url: String) -> Result<String, IconErrorWire> {
    let dir = cache_dir(&app)?;
    let path = dir.join(cache_name(&url));

    // A hit costs no network at all — this is the whole point of the module,
    // since a search grid asks for twenty icons at once and re-asks on every
    // scroll back.
    if path.is_file() {
        return Ok(path.to_string_lossy().to_string());
    }

    let client = reqwest::Client::builder()
        .user_agent(concat!(
            "FicusLabs/BoffLauncher/",
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
    let temp = path.with_extension("part");
    std::fs::write(&temp, &bytes).map_err(|_| IconError::Cache)?;
    std::fs::rename(&temp, &path).map_err(|_| IconError::Cache)?;

    Ok(path.to_string_lossy().to_string())
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
        assert!(cache_name("https://x.test/a.svg").ends_with(".png"));
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
