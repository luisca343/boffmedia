// Mod browsing for local packs (RF-11): Modrinth, straight from the launcher.
//
// Why not the API's catalog proxy, which already speaks both platforms? Because
// those routes are `packs/admin/*` and require BOFF_ADMIN — a player building a
// local pack has no such role. This is the same reasoning that put meta.rs
// here, and the same shapes: the structs below mirror
// apps/api/src/api/packs/packs-catalog.service.ts and the TypeScript types in
// packages/ui/src/catalog/types.ts. Change one, change all three.
//
// Why NOT CurseForge: its API needs a key, and a key shipped inside a desktop
// binary is an extracted key, and an extracted key is a revoked key. That is
// written into the schema itself (FileSource in @boffmedia/pack-schema) and it
// is why a CurseForge file can only be authored server-side, by the dashboard.
// Local packs are therefore Modrinth-only, on purpose.
//
// Modrinth asks every client to identify itself in User-Agent; reqwest is not a
// browser, so unlike the renderer we can actually comply.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha512};

const MODRINTH: &str = "https://api.modrinth.com/v2";
const TTL: Duration = Duration::from_secs(15 * 60);

/// A url-sourced file has to be fetched to be hashed, and the manifest's sha512
/// is mandatory. Cap it so a mistyped link to a disk image cannot eat the
/// player's memory — the API's own resolver uses the same limit.
const MAX_RESOLVE_BYTES: u64 = 512 * 1024 * 1024;

// ── Wire types (camelCase: these cross into TypeScript unchanged) ───────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModSearchHit {
    pub platform: &'static str,
    pub project_id: String,
    pub slug: String,
    pub name: String,
    pub summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,
    pub downloads: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    pub categories: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    pub client_side: String,
    pub server_side: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModSearchPage {
    pub hits: Vec<ModSearchHit>,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModProject {
    #[serde(flatten)]
    pub hit: ModSearchHit,
    pub description: String,
    pub game_versions: Vec<String>,
    pub loaders: Vec<String>,
    pub gallery: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issues_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub website_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogCategory {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModDependency {
    pub platform: &'static str,
    pub project_id: String,
    pub relation: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModFile {
    pub platform: &'static str,
    /// The Modrinth *version* id, not the file's.
    pub file_id: String,
    /// Only filled by `catalog_versions_by_ids`: everywhere else the caller
    /// already knows which project it asked about.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version_number: Option<String>,
    pub display_name: String,
    pub file_name: String,
    pub file_size: u64,
    pub game_versions: Vec<String>,
    pub release_type: String,
    pub date_published: String,
    pub sha512: Option<String>,
    /// Always true on Modrinth: it has no third-party-distribution opt-out,
    /// which is exactly the CurseForge trap this platform does not have.
    pub downloadable: bool,
    pub loaders: Vec<String>,
    pub dependencies: Vec<ModDependency>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedFile {
    pub sha512: String,
    pub file_size: u64,
    pub file_name: String,
    /// A `FileSource` from @boffmedia/pack-schema, ready to drop into a
    /// manifest entry.
    pub source: serde_json::Value,
}

#[derive(Debug, thiserror::Error)]
pub enum CatalogError {
    #[error("No se ha podido contactar con Modrinth. Inténtalo de nuevo.")]
    Unreachable,
    #[error("No se ha encontrado el archivo en Modrinth.")]
    NotFound,
    #[error("El archivo es demasiado grande (máximo 512 MB).")]
    TooLarge,
}

pub struct CatalogErrorWire(String);

impl Serialize for CatalogErrorWire {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut map = std::collections::BTreeMap::new();
        map.insert("message", self.0.as_str());
        serde::Serialize::serialize(&map, s)
    }
}

impl From<CatalogError> for CatalogErrorWire {
    fn from(err: CatalogError) -> Self {
        Self(err.to_string())
    }
}

// ── HTTP + cache ───────────────────────────────────────────────────────────

fn http() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            // Modrinth's docs ask for a contactable identifier; an anonymous
            // client is the one they rate-limit first.
            .user_agent(concat!(
                "FicusLabs/BoffmediaApp/",
                env!("CARGO_PKG_VERSION"),
                " (boffmedia.es)"
            ))
            .timeout(Duration::from_secs(20))
            .build()
            .unwrap_or_default()
    })
}

/// Only the tag lists are cached: they change a few times a year, while search
/// results must not be stale behind a player who just typed a new query.
fn category_cache() -> &'static Mutex<HashMap<String, (Instant, Vec<CatalogCategory>)>> {
    static CACHE: OnceLock<Mutex<HashMap<String, (Instant, Vec<CatalogCategory>)>>> =
        OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

async fn get_json<T: for<'de> Deserialize<'de>>(url: &str) -> Result<T, CatalogError> {
    let res = http()
        .get(url)
        .header("accept", "application/json")
        .send()
        .await
        .map_err(|_| CatalogError::Unreachable)?;
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(CatalogError::NotFound);
    }
    if !res.status().is_success() {
        return Err(CatalogError::Unreachable);
    }
    res.json::<T>().await.map_err(|_| CatalogError::Unreachable)
}

