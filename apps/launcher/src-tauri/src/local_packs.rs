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
use base64::Engine;

use crate::install::files::resolve_url;
use crate::install::resolve::{fetch_for, Fetch, PlannedFile};
use crate::pack::PackManifestVersionFilesItemEnvServer as EnvServer;
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
    // Deleting a local pack removes it whole: leaving the installed instance or
    // its backups behind would make the pack vanish from the library while its
    // files (often the largest thing on disk) sit under instances/<slug>/ and
    // backups/<slug>/ with nothing left in the UI that points at them.
    let settings = crate::settings::load(&app);
    let layout = crate::install::paths::Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug).root;
    if instance.exists() {
        std::fs::remove_dir_all(&instance).map_err(|e| {
            InstallFailure::message(format!("No se pudieron borrar los archivos instalados: {e}"))
        })?;
    }
    let backups = crate::backups::backups_dir(&layout, &slug);
    if backups.exists() {
        std::fs::remove_dir_all(&backups).map_err(|e| {
            InstallFailure::message(format!("No se pudieron borrar las copias de seguridad: {e}"))
        })?;
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
    server_only: bool,
) -> Result<(Vec<MrpackFile>, Vec<EmbedFile>), InstallFailure> {
    let mut files = Vec::with_capacity(manifest.version.files.len());
    let mut to_embed = Vec::new();

    for f in &manifest.version.files {
        // A server pack drops the client-only files (shaders, minimaps, a
        // client-side HUD): env.server == "unsupported" means the mod cannot even
        // load on a server. Mirrors install/resolve.rs, which drops the reverse
        // (env.client == "unsupported") for the client.
        if server_only && f.env.server == EnvServer::Unsupported {
            continue;
        }
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
    export_mrpack_impl(app, slug, false).await
}

/// A server-only export: the same `.mrpack`, minus every file whose
/// `env.server` is `unsupported`. HANDOFF §9 ("server pack generation from the
/// same manifest"). The output is a standard Modrinth pack a server installer
/// (mrpack-install and friends) consumes directly — what it saves the admin is
/// having to strip the client-only mods by hand, and shipping a shader pack to a
/// headless server. It does NOT bundle a loader server jar: the admin installs
/// the matching Forge/NeoForge/Fabric server, then applies this pack's mods.
#[tauri::command]
pub async fn export_server_mrpack(
    app: tauri::AppHandle,
    slug: String,
) -> Result<String, InstallFailure> {
    export_mrpack_impl(app, slug, true).await
}

async fn export_mrpack_impl(
    app: tauri::AppHandle,
    slug: String,
    server_only: bool,
) -> Result<String, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let manifest = read_manifest(&dir)?;

    let dialog = app.dialog().clone();
    let suffix = if server_only { "-server" } else { "" };
    let file_name = format!("{}{suffix}.mrpack", manifest.pack.slug.to_string());
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
    let (mrpack_files, to_embed) = resolve_mrpack_files(&http, &manifest, server_only).await?;

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

    // Export bundled worlds to overrides/saves/<folder>/ (Prism-compatible)
    for world in &manifest.version.worlds {
        let world_folder = world.folder.as_str();
        let local = crate::install::files::local_blob_path(&layout, &world.sha512.as_str());
        let world_zip_bytes = if local.is_file() {
            std::fs::read(&local).ok()
        } else {
            // For managed packs, try to fetch from the API
            crate::api::fetch_pack_file(
                &app,
                &manifest.pack.id.to_string(),
                None,
                &crate::api::PackFile::Override {
                    sha512: world.sha512.as_str().to_string(),
                },
            )
            .await
            .ok()
            .and_then(|r| tokio::runtime::Handle::current().block_on(r.bytes()).ok())
            .map(|b| b.to_vec())
        };

        if let Some(bytes) = world_zip_bytes {
            // Extract the zip contents directly into overrides/saves/<folder>/
            if let Ok(mut world_archive) = zip::ZipArchive::new(std::io::Cursor::new(&bytes)) {
                for i in 0..world_archive.len() {
                    if let Ok(mut file) = world_archive.by_index(i) {
                        let file_path = file.name();
                        if !file_path.is_empty() {
                            let entry_path = format!("overrides/saves/{}/{}", world_folder, file_path);
                            let _ = zip.start_file(&entry_path, options);
                            let _ = std::io::copy(&mut file, &mut zip);
                        }
                    }
                }
            }
        }
    }

    // Export icon to boffmedia/icon if present
    if let Ok(icon_file) = icon_path(&dir) {
        if let Ok(icon_bytes) = std::fs::read(&icon_file) {
            if let Some(filename) = icon_file.file_name().and_then(|n| n.to_str()) {
                let _ = zip.start_file(&format!("boffmedia/{}", filename), options);
                let _ = zip.write_all(&icon_bytes);
            }
        }
    }

    // Export gallery images to boffmedia/gallery/
    let gallery_dir = dir.join("gallery");
    if gallery_dir.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&gallery_dir) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
                        if let Some(filename) = entry.file_name().to_str() {
                            if let Ok(bytes) = std::fs::read(entry.path()) {
                                let _ = zip.start_file(&format!("boffmedia/gallery/{}", filename), options);
                                let _ = zip.write_all(&bytes);
                            }
                        }
                    }
                }
            }
        }
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
    // A file on disk has no project behind it, so no header icon to fetch.
    import_mrpack_bytes(&app, bytes, None).await
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
    // The pack header icon the caller resolved from Modrinth, stamped onto a
    // CONVERTED pack (a plain `.mrpack` has no icon of its own). `None` for a
    // file-picker import, and ignored for our own round-tripped manifests,
    // which already carry their icon.
    icon_url: Option<String>,
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
            let manifest = crate::mrpack::manifest_from_index(
                &parsed,
                &mut archive,
                &layout,
                &http,
                &slug,
                &name,
                icon_url.as_deref(),
            )
            .await?;
            reject_ambiguous_or_unsupported_loader(&manifest)?;
            let renamed = slug != candidate;
            let dir = safe_local_dir(app, &slug)?;
            write_manifest_atomic(&dir, &manifest)?;

            // Extract icon and gallery from boffmedia/ if present
            let _ = extract_mrpack_metadata(&mut archive, &dir);

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

    // Extract icon and gallery from boffmedia/ if present
    let _ = extract_mrpack_metadata(&mut archive, &dir);

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
    // Best-effort header icon from the Modrinth project the link points at. A
    // direct `.mrpack` on some other host has no project, and resolves to None.
    let icon_url = crate::mrpack::project_icon_url(&http, url.trim()).await;
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

    import_mrpack_bytes(&app, bytes.to_vec(), icon_url).await
}

