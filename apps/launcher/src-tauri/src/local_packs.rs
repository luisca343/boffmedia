// Player-authored packs (RF-05..RF-10, spec D3/D4).
//
// A local pack is a full `PackManifest` document — the SAME shape a managed
// pack downloads — stored at
//   <app-data>/local-packs/<slug>/manifest.json
// so install/launch never needs a second code path: `install::mod::prepare`
// already accepts a raw manifest JSON `Value` and does not care where it came
// from.
//
// Namespacing (spec D3) is what makes a managed pack unreachable from here,
// not a scattered set of checks: every local pack's `pack.slug` is forced
// under the `local-` prefix, so its install/launch instance directory
// (`instances/<slug>/`, chosen by `pack.slug` in resolve/prepare) can never
// collide with a slug the dashboard issues — those never carry that prefix.
// `safe_local_dir` re-derives the on-disk path FROM that same slug and rejects
// anything that would not resolve as a direct child of `local-packs/`, so a
// crafted slug can never escape it either.

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri_plugin_dialog::DialogExt;

use crate::install::files::resolve_url;
use crate::install::resolve::{fetch_for, Fetch, PlannedFile};
use crate::install::InstallFailure;
use crate::pack::{parse_manifest, ManifestError, PackManifest};

const LOCAL_PREFIX: &str = "local-";
const MANIFEST_FILE: &str = "manifest.json";

fn local_packs_dir(app: &tauri::AppHandle) -> Result<PathBuf, InstallFailure> {
    let root = crate::datadir::data_root(app).map_err(InstallFailure::message)?;
    Ok(root.join("local-packs"))
}

/// Resolves a slug to its manifest directory, refusing anything that is not a
/// direct, same-named child of `local-packs/` — a slug that fails the schema's
/// own kebab-case pattern, or one crafted with `..`/`/`, is rejected before it
/// ever reaches the filesystem (RF-10: managed packs, and anything outside
/// this tree, are structurally unreachable).
fn safe_local_dir(app: &tauri::AppHandle, slug: &str) -> Result<PathBuf, InstallFailure> {
    if !slug.starts_with(LOCAL_PREFIX) {
        return Err(InstallFailure::message(
            "Los packs locales deben tener un identificador que empiece por «local-».".to_string(),
        ));
    }
    if !is_kebab(slug) {
        return Err(InstallFailure::message(format!(
            "«{slug}» no es un identificador de pack válido."
        )));
    }
    let base = local_packs_dir(app)?;
    let dir = base.join(slug);
    // Belt and braces: confirm the joined path still lands directly under
    // `local-packs/` before any write touches it.
    match dir.parent() {
        Some(parent) if parent == base => Ok(dir),
        _ => Err(InstallFailure::message(format!(
            "«{slug}» no resuelve dentro de la carpeta de packs locales."
        ))),
    }
}

fn is_kebab(s: &str) -> bool {
    !s.is_empty()
        && s.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        && !s.starts_with('-')
        && !s.ends_with('-')
        && !s.contains("--")
}

fn slugify(name: &str) -> String {
    let mut out = String::new();
    let mut last_dash = true; // suppress a leading dash
    for ch in name.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
    }
    while out.ends_with('-') {
        out.pop();
    }
    if out.is_empty() {
        out.push_str("pack");
    }
    out
}

/// The manifest with a slug free under `local-packs/` — `<base>`, then
/// `<base>-2`, `<base>-3`, … (spec D4). `base` must already carry the
/// `local-` prefix.
fn free_slug(dir: &Path, base: &str) -> String {
    if !dir.join(base).exists() {
        return base.to_string();
    }
    let mut n = 2;
    loop {
        let candidate = format!("{base}-{n}");
        if !dir.join(&candidate).exists() {
            return candidate;
        }
        n += 1;
    }
}

fn read_manifest(dir: &Path) -> Result<PackManifest, InstallFailure> {
    let raw = std::fs::read_to_string(dir.join(MANIFEST_FILE))
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el pack: {e}")))?;
    parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El pack local está dañado: {e}")))
}

