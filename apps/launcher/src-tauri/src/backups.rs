// Snapshots of an instance, or of a single world inside it.
//
// This is the safety net for every destructive thing the launcher offers: a
// mod update that breaks a save, a repair, a rollback, a player editing configs
// by hand. It is deliberately dumb — a zip of real files, in a directory the
// player can open, with a JSON sidecar naming it. No delta chain, no dedupe
// against the shared cache: a backup whose restore depends on the rest of the
// tree still being intact is not a backup.
//
//   <root>/backups/<slug>/<id>.zip     the bytes
//   <root>/backups/<slug>/<id>.json    kind, label, when, and the world folder
//
// The sidecar is what the list reads. Deriving the metadata from the zip name
// instead would mean parsing a timestamp back out of a filename, and a world
// called "1-2-3" would be indistinguishable from one.

use std::io::{Read as _, Write as _};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::install::instance::safe_join;
use crate::install::paths::Layout;
use crate::install::InstallFailure;
use crate::settings;

/// Natives are re-extracted by every launch, so backing them up doubles the
/// size of a snapshot to preserve something that is regenerated anyway.
const SKIP_AT_ROOT: [&str; 1] = [crate::install::paths::BIN];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Backup {
    /// Filename stem of both the zip and this sidecar. Also the handle every
    /// other command takes.
    pub id: String,
    /// "instance" or "world".
    pub kind: String,
    /// What the player sees: the world's title, or the pack's name.
    pub label: String,
    /// RFC-3339, UTC.
    pub created_at: String,
    /// The save folder, for a world backup. Absent for a whole instance.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub world: Option<String>,
    /// Size of the zip itself, not of the contents.
    #[serde(default)]
    pub size_bytes: u64,
}

fn backups_dir(layout: &Layout, slug: &str) -> PathBuf {
    layout
        .root()
        .join("backups")
        .join(crate::install::paths::sanitize_slug(slug))
}

/// Ids are generated here and never taken from the renderer, but they are still
/// filtered before becoming a path: this is the last point before a filename is
/// built, and every other path in this module is derived from it.
fn safe_id(id: &str) -> Option<String> {
    let ok = !id.is_empty()
        && id.len() <= 128
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_');
    ok.then(|| id.to_string())
}

fn timestamp_id(kind: &str) -> String {
    // Colons are legal in an RFC-3339 timestamp and illegal in a Windows
    // filename, so the id uses a flattened form and the sidecar keeps the real
    // one.
    let now = chrono::Utc::now().format("%Y%m%d-%H%M%S");
    format!("{kind}-{now}")
}

/// Recursively add `dir` to the zip under `prefix`.
///
/// Directory entries are written explicitly so an empty folder survives the
/// round trip — a world with no `playerdata/` yet still restores with the same
/// shape it had.
fn add_dir(
    zip: &mut zip::ZipWriter<std::fs::File>,
    dir: &Path,
    prefix: &str,
    skip_names: &[&str],
) -> Result<(), InstallFailure> {
    let options =
        zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let entries = std::fs::read_dir(dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer {}: {e}", dir.display())))?;

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if skip_names.contains(&name.as_str()) {
            continue;
        }
        let path = entry.path();
        let rel = if prefix.is_empty() {
            name.clone()
        } else {
            format!("{prefix}/{name}")
        };
        let Ok(kind) = entry.file_type() else { continue };

        if kind.is_dir() {
            zip.add_directory(format!("{rel}/"), options)
                .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{rel}»: {e}")))?;
            // Only the root level has entries worth skipping; deeper down a
            // `.boff-bin` is a name the player chose.
            add_dir(zip, &path, &rel, &[])?;
        } else if kind.is_file() {
            let bytes = match std::fs::read(&path) {
                Ok(b) => b,
                // A file the game holds open (a session lock) must not abort a
                // backup of the other nine hundred.
                Err(_) => continue,
            };
            zip.start_file(&rel, options)
                .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{rel}»: {e}")))?;
            zip.write_all(&bytes)
                .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{rel}»: {e}")))?;
        }
    }
    Ok(())
}