// ── Local pack icon & gallery (metadata, not installed) ──────────────────────
// Icons and gallery images are stored on disk but NOT in the manifest to avoid
// bloating local_packs_list loads. They are stored in convention dirs under the
// pack's directory: `<slug>/icon.<ext>` and `<slug>/gallery/<sha256>.<ext>`.

fn icon_path(dir: &Path) -> Result<PathBuf, InstallFailure> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer la carpeta: {e}")))?;

    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with("icon.") && entry.file_type().ok().map(|ft| ft.is_file()).unwrap_or(false) {
            return Ok(entry.path());
        }
    }
    Err(InstallFailure::message("No hay icono".to_string()))
}

/// Opens the native image picker (no file-picker plugin on the JS side of the
/// boundary — the same reason import/export open their dialogs here). Resolves
/// to the chosen path, or `None` if the player cancelled.
async fn pick_image(app: &tauri::AppHandle) -> Result<Option<PathBuf>, InstallFailure> {
    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog
            .file()
            .add_filter("Imagen", &["png", "jpg", "jpeg", "webp", "gif"])
            .blocking_pick_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("El selector se interrumpió: {e}")))?;

    match chosen {
        Some(picked) => Ok(Some(
            picked
                .into_path()
                .map_err(|e| InstallFailure::message(format!("Ruta de origen inválida: {e}")))?,
        )),
        None => Ok(None),
    }
}

