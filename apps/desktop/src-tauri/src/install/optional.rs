//! Optional content: the model a player chooses from, and what that choice
//! means for the file list.
//!
//! Why this is a module and not a few fields on `instance.rs`:
//!
//! `env.client == "optional"` marks a PATH as skippable, which is the right
//! thing to tell Prism or packwiz. It is the wrong thing to show a person.
//! "Shaders" is Iris + Sodium + a config + the `.zip`, and a player who can
//! switch on three of those four has a crash, not a choice. So the unit the
//! player touches is a FEATURE — a named decision that owns several paths — and
//! this module is the translation between the two.
//!
//! The schema half lives in `packages/pack-schema/src/boffmedia.ts`; the nine
//! cross-field rules that keep a model coherent are validated on both sides
//! before anything here runs (see `pack::validate_optional`). This module may
//! therefore assume a model is well-formed and concern itself only with what
//! the PLAYER has done to it.

use std::collections::{HashMap, HashSet};

use serde::{Deserialize, Serialize};

use super::instance::normalise;
use crate::pack::PackManifest;

/// The group id used for the synthesised group of optional files no feature
/// claims. Reserved by rule 3 so an authored group can never collide with it.
/// Kept in step with `SYNTHETIC_GROUP_ID` in boffmedia.ts.
pub const SYNTHETIC_GROUP_ID: &str = "otros";

/// How many features in a group may be on at once.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Select {
    /// Independent switches.
    Any,
    /// Exactly one on at all times — a radio.
    One,
    /// A radio plus "ninguno".
    AtMostOne,
}

impl Default for Select {
    fn default() -> Self {
        Self::Any
    }
}

impl Select {
    /// True when at most one member may be on, i.e. turning one on turns the
    /// others off rather than joining them.
    pub fn is_exclusive(self) -> bool {
        matches!(self, Select::One | Select::AtMostOne)
    }
}

/// Where a placed file has to be switched ON as well as put on disk.
///
/// For a mod, dropping the jar in `mods/` is the entire job. For these three it
/// is half the job — the file sits there and the game ignores it until a config
/// names it. Acting on this is Phase 3 (`install::activate`); carrying it is
/// this module's business.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Activation {
    Resourcepack {
        file: String,
        /// Higher wins. `options.txt` holds `resourcePacks` as an ordered JSON
        /// array where LATER entries take precedence, so this decides placement
        /// within that array rather than being written out anywhere itself.
        #[serde(default)]
        priority: i64,
    },
    Shaderpack {
        file: String,
    },
    /// Declaration only. Under D1 a datapack reaches the game through a global
    /// loader (OpenLoader / Paxi), so the file's own path already puts it where
    /// the loader reads it and there is no config to edit. Carried anyway
    /// because it is what lets the chooser say "datapack" instead of "a zip
    /// inside config/".
    Datapack {
        file: String,
    },
}

impl Activation {
    pub fn file(&self) -> &str {
        match self {
            Activation::Resourcepack { file, .. }
            | Activation::Shaderpack { file }
            | Activation::Datapack { file } => file,
        }
    }
}

/// One thing a player switches on or off.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Feature {
    /// Stable across versions — the player's saved choice keys on this, so a
    /// rename silently resets everyone's selection.
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,
    /// Instance paths this feature owns, normalised.
    pub paths: Vec<String>,
    /// On unless the player says otherwise (opt-out) vs off until they ask for
    /// it (opt-in). The player's stored state is a DEVIATION from this, which is
    /// what makes a feature added by a later version land on the author's
    /// intent rather than on a value recorded before it existed.
    pub default: bool,
    #[serde(default)]
    pub requires: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub activate: Option<Activation>,
}

/// A named set of choices.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub select: Select,
    pub features: Vec<Feature>,
}

// ── Reading the model out of a manifest ────────────────────────────────────

