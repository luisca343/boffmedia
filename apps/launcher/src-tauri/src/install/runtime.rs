// HANDOFF §9 — "per-instance Java runtime + memory, with a sane heuristic".
//
// Three ideas, one file, because they only make sense together:
//
//   THE OVERRIDE. A pack-level choice of Java path and max heap, stored beside
//   the instance in `.boff-runtime.json` and NOT in the global settings blob.
//   A 300-mod kitchen sink and a vanilla-plus-shaders pack want different
//   numbers, and a single global slider forces the player to re-tune it every
//   time they switch pack — which they will forget, and the symptom is an OOM
//   crash that looks like the pack's fault.
//
//   THREE STATES, NOT TWO. `Inherit` (whatever Ajustes says), `Auto` (the
//   heuristic below) and an explicit value are genuinely different intents, and
//   collapsing "auto" into "unset" would make it impossible to say "this pack
//   in particular should size itself" while the global setting stays fixed.
//   They are separate variants on the wire so the UI can render three distinct
//   badges rather than guessing from a null.
//
//   THE HEURISTIC. See `recommended_heap_mib`. Its ceiling is the whole point:
//   a heap larger than physical RAM does not fail fast, it swaps, and a player
//   on 8 GB experiences that as "the launcher froze my computer".
//
// Nothing here is on the launch hot path more than once: the resolution is
// computed in `prepare()` and carried on `game::Prepared`.

use serde::{Deserialize, Serialize};

use super::instance::Marker;
use crate::settings::Settings;

/// What decided a value, so the UI can say WHY it is 6 GB rather than only that
/// it is. Mirrors `RuntimeSource` in services/types.ts.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeSource {
    /// Taken from the global settings (which may themselves be automatic).
    Global,
    /// This pack carries an explicit value.
    Override,
    /// Computed by the heuristic.
    Auto,
}

/// Per-pack heap choice. `Inherit` is the default so an instance written by the
/// previous build — which has no runtime file at all — behaves exactly as it did.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "mode", rename_all = "camelCase")]
pub enum MemoryChoice {
    Inherit,
    Auto,
    #[serde(rename_all = "camelCase")]
    Fixed {
        mib: u32,
    },
}

impl Default for MemoryChoice {
    fn default() -> Self {
        MemoryChoice::Inherit
    }
}

/// Per-pack Java choice. `Auto` is NOT the same as `Inherit`: it means "ignore
/// the global path for this pack and let the launcher install the right JVM",
/// which is the fix for "I pointed the launcher at Java 8 for an old pack and
/// now the new one will not start".
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "mode", rename_all = "camelCase")]
pub enum JavaChoice {
    Inherit,
    Auto,
    #[serde(rename_all = "camelCase")]
    Custom {
        path: String,
    },
}

impl Default for JavaChoice {
    fn default() -> Self {
        JavaChoice::Inherit
    }
}

/// The per-instance file. Every field `#[serde(default)]`: a file written by a
/// future build with more fields, or by this one with fewer, must still parse —
/// a failed parse here silently resets the player's choices back to global.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct RuntimeOverride {
    pub memory: MemoryChoice,
    pub java: JavaChoice,
}

/// What actually gets used, plus enough context for the UI to explain it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedRuntime {
    pub heap_mib: u32,
    pub memory_source: RuntimeSource,
    /// None = let portablemc find or install a JVM (§6.3).
    pub java_path: Option<String>,
    pub java_source: RuntimeSource,
    /// What the heuristic was fed. Shown next to the number so "6 GB
    /// (automático, 214 mods)" is verifiable rather than magic.
    pub mod_count: usize,
    pub total_ram_mib: u64,
    /// What the heuristic WOULD pick, even when an explicit value won. Lets the
    /// UI offer "recomendado: 6 GB" beside a manual slider.
    pub recommended_mib: u32,
}

impl ResolvedRuntime {
    /// Clamped for the same reason `Settings::xmx_arg` is: a hand-edited file
    /// must not produce `-Xmx0m`, which fails with a JVM error nobody connects
    /// to a memory setting.
    pub fn xmx_arg(&self) -> String {
        format!("-Xmx{}M", self.heap_mib.clamp(512, 65536))
    }