/// Modrinth takes its list parameters as JSON inside the query string, so they
/// have to be encoded rather than repeated as `?a=1&a=2`.
fn json_array(values: &[String]) -> String {
    serde_json::to_string(values).unwrap_or_else(|_| "[]".to_string())
}

fn encode(value: &str) -> String {
    let mut out = String::with_capacity(value.len() * 3);
    for byte in value.as_bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

fn side_of(value: Option<String>) -> String {
    match value.as_deref() {
        Some("required") => "required",
        Some("optional") => "optional",
        Some("unsupported") => "unsupported",
        _ => "unknown",
    }
    .to_string()
}

// ── Search ─────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct SearchHitRaw {
    project_id: Option<String>,
    slug: Option<String>,
    title: Option<String>,
    description: Option<String>,
    categories: Option<Vec<String>>,
    client_side: Option<String>,
    server_side: Option<String>,
    downloads: Option<u64>,
    icon_url: Option<String>,
    author: Option<String>,
    date_modified: Option<String>,
}

#[derive(Deserialize)]
struct SearchResponse {
    hits: Option<Vec<SearchHitRaw>>,
    total_hits: Option<u64>,
}

impl From<SearchHitRaw> for ModSearchHit {
    fn from(raw: SearchHitRaw) -> Self {
        let project_id = raw.project_id.unwrap_or_default();
        Self {
            platform: "modrinth",
            slug: raw.slug.clone().unwrap_or_else(|| project_id.clone()),
            name: raw.title.unwrap_or_else(|| project_id.clone()),
            project_id,
            summary: raw.description.unwrap_or_default(),
            icon_url: raw.icon_url.filter(|u| !u.is_empty()),
            downloads: raw.downloads.unwrap_or(0),
            author: raw.author,
            categories: raw.categories.unwrap_or_default(),
            updated_at: raw.date_modified,
            client_side: side_of(raw.client_side),
            server_side: side_of(raw.server_side),
        }
    }
}