/// The optional model as the chooser should see it: the authored groups, plus a
/// synthesised `otros` group holding every `env.client == "optional"` file no
/// feature claims (D4).
///
/// The fold-in is not a new policy — it is the old one written down. Before
/// features existed the runtime stored only a `disabled` set, which made every
/// optional file on-unless-switched-off; a synthesised feature with
/// `default: true` and a single path is exactly that. It matters because
/// `env.client: "optional"` is a `.mrpack` field, so a pack imported from
/// Modrinth can arrive carrying optional files nobody here ever authored.
///
/// Mirrors `optionalModelOf` in boffmedia.ts. The two must agree, because the
/// launcher renders one and the dashboard authors against the other.
pub fn model_of(manifest: &PackManifest) -> Vec<Group> {
    let mut groups: Vec<Group> = manifest
        .version
        .optional_groups
        .iter()
        .map(group_from_schema)
        .collect();

    let claimed: HashSet<String> = groups
        .iter()
        .flat_map(|g| g.features.iter())
        .flat_map(|f| f.paths.iter().cloned())
        .collect();

    let orphans: Vec<&crate::pack::PackManifestVersionFilesItem> = manifest
        .version
        .files
        .iter()
        .filter(|f| {
            matches!(
                f.env.client,
                crate::pack::PackManifestVersionFilesItemEnvClient::Optional
            ) && !claimed.contains(&normalise(f.path.as_str()))
        })
        .collect();

    if !orphans.is_empty() {
        groups.push(Group {
            id: SYNTHETIC_GROUP_ID.to_string(),
            name: "Otros".to_string(),
            description: None,
            select: Select::Any,
            features: orphans
                .iter()
                .map(|f| {
                    let path = normalise(f.path.as_str());
                    Feature {
                        id: synthetic_feature_id(&path),
                        name: basename_of(&path).to_string(),
                        description: None,
                        icon_url: None,
                        paths: vec![path],
                        default: true,
                        requires: Vec::new(),
                        activate: None,
                    }
                })
                .collect(),
        });
    }

    groups
}

fn group_from_schema(g: &crate::pack::PackManifestVersionOptionalGroupsItem) -> Group {
    use crate::pack::PackManifestVersionOptionalGroupsItemFeaturesItemActivate as SchemaActivate;
    use crate::pack::PackManifestVersionOptionalGroupsItemSelect as SchemaSelect;

    Group {
        id: g.id.as_str().to_string(),
        name: g.name.as_str().to_string(),
        description: g.description.as_ref().map(|d| d.as_str().to_string()),
        select: match g.select {
            None | Some(SchemaSelect::Any) => Select::Any,
            Some(SchemaSelect::One) => Select::One,
            Some(SchemaSelect::AtMostOne) => Select::AtMostOne,
        },
        features: g
            .features
            .iter()
            .map(|f| Feature {
                id: f.id.as_str().to_string(),
                name: f.name.as_str().to_string(),
                description: f.description.as_ref().map(|d| d.as_str().to_string()),
                icon_url: f.icon_url.clone(),
                paths: f.paths.iter().map(|p| normalise(p.as_str())).collect(),
                default: f.default,
                requires: f.requires.iter().map(|r| r.as_str().to_string()).collect(),
                activate: f.activate.as_ref().map(|a| match a {
                    SchemaActivate::Resourcepack { file, priority } => Activation::Resourcepack {
                        file: normalise(file.as_str()),
                        priority: priority.unwrap_or(0),
                    },
                    SchemaActivate::Shaderpack { file } => Activation::Shaderpack {
                        file: normalise(file.as_str()),
                    },
                    SchemaActivate::Datapack { file } => Activation::Datapack {
                        file: normalise(file.as_str()),
                    },
                }),
            })
            .collect(),
    }
}

fn basename_of(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

/// A kebab-case id derived from a path, matching `syntheticFeatureId` in
/// boffmedia.ts. Both ends must produce the SAME id or a player's choice does
/// not survive the trip: the launcher stores the id it computed and the next
/// version's model would key on a different one.
fn synthetic_feature_id(path: &str) -> String {
    let mut out = String::with_capacity(path.len());
    let mut pending_dash = false;
    for ch in path.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            if pending_dash && !out.is_empty() {
                out.push('-');
            }
            pending_dash = false;
            out.push(ch);
        } else {
            pending_dash = true;
        }
    }
    // `.slice(0, 64)` then a trailing-dash trim, exactly as the TS does — the
    // truncation can land on a dash and the two sides must agree on that too.
    let truncated: String = out.chars().take(64).collect();
    let trimmed = truncated.trim_end_matches('-').to_string();
    if trimmed.is_empty() {
        "archivo".to_string()
    } else {
        trimmed
    }
}

// ── Applying the player's choices ──────────────────────────────────────────

