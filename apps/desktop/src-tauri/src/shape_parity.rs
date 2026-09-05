/// The Rust half of the cross-language IPC shape-parity harness. Its twin is
/// `src/services/__tests__/shape-parity.test.ts` in apps/desktop.
///
/// WHY IT EXISTS. The renderer's mock.ts and types.ts are hand-written stand-ins
/// for Tauri command payloads that serialize from Rust structs. TypeScript catches
/// mock↔types.ts drift through its own type system, but the unchecked seam is
/// types.ts ↔ THE RUST STRUCTS that actually serialize over the IPC.
///
/// Add a field to a `#[serde(rename_all = "camelCase")]` struct in Rust today
/// and browser mode silently ships a shape the real app never sends. This module
/// guards that seam by serializing each chosen struct, extracting its top-level
/// KEY SET, and comparing it to a committed fixture file on disk.
///
/// THE VERDICT IS KEYS ONLY. Values legitimately differ (Rust timestamps are
/// strings; the fixture records the fact). Optional fields are modeled via
/// `#[serde(skip_serializing_if = "Option::is_none")]` or `#[serde(default)]`:
/// the fixture records what serde actually emits for a representative value.
///
/// THE FIXTURE LOOP. A new Rust field makes this test red with "added key X".
/// The dev updates the corresponding fixture file. The TypeScript test then goes
/// red until mock.ts and types.ts gain the field. Result: drift is impossible to
/// hide — there is no silent path where one language adds a field and the other
/// does not.
///
/// GROUND TRUTH. The Rust representation is the source of truth: Tauri commands
/// RETURN these types, and the renderer receives what serde emits. Fixtures must
/// record serde's actual behavior, not a hand-written guess about what serde
/// "should" do with an Option or a default field.
#[cfg(test)]
pub mod parity {
    use crate::api::*;
    use crate::auth::{AccountEntry, AccountView};
    use crate::install::instance::*;
    use crate::settings::Settings;
    use crate::status::{ServerPlayers, ServerStatus};
    use std::collections::BTreeSet;
    use std::path::{Path, PathBuf};

    /// Floors, not exact counts: adding a fixture must not require touching two
    /// languages, but a directory that silently stops being found must fail
    /// rather than pass with zero cases.
    const MIN_FIXTURES: usize = 17;