/// Modrinth's sort keys. `name` has no equivalent — the launcher does not offer
/// it (see `sorts` on <ModBrowser>), and anything unknown falls back to
/// relevance rather than returning an error page.
fn sort_index(sort: &str) -> &'static str {
    match sort {
        "downloads" => "downloads",
        "follows" => "follows",
        "updated" => "updated",
        "newest" => "newest",
        _ => "relevance",
    }
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn catalog_search(
    query: Option<String>,
    game_version: Option<String>,
    loader: Option<String>,
    project_type: Option<String>,
    sort: Option<String>,
    category: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
    include_fabric_via_connector: Option<bool>,
) -> Result<ModSearchPage, CatalogErrorWire> {
    let limit = page_size.unwrap_or(20).clamp(1, 100);
    let offset = page.unwrap_or(0) * limit;

    // Each inner array is an OR, and the outer array ANDs them together — so
    // one facet per constraint, never one array holding all of them.
    let mut facets: Vec<Vec<String>> = vec![vec![format!(
        "project_type:{}",
        project_type.as_deref().unwrap_or("mod")
    )]];
    if let Some(version) = game_version.as_deref().filter(|v| !v.is_empty()) {
        facets.push(vec![format!("versions:{version}")]);
    }
    // On Modrinth a loader IS a category, which is also why a loader facet on a
    // resource-pack search silently returns nothing.
    if let Some(l) = loader.as_deref().filter(|v| !v.is_empty()) {
        // Sinytra Connector runs Fabric mods on NeoForge (on Forge for 1.20.1),
        // so a pack that has it can install either. Both loaders go in ONE inner
        // array to be OR'd: a second array would AND them and match only mods
        // that publish both, which is the opposite of what this is for.
        //
        // Gated on the pack's own loader being one Connector can host — a Fabric
        // pack asking for Fabric twice is a no-op, and a Quilt pack would be
        // offered mods it cannot load.
        let widen = include_fabric_via_connector.unwrap_or(false)
            && matches!(l, "neoforge" | "forge");
        if widen {
            facets.push(vec![
                format!("categories:{l}"),
                "categories:fabric".to_string(),
            ]);
        } else {
            facets.push(vec![format!("categories:{l}")]);
        }
    }
    if let Some(c) = category.as_deref().filter(|v| !v.is_empty()) {
        facets.push(vec![format!("categories:{c}")]);
    }

    let mut url = format!(
        "{MODRINTH}/search?limit={limit}&offset={offset}&index={}&facets={}",
        sort_index(sort.as_deref().unwrap_or("relevance")),
        encode(&serde_json::to_string(&facets).unwrap_or_else(|_| "[]".to_string())),
    );
    if let Some(q) = query.as_deref().filter(|v| !v.is_empty()) {
        url.push_str(&format!("&query={}", encode(q)));
    }

    let res: SearchResponse = get_json(&url).await?;
    Ok(ModSearchPage {
        hits: res
            .hits
            .unwrap_or_default()
            .into_iter()
            .map(ModSearchHit::from)
            .collect(),
        total: res.total_hits.unwrap_or(0),
    })
}

// ── Categories ─────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct CategoryRaw {
    icon: Option<String>,
    name: Option<String>,
    project_type: Option<String>,
}

#[tauri::command]
pub async fn catalog_categories(
    project_type: Option<String>,
) -> Result<Vec<CatalogCategory>, CatalogErrorWire> {
    let wanted = project_type.unwrap_or_else(|| "mod".to_string());
    if let Some(hit) = category_cache()
        .lock()
        .ok()
        .and_then(|map| map.get(&wanted).filter(|(at, _)| at.elapsed() < TTL).map(|(_, v)| v.clone()))
    {
        return Ok(hit);
    }

    let raw: Vec<CategoryRaw> = get_json(&format!("{MODRINTH}/tag/category")).await?;
    let out: Vec<CatalogCategory> = raw
        .into_iter()
        .filter(|c| c.project_type.as_deref() == Some(wanted.as_str()))
        .filter_map(|c| {
            let name = c.name?;
            Some(CatalogCategory {
                id: name.clone(),
                name,
                // Modrinth's `icon` is a raw SVG document, not a URL; there is
                // nothing an <img src> could do with it.
                icon_url: c.icon.filter(|i| i.starts_with("http")),
            })
        })
        .collect();

    if let Ok(mut map) = category_cache().lock() {
        map.insert(wanted, (Instant::now(), out.clone()));
    }
    Ok(out)
}

// ── Project detail ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct GalleryRaw {
    url: Option<String>,
}