/// Opens the native image picker and copies the chosen file to
/// `<slug>/icon.<ext>`. Returns `false` if the player cancelled — the caller
/// treats that as a no-op, never an error.
#[tauri::command]
pub async fn local_pack_icon_set(
    app: tauri::AppHandle,
    slug: String,
) -> Result<bool, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let Some(source) = pick_image(&app).await? else {
        return Ok(false);
    };

    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");
    // A pack keeps exactly one icon; drop any prior one so an old png does not
    // shadow a new jpg (icon_path returns the first icon.* it finds).
    if let Ok(prior) = icon_path(&dir) {
        let _ = std::fs::remove_file(&prior);
    }
    let icon = dir.join(format!("icon.{ext}"));

    std::fs::copy(&source, &icon)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar el icono: {e}")))?;
    Ok(true)
}

#[tauri::command]
pub async fn local_pack_icon_clear(app: tauri::AppHandle, slug: String) -> Result<(), InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    if let Ok(icon) = icon_path(&dir) {
        std::fs::remove_file(&icon)
            .map_err(|e| InstallFailure::message(format!("No se pudo eliminar el icono: {e}")))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn local_pack_icon(
    app: tauri::AppHandle,
    slug: String,
) -> Result<Option<String>, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let icon_file = match icon_path(&dir) {
        Ok(p) => p,
        Err(_) => return Ok(None),
    };

    let bytes = std::fs::read(&icon_file)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el icono: {e}")))?;

    // Limit to 4MB like icon_cache does
    const MAX_ICON_BYTES: usize = 4 * 1024 * 1024;
    if bytes.len() > MAX_ICON_BYTES {
        return Err(InstallFailure::message(format!(
            "El icono es demasiado grande ({} MB, máx 4 MB)",
            bytes.len() / (1024 * 1024)
        )));
    }

    // Guess MIME type from extension
    let mime = icon_file
        .extension()
        .and_then(|e| e.to_str())
        .and_then(|ext| match ext.to_lowercase().as_str() {
            "png" => Some("image/png"),
            "jpg" | "jpeg" => Some("image/jpeg"),
            "webp" => Some("image/webp"),
            "gif" => Some("image/gif"),
            _ => None,
        })
        .unwrap_or("image/png");

    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(Some(format!("data:{mime};base64,{b64}")))
}

#[tauri::command]
pub async fn local_pack_gallery_list(
    app: tauri::AppHandle,
    slug: String,
) -> Result<Vec<String>, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let gallery_dir = dir.join("gallery");
    if !gallery_dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut names = Vec::new();
    let entries = std::fs::read_dir(&gallery_dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer la galería: {e}")))?;

    for entry in entries.flatten() {
        if entry.file_type().ok().map(|ft| ft.is_file()).unwrap_or(false) {
            if let Some(name) = entry.file_name().to_str() {
                names.push(name.to_string());
            }
        }
    }
    names.sort();
    Ok(names)
}

/// Opens the native image picker and copies the chosen file into the gallery
/// dir as `<sha256>.<ext>`. Returns the stored filename, or `None` if the
/// player cancelled.
#[tauri::command]
pub async fn local_pack_gallery_add(
    app: tauri::AppHandle,
    slug: String,
) -> Result<Option<String>, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let Some(source) = pick_image(&app).await? else {
        return Ok(None);
    };

    let bytes = std::fs::read(&source)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el archivo: {e}")))?;

    // Hash to derive filename
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = format!("{:x}", hasher.finalize());

    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");
    let filename = format!("{}.{}", hash, ext);

    let gallery_dir = dir.join("gallery");
    std::fs::create_dir_all(&gallery_dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear la galería: {e}")))?;

    let dest = gallery_dir.join(&filename);
    std::fs::copy(&source, &dest)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar la imagen: {e}")))?;

    Ok(Some(filename))
}

