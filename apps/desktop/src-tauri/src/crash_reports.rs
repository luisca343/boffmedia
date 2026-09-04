// Crash reporting for the Rust side of the app (audit X5) — OPT-IN, and silent
// until the player says otherwise.
//
// THREE gates, all of which have to be open before a single byte leaves the
// machine:
//
//   1. A DSN baked in at BUILD time (`BOFF_SENTRY_DSN`). A build without one
//      never calls `sentry::init` at all: no client, no transport thread, no
//      warning. That is what keeps a `cargo run`, a fork's build and CI inert.
//   2. The player's `crashReports` setting (settings.rs, default false). It is
//      read into `ENABLED` once settings load and again whenever the toggle in
//      Ajustes moves.
//   3. `before_send`, which drops the event outright while `ENABLED` is false
//      and scrubs it when it is true.
//
// Gate 3 is what makes gate 2 honest. The client cannot be un-initialised once
// it exists, so checking the flag only at startup would mean a player who turns
// reporting off keeps reporting until they relaunch — which is not what the
// switch says. Checking it inside `before_send` makes "off" immediate, and it
// also means `ENABLED` starting false covers everything that could go wrong
// between process start and the moment settings load.
//
// The renderer half of this lives in src/services/crashReports.ts and follows
// the same three gates with its own DSN and its own scrubber.

use std::sync::atomic::{AtomicBool, Ordering};

use sentry::protocol::{Breadcrumb, Event, Map, Value};

/// Compile-time, not runtime: a player's machine has no environment to read a
/// DSN out of, so it is either in the binary or it does not exist.
const DSN: Option<&str> = option_env!("BOFF_SENTRY_DSN");

/// Starts false on purpose. See gate 3 above.
static ENABLED: AtomicBool = AtomicBool::new(false);

const REDACTED: &str = "[redacted]";
const MAX_DEPTH: usize = 8;

/// Apply the player's choice. Called once when settings load (lib.rs `setup`)
/// and again on every save (`settings::settings_set`).
pub fn set_enabled(on: bool) {
    ENABLED.store(on, Ordering::Relaxed);
}

fn enabled() -> bool {
    ENABLED.load(Ordering::Relaxed)
}

/// Start the client, if this build has a DSN. The returned guard MUST be held
/// for the life of the process — dropping it shuts the client down, so binding
/// it to `_` instead of a named `_guard` would end reporting on the next line.
/// That is why main.rs owns it rather than this module.
pub fn init() -> Option<sentry::ClientInitGuard> {
    let dsn = DSN?.trim();
    if dsn.is_empty() {
        return None;
    }

    // Built by mutation, not a struct literal: `ClientOptions` is
    // `#[non_exhaustive]`, so a literal (even one ending in `..Default::default()`)
    // does not compile from outside the crate.
    let mut options = sentry::ClientOptions::default();
    options.release = Some(std::borrow::Cow::Borrowed(concat!(
        "boffmedia-app@",
        env!("CARGO_PKG_VERSION")
    )));
    options.environment = Some(std::borrow::Cow::Borrowed(if cfg!(debug_assertions) {
        "development"
    } else {
        "production"
    }));
    // With this off the SDK does not attach the user, their IP or the machine
    // name in the first place. `before_send` still runs, because the fields
    // that leak are the ones WE wrote.
    options.send_default_pii = false;
    options.before_send = Some(std::sync::Arc::new(|event| {
        if !enabled() {
            return None;
        }
        Some(scrub_event(event))
    }));
    options.before_breadcrumb = Some(std::sync::Arc::new(|breadcrumb| {
        if !enabled() {
            return None;
        }
        Some(scrub_breadcrumb(breadcrumb))
    }));

    let guard = sentry::init((dsn, options));

    // Release correlation needs the platform as well as the version: the same
    // build behaves differently on WebView2 and WebKitGTK, and a crash that
    // only happens on one of them is unreadable without knowing which.
    sentry::configure_scope(|scope| {
        scope.set_tag("surface", "rust");
        scope.set_tag("platform", std::env::consts::OS);
        scope.set_tag("arch", std::env::consts::ARCH);
    });

    Some(guard)
}

// ── Scrubbing ───────────────────────────────────────────────────────────────