#[derive(Deserialize)]
struct ProjectRaw {
    id: Option<String>,
    slug: Option<String>,
    title: Option<String>,
    /// Modrinth's `description` is the one-line summary; `body` is the page.
    description: Option<String>,
    body: Option<String>,
    categories: Option<Vec<String>>,
    client_side: Option<String>,
    server_side: Option<String>,
    downloads: Option<u64>,
    icon_url: Option<String>,
    updated: Option<String>,
    game_versions: Option<Vec<String>>,
    loaders: Option<Vec<String>>,
    gallery: Option<Vec<GalleryRaw>>,
    source_url: Option<String>,
    issues_url: Option<String>,
    wiki_url: Option<String>,
    discord_url: Option<String>,
}

#[tauri::command]
pub async fn catalog_project(project_id: String) -> Result<ModProject, CatalogErrorWire> {
    let raw: ProjectRaw = get_json(&format!("{MODRINTH}/project/{}", encode(&project_id))).await?;
    let id = raw.id.unwrap_or(project_id);
    Ok(ModProject {
        hit: ModSearchHit {
            platform: "modrinth",
            slug: raw.slug.clone().unwrap_or_else(|| id.clone()),
            name: raw.title.unwrap_or_else(|| id.clone()),
            project_id: id,
            summary: raw.description.clone().unwrap_or_default(),
            icon_url: raw.icon_url.filter(|u| !u.is_empty()),
            downloads: raw.downloads.unwrap_or(0),
            author: None,
            categories: raw.categories.unwrap_or_default(),
            updated_at: raw.updated,
            client_side: side_of(raw.client_side),
            server_side: side_of(raw.server_side),
        },
        description: raw.body.or(raw.description).unwrap_or_default(),
        game_versions: raw.game_versions.unwrap_or_default(),
        loaders: raw.loaders.unwrap_or_default(),
        gallery: raw
            .gallery
            .unwrap_or_default()
            .into_iter()
            .filter_map(|g| g.url)
            .collect(),
        source_url: raw.source_url.filter(|u| !u.is_empty()),
        issues_url: raw.issues_url.filter(|u| !u.is_empty()),
        website_url: raw
            .wiki_url
            .or(raw.discord_url)
            .filter(|u| !u.is_empty()),
    })
}

/// Batch name/icon lookup for dependency labelling — one request instead of one
/// per dependency, which is what makes deep dependency walks tolerable.
#[tauri::command]
pub async fn catalog_project_summaries(
    ids: Vec<String>,
) -> Result<Vec<ModSearchHit>, CatalogErrorWire> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }
    let raw: Vec<ProjectRaw> = get_json(&format!(
        "{MODRINTH}/projects?ids={}",
        encode(&json_array(&ids))
    ))
    .await?;
    Ok(raw
        .into_iter()
        .map(|p| {
            let id = p.id.unwrap_or_default();
            ModSearchHit {
                platform: "modrinth",
                slug: p.slug.clone().unwrap_or_else(|| id.clone()),
                name: p.title.unwrap_or_else(|| id.clone()),
                project_id: id,
                summary: p.description.unwrap_or_default(),
                icon_url: p.icon_url.filter(|u| !u.is_empty()),
                downloads: p.downloads.unwrap_or(0),
                author: None,
                categories: p.categories.unwrap_or_default(),
                updated_at: p.updated,
                client_side: side_of(p.client_side),
                server_side: side_of(p.server_side),
            }
        })
        .collect())
}

// ── Versions (files) ───────────────────────────────────────────────────────

#[derive(Deserialize)]
struct VersionFileHashes {
    sha512: Option<String>,
}

#[derive(Deserialize)]
struct VersionFileRaw {
    hashes: Option<VersionFileHashes>,
    filename: Option<String>,
    primary: Option<bool>,
    size: Option<u64>,
}

#[derive(Deserialize)]
struct VersionDependencyRaw {
    version_id: Option<String>,
    project_id: Option<String>,
    dependency_type: Option<String>,
}

#[derive(Deserialize)]
struct VersionRaw {
    id: Option<String>,
    project_id: Option<String>,
    name: Option<String>,
    version_number: Option<String>,
    version_type: Option<String>,
    date_published: Option<String>,
    loaders: Option<Vec<String>>,
    game_versions: Option<Vec<String>>,
    dependencies: Option<Vec<VersionDependencyRaw>>,
    files: Option<Vec<VersionFileRaw>>,
}

