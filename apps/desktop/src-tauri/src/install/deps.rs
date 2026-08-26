//! What every jar in an instance declares it PROVIDES and REQUIRES, read from
//! the jars themselves.
//!
//! The source is `META-INF/neoforge.mods.toml` (or the legacy `mods.toml`), the
//! file the loader itself reads. Deriving the graph from the bytes on disk
//! rather than from anything an author typed is the whole point: a manifest
//! field would have to be kept in step by hand, and the failure it is meant to
//! catch — "Iris needs Sodium, and Sodium is a separate switch the player can
//! turn off" — is exactly the kind of thing an author does not know to record.
//!
//! Three details decide whether this reports the truth or cries wolf, and all
//! three were found by running it over a real pack:
//!
//! 1. **A jar with no toml is a library, not an error.** `kotlinforforge` ships
//!    no `mods.toml` at all; it is loaded as a plain classpath library. Treating
//!    a missing toml as "declares nothing" is correct, and reporting it as
//!    unreadable would put a permanent warning on a healthy pack.
//! 2. **JarJar counts as providing, but never outranks.** `lambdynlights_runtime`,
//!    `commonnetworking`
//!    and `apollib` are not separate files — they are nested jars inside their
//!    consumers, listed in `META-INF/jarjar/metadata.json`. Ignore those and the
//!    graph claims four required dependencies are missing when every one of them
//!    is present.
//! 3. **`minecraft`/`neoforge`/`java` are not pack content.** They are always
//!    satisfied by the runtime, so a graph that includes them reports the loader
//!    as a missing dependency of every mod in the pack.

use std::collections::{BTreeMap, BTreeSet};
use std::io::Read;
use std::path::Path;

use serde::Serialize;

/// Dependency ids the loader itself satisfies. Never pack content, so a graph
/// that reported them would say every mod has an unmet dependency.
const AMBIENT: &[&str] = &["minecraft", "neoforge", "forge", "fml", "java", "mcp"];

/// What one jar says about itself.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModJar {
    /// Instance-relative, forward slashes — the same spelling `files[]` uses, so
    /// callers can join this against the manifest without normalising twice.
    pub path: String,
    /// Mod ids this file supplies, including any nested via JarJar. Empty for a
    /// plain library jar with no toml, which is not an error — see the module
    /// note.
    pub provides: Vec<String>,
    /// Hard dependencies only. `optional`/`incompatible` entries are parsed and
    /// dropped here: a soft dependency cannot break a pack by being switched
    /// off, so surfacing it would be noise on every row.
    pub requires: Vec<String>,
    /// Mod ids supplied by JARS NESTED inside this one (JarJar). Kept apart from
    /// `provides` because a bundled copy must never outrank the standalone jar
    /// that also supplies the id: Controlify bundles YACL, and if the two were
    /// merged the graph would report every YACL consumer as depending on
    /// Controlify — which would then look like a feature that cannot be turned
    /// off.
    pub bundles: Vec<String>,
    /// True when the jar carried no mod metadata at all. Rendered as "library"
    /// rather than as a fault.
    pub library: bool,
    /// False when the file is parked as `<name>.jar.disabled`.
    ///
    /// Disabled jars are SCANNED rather than skipped, and that is the whole
    /// point of this field: a library switched off still exists, so the honest
    /// report is "MoreCulling is broken because Cloth Config is off" and not
    /// "Cloth Config was never here". The two need different words in front of
    /// a player and only this distinguishes them.
    pub enabled: bool,
}

/// One "A needs B" edge, resolved to the files on both ends.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DepEdge {
    /// The file that declares the dependency.
    pub from: String,
    /// The file that satisfies it.
    pub to: String,
    /// The mod id `from` actually asked for. Kept because one file can provide
    /// several ids and the row should say which one is doing the work.
    pub mod_id: String,
}

/// Why a dependency is not satisfied right now.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BreakReason {
    /// The file that provides it is present but switched off — recoverable by
    /// switching it back on, which is what the UI should offer.
    Disabled,
    /// Nothing in the instance provides it at all.
    Missing,
}