/// Snapshot an instance, or one world when `world` names a save folder.
#[tauri::command]
pub async fn backup_create(
    slug: String,
    world: Option<String>,
    label: String,
    app: tauri::AppHandle,
) -> Result<Backup, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug).minecraft;
    if !instance.is_dir() {
        return Err(InstallFailure::message(
            "Este pack no está instalado todavía.",
        ));
    }

    // The world folder comes from the renderer, so it is joined rather than
    // concatenated — the same rule the Files tab follows.
    let (source, kind, skip): (PathBuf, &str, &[&str]) = match world.as_deref() {
        Some(folder) => {
            let dir = safe_join(&instance.join("saves"), folder)
                .ok_or_else(|| InstallFailure::message("Mundo no válido."))?;
            if !dir.is_dir() {
                return Err(InstallFailure::message("Ese mundo ya no existe."));
            }
            (dir, "world", &[])
        }
        None => (instance.clone(), "instance", &SKIP_AT_ROOT),
    };

    let dir = backups_dir(&layout, &slug);
    std::fs::create_dir_all(&dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear la carpeta: {e}")))?;

    let id = timestamp_id(kind);
    let zip_path = dir.join(format!("{id}.zip"));
    // Written to a `.part` and renamed, so an interrupted backup never lands in
    // the list as a restorable snapshot that is actually a truncated zip.
    let temp = dir.join(format!("{id}.part"));

    {
        let file = std::fs::File::create(&temp)
            .map_err(|e| InstallFailure::message(format!("No se pudo crear la copia: {e}")))?;
        let mut zip = zip::ZipWriter::new(file);
        add_dir(&mut zip, &source, "", skip)?;
        zip.finish()
            .map_err(|e| InstallFailure::message(format!("No se pudo cerrar la copia: {e}")))?;
    }
    std::fs::rename(&temp, &zip_path)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar la copia: {e}")))?;

    let record = Backup {
        size_bytes: std::fs::metadata(&zip_path).map(|m| m.len()).unwrap_or(0),
        id: id.clone(),
        kind: kind.to_string(),
        label,
        created_at: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
        world,
    };
    let json = serde_json::to_vec_pretty(&record)
        .map_err(|e| InstallFailure::message(format!("No se pudo describir la copia: {e}")))?;
    std::fs::write(dir.join(format!("{id}.json")), json)
        .map_err(|e| InstallFailure::message(format!("No se pudo guardar la copia: {e}")))?;

    Ok(record)
}

/// Every snapshot for this pack, newest first.
#[tauri::command]
pub async fn backup_list(slug: String, app: tauri::AppHandle) -> Result<Vec<Backup>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let dir = backups_dir(&layout, &slug);
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return Ok(Vec::new());
    };

    let mut out: Vec<Backup> = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        // A sidecar whose zip is gone is not offered: restoring it would fail
        // at the point the player has already committed to it.
        let Some(stem) = path.file_stem().and_then(|s| s.to_str()) else {
            continue;
        };
        if !dir.join(format!("{stem}.zip")).is_file() {
            continue;
        }
        let Ok(raw) = std::fs::read(&path) else { continue };
        // A corrupt sidecar is skipped rather than failing the whole list —
        // one bad file must not hide every good backup the player has.
        if let Ok(record) = serde_json::from_slice::<Backup>(&raw) {
            out.push(record);
        }
    }
    out.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(out)
}

#[tauri::command]
pub async fn backup_delete(
    slug: String,
    id: String,
    app: tauri::AppHandle,
) -> Result<(), InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let id = safe_id(&id).ok_or_else(|| InstallFailure::message("Copia no válida."))?;
    let dir = backups_dir(&layout, &slug);
    let _ = std::fs::remove_file(dir.join(format!("{id}.zip")));
    let _ = std::fs::remove_file(dir.join(format!("{id}.json")));
    Ok(())
}