/// A Modrinth version can carry several files (a jar plus its sources, say).
/// The primary one is what the pack installs; falling back to the first is what
/// the .mrpack format itself does.
fn primary_file(files: Vec<VersionFileRaw>) -> Option<VersionFileRaw> {
    let mut rest: Option<VersionFileRaw> = None;
    for file in files {
        if file.primary.unwrap_or(false) {
            return Some(file);
        }
        if rest.is_none() {
            rest = Some(file);
        }
    }
    rest
}

fn mod_file_of(raw: VersionRaw) -> Option<ModFile> {
    let file_id = raw.id?;
    let file = primary_file(raw.files.unwrap_or_default())?;
    let file_name = file.filename.unwrap_or_else(|| format!("{file_id}.jar"));
    Some(ModFile {
        platform: "modrinth",
        project_id: None,
        display_name: raw.name.clone().unwrap_or_else(|| file_name.clone()),
        file_id,
        version_number: raw.version_number,
        file_name,
        file_size: file.size.unwrap_or(0),
        game_versions: raw.game_versions.unwrap_or_default(),
        release_type: match raw.version_type.as_deref() {
            Some("beta") => "beta",
            Some("alpha") => "alpha",
            _ => "release",
        }
        .to_string(),
        date_published: raw.date_published.unwrap_or_default(),
        sha512: file.hashes.and_then(|h| h.sha512),
        downloadable: true,
        loaders: raw.loaders.unwrap_or_default(),
        dependencies: raw
            .dependencies
            .unwrap_or_default()
            .into_iter()
            .filter_map(|d| {
                Some(ModDependency {
                    platform: "modrinth",
                    // A dependency pinned only by file name has nothing the
                    // resolver could look up, so it is dropped rather than
                    // surfaced as an unresolvable row.
                    project_id: d.project_id?,
                    relation: d.dependency_type.unwrap_or_else(|| "required".to_string()),
                    version_id: d.version_id,
                })
            })
            .collect(),
    })
}

#[tauri::command]
pub async fn catalog_versions(
    project_id: String,
    game_version: Option<String>,
    loader: Option<String>,
) -> Result<Vec<ModFile>, CatalogErrorWire> {
    let mut url = format!("{MODRINTH}/project/{}/version", encode(&project_id));
    let mut sep = '?';
    if let Some(l) = loader.filter(|v| !v.is_empty()) {
        url.push_str(&format!("{sep}loaders={}", encode(&json_array(&[l]))));
        sep = '&';
    }
    if let Some(v) = game_version.filter(|v| !v.is_empty()) {
        url.push_str(&format!("{sep}game_versions={}", encode(&json_array(&[v]))));
    }

    let raw: Vec<VersionRaw> = get_json(&url).await?;
    Ok(raw.into_iter().filter_map(mod_file_of).collect())
}

/// Map version ids back to their projects.
///
/// The install marker records a Modrinth file as a VERSION id only, with no
/// project id anywhere (`ManagedSource::Modrinth`). The Content tab needs the
/// project to show a name, an icon and an author, so an installed pack has to
/// take this extra hop. One batch request, not one per row.
#[tauri::command]
pub async fn catalog_versions_by_ids(
    ids: Vec<String>,
) -> Result<Vec<ModFile>, CatalogErrorWire> {
    if ids.is_empty() {
        return Ok(Vec::new());
    }
    let raw: Vec<VersionRaw> = get_json(&format!(
        "{MODRINTH}/versions?ids={}",
        encode(&json_array(&ids))
    ))
    .await?;
    Ok(raw
        .into_iter()
        .filter_map(|v| {
            let project_id = v.project_id.clone();
            let mut file = mod_file_of(v)?;
            file.project_id = project_id;
            Some(file)
        })
        .collect())
}