#[tauri::command]
pub async fn local_pack_gallery_remove(
    app: tauri::AppHandle,
    slug: String,
    filename: String,
) -> Result<(), InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let gallery_dir = dir.join("gallery");
    let path = gallery_dir.join(&filename);

    // Guard against path traversal
    if path.canonicalize().ok().map(|p| !p.starts_with(gallery_dir.canonicalize().unwrap_or_default())).unwrap_or(true) {
        return Err(InstallFailure::message("Ruta inválida".to_string()));
    }

    if path.is_file() {
        std::fs::remove_file(&path)
            .map_err(|e| InstallFailure::message(format!("No se pudo eliminar: {e}")))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn local_pack_gallery_image(
    app: tauri::AppHandle,
    slug: String,
    filename: String,
) -> Result<Option<String>, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let gallery_dir = dir.join("gallery");
    let path = gallery_dir.join(&filename);

    // Guard against path traversal
    if path.canonicalize().ok().map(|p| !p.starts_with(gallery_dir.canonicalize().unwrap_or_default())).unwrap_or(true) {
        return Err(InstallFailure::message("Ruta inválida".to_string()));
    }

    if !path.is_file() {
        return Ok(None);
    }

    let bytes = std::fs::read(&path)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer la imagen: {e}")))?;

    const MAX_IMAGE_BYTES: usize = 10 * 1024 * 1024;
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err(InstallFailure::message(format!(
            "La imagen es demasiado grande ({} MB, máx 10 MB)",
            bytes.len() / (1024 * 1024)
        )));
    }

    let mime = path
        .extension()
        .and_then(|e| e.to_str())
        .and_then(|ext| match ext.to_lowercase().as_str() {
            "png" => Some("image/png"),
            "jpg" | "jpeg" => Some("image/jpeg"),
            "webp" => Some("image/webp"),
            "gif" => Some("image/gif"),
            _ => None,
        })
        .unwrap_or("image/png");

    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(Some(format!("data:{mime};base64,{b64}")))
}

// ── Local pack worlds (bundled in pack, installed on first launch) ────────────
// Worlds are stored as zips in the local blob store and referenced from the
// manifest's `version.worlds[]` array. Unlike files, worlds are ONLY installed
// if saves/<folder> does not already exist (first-install-only, never overwrite).