    /// The line the installer logs before launching, so the number is in the
    /// log a player pastes into a support thread.
    pub fn summary(&self) -> String {
        let gib = self.heap_mib as f64 / 1024.0;
        let how = match self.memory_source {
            RuntimeSource::Auto => format!("automático, {} mods", self.mod_count),
            RuntimeSource::Override => "definido para este pack".to_string(),
            RuntimeSource::Global => "de los ajustes generales".to_string(),
        };
        let java = match (&self.java_path, self.java_source) {
            (Some(path), RuntimeSource::Override) => format!("Java: {path} (este pack)"),
            (Some(path), _) => format!("Java: {path}"),
            (None, RuntimeSource::Override) => "Java: gestionado por el launcher (este pack)".into(),
            (None, _) => "Java: gestionado por el launcher".into(),
        };
        format!("Memoria: {gib:.1} GB ({how}). {java}.")
    }
}

// ── The heuristic ──────────────────────────────────────────────────────────

/// Heap floor. Below this the game does not merely run badly, it fails to reach
/// the main menu on any modern version.
const BASE_MIB: u32 = 2560;

/// Per-mod allowance. A mod's resident cost is dominated by its static side —
/// classes, registry entries, recipes, models — which for a typical Forge/Fabric
/// mod sits in the low single-digit MiB. 12 MiB is deliberately generous: an
/// over-estimate costs a player nothing (the JVM only commits what it uses,
/// -Xmx is a ceiling), while an under-estimate is an OOM crash mid-session.
///
///   0 mods   -> 2560 MiB  (vanilla + shaders headroom)
///   200 mods -> 4960 MiB
///   300 mods -> 6160 MiB  (the case §9 names: NOT 2 GB)
///   500 mods -> 8560 MiB
const PER_MOD_MIB: u32 = 12;

/// Never hand the JVM more than this share of physical RAM. The heap is not the
/// process: metaspace, the code cache, direct buffers, the GPU driver's mapped
/// memory and the game's own native allocations sit OUTSIDE -Xmx and routinely
/// add 1–2 GB. Going past ~60% is how a "generous" heap turns into swapping,
/// and a swapping machine does not throw OutOfMemoryError — it just stops
/// responding, which the player reports as the launcher freezing their PC.
const RAM_FRACTION_NUM: u64 = 3;
const RAM_FRACTION_DEN: u64 = 5;

/// Always leave at least this much physical RAM to the OS, the launcher and the
/// JVM's own off-heap use, regardless of the fraction above. On a 4 GB machine
/// 60% (2457 MiB) is already more than is safe once Windows has its share.
const RESERVED_FOR_SYSTEM_MIB: u64 = 2048;

/// Absolute floor. A machine too small to satisfy it is a machine that cannot
/// run a modpack, but the launcher must still emit a heap the JVM accepts so
/// the player gets Minecraft's own error rather than a launcher error.
const MIN_HEAP_MIB: u32 = 1024;

/// Above this a bigger heap stops helping and starts making GC pauses worse;
/// nothing this launcher ships needs it.
const MAX_HEAP_MIB: u32 = 16384;

/// Sliders and JVM docs both speak in 512 MiB steps; an odd number like 4937
/// reads as a bug.
const STEP_MIB: u32 = 512;

/// The recommended heap for `mod_count` mods on a machine with `total_ram_mib`
/// of physical RAM.
///
/// want    = 2560 + 12 * mods
/// ceiling = min(60% of RAM, RAM - 2048)
/// result  = clamp(min(want, ceiling), 1024, 16384) rounded DOWN to 512 MiB
///
/// Worked examples (the four the tests pin):
///   8 GB /  20 mods -> want 2800, ceiling min(4915, 6144)=4915 -> 2560
///   8 GB / 300 mods -> want 6160, ceiling 4915                 -> 4608
///   4 GB / 300 mods -> want 6160, ceiling min(2457, 2048)=2048 -> 2048
///  16 GB / 300 mods -> want 6160, ceiling min(9830, 14336)     -> 6144
///  32 GB / 700 mods -> want 10960, ceiling 19660               -> 10752
pub fn recommended_heap_mib(mod_count: usize, total_ram_mib: u64) -> u32 {
    let want = BASE_MIB.saturating_add(PER_MOD_MIB.saturating_mul(mod_count.min(4096) as u32));

    let by_fraction = total_ram_mib.saturating_mul(RAM_FRACTION_NUM) / RAM_FRACTION_DEN;
    let by_reserve = total_ram_mib.saturating_sub(RESERVED_FOR_SYSTEM_MIB);
    let ceiling = by_fraction.min(by_reserve).min(u32::MAX as u64) as u32;

    let chosen = want.min(ceiling).min(MAX_HEAP_MIB);
    let stepped = chosen / STEP_MIB * STEP_MIB;
    stepped.max(MIN_HEAP_MIB)
}