/// tmp + rename: a crash or a power loss mid-write leaves either the old
/// manifest or the new one, never a half-written file (RF-08's "no partial
/// state" applies here too, not only to a failed import).
fn write_manifest_atomic(dir: &Path, manifest: &PackManifest) -> Result<(), InstallFailure> {
    std::fs::create_dir_all(dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear la carpeta del pack: {e}")))?;
    let raw = serde_json::to_string_pretty(manifest)
        .map_err(|e| InstallFailure::message(format!("No se pudo serializar el pack: {e}")))?;
    let tmp = dir.join(format!("{MANIFEST_FILE}.tmp"));
    std::fs::write(&tmp, raw)
        .map_err(|e| InstallFailure::message(format!("No se pudo escribir el pack: {e}")))?;
    std::fs::rename(&tmp, dir.join(MANIFEST_FILE))
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar el pack: {e}")))?;
    Ok(())
}

#[tauri::command]
pub async fn local_packs_list(app: tauri::AppHandle) -> Result<Vec<PackManifest>, InstallFailure> {
    let base = local_packs_dir(&app)?;
    let Ok(entries) = std::fs::read_dir(&base) else {
        return Ok(Vec::new());
    };
    let mut out = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        // A manifest that fails to parse is skipped rather than failing the
        // whole listing — one corrupt pack must not take the library down.
        if let Ok(manifest) = read_manifest(&path) {
            out.push(manifest);
        }
    }
    Ok(out)
}

#[tauri::command]
pub async fn local_pack_get(
    app: tauri::AppHandle,
    slug: String,
) -> Result<PackManifest, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    read_manifest(&dir)
}

/// Create or overwrite a local pack. A NEW pack (no `slug`, or one not yet
/// present in `local-packs/`) gets a fresh, collision-free `local-` slug
/// derived from its name; an existing local slug is overwritten in place —
/// that is what "edit" means for a document with no separate id.
#[tauri::command]
pub async fn local_pack_save(
    app: tauri::AppHandle,
    manifest: serde_json::Value,
) -> Result<PackManifest, InstallFailure> {
    let mut manifest = manifest;
    let base = local_packs_dir(&app)?;

    let requested_slug = manifest
        .get("pack")
        .and_then(|p| p.get("slug"))
        .and_then(|s| s.as_str())
        .unwrap_or_default()
        .to_string();

    let is_existing_local = requested_slug.starts_with(LOCAL_PREFIX) && base.join(&requested_slug).exists();

    let slug = if is_existing_local {
        requested_slug
    } else {
        let name = manifest
            .get("pack")
            .and_then(|p| p.get("name"))
            .and_then(|s| s.as_str())
            .unwrap_or("pack");
        let candidate = format!("{LOCAL_PREFIX}{}", slugify(name));
        free_slug(&base, &candidate)
    };

    if let Some(pack) = manifest.get_mut("pack").and_then(|p| p.as_object_mut()) {
        pack.insert("slug".to_string(), serde_json::Value::String(slug.clone()));
        // The creation form has no id to give and sends "", which is NOT the
        // same as absent: the schema requires a non-empty string, so
        // `or_insert` would leave the empty one in place and the manifest would
        // fail to parse with a message about JSON. Treat empty as missing.
        let has_id = pack
            .get("id")
            .and_then(|v| v.as_str())
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);
        if !has_id {
            pack.insert("id".to_string(), serde_json::Value::String(format!("local:{slug}")));
        }
        pack.entry("access")
            .or_insert_with(|| serde_json::json!({ "kind": "public" }));
    }
    if manifest.get("formatVersion").is_none() {
        manifest["formatVersion"] = serde_json::json!(1);
    }
    if manifest.get("version").is_none() {
        manifest["version"] = serde_json::json!({
            "id": format!("local-v1-{slug}"),
            "name": "local",
            // Z-suffixed, not "+00:00": the schema's date-time pattern only
            // accepts the Z form.
            "createdAt": chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            "dependencies": { "minecraft": "1.21.4" },
            "files": [],
        });
    }

    let raw = serde_json::to_string(&manifest)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el formulario: {e}")))?;
    let parsed = parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El pack no es válido: {e}")))?;

    let dir = safe_local_dir(&app, &slug)?;
    write_manifest_atomic(&dir, &parsed)?;
    Ok(parsed)
}

