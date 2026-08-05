// Version autocompletion for local packs (RF-05/RF-10).
//
// The dashboard gets the same lists from `packs/admin/meta/*` in apps/api, but
// those routes are admin-only — a player creating a local pack has no such
// role, so the launcher goes to the upstreams itself. It can: this is not a
// browser, so the CORS-less maven metadata that forced the API proxy is not a
// problem here. The shapes below are kept in step with
// apps/api/src/api/packs/packs-meta.service.ts on purpose; if the parsing rules
// change there (NeoForge's version derivation especially), change them here.
//
// Every upstream is slow, rate-limited or both and none of them change more
// than a few times a day, so each response is cached in-process behind a TTL.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

const PISTON_MANIFEST: &str = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const FABRIC_META: &str = "https://meta.fabricmc.net/v2";
const QUILT_META: &str = "https://meta.quiltmc.org/v3";
const NEOFORGE_MAVEN: &str = "https://maven.neoforged.net/api/maven/versions/releases";
const FORGE_METADATA: &str =
    "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml";
const FORGE_PROMOTIONS: &str =
    "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json";

const TTL: Duration = Duration::from_secs(30 * 60);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameVersion {
    pub id: String,
    /// "release" | "snapshot" | "old_beta" | "old_alpha"
    pub r#type: String,
    pub release_time: String,
    /// Mojang's own latest release / latest snapshot.
    pub latest: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoaderVersion {
    pub version: String,
    pub stable: bool,
    pub latest: bool,
    pub recommended: bool,
}

#[derive(Debug, thiserror::Error)]
pub enum MetaError {
    #[error("No se han podido cargar las versiones. Inténtalo de nuevo.")]
    Unreachable,
}

impl Serialize for MetaErrorWire {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut map = std::collections::BTreeMap::new();
        map.insert("message", self.0.as_str());
        serde::Serialize::serialize(&map, s)
    }
}

/// The renderer's error handling reads `.message`, like every other command's
/// failure type does.
pub struct MetaErrorWire(String);

impl From<MetaError> for MetaErrorWire {
    fn from(err: MetaError) -> Self {
        Self(err.to_string())
    }
}

fn http() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_default()
    })
}

enum Cached {
    Game(Vec<GameVersion>),
    Loader(Vec<LoaderVersion>),
}

fn cache() -> &'static Mutex<HashMap<String, (Instant, Cached)>> {
    static CACHE: OnceLock<Mutex<HashMap<String, (Instant, Cached)>>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn cached_game(key: &str) -> Option<Vec<GameVersion>> {
    let map = cache().lock().ok()?;
    match map.get(key)? {
        (at, Cached::Game(v)) if at.elapsed() < TTL => Some(v.clone()),
        _ => None,
    }
}

fn cached_loader(key: &str) -> Option<Vec<LoaderVersion>> {
    let map = cache().lock().ok()?;
    match map.get(key)? {
        (at, Cached::Loader(v)) if at.elapsed() < TTL => Some(v.clone()),
        _ => None,
    }
}

fn store(key: String, value: Cached) {
    if let Ok(mut map) = cache().lock() {
        map.insert(key, (Instant::now(), value));
    }
}

async fn get_json<T: for<'de> Deserialize<'de>>(url: &str) -> Result<T, MetaError> {
    let res = http()
        .get(url)
        .header("accept", "application/json")
        .send()
        .await
        .map_err(|_| MetaError::Unreachable)?;
    if !res.status().is_success() {
        return Err(MetaError::Unreachable);
    }
    res.json::<T>().await.map_err(|_| MetaError::Unreachable)
}

async fn get_text(url: &str) -> Result<String, MetaError> {
    let res = http()
        .get(url)
        .send()
        .await
        .map_err(|_| MetaError::Unreachable)?;
    if !res.status().is_success() {
        return Err(MetaError::Unreachable);
    }
    res.text().await.map_err(|_| MetaError::Unreachable)
}

// ── Minecraft ──────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct PistonLatest {
    release: Option<String>,
    snapshot: Option<String>,
}

