// Reading a THIRD-PARTY `.mrpack` — one this launcher did not write.
//
// Our own export embeds the whole `PackManifest` under `boffmedia:manifest`, so
// importing it back is just a deserialize (local_packs.rs). A pack downloaded
// from Modrinth has no such key, and this module is the conversion that gives
// it one: `modrinth.index.json` + the zip's `overrides/` tree -> a PackManifest
// the existing install pipeline already knows how to run. Nothing downstream of
// here can tell the difference, which is the point — there is no second install
// path for imported packs.
//
// Two shape mismatches between the formats, and how each is resolved:
//
//   sha512 is OPTIONAL in `.mrpack` and MANDATORY for us (it is the integrity
//   check on every download). A file that omits it is fetched once, here, and
//   hashed — the import is slower, the install is still verified. Refusing the
//   pack instead would reject packs that install fine everywhere else.
//
//   `overrides/` is loose BYTES in the zip with no URL at all. They become
//   `source: override` entries backed by the local blob store
//   (`Layout::local_blobs_dir`), never by the API — see the comment there.

use std::io::Read as _;

use serde::Deserialize;

use crate::install::files::put_local_blob;
use crate::install::paths::Layout;
use crate::install::InstallFailure;
use crate::pack::{parse_manifest, PackManifest};