/// Copy `from` into `to`, skipping `skip_at_root` at the top level only.
///
/// Not `fs::copy` on the directory (no such thing) and not a rename: the
/// original must survive untouched, which is the entire point of duplicating.
fn copy_tree(from: &Path, to: &Path, skip_at_root: &[&str]) -> Result<(), InstallFailure> {
    std::fs::create_dir_all(to)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear {}: {e}", to.display())))?;
    let entries = std::fs::read_dir(from)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer {}: {e}", from.display())))?;

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if skip_at_root.contains(&name.as_str()) {
            continue;
        }
        let src = entry.path();
        let dest = to.join(&name);
        let Ok(kind) = entry.file_type() else { continue };
        if kind.is_dir() {
            copy_tree(&src, &dest, &[])?;
        } else if kind.is_file() {
            std::fs::copy(&src, &dest).map_err(|e| {
                InstallFailure::message(format!("No se pudo copiar «{name}»: {e}"))
            })?;
        }
    }
    Ok(())
}

/// Fork a local pack: a new manifest under a fresh slug, plus a copy of the
/// instance directory when the source is installed.
///
/// Local packs only. A MANAGED pack's slug and manifest belong to the server —
/// duplicating one would produce a second instance claiming to be the same
/// server-side pack, which the install pass would then fight over on every
/// launch. Forking a managed pack into an editable local one is a genuinely
/// useful thing, but it is a different feature: it has to decide what happens
/// to the pack's identity, and it is not this one.
#[tauri::command]
pub async fn local_pack_duplicate(
    app: tauri::AppHandle,
    slug: String,
    name: String,
) -> Result<PackManifest, InstallFailure> {
    let source_dir = safe_local_dir(&app, &slug)?;
    let manifest = read_manifest(&source_dir)?;

    let label = {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            format!("{} (copia)", manifest.pack.name.to_string())
        } else {
            trimmed.to_string()
        }
    };

    let base = local_packs_dir(&app)?;
    let new_slug = free_slug(&base, &format!("{LOCAL_PREFIX}{}", slugify(&label)));

    // Round-tripped through JSON rather than mutated in place: `pack.id` and
    // `pack.slug` are typed as non-empty by the schema, so there is no way to
    // express "unset" on the parsed struct.
    let mut value = serde_json::to_value(&manifest)
        .map_err(|e| InstallFailure::message(format!("No se pudo copiar el pack: {e}")))?;
    if let Some(pack) = value.get_mut("pack").and_then(|p| p.as_object_mut()) {
        pack.insert("slug".into(), serde_json::Value::String(new_slug.clone()));
        pack.insert("id".into(), serde_json::Value::String(format!("local:{new_slug}")));
        pack.insert("name".into(), serde_json::Value::String(label));
    }

    let raw = serde_json::to_string(&value)
        .map_err(|e| InstallFailure::message(format!("No se pudo copiar el pack: {e}")))?;
    let parsed = parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("La copia no es válida: {e}")))?;

    let dest_dir = safe_local_dir(&app, &new_slug)?;
    write_manifest_atomic(&dest_dir, &parsed)?;

    // The installed files, when there are any. Natives are skipped: they are
    // re-extracted on launch, and copying them doubles the work for bytes the
    // next run overwrites anyway. The install marker IS copied, so the clone
    // starts out "installed" instead of re-downloading a tree it already has.
    let settings = crate::settings::load(&app);
    let layout = crate::install::paths::Layout::new(&app, settings.game_dir())?;
    let from = layout.instance(&slug).minecraft;
    if from.is_dir() {
        let to = layout.instance(&new_slug).minecraft;
        if let Err(e) = copy_tree(&from, &to, &[crate::install::paths::BIN]) {
            // The manifest is already written; leaving a pack with no files is
            // recoverable (the player installs it), but leaving a half-copied
            // instance that claims to be installed is not.
            let _ = std::fs::remove_dir_all(&to);
            let _ = std::fs::remove_dir_all(&dest_dir);
            return Err(e);
        }
    }

    Ok(parsed)
}

#[tauri::command]
pub async fn local_pack_delete(app: tauri::AppHandle, slug: String) -> Result<(), InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    if dir.exists() {
        std::fs::remove_dir_all(&dir)
            .map_err(|e| InstallFailure::message(format!("No se pudo borrar el pack: {e}")))?;
    }
    Ok(())
}

