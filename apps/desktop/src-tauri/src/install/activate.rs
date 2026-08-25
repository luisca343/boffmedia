//! Placement is not activation.
//!
//! For a mod, dropping the jar in `mods/` is the entire job — every loader
//! discovers mods by scanning the directory. For a resourcepack or a shaderpack
//! it is half the job: the file sits on disk and the game ignores it until a
//! config names it. This module writes those configs.
//!
//! Three rules shape everything here.
//!
//! **We only manage what the pack declared.** `options.txt` and
//! `iris.properties` are the player's files, not ours. A resourcepack the player
//! added themselves must survive an update, a toggle, and a revert untouched, so
//! every rewrite removes only entries that correspond to a declared
//! `ActivationSpec` file and leaves everything else exactly where it was. This is
//! the same managed/user partition `instance.rs` draws over the file tree, drawn
//! again one level down inside a config file.
//!
//! **Reverting is half the feature.** A player who switches shaders off and
//! finds `options.txt` still naming the pack reports it as a crash. So the
//! writer is not "apply what is on" but "make the file match the current state",
//! run over the whole declared set every time. That also makes it idempotent,
//! which is what lets it run on every launch without accumulating anything.
//!
//! **Minecraft rewrites `options.txt` when it exits.** Anything written while
//! the game is running is discarded at that moment, silently. So the caller must
//! not run this against a live instance — see D3 in docs/packs-v2-plan.md: the
//! toggle is recorded anyway and applied at the next launch. There is no queue
//! file, and deliberately so: the player's choice is ALREADY persisted in
//! `optional.json`, and this module derives the config from it. The "queue" is
//! just the next call to [`reconcile`].
//!
//! Datapacks are absent from this module on purpose. Under D1 they reach the
//! game through a global loader (OpenLoader / Paxi), which reads a directory —
//! so the file's own path is the activation and there is nothing to write.

use std::collections::HashSet;
use std::path::Path;

use super::optional::{Activation, GroupView};

/// Which properties files Iris-family mods read, in the order we prefer to
/// create one. Both are updated when both exist: a pack can ship Oculus for a
/// Forge arm and Iris for a Fabric arm, and guessing wrong writes to a file
/// nothing reads.
const SHADER_CONFIGS: [&str; 2] = ["config/iris.properties", "config/oculus.properties"];

/// What the current selection says the configs should contain.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Desired {
    /// `file/<name>` entries for `options.txt`, already ordered so that later
    /// entries win in-game — which is what `priority` means.
    pub resourcepacks: Vec<String>,
    /// Basename of the selected shaderpack, if any.
    pub shaderpack: Option<String>,
    /// Every `file/<name>` this pack could ever put in `resourcePacks`, on or
    /// off. The removal set: what makes "only manage what we declared" true.
    pub known_resourcepacks: HashSet<String>,
    /// Every shaderpack basename this pack declares, on or off. Same purpose —
    /// a `shaderPack=` value we did not write is the player's and stays.
    pub known_shaderpacks: HashSet<String>,
}

/// Read the desired config state out of a resolved optional model.
pub fn desired_from(views: &[GroupView]) -> Desired {
    let mut out = Desired::default();
    // (priority, entry) so the sort below is by priority and not by declaration
    // order, with ties keeping declaration order (sort_by is stable).
    let mut enabled: Vec<(i64, String)> = Vec::new();

    for feature in views.iter().flat_map(|g| g.features.iter()) {
        let Some(activation) = &feature.activate else {
            continue;
        };
        match activation {
            Activation::Resourcepack { file, priority } => {
                let entry = options_entry(file);
                out.known_resourcepacks.insert(entry.clone());
                if feature.enabled {
                    enabled.push((*priority, entry));
                }
            }
            Activation::Shaderpack { file } => {
                let name = basename_of(file).to_string();
                out.known_shaderpacks.insert(name.clone());
                if feature.enabled {
                    // Rule 8 guarantees shaderpack activations live in a `one` or
                    // `atMostOne` group, and `optional::resolve` repairs a group
                    // that resolves to more than one on — so at most one reaches
                    // here. `last wins` is a defensive tie-break, not a policy.
                    out.shaderpack = Some(name);
                }
            }
            // D1: a datapack's path IS its activation. Nothing to write.
            Activation::Datapack { .. } => {}
        }
    }

    enabled.sort_by_key(|(priority, _)| *priority);
    out.resourcepacks = enabled.into_iter().map(|(_, entry)| entry).collect();
    out
}