/// One feature as the renderer sees it: the authored fields plus what this
/// instance has actually done with it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FeatureView {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub paths: Vec<String>,
    /// What the author declared. Shown so the chooser can offer "restablecer".
    pub default: bool,
    pub requires: Vec<String>,
    pub activate: Option<Activation>,
    /// The effective state: explicit choice if there is one, the author's
    /// default otherwise.
    pub enabled: bool,
    /// True when the player has recorded a choice, i.e. `enabled` is theirs
    /// rather than the author's.
    pub explicit: bool,
    /// Total declared size of the feature's files. What makes "400 MB" visible
    /// before a shaderpack is downloaded rather than after.
    pub size: u64,
    /// True when every path the feature owns is on disk, parked or not. Filled
    /// in by the command layer (`mark_installed`), not here: `resolve` also runs
    /// at install time, where nothing is on disk yet and the question has no
    /// meaningful answer. False is the honest default — it means "turning this
    /// on needs a download", which is what an uninstalled feature needs.
    #[serde(default)]
    pub installed: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupView {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub select: Select,
    pub features: Vec<FeatureView>,
}

/// Which optional content the player has switched away from its default.
///
/// THREE fields, not a `HashMap<String, bool>`, and the reason is the same one
/// the original path-keyed comment gives: only DEVIATIONS from the declared
/// default are stored. A feature introduced by a later pack version has no entry
/// here, so it lands on the author's default instead of on a value recorded
/// before it existed. A map would freeze every new feature to whatever happened
/// to be written first.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionalState {
    /// Legacy path-keyed opt-outs, written by builds from before features
    /// existed. Read, never written: `set_feature` records feature ids, and
    /// `set_path` (the legacy command) keeps writing here so an instance that
    /// never sees a features-aware pack keeps behaving exactly as it did.
    #[serde(default)]
    pub disabled: Vec<String>,
    /// Feature ids the player switched OFF although they default on.
    #[serde(default)]
    pub features_off: Vec<String>,
    /// Feature ids the player switched ON although they default off.
    #[serde(default)]
    pub features_on: Vec<String>,
}

impl OptionalState {
    pub fn is_path_disabled(&self, path: &str) -> bool {
        let path = normalise(path);
        self.disabled.iter().any(|p| normalise(p) == path)
    }

    /// The legacy path-level toggle. Still the mechanism for an instance whose
    /// pack declares optional FILES and no groups.
    pub fn set_path(&mut self, path: &str, enabled: bool) {
        let path = normalise(path);
        self.disabled.retain(|p| normalise(p) != path);
        if !enabled {
            self.disabled.push(path);
        }
    }

    /// The effective state of one feature: an explicit choice if there is one,
    /// the author's default otherwise.
    ///
    /// The legacy path set is consulted only when there is NO explicit feature
    /// record, and ANY owned path being in it turns the feature off. That is the
    /// safe reading when an instance upgrades into a version that groups paths
    /// the player had already switched off one by one: they said they did not
    /// want it, and silently turning it back on is the worse mistake.
    pub fn is_feature_enabled(&self, feature: &Feature) -> bool {
        if self.features_on.iter().any(|id| id == &feature.id) {
            return true;
        }
        if self.features_off.iter().any(|id| id == &feature.id) {
            return false;
        }
        if feature.paths.iter().any(|p| self.is_path_disabled(p)) {
            return false;
        }
        feature.default
    }

    /// True when the player, not the author, decided this feature's state.
    pub fn is_explicit(&self, feature: &Feature) -> bool {
        self.features_on.iter().any(|id| id == &feature.id)
            || self.features_off.iter().any(|id| id == &feature.id)
            || feature.paths.iter().any(|p| self.is_path_disabled(p))
    }

    /// Record a feature's state, storing only a deviation from its default.
    ///
    /// Setting a feature back to its declared default CLEARS the record rather
    /// than writing the equivalent value — which is what keeps the "deviations
    /// only" invariant true over time. Also clears any legacy path-level entry
    /// for the feature's own paths, so the two representations cannot disagree
    /// about one file.
    pub fn set_feature(&mut self, feature: &Feature, enabled: bool) {
        self.features_on.retain(|id| id != &feature.id);
        self.features_off.retain(|id| id != &feature.id);
        for path in &feature.paths {
            let path = normalise(path);
            self.disabled.retain(|p| normalise(p) != path);
        }
        if enabled != feature.default {
            if enabled {
                self.features_on.push(feature.id.clone());
            } else {
                self.features_off.push(feature.id.clone());
            }
        }
    }
}