/// The parts of `modrinth.index.json` that matter. Unknown keys are ignored
/// rather than rejected: the format gains fields, and a pack that carries one
/// we have not heard of still installs.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MrIndex {
    #[serde(default)]
    pub format_version: u32,
    #[serde(default)]
    pub game: String,
    #[serde(default)]
    pub version_id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub files: Vec<MrIndexFile>,
    pub dependencies: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MrIndexFile {
    pub path: String,
    #[serde(default)]
    pub hashes: MrHashes,
    #[serde(default)]
    pub env: Option<MrEnv>,
    #[serde(default)]
    pub downloads: Vec<String>,
    #[serde(default)]
    pub file_size: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct MrHashes {
    #[serde(default)]
    pub sha1: Option<String>,
    #[serde(default)]
    pub sha512: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MrEnv {
    #[serde(default)]
    pub client: Option<String>,
    #[serde(default)]
    pub server: Option<String>,
}

/// Zip prefixes that land in the instance. `server-overrides/` is deliberately
/// absent: this launcher installs clients, and a server-only config dropped
/// into a client instance is at best inert and at worst breaks it. Client
/// overrides are applied AFTER the shared ones, which is the precedence the
/// format specifies.
const OVERRIDE_PREFIXES: [&str; 2] = ["overrides/", "client-overrides/"];

fn is_valid_relative(path: &str) -> bool {
    let normalised = path.replace('\\', "/");
    !normalised.is_empty()
        && !normalised.starts_with('/')
        && !normalised.contains(':')
        && !normalised.split('/').any(|seg| seg == "..")
        && !normalised.ends_with('/')
}

/// `required` / `optional` / `unsupported`; anything else (or nothing) is
/// treated as required, which is what every real reader does with a file that
/// declines to say.
fn env_value(raw: Option<&String>) -> &'static str {
    match raw.map(String::as_str) {
        Some("optional") => "optional",
        Some("unsupported") => "unsupported",
        _ => "required",
    }
}

/// Only the keys the schema knows. A dependency set naming something else (a
/// loader we cannot install) is dropped here rather than carried into the
/// manifest, where it would fail validation with a message about JSON instead
/// of about the loader.
fn dependencies_of(raw: &serde_json::Map<String, serde_json::Value>) -> serde_json::Value {
    let mut out = serde_json::Map::new();
    for key in ["minecraft", "forge", "neoforge", "fabric-loader", "quilt-loader"] {
        if let Some(value) = raw.get(key).and_then(|v| v.as_str()) {
            if !value.is_empty() {
                out.insert(key.to_string(), serde_json::Value::String(value.to_string()));
            }
        }
    }
    serde_json::Value::Object(out)
}

/// Fetch a file only to learn its sha512 — the fallback for an index entry that
/// omits the hash. The bytes are discarded; the install downloads them again
/// through the normal path, where they land in the content-addressed cache.
async fn hash_of_url(http: &reqwest::Client, url: &str) -> Result<(String, i64), InstallFailure> {
    use sha2::{Digest as _, Sha512};

    let res = http
        .get(url)
        .send()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo descargar «{url}»: {e}")))?;
    if !res.status().is_success() {
        return Err(InstallFailure::message(format!(
            "No se pudo descargar «{url}»: el servidor respondió {}.",
            res.status()
        )));
    }
    let bytes = res
        .bytes()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo leer «{url}»: {e}")))?;
    let mut hasher = Sha512::new();
    hasher.update(&bytes);
    Ok((
        crate::install::files::hex(&hasher.finalize()),
        bytes.len() as i64,
    ))
}

/// Modrinth's CDN encodes the file's identity in its download URL:
/// `https://cdn.modrinth.com/data/{projectId}/versions/{versionId}/{name}`.
fn modrinth_ids_of(url: &str) -> Option<(&str, &str)> {
    let rest = url.strip_prefix("https://cdn.modrinth.com/data/")?;
    let mut parts = rest.split('/');
    let project = parts.next()?;
    let literal_versions = parts.next()?;
    let version = parts.next()?;
    // A fourth segment (the filename) must exist, or this is some other CDN
    // path that merely resembles the shape.
    let file = parts.next()?;
    (literal_versions == "versions" && !project.is_empty() && !version.is_empty() && !file.is_empty())
        .then_some((project, version))
}

/// The manifest source for one indexed download. A Modrinth CDN URL becomes a
/// `modrinth` source rather than a bare `url`: keeping it as a URL threw the
/// project identity away, which left every mod in an imported pack with no
/// name, no author and no icon in the Content tab — and made its updates
/// undiscoverable. Anything else stays a plain URL source.
fn source_of(url: &str) -> serde_json::Value {
    match modrinth_ids_of(url) {
        Some((project, version)) => serde_json::json!({
            "kind": "modrinth", "projectId": project, "versionId": version,
        }),
        None => serde_json::json!({ "kind": "url", "url": url }),
    }
}

const MODRINTH: &str = "https://api.modrinth.com/v2";

#[derive(Debug, Deserialize)]
struct MrVersion {
    id: String,
    version_number: String,
    #[serde(default)]
    files: Vec<MrVersionFile>,
}

#[derive(Debug, Deserialize)]
struct MrVersionFile {
    url: String,
    filename: String,
    #[serde(default)]
    primary: bool,
}

/// Pull a project (and optional version) reference out of whatever the player
/// pasted. Accepts, in order of how people actually paste things:
///
///   https://modrinth.com/modpack/cobblemon-fabric
///   https://modrinth.com/modpack/cobblemon-fabric/version/1.6.1
///   cobblemon-fabric            (bare slug or project id)
///
/// Returns `(project, Some(version))` or `(project, None)`.
fn parse_modrinth_ref(input: &str) -> Option<(String, Option<String>)> {
    let trimmed = input.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return None;
    }
    if !trimmed.contains("://") {
        // A bare reference. Rejecting anything path-shaped keeps a stray URL
        // fragment from being sent to the API as a project id.
        return if trimmed.contains('/') || trimmed.contains(' ') {
            None
        } else {
            Some((trimmed.to_string(), None))
        };
    }

    let after_scheme = trimmed.split_once("://")?.1;
    let (host, path) = after_scheme.split_once('/')?;
    if !host.ends_with("modrinth.com") {
        return None;
    }
    let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    // `/modpack/<slug>` — the leading segment is the project type and is
    // ignored: Modrinth serves the same project under several of them.
    let slug = segments.get(1)?.to_string();
    let version = match (segments.get(2), segments.get(3)) {
        (Some(&"version"), Some(v)) => Some((*v).to_string()),
        _ => None,
    };
    Some((slug, version))
}