/// Minecraft names a file-backed resourcepack `file/<filename>` inside
/// `options.txt`, regardless of which directory it came from.
fn options_entry(path: &str) -> String {
    format!("file/{}", basename_of(path))
}

fn basename_of(path: &str) -> &str {
    path.rsplit(['/', '\\']).next().unwrap_or(path)
}

/// Make an instance's configs match `views`. Idempotent.
///
/// `loader` is the pack's loader key (`fabric`, `neoforge`, …), used only to
/// pick which shader properties file to CREATE when neither exists yet.
///
/// Returns human-readable lines describing what changed, for the install log.
/// An empty result means the configs already agreed with the selection, which is
/// the normal case on a relaunch.
pub fn reconcile(
    minecraft: &Path,
    views: &[GroupView],
    loader: Option<&str>,
) -> std::io::Result<Vec<String>> {
    let desired = desired_from(views);
    let mut log = Vec::new();

    if !desired.known_resourcepacks.is_empty() {
        if let Some(line) = write_resource_packs(minecraft, &desired)? {
            log.push(line);
        }
    }
    if !desired.known_shaderpacks.is_empty() {
        log.extend(write_shader_pack(minecraft, &desired, loader)?);
    }
    Ok(log)
}

// ── options.txt ────────────────────────────────────────────────────────────

/// Rewrite ONLY the `resourcePacks:` line, byte-preserving everything else.
///
/// `options.txt` is a flat `key:value` format with one entry per line and no
/// escaping, so a conservative line rewrite is both possible and much safer than
/// a parse-and-reserialise: the file carries a hundred settings we have no
/// business normalising, and Minecraft adds new ones every version.
fn write_resource_packs(minecraft: &Path, desired: &Desired) -> std::io::Result<Option<String>> {
    let path = minecraft.join("options.txt");
    let raw = match std::fs::read_to_string(&path) {
        Ok(raw) => raw,
        // A first-ever launch has no options.txt. Writing just this one key is
        // correct: Minecraft merges its own defaults for everything else on
        // first run, so a one-line file is a valid file.
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
        Err(e) => return Err(e),
    };

    let mut lines: Vec<String> = raw.split('\n').map(str::to_string).collect();
    // `split` on a trailing newline leaves an empty final element; keeping it
    // means the rejoin reproduces the trailing newline exactly.
    let index = lines
        .iter()
        .position(|l| l.trim_start().starts_with("resourcePacks:"));

    let current: Vec<String> = match index {
        Some(i) => match parse_entries(&lines[i]) {
            Some(entries) => entries,
            // Unparseable: leave the file completely alone. A malformed
            // resourcePacks line is the player's problem to fix, and rewriting
            // it from a guess could drop packs they still have.
            None => return Ok(None),
        },
        None => Vec::new(),
    };

    // Keep everything we did not put there — "vanilla", the player's own packs,
    // packs from another source — in their existing order, then append ours so
    // the pack's own choices win, ordered among themselves by priority.
    let mut next: Vec<String> = current
        .iter()
        .filter(|e| !desired.known_resourcepacks.contains(*e))
        .cloned()
        .collect();
    next.extend(desired.resourcepacks.iter().cloned());

    if next == current {
        return Ok(None);
    }

    // Windows line endings survive because the `\r` rides along at the end of
    // whatever line held it; only the one line we build is written fresh, and it
    // reuses the neighbouring convention.
    let crlf = raw.contains("\r\n");
    let rendered = format!(
        "resourcePacks:{}{}",
        serde_json::to_string(&next).unwrap_or_else(|_| "[]".into()),
        if crlf { "\r" } else { "" }
    );
    match index {
        Some(i) => lines[i] = rendered,
        None => {
            // Append before any trailing empty element so the file keeps ending
            // in exactly one newline.
            let at = if lines.last().is_some_and(|l| l.trim().is_empty()) {
                lines.len() - 1
            } else {
                lines.len()
            };
            lines.insert(at, rendered);
        }
    }

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&path, lines.join("\n"))?;
    Ok(Some(format!(
        "Paquetes de recursos actualizados en options.txt ({} activo(s)).",
        desired.resourcepacks.len()
    )))
}

