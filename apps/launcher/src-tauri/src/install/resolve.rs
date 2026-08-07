// PackManifest -> InstallPlan. This is the only module that reads the generated
// schema types, so the rest of the installer works with plain strings and paths
// rather than with `PackManifestVersionFilesItemSourceProjectId`.
//
// The loader precedence below is a REIMPLEMENTATION of `loaderOf()` in
// packages/pack-schema/src/mrpack.ts:64 and must keep its order:
// [forge, neoforge, fabric-loader, quilt-loader]. Both ends resolve the same
// manifest, and a disagreement means the dashboard shows one loader while the
// launcher installs another.

use crate::pack::{
    PackManifest, PackManifestVersionFilesItemEnvClient as EnvClient,
    PackManifestVersionFilesItemSource as Source,
};

use super::InstallFailure;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoaderKind {
    Forge,
    NeoForge,
    FabricLoader,
    QuiltLoader,
}

impl LoaderKind {
    /// The wire name, i.e. the mrpack dependency key. `PackVersionSummary.loader`
    /// in types.ts carries exactly these strings.
    pub fn key(self) -> &'static str {
        match self {
            LoaderKind::Forge => "forge",
            LoaderKind::NeoForge => "neoforge",
            LoaderKind::FabricLoader => "fabric-loader",
            LoaderKind::QuiltLoader => "quilt-loader",
        }
    }

    /// Inverse of `key()`. Needed by §9's rollback: a retained marker stores
    /// the loader as the wire string, and reverting has to install THAT loader
    /// rather than whatever the current manifest asks for.
    pub fn from_key(key: &str) -> Option<Self> {
        Some(match key {
            "forge" => LoaderKind::Forge,
            "neoforge" => LoaderKind::NeoForge,
            "fabric-loader" => LoaderKind::FabricLoader,
            "quilt-loader" => LoaderKind::QuiltLoader,
            _ => return None,
        })
    }
}

/// How a planned file is obtained. Modrinth needs one API round-trip to turn a
/// version id into a CDN URL, so it stays symbolic here and is resolved in
/// files.rs where the HTTP client lives.
#[derive(Debug, Clone)]
pub enum Fetch {
    /// Modrinth needs no key (§4.5), so these go client-direct at zero egress
    /// cost to us. Same for an explicit `url` source.
    Direct(String),
    ModrinthVersion { version_id: String },
    /// Streamed from our own API, authenticated with the launcher session:
    /// CurseForge because its CDN needs a key we refuse to ship (§4.5), and
    /// overrides because they are our blobs and never public (§7.2).
    Proxied(crate::api::PackFile),
    /// User-provided file (§4.3): the player supplies it locally. The hint
    /// tells the player what to look for. Never automatically downloaded.
    UserProvided { hint: String },
    /// A romhack (§4.1): materialized locally by applying `patch` to `base`
    /// (both other files[] entries, by instance-relative path), then verified
    /// against this entry's own sha512. Materialized in a dedicated pass AFTER
    /// the normal downloads, so its base and patch are already on disk.
    Patched {
        base: String,
        patch: String,
        format: crate::install::patch::PatchFormat,
    },
}

#[derive(Debug, Clone)]
pub struct PlannedFile {
    /// Relative to the instance's game directory. Already validated by
    /// `pack::parse_manifest` for traversal and duplicates.
    pub path: String,
    pub sha512: String,
    pub size: u64,
    pub fetch: Fetch,
    /// Configs and scripts go in the `overrides` phase, mods in `mods`; the two
    /// are separate bars in the UI and separate weights in progress.rs.
    pub is_mod: bool,
    /// §9's optional-mod toggles. `env.client == "optional"` in `.mrpack`, so
    /// this needs no addition to `packages/pack-schema` — `EnvSupport` already
    /// has the three values and the manifest already carries them.
    pub optional: bool,
}

/// The result of resolving a manifest: the game type and game-specific plan.
/// Cycle 1 only has the Minecraft arm; each game cycle adds its variant.
#[derive(Debug, Clone)]
pub enum PlannedGame {
    /// Minecraft pack: requires dependencies, optional loaders, and a Minecraft version.
    Minecraft(PlannedMinecraft),
    /// Emulator pack (Cycle 2): a ROM (user-provided or patched) run on the
    /// player's own mGBA/melonDS. No loaders, no Java — installs are payload-only.
    Emulator(PlannedEmulator),
    // Cycle 3: Zomboid(ZomboidPlan)
    // Cycle 4: Stardew(StardewPlan)
}

