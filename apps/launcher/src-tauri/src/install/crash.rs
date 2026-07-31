// Crash report parsing (§9). The single highest-leverage support tool: a player
// who reads "te falta Fabric API" does not open a ticket, and a player who is
// shown 4000 lines of log4j always does.
//
// The classifier is a TABLE, not a chain of ifs: adding a signature later must
// be one row. Rules are tried in order and the FIRST match wins, so the table is
// ordered by specificity — a mixin crash caused by a missing dependency should
// read as the missing dependency, because that is the one the player can fix.
//
// Matching is done on a lowercased copy of each line and every needle in `all`
// must appear in the SAME line. Cross-line correlation is deliberately not
// supported: Minecraft interleaves threads, so two lines being adjacent means
// nothing.

use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

use serde::Serialize;

/// How many trailing lines are kept for analysis. The interesting part of a
/// modded crash is always the tail (the crash report is printed last), and an
/// unbounded buffer would grow for the whole session.
pub const TAIL_LINES: usize = 600;

/// How many evidence lines a verdict carries. Enough to be convincing in the
/// UI, few enough that it stays a summary and not a second log panel.
const MAX_EVIDENCE: usize = 3;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CrashKind {
    MissingDependency,
    LoaderMismatch,
    MixinFailure,
    OutOfMemory,
    WrongJava,
    CorruptModJar,
    DuplicateMod,
}

/// One verdict, in the voice of `game.rs`: Spanish, plain language, and always
/// with something the player can actually do next.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnosis {
    pub kind: CrashKind,
    pub title: String,
    pub explanation: String,
    pub action: String,
    /// The log lines that triggered the verdict, verbatim. Without these a
    /// wrong diagnosis is unfalsifiable and the player cannot escalate.
    pub evidence: Vec<String>,
}

struct Rule {
    kind: CrashKind,
    /// Every needle must appear in the same line (already lowercased here).
    all: &'static [&'static str],
    title: &'static str,
    explanation: &'static str,
    action: &'static str,
}