/// `resourcePacks:["vanilla","file/x.zip"]` — a JSON array on one line.
fn parse_entries(line: &str) -> Option<Vec<String>> {
    let value = line.trim_end_matches(['\r', '\n']).splitn(2, ':').nth(1)?;
    serde_json::from_str::<Vec<String>>(value.trim()).ok()
}

// ── iris.properties / oculus.properties ────────────────────────────────────

/// Point the shader loader at the selected pack, or turn shaders off.
///
/// The revert deliberately clears `shaderPack` only when its current value is
/// one this pack declared. A player who picked their own shaderpack keeps it;
/// switching the pack's shader feature off just stops shaders being enabled,
/// rather than throwing away a choice we never made.
fn write_shader_pack(
    minecraft: &Path,
    desired: &Desired,
    loader: Option<&str>,
) -> std::io::Result<Vec<String>> {
    let existing: Vec<&str> = SHADER_CONFIGS
        .iter()
        .copied()
        .filter(|rel| minecraft.join(rel).is_file())
        .collect();

    let targets: Vec<&str> = if existing.is_empty() {
        // Nothing to update, so create the one the pack's loader would read.
        // Oculus is the Forge-family port; Iris is everything else, and is also
        // what modern NeoForge packs ship.
        vec![match loader {
            Some("forge") => "config/oculus.properties",
            _ => "config/iris.properties",
        }]
    } else {
        existing
    };

    let mut log = Vec::new();
    for rel in targets {
        let path = minecraft.join(rel);
        let raw = match std::fs::read_to_string(&path) {
            Ok(raw) => raw,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
            Err(e) => return Err(e),
        };

        let mut props = Properties::parse(&raw);
        let before = props.render();

        match &desired.shaderpack {
            Some(name) => {
                props.set("shaderPack", name);
                props.set("enableShaders", "true");
            }
            None => {
                props.set("enableShaders", "false");
                // Only ours gets cleared — see the doc comment.
                if props
                    .get("shaderPack")
                    .is_some_and(|v| desired.known_shaderpacks.contains(v))
                {
                    props.set("shaderPack", "");
                }
            }
        }

        let after = props.render();
        if after == before {
            continue;
        }
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&path, after)?;
        log.push(match &desired.shaderpack {
            Some(name) => format!("Shader «{name}» activado en {rel}."),
            None => format!("Shaders desactivados en {rel}."),
        });
    }
    Ok(log)
}

/// A `key=value` properties file, kept as an ordered line list so an edit
/// preserves comments, blank lines and key order. Same conservatism as
/// `options.txt` and for the same reason: this is the player's file.
struct Properties {
    lines: Vec<String>,
}

impl Properties {
    fn parse(raw: &str) -> Self {
        Self {
            lines: if raw.is_empty() {
                Vec::new()
            } else {
                raw.split('\n').map(str::to_string).collect()
            },
        }
    }

    fn index_of(&self, key: &str) -> Option<usize> {
        self.lines.iter().position(|line| {
            let trimmed = line.trim_start();
            !trimmed.starts_with('#')
                && trimmed
                    .split_once('=')
                    .is_some_and(|(k, _)| k.trim() == key)
        })
    }