/// Put a snapshot back.
///
/// A world restore REPLACES the save directory rather than merging into it: a
/// world is a set of region files that reference each other, and merging a new
/// backup over a newer world leaves chunks from both, which the game reads as
/// corruption. An instance restore overwrites file by file and leaves anything
/// the snapshot does not mention, because wiping the instance would also take
/// the other worlds with it.
#[tauri::command]
pub async fn backup_restore(
    slug: String,
    id: String,
    app: tauri::AppHandle,
) -> Result<(), InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let id = safe_id(&id).ok_or_else(|| InstallFailure::message("Copia no válida."))?;
    let dir = backups_dir(&layout, &slug);

    let raw = std::fs::read(dir.join(format!("{id}.json")))
        .map_err(|_| InstallFailure::message("Esa copia ya no existe."))?;
    let record: Backup = serde_json::from_slice(&raw)
        .map_err(|e| InstallFailure::message(format!("La copia está dañada: {e}")))?;

    let instance = layout.instance(&slug).minecraft;
    let target = match record.world.as_deref() {
        Some(folder) => {
            let dest = safe_join(&instance.join("saves"), folder)
                .ok_or_else(|| InstallFailure::message("Mundo no válido."))?;
            if dest.exists() {
                std::fs::remove_dir_all(&dest).map_err(|e| {
                    InstallFailure::message(format!("No se pudo reemplazar el mundo: {e}"))
                })?;
            }
            dest
        }
        None => instance.clone(),
    };
    std::fs::create_dir_all(&target)
        .map_err(|e| InstallFailure::message(format!("No se pudo preparar la carpeta: {e}")))?;

    let file = std::fs::File::open(dir.join(format!("{id}.zip")))
        .map_err(|_| InstallFailure::message("Esa copia ya no existe."))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| InstallFailure::message(format!("La copia está dañada: {e}")))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| InstallFailure::message(format!("La copia está dañada: {e}")))?;
        let name = entry.name().replace('\\', "/");
        let is_dir = entry.is_dir();
        // `safe_join` is the guard, not `enclosed_name()`: a zip is an untrusted
        // archive whatever wrote it, and this is the same check every other path
        // from outside the launcher goes through.
        let Some(dest) = safe_join(&target, name.trim_end_matches('/')) else {
            continue;
        };
        if is_dir {
            let _ = std::fs::create_dir_all(&dest);
            continue;
        }
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                InstallFailure::message(format!("No se pudo crear {}: {e}", parent.display()))
            })?;
        }
        let mut bytes = Vec::new();
        entry
            .read_to_end(&mut bytes)
            .map_err(|e| InstallFailure::message(format!("No se pudo leer «{name}»: {e}")))?;
        std::fs::write(&dest, &bytes)
            .map_err(|e| InstallFailure::message(format!("No se pudo restaurar «{name}»: {e}")))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_id_can_never_become_a_path() {
        assert!(safe_id("world-20260801-120000").is_some());
        // Every shape that would escape the backups directory.
        assert!(safe_id("../../etc/passwd").is_none());
        assert!(safe_id("a/b").is_none());
        assert!(safe_id("a.zip").is_none());
        assert!(safe_id("").is_none());
        assert!(safe_id(&"a".repeat(200)).is_none());
    }

    #[test]
    fn the_generated_id_has_no_character_windows_refuses() {
        let id = timestamp_id("world");
        assert!(id.starts_with("world-"));
        assert!(!id.contains(':'));
        assert!(safe_id(&id).is_some(), "a generated id must survive its own filter");
    }

    #[test]
    fn a_round_trip_restores_every_file_and_the_empty_dirs() {
        let root = std::env::temp_dir().join(format!("boff-backup-{}", uuid::Uuid::new_v4()));
        let source = root.join("src");
        std::fs::create_dir_all(source.join("config")).unwrap();
        std::fs::create_dir_all(source.join("empty")).unwrap();
        std::fs::create_dir_all(source.join(crate::install::paths::BIN)).unwrap();
        std::fs::write(source.join("config/a.json"), "{\"fov\":90}").unwrap();
        std::fs::write(source.join(crate::install::paths::BIN).join("n.dll"), "x").unwrap();

        let zip_path = root.join("out.zip");
        {
            let file = std::fs::File::create(&zip_path).unwrap();
            let mut zip = zip::ZipWriter::new(file);
            add_dir(&mut zip, &source, "", &SKIP_AT_ROOT).unwrap();
            zip.finish().unwrap();
        }

        let dest = root.join("dest");
        std::fs::create_dir_all(&dest).unwrap();
        let mut archive = zip::ZipArchive::new(std::fs::File::open(&zip_path).unwrap()).unwrap();
        for i in 0..archive.len() {
            let mut e = archive.by_index(i).unwrap();
            let name = e.name().replace('\\', "/");
            let target = safe_join(&dest, name.trim_end_matches('/')).unwrap();
            if e.is_dir() {
                std::fs::create_dir_all(&target).unwrap();
                continue;
            }
            std::fs::create_dir_all(target.parent().unwrap()).unwrap();
            let mut bytes = Vec::new();
            e.read_to_end(&mut bytes).unwrap();
            std::fs::write(&target, &bytes).unwrap();
        }

        assert_eq!(
            std::fs::read_to_string(dest.join("config/a.json")).unwrap(),
            "{\"fov\":90}"
        );
        assert!(dest.join("empty").is_dir(), "an empty folder must survive");
        // Natives are regenerated on every launch; carrying them would double
        // the size of every snapshot for nothing.
        assert!(
            !dest.join(crate::install::paths::BIN).exists(),
            "the natives dir must be skipped at the root"
        );

        let _ = std::fs::remove_dir_all(&root);
    }
}
