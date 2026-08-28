// The JVM-argument allowlist. A hand-written mirror of `judgeJvmArg` /
// `sanitizeJvmArgs` in packages/pack-schema/src/boffmedia.ts.
//
// WHY IT IS DUPLICATED AND NOT GENERATED. `emit-schema.mjs` drops zod
// refinements silently, so nothing in the generated `pack_schema.rs` knows this
// rule exists (pack.rs says the same about the other refinements). If you change
// the grammar in boffmedia.ts, change it here — the tests at the bottom pin the
// exact cases the TS tests pin, so a divergence shows up as a failing test in
// one language or the other rather than as a pack that installs differently
// from how it validated.
//
// WHY AN ALLOWLIST AT ALL, given a modpack already ships mod jars and therefore
// already runs arbitrary code: two capabilities are NOT already granted, and an
// unfiltered arg list hands over both.
//
//   1. `-XX:OnError=` and `-XX:OnOutOfMemoryError=` run an arbitrary OS command
//      — a shell, outside the JVM — on a crash the player will read as the pack
//      being buggy.
//   2. Every byte a pack ships passes through `files[]`: a declared source, a
//      sha512, our blob store. `-javaagent:C:\Users\x\Downloads\evil.jar` loads
//      code that was in no manifest and was never hashed.
//
// So the grammar below is positive: an argument is rejected unless it matches a
// shape known to be inert. Notably no accepted shape can express a filesystem
// path — `/`, `\` and `:` are outside every value character class. The one `/`
// that is allowed, in `--add-opens`, is a module separator whose grammar admits
// no drive letter and no `..`.

/// Longest single argument accepted. Mirrors `JVM_ARG_MAX_LEN`.
pub const JVM_ARG_MAX_LEN: usize = 256;

/// Most arguments accepted from one source. Mirrors `JVM_ARGS_MAX`.
pub const JVM_ARGS_MAX: usize = 32;

/// Why an argument was rejected. Mirrors `JvmArgRejection`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Rejection {
    /// `-Xmx…`: not dangerous, UNREACHABLE. `game::install` appends the resolved
    /// heap last so it beats the version metadata, which means a pack's own
    /// `-Xmx` could never take effect. Routed to `memoryMib` instead.
    Heap,
    /// Can run a command or load code from a path no manifest verified.
    Denied,
    /// Not a recognised tuning flag.
    Malformed,
}

impl Rejection {
    /// The phrase that goes in the install log beside the dropped argument.
    /// Spanish, like every other player-facing string the installer emits.
    pub fn reason(self) -> &'static str {
        match self {
            Rejection::Heap => "usa la memoria del pack en su lugar",
            Rejection::Denied => "puede ejecutar comandos o cargar código sin verificar",
            Rejection::Malformed => "no es un parámetro de ajuste reconocido",
        }
    }
}

/// Flags that can run a command or load code from an unverified path. Compared
/// lowercase; a match must end at a non-word character so `-Xbootclasspath/a:`
/// and `-XX:OnError=` are caught while a longer legitimate flag that merely
/// starts with the same letters is not. Mirrors `JVM_DENY_PREFIXES`.
const DENY_PREFIXES: [&str; 17] = [
    "-javaagent",
    "-agentlib",
    "-agentpath",
    "-xx:onerror",
    "-xx:onoutofmemoryerror",
    "-xx:flightrecorderoptions",
    "-xx:startflightrecording",
    "-xx:+startflightrecording",
    "-xx:compilecommand",
    "-xbootclasspath",
    "-xshare",
    "-cp",
    "-classpath",
    "--class-path",
    "--patch-module",
    "--module-path",
    "--upgrade-module-path",
];

/// `-D` keys reserved to the platform and the launcher. Mod-facing keys
/// (`fml.*`, `mixin.*`) stay allowed. Mirrors `JVM_DENY_PROPERTY_PREFIXES`.
const DENY_PROPERTY_PREFIXES: [&str; 5] = ["java.", "javax.", "jdk.", "sun.", "boffmedia."];

/// `s` is between `min` and `max` characters and every one satisfies `ok`.
fn chars_in(s: &str, min: usize, max: usize, ok: impl Fn(char) -> bool) -> bool {
    let mut count = 0;
    for c in s.chars() {
        if !ok(c) {
            return false;
        }
        count += 1;
        if count > max {
            return false;
        }
    }
    count >= min
}