/// Identify jars by their SHA-512.
///
/// This is what makes a hand-dropped mod a first-class row instead of a
/// filename: Modrinth will name the exact version a hash belongs to, so a jar
/// the launcher never installed still gets its real title, icon, author and
/// update check.
///
/// A POST, unlike every other call in this file, because the hash list is the
/// request body — sixty SHA-512s is ~8KB, well past what a query string can
/// carry. Unknown hashes are simply absent from the response (a private build,
/// or a jar from anywhere but Modrinth), which is not an error: the caller
/// falls back to the filename for those.
#[tauri::command]
pub async fn catalog_versions_by_hashes(
    hashes: Vec<String>,
) -> Result<Vec<ModFile>, CatalogErrorWire> {
    if hashes.is_empty() {
        return Ok(Vec::new());
    }
    let body = serde_json::json!({ "hashes": hashes, "algorithm": "sha512" });
    let res = http()
        .post(format!("{MODRINTH}/version_files"))
        .header("accept", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|_| CatalogError::Unreachable)?;
    if !res.status().is_success() {
        return Err(CatalogError::Unreachable.into());
    }
    // Keyed BY HASH, not an array: the caller has to know which local file each
    // answer belongs to, and the version's own file list can hold several.
    let raw: std::collections::HashMap<String, VersionRaw> =
        res.json().await.map_err(|_| CatalogError::Unreachable)?;

    Ok(raw
        .into_iter()
        .filter_map(|(hash, version)| {
            let project_id = version.project_id.clone();
            let mut file = mod_file_of(version)?;
            file.project_id = project_id;
            // The response key is the hash that was ASKED about; the version's
            // primary file may be a different artifact (a sources jar, another
            // loader's build). Stamping the queried hash back on is what lets
            // the caller match the row to the file on disk.
            file.sha512 = Some(hash);
            Some(file)
        })
        .collect())
}

// Deliberately no `catalog_latest_version` here. "The newest release" is not
// enough to decide whether it is NEWER than the pinned version, so `findUpdates`
// takes the whole list from `catalog_versions` and compares publish dates
// itself. A latest-only endpoint reintroduces the silent-downgrade bug.

// ── Resolve ────────────────────────────────────────────────────────────────

/// Modrinth hands the sha512 and the size over in the version JSON, so a mod
/// picked from the catalog costs one metadata request and zero bytes of
/// download. Only a raw URL has to be fetched to be hashed.
#[tauri::command]
pub async fn catalog_resolve_modrinth(
    project_id: String,
    version_id: String,
) -> Result<ResolvedFile, CatalogErrorWire> {
    let raw: VersionRaw = get_json(&format!("{MODRINTH}/version/{}", encode(&version_id))).await?;
    let file = mod_file_of(raw).ok_or(CatalogError::NotFound)?;
    let sha512 = file.sha512.ok_or(CatalogError::NotFound)?;
    Ok(ResolvedFile {
        sha512: sha512.to_lowercase(),
        file_size: file.file_size,
        file_name: file.file_name,
        source: serde_json::json!({
            "kind": "modrinth",
            "projectId": project_id,
            "versionId": version_id,
        }),
    })
}

/// The one path that must download to author: an arbitrary URL has no hash to
/// borrow, and PackFile.sha512 is mandatory.
#[tauri::command]
pub async fn catalog_resolve_url(url: String) -> Result<ResolvedFile, CatalogErrorWire> {
    let res = http()
        .get(&url)
        .send()
        .await
        .map_err(|_| CatalogError::Unreachable)?;
    if !res.status().is_success() {
        return Err(CatalogError::NotFound.into());
    }
    // Trust the advertised length only to refuse early; the real check is the
    // running total below, which a lying or absent header cannot get past.
    if res.content_length().is_some_and(|len| len > MAX_RESOLVE_BYTES) {
        return Err(CatalogError::TooLarge.into());
    }

    let file_name = res
        .headers()
        .get(reqwest::header::CONTENT_DISPOSITION)
        .and_then(|v| v.to_str().ok())
        .and_then(filename_from_disposition)
        .unwrap_or_else(|| file_name_of_url(&url));

    let mut hasher = Sha512::new();
    let mut total: u64 = 0;
    let mut stream = res;
    while let Some(chunk) = stream
        .chunk()
        .await
        .map_err(|_| CatalogError::Unreachable)?
    {
        total += chunk.len() as u64;
        if total > MAX_RESOLVE_BYTES {
            return Err(CatalogError::TooLarge.into());
        }
        hasher.update(&chunk);
    }

    Ok(ResolvedFile {
        sha512: crate::install::files::hex(&hasher.finalize()),
        file_size: total,
        file_name,
        source: serde_json::json!({ "kind": "url", "url": url }),
    })
}