#[derive(Debug, Clone)]
pub struct PlannedEmulator {
    pub pack_id: String,
    pub slug: String,
    pub version_id: String,
    pub version_name: String,
    /// Wire kind (`"mgba"` | `"melonds"`) — resolved to an executable at launch.
    pub kind: String,
    /// Instance-relative path of the ROM handed to the emulator.
    pub rom: String,
    /// Extra CLI flags, placed BEFORE the ROM path.
    pub args: Vec<String>,
    pub files: Vec<PlannedFile>,
    pub total_bytes: u64,
}

#[derive(Debug, Clone)]
pub struct PlannedMinecraft {
    pub pack_id: String,
    pub slug: String,
    pub version_id: String,
    pub version_name: String,
    pub minecraft: String,
    pub loader: Option<(LoaderKind, String)>,
    pub files: Vec<PlannedFile>,
    /// Sum of `fileSize` across planned files. The manifest's own numbers, not
    /// Content-Length: a real total is needed before the first byte arrives.
    pub total_bytes: u64,
    /// RF-01/RF-02/spec D5: `Some("host:port")` only when the pack declares a
    /// server AND the pack's Minecraft version is >= 1.20 — the version
    /// `--quickPlayMultiplayer` first shipped in. `None` for everything else,
    /// including an unparseable version string (fail-safe: not skipping the
    /// menu is better than a launch the client refuses to parse).
    pub quick_play: Option<String>,
}

/// Backward-compat alias for Minecraft plans.
pub type InstallPlan = PlannedMinecraft;

/// Best-effort `major.minor` compare against 1.20. A pack's `minecraft` string
/// is normally "1.20.1"-shaped; anything that does not parse that way is
/// treated as pre-1.20 (spec D5).
fn supports_quick_play(minecraft: &str) -> bool {
    let mut parts = minecraft.split('.');
    let major: u32 = match parts.next().and_then(|s| s.parse().ok()) {
        Some(v) => v,
        None => return false,
    };
    let minor: u32 = match parts.next().and_then(|s| s.parse().ok()) {
        Some(v) => v,
        None => return false,
    };
    (major, minor) >= (1, 20)
}

/// Mirrors `loaderOf()` — first key present wins, in this fixed order.
pub fn loader_of(manifest: &PackManifest) -> Option<(LoaderKind, String)> {
    let deps = match &manifest.version.dependencies {
        Some(d) => d,
        None => return None,
    };
    if let Some(v) = &deps.forge {
        return Some((LoaderKind::Forge, v.to_string()));
    }
    if let Some(v) = &deps.neoforge {
        return Some((LoaderKind::NeoForge, v.to_string()));
    }
    if let Some(v) = &deps.fabric_loader {
        return Some((LoaderKind::FabricLoader, v.to_string()));
    }
    if let Some(v) = &deps.quilt_loader {
        return Some((LoaderKind::QuiltLoader, v.to_string()));
    }
    None
}

/// Resolve a manifest into a game-specific install plan. Cycle 1 only handles
/// Minecraft (the non-MC arms return early in validate_game_type).
pub fn plan(manifest: &PackManifest) -> Result<PlannedGame, InstallFailure> {
    // Determine game type (defaulting to minecraft per §4.1 pack.rs)
    let is_minecraft = manifest
        .pack
        .game_type
        .as_ref()
        .map(|gt| matches!(gt, crate::pack::PackManifestPackGameType::Minecraft))
        .unwrap_or(true);

    if is_minecraft {
        return plan_minecraft(manifest).map(PlannedGame::Minecraft);
    }
    if manifest.version.emulator.is_some() {
        return plan_emulator(manifest).map(PlannedGame::Emulator);
    }
    // Cycle 3+: zomboid/stardew arms land with their cycles.
    Err(InstallFailure::message(
        "Este tipo de juego no es soportado en esta versión del launcher.".to_string(),
    ))
}

