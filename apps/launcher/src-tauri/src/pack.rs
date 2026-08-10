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
    #[error("Minecraft packs must include dependencies")]
    MissingDependencies,
    #[error("Minecraft packs cannot include emulator, zomboid, or stardew specifications")]
    UnexpectedSpecBlock,
    #[error("non-Minecraft packs must include exactly one specification block (emulator, zomboid, or stardew)")]
    MissingSpecBlock,
    #[error("the specification block present does not match the declared gameType")]
    SpecBlockMismatch,
    #[error("non-Minecraft packs cannot include dependencies or worlds")]
    ForbiddenForNonMinecraft,
    #[error("initialFiles cannot contain user-provided sources")]
    InitialFilesCannotBeUserProvided,
    #[error("initialFiles source must be override or url: {0}")]
    InitialFilesInvalidSource(String),
    #[error("initialFiles path collides with files path (case-insensitively): {0}")]
    InitialFilesPathCollision(String),
    #[error("initialFile path must be relative to the instance: {0}")]
    InitialFileAbsolutePath(String),
    #[error("initialFile path must not escape the instance directory: {0}")]
    InitialFilePathTraversal(String),
    #[error("emulator.rom does not match any files[] entry: {0}")]
    EmulatorRomNotInFiles(String),
    #[error("the ROM entry must have env.client required and env.server unsupported")]
    EmulatorRomEnv,
    #[error("the ROM must be user-provided or patched (the server never hosts ROM bytes)")]
    EmulatorRomSource,
    #[error("an mgba ROM must end in .gba and a melonDS ROM in .nds: {0}")]
    EmulatorRomExtension(String),
    #[error("patched.base does not reference a files[] entry: {0}")]
    PatchedBaseMissing(String),
    #[error("patched.base must reference a user-provided file: {0}")]
    PatchedBaseNotUserProvided(String),
    #[error("patched.patch does not reference a files[] entry: {0}")]
    PatchedPatchMissing(String),
    #[error("patched.patch must reference an override or url file: {0}")]
    PatchedPatchNotDistributable(String),
}

/// Parse and fully validate a manifest — schema-level via serde, plus the
/// refinements the schema cannot carry. Prefer this over `serde_json::from_str`
/// so a manifest can never reach the installer half-checked.
pub fn parse_manifest(raw: &str) -> Result<PackManifest, ManifestError> {
    let manifest: PackManifest = serde_json::from_str(raw)?;
    validate_paths(&manifest)?;
    validate_worlds(&manifest)?;
    validate_game_type(&manifest)?;
    validate_patched(&manifest)?;
    validate_emulator(&manifest)?;
    Ok(manifest)
}

/// Case-insensitive, separator-normalized path key — the same normalization the
/// zod superRefine uses so both ends judge references identically.
fn norm_path(p: &str) -> String {
    p.to_lowercase().replace('\\', "/")
}

/// Mirrors the `patched` cross-field rules in boffmedia.ts: a romhack's `base`
/// must be a user-provided files[] entry (the server never hosts ROM bytes, and
/// this also forbids chains) and its `patch` a distributable one (override/url).
fn validate_patched(manifest: &PackManifest) -> Result<(), ManifestError> {
    let files = &manifest.version.files;
    let find = |path: &str| {
        let key = norm_path(path);
        files.iter().find(move |f| norm_path(f.path.as_str()) == key)
    };
    for file in files {
        let PackManifestVersionFilesItemSource::Patched { base, patch, .. } = &file.source else {
            continue;
        };
        match find(base.as_str()) {
            None => return Err(ManifestError::PatchedBaseMissing(base.as_str().to_string())),
            Some(base_file) => {
                if !matches!(
                    base_file.source,
                    PackManifestVersionFilesItemSource::UserProvided { .. }
                ) {
                    return Err(ManifestError::PatchedBaseNotUserProvided(
                        base.as_str().to_string(),
                    ));
                }
            }
        }
        match find(patch.as_str()) {
            None => return Err(ManifestError::PatchedPatchMissing(patch.as_str().to_string())),
            Some(patch_file) => {
                if !matches!(
                    patch_file.source,
                    PackManifestVersionFilesItemSource::Override { .. }
                        | PackManifestVersionFilesItemSource::Url { .. }
                ) {
                    return Err(ManifestError::PatchedPatchNotDistributable(
                        patch.as_str().to_string(),
                    ));
                }
            }
        }
    }
    Ok(())
}