fn filename_from_disposition(value: &str) -> Option<String> {
    let start = value.to_lowercase().find("filename=")? + "filename=".len();
    let raw = value[start..].trim().trim_matches('"');
    let name = raw.split(';').next()?.trim().trim_matches('"');
    (!name.is_empty()).then(|| name.to_string())
}

fn file_name_of_url(url: &str) -> String {
    url.split('?')
        .next()
        .unwrap_or(url)
        .rsplit('/')
        .find(|part| !part.is_empty())
        .unwrap_or("file.jar")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn facets_are_percent_encoded_as_one_parameter() {
        // A raw `[["project_type:mod"]]` in a query string is what makes
        // Modrinth answer 400 instead of searching.
        let encoded = encode(r#"[["project_type:mod"]]"#);
        assert!(!encoded.contains('['));
        assert!(!encoded.contains('"'));
        assert_eq!(encoded, "%5B%5B%22project_type%3Amod%22%5D%5D");
    }

    #[test]
    fn the_primary_file_wins_over_the_first_one() {
        let files = vec![
            VersionFileRaw {
                hashes: None,
                filename: Some("sources.jar".into()),
                primary: Some(false),
                size: Some(1),
            },
            VersionFileRaw {
                hashes: None,
                filename: Some("mod.jar".into()),
                primary: Some(true),
                size: Some(2),
            },
        ];
        assert_eq!(primary_file(files).unwrap().filename.unwrap(), "mod.jar");
    }

    #[test]
    fn a_version_with_no_primary_flag_still_yields_a_file() {
        let files = vec![VersionFileRaw {
            hashes: None,
            filename: Some("only.jar".into()),
            primary: None,
            size: Some(3),
        }];
        assert_eq!(primary_file(files).unwrap().filename.unwrap(), "only.jar");
    }

    #[test]
    fn a_dependency_without_a_project_id_is_dropped() {
        let raw = VersionRaw {
            id: Some("v1".into()),
            project_id: Some("proj".into()),
            name: Some("Mod 1.0".into()),
            version_number: Some("1.0".into()),
            version_type: Some("release".into()),
            date_published: Some("2026-01-01T00:00:00Z".into()),
            loaders: Some(vec!["fabric".into()]),
            game_versions: Some(vec!["1.21.4".into()]),
            dependencies: Some(vec![
                VersionDependencyRaw {
                    version_id: None,
                    project_id: Some("abc".into()),
                    dependency_type: Some("required".into()),
                },
                VersionDependencyRaw {
                    version_id: None,
                    project_id: None,
                    dependency_type: Some("required".into()),
                },
            ]),
            files: Some(vec![VersionFileRaw {
                hashes: None,
                filename: Some("mod.jar".into()),
                primary: Some(true),
                size: Some(10),
            }]),
        };
        let file = mod_file_of(raw).unwrap();
        assert_eq!(file.dependencies.len(), 1);
        assert_eq!(file.dependencies[0].project_id, "abc");
    }

    #[test]
    fn content_disposition_beats_the_url_tail() {
        assert_eq!(
            filename_from_disposition(r#"attachment; filename="real-name.jar""#).unwrap(),
            "real-name.jar"
        );
        assert_eq!(file_name_of_url("https://x.test/a/b/mod.jar?token=1"), "mod.jar");
    }
}