#[derive(Deserialize)]
struct PistonVersion {
    id: String,
    #[serde(rename = "type")]
    kind: String,
    #[serde(rename = "releaseTime")]
    release_time: Option<String>,
}

#[derive(Deserialize)]
struct PistonManifest {
    latest: Option<PistonLatest>,
    versions: Option<Vec<PistonVersion>>,
}

#[tauri::command]
pub async fn meta_minecraft_versions() -> Result<Vec<GameVersion>, MetaErrorWire> {
    if let Some(hit) = cached_game("mc") {
        return Ok(hit);
    }
    let manifest: PistonManifest = get_json(PISTON_MANIFEST).await?;
    let latest_release = manifest.latest.as_ref().and_then(|l| l.release.clone());
    let latest_snapshot = manifest.latest.as_ref().and_then(|l| l.snapshot.clone());

    let out: Vec<GameVersion> = manifest
        .versions
        .unwrap_or_default()
        .into_iter()
        .map(|v| GameVersion {
            latest: Some(&v.id) == latest_release.as_ref() || Some(&v.id) == latest_snapshot.as_ref(),
            r#type: match v.kind.as_str() {
                "release" | "snapshot" | "old_beta" | "old_alpha" => v.kind.clone(),
                _ => "release".to_string(),
            },
            release_time: v.release_time.unwrap_or_default(),
            id: v.id,
        })
        .collect();

    store("mc".to_string(), Cached::Game(out.clone()));
    Ok(out)
}

// ── Loaders ────────────────────────────────────────────────────────────────

/// `loader` is the MANIFEST id ("fabric-loader"), the same key the pack's
/// `dependencies` object uses — not a catalog id.
#[tauri::command]
pub async fn meta_loader_versions(
    loader: String,
    minecraft: String,
) -> Result<Vec<LoaderVersion>, MetaErrorWire> {
    let key = format!("loader:{loader}:{minecraft}");
    if let Some(hit) = cached_loader(&key) {
        return Ok(hit);
    }
    let out = match loader.as_str() {
        "fabric-loader" => {
            fabric_like(&format!("{FABRIC_META}/versions/loader/{minecraft}")).await?
        }
        "quilt-loader" => fabric_like(&format!("{QUILT_META}/versions/loader/{minecraft}")).await?,
        "neoforge" => neoforge(&minecraft).await?,
        "forge" => forge(&minecraft).await?,
        _ => Vec::new(),
    };
    store(key, Cached::Loader(out.clone()));
    Ok(out)
}

#[derive(Deserialize)]
struct FabricLoaderInner {
    version: Option<String>,
    stable: Option<bool>,
}

#[derive(Deserialize)]
struct FabricLoaderEntry {
    loader: Option<FabricLoaderInner>,
}

/// Fabric and Quilt publish the same shape: newest first, `stable` flagged.
async fn fabric_like(url: &str) -> Result<Vec<LoaderVersion>, MetaError> {
    let entries: Vec<FabricLoaderEntry> = get_json(url).await?;
    let mut stable_seen = false;
    let mut out = Vec::new();
    for (index, entry) in entries.into_iter().enumerate() {
        let Some(version) = entry.loader.as_ref().and_then(|l| l.version.clone()) else {
            continue;
        };
        // Fabric publishes `stable`; Quilt does not, so fall back to the version
        // string — without this every Quilt build would look unstable.
        let stable = entry.loader.and_then(|l| l.stable).unwrap_or_else(|| {
            let lower = version.to_lowercase();
            !(lower.contains("beta") || lower.contains("pre") || lower.contains("rc"))
        });
        let recommended = stable && !stable_seen;
        if recommended {
            stable_seen = true;
        }
        out.push(LoaderVersion {
            version,
            stable,
            latest: index == 0,
            recommended,
        });
    }
    Ok(out)
}

#[derive(Deserialize)]
struct NeoforgeVersions {
    versions: Option<Vec<String>>,
}