// ── .mrpack export / import (RF-06/RF-07/RF-08) ─────────────────────────────
// A local pack IS a PackManifest, not an .mrpack — the zip is only the
// interchange format at the boundary. `modrinth.index.json` carries the
// STANDARD `files`/`dependencies` arrays a real Modrinth reader (Prism,
// Modrinth App) needs, plus `boffmedia:manifest` as an extra, proprietary key
// so another Boffmedia launcher can reconstruct the exact PackManifest without
// re-deriving it from the standard fields. The standard arrays are never
// skipped in favour of that extra key — a reader that ignores unknown keys
// must still see every file.

#[derive(Serialize)]
struct MrpackFileHashes {
    #[serde(skip_serializing_if = "Option::is_none")]
    sha1: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sha512: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MrpackFile {
    path: String,
    hashes: MrpackFileHashes,
    #[serde(skip_serializing_if = "Option::is_none")]
    env: Option<crate::pack::PackManifestVersionFilesItemEnv>,
    downloads: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    file_size: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MrpackIndex<'a> {
    format_version: u32,
    game: &'static str,
    version_id: String,
    name: String,
    files: Vec<MrpackFile>,
    dependencies: crate::pack::PackManifestVersionDependencies,
    #[serde(rename = "boffmedia:manifest")]
    boffmedia_manifest: &'a PackManifest,
}

/// A file whose source has no public URL (CurseForge or `override` — §4.5,
/// §7.2) and must instead be fetched through our own API and embedded as
/// zip bytes under `overrides/<path>`.
struct EmbedFile {
    path: String,
    /// Carried so the export can look the bytes up in the local blob store
    /// before falling back to the API — an imported pack's overrides have no
    /// server-side copy at all.
    sha512: String,
    pack_file: crate::api::PackFile,
}

/// Turns the manifest's OWN file list into the standard `.mrpack` `files[]`
/// array, split from the network/zip/dialog side effects so it is testable
/// on its own (no `AppHandle` needed for the `url`/Modrinth branches this
/// exercises). Files with no public URL come back in the second element
/// instead of being silently dropped (RF-06).
async fn resolve_mrpack_files(
    http: &reqwest::Client,
    manifest: &PackManifest,
) -> Result<(Vec<MrpackFile>, Vec<EmbedFile>), InstallFailure> {
    let mut files = Vec::with_capacity(manifest.version.files.len());
    let mut to_embed = Vec::new();

    for f in &manifest.version.files {
        let path = f.path.to_string();
        let sha512 = f.sha512.to_string();
        let fetch = fetch_for(&f.source, &path)?;
        let planned = PlannedFile {
            path: path.clone(),
            sha512: sha512.clone(),
            size: f.file_size.max(0) as u64,
            fetch: fetch.clone(),
            is_mod: path.to_lowercase().starts_with("mods/"),
            optional: false,
        };

        match resolve_url(http, &planned).await {
            Ok(url) => files.push(MrpackFile {
                path,
                hashes: MrpackFileHashes {
                    sha1: None,
                    sha512: Some(sha512),
                },
                env: Some(f.env.clone()),
                downloads: vec![url],
                file_size: Some(f.file_size),
            }),
            Err(_) => {
                let Fetch::Proxied(pack_file) = fetch else {
                    return Err(InstallFailure::message(format!(
                        "No se pudo resolver la descarga de «{path}»."
                    )));
                };
                to_embed.push(EmbedFile {
                    path,
                    sha512: sha512.to_lowercase(),
                    pack_file,
                });
            }
        }
    }

    Ok((files, to_embed))
}

#[tauri::command]
pub async fn export_mrpack(app: tauri::AppHandle, slug: String) -> Result<String, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let manifest = read_manifest(&dir)?;

    let dialog = app.dialog().clone();
    let file_name = format!("{}.mrpack", manifest.pack.slug.to_string());
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog
            .file()
            .set_file_name(&file_name)
            .add_filter("Modrinth pack", &["mrpack"])
            .blocking_save_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La exportación se interrumpió: {e}")))?;

    let Some(target) = chosen else {
        return Err(InstallFailure::message("Exportación cancelada.".to_string()));
    };
    let target = target
        .into_path()
        .map_err(|e| InstallFailure::message(format!("Ruta de destino inválida: {e}")))?;

