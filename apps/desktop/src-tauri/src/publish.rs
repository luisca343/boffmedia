//! Publishing a local pack to the Boffmedia registry.
//!
//! The order is not arrangeable: **blobs first, version last, publish separately.**
//! A version manifest that references an `override` blob nobody uploaded is
//! precisely the failure the dashboard controller's comment calls out — the pack
//! looks published and 404s at install time, on somebody else's machine. So the
//! version POST is the commit point, and nothing before it is visible to a
//! launcher: a version is created as a DRAFT and stays invisible until publish
//! is asked for as its own act.
//!
//! Validation runs LOCALLY first, against the same zod-derived schema the server
//! runs (`pack::parse_manifest`). That is not belt-and-braces — it is the whole
//! accessibility argument for authoring here: an invalid pack fails instantly,
//! in Spanish, on the machine that can fix it, instead of as a 400 after a
//! multi-megabyte upload.
//!
//! The server-assigned pack id is recorded in a SIDECAR beside the pack, never
//! in the manifest. The manifest is the document that gets uploaded, so an id
//! written into it would round-trip into the next version's payload and start
//! claiming to be something the author never set.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::api::{self, ApiError, ApiState};
use crate::install::files::local_blob_path;
use crate::install::paths::Layout;
use crate::install::InstallFailure;
use crate::pack::{PackManifest, PackManifestVersionFilesItemSource as Source};
use crate::settings;

const SIDECAR_FILE: &str = "published.json";

/// What a previous publish of this pack recorded.
///
/// Beside the manifest, not inside it — see the module header. `pack_id` is what
/// makes the second publish an UPDATE of the same pack rather than a duplicate
/// with a fresh id, which is the difference between a player's installed
/// instance following the new version and being orphaned.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishRecord {
    #[serde(default)]
    pub pack_id: Option<String>,
    #[serde(default)]
    pub last_version_id: Option<String>,
    #[serde(default)]
    pub published_at: Option<String>,
    /// The URL the server gave the uploaded icon, remembered so a republish
    /// that did not change the artwork does not upload it again.
    #[serde(default)]
    pub icon_url: Option<String>,
    /// sha512 of the icon bytes the `icon_url` above corresponds to.
    #[serde(default)]
    pub icon_sha512: Option<String>,
}

fn sidecar_path(dir: &Path) -> PathBuf {
    dir.join(SIDECAR_FILE)
}

pub fn read_record(dir: &Path) -> PublishRecord {
    std::fs::read_to_string(sidecar_path(dir))
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

fn write_record(dir: &Path, record: &PublishRecord) -> Result<(), InstallFailure> {
    let raw = serde_json::to_string_pretty(record)
        .map_err(|e| InstallFailure::message(format!("No se pudo serializar el registro: {e}")))?;
    std::fs::write(sidecar_path(dir), raw)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar el registro: {e}")))
}

/// What the publish screen shows BEFORE anything leaves the machine.
///
/// A preflight rather than a progress bar, because every one of these answers is
/// worth having in advance: whether the pack is valid at all, how many megabytes
/// are actually about to move (the launcher already holds the bytes, and the
/// server may already hold most of them), and whether this creates a pack or
/// adds a version to one that exists.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishPlan {
    pub slug: String,
    pub pack_name: String,
    pub version_name: String,
    /// Empty when the manifest is valid. Each entry is one schema violation,
    /// already in the message the schema itself produced.
    pub errors: Vec<String>,
    /// Non-fatal findings, e.g. a datapack shipped without a global loader.
    pub warnings: Vec<String>,
    pub file_count: usize,
    /// Overrides this pack contains, whether or not the server has them.
    pub override_count: usize,
    /// Overrides the server does NOT have yet — the actual upload list.
    pub missing_blobs: Vec<String>,
    pub upload_bytes: u64,
    /// Set when a previous publish recorded one: this will add a version to it
    /// rather than creating a second pack.
    pub existing_pack_id: Option<String>,
    pub has_icon: bool,
    pub optional_feature_count: usize,
}