/// Resolve a model against a player's state into what the chooser renders.
///
/// `sizes` maps a normalised instance path to its declared byte size, so a
/// feature can show what it costs before anything is downloaded.
pub fn resolve(groups: &[Group], state: &OptionalState, sizes: &HashMap<String, u64>) -> Vec<GroupView> {
    groups
        .iter()
        .map(|group| {
            let mut features: Vec<FeatureView> = group
                .features
                .iter()
                .map(|f| FeatureView {
                    id: f.id.clone(),
                    name: f.name.clone(),
                    description: f.description.clone(),
                    icon_url: f.icon_url.clone(),
                    paths: f.paths.clone(),
                    default: f.default,
                    requires: f.requires.clone(),
                    activate: f.activate.clone(),
                    enabled: state.is_feature_enabled(f),
                    explicit: state.is_explicit(f),
                    size: f.paths.iter().filter_map(|p| sizes.get(p)).sum(),
                    installed: false,
                })
                .collect();

            // Defensive repair for a radio group, which the stored state alone
            // cannot guarantee. A version that adds a second `one` member, or a
            // player whose explicit "off" happens to land on the only default,
            // can produce zero-on or many-on — neither of which the game can
            // render as a choice. Repair here rather than at write time as well,
            // so a model arriving from ANY source resolves to something valid.
            if group.select.is_exclusive() {
                let on: Vec<usize> = features
                    .iter()
                    .enumerate()
                    .filter(|(_, f)| f.enabled)
                    .map(|(i, _)| i)
                    .collect();
                if on.len() > 1 {
                    // Keep the player's own most recent-looking choice: an
                    // explicit on beats an inherited default. Ties go to the
                    // first declared, so the result does not depend on map order.
                    let keep = on
                        .iter()
                        .copied()
                        .find(|&i| features[i].explicit)
                        .unwrap_or(on[0]);
                    for i in on {
                        if i != keep {
                            features[i].enabled = false;
                        }
                    }
                } else if on.is_empty() && group.select == Select::One {
                    if let Some(i) = features.iter().position(|f| f.default) {
                        features[i].enabled = true;
                    } else if !features.is_empty() {
                        features[0].enabled = true;
                    }
                }
            }

            GroupView {
                id: group.id.clone(),
                name: group.name.clone(),
                description: group.description.clone(),
                select: group.select,
                features,
            }
        })
        .collect()
}

/// Every instance path owned by a feature that is currently OFF.
///
/// This is what the install pass subtracts before a single byte moves — which
/// is what makes the install-time chooser worth having, since an unwanted
/// 400 MB shaderpack is never downloaded rather than downloaded and parked.
pub fn disabled_paths(views: &[GroupView]) -> HashSet<String> {
    views
        .iter()
        .flat_map(|g| g.features.iter())
        .filter(|f| !f.enabled)
        .flat_map(|f| f.paths.iter().cloned())
        .collect()
}

/// Every path owned by a feature that is currently ON. Needed alongside
/// `disabled_paths` because a path can be legacy-disabled AND owned by a feature
/// the player has since switched on; the feature is the newer, more specific
/// statement and has to win.
pub fn enabled_paths(views: &[GroupView]) -> HashSet<String> {
    views
        .iter()
        .flat_map(|g| g.features.iter())
        .filter(|f| f.enabled)
        .flat_map(|f| f.paths.iter().cloned())
        .collect()
}

/// Find a feature and the group holding it.
pub fn find<'a>(groups: &'a [Group], feature_id: &str) -> Option<(&'a Group, &'a Feature)> {
    groups.iter().find_map(|g| {
        g.features
            .iter()
            .find(|f| f.id == feature_id)
            .map(|f| (g, f))
    })
}