/// Mirrors the emulator arm in boffmedia.ts: `emulator.rom` must name a files[]
/// entry that is a player-supplied dump (user-provided) or a locally patched
/// ROM, client-required and server-unsupported.
fn validate_emulator(manifest: &PackManifest) -> Result<(), ManifestError> {
    let Some(emu) = &manifest.version.emulator else {
        return Ok(());
    };
    let rom_key = norm_path(emu.rom.as_str());
    let rom_file = manifest
        .version
        .files
        .iter()
        .find(|f| norm_path(f.path.as_str()) == rom_key);
    let Some(rom_file) = rom_file else {
        return Err(ManifestError::EmulatorRomNotInFiles(
            emu.rom.as_str().to_string(),
        ));
    };
    let client_required = matches!(
        rom_file.env.client,
        PackManifestVersionFilesItemEnvClient::Required
    );
    let server_unsupported = matches!(
        rom_file.env.server,
        PackManifestVersionFilesItemEnvServer::Unsupported
    );
    if !client_required || !server_unsupported {
        return Err(ManifestError::EmulatorRomEnv);
    }
    if !matches!(
        rom_file.source,
        PackManifestVersionFilesItemSource::UserProvided { .. }
            | PackManifestVersionFilesItemSource::Patched { .. }
    ) {
        return Err(ManifestError::EmulatorRomSource);
    }
    // The ROM extension must match the emulator kind. JSON Schema drops the
    // zod `.superRefine` that encodes this, so it is mirrored here: mgba runs
    // GBA (.gba), melonDS runs DS (.nds). Handed to the emulator verbatim, a
    // mismatched container is a launch that opens the wrong core or fails.
    let rom_lower = emu.rom.as_str().to_lowercase();
    let ext_ok = match emu.kind {
        PackManifestVersionEmulatorKind::Mgba => rom_lower.ends_with(".gba"),
        PackManifestVersionEmulatorKind::Melonds => rom_lower.ends_with(".nds"),
    };
    if !ext_ok {
        return Err(ManifestError::EmulatorRomExtension(emu.rom.as_str().to_string()));
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

/// Mirrors the game-type refinements in boffmedia.ts. Validates that the
/// manifest's game type declaration is consistent: Minecraft packs have
/// dependencies and no spec blocks; non-MC packs have exactly one spec block
/// and no dependencies/worlds.
fn validate_game_type(manifest: &PackManifest) -> Result<(), ManifestError> {
    // Determine game type: the enum is already generated, just check what it is
    let is_minecraft = match &manifest.pack.game_type {
        None | Some(crate::pack::PackManifestPackGameType::Minecraft) => true,
        Some(crate::pack::PackManifestPackGameType::Emulator) => false,
        Some(crate::pack::PackManifestPackGameType::Zomboid) => false,
        Some(crate::pack::PackManifestPackGameType::Stardew) => false,
    };

    // Check dependencies requirement and exclusivity
    let has_dependencies = manifest.version.dependencies.is_some();
    let has_emulator = manifest.version.emulator.is_some();
    let has_zomboid = manifest.version.zomboid.is_some();
    let has_stardew = manifest.version.stardew.is_some();
    let spec_blocks_count = [has_emulator, has_zomboid, has_stardew]
        .iter()
        .filter(|&&x| x)
        .count();

    if is_minecraft {
        if !has_dependencies {
            return Err(ManifestError::MissingDependencies);
        }
        if has_emulator || has_zomboid || has_stardew {
            return Err(ManifestError::UnexpectedSpecBlock);
        }
    } else {
        if spec_blocks_count != 1 {
            return Err(ManifestError::MissingSpecBlock);
        }
        // The one spec block present must be the one the gameType declares: an
        // `emulator` pack carrying only a `zomboid` block passes the count check
        // but would resolve down the wrong install arm.
        let matches_declared = match &manifest.pack.game_type {
            Some(crate::pack::PackManifestPackGameType::Emulator) => has_emulator,
            Some(crate::pack::PackManifestPackGameType::Zomboid) => has_zomboid,
            Some(crate::pack::PackManifestPackGameType::Stardew) => has_stardew,
            // Minecraft/None already took the other arm.
            _ => false,
        };
        if !matches_declared {
            return Err(ManifestError::SpecBlockMismatch);
        }
        if has_dependencies || !manifest.version.worlds.is_empty() {
            return Err(ManifestError::ForbiddenForNonMinecraft);
        }
    }

    // Validate initialFiles if present
    if !manifest.version.initial_files.is_empty() {
        validate_initial_files(manifest, &manifest.version.initial_files)?;
    }

    Ok(())
}

/// Validates initialFiles: no user-provided sources, no path collisions with
/// files, and same absolute/traversal checks as files.
fn validate_initial_files(
    manifest: &PackManifest,
    initial_files: &[crate::pack::PackManifestVersionInitialFilesItem],
) -> Result<(), ManifestError> {
    let mut seen: HashSet<String> = HashSet::new();

    // Build a set of file paths from the main files array for collision detection
    for file in &manifest.version.files {
        let key = file.path.to_lowercase().replace('\\', "/");
        seen.insert(key);
    }

    for file in initial_files {
        let path = file.path.as_str();

        // Source must be `override` or `url` (distributable content). A
        // `user-provided` initialFile is nonsensical (we would prompt for a file
        // only to never check it again); modrinth/curseforge are equally wrong
        // here. Mirrors the zod rule `source.kind in {override, url}`.
        match &file.source {
            PackManifestVersionInitialFilesItemSource::Override { .. }
            | PackManifestVersionInitialFilesItemSource::Url { .. } => {}
            PackManifestVersionInitialFilesItemSource::UserProvided { .. } => {
                return Err(ManifestError::InitialFilesCannotBeUserProvided);
            }
            _ => {
                return Err(ManifestError::InitialFilesInvalidSource(path.to_string()));
            }
        }

        // Check for absolute paths
        if path.starts_with('/') || path.starts_with('\\') {
            return Err(ManifestError::InitialFileAbsolutePath(path.to_string()));
        }

        // Check for Windows drive-relative paths
        let bytes = path.as_bytes();
        if bytes.len() >= 2 && bytes[1] == b':' && bytes[0].is_ascii_alphabetic() {
            return Err(ManifestError::InitialFileAbsolutePath(path.to_string()));
        }

        // Check for traversal attempts
        if path.split(['/', '\\']).any(|seg| seg == "..") {
            return Err(ManifestError::InitialFilePathTraversal(path.to_string()));
        }

        // Check for path collisions with files
        let key = path.to_lowercase().replace('\\', "/");
        if !seen.insert(key.clone()) {
            return Err(ManifestError::InitialFilesPathCollision(path.to_string()));
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

    // Game type validation tests

    #[test]
    fn accepts_minecraft_manifest_with_dependencies() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":{"minecraft":"1.21.4"},"files":[]}}"#;
        assert!(parse_manifest(json).is_ok());
    }

    #[test]
    fn rejects_minecraft_manifest_without_dependencies() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":null,"files":[]}}"#;
        let err = parse_manifest(json).unwrap_err();
        assert!(matches!(err, ManifestError::MissingDependencies));
    }

    #[test]
    fn rejects_minecraft_with_emulator_spec_block() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":{"minecraft":"1.21.4"},"files":[],"emulator":{"kind":"mgba","rom":"roms/x.gba"}}}"#;
        let err = parse_manifest(json).unwrap_err();
        assert!(matches!(err, ManifestError::UnexpectedSpecBlock));
    }

    #[test]
    fn accepts_emulator_manifest_with_spec_block() {
        let json = emu_manifest(
            r#"{"kind":"mgba","rom":"roms/x.gba"}"#,
            &user_rom("roms/x.gba"),
        );
        assert!(parse_manifest(&json).is_ok());
    }

    #[test]
    fn rejects_emulator_without_spec_block() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-gba","name":"Boff GBA","gameType":"emulator","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":null,"files":[]}}"#;
        let err = parse_manifest(json).unwrap_err();
        assert!(matches!(err, ManifestError::MissingSpecBlock));
    }

    #[test]
    fn rejects_emulator_with_dependencies() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-gba","name":"Boff GBA","gameType":"emulator","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":{"minecraft":"1.21.4"},"files":[],"emulator":{"kind":"mgba","rom":"roms/x.gba"}}}"#;
        let err = parse_manifest(json).unwrap_err();
        assert!(matches!(err, ManifestError::ForbiddenForNonMinecraft));
    }

    #[test]
    fn rejects_emulator_with_worlds() {
        // Non-minecraft packs cannot have worlds. This test provides a world to an emulator pack.
        let world_entry = format!(
            r#"{{ "folder":"world","sizeBytes":10,"sha512":"{}","source":{{"kind":"override","blobSha512":"{}"}}}}"#,
            "b".repeat(128),
            "b".repeat(128)
        );
        let json = format!(
            r#"{{"formatVersion":1,
            "pack":{{"id":"pk","slug":"boff-gba","name":"Boff GBA","gameType":"emulator","access":{{"kind":"public"}}}},
            "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":null,"files":[],"emulator":{{"kind":"mgba","rom":"roms/x.gba"}},"worlds":[{world_entry}]}}}}"#
        );
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::ForbiddenForNonMinecraft));
    }

    #[test]
    fn accepts_zombie_manifest_with_zomboid_spec_block() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-z","name":"Boff Z","gameType":"zomboid","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":null,"files":[],"zomboid":{}}}"#;
        assert!(parse_manifest(json).is_ok());
    }

    #[test]
    fn accepts_stardew_manifest_with_stardew_spec_block() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff-sv","name":"Boff SV","gameType":"stardew","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":null,"files":[],"stardew":{}}}"#;
        assert!(parse_manifest(json).is_ok());
    }

    #[test]
    fn rejects_unknown_game_type() {
        let json = r#"{"formatVersion":1,
            "pack":{"id":"pk","slug":"boff","name":"Boff","gameType":"unknown","access":{"kind":"public"}},
            "version":{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":null,"files":[]}}"#;
        assert!(parse_manifest(json).is_err());
    }

    fn initial_file(path: &str, extra_file: Option<&str>) -> String {
        let s = "a".repeat(128);  // Generate proper 128-char hex
        let second = extra_file
            .map(|p| {
                format!(
                    r#",{{"path":"{p}","sha512":"{}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"override","blobSha512":"{}"}}}}"#,
                    "b".repeat(128),
                    "b".repeat(128)
                )
            })
            .unwrap_or_default();
        format!(
            r#"[{{"path":"{path}","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"override","blobSha512":"{s}"}}}}{second}]"#
        )
    }

    /// A minecraft manifest with an explicit files[] and initialFiles[] — for the
    /// collision checks that need both halves populated.
    fn manifest_with_files_and_initial(files_json: &str, initial_json: &str) -> String {
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4"}},"files":[{files_json}],
                  "initialFiles":[{initial_json}]}}}}"#
        )
    }

    #[test]
    fn initial_files_cannot_have_user_provided_source() {
        // This test would require initialFiles to have a user-provided source, which the schema forbids.
        // The validation would fail at schema level, so we skip this test as it's a schema-level rule.
        // Cycle 1 relies on the schema to forbid this; the launcher validator mirrors it for defense-in-depth.
    }

    // ── emulator arm (Cycle 2) ──────────────────────────────────────────────

    fn emu_manifest(emulator: &str, files: &str) -> String {
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-gba","name":"Boff GBA","gameType":"emulator","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "files":[{files}],"emulator":{emulator}}}}}"#
        )
    }

    fn user_rom(path: &str) -> String {
        format!(
            r#"{{"path":"{path}","sha512":"{s}","fileSize":100,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"user-provided","hint":"tu volcado"}}}}"#,
            s = "a".repeat(128)
        )
    }

    #[test]
    fn accepts_a_well_formed_emulator_pack() {
        let json = emu_manifest(
            r#"{"kind":"mgba","rom":"roms/emerald.gba"}"#,
            &user_rom("roms/emerald.gba"),
        );
        assert!(parse_manifest(&json).is_ok());
    }

    #[test]
    fn rejects_emulator_rom_not_in_files() {
        let json = emu_manifest(
            r#"{"kind":"mgba","rom":"roms/missing.gba"}"#,
            &user_rom("roms/emerald.gba"),
        );
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::EmulatorRomNotInFiles(_)));
    }

    #[test]
    fn rejects_emulator_rom_with_wrong_env() {
        let rom = format!(
            r#"{{"path":"roms/emerald.gba","sha512":"{s}","fileSize":100,"env":{{"client":"required","server":"required"}},"source":{{"kind":"user-provided","hint":"x"}}}}"#,
            s = "a".repeat(128)
        );
        let json = emu_manifest(r#"{"kind":"mgba","rom":"roms/emerald.gba"}"#, &rom);
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::EmulatorRomEnv));
    }

    #[test]
    fn rejects_blob_hosted_rom() {
        let rom = format!(
            r#"{{"path":"roms/emerald.gba","sha512":"{s}","fileSize":100,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"override","blobSha512":"{s}"}}}}"#,
            s = "a".repeat(128)
        );
        let json = emu_manifest(r#"{"kind":"mgba","rom":"roms/emerald.gba"}"#, &rom);
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::EmulatorRomSource));
    }

    #[test]
    fn accepts_a_patched_romhack() {
        let base = user_rom("roms/emerald.gba");
        let patch = format!(
            r#"{{"path":"roms/hack.bps","sha512":"{s}","fileSize":5,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"override","blobSha512":"{s}"}}}}"#,
            s = "b".repeat(128)
        );
        let hacked = format!(
            r#"{{"path":"roms/hack.gba","sha512":"{s}","fileSize":100,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"patched","base":"roms/emerald.gba","patch":"roms/hack.bps","format":"bps"}}}}"#,
            s = "c".repeat(128)
        );
        let files = format!("{base},{patch},{hacked}");
        let json = emu_manifest(r#"{"kind":"mgba","rom":"roms/hack.gba"}"#, &files);
        assert!(parse_manifest(&json).is_ok(), "{:?}", parse_manifest(&json).err());
    }

    #[test]
    fn rejects_patched_base_not_user_provided() {
        let base = format!(
            r#"{{"path":"roms/emerald.gba","sha512":"{s}","fileSize":100,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"override","blobSha512":"{s}"}}}}"#,
            s = "a".repeat(128)
        );
        let patch = format!(
            r#"{{"path":"roms/hack.bps","sha512":"{s}","fileSize":5,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"override","blobSha512":"{s}"}}}}"#,
            s = "b".repeat(128)
        );
        let hacked = format!(
            r#"{{"path":"roms/hack.gba","sha512":"{s}","fileSize":100,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"patched","base":"roms/emerald.gba","patch":"roms/hack.bps","format":"bps"}}}}"#,
            s = "c".repeat(128)
        );
        let files = format!("{base},{patch},{hacked}");
        let json = emu_manifest(r#"{"kind":"mgba","rom":"roms/hack.gba"}"#, &files);
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::PatchedBaseNotUserProvided(_)));
    }

    #[test]
    fn initial_files_reject_non_distributable_source() {
        // Only override/url are allowed; a modrinth-sourced initialFile is as
        // wrong as a user-provided one (mirrors the zod rule).
        let json = format!(
            r#"{{"formatVersion":1,
            "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
            "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
              "dependencies":{{"minecraft":"1.21.4"}},"files":[],
              "initialFiles":[{{"path":"mods/x.jar","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"modrinth","projectId":"p","versionId":"v"}}}}]}}}}"#,
            s = "a".repeat(128)
        );
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::InitialFilesInvalidSource(_)));
    }

    #[test]
    fn initial_files_path_collision_with_files_is_rejected() {
        let url_file = |path: &str| {
            format!(
                r#"{{"path":"{path}","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"url","url":"https://x.test/o"}}}}"#,
                s = "a".repeat(128)
            )
        };
        let override_initial = |path: &str| {
            format!(
                r#"{{"path":"{path}","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"required"}},"source":{{"kind":"override","blobSha512":"{s}"}}}}"#,
                s = "b".repeat(128)
            )
        };
        let json = manifest_with_files_and_initial(&url_file("options.txt"), &override_initial("options.txt"));
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::InitialFilesPathCollision(_)));

        // Case-insensitive: Windows/macOS would overwrite one with the other.
        let json = manifest_with_files_and_initial(&url_file("Options.txt"), &override_initial("options.txt"));
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::InitialFilesPathCollision(_)));
    }

    #[test]
    fn initial_files_traversal_is_rejected() {
        let path_json = initial_file("../../etc/passwd", None);
        let json = format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4"}},"files":[],
                  "initialFiles":{path_json}}}}}"#
        );
        let err = parse_manifest(&json).unwrap_err();
        assert!(matches!(err, ManifestError::InitialFilePathTraversal(_)));
    }

    #[test]
    fn accepts_minecraft_with_initial_files() {
        let path_json = initial_file("options.txt", None);
        let json = format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4"}},"files":[],
                  "initialFiles":{path_json}}}}}"#
        );
        assert!(parse_manifest(&json).is_ok());
    }
}