/// Ordered by specificity: the first rule that matches wins.
const RULES: &[Rule] = &[
    // ── Missing dependencies ───────────────────────────────────────────────
    Rule {
        kind: CrashKind::MissingDependency,
        all: &["requires", "fabric api"],
        title: "Falta Fabric API",
        explanation:
            "Uno de los mods necesita Fabric API y no está instalado en esta instancia.",
        action: "Repara la instalación desde la ficha del pack; si el problema sigue, avisa a \
                 los administradores del pack: falta un mod obligatorio en el manifiesto.",
    },
    Rule {
        kind: CrashKind::MissingDependency,
        all: &["missing or unsupported mods"],
        title: "Faltan mods obligatorios",
        explanation:
            "El cargador de mods no ha podido resolver las dependencias: hay mods que exigen \
             otros que no están presentes, o que están en una versión distinta a la esperada.",
        action: "Repara la instalación para volver a descargar los mods. Si vuelve a ocurrir, \
                 el pack tiene una dependencia sin publicar: pásale estas líneas al equipo.",
    },
    Rule {
        kind: CrashKind::MissingDependency,
        all: &["missing mods"],
        title: "Faltan mods obligatorios",
        explanation:
            "Forge/NeoForge ha encontrado mods que dependen de otros que no están instalados.",
        action: "Repara la instalación. Si persiste, falta una dependencia en el pack: reporta \
                 estas líneas.",
    },
    Rule {
        kind: CrashKind::MissingDependency,
        all: &["mod resolution failed"],
        title: "No se pudieron resolver los mods",
        explanation:
            "El cargador no ha conseguido montar una combinación de mods válida; casi siempre \
             es una dependencia ausente o una versión incompatible entre dos mods.",
        action: "Repara la instalación y reinicia. Si el error se repite, comparte estas líneas \
                 con el equipo del pack.",
    },
    Rule {
        kind: CrashKind::MissingDependency,
        all: &["requires", "which is missing"],
        title: "Falta un mod requerido",
        explanation: "Un mod declara una dependencia que no está instalada.",
        action: "Repara la instalación desde la ficha del pack.",
    },
    Rule {
        kind: CrashKind::MissingDependency,
        all: &["unmet dependency"],
        title: "Dependencia sin cumplir",
        explanation: "Un mod exige otro mod (o una versión concreta de él) que no está presente.",
        action: "Repara la instalación; si continúa, reporta estas líneas al equipo del pack.",
    },
    // ── Loader / Minecraft version mismatch ────────────────────────────────
    Rule {
        kind: CrashKind::LoaderMismatch,
        all: &["requires minecraft"],
        title: "Mod para otra versión de Minecraft",
        explanation:
            "Hay un mod compilado para una versión de Minecraft distinta a la del pack. Eso \
             ocurre cuando se añade un mod a mano o cuando la instalación quedó a medias entre \
             dos actualizaciones.",
        action: "Quita los mods que hayas añadido tú a la carpeta de mods y repara la \
                 instalación para dejar el pack en su versión publicada.",
    },
    Rule {
        kind: CrashKind::LoaderMismatch,
        all: &["requires fabricloader"],
        title: "Versión del cargador incorrecta",
        explanation:
            "Un mod pide una versión de Fabric Loader distinta de la instalada por el pack.",
        action: "Repara la instalación para reinstalar el cargador en la versión del pack.",
    },
    Rule {
        kind: CrashKind::LoaderMismatch,
        all: &["incompatible mods found"],
        title: "Mods incompatibles entre sí",
        explanation:
            "El cargador ha detectado mods que no pueden convivir: normalmente uno es de otra \
             versión de Minecraft o del cargador.",
        action: "Repara la instalación y no vuelvas a copiar mods sueltos en la carpeta de mods.",
    },
    Rule {
        kind: CrashKind::LoaderMismatch,
        all: &["is not compatible with the current minecraft version"],
        title: "Mod incompatible con esta versión",
        explanation: "Un mod instalado no soporta la versión de Minecraft que usa el pack.",
        action: "Repara la instalación para volver al conjunto de mods publicado.",
    },
    Rule {
        kind: CrashKind::LoaderMismatch,
        all: &["classnotfoundexception", "net.minecraft.client.main.main"],
        title: "Instalación de Minecraft incompleta",
        explanation:
            "Falta el propio Minecraft en el classpath: la instalación del cargador o del juego \
             quedó incompleta o corrupta.",
        action: "Repara la instalación desde la ficha del pack; se volverá a descargar el juego \
                 y el cargador.",
    },
    // ── Mixins ─────────────────────────────────────────────────────────────
    Rule {
        kind: CrashKind::MixinFailure,
        all: &["mixin apply failed"],
        title: "Conflicto entre mods (mixin)",
        explanation:
            "Dos mods intentan modificar el mismo trozo del juego y uno de ellos ya no encaja. \
             Suele significar que un mod está en una versión distinta a la del resto del pack.",
        action: "Repara la instalación. Si el fallo persiste, copia el nombre del mod que \
                 aparece en estas líneas y repórtalo: es un conflicto del pack, no de tu equipo.",
    },
    Rule {
        kind: CrashKind::MixinFailure,
        all: &["invalidinjectionexception"],
        title: "Conflicto entre mods (mixin)",
        explanation:
            "Un mod no ha podido inyectar su código en el juego porque otro mod ya lo cambió o \
             porque la versión no coincide.",
        action: "Repara la instalación y reporta estas líneas si vuelve a ocurrir.",
    },
    Rule {
        kind: CrashKind::MixinFailure,
        all: &["mixintransformererror"],
        title: "Conflicto entre mods (mixin)",
        explanation: "Un mod falló al aplicar sus parches sobre el juego durante el arranque.",
        action: "Repara la instalación y reporta estas líneas si vuelve a ocurrir.",
    },
    Rule {
        kind: CrashKind::MixinFailure,
        all: &["org.spongepowered.asm.mixin"],
        title: "Conflicto entre mods (mixin)",
        explanation:
            "El sistema de parcheo de mods (Mixin) ha fallado durante el arranque, lo que casi \
             siempre indica dos mods pisándose.",
        action: "Repara la instalación y reporta estas líneas si vuelve a ocurrir.",
    },
    // ── Memoria ────────────────────────────────────────────────────────────
    Rule {
        kind: CrashKind::OutOfMemory,
        all: &["outofmemoryerror"],
        title: "El juego se quedó sin memoria",
        explanation:
            "La memoria asignada a Minecraft se agotó. Con packs grandes, 2 GB no bastan: lo \
             normal son 6-8 GB.",
        action: "Sube la memoria en Ajustes y vuelve a entrar. No asignes más de la mitad de la \
                 RAM de tu equipo: el sistema también necesita la suya.",
    },
    Rule {
        kind: CrashKind::OutOfMemory,
        all: &["java heap space"],
        title: "El juego se quedó sin memoria",
        explanation: "El montón de memoria de Java se llenó por completo durante la partida.",
        action: "Aumenta la memoria asignada en Ajustes.",
    },
    Rule {
        kind: CrashKind::OutOfMemory,
        all: &["gc overhead limit exceeded"],
        title: "Memoria insuficiente",
        explanation:
            "Java pasó más tiempo liberando memoria que ejecutando el juego: la asignada se \
             queda corta para este pack.",
        action: "Aumenta la memoria asignada en Ajustes.",
    },
    // ── Java ───────────────────────────────────────────────────────────────
    Rule {
        kind: CrashKind::WrongJava,
        all: &["unsupportedclassversionerror"],
        title: "Versión de Java incorrecta",
        explanation:
            "El juego se está ejecutando con una versión de Java más antigua de la que necesita \
             este pack.",
        action: "En Ajustes, borra la ruta de Java para que el lanzador instale y use la \
                 correcta automáticamente.",
    },
    Rule {
        kind: CrashKind::WrongJava,
        all: &["has been compiled by a more recent version of the java runtime"],
        title: "Versión de Java incorrecta",
        explanation: "El Java configurado es demasiado antiguo para los mods de este pack.",
        action: "En Ajustes, deja la ruta de Java vacía para que el lanzador use la adecuada.",
    },
    Rule {
        kind: CrashKind::WrongJava,
        all: &["unrecognized option"],
        title: "Java no acepta los argumentos de arranque",
        explanation:
            "La instalación de Java configurada a mano no entiende las opciones que necesita \
             Minecraft; suele ser una versión demasiado antigua o una JRE incompleta.",
        action: "En Ajustes, borra la ruta de Java para volver a la que gestiona el lanzador.",
    },
    // ── Archivos ───────────────────────────────────────────────────────────
    Rule {
        kind: CrashKind::DuplicateMod,
        all: &["duplicate mods found"],
        title: "Hay mods duplicados",
        explanation:
            "El mismo mod aparece dos veces en la carpeta de mods, normalmente en dos versiones \
             distintas. El cargador se niega a arrancar así.",
        action: "Borra las copias que hayas añadido tú y repara la instalación.",
    },
    Rule {
        kind: CrashKind::DuplicateMod,
        all: &["found a duplicate mod"],
        title: "Hay mods duplicados",
        explanation: "Dos archivos de la carpeta de mods declaran el mismo mod.",
        action: "Elimina el duplicado y repara la instalación.",
    },
    Rule {
        kind: CrashKind::CorruptModJar,
        all: &["zipexception"],
        title: "Un archivo de mod está dañado",
        explanation:
            "Un .jar no se puede leer: la descarga se cortó o el archivo se corrompió en disco.",
        action: "Repara la instalación para volver a descargar los archivos.",
    },
    Rule {
        kind: CrashKind::CorruptModJar,
        all: &["invalid or corrupt jarfile"],
        title: "Un archivo de mod está dañado",
        explanation: "El juego no ha podido abrir uno de los .jar del pack.",
        action: "Repara la instalación para descargarlo de nuevo.",
    },
    Rule {
        kind: CrashKind::CorruptModJar,
        all: &["error loading mod file"],
        title: "Un archivo de mod está dañado",
        explanation: "El cargador no ha podido leer uno de los archivos de la carpeta de mods.",
        action: "Repara la instalación desde la ficha del pack.",
    },
];