/// An ENABLED jar whose hard dependency is not currently satisfied. The pack
/// will not start in this state.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrokenDep {
    /// The enabled file that will fail to load.
    pub from: String,
    /// The file that would satisfy it, when one exists. Empty when missing.
    pub to: String,
    pub mod_id: String,
    pub reason: BreakReason,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModGraph {
    pub jars: Vec<ModJar>,
    pub edges: Vec<DepEdge>,
    /// Required mod ids that nothing in the instance provides. Usually a real
    /// missing dependency; always worth showing, never worth failing on, since
    /// a pack that runs today must not become unopenable because a jar spells
    /// something oddly.
    pub unresolved: Vec<DepEdge>,
    /// The state a player can actually be in and act on. A DISABLED dependent is
    /// never listed: a mod that is off cannot fail to load, so its unmet
    /// dependency is not a problem until someone switches it back on.
    pub broken: Vec<BrokenDep>,
}

impl ModGraph {
    /// Files that would break if `path` were removed — the reverse edges, which
    /// is the direction every user-facing question actually runs in ("what
    /// needs this library?").
    pub fn dependents_of(&self, path: &str) -> Vec<&str> {
        let mut out: Vec<&str> = self
            .edges
            .iter()
            .filter(|e| e.to == path)
            .map(|e| e.from.as_str())
            .collect();
        out.sort_unstable();
        out.dedup();
        out
    }
}

/// Strip `#` comments before parsing.
///
/// Not cosmetic: NeoForge's own `mods.toml` template ships every field twice,
/// once live and once commented out as documentation, and Cool Rain shipped that
/// template nearly unedited. A parser that keeps the comments reads the example
/// block's `modId = "examplemod"` as a real declaration.
fn strip_comments(src: &str) -> String {
    src.lines()
        .filter(|l| !l.trim_start().starts_with('#'))
        .collect::<Vec<_>>()
        .join("\n")
}

fn read_entry<R: Read + std::io::Seek>(zip: &mut zip::ZipArchive<R>, name: &str) -> Option<String> {
    let mut file = zip.by_name(name).ok()?;
    let mut buf = String::new();
    file.read_to_string(&mut buf).ok()?;
    Some(buf)
}

/// Mod ids supplied by nested jars. See note 2 in the module doc.
///
/// The nested jars are OPENED and their own tomls read, rather than trusting the
/// artifact names in `META-INF/jarjar/metadata.json`. An artifact name is not a
/// mod id and the two routinely differ: LambDynamicLights requires the mod id
/// `lambdynlights_runtime`, whose artifact is `lambdynlights-runtime-neoforge`.
/// Matching on the artifact reports a dependency as missing when the jar
/// supplying it is right there inside the file that needs it.
fn jarjar_ids<R: Read + std::io::Seek>(zip: &mut zip::ZipArchive<R>) -> Vec<String> {
    // Both conventions: NeoForge's JarJar writes the nested files to
    // `META-INF/jars/` and only the manifest lives in `META-INF/jarjar/`, while
    // some toolchains put the jars themselves under `jarjar/`. Globbing the
    // manifest's directory alone finds nothing in the common case.
    let nested: Vec<String> = (0..zip.len())
        .filter_map(|i| zip.by_index(i).ok().map(|f| f.name().to_owned()))
        .filter(|n| {
            (n.starts_with("META-INF/jars/") || n.starts_with("META-INF/jarjar/"))
                && n.to_ascii_lowercase().ends_with(".jar")
        })
        .collect();

    let mut ids = Vec::new();
    for name in nested {
        let mut bytes = Vec::new();
        {
            let Ok(mut entry) = zip.by_name(&name) else { continue };
            if entry.read_to_end(&mut bytes).is_err() {
                continue;
            }
        }
        let Ok(mut inner) = zip::ZipArchive::new(std::io::Cursor::new(bytes)) else {
            continue;
        };
        let body = read_entry(&mut inner, "META-INF/neoforge.mods.toml")
            .or_else(|| read_entry(&mut inner, "META-INF/mods.toml"));
        if let Some(body) = body {
            let (provides, _) = parse_toml(&strip_comments(&body));
            ids.extend(provides);
        }
    }
    ids
}