/// How many mods a pack has, from the marker alone.
///
/// Prefers the managed set, which knows which files are mods. A pre-§9 marker
/// has no managed list, so `fileCount` is the only number available — it
/// over-counts (configs and overrides are in it), but over-counting biases the
/// heuristic UP, and the RAM ceiling makes that safe.
pub fn mod_count_of(marker: &Marker) -> usize {
    let managed = marker.managed.iter().filter(|f| f.is_mod).count();
    if managed > 0 {
        managed
    } else {
        marker.file_count
    }
}

// ── Resolution ─────────────────────────────────────────────────────────────

/// Fold the global settings and the per-pack override into the values a launch
/// actually uses.
///
/// `mod_count` comes from the marker when there is one and from the install plan
/// when there is not, so the very first install of a pack is already sized for
/// its own mod list rather than for a default.
pub fn resolve(
    settings: &Settings,
    over: &RuntimeOverride,
    mod_count: usize,
    total_ram_mib: u64,
) -> ResolvedRuntime {
    let recommended = recommended_heap_mib(mod_count, total_ram_mib);

    let (heap_mib, memory_source) = match &over.memory {
        MemoryChoice::Fixed { mib } => (*mib, RuntimeSource::Override),
        MemoryChoice::Auto => (recommended, RuntimeSource::Auto),
        // Inherit: the global setting may itself be automatic.
        MemoryChoice::Inherit if settings.memory_auto => (recommended, RuntimeSource::Auto),
        MemoryChoice::Inherit => (settings.memory_mib, RuntimeSource::Global),
    };

    let (java_path, java_source) = match &over.java {
        JavaChoice::Custom { path } => {
            let path = path.trim();
            if path.is_empty() {
                // A blank custom path is a half-finished edit, not a request to
                // launch with no JVM. Treated as "let the launcher decide" —
                // still an override, because the player did opt out of global.
                (None, RuntimeSource::Override)
            } else {
                (Some(path.to_string()), RuntimeSource::Override)
            }
        }
        JavaChoice::Auto => (None, RuntimeSource::Override),
        JavaChoice::Inherit => (
            settings.java_path().map(str::to_string),
            RuntimeSource::Global,
        ),
    };

    ResolvedRuntime {
        // Same clamp as the global setting, applied here so every consumer of
        // `heap_mib` — not just `xmx_arg` — sees a sane number.
        heap_mib: heap_mib.clamp(512, 65536),
        memory_source,
        java_path,
        java_source,
        mod_count,
        total_ram_mib,
        recommended_mib: recommended,
    }
}

// ── Physical RAM ───────────────────────────────────────────────────────────

/// Total physical RAM in MiB, or `None` when the platform will not say.
///
/// Deliberately dependency-light. `sysinfo` would pull a process/disk/network
/// enumerator into the binary for one number; on unix `sysconf` answers it in
/// two calls, and on Windows `GlobalMemoryStatusEx` is the documented API.
/// `libc` and `windows-sys` were already in the lock file as transitive
/// dependencies, so neither adds a crate to the build.
#[cfg(unix)]
pub fn total_ram_mib() -> Option<u64> {
    // SAFETY: sysconf takes an int and returns a long; there is no pointer and
    // no allocation. A negative return means "unlimited/unknown", which is why
    // both are checked before use.
    let pages = unsafe { libc::sysconf(libc::_SC_PHYS_PAGES) };
    let page_size = unsafe { libc::sysconf(libc::_SC_PAGESIZE) };
    if pages <= 0 || page_size <= 0 {
        return None;
    }
    Some((pages as u64).saturating_mul(page_size as u64) / (1024 * 1024))
}