/// Every `override` sha512 the manifest references, deduplicated.
///
/// Worlds and `initialFiles` are included because they ship through the SAME
/// blob store as `files[]` — a bundled world that uploaded nothing is a version
/// that installs and then cannot extract its save.
fn override_hashes(manifest: &PackManifest) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut push = |sha: &str| {
        let sha = sha.to_lowercase();
        if !out.contains(&sha) {
            out.push(sha);
        }
    };

    for file in &manifest.version.files {
        if let Source::Override { blob_sha512 } = &file.source {
            push(blob_sha512.as_str());
        }
    }
    for file in &manifest.version.initial_files {
        if let crate::pack::PackManifestVersionInitialFilesItemSource::Override { blob_sha512 } =
            &file.source
        {
            push(blob_sha512.as_str());
        }
    }
    for world in &manifest.version.worlds {
        if let crate::pack::PackManifestVersionWorldsItemSource::Override { blob_sha512 } =
            &world.source
        {
            push(blob_sha512.as_str());
        }
    }
    out
}

/// Read and fully validate a local pack's manifest.
///
/// `parse_manifest` and not `serde_json::from_str`: it is the function that runs
/// the nine optional-content rules and everything else JSON Schema cannot carry,
/// and skipping it here would mean the launcher happily uploads a document the
/// server then refuses.
fn load_manifest(dir: &Path) -> Result<PackManifest, InstallFailure> {
    let raw = std::fs::read_to_string(dir.join("manifest.json"))
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el manifiesto: {e}")))?;
    crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto no es válido: {e}")))
}

/// The preflight. Never uploads anything.
pub async fn plan(
    app: &tauri::AppHandle,
    api: &ApiState,
    dir: &Path,
    slug: &str,
) -> Result<PublishPlan, InstallFailure> {
    let settings = settings::load(app);
    let layout = Layout::new(app, settings.game_dir())?;

    // A manifest that will not parse produces a plan carrying the reason rather
    // than an error: the publish screen's job is to SHOW what is wrong, and a
    // rejected command would leave it with nothing to show.
    let manifest = match load_manifest(dir) {
        Ok(manifest) => manifest,
        Err(err) => {
            return Ok(PublishPlan {
                slug: slug.to_string(),
                pack_name: slug.to_string(),
                version_name: String::new(),
                errors: vec![err.message],
                warnings: Vec::new(),
                file_count: 0,
                override_count: 0,
                missing_blobs: Vec::new(),
                upload_bytes: 0,
                existing_pack_id: read_record(dir).pack_id,
                has_icon: false,
                optional_feature_count: 0,
            })
        }
    };

    let hashes = override_hashes(&manifest);
    // One call, not one per file: a pack with 400 overrides is 400 round trips
    // and the useful answer is the short list of what is missing.
    let missing = missing_blobs(api, &hashes).await.unwrap_or_else(|_| hashes.clone());

    let upload_bytes = missing
        .iter()
        .filter_map(|sha| std::fs::metadata(local_blob_path(&layout, sha)).ok())
        .map(|m| m.len())
        .sum();

    let warnings = datapack_warnings(&manifest);

    Ok(PublishPlan {
        slug: slug.to_string(),
        pack_name: manifest.pack.name.to_string(),
        version_name: manifest.version.name.to_string(),
        errors: Vec::new(),
        warnings,
        file_count: manifest.version.files.len(),
        override_count: hashes.len(),
        upload_bytes,
        missing_blobs: missing,
        existing_pack_id: read_record(dir).pack_id,
        has_icon: icon_bytes(dir).is_some(),
        optional_feature_count: manifest
            .version
            .optional_groups
            .iter()
            .map(|g| g.features.len())
            .sum(),
    })
}