/// The file list is game-agnostic: skip client-unsupported entries, resolve each
/// source to a `Fetch`. Shared by every game plan.
fn plan_files(manifest: &PackManifest) -> Result<(Vec<PlannedFile>, u64), InstallFailure> {
    let mut files = Vec::with_capacity(manifest.version.files.len());
    let mut total_bytes: u64 = 0;

    for file in &manifest.version.files {
        // A server-only file on a client install is not an error and not a
        // download — it simply is not part of this instance.
        if file.env.client == EnvClient::Unsupported {
            continue;
        }

        let path = file.path.to_string();
        let fetch = fetch_for(&file.source, &path)?;
        let size = file.file_size.max(0) as u64;
        total_bytes += size;

        let normalised = path.replace('\\', "/").to_lowercase();
        files.push(PlannedFile {
            is_mod: normalised.starts_with("mods/"),
            optional: file.env.client == EnvClient::Optional,
            path,
            sha512: file.sha512.to_string(),
            size,
            fetch,
        });
    }
    Ok((files, total_bytes))
}

fn plan_emulator(manifest: &PackManifest) -> Result<PlannedEmulator, InstallFailure> {
    let (files, total_bytes) = plan_files(manifest)?;
    let emu = manifest.version.emulator.as_ref().ok_or_else(|| {
        InstallFailure::message("El pack de emulador no declara su bloque `emulator`")
    })?;
    Ok(PlannedEmulator {
        pack_id: manifest.pack.id.to_string(),
        slug: manifest.pack.slug.to_string(),
        version_id: manifest.version.id.to_string(),
        version_name: manifest.version.name.to_string(),
        kind: match emu.kind {
            crate::pack::PackManifestVersionEmulatorKind::Mgba => "mgba".to_string(),
            crate::pack::PackManifestVersionEmulatorKind::Melonds => "melonds".to_string(),
        },
        rom: emu.rom.to_string(),
        args: emu.args.iter().map(|a| a.to_string()).collect(),
        files,
        total_bytes,
    })
}

fn plan_minecraft(manifest: &PackManifest) -> Result<PlannedMinecraft, InstallFailure> {
    let (files, total_bytes) = plan_files(manifest)?;

    let deps = manifest.version.dependencies.as_ref().ok_or_else(|| {
        InstallFailure::message("El paquete no declara dependencias de Minecraft")
    })?;
    let minecraft = deps.minecraft.to_string();
    let quick_play = manifest.pack.server.as_ref().and_then(|server| {
        if supports_quick_play(&minecraft) {
            // No port → hand Minecraft the bare host so its own SRV lookup finds
            // the real one (a host behind an SRV record declares no port).
            Some(match server.port {
                Some(port) => format!("{}:{}", server.host.to_string(), port),
                None => server.host.to_string(),
            })
        } else {
            None
        }
    });

    Ok(PlannedMinecraft {
        pack_id: manifest.pack.id.to_string(),
        slug: manifest.pack.slug.to_string(),
        version_id: manifest.version.id.to_string(),
        version_name: manifest.version.name.to_string(),
        minecraft,
        loader: loader_of(manifest),
        files,
        total_bytes,
        quick_play,
    })
}