/// Apply one toggle to `state`, honouring `requires` and group exclusivity.
///
/// Returns the feature ids whose effective state CHANGED, so the caller knows
/// exactly which files to fetch or park — a toggle is rarely one feature.
/// Switching Shaders on has to bring Sodium with it, and switching Sodium off
/// has to take Shaders with it, or the player is left holding three of the four
/// files a working setup needs.
pub fn apply_toggle(
    groups: &[Group],
    state: &mut OptionalState,
    feature_id: &str,
    enabled: bool,
) -> Vec<String> {
    let before = effective_map(groups, state);

    let Some((group, target)) = find(groups, feature_id) else {
        return Vec::new();
    };

    if enabled {
        // Exclusivity first: in a radio group, turning one on turns the rest
        // off. Doing this BEFORE the requires closure matters — a sibling that
        // is also a dependency of the target must end up on, not off.
        if group.select.is_exclusive() {
            for sibling in &group.features {
                if sibling.id != target.id {
                    state.set_feature(sibling, false);
                }
            }
        }
        state.set_feature(target, true);
        // Transitive `requires`. Rule 5 guarantees these resolve, do not cycle,
        // and live in `any` groups, so pulling them on cannot fight exclusivity.
        for id in closure(groups, feature_id, Direction::Requires) {
            if let Some((_, dep)) = find(groups, &id) {
                state.set_feature(dep, true);
            }
        }
    } else {
        state.set_feature(target, false);
        // Anything that required this one can no longer stand.
        for id in closure(groups, feature_id, Direction::RequiredBy) {
            if let Some((_, dependent)) = find(groups, &id) {
                state.set_feature(dependent, false);
            }
        }
        // A `one` group must always have exactly one member on. Turning off the
        // last one falls back to the author's default rather than leaving the
        // group empty — `atMostOne` is the mode that permits "ninguno".
        if group.select == Select::One
            && !group
                .features
                .iter()
                .any(|f| state.is_feature_enabled(f))
        {
            if let Some(fallback) = group
                .features
                .iter()
                .find(|f| f.default)
                .or_else(|| group.features.first())
            {
                state.set_feature(fallback, true);
            }
        }
    }

    let after = effective_map(groups, state);
    let mut changed: Vec<String> = after
        .iter()
        .filter(|(id, now)| before.get(*id) != Some(now))
        .map(|(id, _)| id.clone())
        .collect();
    changed.sort();
    changed
}

fn effective_map(groups: &[Group], state: &OptionalState) -> HashMap<String, bool> {
    groups
        .iter()
        .flat_map(|g| g.features.iter())
        .map(|f| (f.id.clone(), state.is_feature_enabled(f)))
        .collect()
}

enum Direction {
    /// What this feature depends on.
    Requires,
    /// What depends on this feature.
    RequiredBy,
}

