// Thin shim. The app lives in lib.rs so it stays reachable from integration
// tests and any future mobile target.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    boffmedia_app_lib::run()
}