fn is_name(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// `-Xms2G`, `-Xmn512M`, `-Xss1M`. `-Xmx` is deliberately absent.
fn is_x_size(arg: &str) -> bool {
    let rest = match arg.strip_prefix("-Xms") {
        Some(r) => r,
        None => match arg.strip_prefix("-Xmn") {
            Some(r) => r,
            None => match arg.strip_prefix("-Xss") {
                Some(r) => r,
                None => return false,
            },
        },
    };
    let digits = rest.trim_end_matches(['k', 'K', 'm', 'M', 'g', 'G']);
    // Exactly zero or one unit suffix, and 1..=6 digits before it.
    rest.len() - digits.len() <= 1 && chars_in(digits, 1, 6, |c| c.is_ascii_digit())
}

/// `-XX:+UseG1GC`, `-XX:-OmitStackTraceInFastThrow`.
fn is_xx_bool(arg: &str) -> bool {
    match arg.strip_prefix("-XX:") {
        Some(rest) if rest.starts_with('+') || rest.starts_with('-') => {
            chars_in(&rest[1..], 1, 64, is_name)
        }
        _ => false,
    }
}

/// `-XX:MaxGCPauseMillis=50`. The value class excludes `/`, `\` and `:`, so no
/// `-XX:Something=<path>` is expressible.
fn is_xx_value(arg: &str) -> bool {
    let rest = match arg.strip_prefix("-XX:") {
        Some(r) => r,
        None => return false,
    };
    match rest.split_once('=') {
        Some((name, value)) => {
            chars_in(name, 1, 64, is_name)
                && chars_in(value, 1, 64, |c| {
                    c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | '%' | '-')
                })
        }
        None => false,
    }
}

/// `-Dmixin.debug=true`. Same no-path rule on the value.
fn is_property(arg: &str) -> bool {
    let rest = match arg.strip_prefix("-D") {
        Some(r) => r,
        None => return false,
    };
    match rest.split_once('=') {
        Some((key, value)) => {
            chars_in(key, 1, 64, |c| {
                c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | '-')
            }) && chars_in(value, 0, 128, |c| {
                c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | ',' | '%' | '+' | '-')
            })
        }
        None => false,
    }
}

/// `--add-opens=java.base/java.lang=ALL-UNNAMED`. Allowed because modern loaders
/// genuinely need it and it grants nothing a mod jar does not already have.
fn is_add_module(arg: &str) -> bool {
    let rest = match arg.strip_prefix("--add-opens=") {
        Some(r) => r,
        None => match arg.strip_prefix("--add-exports=") {
            Some(r) => r,
            None => return false,
        },
    };
    let (module, tail) = match rest.split_once('/') {
        Some(pair) => pair,
        None => return false,
    };
    let (package, target) = match tail.split_once('=') {
        Some(pair) => pair,
        None => return false,
    };
    chars_in(module, 1, 64, |c| c.is_ascii_alphanumeric() || matches!(c, '_' | '.'))
        && chars_in(package, 1, 64, |c| {
            c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | '$')
        })
        && chars_in(target, 1, 64, |c| {
            c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | ',' | '$' | '-')
        })
}

/// Judge one argument. Order matters: `-Xmx`, the deny list and the reserved
/// `-D` keys are checked BEFORE the grammar, so a rejected flag reports why it
/// was rejected rather than the generic `Malformed`.
pub fn judge(raw: &str) -> Result<String, (String, Rejection)> {
    let arg = raw.trim();
    if arg.is_empty() || arg.len() > JVM_ARG_MAX_LEN {
        return Err((arg.to_string(), Rejection::Malformed));
    }
    let lower = arg.to_ascii_lowercase();

    if lower.starts_with("-xmx") {
        return Err((arg.to_string(), Rejection::Heap));
    }

    let denied = |prefix: &str| {
        lower == prefix
            || (lower.starts_with(prefix)
                && !lower[prefix.len()..]
                    .chars()
                    .next()
                    .is_some_and(|c| c.is_ascii_alphanumeric() || c == '_'))
    };
    if DENY_PREFIXES.iter().any(|p| denied(p)) {
        return Err((arg.to_string(), Rejection::Denied));
    }

    // Before the grammar, so `-Djava.library.path=C:\evil` reports the honest
    // reason (reserved key) rather than the incidental one (the value holds a
    // path, so it is also malformed).
    if let Some(rest) = lower.strip_prefix("-d") {
        let key = rest.split('=').next().unwrap_or("");
        if DENY_PROPERTY_PREFIXES.iter().any(|p| key.starts_with(p)) {
            return Err((arg.to_string(), Rejection::Denied));
        }
    }

    if is_property(arg) || is_x_size(arg) || is_xx_bool(arg) || is_xx_value(arg) || is_add_module(arg)
    {
        Ok(arg.to_string())
    } else {
        Err((arg.to_string(), Rejection::Malformed))
    }
}