/// Opens the native `.zip` picker, stores the chosen save archive in the local
/// blob store, and appends a `version.worlds[]` entry under `folder`. Returns
/// `false` if the player cancelled. Bumps the version id so the instance
/// re-syncs the new world on next install.
#[tauri::command]
pub async fn local_pack_world_add_zip(
    app: tauri::AppHandle,
    slug: String,
    folder: String,
) -> Result<bool, InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;

    // Validate folder name: single segment, no path traversal
    if folder.contains('/') || folder.contains('\\') || folder.contains("..") || folder.is_empty() {
        return Err(InstallFailure::message(
            "El nombre de la carpeta debe ser un único segmento, sin espacios o símbolos especiales.".to_string(),
        ));
    }

    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog.file().add_filter("Mundo (.zip)", &["zip"]).blocking_pick_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("El selector se interrumpió: {e}")))?;

    let Some(picked) = chosen else {
        return Ok(false);
    };
    let source = picked
        .into_path()
        .map_err(|e| InstallFailure::message(format!("Ruta de origen inválida: {e}")))?;

    let bytes = std::fs::read(&source)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer el archivo: {e}")))?;

    // Compute sha512 of the zip
    use sha2::{Digest, Sha512};
    let mut hasher = Sha512::new();
    hasher.update(&bytes);
    let sha512 = crate::install::files::hex(&hasher.finalize());

    // Store in local blob store
    let settings = crate::settings::load(&app);
    let layout = crate::install::paths::Layout::new(&app, settings.game_dir())?;
    let blob_sha = crate::install::files::put_local_blob(&layout, &bytes)?;

    // Round-trip through JSON like local_pack_save does
    let mut value = serde_json::json!({});
    let current = read_manifest(&dir).ok();
    if let Some(m) = current {
        value = serde_json::to_value(&m)
            .map_err(|e| InstallFailure::message(format!("No se pudo procesar el pack: {e}")))?;
    }

    // Check for duplicates in the JSON
    if let Some(version) = value.get("version").and_then(|v| v.get("worlds")) {
        if let Some(worlds) = version.as_array() {
            if worlds.iter().any(|w| w.get("folder").and_then(|f| f.as_str()) == Some(&folder)) {
                return Err(InstallFailure::message(
                    "Ya hay un mundo con ese nombre en el pack.".to_string(),
                ));
            }
        }
    }

    // Add the new world to the manifest JSON
    if let Some(version) = value.get_mut("version") {
        if !version["worlds"].is_array() {
            version["worlds"] = serde_json::json!([]);
        }
        if let Some(worlds) = version["worlds"].as_array_mut() {
            worlds.push(serde_json::json!({
                "folder": folder,
                "sizeBytes": bytes.len() as i64,
                "sha512": sha512,
                "source": { "kind": "override", "blobSha512": blob_sha },
            }));
        }
    }

    // Mint new version id
    if let Some(version) = value.get_mut("version") {
        let current_id = version.get("id").and_then(|v| v.as_str()).unwrap_or("local-v1");
        let next_num = current_id.split('-').nth(2).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0) + 1;
        version["id"] = serde_json::Value::String(format!(
            "local-v{}-{}-{}",
            next_num,
            chrono::Utc::now().timestamp(),
            slug
        ));
    }

    let raw = serde_json::to_string(&value)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar: {e}")))?;
    let manifest = crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El pack no es válido: {e}")))?;

    write_manifest_atomic(&dir, &manifest)?;
    Ok(true)
}

#[tauri::command]
pub async fn local_pack_world_promote(
    app: tauri::AppHandle,
    slug: String,
    world_folder: String,
) -> Result<(), InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;

    // Validate folder name same as add_zip
    if world_folder.contains('/') || world_folder.contains('\\') || world_folder.contains("..") || world_folder.is_empty() {
        return Err(InstallFailure::message(
            "El nombre de la carpeta debe ser un único segmento.".to_string(),
        ));
    }

    let settings = crate::settings::load(&app);
    let layout = crate::install::paths::Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    let world_path = instance.minecraft.join("saves").join(&world_folder);

    if !world_path.is_dir() {
        return Err(InstallFailure::message(format!(
            "El mundo «{}» no existe",
            world_folder
        )));
    }

    // Zip the world directory
    let zip_bytes = zip_directory(&world_path)?;

    // Compute sha512
    use sha2::{Digest, Sha512};
    let mut hasher = Sha512::new();
    hasher.update(&zip_bytes);
    let sha512 = crate::install::files::hex(&hasher.finalize());

    // Store in local blob store
    let blob_sha = crate::install::files::put_local_blob(&layout, &zip_bytes)?;

    // Round-trip through JSON
    let manifest = read_manifest(&dir)?;
    let mut value = serde_json::to_value(&manifest)
        .map_err(|e| InstallFailure::message(format!("No se pudo procesar el pack: {e}")))?;

    // Check for duplicates in the JSON
    if let Some(version) = value.get("version").and_then(|v| v.get("worlds")) {
        if let Some(worlds) = version.as_array() {
            if worlds.iter().any(|w| w.get("folder").and_then(|f| f.as_str()) == Some(&world_folder)) {
                return Err(InstallFailure::message(
                    "Ya hay un mundo con ese nombre en el pack.".to_string(),
                ));
            }
        }
    }

    // Add the promoted world to the manifest JSON
    if let Some(version) = value.get_mut("version") {
        if !version["worlds"].is_array() {
            version["worlds"] = serde_json::json!([]);
        }
        if let Some(worlds) = version["worlds"].as_array_mut() {
            worlds.push(serde_json::json!({
                "folder": world_folder,
                "sizeBytes": zip_bytes.len() as i64,
                "sha512": sha512,
                "source": { "kind": "override", "blobSha512": blob_sha },
            }));
        }
    }

    // Mint new version id
    if let Some(version) = value.get_mut("version") {
        let current_id = version.get("id").and_then(|v| v.as_str()).unwrap_or("local-v1");
        let next_num = current_id.split('-').nth(2).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0) + 1;
        version["id"] = serde_json::Value::String(format!(
            "local-v{}-{}-{}",
            next_num,
            chrono::Utc::now().timestamp(),
            slug
        ));
    }

    let raw = serde_json::to_string(&value)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar: {e}")))?;
    let parsed = crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El pack no es válido: {e}")))?;

    write_manifest_atomic(&dir, &parsed)?;
    Ok(())
}