/// Normalised for comparing a mod id against a filename: NeoForge ids use `_`
/// and Maven artifacts use `-`, and the same component is spelled both ways.
fn loose(s: &str) -> String {
    s.to_ascii_lowercase()
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect()
}

fn parse_toml(body: &str) -> (Vec<String>, Vec<String>) {
    let Ok(doc) = body.parse::<toml::Table>() else {
        return (Vec::new(), Vec::new());
    };

    let provides = doc
        .get("mods")
        .and_then(|m| m.as_array())
        .map(|mods| {
            mods.iter()
                .filter_map(|m| m.get("modId").and_then(|v| v.as_str()).map(str::to_owned))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    // `[[dependencies.<owner>]]` — the owner key is the mod declaring them, and
    // a jar with two `[[mods]]` blocks has two of these tables, so every one is
    // walked rather than just the first.
    let mut requires = Vec::new();
    if let Some(table) = doc.get("dependencies").and_then(|d| d.as_table()) {
        for entries in table.values() {
            let Some(list) = entries.as_array() else { continue };
            for entry in list {
                let Some(id) = entry.get("modId").and_then(|v| v.as_str()) else {
                    continue;
                };
                // Absent `type` means required — NeoForge's own default.
                let kind = entry
                    .get("type")
                    .and_then(|v| v.as_str())
                    .unwrap_or("required")
                    .to_ascii_lowercase();
                if kind == "required" && !AMBIENT.contains(&id.to_ascii_lowercase().as_str()) {
                    requires.push(id.to_owned());
                }
            }
        }
    }

    (provides, requires)
}

fn read_jar(path: &Path, rel: &str, enabled: bool) -> ModJar {
    let mut jar = ModJar {
        path: rel.to_owned(),
        provides: Vec::new(),
        requires: Vec::new(),
        bundles: Vec::new(),
        library: true,
        enabled,
    };

    let Ok(file) = std::fs::File::open(path) else {
        return jar;
    };
    let Ok(mut zip) = zip::ZipArchive::new(file) else {
        return jar;
    };

    let body = read_entry(&mut zip, "META-INF/neoforge.mods.toml")
        .or_else(|| read_entry(&mut zip, "META-INF/mods.toml"));

    if let Some(body) = body {
        let (provides, requires) = parse_toml(&strip_comments(&body));
        jar.library = provides.is_empty();
        jar.provides = provides;
        jar.requires = requires;
    }

    jar.bundles = jarjar_ids(&mut zip);
    jar.bundles.sort();
    jar.bundles.dedup();
    jar.provides.sort();
    jar.provides.dedup();
    jar.requires.sort();
    jar.requires.dedup();
    jar
}

/// Read every jar in `mods_dir` and resolve the declarations against each other.
pub fn scan(mods_dir: &Path) -> ModGraph {
    let mut jars: Vec<ModJar> = Vec::new();
    let Ok(entries) = std::fs::read_dir(mods_dir) else {
        return ModGraph::default();
    };

    // `.disabled` files are included, not filtered out. The reported path has the
    // suffix stripped so it matches the manifest and the Content tab's own row
    // ids — the same spelling `instance_content` uses — and `enabled` carries the
    // difference instead.
    let mut names: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| {
            let lower = n.to_ascii_lowercase();
            lower.ends_with(".jar") || lower.ends_with(".jar.disabled")
        })
        .collect();
    names.sort();

    for name in names {
        let enabled = !name
            .to_ascii_lowercase()
            .ends_with(crate::install::instance::DISABLED_SUFFIX);
        let rel = name
            .strip_suffix(crate::install::instance::DISABLED_SUFFIX)
            .unwrap_or(&name);
        jars.push(read_jar(&mods_dir.join(&name), &format!("mods/{rel}"), enabled));
    }

    let (edges, unresolved, broken) = resolve(&jars);
    ModGraph {
        jars,
        edges,
        unresolved,
        broken,
    }
}

/// Match every declared dependency to the file that satisfies it.
///
/// Split out of `scan` so the two rules that were wrong on the first pass —
/// bundled copies must not outrank standalone jars, and a declaration-less
/// library must still resolve — are testable without building zip fixtures.
fn resolve(jars: &[ModJar]) -> (Vec<DepEdge>, Vec<DepEdge>, Vec<BrokenDep>) {
    // A mod id can be claimed by more than one jar (two versions dropped in by
    // hand). First wins by sort order, which is arbitrary but stable — and the
    // duplicate is a problem the loader will report far more loudly than we can.
    let mut owner: BTreeMap<&str, &str> = BTreeMap::new();
    for jar in jars {
        for id in &jar.provides {
            owner.entry(id.as_str()).or_insert(jar.path.as_str());
        }
    }
    // Second pass, and the order is the point: a nested copy only answers for an
    // id no standalone jar declared. See the note on `bundles`.
    for jar in jars {
        for id in &jar.bundles {
            owner.entry(id.as_str()).or_insert(jar.path.as_str());
        }
    }

    // Whether the file answering for an id is switched ON. A bundled id rides
    // with its host, so it is enabled exactly when the host is.
    let enabled_of: BTreeMap<&str, bool> =
        jars.iter().map(|j| (j.path.as_str(), j.enabled)).collect();

    // A library jar declares nothing at all, so nothing maps its mod id — yet the
    // file is right there and the dependency IS satisfied. `kotlinforforge` is the
    // real case: no `mods.toml`, loaded as a plain classpath library, and required
    // by name by `fzzy_config`. Falling back to the filename resolves it; without
    // this the graph reports a missing dependency on a pack that runs fine, which
    // is the one failure mode that would make the whole feature untrustworthy.
    //
    // Confined to jars that declare NOTHING, so it can never override or
    // contradict a real declaration.
    let libraries: Vec<&ModJar> = jars
        .iter()
        .filter(|j| j.provides.is_empty() && j.bundles.is_empty())
        .collect();
    let by_filename = |id: &str| -> Option<String> {
        let needle = loose(id);
        libraries
            .iter()
            .find(|j| loose(j.path.rsplit('/').next().unwrap_or("")).starts_with(&needle))
            .map(|j| j.path.clone())
    };

    let mut edges = Vec::new();
    let mut unresolved = Vec::new();
    let mut broken = Vec::new();
    for jar in jars {
        for id in &jar.requires {
            let resolved = owner
                .get(id.as_str())
                .map(|p| (*p).to_owned())
                .or_else(|| by_filename(id));
            match resolved.as_deref() {
                // A jar depending on itself is what a second `[[mods]]` block
                // produces; it is not an edge anyone wants to see.
                Some(to) if to == jar.path.as_str() => {}
                Some(to) => {
                    edges.push(DepEdge {
                        from: jar.path.clone(),
                        to: to.to_owned(),
                        mod_id: id.clone(),
                    });
                    // Only an ENABLED dependent can be broken. A mod that is off
                    // cannot fail to load, and listing it would put a permanent
                    // warning on a pack the player deliberately trimmed.
                    if jar.enabled && !enabled_of.get(to).copied().unwrap_or(true) {
                        broken.push(BrokenDep {
                            from: jar.path.clone(),
                            to: to.to_owned(),
                            mod_id: id.clone(),
                            reason: BreakReason::Disabled,
                        });
                    }
                }
                None => {
                    unresolved.push(DepEdge {
                        from: jar.path.clone(),
                        to: String::new(),
                        mod_id: id.clone(),
                    });
                    if jar.enabled {
                        broken.push(BrokenDep {
                            from: jar.path.clone(),
                            to: String::new(),
                            mod_id: id.clone(),
                            reason: BreakReason::Missing,
                        });
                    }
                }
            }
        }
    }
    (edges, unresolved, broken)
}

/// Cross-feature hard dependencies the catalogue does not declare.
///
/// The check the authoring editor exists to run: if `from`'s file and `to`'s
/// file live in different features and the catalogue has no `requires` edge
/// between them, a player can switch one off and leave the other loading against
/// a mod that is no longer there.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingRequires {
    /// Feature that should declare the dependency.
    pub feature: String,
    /// Feature it should point at.
    pub needs: String,
    pub from_path: String,
    pub to_path: String,
    pub mod_id: String,
    /// True when the dependency is satisfied by a file no feature owns — a
    /// always-installed library. Not a fault: it is the reason keeping shared
    /// libraries `required` is the right call, and the UI says so rather than
    /// demanding a `requires` that cannot be written.
    pub to_is_library: bool,
}