/// Classify a crash from the tail of the game log. `exit_code` is accepted so a
/// clean exit is never diagnosed — a player who quits normally must not be told
/// their pack is broken, however many scary WARN lines the session printed.
pub fn diagnose(exit_code: i32, tail: &[String]) -> Option<Diagnosis> {
    if exit_code == 0 {
        return None;
    }
    let lowered: Vec<String> = tail.iter().map(|l| l.to_lowercase()).collect();

    for rule in RULES {
        let evidence: Vec<String> = lowered
            .iter()
            .enumerate()
            .filter(|(_, low)| rule.all.iter().all(|needle| low.contains(needle)))
            .map(|(i, _)| tail[i].trim().to_string())
            .take(MAX_EVIDENCE)
            .collect();
        if evidence.is_empty() {
            continue;
        }
        return Some(Diagnosis {
            kind: rule.kind,
            title: rule.title.to_string(),
            explanation: rule.explanation.to_string(),
            action: rule.action.to_string(),
            evidence,
        });
    }
    None
}

/// The rolling window of game output the classifier reads. Shared between the
/// two reader threads and the exit watcher, so it must be cheap to push to:
/// nothing here allocates beyond the line itself.
#[derive(Clone, Default)]
pub struct LogTail(Arc<Mutex<VecDeque<String>>>);