/// Turn whatever the player pasted into a URL that serves a `.mrpack`.
///
/// A direct link to the file is used as-is; a Modrinth reference is resolved
/// through the API. Without an explicit version the newest one wins — the list
/// endpoint returns them newest-first.
pub async fn resolve_pack_download(
    http: &reqwest::Client,
    input: &str,
) -> Result<String, InstallFailure> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(InstallFailure::message("Pega un enlace de Modrinth."));
    }
    // A direct file link, wherever it is hosted.
    if trimmed.starts_with("http")
        && trimmed
            .split('?')
            .next()
            .unwrap_or(trimmed)
            .ends_with(".mrpack")
    {
        return Ok(trimmed.to_string());
    }

    let Some((project, wanted_version)) = parse_modrinth_ref(trimmed) else {
        return Err(InstallFailure::message(
            "No reconozco ese enlace. Pega la dirección de un modpack de Modrinth o un archivo .mrpack.",
        ));
    };

    let res = http
        .get(format!("{MODRINTH}/project/{project}/version"))
        .send()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo contactar con Modrinth: {e}")))?;
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(InstallFailure::message(format!(
            "Modrinth no conoce ningún proyecto llamado «{project}»."
        )));
    }
    if !res.status().is_success() {
        return Err(InstallFailure::message(format!(
            "Modrinth respondió {} al buscar «{project}».",
            res.status()
        )));
    }
    let versions: Vec<MrVersion> = res
        .json()
        .await
        .map_err(|e| InstallFailure::message(format!("Respuesta de Modrinth ilegible: {e}")))?;

    let version = match &wanted_version {
        // A version URL carries the version NUMBER, but an id is equally valid
        // to paste, so both are matched.
        Some(wanted) => versions
            .iter()
            .find(|v| &v.version_number == wanted || &v.id == wanted)
            .ok_or_else(|| {
                InstallFailure::message(format!("«{project}» no tiene la versión «{wanted}»."))
            })?,
        None => versions
            .first()
            .ok_or_else(|| InstallFailure::message(format!("«{project}» no tiene versiones publicadas.")))?,
    };

    // `primary` is the author's choice of "the" file; some versions ship extras
    // beside it (a server pack, a changelog), so a blind `first()` would
    // sometimes install the wrong one.
    version
        .files
        .iter()
        .find(|f| f.primary && f.filename.ends_with(".mrpack"))
        .or_else(|| version.files.iter().find(|f| f.filename.ends_with(".mrpack")))
        .map(|f| f.url.clone())
        .ok_or_else(|| {
            InstallFailure::message(format!(
                "Esa versión de «{project}» no publica ningún .mrpack (¿es un mod y no un modpack?)."
            ))
        })
}

#[derive(Debug, Deserialize)]
struct MrProject {
    #[serde(default)]
    icon_url: Option<String>,
}

/// Best-effort fetch of a Modrinth project's icon, to stamp onto an imported
/// pack's header — the `.mrpack` index itself carries no icon, so this is the
/// only source. Cosmetic, so EVERY failure resolves to `None` rather than
/// failing the import: a direct `.mrpack` link with no project behind it, a
/// network error, or a project that simply has no icon all land here.
///
/// The reference is parsed the same way `resolve_pack_download` parses it, so a
/// project URL, a version URL and a bare slug all reach the project endpoint;
/// a cdn `.mrpack` link resolves through its embedded project id for free.
pub async fn project_icon_url(http: &reqwest::Client, input: &str) -> Option<String> {
    let (project, _version) = parse_modrinth_ref(input)?;
    let res = http
        .get(format!("{MODRINTH}/project/{project}"))
        .send()
        .await
        .ok()?;
    if !res.status().is_success() {
        return None;
    }
    let project: MrProject = res.json().await.ok()?;
    project
        .icon_url
        .filter(|u| u.starts_with("http://") || u.starts_with("https://"))
}