/// `owner_of` maps an instance path to the feature id that owns it, `declared`
/// holds the `requires` edges the catalogue already has.
pub fn missing_requires(
    graph: &ModGraph,
    owner_of: &BTreeMap<String, String>,
    declared: &BTreeSet<(String, String)>,
) -> Vec<MissingRequires> {
    let mut out = Vec::new();
    for edge in &graph.edges {
        let Some(from_feature) = owner_of.get(&edge.from) else {
            // The dependent is always installed, so nothing the player does can
            // take it away — whatever it needs is either also always installed
            // or already an unresolved entry.
            continue;
        };
        let to_feature = owner_of.get(&edge.to);
        match to_feature {
            Some(to_feature) if to_feature == from_feature => {}
            Some(to_feature) => {
                if !declared.contains(&(from_feature.clone(), to_feature.clone())) {
                    out.push(MissingRequires {
                        feature: from_feature.clone(),
                        needs: to_feature.clone(),
                        from_path: edge.from.clone(),
                        to_path: edge.to.clone(),
                        mod_id: edge.mod_id.clone(),
                        to_is_library: false,
                    });
                }
            }
            None => {}
        }
    }
    out.sort_by(|a, b| (&a.feature, &a.needs).cmp(&(&b.feature, &b.needs)));
    out.dedup_by(|a, b| a.feature == b.feature && a.needs == b.needs);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn jar(path: &str, provides: &[&str], requires: &[&str], bundles: &[&str]) -> ModJar {
        ModJar {
            path: path.into(),
            provides: provides.iter().map(|s| s.to_string()).collect(),
            requires: requires.iter().map(|s| s.to_string()).collect(),
            bundles: bundles.iter().map(|s| s.to_string()).collect(),
            library: provides.is_empty(),
            enabled: true,
        }
    }

    #[test]
    fn a_disabled_library_breaks_its_enabled_dependents() {
        // The case the whole feature exists for: Cloth Config switched off while
        // three mods that need it are still on.
        let mut lib = jar("mods/cloth-config.jar", &["cloth_config"], &[], &[]);
        lib.enabled = false;
        let jars = vec![
            jar("mods/moreculling.jar", &["moreculling"], &["cloth_config"], &[]),
            lib,
        ];
        let (edges, unresolved, broken) = resolve(&jars);
        // Still a real edge — the file exists, it is merely parked.
        assert_eq!(edges.len(), 1);
        assert!(unresolved.is_empty());
        assert_eq!(broken.len(), 1);
        assert_eq!(broken[0].reason, BreakReason::Disabled);
        assert_eq!(broken[0].from, "mods/moreculling.jar");
    }

    #[test]
    fn a_disabled_dependent_is_not_broken() {
        // Both off: nothing loads, so nothing can fail to load. Reporting this
        // would put a permanent warning on a pack the player deliberately trimmed.
        let mut lib = jar("mods/cloth-config.jar", &["cloth_config"], &[], &[]);
        lib.enabled = false;
        let mut dep = jar("mods/moreculling.jar", &["moreculling"], &["cloth_config"], &[]);
        dep.enabled = false;
        let (_, _, broken) = resolve(&vec![dep, lib]);
        assert!(broken.is_empty());
    }

    #[test]
    fn a_missing_dependency_is_broken_for_a_different_reason() {
        let jars = vec![jar("mods/a.jar", &["a"], &["nowhere"], &[])];
        let (_, _, broken) = resolve(&jars);
        assert_eq!(broken[0].reason, BreakReason::Missing);
    }

    #[test]
    fn a_bundled_copy_never_outranks_the_standalone_jar() {
        // Controlify bundles YACL; YACL also ships on its own. Sorting puts
        // controlify first, so a single-pass map would make every YACL consumer
        // look like it depends on Controlify — a feature the player can turn off.
        let jars = vec![
            jar("mods/better-clouds.jar", &["betterclouds"], &["yet_another_config_lib_v3"], &[]),
            jar("mods/controlify.jar", &["controlify"], &[], &["yet_another_config_lib_v3"]),
            jar("mods/yet_another_config_lib_v3.jar", &["yet_another_config_lib_v3"], &[], &[]),
        ];
        let (edges, unresolved, broken) = resolve(&jars);
        assert!(unresolved.is_empty());
        let edge = edges.iter().find(|e| e.from == "mods/better-clouds.jar").unwrap();
        assert_eq!(edge.to, "mods/yet_another_config_lib_v3.jar");
    }

    #[test]
    fn a_bundled_copy_still_answers_when_nothing_else_does() {
        // LambDynamicLights carries its own runtime and nothing else provides it.
        let jars = vec![jar(
            "mods/lambdynamiclights.jar",
            &["lambdynlights"],
            &["lambdynlights_runtime"],
            &["lambdynlights_runtime"],
        )];
        let (edges, unresolved, broken) = resolve(&jars);
        // Self-satisfied, so no edge worth drawing — but emphatically not unresolved.
        assert!(edges.is_empty());
        assert!(unresolved.is_empty());
    }

    #[test]
    fn a_declarationless_library_resolves_by_filename() {
        // kotlinforforge ships no mods.toml at all.
        let jars = vec![
            jar("mods/fzzy_config-0.7.6.jar", &["fzzy_config"], &["kotlinforforge"], &[]),
            jar("mods/kotlinforforge-5.12.0-all.jar", &[], &[], &[]),
        ];
        let (edges, unresolved, broken) = resolve(&jars);
        assert!(unresolved.is_empty(), "{unresolved:?}");
        assert_eq!(edges[0].to, "mods/kotlinforforge-5.12.0-all.jar");
    }

    #[test]
    fn a_genuinely_missing_dependency_is_still_reported() {
        let jars = vec![jar("mods/a.jar", &["a"], &["nowhere"], &[])];
        let (edges, unresolved, broken) = resolve(&jars);
        assert!(edges.is_empty());
        assert_eq!(unresolved[0].mod_id, "nowhere");
    }

    #[test]
    fn comments_do_not_declare_mods() {
        // NeoForge's template ships a commented example block; Cool Rain shipped
        // it nearly unedited.
        let src = "# modId = \"examplemod\"\n[[mods]]\nmodId = \"coolrain\"\n";
        let (provides, _) = parse_toml(&strip_comments(src));
        assert_eq!(provides, vec!["coolrain"]);
    }

    #[test]
    fn ambient_and_soft_dependencies_are_dropped() {
        let src = r#"
[[mods]]
modId = "rustic"

[[dependencies.rustic]]
modId = "neoforge"
type = "required"

[[dependencies.rustic]]
modId = "jei"
type = "optional"

[[dependencies.rustic]]
modId = "somelib"
"#;
        let (_, requires) = parse_toml(&strip_comments(src));
        // `neoforge` is ambient, `jei` is soft, `somelib` defaults to required.
        assert_eq!(requires, vec!["somelib"]);
    }

    #[test]
    fn dependents_run_in_reverse() {
        let graph = ModGraph {
            jars: Vec::new(),
            edges: vec![
                DepEdge {
                    from: "mods/a.jar".into(),
                    to: "mods/lib.jar".into(),
                    mod_id: "lib".into(),
                },
                DepEdge {
                    from: "mods/b.jar".into(),
                    to: "mods/lib.jar".into(),
                    mod_id: "lib".into(),
                },
            ],
            unresolved: Vec::new(),
            broken: Vec::new(),
        };
        assert_eq!(
            graph.dependents_of("mods/lib.jar"),
            vec!["mods/a.jar", "mods/b.jar"]
        );
    }
}
