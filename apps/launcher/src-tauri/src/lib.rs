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
pub mod backups;
pub mod browse;
pub mod catalog;
pub mod datadir;
pub mod icons;
pub mod install;
pub mod local_packs;
pub mod meta;
pub mod mrpack;
pub mod pack;
pub mod settings;
pub mod worlds;
pub mod status;
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
        // RF-06/RF-07 file pickers for local pack export/import.
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Before anything reads the tree: move an install made by an
            // earlier build into `%APPDATA%\BoffLauncher[ Dev]` and flatten
            // away the old `<instance>/.minecraft` level.
            let handle = app.handle().clone();
            datadir::migrate(&handle);
            // The static `$APPDATA/icon-cache/**` scope in tauri.conf.json
            // resolves to the IDENTIFIER directory, which is no longer where
            // the cache lives — grant the real one at runtime or every icon
            // renders as a blank square.
            use tauri::Manager as _;
            if let Ok(root) = datadir::data_root(&handle) {
                let cache = root.join("icon-cache");
                let _ = std::fs::create_dir_all(&cache);
                app.asset_protocol_scope().allow_directory(&cache, true)?;

                // Verify rather than assume. `allow_directory` returning Ok
                // only means the pattern was accepted, NOT that a real file
                // under it matches — and the difference is invisible from the
                // renderer, where a denied path and a missing file both render
                // as a blank square. The data root contains a SPACE on the dev
                // profile ("BoffLauncher Dev"), which is exactly the kind of
                // thing that quietly breaks pattern matching, so ask the scope
                // about a concrete path shaped like a real cached icon.
                let probe = cache.join("0000000000000000000000000000000000000000000000000000000000000000.png");
                // stderr rather than a log crate: this project has none, and
                // `tauri dev` puts Rust's stderr straight in the terminal.
                if app.asset_protocol_scope().is_allowed(&probe) {
                    eprintln!("[icons] asset scope OK for {}", cache.display());
                } else {
                    // Loud on purpose: every icon in the app is broken when
                    // this happens, and it has no other symptom.
                    eprintln!(
                        "[icons] asset protocol scope REFUSES {} — every cached icon will fail to render",
                        probe.display()
                    );
                }
            }
            Ok(())
        })
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
            auth::auth_accounts,
            auth::auth_offline,
            auth::auth_switch,
            auth::auth_remove,
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
            status::server_status,
            local_packs::local_packs_list,
            local_packs::local_pack_get,
            local_packs::local_pack_save,
            local_packs::local_pack_delete,
            local_packs::local_pack_duplicate,
            backups::backup_create,
            backups::backup_list,
            backups::backup_restore,
            backups::backup_delete,
            local_packs::export_mrpack,
            local_packs::import_mrpack,
            local_packs::import_mrpack_url,
            // Version pickers for local packs. Upstream-direct: the API's own
            // meta routes are admin-only (see meta.rs).
            meta::meta_minecraft_versions,
            meta::meta_loader_versions,
            catalog::catalog_search,
            catalog::catalog_categories,
            catalog::catalog_project,
            catalog::catalog_project_summaries,
            catalog::catalog_versions,
            catalog::catalog_resolve_modrinth,
            catalog::catalog_resolve_url,
            icons::icon_cache,
            catalog::catalog_versions_by_ids,
            install::instance_content,
            browse::instance_browse,
            browse::instance_delete_path,
            browse::instance_reveal,
            worlds::instance_worlds,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Boff Launcher");
}