    fn get(&self, key: &str) -> Option<&str> {
        self.index_of(key).map(|i| {
            self.lines[i]
                .split_once('=')
                .map(|(_, v)| v.trim_end_matches(['\r', '\n']).trim())
                .unwrap_or("")
        })
    }

    fn set(&mut self, key: &str, value: &str) {
        match self.index_of(key) {
            Some(i) => {
                let crlf = self.lines[i].ends_with('\r');
                self.lines[i] = format!("{key}={value}{}", if crlf { "\r" } else { "" });
            }
            None => {
                let at = if self.lines.last().is_some_and(|l| l.trim().is_empty()) {
                    self.lines.len() - 1
                } else {
                    self.lines.len()
                };
                self.lines.insert(at, format!("{key}={value}"));
            }
        }
    }

    fn render(&self) -> String {
        if self.lines.is_empty() {
            return String::new();
        }
        self.lines.join("\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::install::optional::{FeatureView, Select};

    fn dir() -> std::path::PathBuf {
        let d = std::env::temp_dir().join(format!("boff-activate-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    fn feature(id: &str, enabled: bool, activate: Option<Activation>) -> FeatureView {
        FeatureView {
            id: id.into(),
            name: id.into(),
            description: None,
            icon_url: None,
            paths: Vec::new(),
            default: true,
            requires: Vec::new(),
            activate,
            enabled,
            explicit: false,
            size: 0,
            installed: true,
        }
    }

    fn views(features: Vec<FeatureView>) -> Vec<GroupView> {
        vec![GroupView {
            id: "g".into(),
            name: "G".into(),
            description: None,
            select: Select::Any,
            features,
        }]
    }

    fn rp(file: &str, priority: i64, enabled: bool) -> FeatureView {
        feature(
            file,
            enabled,
            Some(Activation::Resourcepack {
                file: file.into(),
                priority,
            }),
        )
    }

    fn options(d: &Path) -> String {
        std::fs::read_to_string(d.join("options.txt")).unwrap()
    }

    // ── options.txt ────────────────────────────────────────────────────────

    #[test]
    fn writes_a_resourcepacks_line_when_the_file_does_not_exist_yet() {
        // A first-ever launch. Minecraft merges its own defaults for every other
        // key on first run, so a one-line file is valid.
        let d = dir();
        reconcile(&d, &views(vec![rp("resourcepacks/faithful.zip", 0, true)]), None).unwrap();
        assert_eq!(options(&d).trim(), r#"resourcePacks:["file/faithful.zip"]"#);
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn leaves_every_other_setting_byte_for_byte_alone() {
        // The whole reason this is a line rewrite and not a parse-reserialise.
        let d = dir();
        std::fs::write(
            d.join("options.txt"),
            "version:3465\nfov:0.5\nresourcePacks:[\"vanilla\"]\nlang:es_es\n",
        )
        .unwrap();
        reconcile(&d, &views(vec![rp("resourcepacks/faithful.zip", 0, true)]), None).unwrap();
        let out = options(&d);
        assert!(out.starts_with("version:3465\nfov:0.5\n"));
        assert!(out.ends_with("lang:es_es\n"));
        assert!(out.contains(r#"resourcePacks:["vanilla","file/faithful.zip"]"#));
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn never_removes_a_pack_the_player_added_themselves() {
        // The managed/user partition, one level down inside a config file.
        let d = dir();
        std::fs::write(
            d.join("options.txt"),
            "resourcePacks:[\"vanilla\",\"file/mi-pack-personal.zip\"]\n",
        )
        .unwrap();
        reconcile(&d, &views(vec![rp("resourcepacks/faithful.zip", 0, false)]), None).unwrap();
        assert!(options(&d).contains("file/mi-pack-personal.zip"));
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn switching_a_resourcepack_off_removes_its_entry() {
        // Reverting is half the feature: a pack still named in options.txt after
        // its file was parked is read by the player as a crash.
        let d = dir();
        std::fs::write(
            d.join("options.txt"),
            "resourcePacks:[\"vanilla\",\"file/faithful.zip\"]\n",
        )
        .unwrap();
        reconcile(&d, &views(vec![rp("resourcepacks/faithful.zip", 0, false)]), None).unwrap();
        assert_eq!(options(&d).trim(), r#"resourcePacks:["vanilla"]"#);
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn priority_decides_order_because_later_entries_win_in_game() {
        let d = dir();
        reconcile(
            &d,
            &views(vec![
                rp("resourcepacks/top.zip", 90, true),
                rp("resourcepacks/base.zip", 10, true),
            ]),
            None,
        )
        .unwrap();
        assert_eq!(
            options(&d).trim(),
            r#"resourcePacks:["file/base.zip","file/top.zip"]"#
        );
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn is_idempotent_so_it_can_run_on_every_launch() {
        let d = dir();
        let v = views(vec![rp("resourcepacks/faithful.zip", 0, true)]);
        reconcile(&d, &v, None).unwrap();
        let once = options(&d);
        reconcile(&d, &v, None).unwrap();
        reconcile(&d, &v, None).unwrap();
        assert_eq!(options(&d), once);
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn an_unparseable_resource_packs_line_is_left_completely_alone() {
        // Rewriting it from a guess could drop packs the player still has.
        let d = dir();
        let broken = "resourcePacks:[this is not json\n";
        std::fs::write(d.join("options.txt"), broken).unwrap();
        reconcile(&d, &views(vec![rp("resourcepacks/x.zip", 0, true)]), None).unwrap();
        assert_eq!(options(&d), broken);
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn does_not_touch_options_txt_when_the_pack_declares_no_resourcepacks() {
        let d = dir();
        reconcile(&d, &views(vec![feature("plain", true, None)]), None).unwrap();
        assert!(!d.join("options.txt").exists());
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn preserves_windows_line_endings() {
        let d = dir();
        std::fs::write(d.join("options.txt"), "fov:0.5\r\nresourcePacks:[\"vanilla\"]\r\n").unwrap();
        reconcile(&d, &views(vec![rp("resourcepacks/f.zip", 0, true)]), None).unwrap();
        let out = options(&d);
        assert!(out.contains("fov:0.5\r\n"), "{out:?}");
        assert!(out.contains("\"file/f.zip\"]\r\n"), "{out:?}");
        std::fs::remove_dir_all(&d).ok();
    }

    // ── shader properties ──────────────────────────────────────────────────

    fn shader(file: &str, enabled: bool) -> FeatureView {
        feature(
            file,
            enabled,
            Some(Activation::Shaderpack { file: file.into() }),
        )
    }

    fn iris(d: &Path) -> String {
        std::fs::read_to_string(d.join("config/iris.properties")).unwrap()
    }

    #[test]
    fn selects_a_shaderpack_and_enables_shaders() {
        let d = dir();
        reconcile(&d, &views(vec![shader("shaderpacks/bsl.zip", true)]), Some("fabric")).unwrap();
        let out = iris(&d);
        assert!(out.contains("shaderPack=bsl.zip"), "{out:?}");
        assert!(out.contains("enableShaders=true"), "{out:?}");
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn switching_shaders_off_disables_them_and_clears_our_own_selection() {
        let d = dir();
        std::fs::create_dir_all(d.join("config")).unwrap();
        std::fs::write(
            d.join("config/iris.properties"),
            "shaderPack=bsl.zip\nenableShaders=true\n",
        )
        .unwrap();
        reconcile(&d, &views(vec![shader("shaderpacks/bsl.zip", false)]), Some("fabric")).unwrap();
        let out = iris(&d);
        assert!(out.contains("enableShaders=false"), "{out:?}");
        assert!(out.contains("shaderPack=\n") || out.contains("shaderPack="), "{out:?}");
        assert!(!out.contains("shaderPack=bsl.zip"), "{out:?}");
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn a_shaderpack_the_player_chose_themselves_survives_switching_ours_off() {
        // We clear only what we set. Throwing away a choice we never made would
        // be the config-file version of deleting a user file.
        let d = dir();
        std::fs::create_dir_all(d.join("config")).unwrap();
        std::fs::write(
            d.join("config/iris.properties"),
            "shaderPack=mi-shader-favorito.zip\nenableShaders=true\n",
        )
        .unwrap();
        reconcile(&d, &views(vec![shader("shaderpacks/bsl.zip", false)]), Some("fabric")).unwrap();
        let out = iris(&d);
        assert!(out.contains("shaderPack=mi-shader-favorito.zip"), "{out:?}");
        assert!(out.contains("enableShaders=false"), "{out:?}");
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn keeps_comments_and_unrelated_keys_in_a_properties_file() {
        let d = dir();
        std::fs::create_dir_all(d.join("config")).unwrap();
        std::fs::write(
            d.join("config/iris.properties"),
            "#Iris config\nmaxShadowRenderDistance=32\nshaderPack=old.zip\n",
        )
        .unwrap();
        reconcile(&d, &views(vec![shader("shaderpacks/bsl.zip", true)]), Some("fabric")).unwrap();
        let out = iris(&d);
        assert!(out.starts_with("#Iris config\n"), "{out:?}");
        assert!(out.contains("maxShadowRenderDistance=32"), "{out:?}");
        assert!(out.contains("shaderPack=bsl.zip"), "{out:?}");
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn forge_gets_oculus_and_everything_else_gets_iris() {
        let forge = dir();
        reconcile(&forge, &views(vec![shader("s.zip", true)]), Some("forge")).unwrap();
        assert!(forge.join("config/oculus.properties").is_file());
        assert!(!forge.join("config/iris.properties").exists());

        let neo = dir();
        reconcile(&neo, &views(vec![shader("s.zip", true)]), Some("neoforge")).unwrap();
        assert!(neo.join("config/iris.properties").is_file());

        std::fs::remove_dir_all(&forge).ok();
        std::fs::remove_dir_all(&neo).ok();
    }

    #[test]
    fn updates_both_properties_files_when_both_already_exist() {
        // Guessing one and writing to a file nothing reads is a silent no-op.
        let d = dir();
        std::fs::create_dir_all(d.join("config")).unwrap();
        std::fs::write(d.join("config/iris.properties"), "shaderPack=old.zip\n").unwrap();
        std::fs::write(d.join("config/oculus.properties"), "shaderPack=old.zip\n").unwrap();
        reconcile(&d, &views(vec![shader("shaderpacks/bsl.zip", true)]), Some("fabric")).unwrap();
        assert!(iris(&d).contains("shaderPack=bsl.zip"));
        assert!(std::fs::read_to_string(d.join("config/oculus.properties"))
            .unwrap()
            .contains("shaderPack=bsl.zip"));
        std::fs::remove_dir_all(&d).ok();
    }

    // ── the model → desired translation ────────────────────────────────────

    #[test]
    fn a_datapack_activation_writes_nothing_because_its_path_is_its_activation() {
        // D1: OpenLoader/Paxi read a directory, so there is no config to edit.
        let d = dir();
        let v = views(vec![feature(
            "tweaks",
            true,
            Some(Activation::Datapack {
                file: "config/openloader/datapacks/t.zip".into(),
            }),
        )]);
        let log = reconcile(&d, &v, Some("fabric")).unwrap();
        assert!(log.is_empty());
        assert!(!d.join("options.txt").exists());
        assert!(!d.join("config").exists());
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn a_disabled_pack_still_counts_as_known_so_its_entry_can_be_removed() {
        let desired = desired_from(&views(vec![rp("resourcepacks/x.zip", 0, false)]));
        assert!(desired.resourcepacks.is_empty());
        assert!(desired.known_resourcepacks.contains("file/x.zip"));
    }
}