/// Split a proposed list into what survives and what does not, deduplicated and
/// capped. Mirrors `sanitizeJvmArgs`.
///
/// Run on pack-supplied arguments even though the dashboard already rejects a
/// bad publish: an instance can be seeded from a manifest published before a
/// rule existed, and the drops belong in the install log either way.
pub fn sanitize<S: AsRef<str>>(args: &[S]) -> (Vec<String>, Vec<(String, Rejection)>) {
    let mut kept: Vec<String> = Vec::new();
    let mut dropped = Vec::new();
    for raw in args.iter().take(JVM_ARGS_MAX) {
        match judge(raw.as_ref()) {
            Err(rejection) => dropped.push(rejection),
            // A duplicated flag is not an error, but passing it twice is noise
            // in the argv and in every crash report that quotes it.
            Ok(arg) if kept.contains(&arg) => {}
            Ok(arg) => kept.push(arg),
        }
    }
    (kept, dropped)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_tuning_flags_a_real_modpack_ships_are_accepted() {
        for arg in [
            "-Xms2G",
            "-Xmn512M",
            "-Xss1M",
            "-XX:+UseG1GC",
            "-XX:-OmitStackTraceInFastThrow",
            "-XX:MaxGCPauseMillis=50",
            "-XX:G1NewSizePercent=20",
            "-XX:MaxRAMPercentage=75.5",
            "-Dmixin.debug=true",
            "-Dfml.ignorePatchDiscrepancies=true",
            "--add-opens=java.base/java.lang=ALL-UNNAMED",
            "--add-exports=java.base/sun.nio.ch=ALL-UNNAMED",
        ] {
            assert_eq!(judge(arg), Ok(arg.to_string()), "{arg} should be accepted");
        }
    }

    #[test]
    fn the_pack_heap_flag_is_rejected_as_heap_not_as_junk() {
        // The distinction is the whole point: an author who typed -Xmx6G must be
        // told to use the pack's memory field, because the launcher appends the
        // resolved -Xmx last and theirs would vanish without a word.
        assert_eq!(judge("-Xmx8G").unwrap_err().1, Rejection::Heap);
        assert_eq!(judge("-Xmx6144M").unwrap_err().1, Rejection::Heap);
        assert_eq!(judge("-XMX8G").unwrap_err().1, Rejection::Heap);
    }

    #[test]
    fn nothing_that_runs_a_command_or_loads_unhashed_code_survives() {
        for arg in [
            r"-javaagent:C:\Users\x\Downloads\evil.jar",
            "-agentlib:jdwp=transport=dt_socket,server=y,address=5005",
            "-agentpath:/tmp/x.so",
            "-XX:OnError=cmd /c calc.exe",
            "-XX:OnOutOfMemoryError=kill -9 %p",
            "-XX:StartFlightRecording=filename=/tmp/x.jfr",
            "-XX:CompileCommand=print,*.*",
            r"-Xbootclasspath/a:/tmp/x.jar",
            "-cp:/tmp/x.jar",
            "--patch-module=java.base=/tmp/x.jar",
            "--module-path=/tmp",
        ] {
            assert_eq!(
                judge(arg).unwrap_err().1,
                Rejection::Denied,
                "{arg} must be denied"
            );
        }
        // Case is not a bypass.
        assert_eq!(judge("-XX:onerror=calc").unwrap_err().1, Rejection::Denied);
        assert_eq!(judge("-JavaAgent:x.jar").unwrap_err().1, Rejection::Denied);
    }

    #[test]
    fn platform_properties_are_reserved_but_mod_properties_are_not() {
        for arg in [
            r"-Djava.library.path=C:\evil",
            "-Djava.security.manager=allow",
            "-Djdk.attach.allowAttachSelf=true",
            "-Dsun.misc.x=1",
            "-Dboffmedia.session=stolen",
        ] {
            assert_eq!(
                judge(arg).unwrap_err().1,
                Rejection::Denied,
                "{arg} must be denied"
            );
        }
        assert!(judge("-Dmixin.debug.verbose=true").is_ok());
    }

    #[test]
    fn no_accepted_shape_can_carry_a_filesystem_path() {
        // This is a property of the GRAMMAR, not of the deny list: every value
        // character class excludes `/`, `\` and `:`.
        for arg in [
            r"-XX:HeapDumpPath=C:\Users\x",
            "-XX:LogFile=/tmp/x",
            "-Dfoo=/etc/passwd",
            r"-Dfoo=C:\x",
            "--add-opens=../../evil/x=ALL-UNNAMED",
        ] {
            assert!(judge(arg).is_err(), "{arg} must not be accepted");
        }
    }

    #[test]
    fn junk_is_dropped_duplicates_collapse_and_the_list_is_capped() {
        let (kept, dropped) = sanitize(&[
            "-XX:+UseG1GC",
            "-XX:+UseG1GC",
            "  -Xms2G  ",
            "rm -rf /",
            "",
        ]);
        assert_eq!(kept, vec!["-XX:+UseG1GC".to_string(), "-Xms2G".to_string()]);
        assert_eq!(dropped.len(), 2);
        assert!(dropped.iter().all(|(_, r)| *r == Rejection::Malformed));

        let many = vec!["-XX:+UseG1GC"; 50];
        assert_eq!(sanitize(&many).0.len(), 1);

        // The cap applies to what is READ, so 50 distinct args yield at most 32.
        let distinct: Vec<String> = (0..50).map(|i| format!("-XX:Foo{i}=1")).collect();
        assert_eq!(sanitize(&distinct).0.len(), JVM_ARGS_MAX);
    }

    #[test]
    fn an_oversized_argument_is_rejected_before_anything_parses_it() {
        let long = format!("-XX:+Use{}", "A".repeat(JVM_ARG_MAX_LEN));
        assert_eq!(judge(&long).unwrap_err().1, Rejection::Malformed);
    }
}