    /// `CARGO_MANIFEST_DIR` is apps/desktop/src-tauri, so three levels up is the
    /// repo root. Resolved at runtime rather than hardcoded so a fixture added
    /// on the TypeScript side is picked up here with no Rust edit at all.
    fn fixture_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../apps/desktop/shape-fixtures")
    }

    /// Read a fixture file by type name. Returns the key set serialized by serde.
    fn read_fixture(type_name: &str) -> BTreeSet<String> {
        let path = fixture_dir().join(format!("{}.json", type_name));
        let raw = std::fs::read_to_string(&path).unwrap_or_else(|e| {
            panic!(
                "fixture missing for {}: {}\n\
                 (expected at {})",
                type_name,
                e,
                path.display()
            )
        });
        let value: serde_json::Value =
            serde_json::from_str(&raw).expect("fixture must be valid JSON");
        extract_keys(&value)
    }

    /// Extract top-level keys from a JSON value. For objects, returns the key
    /// set. For non-objects (which should not happen in valid fixtures), panics
    /// with a clear message.
    fn extract_keys(value: &serde_json::Value) -> BTreeSet<String> {
        match value {
            serde_json::Value::Object(map) => map.keys().cloned().collect(),
            _ => panic!(
                "fixture must be a JSON object, not {}",
                match value {
                    serde_json::Value::Null => "null",
                    serde_json::Value::Bool(_) => "bool",
                    serde_json::Value::Number(_) => "number",
                    serde_json::Value::String(_) => "string",
                    serde_json::Value::Array(_) => "array",
                    serde_json::Value::Object(_) => "object", // unreachable
                }
            ),
        }
    }

    /// Check a single type: serialize a representative value, extract its keys,
    /// and compare against the fixture.
    fn check_type(type_name: &str, value: &impl serde::Serialize) {
        let serialized = serde_json::to_value(value)
            .unwrap_or_else(|e| panic!("failed to serialize {}: {}", type_name, e));
        let actual_keys = extract_keys(&serialized);
        let expected_keys = read_fixture(type_name);

        if actual_keys != expected_keys {
            let added: Vec<_> = actual_keys.iter().filter(|k| !expected_keys.contains(*k)).collect();
            let removed: Vec<_> = expected_keys.iter().filter(|k| !actual_keys.contains(*k)).collect();

            let mut msg = format!("parity drift on {}: ", type_name);
            if !added.is_empty() {
                msg.push_str(&format!("added keys {:?}; ", added));
            }
            if !removed.is_empty() {
                msg.push_str(&format!("removed keys {:?}", removed));
            }
            panic!("{}", msg);
        }
    }

    #[test]
    fn ipc_shape_parity() {
        // Count fixtures to catch a broken glob silently.
        let dir = fixture_dir();
        let count = std::fs::read_dir(&dir)
            .unwrap_or_else(|e| panic!("fixture directory missing at {}: {}", dir.display(), e))
            .filter_map(|e| {
                e.ok().and_then(|entry| {
                    let path = entry.path();
                    if path.extension().is_some_and(|ext| ext == "json") {
                        Some(path)
                    } else {
                        None
                    }
                })
            })
            .count();
        assert!(
            count >= MIN_FIXTURES,
            "expected at least {} fixtures, found {} at {}",
            MIN_FIXTURES,
            count,
            dir.display()
        );

        // Each type: serialize a representative value and check its key set.
        check_type("BoffAccount", &BoffAccount {
            id: 1,
            username: "test".into(),
            mc_uuid: Some("uuid".into()),
            avatar_url: Some("http://example.com".into()),
            roles: vec!["admin".into()],
        });

        check_type("BoffAccountEntry", &BoffAccountEntry {
            id: 1,
            username: "test".into(),
            mc_uuid: Some("uuid".into()),
            avatar_url: Some("http://example.com".into()),
            active: true,
        });

        check_type("DeviceAuthorization", &DeviceAuthorization {
            device_code: "code".into(),
            user_code: "USER-1234".into(),
            verification_uri: "http://example.com".into(),
            expires_in: 900,
            interval_seconds: 5,
        });

        check_type("DevicePollView", &DevicePollView {
            status: "pending".into(),
            user: Some(BoffAccount {
                id: 1,
                username: "test".into(),
                mc_uuid: None,
                avatar_url: None,
                roles: vec![],
            }),
        });

        check_type("LauncherGalleryImage", &LauncherGalleryImage {
            url: "http://example.com/image.png".into(),
            alt: Some("alt text".into()),
        });

        check_type("LauncherServer", &LauncherServer {
            host: Some("play.example.com".into()),
            port: Some(25565),
        });

        check_type("LauncherVersion", &LauncherVersion {
            id: "v1".into(),
            name: "1.0.0".into(),
            minecraft: Some("1.21".into()),
            loader: Some("neoforge".into()),
            loader_version: Some("21.1".into()),
            file_count: 42,
            optional_feature_count: 5,
            emulator_kind: None,
            changelog: Some("Initial release".into()),
            created_at: "2026-01-01T00:00:00Z".into(),
        });

        check_type("LauncherPack", &LauncherPack {
            id: "pack1".into(),
            slug: "my-pack".into(),
            game_type: Some("minecraft".into()),
            name: "My Pack".into(),
            summary: Some("A test pack".into()),
            description: Some("Long description".into()),
            icon_url: Some("http://example.com/icon.png".into()),
            gallery: vec![],
            access_kind: "public".into(),
            server: None,
            latest_version: None,
        });

        check_type("ServerHealth", &ServerHealth {
            status: "ok",
            http_status: Some(200),
            detail: None,
        });

        check_type("ServerPlayers", &ServerPlayers {
            online: 10,
            max: 20,
        });

        check_type("ServerStatus", &ServerStatus {
            online: true,
            players: Some(ServerPlayers { online: 5, max: 20 }),
            motd: Some("Welcome!".into()),
            latency_ms: Some(42),
        });

        check_type("Settings", &Settings {
            memory_mib: 4096,
            java_path: Some("/usr/bin/java".into()),
            game_dir: "/home/user/.boff".into(),
            close_on_launch: false,
            keep_logs: true,
            retain_versions: 3,
            memory_auto: false,
            locale: "es".into(),
            pack_layout: "card".into(),
            backup_before_update: true,
            emulator_paths: std::collections::HashMap::new(),
            rom_dirs: vec![],
            ui_scale: 1.0,
            jvm_args: vec![],
            crash_reports: false,
            telemetry: false,
        });

        check_type("RetainedVersion", &RetainedVersion {
            version_id: "v1".into(),
            version_name: "1.0.0".into(),
            minecraft: Some("1.21".into()),
            loader: Some("neoforge".into()),
            loader_version: Some("21.1".into()),
            installed_at: "2026-01-01T00:00:00Z".into(),
            file_count: 42,
            current: false,
            revertible: true,
        });

        check_type("OptionalFile", &OptionalFile {
            path: "mods/mod.jar".into(),
            name: "mod.jar".into(),
            size: 1024,
            enabled: true,
        });

        check_type("AccountView", &AccountView {
            uuid: "12345678-1234-1234-1234-123456789012".into(),
            username: "TestPlayer".into(),
            skin_url: "http://textures.minecraft.net/texture/hash".into(),
            warning: None,
        });

        check_type("AccountEntry", &AccountEntry {
            uuid: "12345678-1234-1234-1234-123456789012".into(),
            username: "TestPlayer".into(),
            active: true,
            skin_url: "http://textures.minecraft.net/texture/hash".into(),
        });

        check_type("Marker", &Marker {
            version_id: "v1".into(),
            version_name: "1.0.0".into(),
            minecraft: Some("1.21".into()),
            loader: Some("neoforge".into()),
            loader_version: Some("21.1".into()),
            installed_at: "2026-01-01T00:00:00Z".into(),
            file_count: 42,
            pack_id: "pack1".into(),
            managed: vec![],
            optional_files: vec![],
            optional_groups: vec![],
            pinned: false,
            game_type: GameType::Minecraft,
            emulator: None,
            randomizer: None,
        });
    }
}
