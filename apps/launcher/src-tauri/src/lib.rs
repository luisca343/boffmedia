// The Rust side of the launcher. Everything privileged lives here and is
// reached from the renderer only through explicitly registered commands —
// there is no equivalent of Electron's nodeIntegration to fall back on, which
// is one of the reasons this shell was chosen.
//
// ROADMAP (docs/LAUNCHER_HANDOFF.md):
//   §5 auth chain      — MS device code → Xbox → XSTS → Minecraft → profile
//   §6 install pipeline — version JSON, rules, natives, assets, Java, argv
//   §6.4 Forge/NeoForge — handled by `portablemc::forge` (forge/mod.rs:40),
//        which downloads the official installer AND runs its
//        install_profile.json processors itself. An earlier note here said to
//        shell out to `java -jar installer.jar --installClient` by hand; that
//        is STALE and was written before the crate was read. Doing it by hand
//        now would mean re-solving library extraction, the processor graph and
//        the sha1 checks that the crate already does. §6.4's real rule —
//        "do not reimplement install_profile.json processors" — is satisfied by
//        delegating to portablemc, which delegates to Forge.
//
//        Still true, and the reason no shell plugin is used anywhere: the game
//        process is spawned with std::process from `install::process`, never
//        tauri-plugin-shell, whose purpose is handing the *renderer* shell
//        access — which this app deliberately does not want.

pub mod api;
pub mod auth;
pub mod install;
pub mod pack;
pub mod settings;
pub mod updates;

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
    RuntimeInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        tauri: tauri::VERSION.to_string(),
        app_version: app.package_info().version.to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // MUST be the first plugin registered — it aborts the second process
        // before any other plugin has set up state. The window is created
        // hidden and only revealed by the renderer (`revealWindow`), so a
        // second launch has to show() as well as focus: without it the user
        // sees nothing happen and clicks again.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            use tauri::Manager as _;
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        // The endpoint list from tauri.conf.json is only the default; every
        // check re-points it at `api::base_url()` (see updates.rs).
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updates::UpdateState::default())
        .manage(auth::AuthState::default())
        .manage(api::ApiState::default())
        .manage(install::InstallManager::default())
        .invoke_handler(tauri::generate_handler![
            runtime_info,
            auth::auth_begin,
            auth::auth_await,
            auth::auth_restore,
            auth::auth_logout,
            auth::auth_open_verification,
            api::packs_list,
            api::pack_manifest,
            api::invite_redeem,
            install::install_pack,
            install::launch_pack,
            install::stop_game,
            install::instance_scan,
            install::repair_instance,
            // §9 — locked vs. user space, and version rollback.
            install::instance_versions,
            install::instance_revert,
            install::instance_unpin,
            install::instance_optional,
            install::instance_optional_set,
            // §9 — per-instance Java runtime + memory.
            install::instance_runtime,
            install::instance_runtime_set,
            settings::settings_get,
            settings::settings_set,
            settings::plays_get,
            updates::updates_check,
            updates::updates_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Boff Launcher");
}