/// Transitive closure over the `requires` graph, excluding the start. Rule 5
/// forbids cycles, but the visited set makes this terminate regardless — a
/// marker on disk is not something the schema ever validated.
fn closure(groups: &[Group], start: &str, dir: Direction) -> Vec<String> {
    let all: Vec<&Feature> = groups.iter().flat_map(|g| g.features.iter()).collect();
    let mut seen: HashSet<String> = HashSet::from([start.to_string()]);
    let mut queue = vec![start.to_string()];
    let mut out = Vec::new();

    while let Some(current) = queue.pop() {
        let next: Vec<String> = match dir {
            Direction::Requires => all
                .iter()
                .find(|f| f.id == current)
                .map(|f| f.requires.clone())
                .unwrap_or_default(),
            Direction::RequiredBy => all
                .iter()
                .filter(|f| f.requires.iter().any(|r| r == &current))
                .map(|f| f.id.clone())
                .collect(),
        };
        for id in next {
            if seen.insert(id.clone()) {
                out.push(id.clone());
                queue.push(id);
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn feature(id: &str, default: bool, paths: &[&str]) -> Feature {
        Feature {
            id: id.to_string(),
            name: id.to_string(),
            description: None,
            icon_url: None,
            paths: paths.iter().map(|p| normalise(p)).collect(),
            default,
            requires: Vec::new(),
            activate: None,
        }
    }

    fn group(id: &str, select: Select, features: Vec<Feature>) -> Group {
        Group {
            id: id.to_string(),
            name: id.to_string(),
            description: None,
            select,
            features,
        }
    }

    fn view(groups: &[Group], state: &OptionalState) -> Vec<GroupView> {
        resolve(groups, state, &HashMap::new())
    }

    fn enabled(views: &[GroupView], id: &str) -> bool {
        views
            .iter()
            .flat_map(|g| g.features.iter())
            .find(|f| f.id == id)
            .map(|f| f.enabled)
            .expect("feature exists")
    }

    // ── the tri-state itself ───────────────────────────────────────────────

    #[test]
    fn a_feature_with_no_record_lands_on_the_authors_default() {
        let groups = vec![group(
            "g",
            Select::Any,
            vec![feature("on", true, &["a.jar"]), feature("off", false, &["b.jar"])],
        )];
        let views = view(&groups, &OptionalState::default());
        assert!(enabled(&views, "on"));
        assert!(!enabled(&views, "off"));
    }

    #[test]
    fn opt_in_is_representable_which_the_disabled_set_alone_could_not_do() {
        // The whole reason for the second vector: before it, "optional" could
        // only ever mean opt-OUT.
        let groups = vec![group("g", Select::Any, vec![feature("shaders", false, &["s.zip"])])];
        let mut state = OptionalState::default();
        assert!(!enabled(&view(&groups, &state), "shaders"));
        apply_toggle(&groups, &mut state, "shaders", true);
        assert!(enabled(&view(&groups, &state), "shaders"));
        assert_eq!(state.features_on, vec!["shaders".to_string()]);
        assert!(state.features_off.is_empty());
    }

    #[test]
    fn setting_a_feature_back_to_its_default_clears_the_record() {
        // "Deviations only" has to stay true over time, or the next version's
        // change of default would be overridden by a stale equal value.
        let groups = vec![group("g", Select::Any, vec![feature("f", true, &["a.jar"])])];
        let mut state = OptionalState::default();
        apply_toggle(&groups, &mut state, "f", false);
        assert_eq!(state.features_off, vec!["f".to_string()]);
        apply_toggle(&groups, &mut state, "f", true);
        assert!(state.features_off.is_empty());
        assert!(state.features_on.is_empty());
    }

    #[test]
    fn a_feature_added_by_a_later_version_lands_on_its_own_default() {
        // The argument for two sets rather than one map, tested directly: state
        // recorded before `new` existed must not decide `new`.
        let mut state = OptionalState::default();
        let v1 = vec![group("g", Select::Any, vec![feature("old", true, &["a.jar"])])];
        apply_toggle(&v1, &mut state, "old", false);

        let v2 = vec![group(
            "g",
            Select::Any,
            vec![feature("old", true, &["a.jar"]), feature("new", true, &["b.jar"])],
        )];
        let views = view(&v2, &state);
        assert!(!enabled(&views, "old"), "the recorded deviation survives");
        assert!(enabled(&views, "new"), "the new feature takes the author's default");
    }

    // ── legacy path state ──────────────────────────────────────────────────

    #[test]
    fn a_legacy_path_optout_still_switches_its_feature_off() {
        let groups = vec![group("g", Select::Any, vec![feature("f", true, &["mods/x.jar"])])];
        let mut state = OptionalState::default();
        state.set_path("mods/x.jar", false);
        assert!(!enabled(&view(&groups, &state), "f"));
    }

    #[test]
    fn an_explicit_feature_choice_beats_the_legacy_path_set() {
        let groups = vec![group("g", Select::Any, vec![feature("f", true, &["mods/x.jar"])])];
        let mut state = OptionalState::default();
        state.set_path("mods/x.jar", false);
        apply_toggle(&groups, &mut state, "f", true);
        assert!(enabled(&view(&groups, &state), "f"));
        assert!(
            state.disabled.is_empty(),
            "the stale path entry is cleared, so the two representations cannot disagree"
        );
    }

    // ── requires ───────────────────────────────────────────────────────────

    #[test]
    fn switching_a_feature_on_brings_its_requirements_with_it() {
        // Three of four files is a crash, not a choice.
        let mut shaders = feature("shaders", false, &["shaderpacks/bsl.zip"]);
        shaders.requires = vec!["iris".into()];
        let mut iris = feature("iris", false, &["mods/iris.jar"]);
        iris.requires = vec!["sodium".into()];
        let groups = vec![group(
            "g",
            Select::Any,
            vec![shaders, iris, feature("sodium", false, &["mods/sodium.jar"])],
        )];

        let mut state = OptionalState::default();
        let changed = apply_toggle(&groups, &mut state, "shaders", true);
        let views = view(&groups, &state);
        assert!(enabled(&views, "shaders"));
        assert!(enabled(&views, "iris"), "direct requirement");
        assert!(enabled(&views, "sodium"), "transitive requirement");
        assert_eq!(changed, vec!["iris", "shaders", "sodium"]);
    }

    #[test]
    fn switching_a_requirement_off_takes_its_dependents_with_it() {
        let mut shaders = feature("shaders", true, &["shaderpacks/bsl.zip"]);
        shaders.requires = vec!["iris".into()];
        let groups = vec![group(
            "g",
            Select::Any,
            vec![shaders, feature("iris", true, &["mods/iris.jar"])],
        )];

        let mut state = OptionalState::default();
        apply_toggle(&groups, &mut state, "iris", false);
        let views = view(&groups, &state);
        assert!(!enabled(&views, "iris"));
        assert!(!enabled(&views, "shaders"), "cannot stand without its requirement");
    }

    // ── group selection modes ──────────────────────────────────────────────

    #[test]
    fn turning_on_a_radio_member_turns_the_others_off() {
        let groups = vec![group(
            "shaders",
            Select::One,
            vec![
                feature("bsl", true, &["shaderpacks/bsl.zip"]),
                feature("complementary", false, &["shaderpacks/comp.zip"]),
            ],
        )];
        let mut state = OptionalState::default();
        apply_toggle(&groups, &mut state, "complementary", true);
        let views = view(&groups, &state);
        assert!(enabled(&views, "complementary"));
        assert!(!enabled(&views, "bsl"));
    }

    #[test]
    fn a_one_group_never_ends_up_empty() {
        let groups = vec![group(
            "shaders",
            Select::One,
            vec![
                feature("bsl", true, &["shaderpacks/bsl.zip"]),
                feature("comp", false, &["shaderpacks/comp.zip"]),
            ],
        )];
        let mut state = OptionalState::default();
        apply_toggle(&groups, &mut state, "bsl", false);
        let views = view(&groups, &state);
        assert!(
            views[0].features.iter().filter(|f| f.enabled).count() == 1,
            "exactly one stays on"
        );
    }

    #[test]
    fn an_at_most_one_group_may_be_emptied() {
        // The difference between the two radio modes, and the only thing that
        // distinguishes them once a choice has been made.
        let groups = vec![group(
            "shaders",
            Select::AtMostOne,
            vec![feature("bsl", true, &["shaderpacks/bsl.zip"])],
        )];
        let mut state = OptionalState::default();
        apply_toggle(&groups, &mut state, "bsl", false);
        assert!(!enabled(&view(&groups, &state), "bsl"));
    }

    #[test]
    fn a_radio_group_that_resolves_to_two_on_is_repaired_to_one() {
        // A version that adds a second default:true member cannot be caught by
        // validation on an instance that already has state — repair on read.
        let groups = vec![group(
            "shaders",
            Select::One,
            vec![
                feature("bsl", true, &["a.zip"]),
                feature("comp", true, &["b.zip"]),
            ],
        )];
        let views = view(&groups, &OptionalState::default());
        assert_eq!(views[0].features.iter().filter(|f| f.enabled).count(), 1);
    }

    // ── what the install pass consumes ─────────────────────────────────────

    #[test]
    fn disabled_paths_covers_every_file_a_switched_off_feature_owns() {
        let groups = vec![group(
            "g",
            Select::Any,
            vec![feature(
                "shaders",
                true,
                &["mods/iris.jar", "config/iris.properties", "shaderpacks/bsl.zip"],
            )],
        )];
        let mut state = OptionalState::default();
        apply_toggle(&groups, &mut state, "shaders", false);
        let off = disabled_paths(&view(&groups, &state));
        assert_eq!(off.len(), 3);
        assert!(off.contains("config/iris.properties"));
    }

    #[test]
    fn synthetic_ids_match_the_typescript_ones() {
        // If these drift, a player's saved choice silently resets: the launcher
        // stores the id it computed and the next model keys on a different one.
        assert_eq!(synthetic_feature_id("mods/journeymap.jar"), "mods-journeymap-jar");
        assert_eq!(synthetic_feature_id("Mods/Extra Mod.jar"), "mods-extra-mod-jar");
        assert_eq!(synthetic_feature_id("---"), "archivo");
    }
}