/// Mirrors `optionalWarnings` in boffmedia.ts: a datapack only reaches the game
/// through a global loader, and a pack that declares one without shipping
/// OpenLoader or Paxi installs a zip nothing will ever read.
///
/// A WARNING and never an error, on both sides, because it rests on a filename
/// heuristic — and a heuristic that can refuse to publish a valid pack is worse
/// than no check at all.
fn datapack_warnings(manifest: &PackManifest) -> Vec<String> {
    let declares_datapack = manifest.version.optional_groups.iter().any(|g| {
        g.features.iter().any(|f| {
            matches!(
                f.activate,
                Some(crate::pack::PackManifestVersionOptionalGroupsItemFeaturesItemActivate::Datapack { .. })
            )
        })
    });
    if !declares_datapack {
        return Vec::new();
    }

    let has_loader = manifest.version.files.iter().any(|f| {
        let name = f.path.as_str().to_lowercase();
        name.ends_with(".jar") && (name.contains("openloader") || name.contains("paxi"))
    });
    if has_loader {
        return Vec::new();
    }
    vec![
        "Este pack incluye datapacks pero no lleva un cargador global (OpenLoader o Paxi). \
         Sin uno, el juego nunca los lee."
            .to_string(),
    ]
}

async fn missing_blobs(api: &ApiState, hashes: &[String]) -> Result<Vec<String>, ApiError> {
    if hashes.is_empty() {
        return Ok(Vec::new());
    }
    #[derive(Deserialize)]
    struct Body {
        missing: Vec<String>,
    }
    let res = api::authed_post_json(
        api,
        "/packs/desktop/blobs/present",
        &serde_json::json!({ "sha512": hashes }),
    )
    .await?;
    if !res.status().is_success() {
        return Err(api::response_error(res, "No se pudo consultar los blobs").await);
    }
    let body: Body = res.json().await?;
    Ok(body.missing)
}

fn icon_bytes(dir: &Path) -> Option<(Vec<u8>, String)> {
    let entries = std::fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with("icon.") {
            continue;
        }
        let bytes = std::fs::read(entry.path()).ok()?;
        return Some((bytes, name));
    }
    None
}

/// The result of a publish, so the screen can link to what it just made.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishResult {
    pub pack_id: String,
    pub version_id: String,
    pub published: bool,
    pub uploaded_blobs: usize,
}