/// Convert a parsed index plus its zip into a `PackManifest`.
///
/// `slug` must already carry the `local-` prefix and be free — the caller owns
/// collision handling, exactly as it does for our own `.mrpack` import.
pub async fn manifest_from_index<R: std::io::Read + std::io::Seek>(
    index: &MrIndex,
    archive: &mut zip::ZipArchive<R>,
    layout: &Layout,
    http: &reqwest::Client,
    slug: &str,
    name: &str,
    // The pack header icon, fetched by the caller from the Modrinth project
    // (see `project_icon_url`). `None` for a file-picker import, which has no
    // project behind it.
    icon_url: Option<&str>,
) -> Result<PackManifest, InstallFailure> {
    if !index.game.is_empty() && index.game != "minecraft" {
        return Err(InstallFailure::message(format!(
            "El pack es para «{}», no para Minecraft.",
            index.game
        )));
    }
    if index.format_version != 0 && index.format_version != 1 {
        return Err(InstallFailure::message(format!(
            "El launcher no entiende la versión {} del formato .mrpack.",
            index.format_version
        )));
    }

    let mut files: Vec<serde_json::Value> = Vec::new();
    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();

    // 1. The index's own files — mods and anything else with a public URL.
    for file in &index.files {
        let path = file.path.replace('\\', "/");
        if !is_valid_relative(&path) {
            return Err(InstallFailure::message(format!(
                "El pack contiene una ruta no válida: «{}».",
                file.path
            )));
        }
        let client = env_value(file.env.as_ref().and_then(|e| e.client.as_ref()));
        // A client-unsupported file is not installed anyway; carrying it would
        // only make the import download a hash for a file nobody will fetch.
        if client == "unsupported" {
            continue;
        }
        let Some(url) = file.downloads.first() else {
            return Err(InstallFailure::message(format!(
                "«{path}» no trae ninguna URL de descarga."
            )));
        };

        let (sha512, size) = match file.hashes.sha512.as_ref().filter(|h| h.len() == 128) {
            Some(hash) => (hash.to_lowercase(), file.file_size.unwrap_or(0).max(0)),
            None => hash_of_url(http, url).await?,
        };

        if !seen.insert(path.clone()) {
            continue;
        }
        files.push(serde_json::json!({
            "path": path,
            "sha512": sha512,
            "fileSize": size,
            "env": {
                "client": client,
                "server": env_value(file.env.as_ref().and_then(|e| e.server.as_ref())),
            },
            "source": source_of(url),
        }));
    }

    // 2. The zip's `overrides/` trees, stored as local blobs. `client-overrides`
    //    is read after `overrides` so it wins on a shared path, which is the
    //    precedence the format defines — hence the two passes rather than one.
    for prefix in OVERRIDE_PREFIXES {
        for i in 0..archive.len() {
            let (name_in_zip, is_dir) = {
                let entry = archive.by_index(i).map_err(|e| {
                    InstallFailure::message(format!("El .mrpack está dañado: {e}"))
                })?;
                (entry.name().replace('\\', "/"), entry.is_dir())
            };
            if is_dir || !name_in_zip.starts_with(prefix) {
                continue;
            }
            let path = name_in_zip[prefix.len()..].to_string();
            if path.is_empty() || !is_valid_relative(&path) {
                continue;
            }

            let mut bytes = Vec::new();
            archive
                .by_index(i)
                .map_err(|e| InstallFailure::message(format!("El .mrpack está dañado: {e}")))?
                .read_to_end(&mut bytes)
                .map_err(|e| {
                    InstallFailure::message(format!("No se pudo leer «{path}» del pack: {e}"))
                })?;
            let size = bytes.len() as i64;
            let sha512 = put_local_blob(layout, &bytes)?;

            // A path already claimed by the index (or by the previous override
            // pass) is replaced rather than duplicated: the manifest rejects
            // duplicate paths, and an override is the more specific answer.
            if !seen.insert(path.clone()) {
                files.retain(|f| f.get("path").and_then(|p| p.as_str()) != Some(path.as_str()));
            }
            files.push(serde_json::json!({
                "path": path,
                "sha512": sha512,
                "fileSize": size,
                "env": { "client": "required", "server": "required" },
                "source": { "kind": "override", "blobSha512": sha512 },
            }));
        }
    }

    let version_id = if index.version_id.trim().is_empty() {
        format!("mrpack-{slug}")
    } else {
        index.version_id.trim().to_string()
    };
    let mut pack = serde_json::json!({
        "id": format!("local:{slug}"),
        "slug": slug,
        "name": name,
        "access": { "kind": "public" },
    });
    if let Some(summary) = index.summary.as_ref().filter(|s| !s.trim().is_empty()) {
        pack["summary"] = serde_json::Value::String(summary.trim().to_string());
    }
    // A valid http(s) URL only: `iconUrl` is `z.url()` in the schema, so a
    // malformed value would fail the whole manifest for a cosmetic field.
    if let Some(icon) = icon_url.filter(|u| u.starts_with("http://") || u.starts_with("https://")) {
        pack["iconUrl"] = serde_json::Value::String(icon.to_string());
    }

    let value = serde_json::json!({
        "formatVersion": 1,
        "pack": pack,
        "version": {
            "id": version_id,
            // The index's `versionId` is the pack author's version STRING; there
            // is no separate display name in the format, so it serves as both.
            "name": if index.version_id.trim().is_empty() { "1.0" } else { index.version_id.trim() },
            "createdAt": chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            "dependencies": dependencies_of(&index.dependencies),
            "files": files,
        },
    });

    let raw = serde_json::to_string(&value)
        .map_err(|e| InstallFailure::message(format!("No se pudo construir el pack: {e}")))?;
    parse_manifest(&raw).map_err(|e| {
        InstallFailure::message(format!("El .mrpack no se pudo convertir a un pack válido: {e}"))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write as _;

    fn index_json(files: &str, deps: &str) -> MrIndex {
        let raw = format!(
            r#"{{"formatVersion":1,"game":"minecraft","versionId":"1.2.3","name":"Cool Pack",
                "files":[{files}],"dependencies":{deps}}}"#
        );
        serde_json::from_str(&raw).expect("fixture must parse")
    }

    /// A zip with the given `name -> contents` entries.
    fn zip_with(entries: &[(&str, &str)]) -> zip::ZipArchive<std::io::Cursor<Vec<u8>>> {
        let mut buf = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(std::io::Cursor::new(&mut buf));
            let options = zip::write::SimpleFileOptions::default();
            for (name, contents) in entries {
                writer.start_file(*name, options).unwrap();
                writer.write_all(contents.as_bytes()).unwrap();
            }
            writer.finish().unwrap();
        }
        zip::ZipArchive::new(std::io::Cursor::new(buf)).unwrap()
    }

    fn test_layout() -> Layout {
        Layout::for_tests(std::env::temp_dir().join(format!("boff-mrpack-{}", uuid::Uuid::new_v4())))
    }

    #[tokio::test]
    async fn a_plain_modrinth_pack_becomes_an_installable_manifest() {
        let index = index_json(
            &format!(
                r#"{{"path":"mods/sodium.jar","hashes":{{"sha512":"{s}"}},"fileSize":100,
                     "downloads":["https://cdn.modrinth.com/sodium.jar"]}}"#,
                s = "a".repeat(128)
            ),
            r#"{"minecraft":"1.21.4","fabric-loader":"0.16.0"}"#,
        );
        let mut zip = zip_with(&[("overrides/config/sodium.json", "{\"fov\":90}")]);
        let layout = test_layout();

        let manifest = manifest_from_index(
            &index,
            &mut zip,
            &layout,
            &reqwest::Client::new(),
            "local-cool-pack",
            "Cool Pack",
            Some("https://cdn.modrinth.com/data/AANobbMI/icon.png"),
        )
        .await
        .unwrap();

        assert_eq!(manifest.pack.slug.to_string(), "local-cool-pack");
        assert_eq!(manifest.version.dependencies.minecraft.to_string(), "1.21.4");
        assert!(manifest.version.dependencies.fabric_loader.is_some());
        assert_eq!(manifest.version.files.len(), 2);
        // The header icon the caller fetched from the project is stamped in, so
        // an imported pack shows real art instead of the placeholder cube.
        assert_eq!(
            manifest.pack.icon_url.as_ref().map(|u| u.to_string()),
            Some("https://cdn.modrinth.com/data/AANobbMI/icon.png".to_string())
        );

        // The mod keeps its public URL; the override is backed by a local blob
        // that must actually exist on disk, or the install would 404 against an
        // API that never hosted it.
        let over = manifest
            .version
            .files
            .iter()
            .find(|f| f.path.to_string() == "config/sodium.json")
            .expect("the override must be carried over, not dropped");
        let blob = crate::install::files::local_blob_path(&layout, &over.sha512.to_string());
        assert!(blob.is_file(), "the override's bytes must be stored locally");

        let _ = std::fs::remove_dir_all(layout.root());
    }

    #[test]
    fn a_modrinth_cdn_download_keeps_its_identity() {
        // The whole reason imported packs had nameless, iconless content rows:
        // the project/version ids were in the URL and got thrown away.
        assert_eq!(
            modrinth_ids_of("https://cdn.modrinth.com/data/AANobbMI/versions/xyzXYZ12/sodium.jar"),
            Some(("AANobbMI", "xyzXYZ12"))
        );
        let source = source_of("https://cdn.modrinth.com/data/AANobbMI/versions/xyzXYZ12/sodium.jar");
        assert_eq!(source["kind"], "modrinth");
        assert_eq!(source["projectId"], "AANobbMI");
        assert_eq!(source["versionId"], "xyzXYZ12");
    }

    #[test]
    fn a_non_modrinth_download_stays_a_plain_url() {
        for url in [
            "https://cdn.modrinth.com/sodium.jar",
            "https://cdn.modrinth.com/data/AANobbMI/other/xyz/sodium.jar",
            "https://cdn.modrinth.com/data/AANobbMI/versions/xyz",
            "https://example.com/data/AANobbMI/versions/xyz/sodium.jar",
        ] {
            assert_eq!(modrinth_ids_of(url), None, "{url}");
            assert_eq!(source_of(url)["kind"], "url", "{url}");
        }
    }

    #[tokio::test]
    async fn a_bogus_icon_is_filtered_rather_than_failing_the_import() {
        // iconUrl is `z.url()`; a non-URL value must be dropped, not stamped,
        // or one odd project icon would sink the whole import.
        let index = index_json("", r#"{"minecraft":"1.21.4"}"#);
        let mut zip = zip_with(&[]);
        let layout = test_layout();
        let manifest = manifest_from_index(
            &index,
            &mut zip,
            &layout,
            &reqwest::Client::new(),
            "local-p",
            "P",
            Some("not-a-url"),
        )
        .await
        .unwrap();
        assert!(manifest.pack.icon_url.is_none());
        let _ = std::fs::remove_dir_all(layout.root());
    }

    #[tokio::test]
    async fn a_client_unsupported_file_is_not_installed() {
        let index = index_json(
            &format!(
                r#"{{"path":"mods/server-only.jar","hashes":{{"sha512":"{s}"}},"fileSize":1,
                     "env":{{"client":"unsupported","server":"required"}},
                     "downloads":["https://cdn.modrinth.com/a.jar"]}},
                   {{"path":"mods/sodium.jar","hashes":{{"sha512":"{s}"}},"fileSize":1,
                     "downloads":["https://cdn.modrinth.com/b.jar"]}}"#,
                s = "a".repeat(128)
            ),
            r#"{"minecraft":"1.21.4"}"#,
        );
        let mut zip = zip_with(&[]);
        let layout = test_layout();
        let manifest =
            manifest_from_index(&index, &mut zip, &layout, &reqwest::Client::new(), "local-p", "P", None)
                .await
                .unwrap();
        assert_eq!(manifest.version.files.len(), 1);
        assert_eq!(manifest.version.files[0].path.to_string(), "mods/sodium.jar");
        let _ = std::fs::remove_dir_all(layout.root());
    }

    #[tokio::test]
    async fn a_traversing_path_is_refused_before_anything_is_written() {
        let index = index_json(
            &format!(
                r#"{{"path":"../../evil.jar","hashes":{{"sha512":"{s}"}},"fileSize":1,
                     "downloads":["https://cdn.modrinth.com/a.jar"]}}"#,
                s = "a".repeat(128)
            ),
            r#"{"minecraft":"1.21.4"}"#,
        );
        let mut zip = zip_with(&[]);
        let layout = test_layout();
        assert!(
            manifest_from_index(&index, &mut zip, &layout, &reqwest::Client::new(), "local-p", "P", None)
                .await
                .is_err()
        );
        let _ = std::fs::remove_dir_all(layout.root());
    }

    #[tokio::test]
    async fn client_overrides_win_over_the_shared_ones_on_the_same_path() {
        let index = index_json("", r#"{"minecraft":"1.21.4"}"#);
        let mut zip = zip_with(&[
            ("overrides/config/a.txt", "shared"),
            ("client-overrides/config/a.txt", "client"),
        ]);
        let layout = test_layout();
        let manifest =
            manifest_from_index(&index, &mut zip, &layout, &reqwest::Client::new(), "local-p", "P", None)
                .await
                .unwrap();

        assert_eq!(manifest.version.files.len(), 1, "no duplicate path may survive");
        let blob = crate::install::files::local_blob_path(
            &layout,
            &manifest.version.files[0].sha512.to_string(),
        );
        assert_eq!(std::fs::read_to_string(blob).unwrap(), "client");
        let _ = std::fs::remove_dir_all(layout.root());
    }

    #[test]
    fn every_shape_a_player_might_paste_resolves_to_a_project() {
        assert_eq!(
            parse_modrinth_ref("https://modrinth.com/modpack/cobblemon-fabric"),
            Some(("cobblemon-fabric".into(), None))
        );
        assert_eq!(
            parse_modrinth_ref("https://modrinth.com/modpack/cobblemon-fabric/version/1.6.1"),
            Some(("cobblemon-fabric".into(), Some("1.6.1".into())))
        );
        // A trailing slash and the `/mod/` path both appear in the wild.
        assert_eq!(
            parse_modrinth_ref("https://modrinth.com/mod/sodium/"),
            Some(("sodium".into(), None))
        );
        assert_eq!(parse_modrinth_ref("cobblemon-fabric"), Some(("cobblemon-fabric".into(), None)));
        // Not Modrinth, and not a bare slug either.
        assert_eq!(parse_modrinth_ref("https://example.com/modpack/x"), None);
        assert_eq!(parse_modrinth_ref("some pack name"), None);
        assert_eq!(parse_modrinth_ref(""), None);
    }

    #[test]
    fn only_known_loader_keys_survive_the_dependency_copy() {
        let raw: serde_json::Map<String, serde_json::Value> = serde_json::from_str(
            r#"{"minecraft":"1.21.4","neoforge":"21.4.30","liteloader":"1.0","nonsense":5}"#,
        )
        .unwrap();
        let deps = dependencies_of(&raw);
        assert_eq!(deps["minecraft"], "1.21.4");
        assert_eq!(deps["neoforge"], "21.4.30");
        assert!(deps.get("liteloader").is_none());
        assert!(deps.get("nonsense").is_none());
    }
}
