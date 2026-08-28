// The pack manifest, as Rust. The TYPES are generated at build time from
// packages/pack-schema's JSON Schema — see build.rs — so the launcher cannot
// drift from what the dashboard publishes.
//
// The RULES below are hand-written on purpose. JSON Schema cannot express zod
// refinements, so `emit-schema.mjs` silently drops them; anything added to
// PackManifest as a `.superRefine` is invisible to the generated types and must
// be mirrored here: duplicate target paths, the bundled-world folder rules, the
// game-type exclusivity engine, `patched`, the emulator arm, `initialFiles`, the
// `runtime` block's JVM-argument allowlist, and the nine optional-content rules
// in `validate_optional`.
//
// If you add a refinement in boffmedia.ts, add it here too — nothing enforces
// that pairing automatically, which is why both files say so.

#![allow(clippy::all)]

include!(concat!(env!("OUT_DIR"), "/pack_schema.rs"));

use std::collections::{HashMap, HashSet};

/// The group id `optionalModelOf` uses for the synthesised group of optional
/// files no feature claims (D4). Reserved: an authored group by that name would
/// be indistinguishable from a fold-in. Kept in step with `SYNTHETIC_GROUP_ID`
/// in packages/pack-schema/src/boffmedia.ts.
const SYNTHETIC_GROUP_ID: &str = "otros";

/// Directory prefixes a global datapack loader reads (D1). `saves/<world>/
/// datapacks/` does not exist until the world does and a player creates worlds
/// whenever they like, so a per-world copy could only ever cover the worlds that
/// existed at install time. Kept in step with `DATAPACK_LOADER_DIRS` in
/// boffmedia.ts.
const DATAPACK_LOADER_DIRS: [&str; 2] = ["config/openloader/datapacks/", "config/paxi/datapacks/"];

/// Shorter local name for the generated select enum, which is otherwise 45
/// characters of path in every match arm.
type OptionalSelect = PackManifestVersionOptionalGroupsItemSelect;

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
    #[error("`runtime` is minecraft-only — there is no JVM to configure")]
    RuntimeNotMinecraft,
    #[error("runtime.jvmArgs rejected: {0} ({1})")]
    RuntimeJvmArg(String, &'static str),
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
    #[error("\"otros\" is reserved for unclaimed optional files: {0}")]
    ReservedGroupId(String),
    #[error("two optional groups share an id: {0}")]
    DuplicateGroupId(String),
    #[error("two optional features share an id: {0}")]
    DuplicateFeatureId(String),
    #[error("a feature path does not match any files[] entry: {0}")]
    FeaturePathNotInFiles(String),
    #[error("a feature path must be env.client \"optional\": {0}")]
    FeaturePathNotOptional(String),
    #[error("two features own the same path: {0}")]
    FeaturePathOwnedTwice(String),
    #[error("group \"{0}\" declares the wrong number of default:true features for its select mode")]
    GroupDefaultCount(String),
    #[error("activate.file must be one of the feature's own paths: {0}")]
    ActivateFileNotOwned(String),
    #[error("a shaderpack activation needs a \"one\" or \"atMostOne\" group: {0}")]
    ShaderpackInAnyGroup(String),
    #[error("a datapack must sit under a global loader directory: {0}")]
    DatapackOutsideLoaderDir(String),
    #[error("a feature cannot require itself: {0}")]
    RequiresSelf(String),
    #[error("requires names a feature that does not exist: {0}")]
    RequiresUnknownFeature(String),
    #[error("requires may only target a feature in an \"any\" group: {0}")]
    RequiresRadioMember(String),
    #[error("requires forms a cycle through: {0}")]
    RequiresCycle(String),
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
    validate_optional(&manifest)?;
    validate_runtime(&manifest)?;
    Ok(manifest)
}

