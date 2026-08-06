// The pack manifest, as Rust. The TYPES are generated at build time from
// packages/pack-schema's JSON Schema — see build.rs — so the launcher cannot
// drift from what the dashboard publishes.
//
// The RULES below are hand-written on purpose. JSON Schema cannot express zod
// refinements, so `emit-schema.mjs` silently drops them; anything added to
// PackManifest as a `.superRefine` is invisible to the generated types and must
// be mirrored here. Today that is exactly one rule: duplicate target paths.
//
// If you add a refinement in boffmedia.ts, add it here too — nothing enforces
// that pairing automatically, which is why both files say so.

#![allow(clippy::all)]

include!(concat!(env!("OUT_DIR"), "/pack_schema.rs"));

use std::collections::HashSet;

#[derive(Debug, thiserror::Error)]
pub enum ManifestError {
    #[error("manifest is not valid JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("two files target the same path (case-insensitively): {0}")]
    DuplicatePath(String),
    #[error("file path must be relative to the instance: {0}")]
    AbsolutePath(String),
    #[error("file path must not escape the instance directory: {0}")]
    PathTraversal(String),
    #[error("world folder must be a single path segment: {0}")]
    WorldFolderSegment(String),
    #[error("two bundled worlds target the same save folder (case-insensitively): {0}")]
    DuplicateWorldFolder(String),
    #[error("a minecraft pack must declare dependencies")]
    MissingDependencies,
    #[error("a minecraft pack must not declare an emulator block")]
    UnexpectedEmulator,
    #[error("an emulator pack must not declare minecraft dependencies")]
    UnexpectedDependencies,
    #[error("an emulator pack must declare an emulator block")]
    MissingEmulator,
    #[error("bundled worlds are minecraft-only")]
    WorldsOnEmulatorPack,
    #[error("emulator.{0} must match the path of a files[] entry")]
    EmulatorPathNotInFiles(&'static str),
}

/// The one place the "absent means minecraft" rule is written down on the Rust
/// side. Mirrors `gameTypeOf()` in boffmedia.ts.
pub fn game_type_of(pack: &PackManifestPack) -> PackManifestPackGameType {
    pack.game_type
        .clone()
        .unwrap_or(PackManifestPackGameType::Minecraft)
}

/// Parse and fully validate a manifest — schema-level via serde, plus the
/// refinements the schema cannot carry. Prefer this over `serde_json::from_str`
/// so a manifest can never reach the installer half-checked.
pub fn parse_manifest(raw: &str) -> Result<PackManifest, ManifestError> {
    let manifest: PackManifest = serde_json::from_str(raw)?;
    validate_paths(&manifest)?;
    validate_worlds(&manifest)?;
    validate_game_type(&manifest)?;
    Ok(manifest)
}

/// Mirrors the game-type cross-field rules in boffmedia.ts's `.superRefine`.
/// A minecraft pack (the default when `gameType` is absent) must carry
/// dependencies and nothing emulator; an emulator pack is the inverse, plus its
/// executable/rom must be real `files[]` entries so both arrive hash-verified.
fn validate_game_type(manifest: &PackManifest) -> Result<(), ManifestError> {
    match game_type_of(&manifest.pack) {
        PackManifestPackGameType::Minecraft => {
            if manifest.version.dependencies.is_none() {
                return Err(ManifestError::MissingDependencies);
            }
            if manifest.version.emulator.is_some() {
                return Err(ManifestError::UnexpectedEmulator);
            }
        }
        PackManifestPackGameType::Emulator => {
            if manifest.version.dependencies.is_some() {
                return Err(ManifestError::UnexpectedDependencies);
            }
            if !manifest.version.worlds.is_empty() {
                return Err(ManifestError::WorldsOnEmulatorPack);
            }
            let Some(emulator) = manifest.version.emulator.as_ref() else {
                return Err(ManifestError::MissingEmulator);
            };
            let paths: HashSet<String> = manifest
                .version
                .files
                .iter()
                .map(|f| f.path.to_lowercase().replace('\\', "/"))
                .collect();
            for (field, value) in [
                ("executable", emulator.executable.as_str()),
                ("rom", emulator.rom.as_str()),
            ] {
                if !paths.contains(&value.to_lowercase().replace('\\', "/")) {
                    return Err(ManifestError::EmulatorPathNotInFiles(field));
                }
            }
        }
    }
    Ok(())
}

/// Mirrors the `.superRefine` in packages/pack-schema/src/boffmedia.ts, plus a
/// defence-in-depth re-check of the path rules. The schema does encode those as
/// string patterns, but these values are used to WRITE TO DISK — a second check
/// on the client costs nothing and a compromised or buggy server is exactly the
/// case where it matters.
fn validate_paths(manifest: &PackManifest) -> Result<(), ManifestError> {
    let mut seen: HashSet<String> = HashSet::new();

    for file in &manifest.version.files {
        let path = file.path.as_str();

        if path.starts_with('/') || path.starts_with('\\') {
            return Err(ManifestError::AbsolutePath(path.to_string()));
        }
        // Windows drive-relative paths ("C:..."), which are not caught by a
        // leading-slash test.
        let bytes = path.as_bytes();
        if bytes.len() >= 2 && bytes[1] == b':' && bytes[0].is_ascii_alphabetic() {
            return Err(ManifestError::AbsolutePath(path.to_string()));
        }
        if path.split(['/', '\\']).any(|seg| seg == "..") {
            return Err(ManifestError::PathTraversal(path.to_string()));
        }

        // Case-insensitive: Windows and macOS would silently overwrite one file
        // with the other, while Linux would install both. A pack that installs
        // differently per platform is a pack that cannot be supported.
        let key = path.to_lowercase().replace('\\', "/");
        if !seen.insert(key) {
            return Err(ManifestError::DuplicatePath(path.to_string()));
        }
    }

    Ok(())
}

/// Mirrors the bundled-world refinements in boffmedia.ts. A world's `folder`
/// names a directory we CREATE under `saves/`, so a separator or a `..` here is
/// exactly the traversal we cannot let the extractor act on. Duplicate folders
/// race to write the same save; reject them case-insensitively like file paths.
fn validate_worlds(manifest: &PackManifest) -> Result<(), ManifestError> {
    let mut seen: HashSet<String> = HashSet::new();
    for world in &manifest.version.worlds {
        let folder = world.folder.as_str();

        if folder == "." || folder == ".." || folder.contains('/') || folder.contains('\\') {
            return Err(ManifestError::WorldFolderSegment(folder.to_string()));
        }

        let key = folder.to_lowercase();
        if !seen.insert(key) {
            return Err(ManifestError::DuplicateWorldFolder(folder.to_string()));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // Kept byte-identical in spirit with the vitest fixture in
    // packages/pack-schema/src/pack-schema.test.ts — the same inputs must be
    // rejected on both sides of the boundary.
    fn manifest_json(path: &str, extra: Option<&str>) -> String {
        let second = extra
            .map(|p| {
                format!(
                    r#",{{"path":"{p}","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"modrinth","projectId":"p","versionId":"v"}}}}"#,
                    s = "b".repeat(128)
                )
            })
            .unwrap_or_default();
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4","neoforge":"21.4.30"}},
                  "files":[{{"path":"{path}","sha512":"{s}","fileSize":10,
                    "env":{{"client":"required","server":"required"}},
                    "source":{{"kind":"modrinth","projectId":"p","versionId":"v"}}}}{second}]}}}}"#,
            s = "a".repeat(128)
        )
    }

    #[test]
    fn accepts_a_well_formed_manifest() {
        assert!(parse_manifest(&manifest_json("mods/sodium.jar", None)).is_ok());
    }

    #[test]
    fn rejects_traversal() {
        let err = parse_manifest(&manifest_json("../../etc/passwd", None)).unwrap_err();
        assert!(matches!(err, ManifestError::PathTraversal(_)));
    }

    #[test]
    fn rejects_windows_drive_paths() {
        let err = parse_manifest(&manifest_json("C:/Windows/evil.dll", None)).unwrap_err();
        assert!(matches!(err, ManifestError::AbsolutePath(_)));
    }

    #[test]
    fn rejects_case_only_duplicate_paths() {
        let err =
            parse_manifest(&manifest_json("mods/sodium.jar", Some("mods/Sodium.jar"))).unwrap_err();
        assert!(matches!(err, ManifestError::DuplicatePath(_)));
    }

    fn manifest_with_worlds(worlds_json: &str) -> String {
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4","neoforge":"21.4.30"}},
                  "files":[],
                  "worlds":{worlds_json}}}}}"#
        )
    }

    fn world_entry(folder: &str) -> String {
        format!(
            r#"{{"folder":"{folder}","sizeBytes":10,"sha512":"{s}","source":{{"kind":"override","blobSha512":"{s}"}}}}"#,
            s = "b".repeat(128)
        )
    }

    #[test]
    fn accepts_a_bundled_world() {
        let json = manifest_with_worlds(&format!("[{}]", world_entry("world")));
        assert!(parse_manifest(&json).is_ok());
    }

    #[test]
    fn rejects_world_folder_with_separator() {
        let json = manifest_with_worlds(&format!("[{}]", world_entry("saves/world")));
        // A separator in the folder is rejected by the generated pattern (serde)
        // or, if it slips through, by validate_worlds — either is a rejection.
        assert!(parse_manifest(&json).is_err());
    }

    #[test]
    fn rejects_case_only_duplicate_world_folders() {
        let json = manifest_with_worlds(&format!(
            "[{},{}]",
            world_entry("world"),
            world_entry("World")
        ));
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::DuplicateWorldFolder(_)));
    }

    // Mirrors of the game-type superRefine in boffmedia.ts — same fixtures as
    // the vitest side, same rejections.
    fn emulator_manifest(rom_path: &str) -> String {
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"poke-esmeralda","name":"Esmeralda","access":{{"kind":"public"}},"gameType":"emulator"}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "files":[
                    {{"path":"emulator/mgba.exe","sha512":"{s}","fileSize":10,
                      "env":{{"client":"required","server":"unsupported"}},
                      "source":{{"kind":"url","url":"https://x.test/mgba.exe"}}}},
                    {{"path":"roms/game.gba","sha512":"{s}","fileSize":10,
                      "env":{{"client":"required","server":"unsupported"}},
                      "source":{{"kind":"user-provided","hint":"Pokémon Esmeralda (EUR) .gba"}}}}],
                  "emulator":{{"kind":"mgba","executable":"emulator/mgba.exe","rom":"{rom_path}"}}}}}}"#,
            s = "a".repeat(128)
        )
    }

    #[test]
    fn accepts_an_emulator_manifest_with_a_user_provided_rom() {
        let manifest = parse_manifest(&emulator_manifest("roms/game.gba")).unwrap();
        assert!(matches!(
            game_type_of(&manifest.pack),
            PackManifestPackGameType::Emulator
        ));
    }

    #[test]
    fn rejects_an_emulator_rom_that_is_not_a_files_entry() {
        let err = parse_manifest(&emulator_manifest("roms/other.gba")).unwrap_err();
        assert!(matches!(err, ManifestError::EmulatorPathNotInFiles("rom")));
    }

    #[test]
    fn a_minecraft_manifest_without_dependencies_is_rejected() {
        let json = manifest_json("mods/sodium.jar", None)
            .replace(r#""dependencies":{"minecraft":"1.21.4","neoforge":"21.4.30"},"#, "");
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::MissingDependencies));
    }
}
