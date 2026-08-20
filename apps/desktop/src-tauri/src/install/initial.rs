//! First-install-only files. An `initialFiles` entry seeds instance state that
//! then belongs to the PLAYER — a starting `.sav`, a default options file. It is
//! written ONLY when the target path does not already exist, and is never
//! re-verified or overwritten afterwards, so a player's progress is never
//! clobbered on update or repair. Same principle as bundled worlds (state
//! written once, then owned by the player), on its own mechanism.
//!
//! Best-effort, exactly like worlds: a failed seed logs and moves on, it never
//! fails the install. Sources are `override` (a blob) or `url` (distributable
//! content); the schema and `pack.rs` forbid `user-provided`/`modrinth`/
//! `curseforge` here, so those arms are unreachable in a validated manifest.

use super::paths::{InstancePaths, Layout};
use super::progress::Reporter;
use crate::install::files;
use crate::pack::{PackManifest, PackManifestVersionInitialFilesItem};
use crate::pack::PackManifestVersionInitialFilesItemSource as Source;

/// Seed the version's `initialFiles` into the instance, first-install-only.
/// Game-agnostic: takes the instance/layout/pack-id directly so both the
/// Minecraft and emulator install paths can call it.
pub async fn seed_initial_files(
    app: &tauri::AppHandle,
    instance: &InstancePaths,
    layout: &Layout,
    pack_id: &str,
    http: &reqwest::Client,
    password: Option<&str>,
    reporter: &Reporter,
    manifest: &PackManifest,
) {
    for file in &manifest.version.initial_files {
        let rel = file.path.as_str().replace('\\', "/");
        let dest = instance.minecraft.join(&rel);

        // First-install-only: an existing path belongs to the player now.
        if dest.exists() {
            reporter.log("info", &format!("«{rel}» ya existe; se conserva."));
            continue;
        }

        let bytes = match fetch_initial_bytes(app, layout, pack_id, http, password, file).await {
            Ok(bytes) => bytes,
            Err(e) => {
                reporter.log("warn", &format!("No se pudo obtener «{rel}»: {e}"));
                continue;
            }
        };

        // Verify against the entry's own hash before writing — the entry pins
        // exactly what should land, the same contract every other file honours.
        let actual = {
            use sha2::{Digest, Sha512};
            let mut hasher = Sha512::new();
            hasher.update(&bytes);
            files::hex(&hasher.finalize())
        };
        if actual != file.sha512.as_str().to_lowercase() {
            reporter.log(
                "warn",
                &format!("«{rel}» está dañado (SHA-512 incorrecto); se omite."),
            );
            continue;
        }

        if let Some(parent) = dest.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        match std::fs::write(&dest, &bytes) {
            Ok(()) => reporter.log("info", &format!("Archivo inicial «{rel}» colocado.")),
            Err(e) => reporter.log("warn", &format!("No se pudo escribir «{rel}»: {e}")),
        }
    }
}

async fn fetch_initial_bytes(
    app: &tauri::AppHandle,
    layout: &Layout,
    pack_id: &str,
    http: &reqwest::Client,
    password: Option<&str>,
    file: &PackManifestVersionInitialFilesItem,
) -> Result<Vec<u8>, String> {
    match &file.source {
        Source::Override { blob_sha512 } => {
            let sha512 = blob_sha512.as_str().to_lowercase();
            // Local packs keep their override bytes only in the local blob store;
            // managed packs stream them through the entitlement-checked proxy —
            // the same split bundled worlds make.
            if pack_id.starts_with("local-") {
                let path = files::local_blob_path(layout, &sha512);
                std::fs::read(&path).map_err(|e| e.to_string())
            } else {
                let pack_file = crate::api::PackFile::Override { sha512 };
                let response =
                    crate::api::fetch_pack_file(app, pack_id, password, &pack_file, None)
                        .await
                        .map_err(|e| format!("{e:?}"))?;
                let bytes = response.bytes().await.map_err(|e| e.to_string())?;
                Ok(bytes.to_vec())
            }
        }
        Source::Url { url } => {
            let res = http.get(url).send().await.map_err(|e| e.to_string())?;
            if !res.status().is_success() {
                return Err(format!("el servidor respondió {}", res.status()));
            }
            let bytes = res.bytes().await.map_err(|e| e.to_string())?;
            Ok(bytes.to_vec())
        }
        // Forbidden for initialFiles by the schema and pack.rs; unreachable in a
        // validated manifest, but never silently write from an unexpected source.
        _ => Err("fuente no permitida para initialFiles".to_string()),
    }
}