    let file = std::fs::File::create(&target)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el archivo: {e}")))?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);
    use std::io::Write as _;

    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    // A Modrinth-sourced file needs one round-trip to turn its pinned version
    // id into a real CDN URL (same lookup install uses); a `url` source is
    // already public — both resolve to a `files[]` entry. A CurseForge or
    // `override` source has NO public URL by construction (§4.5/§7.2), which
    // `resolve_mrpack_files` reports back as `ToEmbed` instead of silently
    // leaving the file out of the pack (RF-06).
    let (mrpack_files, to_embed) = resolve_mrpack_files(&http, &manifest).await?;

    let settings = crate::settings::load(&app);
    let layout = crate::install::paths::Layout::new(&app, settings.game_dir())?;

    for embed in to_embed {
        // An override belonging to an IMPORTED pack exists only on this
        // machine — the API never hosted it, so asking the API for it would
        // 404 and make the pack un-exportable. Local blob first, API second.
        let local = crate::install::files::local_blob_path(&layout, &embed.sha512);
        let bytes = if local.is_file() {
            std::fs::read(&local).map_err(|e| {
                InstallFailure::message(format!("No se pudo leer «{}»: {e}", embed.path))
            })?
        } else {
            let response = crate::api::fetch_pack_file(
                &app,
                &manifest.pack.id.to_string(),
                None,
                &embed.pack_file,
            )
            .await
            .map_err(|e| {
                InstallFailure::message(format!(
                    "No se pudo empaquetar «{}» (sin URL pública): {e:?}",
                    embed.path
                ))
            })?;
            response
                .bytes()
                .await
                .map_err(|e| {
                    InstallFailure::message(format!("No se pudo leer «{}»: {e}", embed.path))
                })?
                .to_vec()
        };
        zip.start_file(format!("overrides/{}", embed.path), options)
            .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{}»: {e}", embed.path)))?;
        zip.write_all(&bytes)
            .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{}»: {e}", embed.path)))?;
    }

    let index = MrpackIndex {
        format_version: 1,
        game: "minecraft",
        version_id: manifest.version.id.to_string(),
        name: manifest.pack.name.to_string(),
        files: mrpack_files,
        dependencies: manifest.version.dependencies.clone(),
        boffmedia_manifest: &manifest,
    };
    let index_json = serde_json::to_vec_pretty(&index)
        .map_err(|e| InstallFailure::message(format!("No se pudo generar el pack: {e}")))?;

    zip.start_file("modrinth.index.json", options)
        .map_err(|e| InstallFailure::message(format!("No se pudo escribir el pack: {e}")))?;
    zip.write_all(&index_json)
        .map_err(|e| InstallFailure::message(format!("No se pudo escribir el pack: {e}")))?;
    zip.finish()
        .map_err(|e| InstallFailure::message(format!("No se pudo cerrar el pack: {e}")))?;

    Ok(target.display().to_string())
}

/// `loader_of` (resolve.rs) only ever names ONE loader, by first-match
/// precedence — a manifest that declares more than one (a hand-edited file,
/// or a pack authored by a launcher with a different loader story) would
/// otherwise have the rest silently dropped at install time. Rejected here,
/// up front, with a message the player can act on (RF-08: no partial state).
///
/// The second check is exhaustive by construction — `LoaderKind` covers
/// exactly the four keys the schema allows today — but named explicitly
/// rather than discarded (as the dead code before this fix did): a future
/// loader key added to the schema without a matching `LoaderKind` variant
/// fails the import instead of installing silently as vanilla.
fn reject_ambiguous_or_unsupported_loader(manifest: &PackManifest) -> Result<(), InstallFailure> {
    let deps = &manifest.version.dependencies;
    let declared_loaders = [
        deps.forge.is_some(),
        deps.neoforge.is_some(),
        deps.fabric_loader.is_some(),
        deps.quilt_loader.is_some(),
    ]
    .into_iter()
    .filter(|present| *present)
    .count();
    if declared_loaders > 1 {
        return Err(InstallFailure::message(
            "El pack declara más de un cargador de mods a la vez; el launcher no sabe cuál instalar."
                .to_string(),
        ));
    }

    if let Some((kind, version)) = crate::install::resolve::loader_of(manifest) {
        if crate::install::resolve::LoaderKind::from_key(kind.key()) != Some(kind) {
            return Err(InstallFailure::message(format!(
                "El launcher no sabe instalar el cargador «{}» ({version}).",
                kind.key()
            )));
        }
    }
    Ok(())
}