impl LogTail {
    pub fn new() -> Self {
        Self(Arc::new(Mutex::new(VecDeque::with_capacity(TAIL_LINES))))
    }

    pub fn push(&self, line: &str) {
        let Ok(mut buf) = self.0.lock() else { return };
        if buf.len() == TAIL_LINES {
            buf.pop_front();
        }
        buf.push_back(line.to_string());
    }

    pub fn snapshot(&self) -> Vec<String> {
        self.0
            .lock()
            .map(|buf| buf.iter().cloned().collect())
            .unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lines(text: &str) -> Vec<String> {
        text.lines().map(|l| l.to_string()).collect()
    }

    // Real excerpts, trimmed. Each case names the kind the table must return.
    const CASES: &[(&str, CrashKind, &str)] = &[
        (
            "fabric missing dependency",
            CrashKind::MissingDependency,
            "[16:02:11] [main/ERROR]: Incompatible mods found!\n\
             net.fabricmc.loader.impl.FormattedException: Some of your mods are incompatible with the game or each other!\n\
             \tMod 'Sodium' (sodium) 0.5.8 requires any version of fabric api, which is missing!",
        ),
        (
            "forge missing mods screen",
            CrashKind::MissingDependency,
            "[18:22:04] [main/ERROR] [net.minecraftforge.fml.ModLoader/LOADING]: Missing Mods: jei\n\
             net.minecraftforge.fml.ModLoadingException: Mod jeitweaker requires jei",
        ),
        (
            "quilt mod resolution",
            CrashKind::MissingDependency,
            "org.quiltmc.loader.impl.FormattedException: Mod resolution failed\n\
             Unmet dependency listing",
        ),
        (
            "loader version mismatch",
            CrashKind::LoaderMismatch,
            "[main/ERROR]: Mod 'Iron Chests' (ironchest) 14.4.4 requires minecraft 1.20.1, but only 1.21.1 is present!",
        ),
        (
            "classpath gap (gotchas §10)",
            CrashKind::LoaderMismatch,
            "Error: Could not find or load main class net.minecraft.client.main.Main\n\
             Caused by: java.lang.ClassNotFoundException: net.minecraft.client.main.Main",
        ),
        (
            "mixin apply failure",
            CrashKind::MixinFailure,
            "[main/ERROR]: Mixin apply failed mixins.create.json:foundation.MixinLevelRenderer -> net.minecraft.class_761\n\
             org.spongepowered.asm.mixin.injection.throwables.InvalidInjectionException: Critical injection failure",
        ),
        (
            "oom heap",
            CrashKind::OutOfMemory,
            "[Render thread/FATAL]: Reported exception thrown!\n\
             java.lang.OutOfMemoryError: Java heap space\n\
             \tat java.base/java.util.Arrays.copyOf(Arrays.java:3537)",
        ),
        (
            "gc overhead",
            CrashKind::OutOfMemory,
            "java.lang.OutOfMemoryError: GC overhead limit exceeded",
        ),
        (
            "wrong java major",
            CrashKind::WrongJava,
            "Exception in thread \"main\" java.lang.UnsupportedClassVersionError: \
             net/minecraft/client/main/Main has been compiled by a more recent version of the \
             Java Runtime (class file version 65.0), this version of the Java Runtime only \
             recognizes class file versions up to 61.0",
        ),
        (
            "duplicate mod",
            CrashKind::DuplicateMod,
            "[main/ERROR]: Duplicate mods found: jei, jei\n\
             net.fabricmc.loader.impl.FormattedException",
        ),
        (
            "corrupt jar",
            CrashKind::CorruptModJar,
            "[main/ERROR]: Failed to read mods/create-1.20.1.jar\n\
             java.util.zip.ZipException: zip END header not found",
        ),
    ];

    #[test]
    fn every_case_lands_on_its_kind() {
        for (name, expected, log) in CASES {
            let verdict = diagnose(1, &lines(log))
                .unwrap_or_else(|| panic!("{name}: no diagnosis produced"));
            assert_eq!(verdict.kind, *expected, "{name}");
            assert!(!verdict.evidence.is_empty(), "{name}: no evidence");
            assert!(!verdict.action.is_empty(), "{name}: no action");
            // Evidence must be a VERBATIM log line, not the lowercased copy the
            // matcher works on — the player pastes this into a ticket.
            for line in &verdict.evidence {
                assert!(
                    log.contains(line.as_str()),
                    "{name}: evidence not found verbatim in the log"
                );
            }
        }
    }

    #[test]
    fn a_clean_exit_is_never_a_crash() {
        // Same log as a real OOM, but the process ended fine: diagnosing here
        // would tell a player who simply quit that their pack is broken.
        assert!(diagnose(0, &lines("java.lang.OutOfMemoryError: Java heap space")).is_none());
    }

    #[test]
    fn an_ordinary_session_yields_no_verdict() {
        let log = lines(
            "[16:00:00] [main/INFO]: Loading Minecraft 1.21.1 with Fabric Loader 0.16.5\n\
             [16:00:03] [main/WARN]: Mod X uses a deprecated API\n\
             [16:00:09] [Render thread/INFO]: Stopping!",
        );
        assert!(diagnose(1, &log).is_none());
    }

    #[test]
    fn a_missing_dependency_outranks_the_mixin_it_causes() {
        // Real shape: the dependency error is printed first, the mixin blow-up
        // is the SYMPTOM. Reporting the mixin sends the player down a rabbit
        // hole, so the table must order specificity over line order.
        let log = lines(
            "Mod 'Sodium' (sodium) requires any version of fabric api, which is missing!\n\
             org.spongepowered.asm.mixin.transformer.throwables.MixinApplyError: Mixin apply failed",
        );
        assert_eq!(diagnose(1, &log).unwrap().kind, CrashKind::MissingDependency);
    }

    #[test]
    fn the_tail_keeps_only_the_last_lines() {
        let tail = LogTail::new();
        for i in 0..(TAIL_LINES + 50) {
            tail.push(&format!("line {i}"));
        }
        let snapshot = tail.snapshot();
        assert_eq!(snapshot.len(), TAIL_LINES);
        assert_eq!(snapshot[0], format!("line {}", 50));
        assert_eq!(snapshot[TAIL_LINES - 1], format!("line {}", TAIL_LINES + 49));
    }

    #[test]
    fn the_verdict_matches_the_renderers_union() {
        // types.ts — kebab-case `kind`, camelCase fields.
        let json = serde_json::to_string(&Diagnosis {
            kind: CrashKind::CorruptModJar,
            title: "t".into(),
            explanation: "e".into(),
            action: "a".into(),
            evidence: vec!["l".into()],
        })
        .unwrap();
        assert!(json.contains(r#""kind":"corrupt-mod-jar""#));
        assert!(json.contains(r#""evidence":["l"]"#));
    }
}