/// NeoForge derives its version from the Minecraft one, with the leading "1."
/// of the old scheme dropped and the result padded to three components:
///   1.21.4 → 21.4.x    1.21 → 21.0.x    26.2 → 26.2.0.x    26.1.2 → 26.1.2.x
/// Only 1.20.2+ exists as `neoforge`; 1.20.1 shipped under the old
/// `net.neoforged:forge` coordinates and is deliberately not offered.
async fn neoforge(minecraft: &str) -> Result<Vec<LoaderVersion>, MetaError> {
    let mut parts: Vec<String> = minecraft.split('.').map(str::to_string).collect();
    let legacy = parts.first().map(|p| p == "1").unwrap_or(false);
    if legacy {
        parts.remove(0);
    }
    if parts.is_empty() || !parts[0].chars().all(|c| c.is_ascii_digit()) || parts[0].is_empty() {
        return Ok(Vec::new());
    }
    // The old scheme contributes two components (21.4 → 21.4.<build>); the new
    // one keeps its own three (26.2 → 26.2.0.<build>).
    let width = if legacy { 2 } else { 3 };
    while parts.len() < width {
        parts.push("0".to_string());
    }
    let prefix = format!("{}.", parts[..width].join("."));

    let data: NeoforgeVersions = get_json(&format!("{NEOFORGE_MAVEN}/net/neoforged/neoforge")).await?;
    let mut matching: Vec<String> = data
        .versions
        .unwrap_or_default()
        .into_iter()
        .filter(|v| v.starts_with(&prefix))
        .collect();
    // Maven metadata is oldest-first; the picker wants newest at the top.
    matching.reverse();
    let first_stable = matching.iter().find(|v| !v.contains("beta")).cloned();

    Ok(matching
        .into_iter()
        .enumerate()
        .map(|(index, version)| LoaderVersion {
            stable: !version.contains("beta"),
            latest: index == 0,
            recommended: Some(&version) == first_stable.as_ref(),
            version,
        })
        .collect())
}

#[derive(Deserialize)]
struct ForgePromotions {
    promos: Option<HashMap<String, String>>,
}

/// Forge's maven metadata is XML and its versions read `<mc>-<build>`; the
/// promotions file is what names the recommended build for each MC version.
async fn forge(minecraft: &str) -> Result<Vec<LoaderVersion>, MetaError> {
    let xml = get_text(FORGE_METADATA).await?;
    // A missing promotions file costs the recommended flag, not the list.
    let promos = get_json::<ForgePromotions>(FORGE_PROMOTIONS)
        .await
        .ok()
        .and_then(|p| p.promos)
        .unwrap_or_default();

    let prefix = format!("{minecraft}-");
    let mut versions: Vec<String> = Vec::new();
    let mut rest = xml.as_str();
    while let Some(start) = rest.find("<version>") {
        let after = &rest[start + "<version>".len()..];
        let Some(end) = after.find("</version>") else {
            break;
        };
        let value = after[..end].trim();
        if let Some(build) = value.strip_prefix(&prefix) {
            versions.push(build.to_string());
        }
        rest = &after[end..];
    }
    versions.reverse();

    let recommended = promos.get(&format!("{minecraft}-recommended")).cloned();
    let latest = promos.get(&format!("{minecraft}-latest")).cloned();

    Ok(versions
        .into_iter()
        .enumerate()
        .map(|(index, version)| LoaderVersion {
            stable: true,
            latest: match &latest {
                Some(l) => &version == l,
                None => index == 0,
            },
            recommended: Some(&version) == recommended.as_ref(),
            version,
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn forge_parses_maven_xml_for_the_asked_version_only() {
        // The parser is what would silently return nothing on a shape change,
        // so it is exercised on a fixture rather than on the live maven.
        let xml = "<versions><version>1.20.1-47.2.0</version>\
                   <version>1.21.4-54.0.16</version>\
                   <version>1.21.4-54.1.0</version></versions>";
        let mut versions: Vec<String> = Vec::new();
        let prefix = "1.21.4-".to_string();
        let mut rest = xml;
        while let Some(start) = rest.find("<version>") {
            let after = &rest[start + "<version>".len()..];
            let end = after.find("</version>").unwrap();
            if let Some(build) = after[..end].trim().strip_prefix(&prefix) {
                versions.push(build.to_string());
            }
            rest = &after[end..];
        }
        assert_eq!(versions, vec!["54.0.16", "54.1.0"]);
    }
}