#[derive(Serialize)]
pub struct ImportResult {
    pub manifest: PackManifest,
    /// True when the pack's own name/slug collided with an existing local pack
    /// and was renamed with a suffix (spec D4) — the UI shows a non-blocking
    /// notice for this, never a silent rename.
    pub renamed: bool,
}

#[tauri::command]
pub async fn import_mrpack(app: tauri::AppHandle) -> Result<ImportResult, InstallFailure> {
    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog.file().add_filter("Modrinth pack", &["mrpack"]).blocking_pick_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La importación se interrumpió: {e}")))?;

    let Some(picked) = chosen else {
        return Err(InstallFailure::message("Importación cancelada.".to_string()));
    };
    let source = picked
        .into_path()
        .map_err(|e| InstallFailure::message(format!("Ruta de origen inválida: {e}")))?;

    let bytes = std::fs::read(&source)
        .map_err(|e| InstallFailure::message(format!("No se pudo abrir el archivo: {e}")))?;
    import_mrpack_bytes(&app, bytes).await
}

/// The shared body of every import route (file picker, pasted URL, in-app
/// browse). Takes the whole zip in memory: an .mrpack is an index plus configs,
/// so it is measured in megabytes, and holding it means the seekable reader the
/// override pass needs comes for free.
///
/// RF-08 — no partial state: every failure below returns before a single byte
/// is written under `local-packs/`. The local BLOB store is the one exception
/// and is intentional; it is content-addressed, so a blob written by an import
/// that later failed is unreferenced, harmless, and reused if the player
/// retries.
pub async fn import_mrpack_bytes(
    app: &tauri::AppHandle,
    bytes: Vec<u8>,
) -> Result<ImportResult, InstallFailure> {
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(bytes))
        .map_err(|e| InstallFailure::message(format!("El .mrpack no es un zip válido: {e}")))?;
    let mut raw = String::new();
    {
        let mut index_entry = archive.by_name("modrinth.index.json").map_err(|_| {
            InstallFailure::message("El .mrpack no contiene modrinth.index.json.".to_string())
        })?;
        use std::io::Read as _;
        index_entry
            .read_to_string(&mut raw)
            .map_err(|e| InstallFailure::message(format!("No se pudo leer el índice: {e}")))?;
    }

    let index: serde_json::Value = serde_json::from_str(&raw)
        .map_err(|e| InstallFailure::message(format!("El índice del .mrpack no es JSON válido: {e}")))?;

    let base = local_packs_dir(app)?;

    // Two kinds of .mrpack reach this point. Our own export round-trips the
    // whole PackManifest under `boffmedia:manifest`, so importing it back is a
    // deserialize and nothing is lost. A pack from Modrinth (or Prism, or
    // packwiz) has no such key and is CONVERTED — see mrpack.rs. The Boffmedia
    // key is preferred when present because it is strictly richer: the standard
    // index cannot express a CurseForge source or a pack server.
    let mut manifest = match index.get("boffmedia:manifest").cloned() {
        Some(manifest_value) => {
            let manifest_raw = serde_json::to_string(&manifest_value)
                .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
            parse_manifest(&manifest_raw).map_err(|e| match e {
                ManifestError::Json(err) => {
                    InstallFailure::message(format!("El manifiesto del pack no es válido: {err}"))
                }
                other => {
                    InstallFailure::message(format!("El manifiesto del pack no es válido: {other}"))
                }
            })?
        }
        None => {
            let parsed: crate::mrpack::MrIndex = serde_json::from_str(&raw).map_err(|e| {
                InstallFailure::message(format!("El índice del .mrpack no es válido: {e}"))
            })?;
            let name = if parsed.name.trim().is_empty() {
                "Pack importado".to_string()
            } else {
                parsed.name.trim().to_string()
            };
            // The slug is settled BEFORE conversion because the manifest's own
            // `pack.id`/`pack.slug` are derived from it, and rewriting them
            // afterwards is how the two drift apart.
            let candidate = format!("{LOCAL_PREFIX}{}", slugify(&name));
            let slug = free_slug(&base, &candidate);
            // Same visible rule as the Boffmedia path below: a collision is
            // renamed, never silent, so two imports of the same pack are
            // distinguishable in the library and not just on disk.
            let name = if slug == candidate {
                name
            } else {
                format!("{name} ({})", slug.rsplit('-').next().unwrap_or("2"))
            };
            let settings = crate::settings::load(app);
            let layout = crate::install::paths::Layout::new(app, settings.game_dir())?;
            let http = reqwest::Client::builder()
                .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
                .build()
                .map_err(|e| {
                    InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}"))
                })?;
            let manifest =
                crate::mrpack::manifest_from_index(&parsed, &mut archive, &layout, &http, &slug, &name)
                    .await?;
            reject_ambiguous_or_unsupported_loader(&manifest)?;
            let renamed = slug != candidate;
            let dir = safe_local_dir(app, &slug)?;
            write_manifest_atomic(&dir, &manifest)?;
            return Ok(ImportResult { manifest, renamed });
        }
    };

    // RF-08: reject an unsupported/ambiguous loader HERE, before a single byte
    // lands under `local-packs/`.
    reject_ambiguous_or_unsupported_loader(&manifest)?;

    let requested = slugify(&manifest.pack.name);
    let candidate = format!("{LOCAL_PREFIX}{requested}");
    let final_slug = free_slug(&base, &candidate);
    let renamed = final_slug != candidate;

    manifest.pack.slug = final_slug
        .clone()
        .try_into()
        .map_err(|e| InstallFailure::message(format!("Identificador de pack inválido: {e}")))?;
    manifest.pack.id = format!("local:{final_slug}")
        .try_into()
        .map_err(|e: crate::pack::error::ConversionError| {
            InstallFailure::message(format!("Identificador de pack inválido: {e}"))
        })?;
    if renamed {
        let renamed_name = format!(
            "{} ({})",
            manifest.pack.name.to_string(),
            final_slug.rsplit('-').next().unwrap_or("2")
        );
        manifest.pack.name = renamed_name
            .try_into()
            .map_err(|e: crate::pack::error::ConversionError| {
                InstallFailure::message(format!("Nombre de pack inválido: {e}"))
            })?;
    }

    let dir = safe_local_dir(app, &final_slug)?;
    write_manifest_atomic(&dir, &manifest)?;

    Ok(ImportResult { manifest, renamed })
}

