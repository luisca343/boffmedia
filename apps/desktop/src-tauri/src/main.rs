// Thin shim. The app lives in lib.rs so it stays reachable from integration
// tests and any future mobile target.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Named `_guard`, not `_`: dropping the guard shuts the Sentry client down,
    // and `let _ = ...` would drop it on this very line. It is None on any build
    // without a baked-in DSN, which is every build by default.
    let _guard = boffmedia_app_lib::crash_reports::init();
    boffmedia_app_lib::run()
}