fn scrub_event(mut event: Event<'static>) -> Event<'static> {
    // Nothing in these three is worth keeping: `user` would hold the Boffmedia
    // email or the Minecraft UUID, `request` the URLs and headers of our own
    // API calls, and `server_name` the machine's hostname — which on a home PC
    // is very often the owner's own name.
    event.user = None;
    event.request = None;
    event.server_name = None;

    if let Some(message) = event.message.take() {
        event.message = Some(scrub_text(&message));
    }
    if let Some(culprit) = event.culprit.take() {
        event.culprit = Some(scrub_text(&culprit));
    }
    for exception in event.exception.values.iter_mut() {
        if let Some(value) = exception.value.take() {
            exception.value = Some(scrub_text(&value));
        }
    }
    for breadcrumb in event.breadcrumbs.values.iter_mut() {
        scrub_breadcrumb_in_place(breadcrumb);
    }
    scrub_map(&mut event.extra);
    for value in event.tags.values_mut() {
        *value = scrub_text(value);
    }
    event
}

fn scrub_breadcrumb(mut breadcrumb: Breadcrumb) -> Breadcrumb {
    scrub_breadcrumb_in_place(&mut breadcrumb);
    breadcrumb
}

fn scrub_breadcrumb_in_place(breadcrumb: &mut Breadcrumb) {
    if let Some(message) = breadcrumb.message.take() {
        breadcrumb.message = Some(scrub_text(&message));
    }
    scrub_map(&mut breadcrumb.data);
}

fn scrub_map(map: &mut Map<String, Value>) {
    for (key, value) in map.iter_mut() {
        if is_sensitive_key(key) {
            *value = Value::String(REDACTED.to_string());
        } else {
            scrub_json(value, 0);
        }
    }
}

fn scrub_json(value: &mut Value, depth: usize) {
    if depth >= MAX_DEPTH {
        *value = Value::String(REDACTED.to_string());
        return;
    }
    match value {
        Value::String(text) => *text = scrub_text(text),
        Value::Array(items) => {
            for item in items.iter_mut() {
                scrub_json(item, depth + 1);
            }
        }
        Value::Object(fields) => {
            for (key, item) in fields.iter_mut() {
                if is_sensitive_key(key) {
                    *item = Value::String(REDACTED.to_string());
                } else {
                    scrub_json(item, depth + 1);
                }
            }
        }
        _ => {}
    }
}

/// Substring match on a lowercased key, so `X-Refresh-Token`, `accessToken` and
/// `mc_uuid` all hit without anyone maintaining a list of exact spellings.
fn is_sensitive_key(key: &str) -> bool {
    const NEEDLES: [&str; 12] = [
        "authorization",
        "cookie",
        "token",
        "secret",
        "password",
        "api_key",
        "apikey",
        "jwt",
        "credential",
        "email",
        "correo",
        "uuid",
    ];
    let lower = key.to_ascii_lowercase();
    NEEDLES.iter().any(|needle| lower.contains(needle))
}

/// Hand-rolled rather than a regex crate: the whole scrubber stays one screen
/// of code this way, and adding `regex` to the dependency tree of a shipped
/// desktop binary to match five fixed shapes is not a trade worth making.
///
/// It splits the text into tokens on anything that cannot be part of an email,
/// a UUID, an address or a JWT, classifies each token, and puts the separators
/// back untouched.
fn scrub_text(input: &str) -> String {
    let input = redact_home(input);
    let mut out = String::with_capacity(input.len());
    let mut token = String::new();

    for ch in input.chars() {
        if is_token_char(ch) {
            token.push(ch);
        } else {
            flush_token(&mut token, &mut out);
            out.push(ch);
        }
    }
    flush_token(&mut token, &mut out);
    out
}

fn flush_token(token: &mut String, out: &mut String) {
    if token.is_empty() {
        return;
    }
    if is_sensitive_token(token) {
        out.push_str(REDACTED);
    } else {
        out.push_str(token);
    }
    token.clear();
}

/// `.`, `@`, `-`, `_` and `+` stay INSIDE a token so an email, a dashed UUID, a
/// dotted address and a JWT each reach the classifier whole. Path separators
/// deliberately do not: a path is handled by `redact_home`, and keeping `\` out
/// of a token means `…\config\options.txt` still reads as itself.
fn is_token_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || matches!(ch, '.' | '@' | '-' | '_' | '+')
}

fn is_sensitive_token(token: &str) -> bool {
    is_email(token) || is_uuid(token) || is_hex32(token) || is_ipv4(token) || is_jwt(token)
}

fn is_email(token: &str) -> bool {
    let Some((local, domain)) = token.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && !domain.contains('@')
}

/// The dashed Mojang form.
fn is_uuid(token: &str) -> bool {
    let bytes = token.as_bytes();
    if bytes.len() != 36 {
        return false;
    }
    bytes.iter().enumerate().all(|(i, b)| match i {
        8 | 13 | 18 | 23 => *b == b'-',
        _ => b.is_ascii_hexdigit(),
    })
}