/// Import straight from Modrinth: a project page URL, a version URL, or a bare
/// project id/slug. Also accepts a direct link to a `.mrpack`, since a player
/// who has the download URL should not have to save the file first.
///
/// A project reference (no explicit version) resolves to the pack's LATEST
/// release. Picking a version is what the in-app browser is for; a pasted link
/// is a "just get me this pack" gesture and asking a second question there
/// would be noise.
#[tauri::command]
pub async fn import_mrpack_url(
    app: tauri::AppHandle,
    url: String,
) -> Result<ImportResult, InstallFailure> {
    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    let download = crate::mrpack::resolve_pack_download(&http, url.trim()).await?;
    let res = http
        .get(&download)
        .send()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo descargar el pack: {e}")))?;
    if !res.status().is_success() {
        return Err(InstallFailure::message(format!(
            "No se pudo descargar el pack: el servidor respondió {}.",
            res.status()
        )));
    }
    let bytes = res
        .bytes()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el pack: {e}")))?;

    import_mrpack_bytes(&app, bytes.to_vec()).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slugify_reserves_the_local_prefix_shape() {
        assert_eq!(slugify("Boff SMP!"), "boff-smp");
        assert_eq!(slugify("   "), "pack");
        assert!(is_kebab(&format!("{LOCAL_PREFIX}{}", slugify("My Pack"))));
    }

    #[test]
    fn free_slug_appends_a_suffix_on_collision() {
        let dir = std::env::temp_dir().join(format!("boff-local-packs-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(dir.join("local-boff-smp")).unwrap();
        assert_eq!(free_slug(&dir, "local-boff-smp"), "local-boff-smp-2");
        std::fs::create_dir_all(dir.join("local-boff-smp-2")).unwrap();
        assert_eq!(free_slug(&dir, "local-boff-smp"), "local-boff-smp-3");
        let _ = std::fs::remove_dir_all(&dir);
    }

    fn manifest_with_file(deps: &str, file_source: &str) -> PackManifest {
        let raw = format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"local:local-my-pack","slug":"local-my-pack","name":"My pack","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{deps},
                  "files":[{{"path":"mods/sodium.jar","sha512":"{s}","fileSize":42,
                    "env":{{"client":"optional","server":"unsupported"}},"source":{file_source}}}]}}}}"#,
            s = "a".repeat(128)
        );
        crate::pack::parse_manifest(&raw).expect("fixture must be valid")
    }

    // T14: a real Modrinth/Prism reader only ever looks at `files`/`dependencies`
    // — the round-trip against our own `boffmedia:manifest` key was passing
    // while those stayed empty, which is exactly the bug this guards against.
    #[tokio::test]
    async fn exported_index_carries_standard_files_and_dependencies() {
        let manifest = manifest_with_file(
            r#"{"minecraft":"1.21.4","neoforge":"21.4.30"}"#,
            r#"{"kind":"url","url":"https://cdn.example.test/sodium.jar"}"#,
        );
        let http = reqwest::Client::new();
        let (files, to_embed) = resolve_mrpack_files(&http, &manifest).await.unwrap();

        assert!(to_embed.is_empty(), "a `url` source is always public");
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].path, "mods/sodium.jar");
        assert_eq!(files[0].downloads, vec!["https://cdn.example.test/sodium.jar".to_string()]);
        // The optional flag is the standard .mrpack mechanism (env.client) —
        // our own resolve.rs already reads exactly this to build the install
        // plan, so it must survive the export unmodified.
        let env = files[0].env.as_ref().expect("env must be carried over");
        assert_eq!(serde_json::to_value(env).unwrap()["client"], "optional");

        let index = MrpackIndex {
            format_version: 1,
            game: "minecraft",
            version_id: manifest.version.id.to_string(),
            name: manifest.pack.name.to_string(),
            files,
            dependencies: manifest.version.dependencies.clone(),
            boffmedia_manifest: &manifest,
        };
        let value = serde_json::to_value(&index).unwrap();
        assert!(
            value["files"].as_array().is_some_and(|a| !a.is_empty()),
            "files must not be empty"
        );
        assert_eq!(value["dependencies"]["minecraft"], "1.21.4");
        assert_eq!(value["dependencies"]["neoforge"], "21.4.30");
    }

    #[tokio::test]
    async fn a_proxied_source_is_reported_for_embedding_never_dropped() {
        let manifest = manifest_with_file(
            r#"{"minecraft":"1.21.4"}"#,
            &format!(r#"{{"kind":"override","blobSha512":"{}"}}"#, "b".repeat(128)),
        );
        let http = reqwest::Client::new();
        let (files, to_embed) = resolve_mrpack_files(&http, &manifest).await.unwrap();

        assert!(files.is_empty(), "an override has no public URL to list");
        assert_eq!(to_embed.len(), 1);
        assert_eq!(to_embed[0].path, "mods/sodium.jar");
    }

    // T15: an ambiguous loader used to pass straight through import — the
    // first-match precedence in resolve.rs would then silently pick one and
    // discard the other at install time instead of failing the import.
    #[test]
    fn import_rejects_a_manifest_declaring_two_loaders_at_once() {
        let manifest = manifest_with_file(
            r#"{"minecraft":"1.21.4","forge":"1.2.3","fabric-loader":"0.15.0"}"#,
            r#"{"kind":"url","url":"https://cdn.example.test/a.jar"}"#,
        );
        assert!(reject_ambiguous_or_unsupported_loader(&manifest).is_err());
    }

    #[test]
    fn import_accepts_a_manifest_with_a_single_loader() {
        let manifest = manifest_with_file(
            r#"{"minecraft":"1.21.4","neoforge":"21.4.30"}"#,
            r#"{"kind":"url","url":"https://cdn.example.test/a.jar"}"#,
        );
        assert!(reject_ambiguous_or_unsupported_loader(&manifest).is_ok());
    }
}