/// Upload and create. `publish` decides whether the new version becomes visible
/// or stays a draft for review in the web admin.
pub async fn run(
    app: &tauri::AppHandle,
    api: &ApiState,
    dir: &Path,
    publish: bool,
) -> Result<PublishResult, InstallFailure> {
    let settings = settings::load(app);
    let layout = Layout::new(app, settings.game_dir())?;
    let manifest = load_manifest(dir)?;
    let mut record = read_record(dir);

    // ── 1. blobs ─────────────────────────────────────────────────────────
    // Before the version, always. The launcher's own store is content-addressed
    // under exactly the hash the server wants, so an override imported from a
    // `.mrpack` needs no repacking at all — this is where that store earns its
    // keep.
    let hashes = override_hashes(&manifest);
    let missing = missing_blobs(api, &hashes).await.map_err(as_failure)?;
    for sha in &missing {
        let path = local_blob_path(&layout, sha);
        let bytes = std::fs::read(&path).map_err(|e| {
            InstallFailure::message(format!(
                "Falta el archivo «{sha}» en el almacén local ({e}). Reimporta el pack."
            ))
        })?;
        let res = api::authed_post_bytes(api, "/packs/desktop/blobs", bytes)
            .await
            .map_err(as_failure)?;
        if !res.status().is_success() {
            return Err(as_failure(
                api::response_error(res, "No se pudo subir un archivo").await,
            ));
        }
    }

    // ── 2. icon (D2) ─────────────────────────────────────────────────────
    // Uploaded before the pack is created, because `CreatePackDto` takes a URL
    // and a pack created without one arrives without the artwork its author has
    // been looking at all along. Skipped when the bytes have not changed since
    // the last publish — the sidecar remembers both the hash and the URL.
    let mut icon_url = record.icon_url.clone();
    if let Some((bytes, filename)) = icon_bytes(dir) {
        let sha = sha512_hex(&bytes);
        if record.icon_sha512.as_deref() != Some(sha.as_str()) || icon_url.is_none() {
            let uploaded = upload_image(api, bytes, &filename).await.map_err(as_failure)?;
            record.icon_sha512 = Some(sha);
            record.icon_url = Some(uploaded.clone());
            icon_url = Some(uploaded);
        }
    }

    // ── 3. the pack ──────────────────────────────────────────────────────
    let pack_id = match record.pack_id.clone() {
        Some(id) => {
            // A republish keeps the same pack, so an installed instance follows
            // the new version instead of being orphaned beside a duplicate.
            let body = serde_json::json!({
                "name": manifest.pack.name.to_string(),
                "summary": manifest.pack.summary.as_ref().map(|s| s.to_string()),
                "description": manifest.pack.description.as_ref().map(|s| s.to_string()),
                "iconUrl": icon_url,
            });
            let res = api::authed_patch_json(api, &format!("/packs/desktop/packs/{id}"), &body)
                .await
                .map_err(as_failure)?;
            if !res.status().is_success() {
                return Err(as_failure(
                    api::response_error(res, "No se pudo actualizar el pack").await,
                ));
            }
            id
        }
        None => {
            // The slug is NOT reused: a local pack's slug carries the `local-`
            // prefix that keeps it structurally unreachable from managed packs,
            // and publishing it under that name would put a `local-` pack in the
            // registry — exactly the collision the prefix exists to prevent.
            let slug = manifest
                .pack
                .slug
                .to_string()
                .trim_start_matches("local-")
                .to_string();
            let body = serde_json::json!({
                "slug": slug,
                "name": manifest.pack.name.to_string(),
                "summary": manifest.pack.summary.as_ref().map(|s| s.to_string()),
                "description": manifest.pack.description.as_ref().map(|s| s.to_string()),
                "iconUrl": icon_url,
                "accessKind": "public",
            });
            let res = api::authed_post_json(api, "/packs/desktop/packs", &body)
                .await
                .map_err(as_failure)?;
            if !res.status().is_success() {
                return Err(as_failure(
                    api::response_error(res, "No se pudo crear el pack").await,
                ));
            }
            decode_id(res).await?
        }
    };
    record.pack_id = Some(pack_id.clone());
    // Written NOW, before the version POST. A crash between here and the version
    // would otherwise lose the id and the next publish would create a duplicate
    // pack — the one outcome that cannot be undone from the launcher.
    write_record(dir, &record)?;

    // ── 4. the version, which is the commit point ────────────────────────
    let version = &manifest.version;
    let mut body = serde_json::json!({
        "name": version.name.to_string(),
        "files": serde_json::to_value(&version.files).unwrap_or(serde_json::Value::Null),
    });
    if let Some(deps) = &version.dependencies {
        body["minecraft"] = serde_json::json!(deps.minecraft.to_string());
        if let Some((loader, loader_version)) = loader_of(deps) {
            body["loader"] = serde_json::json!(loader);
            body["loaderVersion"] = serde_json::json!(loader_version);
        }
    }
    if !version.worlds.is_empty() {
        body["worlds"] = serde_json::to_value(&version.worlds).unwrap_or(serde_json::Value::Null);
    }
    if !version.initial_files.is_empty() {
        body["initialFiles"] =
            serde_json::to_value(&version.initial_files).unwrap_or(serde_json::Value::Null);
    }
    if !version.optional_groups.is_empty() {
        body["optionalGroups"] =
            serde_json::to_value(&version.optional_groups).unwrap_or(serde_json::Value::Null);
    }

    let res = api::authed_post_json(api, &format!("/packs/desktop/packs/{pack_id}/versions"), &body)
        .await
        .map_err(as_failure)?;
    if !res.status().is_success() {
        return Err(as_failure(
            api::response_error(res, "No se pudo crear la versión").await,
        ));
    }
    let version_id = decode_id(res).await?;
    record.last_version_id = Some(version_id.clone());
    write_record(dir, &record)?;

    // ── 5. publish, as its own act ───────────────────────────────────────
    if publish {
        let res = api::authed_post_empty(
            api,
            &format!("/packs/desktop/packs/{pack_id}/versions/{version_id}/publish"),
        )
        .await
        .map_err(as_failure)?;
        if !res.status().is_success() {
            // The version exists and is a valid draft, so this is not a failed
            // publish so much as an unfinished one — say which half worked.
            return Err(as_failure(
                api::response_error(
                    res,
                    "La versión se subió como borrador pero no se pudo publicar",
                )
                .await,
            ));
        }
    }

    Ok(PublishResult {
        pack_id,
        version_id,
        published: publish,
        uploaded_blobs: missing.len(),
    })
}