pub(crate) fn fetch_for(source: &Source, _path: &str) -> Result<Fetch, InstallFailure> {
    Ok(match source {
        Source::Modrinth { version_id, .. } => Fetch::ModrinthVersion {
            version_id: version_id.to_string(),
        },
        Source::Url { url } => Fetch::Direct(url.clone()),

        // §4.5 — edge.forgecdn.net has required `x-api-key` since 16 July 2026.
        // The key stays server-side, so the bytes come back through our proxy.
        Source::Curseforge {
            project_id,
            file_id,
        } => Fetch::Proxied(crate::api::PackFile::Curseforge {
            project_id: *project_id,
            file_id: *file_id,
        }),

        // §7.2 — an authenticated stream, not a presigned URL: the blobs live
        // on the API's own disk, so there is nothing to sign.
        Source::Override { blob_sha512 } => Fetch::Proxied(crate::api::PackFile::Override {
            // The route lowercases before matching, and the schema already
            // guarantees lowercase hex; normalising is belt and braces.
            sha512: blob_sha512.to_string().to_lowercase(),
        }),

        // §4.3 — user-provided files: planned but not fetched from any source.
        // The frontend will show the hint and ask for the file. We return a
        // placeholder Fetch that signals this is user-provided, never actually
        // invoked by the download phase.
        Source::UserProvided { hint } => Fetch::UserProvided {
            hint: hint.to_string(),
        },

        // §4.1 — a romhack. The base/patch references are validated by
        // pack::parse_manifest; here they are just carried through for the
        // dedicated materialization pass.
        Source::Patched {
            base,
            patch,
            format,
        } => Fetch::Patched {
            base: base.to_string(),
            patch: patch.to_string(),
            format: match format {
                crate::pack::PackManifestVersionFilesItemSourceFormat::Bps => {
                    crate::install::patch::PatchFormat::Bps
                }
                crate::pack::PackManifestVersionFilesItemSourceFormat::Ups => {
                    crate::install::patch::PatchFormat::Ups
                }
            },
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn expect_minecraft(g: PlannedGame) -> PlannedMinecraft {
        match g {
            PlannedGame::Minecraft(p) => p,
            other => panic!("expected a minecraft plan, got {other:?}"),
        }
    }

    fn manifest(deps: &str, files: &str) -> PackManifest {
        let raw = format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{deps},"files":[{files}]}}}}"#
        );
        crate::pack::parse_manifest(&raw).expect("fixture must be valid")
    }

    fn file(path: &str, client: &str, source: &str) -> String {
        format!(
            r#"{{"path":"{path}","sha512":"{s}","fileSize":10,
                "env":{{"client":"{client}","server":"required"}},"source":{source}}}"#,
            s = "a".repeat(128)
        )
    }

    #[test]
    fn loader_precedence_matches_mrpack_ts() {
        // Both keys present: forge wins, exactly as LOADER_KEYS orders them.
        let m = manifest(
            r#"{"minecraft":"1.21.4","forge":"1.2.3","neoforge":"21.4.30"}"#,
            &file(
                "mods/a.jar",
                "required",
                r#"{"kind":"modrinth","projectId":"p","versionId":"v"}"#,
            ),
        );
        assert_eq!(
            loader_of(&m),
            Some((LoaderKind::Forge, "1.2.3".to_string()))
        );
    }

    #[test]
    fn loader_keys_round_trip_so_a_retained_marker_reinstalls_the_same_loader() {
        for kind in [
            LoaderKind::Forge,
            LoaderKind::NeoForge,
            LoaderKind::FabricLoader,
            LoaderKind::QuiltLoader,
        ] {
            assert_eq!(LoaderKind::from_key(kind.key()), Some(kind));
        }
        assert!(LoaderKind::from_key("liteloader").is_none());
    }

    #[test]
    fn vanilla_packs_have_no_loader() {
        let m = manifest(
            r#"{"minecraft":"1.21.4"}"#,
            &file("options.txt", "required", r#"{"kind":"url","url":"https://x.test/o"}"#),
        );
        assert!(loader_of(&m).is_none());
    }

    #[test]
    fn client_unsupported_files_are_skipped() {
        let m = manifest(
            r#"{"minecraft":"1.21.4"}"#,
            &format!(
                "{},{}",
                file("mods/a.jar", "required", r#"{"kind":"url","url":"https://x.test/a"}"#),
                file("mods/server-only.jar", "unsupported", r#"{"kind":"url","url":"https://x.test/b"}"#)
            ),
        );
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(plan.files.len(), 1);
        assert_eq!(plan.total_bytes, 10, "a skipped file must not inflate the bar");
    }

    #[test]
    fn mods_and_overrides_are_told_apart_by_path() {
        let m = manifest(
            r#"{"minecraft":"1.21.4"}"#,
            &format!(
                "{},{}",
                file("mods/a.jar", "required", r#"{"kind":"url","url":"https://x.test/a"}"#),
                file("config/a.toml", "required", r#"{"kind":"url","url":"https://x.test/b"}"#)
            ),
        );
        let plan = expect_minecraft(plan(&m).unwrap());
        assert!(plan.files[0].is_mod);
        assert!(!plan.files[1].is_mod);
    }

    #[test]
    fn optional_client_files_are_planned_and_flagged_not_skipped() {
        // §9's toggles are a per-instance CHOICE, so the plan must still carry
        // the file. Skipping it here (as `unsupported` is skipped) would make
        // an optional mod impossible to enable at all.
        let m = manifest(
            r#"{"minecraft":"1.21.4"}"#,
            &format!(
                "{},{}",
                file("mods/required.jar", "required", r#"{"kind":"url","url":"https://x.test/a"}"#),
                file("mods/minimap.jar", "optional", r#"{"kind":"url","url":"https://x.test/b"}"#)
            ),
        );
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(plan.files.len(), 2);
        assert!(!plan.files[0].optional);
        assert!(plan.files[1].optional);
    }

    #[test]
    fn curseforge_goes_through_our_proxy_never_the_cdn() {
        // A direct edge.forgecdn.net fetch 401s (§10, §4.5). The plan must
        // therefore never produce a Direct URL for a CF source.
        let m = manifest(
            r#"{"minecraft":"1.21.4"}"#,
            &file(
                "mods/a.jar",
                "required",
                r#"{"kind":"curseforge","projectId":123,"fileId":456}"#,
            ),
        );
        let plan = expect_minecraft(plan(&m).unwrap());
        match &plan.files[0].fetch {
            Fetch::Proxied(crate::api::PackFile::Curseforge {
                project_id,
                file_id,
            }) => {
                assert_eq!((*project_id, *file_id), (123, 456));
            }
            other => panic!("CurseForge must never be fetched directly: {other:?}"),
        }
    }

    #[test]
    fn overrides_go_through_our_proxy_with_lowercase_hex() {
        let m = manifest(
            r#"{"minecraft":"1.21.4"}"#,
            &file(
                "config/a.toml",
                "required",
                &format!(r#"{{"kind":"override","blobSha512":"{}"}}"#, "b".repeat(128)),
            ),
        );
        let plan = expect_minecraft(plan(&m).unwrap());
        match &plan.files[0].fetch {
            Fetch::Proxied(crate::api::PackFile::Override { sha512 }) => {
                assert_eq!(*sha512, "b".repeat(128));
            }
            other => panic!("an override is never public: {other:?}"),
        }
    }

    fn manifest_with_server(minecraft: &str, server: Option<&str>) -> PackManifest {
        let server_field = server.map(|s| format!(r#","server":{s}"#)).unwrap_or_default();
        let raw = format!(
            r#"{{"formatVersion":1,
                "pack":{{"id":"pk","slug":"boff-smp","name":"Boff SMP","access":{{"kind":"public"}}{server_field}}},
                "version":{{"id":"v1","name":"1.0","createdAt":"2026-07-30T12:00:00Z",
                  "dependencies":{{"minecraft":"{minecraft}"}},"files":[{}]}}}}"#,
            file(
                "options.txt",
                "required",
                r#"{"kind":"url","url":"https://x.test/o"}"#
            )
        );
        crate::pack::parse_manifest(&raw).expect("fixture must be valid")
    }

    // RF-01/RF-02/spec D5: a declared server only produces a quick-play target
    // on Minecraft 1.20+; nothing before it, and never when no server exists.
    #[test]
    fn quick_play_is_none_without_a_declared_server() {
        let m = manifest_with_server("1.21.4", None);
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(plan.quick_play, None);
    }

    #[test]
    fn quick_play_targets_the_declared_server_on_1_20_plus() {
        let m = manifest_with_server("1.20.1", Some(r#"{"host":"play.boffmedia.es","port":25566}"#));
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(
            plan.quick_play,
            Some("play.boffmedia.es:25566".to_string())
        );
    }

    #[test]
    fn quick_play_uses_the_bare_host_when_no_port_is_declared() {
        // SRV case: Minecraft resolves the port itself from the bare host.
        let m = manifest_with_server("1.20.1", Some(r#"{"host":"wingull.boffmedia.es"}"#));
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(
            plan.quick_play,
            Some("wingull.boffmedia.es".to_string())
        );
    }

    #[test]
    fn quick_play_is_suppressed_below_1_20_even_with_a_server() {
        let m = manifest_with_server("1.19.4", Some(r#"{"host":"play.boffmedia.es","port":25565}"#));
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(plan.quick_play, None);
    }

    #[test]
    fn an_unparseable_minecraft_version_is_treated_as_pre_1_20() {
        let m = manifest_with_server("snapshot", Some(r#"{"host":"play.boffmedia.es","port":25565}"#));
        let plan = expect_minecraft(plan(&m).unwrap());
        assert_eq!(plan.quick_play, None);
    }
}