#[tauri::command]
pub async fn local_pack_world_remove(
    app: tauri::AppHandle,
    slug: String,
    folder: String,
) -> Result<(), InstallFailure> {
    let dir = safe_local_dir(&app, &slug)?;
    let manifest = read_manifest(&dir)?;
    let mut value = serde_json::to_value(&manifest)
        .map_err(|e| InstallFailure::message(format!("No se pudo procesar el pack: {e}")))?;

    // Find and remove the world entry
    let mut found = false;
    if let Some(version) = value.get_mut("version").and_then(|v| v.get_mut("worlds")) {
        if let Some(worlds) = version.as_array_mut() {
            let original_len = worlds.len();
            worlds.retain(|w| w.get("folder").and_then(|f| f.as_str()) != Some(&folder));
            found = worlds.len() < original_len;
        }
    }

    if !found {
        return Err(InstallFailure::message("Mundo no encontrado".to_string()));
    }

    // Mint new version id
    if let Some(version) = value.get_mut("version") {
        let current_id = version.get("id").and_then(|v| v.as_str()).unwrap_or("local-v1");
        let next_num = current_id.split('-').nth(2).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0) + 1;
        version["id"] = serde_json::Value::String(format!(
            "local-v{}-{}-{}",
            next_num,
            chrono::Utc::now().timestamp(),
            slug
        ));
    }

    let raw = serde_json::to_string(&value)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar: {e}")))?;
    let parsed = crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El pack no es válido: {e}")))?;

    write_manifest_atomic(&dir, &parsed)?;
    Ok(())
}

/// Extract icon and gallery from boffmedia/ directory in an imported .mrpack.
/// Best-effort: failures do not block the import.
fn extract_mrpack_metadata<R: std::io::Read + std::io::Seek>(
    archive: &mut zip::ZipArchive<R>,
    pack_dir: &Path,
) -> Result<(), String> {
    // Collect entries first to avoid borrow issues
    let mut entries = Vec::new();
    for i in 0..archive.len() {
        if let Ok(entry) = archive.by_index(i) {
            entries.push((
                entry.name().to_string(),
                entry.is_dir(),
            ));
        }
    }

    // Extract icon from boffmedia/icon.*
    for (name, is_dir) in &entries {
        if name.starts_with("boffmedia/icon.") && !is_dir {
            if let Ok(mut entry) = archive.by_name(name) {
                let filename = name.split('/').last().unwrap_or("icon.png");
                let dest = pack_dir.join(filename);
                let mut buf = Vec::new();
                let _ = std::io::Read::read_to_end(&mut entry, &mut buf);
                let _ = std::fs::write(&dest, &buf);
            }
        }
    }

    // Extract gallery images from boffmedia/gallery/
    let gallery_dir = pack_dir.join("gallery");
    for (name, is_dir) in &entries {
        if name.starts_with("boffmedia/gallery/") && !is_dir {
            if let Ok(mut entry) = archive.by_name(name) {
                let filename = name.split('/').last().unwrap_or("image.png");
                let _ = std::fs::create_dir_all(&gallery_dir);
                let mut buf = Vec::new();
                let _ = std::io::Read::read_to_end(&mut entry, &mut buf);
                let _ = std::fs::write(gallery_dir.join(filename), &buf);
            }
        }
    }

    Ok(())
}