/// The undashed 32-hex form the game itself uses. Exactly 32: a sha256 (64) or
/// a sha512 (128) is a content hash, not an identity, and redacting those would
/// cost us the one thing that makes a failed download diagnosable.
fn is_hex32(token: &str) -> bool {
    token.len() == 32 && token.bytes().all(|b| b.is_ascii_hexdigit())
}

/// A pack server address the player typed in says who they play with. The port
/// is separated by `:`, which is not a token char, so only the address itself
/// reaches here.
fn is_ipv4(token: &str) -> bool {
    let parts: Vec<&str> = token.split('.').collect();
    parts.len() == 4
        && parts.iter().all(|part| {
            !part.is_empty()
                && part.len() <= 3
                && part.bytes().all(|b| b.is_ascii_digit())
                && part.parse::<u16>().map(|n| n <= 255).unwrap_or(false)
        })
}

fn is_jwt(token: &str) -> bool {
    token.starts_with("eyJ") && token.matches('.').count() >= 2
}

/// The leak that only exists on a desktop app: a file path names the OS
/// account. `C:\Users\luisca\AppData\…` identifies the person as surely as
/// their email does, and most of the error strings this side produces are paths.
///
/// The bare-username pass is deliberately blunt — it also hits the word when it
/// happens to appear in ordinary prose. Redacting a word costs a little
/// readability; leaking the account name is not recoverable, so the trade goes
/// this way. The four-character floor is what keeps a short account name from
/// shredding every message.
fn redact_home(input: &str) -> String {
    let mut out = input.to_string();
    for var in ["USERPROFILE", "HOME"] {
        if let Ok(home) = std::env::var(var) {
            let home = home.trim_end_matches(['\\', '/']);
            if home.len() >= 4 {
                out = out.replace(home, "~");
            }
        }
    }
    for var in ["USERNAME", "USER"] {
        if let Ok(user) = std::env::var(var) {
            if user.len() >= 4 {
                out = out.replace(&user, REDACTED);
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_email_is_redacted_wherever_it_sits_in_the_text() {
        assert_eq!(
            scrub_text("no account for someone@example.com, sorry"),
            format!("no account for {REDACTED}, sorry")
        );
    }

    // rotom_users.uuid is an FK in 27 tables, so it reaches this side inside
    // ordinary error strings far more often than in a field named `uuid`.
    #[test]
    fn a_minecraft_uuid_is_redacted_in_both_forms() {
        assert_eq!(
            scrub_text("profile 069a79f4-44e9-4726-a5be-fca90e38aaf5 failed"),
            format!("profile {REDACTED} failed")
        );
        assert_eq!(
            scrub_text("profile 069a79f444e94726a5befca90e38aaf5 failed"),
            format!("profile {REDACTED} failed")
        );
    }

    // The regression this guards: redacting every hex run would eat the sha512
    // out of "checksum mismatch", which is the only thing that makes a bad
    // download diagnosable.
    #[test]
    fn a_content_hash_survives() {
        let sha256 = "a".repeat(64);
        assert!(scrub_text(&format!("sha256 {sha256}")).contains(&sha256));
    }

    #[test]
    fn an_address_and_a_jwt_are_redacted() {
        assert_eq!(
            scrub_text("connect 203.0.113.9:25565"),
            format!("connect {REDACTED}:25565")
        );
        assert_eq!(
            scrub_text("token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig"),
            format!("token {REDACTED}")
        );
    }

    #[test]
    fn a_version_number_is_not_mistaken_for_an_address() {
        assert_eq!(scrub_text("pack 1.20.1 ready"), "pack 1.20.1 ready");
    }

    #[test]
    fn sensitive_keys_are_matched_however_they_are_spelled() {
        assert!(is_sensitive_key("Authorization"));
        assert!(is_sensitive_key("accessToken"));
        assert!(is_sensitive_key("mc_uuid"));
        assert!(!is_sensitive_key("packId"));
    }

    #[test]
    fn nested_extra_data_is_scrubbed() {
        let mut value = serde_json::json!({
            "player": "someone@example.com",
            "nested": { "authToken": "abc", "keep": "ok" }
        });
        scrub_json(&mut value, 0);
        assert_eq!(value["player"], Value::String(REDACTED.to_string()));
        assert_eq!(
            value["nested"]["authToken"],
            Value::String(REDACTED.to_string())
        );
        assert_eq!(value["nested"]["keep"], Value::String("ok".to_string()));
    }

    // Gate 3: nothing leaves while the player has not opted in — which is also
    // the state every build is in before settings have loaded.
    #[test]
    fn reporting_is_off_until_it_is_switched_on() {
        assert!(!enabled());
        set_enabled(true);
        assert!(enabled());
        set_enabled(false);
        assert!(!enabled());
    }
}