fn loader_of(
    deps: &crate::pack::PackManifestVersionDependencies,
) -> Option<(&'static str, String)> {
    if let Some(v) = &deps.neoforge {
        return Some(("neoforge", v.to_string()));
    }
    if let Some(v) = &deps.forge {
        return Some(("forge", v.to_string()));
    }
    if let Some(v) = &deps.fabric_loader {
        return Some(("fabric", v.to_string()));
    }
    if let Some(v) = &deps.quilt_loader {
        return Some(("quilt", v.to_string()));
    }
    None
}

async fn upload_image(
    api: &ApiState,
    bytes: Vec<u8>,
    filename: &str,
) -> Result<String, ApiError> {
    #[derive(Deserialize)]
    struct Body {
        url: String,
    }
    let res = api::authed_post_image(api, "/packs/desktop/images", bytes, filename).await?;
    if !res.status().is_success() {
        return Err(api::response_error(res, "No se pudo subir la imagen").await);
    }
    let body: Body = res.json().await?;
    Ok(body.url)
}

/// Every write route answers `{ id }` inside the API's success envelope.
async fn decode_id(res: reqwest::Response) -> Result<String, InstallFailure> {
    #[derive(Deserialize)]
    struct Envelope {
        data: Inner,
    }
    #[derive(Deserialize)]
    struct Inner {
        id: String,
    }
    let body: Envelope = res
        .json()
        .await
        .map_err(|e| InstallFailure::message(format!("Respuesta inesperada del servidor: {e}")))?;
    Ok(body.data.id)
}

fn sha512_hex(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha512};
    let mut hasher = Sha512::new();
    hasher.update(bytes);
    hasher
        .finalize()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// `ApiError` carries the "you need to sign in again" signal the renderer keys
/// on, and flattening it into a plain string would lose it: the publish screen
/// has to be able to offer "vuelve a iniciar sesión" rather than a dead end.
///
/// Matched exhaustively rather than through a catch-all, so a new variant is a
/// compile error here instead of silently becoming a generic message.
fn as_failure(err: ApiError) -> InstallFailure {
    match err {
        ApiError::NeedsSignin(message) => InstallFailure {
            message,
            needs_signin: true,
            code: None,
        },
        ApiError::Denied(message)
        | ApiError::Message(message)
        | ApiError::Unreachable(message)
        | ApiError::ServerDown(message)
        | ApiError::Store(message) => InstallFailure::message(message),
    }
}

// ── Commands ───────────────────────────────────────────────────────────────

/// The preflight the publish screen renders. Reads the manifest, validates it
/// locally, and asks the server which blobs it already has — but uploads
/// nothing, so it is safe to run every time the screen opens.
#[tauri::command]
pub async fn pack_publish_plan(
    slug: String,
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<PublishPlan, InstallFailure> {
    let dir = crate::local_packs::safe_local_dir(&app, &slug)?;
    plan(&app, &api, &dir, &slug).await
}

/// Upload and create. `publish: false` leaves the new version as a draft, which
/// is the reviewable path — a draft is invisible to every launcher until
/// somebody says otherwise.
#[tauri::command]
pub async fn pack_publish(
    slug: String,
    publish: bool,
    app: tauri::AppHandle,
    api: tauri::State<'_, ApiState>,
) -> Result<PublishResult, InstallFailure> {
    let dir = crate::local_packs::safe_local_dir(&app, &slug)?;
    run(&app, &api, &dir, publish).await
}