/// Zip a directory recursively
fn zip_directory(dir: &Path) -> Result<Vec<u8>, InstallFailure> {
    use std::io::Write;
    let mut zip_data = Vec::new();
    {
        let mut zip = zip::ZipWriter::new(std::io::Cursor::new(&mut zip_data));
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        fn add_dir(
            zip: &mut zip::ZipWriter<std::io::Cursor<&mut Vec<u8>>>,
            dir: &Path,
            prefix: &str,
            options: zip::write::SimpleFileOptions,
        ) -> Result<(), InstallFailure> {
            for entry in std::fs::read_dir(dir)
                .map_err(|e| InstallFailure::message(format!("Error leyendo directorio: {e}")))?
                .flatten()
            {
                let path = entry.path();
                let name = entry.file_name();
                let name_str = name.to_string_lossy();
                let entry_path = if prefix.is_empty() {
                    name_str.to_string()
                } else {
                    format!("{}/{}", prefix, name_str)
                };

                if path.is_dir() {
                    add_dir(zip, &path, &entry_path, options)?;
                } else {
                    zip.start_file(&entry_path, options)
                        .map_err(|e| InstallFailure::message(format!("Error en zip: {e}")))?;
                    let data = std::fs::read(&path)
                        .map_err(|e| InstallFailure::message(format!("Error leyendo archivo: {e}")))?;
                    zip.write_all(&data)
                        .map_err(|e| InstallFailure::message(format!("Error escribiendo zip: {e}")))?;
                }
            }
            Ok(())
        }

        add_dir(&mut zip, dir, "", options)?;
        zip.finish()
            .map_err(|e| InstallFailure::message(format!("Error finalizando zip: {e}")))?;
    }
    Ok(zip_data)
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
        let (files, to_embed) = resolve_mrpack_files(&http, &manifest, false).await.unwrap();

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
    async fn server_export_drops_client_only_files() {
        // The fixture's one file is env.server == "unsupported" (a client-only
        // mod), so the server export must leave it out entirely — a server that
        // tried to load it would crash, which is the whole reason for the filter.
        let manifest = manifest_with_file(
            r#"{"minecraft":"1.21.4","neoforge":"21.4.30"}"#,
            r#"{"kind":"url","url":"https://cdn.example.test/sodium.jar"}"#,
        );
        let http = reqwest::Client::new();
        let (files, to_embed) = resolve_mrpack_files(&http, &manifest, true).await.unwrap();
        assert!(files.is_empty(), "a server-unsupported file must be dropped");
        assert!(to_embed.is_empty());

        // …and the CLIENT export of the same manifest still keeps it, so the
        // filter is genuinely conditional on server_only and not a global drop.
        let (client_files, _) = resolve_mrpack_files(&http, &manifest, false).await.unwrap();
        assert_eq!(client_files.len(), 1);
    }

    #[tokio::test]
    async fn a_proxied_source_is_reported_for_embedding_never_dropped() {
        let manifest = manifest_with_file(
            r#"{"minecraft":"1.21.4"}"#,
            &format!(r#"{{"kind":"override","blobSha512":"{}"}}"#, "b".repeat(128)),
        );
        let http = reqwest::Client::new();
        let (files, to_embed) = resolve_mrpack_files(&http, &manifest, false).await.unwrap();

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