/// Mirrors the `runtime` refinements in boffmedia.ts: the block is Minecraft-only
/// (an emulator pack has no JVM), and every `jvmArgs` entry must pass the same
/// allowlist the dashboard applies at publish time.
///
/// This is a REJECTION, not a filter. `runtime::seed_from_pack` also sanitizes
/// and merely drops what it cannot accept, and the two are not redundant: this
/// refuses a manifest that should never have been published, while the seed path
/// tolerates one published before a rule existed. A pack that fails here does
/// not install at all, which is the correct answer for a manifest our own
/// dashboard would refuse to emit.
fn validate_runtime(manifest: &PackManifest) -> Result<(), ManifestError> {
    let runtime = match manifest.version.runtime.as_ref() {
        Some(rt) => rt,
        None => return Ok(()),
    };
    let is_minecraft = matches!(
        &manifest.pack.game_type,
        None | Some(PackManifestPackGameType::Minecraft)
    );
    if !is_minecraft {
        return Err(ManifestError::RuntimeNotMinecraft);
    }
    for arg in &runtime.jvm_args {
        if let Err((arg, why)) = crate::install::jvm_args::judge(arg.as_str()) {
            return Err(ManifestError::RuntimeJvmArg(arg, why.reason()));
        }
    }
    Ok(())
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

/// Mirrors the optional-content refinements in boffmedia.ts — all nine of them.
///
/// This is the highest-risk mirror in the file and worth saying why: the OTHER
/// validators here are defence in depth, re-checking something the JSON Schema
/// also encodes as a pattern or a required field. These nine are not. JSON
/// Schema cannot express any of them, so `emit-schema.mjs` drops them and the
/// generated types below carry no trace. If this function is wrong, the launcher
/// installs a pack the dashboard would have refused, and nothing anywhere says
/// so. The vitest suite in packages/pack-schema and the tests at the bottom of
/// this file are deliberately case-for-case identical for that reason.
///
/// The rule numbers match the comments in boffmedia.ts's superRefine.
fn validate_optional(manifest: &PackManifest) -> Result<(), ManifestError> {
    let groups = &manifest.version.optional_groups;
    if groups.is_empty() {
        return Ok(());
    }

    let mut group_ids: HashSet<String> = HashSet::new();
    // path -> "groupId/featureId" of the feature that already claims it.
    let mut path_owner: HashMap<String, String> = HashMap::new();
    // featureId -> the select mode of its group; also the existence check for
    // `requires`.
    let mut feature_select: HashMap<String, OptionalSelect> = HashMap::new();
    let mut feature_requires: HashMap<String, Vec<String>> = HashMap::new();
    // Insertion order, so a cycle is always reported over the same features in
    // the same order regardless of HashMap iteration order.
    let mut feature_order: Vec<String> = Vec::new();

    let files: HashMap<String, &PackManifestVersionFilesItem> = manifest
        .version
        .files
        .iter()
        .map(|f| (norm_path(f.path.as_str()), f))
        .collect();

    for group in groups {
        let group_id = group.id.as_str();
        let select = group.select.clone().unwrap_or(OptionalSelect::Any);

        // Rule 3a: unique group ids, and `otros` reserved for the group
        // `optionalModelOf` synthesises out of unclaimed optional files.
        if group_id == SYNTHETIC_GROUP_ID {
            return Err(ManifestError::ReservedGroupId(group_id.to_string()));
        }
        if !group_ids.insert(group_id.to_string()) {
            return Err(ManifestError::DuplicateGroupId(group_id.to_string()));
        }

        // Rule 6: a radio group needs exactly one default on; `atMostOne` at
        // most one. Two defaults in a `one` group have no correct resolution.
        let defaults_on = group.features.iter().filter(|f| f.default).count();
        match select {
            OptionalSelect::One if defaults_on != 1 => {
                return Err(ManifestError::GroupDefaultCount(group_id.to_string()));
            }
            OptionalSelect::AtMostOne if defaults_on > 1 => {
                return Err(ManifestError::GroupDefaultCount(group_id.to_string()));
            }
            _ => {}
        }

        for feature in &group.features {
            let feature_id = feature.id.as_str();

            // Rule 3b: feature ids are unique across the WHOLE version, not per
            // group — the player's stored state is a flat set of feature ids, so
            // two groups sharing one id would share one switch.
            if feature_select.contains_key(feature_id) {
                return Err(ManifestError::DuplicateFeatureId(feature_id.to_string()));
            }
            feature_select.insert(feature_id.to_string(), select.clone());
            feature_requires.insert(
                feature_id.to_string(),
                feature.requires.iter().map(|r| r.as_str().to_string()).collect(),
            );
            feature_order.push(feature_id.to_string());

            for path in &feature.paths {
                let key = norm_path(path.as_str());

                // Rule 1: the path is a real files[] entry — a feature owning a
                // path that does not exist is a switch wired to nothing.
                let Some(file) = files.get(&key) else {
                    return Err(ManifestError::FeaturePathNotInFiles(path.as_str().to_string()));
                };
                // Rule 2: keeps the .mrpack view honest. Prism and packwiz read
                // env.client and nothing else, so a file we let the player skip
                // while calling it "required" installs differently depending on
                // which launcher opened the pack.
                if !matches!(file.env.client, PackManifestVersionFilesItemEnvClient::Optional) {
                    return Err(ManifestError::FeaturePathNotOptional(
                        path.as_str().to_string(),
                    ));
                }

                // Rule 4: one owner per path. Two features owning one jar cannot
                // both be honoured — switching either off parks the other's file.
                if let Some(owner) = path_owner.get(&key) {
                    return Err(ManifestError::FeaturePathOwnedTwice(format!(
                        "{} (already owned by {owner})",
                        path.as_str()
                    )));
                }
                path_owner.insert(key, format!("{group_id}/{feature_id}"));
            }

            if let Some(activate) = &feature.activate {
                let (kind, file) = match activate {
                    PackManifestVersionOptionalGroupsItemFeaturesItemActivate::Resourcepack {
                        file,
                        ..
                    } => ("resourcepack", file.as_str()),
                    PackManifestVersionOptionalGroupsItemFeaturesItemActivate::Shaderpack {
                        file,
                    } => ("shaderpack", file.as_str()),
                    PackManifestVersionOptionalGroupsItemFeaturesItemActivate::Datapack {
                        file,
                    } => ("datapack", file.as_str()),
                };
                let activate_key = norm_path(file);

                // Rule 7: you may only activate what you own. Naming a file
                // another feature can switch off means writing a config that
                // points at a file that is not there.
                if !feature
                    .paths
                    .iter()
                    .any(|p| norm_path(p.as_str()) == activate_key)
                {
                    return Err(ManifestError::ActivateFileNotOwned(file.to_string()));
                }

                // Rule 8: iris.properties/oculus.properties hold ONE shaderPack
                // value, so an `any` group would be offering a choice the game
                // cannot honour and the launcher would have to pick a winner.
                if kind == "shaderpack" && matches!(select, OptionalSelect::Any) {
                    return Err(ManifestError::ShaderpackInAnyGroup(group_id.to_string()));
                }

                // Rule 9 (D1): a datapack reaches the game through a global
                // loader, so its path has to be where that loader looks.
                // Anywhere else and the file is downloaded, verified, and never
                // read by anything.
                if kind == "datapack"
                    && !DATAPACK_LOADER_DIRS
                        .iter()
                        .any(|dir| activate_key.starts_with(dir))
                {
                    return Err(ManifestError::DatapackOutsideLoaderDir(file.to_string()));
                }
            }
        }
    }

    // Rule 5: `requires` must resolve, must not self-reference, and must target
    // an `any` group. A second pass so a feature may require one declared later
    // in the document — position in the file should not be a rule.
    for feature_id in &feature_order {
        for req in &feature_requires[feature_id] {
            if req == feature_id {
                return Err(ManifestError::RequiresSelf(req.clone()));
            }
            let Some(target_select) = feature_select.get(req) else {
                return Err(ManifestError::RequiresUnknownFeature(req.clone()));
            };
            // A dependency is a force-on. Forcing on a member of a radio group
            // either turns a second member on or silently turns off the player's
            // choice; an author cannot have meant either.
            if !matches!(target_select, OptionalSelect::Any) {
                return Err(ManifestError::RequiresRadioMember(req.clone()));
            }
        }
    }

    // Cycle detection. Iterative DFS with three-colour marking — the graph is
    // tiny (<= 32 groups x 64 features) but recursion over a hostile manifest is
    // not an acceptable failure mode on the client.
    #[derive(Clone, Copy, PartialEq)]
    enum Mark {
        White,
        Grey,
        Black,
    }
    let mut mark: HashMap<&str, Mark> = HashMap::new();
    for start in &feature_order {
        if mark.get(start.as_str()).copied().unwrap_or(Mark::White) != Mark::White {
            continue;
        }
        let mut stack: Vec<(&str, usize)> = vec![(start.as_str(), 0)];
        mark.insert(start.as_str(), Mark::Grey);
        while let Some(&mut (id, ref mut next)) = stack.last_mut() {
            let deps = &feature_requires[id];
            if *next >= deps.len() {
                mark.insert(id, Mark::Black);
                stack.pop();
                continue;
            }
            let dep = deps[*next].as_str();
            *next += 1;
            // Unknown targets were already rejected by rule 5 above.
            match mark.get(dep).copied().unwrap_or(Mark::White) {
                Mark::Grey => return Err(ManifestError::RequiresCycle(dep.to_string())),
                Mark::White => {
                    mark.insert(dep, Mark::Grey);
                    stack.push((dep, 0));
                }
                Mark::Black => {}
            }
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

    fn manifest_with_runtime(runtime_json: &str, game_type: Option<&str>) -> String {
        let (gt, deps, spec) = match game_type {
            None => (String::new(), r#""dependencies":{"minecraft":"1.21.4","neoforge":"21.4.30"},"#.to_string(), String::new()),
            Some(kind) => (
                format!(r#","gameType":"{kind}""#),
                String::new(),
                r#""emulator":{"kind":"mgba","rom":"roms/x.gba"},"#.to_string(),
            ),
        };
        let files = match game_type {
            None => String::new(),
            Some(_) => format!(
                r#"{{"path":"roms/x.gba","sha512":"{s}","fileSize":10,"env":{{"client":"required","server":"unsupported"}},"source":{{"kind":"user-provided","hint":"Tu ROM"}}}}"#,
                s = "a".repeat(128)
            ),
        };
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}{gt}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  {deps}{spec}
                  "files":[{files}],
                  "runtime":{runtime_json}}}}}"#
        )
    }

    #[test]
    fn accepts_a_runtime_block_of_real_tuning_flags() {
        let m = manifest_with_runtime(
            r#"{"memoryMib":8192,"jvmArgs":["-XX:+UseG1GC","-Xms2G","--add-opens=java.base/java.lang=ALL-UNNAMED"]}"#,
            None,
        );
        let parsed = parse_manifest(&m).expect("should parse");
        let runtime = parsed.version.runtime.expect("runtime present");
        assert_eq!(runtime.memory_mib, Some(8192));
        assert_eq!(runtime.jvm_args.len(), 3);
    }

    #[test]
    fn rejects_a_manifest_whose_runtime_smuggles_an_agent() {
        // The generated types cannot express this — emit-schema.mjs drops zod
        // refinements — so if this test fails, validate_runtime stopped running.
        let m = manifest_with_runtime(r#"{"jvmArgs":["-javaagent:evil.jar"]}"#, None);
        let err = parse_manifest(&m).unwrap_err();
        assert!(matches!(err, ManifestError::RuntimeJvmArg(_, _)), "{err:?}");
    }

    #[test]
    fn rejects_a_runtime_that_sets_the_heap_through_jvm_args() {
        let m = manifest_with_runtime(r#"{"jvmArgs":["-Xmx8G"]}"#, None);
        match parse_manifest(&m).unwrap_err() {
            ManifestError::RuntimeJvmArg(arg, _) => assert_eq!(arg, "-Xmx8G"),
            other => panic!("expected RuntimeJvmArg, got {other:?}"),
        }
    }

    #[test]
    fn rejects_a_runtime_block_on_a_non_minecraft_pack() {
        let m = manifest_with_runtime(r#"{"memoryMib":4096}"#, Some("emulator"));
        let err = parse_manifest(&m).unwrap_err();
        assert!(matches!(err, ManifestError::RuntimeNotMinecraft), "{err:?}");
    }

    #[test]
    fn a_manifest_without_a_runtime_block_still_parses() {
        assert!(parse_manifest(&manifest_json("mods/sodium.jar", None))
            .unwrap()
            .version
            .runtime
            .is_none());
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
        // Not exercised here: initialFiles with a user-provided source is
        // forbidden by the schema, so validation fails before this validator
        // ever sees it. The validator mirrors the rule for defence in depth.
    }

    // ── emulator arm ────────────────────────────────────────────────────────

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

    // ---- optional content ----
    //
    // The twin of the `describe("optional content")` block in
    // packages/pack-schema/src/pack-schema.test.ts. The nine rules exist in two
    // hand-written copies because JSON Schema cannot carry refinements; these
    // fixtures are the only thing that keeps the copies from drifting. A rule
    // added on one side needs a test added on BOTH.

    /// `mods/sodium.jar` (required) plus the named optional files, then whatever
    /// `groups` JSON the caller wants under `optionalGroups`.
    fn optional_manifest(optional_paths: &[&str], groups: &str) -> String {
        let files: String = optional_paths
            .iter()
            .map(|p| {
                format!(
                    r#",{{"path":"{p}","sha512":"{s}","fileSize":10,"env":{{"client":"optional","server":"unsupported"}},"source":{{"kind":"url","url":"https://example.com/f"}}}}"#,
                    s = "b".repeat(128)
                )
            })
            .collect();
        format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"1.21.4","neoforge":"21.4.30"}},
                  "optionalGroups":{groups},
                  "files":[{{"path":"mods/sodium.jar","sha512":"{s}","fileSize":10,
                    "env":{{"client":"required","server":"required"}},
                    "source":{{"kind":"modrinth","projectId":"p","versionId":"v"}}}}{files}]}}}}"#,
            s = "a".repeat(128)
        )
    }

    const IRIS_GROUP: &str = r#"[{"id":"rendimiento","name":"Rendimiento","select":"any",
        "features":[{"id":"iris","name":"Iris","paths":["mods/iris.jar"],"default":true}]}]"#;

    #[test]
    fn accepts_a_well_formed_optional_group() {
        assert!(parse_manifest(&optional_manifest(&["mods/iris.jar"], IRIS_GROUP)).is_ok());
    }

    #[test]
    fn accepts_a_group_with_select_omitted() {
        // `select` is optional in the schema and defaults to `any` through
        // selectOf/unwrap_or — a manifest that leaves it out must still parse.
        let groups = r#"[{"id":"g","name":"G",
            "features":[{"id":"iris","name":"Iris","paths":["mods/iris.jar"],"default":true}]}]"#;
        assert!(parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).is_ok());
    }

    #[test]
    fn accepts_a_manifest_with_no_optional_groups_at_all() {
        // Back-compat: every manifest authored before this feature existed.
        assert!(parse_manifest(&manifest_json("mods/sodium.jar", None)).is_ok());
    }

    // ---- rule 1 ----
    #[test]
    fn rejects_a_feature_path_that_is_not_a_file() {
        let groups = r#"[{"id":"g","name":"G",
            "features":[{"id":"f","name":"F","paths":["mods/ghost.jar"],"default":true}]}]"#;
        let err = parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::FeaturePathNotInFiles(_)));
    }

    // ---- rule 2 ----
    #[test]
    fn rejects_a_feature_path_that_is_not_env_optional() {
        let groups = r#"[{"id":"g","name":"G",
            "features":[{"id":"f","name":"F","paths":["mods/sodium.jar"],"default":true}]}]"#;
        let err = parse_manifest(&optional_manifest(&[], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::FeaturePathNotOptional(_)));
    }

    // ---- rule 3 ----
    #[test]
    fn rejects_duplicate_group_ids() {
        let groups = r#"[
            {"id":"g","name":"G","features":[{"id":"a","name":"A","paths":["mods/iris.jar"],"default":true}]},
            {"id":"g","name":"G2","features":[{"id":"b","name":"B","paths":["mods/extra.jar"],"default":true}]}]"#;
        let err =
            parse_manifest(&optional_manifest(&["mods/iris.jar", "mods/extra.jar"], groups))
                .unwrap_err();
        assert!(matches!(err, ManifestError::DuplicateGroupId(_)));
    }

    #[test]
    fn rejects_a_feature_id_reused_across_groups() {
        let groups = r#"[
            {"id":"g1","name":"G","features":[{"id":"a","name":"A","paths":["mods/iris.jar"],"default":true}]},
            {"id":"g2","name":"G2","features":[{"id":"a","name":"A2","paths":["mods/extra.jar"],"default":true}]}]"#;
        let err =
            parse_manifest(&optional_manifest(&["mods/iris.jar", "mods/extra.jar"], groups))
                .unwrap_err();
        assert!(matches!(err, ManifestError::DuplicateFeatureId(_)));
    }

    #[test]
    fn rejects_the_reserved_synthetic_group_id() {
        let groups = r#"[{"id":"otros","name":"Otros",
            "features":[{"id":"f","name":"F","paths":["mods/iris.jar"],"default":true}]}]"#;
        let err = parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::ReservedGroupId(_)));
    }

    // ---- rule 4 ----
    #[test]
    fn rejects_one_path_owned_by_two_features() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":true},
            {"id":"b","name":"B","paths":["mods/iris.jar"],"default":false}]}]"#;
        let err = parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::FeaturePathOwnedTwice(_)));
    }

    // ---- rule 5 ----
    #[test]
    fn rejects_requires_naming_an_unknown_feature() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":true,"requires":["nope"]}]}]"#;
        let err = parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::RequiresUnknownFeature(_)));
    }

    #[test]
    fn accepts_requires_pointing_forward_in_the_document() {
        // Position in the file must not be a rule — hence the second pass.
        let groups = r#"[
            {"id":"g1","name":"G","features":[{"id":"a","name":"A","paths":["mods/iris.jar"],"default":true,"requires":["b"]}]},
            {"id":"g2","name":"G2","features":[{"id":"b","name":"B","paths":["mods/extra.jar"],"default":true}]}]"#;
        assert!(
            parse_manifest(&optional_manifest(&["mods/iris.jar", "mods/extra.jar"], groups))
                .is_ok()
        );
    }

    #[test]
    fn rejects_requires_targeting_a_radio_group_member() {
        let groups = r#"[
            {"id":"g1","name":"G","features":[{"id":"a","name":"A","paths":["mods/iris.jar"],"default":true,"requires":["b"]}]},
            {"id":"g2","name":"G2","select":"one","features":[{"id":"b","name":"B","paths":["mods/extra.jar"],"default":true}]}]"#;
        let err =
            parse_manifest(&optional_manifest(&["mods/iris.jar", "mods/extra.jar"], groups))
                .unwrap_err();
        assert!(matches!(err, ManifestError::RequiresRadioMember(_)));
    }

    #[test]
    fn rejects_a_self_requirement() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":true,"requires":["a"]}]}]"#;
        let err = parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::RequiresSelf(_)));
    }

    #[test]
    fn rejects_a_requires_cycle() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":true,"requires":["b"]},
            {"id":"b","name":"B","paths":["mods/extra.jar"],"default":true,"requires":["a"]}]}]"#;
        let err =
            parse_manifest(&optional_manifest(&["mods/iris.jar", "mods/extra.jar"], groups))
                .unwrap_err();
        assert!(matches!(err, ManifestError::RequiresCycle(_)));
    }

    // ---- rule 6 ----
    #[test]
    fn rejects_two_defaults_in_a_one_group() {
        let groups = r#"[{"id":"g","name":"G","select":"one","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":true},
            {"id":"b","name":"B","paths":["mods/extra.jar"],"default":true}]}]"#;
        let err =
            parse_manifest(&optional_manifest(&["mods/iris.jar", "mods/extra.jar"], groups))
                .unwrap_err();
        assert!(matches!(err, ManifestError::GroupDefaultCount(_)));
    }

    #[test]
    fn rejects_a_one_group_with_nothing_on() {
        let groups = r#"[{"id":"g","name":"G","select":"one","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":false}]}]"#;
        let err = parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::GroupDefaultCount(_)));
    }

    #[test]
    fn accepts_an_at_most_one_group_with_nothing_on() {
        let groups = r#"[{"id":"g","name":"G","select":"atMostOne","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":false}]}]"#;
        assert!(parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).is_ok());
    }

    // ---- rule 7 ----
    #[test]
    fn rejects_activating_a_file_the_feature_does_not_own() {
        let groups = r#"[{"id":"g","name":"G","select":"one","features":[
            {"id":"a","name":"A","paths":["mods/iris.jar"],"default":true,
             "activate":{"kind":"shaderpack","file":"shaderpacks/bsl.zip"}}]}]"#;
        let err = parse_manifest(&optional_manifest(
            &["mods/iris.jar", "shaderpacks/bsl.zip"],
            groups,
        ))
        .unwrap_err();
        assert!(matches!(err, ManifestError::ActivateFileNotOwned(_)));
    }

    // ---- rule 8 ----
    #[test]
    fn rejects_a_shaderpack_activation_in_an_any_group() {
        let groups = r#"[{"id":"g","name":"G","select":"any","features":[
            {"id":"a","name":"A","paths":["shaderpacks/bsl.zip"],"default":true,
             "activate":{"kind":"shaderpack","file":"shaderpacks/bsl.zip"}}]}]"#;
        let err = parse_manifest(&optional_manifest(&["shaderpacks/bsl.zip"], groups)).unwrap_err();
        assert!(matches!(err, ManifestError::ShaderpackInAnyGroup(_)));
    }

    #[test]
    fn accepts_a_shaderpack_activation_in_a_one_group() {
        let groups = r#"[{"id":"g","name":"G","select":"one","features":[
            {"id":"a","name":"A","paths":["shaderpacks/bsl.zip"],"default":true,
             "activate":{"kind":"shaderpack","file":"shaderpacks/bsl.zip"}}]}]"#;
        assert!(parse_manifest(&optional_manifest(&["shaderpacks/bsl.zip"], groups)).is_ok());
    }

    // ---- rule 9 (D1) ----
    #[test]
    fn rejects_a_datapack_outside_a_global_loader_directory() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["saves/mundo/datapacks/t.zip"],"default":true,
             "activate":{"kind":"datapack","file":"saves/mundo/datapacks/t.zip"}}]}]"#;
        let err =
            parse_manifest(&optional_manifest(&["saves/mundo/datapacks/t.zip"], groups))
                .unwrap_err();
        assert!(matches!(err, ManifestError::DatapackOutsideLoaderDir(_)));
    }

    #[test]
    fn accepts_a_datapack_under_a_global_loader_directory() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["config/openloader/datapacks/t.zip"],"default":true,
             "activate":{"kind":"datapack","file":"config/openloader/datapacks/t.zip"}}]}]"#;
        assert!(
            parse_manifest(&optional_manifest(&["config/openloader/datapacks/t.zip"], groups))
                .is_ok()
        );
    }

    #[test]
    fn accepts_a_resourcepack_activation_with_a_priority() {
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["resourcepacks/faithful.zip"],"default":true,
             "activate":{"kind":"resourcepack","file":"resourcepacks/faithful.zip","priority":10}}]}]"#;
        assert!(
            parse_manifest(&optional_manifest(&["resourcepacks/faithful.zip"], groups)).is_ok()
        );
    }

    #[test]
    fn judges_feature_paths_case_insensitively_like_the_rest_of_the_file() {
        // Rule 1 resolves through norm_path, so a manifest whose feature path
        // differs only in case from its files[] entry must still resolve — the
        // alternative is a pack that validates on Linux and not on Windows.
        let groups = r#"[{"id":"g","name":"G","features":[
            {"id":"a","name":"A","paths":["Mods/Iris.jar"],"default":true}]}]"#;
        assert!(parse_manifest(&optional_manifest(&["mods/iris.jar"], groups)).is_ok());
    }
}
