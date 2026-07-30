// The Rust side of the launcher. Everything privileged lives here and is
// reached from the renderer only through explicitly registered commands —
// there is no equivalent of Electron's nodeIntegration to fall back on, which
// is one of the reasons this shell was chosen.
//
// ROADMAP (docs/LAUNCHER_HANDOFF.md):
//   §5 auth chain      — MS device code → Xbox → XSTS → Minecraft → profile
//   §6 install pipeline — version JSON, rules, natives, assets, Java, argv
//   §6.4 Forge/NeoForge — shell out to the official installer with the managed
//        JRE (`java -jar installer.jar --installClient`) via std::process,
//        NOT tauri-plugin-shell: that plugin exists to give the *renderer*
//        shell access, which this app deliberately does not want. Do not
//        reimplement install_profile.json processors; delegating to Forge's
//        own installer is what makes a Rust backend viable at all.

pub mod pack;

use serde::Serialize;

#[derive(Serialize)]
pub struct RuntimeInfo {
    pub platform: String,
    pub arch: String,
    pub tauri: String,
    pub app_version: String,
}

/// Mirrors what the Electron preload used to expose. The renderer treats a
/// failure here as "not running inside the shell" and degrades to browser mode,
/// so this must stay infallible.
#[tauri::command]
fn runtime_info(app: tauri::AppHandle) -> RuntimeInfo {
    use tauri::Manager;
    RuntimeInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        tauri: tauri::VERSION.to_string(),
        app_version: app
            .package_info()
            .version
            .to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running the Boff Launcher");
}