#[cfg(windows)]
pub fn total_ram_mib() -> Option<u64> {
    use windows_sys::Win32::System::SystemInformation::{
        GlobalMemoryStatusEx, MEMORYSTATUSEX,
    };

    // SAFETY: the struct is plain old data and the API's whole contract is
    // "zero it, set dwLength, pass a pointer". Failure is reported through the
    // return value, which is checked.
    let mut status: MEMORYSTATUSEX = unsafe { std::mem::zeroed() };
    status.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
    let ok = unsafe { GlobalMemoryStatusEx(&mut status) };
    if ok == 0 {
        return None;
    }
    Some(status.ullTotalPhys / (1024 * 1024))
}

#[cfg(not(any(unix, windows)))]
pub fn total_ram_mib() -> Option<u64> {
    None
}

/// What to assume when the OS will not say. 8 GiB is the modal gaming machine,
/// and assuming it means the ceiling still bites: guessing HIGH here would be
/// the one way the heuristic could hand a small machine a swapping heap.
pub const ASSUMED_RAM_MIB: u64 = 8192;

pub fn total_ram_mib_or_assumed() -> u64 {
    total_ram_mib().filter(|mib| *mib >= 512).unwrap_or(ASSUMED_RAM_MIB)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::install::instance::{GameType, ManagedFile, ManagedSource};

    fn settings(memory_mib: u32, java: Option<&str>, auto: bool) -> Settings {
        Settings {
            memory_mib,
            java_path: java.map(str::to_string),
            memory_auto: auto,
            ..Settings::default()
        }
    }

    // ── the heuristic ──────────────────────────────────────────────────────

    #[test]
    fn a_small_machine_never_gets_a_heap_that_swaps() {
        // 8 GB with a 300-mod pack. The naive answer (2560 + 3600 = 6160 MiB)
        // leaves under 2 GB for Windows, the GPU driver and the JVM's own
        // off-heap use — which does not OOM, it swaps, and the player reports
        // that as the launcher freezing their PC.
        let heap = recommended_heap_mib(300, 8192);
        assert!(heap <= 8192 * 3 / 5, "must stay under 60% of RAM, got {heap}");
        assert!(8192 - heap as u64 >= 2048, "the OS must keep 2 GB");
        assert_eq!(heap, 4608);

        // 4 GB: the reserve, not the fraction, is the binding constraint.
        assert_eq!(recommended_heap_mib(300, 4096), 2048);

        // 2 GB: below anything workable, but still a heap the JVM accepts so the
        // player sees Minecraft's error and not the launcher's.
        assert_eq!(recommended_heap_mib(300, 2048), MIN_HEAP_MIB);

        // And nothing, whatever the mod count, ever exceeds the ceiling.
        for ram in [2048_u64, 4096, 8192, 16384, 32768, 65536] {
            for mods in [0_usize, 50, 300, 1000, 4000] {
                let heap = recommended_heap_mib(mods, ram) as u64;
                assert!(
                    heap <= (ram * 3 / 5).max(MIN_HEAP_MIB as u64),
                    "{mods} mods on {ram} MiB produced {heap}"
                );
            }
        }
    }

    #[test]
    fn a_huge_modpack_gets_far_more_than_the_two_gigabyte_default() {
        // §9's actual complaint: "not 2GB for a 300-mod pack". On a machine with
        // room, a 300-mod pack must be sized for 300 mods.
        let heap = recommended_heap_mib(300, 16384);
        assert_eq!(heap, 6144);
        assert!(heap > 4096, "a 300-mod pack must not be handed 2–4 GB");

        // Monotonic in the mod count, so a bigger pack is never given less.
        let mut previous = 0;
        for mods in [0, 50, 100, 200, 300, 500, 800] {
            let heap = recommended_heap_mib(mods, 32768);
            assert!(heap >= previous, "{mods} mods regressed to {heap}");
            previous = heap;
        }

        // Vanilla still gets a workable floor rather than the per-mod term alone.
        assert_eq!(recommended_heap_mib(0, 16384), 2560);

        // And a pathological mod count is capped rather than overflowing.
        assert_eq!(recommended_heap_mib(100_000, 131_072), MAX_HEAP_MIB);
    }

    #[test]
    fn every_result_is_a_round_number_the_slider_can_show() {
        for ram in [4096_u64, 8192, 12288, 16384, 24576] {
            for mods in [0_usize, 7, 214, 333] {
                let heap = recommended_heap_mib(mods, ram);
                assert!(
                    heap % STEP_MIB == 0 || heap == MIN_HEAP_MIB,
                    "{heap} is not a 512 MiB step"
                );
            }
        }
    }

    // ── resolution ─────────────────────────────────────────────────────────

    #[test]
    fn an_explicit_override_wins_over_everything() {
        let over = RuntimeOverride {
            memory: MemoryChoice::Fixed { mib: 10240 },
            java: JavaChoice::Custom {
                path: "/opt/jdk21/bin/java".into(),
            },
        };
        let resolved = resolve(&settings(4096, Some("/usr/bin/java"), true), &over, 300, 8192);

        // Not the global 4096, not the heuristic's 4608 — the number the player
        // typed for THIS pack.
        assert_eq!(resolved.heap_mib, 10240);
        assert_eq!(resolved.memory_source, RuntimeSource::Override);
        assert_eq!(resolved.java_path.as_deref(), Some("/opt/jdk21/bin/java"));
        assert_eq!(resolved.java_source, RuntimeSource::Override);
        assert_eq!(resolved.xmx_arg(), "-Xmx10240M");
        // The recommendation is still reported, so the UI can say "recomendado".
        assert_eq!(resolved.recommended_mib, 4608);
    }

    #[test]
    fn an_unset_pack_falls_back_to_the_global_setting() {
        let over = RuntimeOverride::default();
        let resolved = resolve(
            &settings(6144, Some("/usr/bin/java"), false),
            &over,
            300,
            16384,
        );
        assert_eq!(resolved.heap_mib, 6144);
        assert_eq!(resolved.memory_source, RuntimeSource::Global);
        assert_eq!(resolved.java_path.as_deref(), Some("/usr/bin/java"));
        assert_eq!(resolved.java_source, RuntimeSource::Global);
    }

    #[test]
    fn the_three_states_are_distinguishable() {
        let global = settings(6144, Some("/usr/bin/java"), false);

        let inherit = resolve(&global, &RuntimeOverride::default(), 300, 16384);
        assert_eq!(inherit.memory_source, RuntimeSource::Global);
        assert_eq!(inherit.java_source, RuntimeSource::Global);

        let auto = resolve(
            &global,
            &RuntimeOverride {
                memory: MemoryChoice::Auto,
                java: JavaChoice::Auto,
            },
            300,
            16384,
        );
        assert_eq!(auto.memory_source, RuntimeSource::Auto);
        assert_eq!(auto.heap_mib, 6144, "the heuristic, which here coincides");
        // Auto java is an OVERRIDE of the global path, not an inheritance of it:
        // that is the whole point of having a third state.
        assert_eq!(auto.java_source, RuntimeSource::Override);
        assert!(auto.java_path.is_none());

        let fixed = resolve(
            &global,
            &RuntimeOverride {
                memory: MemoryChoice::Fixed { mib: 2048 },
                java: JavaChoice::Custom { path: "  ".into() },
            },
            300,
            16384,
        );
        assert_eq!(fixed.memory_source, RuntimeSource::Override);
        assert_eq!(fixed.heap_mib, 2048);
        // A half-typed path must not launch with a broken JVM path.
        assert!(fixed.java_path.is_none());
        assert_eq!(fixed.java_source, RuntimeSource::Override);
    }

    #[test]
    fn a_global_auto_setting_reaches_a_pack_that_inherits() {
        let resolved = resolve(
            &settings(2048, None, true),
            &RuntimeOverride::default(),
            214,
            16384,
        );
        assert_eq!(resolved.memory_source, RuntimeSource::Auto);
        assert_eq!(resolved.heap_mib, recommended_heap_mib(214, 16384));
        assert!(resolved.summary().contains("214 mods"));
    }

    #[test]
    fn a_corrupt_override_cannot_produce_an_impossible_heap() {
        let resolved = resolve(
            &Settings::default(),
            &RuntimeOverride {
                memory: MemoryChoice::Fixed { mib: 0 },
                java: JavaChoice::Inherit,
            },
            10,
            8192,
        );
        assert_eq!(resolved.heap_mib, 512);
        assert_eq!(resolved.xmx_arg(), "-Xmx512M");
    }

    // ── persistence shape ──────────────────────────────────────────────────

    #[test]
    fn an_instance_with_no_runtime_file_inherits_everything() {
        // The file simply does not exist on any instance installed before this
        // build; `unwrap_or_default()` at the call site must mean "inherit".
        let over = RuntimeOverride::default();
        assert_eq!(over.memory, MemoryChoice::Inherit);
        assert_eq!(over.java, JavaChoice::Inherit);

        // And a partial file — one key, written by a future or older build —
        // must parse rather than reset the other one.
        let partial: RuntimeOverride =
            serde_json::from_str(r#"{"memory":{"mode":"auto"}}"#).expect("a partial file must load");
        assert_eq!(partial.memory, MemoryChoice::Auto);
        assert_eq!(partial.java, JavaChoice::Inherit);

        let empty: RuntimeOverride = serde_json::from_str("{}").expect("an empty file must load");
        assert_eq!(empty, RuntimeOverride::default());
    }

    #[test]
    fn the_runtime_wire_shape_is_tagged_camel_case() {
        let raw = serde_json::to_string(&RuntimeOverride {
            memory: MemoryChoice::Fixed { mib: 8192 },
            java: JavaChoice::Custom { path: "/j".into() },
        })
        .unwrap();
        assert!(raw.contains(r#""mode":"fixed""#), "{raw}");
        assert!(raw.contains(r#""mib":8192"#), "{raw}");
        assert!(raw.contains(r#""mode":"custom""#), "{raw}");

        let resolved = serde_json::to_string(&resolve(
            &Settings::default(),
            &RuntimeOverride::default(),
            3,
            8192,
        ))
        .unwrap();
        for key in [
            "heapMib",
            "memorySource",
            "javaPath",
            "javaSource",
            "modCount",
            "totalRamMib",
            "recommendedMib",
        ] {
            assert!(resolved.contains(key), "missing {key} in {resolved}");
        }
    }

    // ── mod counting ───────────────────────────────────────────────────────

    #[test]
    fn the_mod_count_comes_from_the_managed_set_and_falls_back_to_file_count() {
        let file = |path: &str, is_mod: bool| ManagedFile {
            path: path.into(),
            sha512: "aa".into(),
            size: 1,
            is_mod,
            optional: false,
            source: ManagedSource::Url { url: "https://x".into() },
        };
        let mut marker = Marker {
            version_id: "v".into(),
            version_name: "v".into(),
            minecraft: "1.21.4".into(),
            loader: None,
            loader_version: None,
            installed_at: "now".into(),
            file_count: 90,
            pack_id: "p".into(),
            managed: vec![
                file("mods/a.jar", true),
                file("mods/b.jar", true),
                file("config/c.toml", false),
            ],
            optional_files: vec![],
            pinned: false,
            game_type: GameType::Minecraft,
            emulator: None,
        };
        assert_eq!(mod_count_of(&marker), 2, "configs are not mods");

        // A pre-§9 marker has no managed list at all; `fileCount` over-counts,
        // which biases the heap UP — safe, because the RAM ceiling still caps it.
        marker.managed.clear();
        assert_eq!(mod_count_of(&marker), 90);
    }

    #[test]
    fn the_machines_ram_is_readable_and_plausible() {
        let ram = total_ram_mib_or_assumed();
        assert!(ram >= 512, "an implausible {ram} MiB would break the ceiling");
        assert!(ram < 16 * 1024 * 1024, "16 TiB is not a player's machine");
    }
}
