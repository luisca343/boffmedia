// The Rust side of the launcher. Everything privileged lives here and is
// reached from the renderer only through explicitly registered commands —
// there is no equivalent of Electron's nodeIntegration to fall back on, which
// is one of the reasons this shell was chosen.
//
// The three pieces:
//   auth chain       — MS device code → Xbox → XSTS → Minecraft → profile
//   install pipeline — version JSON, rules, natives, assets, Java, argv
//   Forge/NeoForge   — handled by `portablemc::forge` (forge/mod.rs:40), which
//        downloads the official installer AND runs its install_profile.json
//        processors itself. Never reimplement those processors by hand: doing
//        so means re-solving library extraction, the processor graph and the
//        sha1 checks the crate already does.
//
// No shell plugin is used anywhere: the game process is spawned with
// std::process from `install::process`, never tauri-plugin-shell, whose purpose
// is handing the *renderer* shell access — which this app deliberately does not
// want.

pub mod api;
pub mod auth;
pub mod backups;
pub mod browse;
pub mod catalog;
pub mod datadir;
pub mod dialogs;
pub mod emulators;
pub mod icons;
pub mod install;
pub mod local_packs;
pub mod meta;
pub mod mrpack;
pub mod pack;
/// Publishing a local pack to the registry (Phase 6).
pub mod publish;
pub mod randomizer;
pub mod server_pack;
pub mod settings;
pub mod tool_api;
pub mod tool_assets;
pub mod tool_db;
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

/// The renderer treats a failure here as "not running inside the shell" and
/// degrades to browser mode, so this must stay infallible.
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
        // The shared asset tree, cached on disk and served to the renderer.
        // NOT the asset protocol icons.rs warns about — a registered scheme has
        // no scope to keep aligned with the data root, which is the alignment
        // that silently broke twice. See tool_assets.rs.
        .register_asynchronous_uri_scheme_protocol(tool_assets::SCHEME, tool_assets::handle)
        .setup(|app| {
            // Before anything reads the tree: bring an install up to the
            // current layout under `%APPDATA%\Boffmedia[ Dev]`, flattening
            // away any `<instance>/.minecraft` level.
            let handle = app.handle().clone();
            datadir::migrate(&handle);
            // Icons need no setup here: icon_cache returns data: URLs, so
            // there is no asset-protocol scope to align with the custom data
            // root (an alignment that silently broke twice — see icons.rs).
            //
            // The tool asset cache does need one thing: sweeps otherwise only
            // happen on a write, so a cache left over the cap by a session that
            // then wrote nothing would stay over it forever.
            tool_assets::sweep_on_startup(&handle);
            Ok(())
        })
        .manage(updates::UpdateState::default())
        .manage(auth::AuthState::default())
        .manage(api::ApiState::default())
        .manage(install::InstallManager::default())
        .manage(dialogs::SaveSessions::default())
        .manage(tool_db::DbState::default())
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
            auth::open_url,
            tool_db::tool_db_get,
            tool_db::tool_db_put,
            tool_db::tool_db_remove,
            tool_db::tool_db_list,
            tool_db::tool_db_clear,
            tool_db::tool_outbox_enqueue,
            tool_db::tool_outbox_pending,
            tool_db::tool_outbox_flush,
            api::boff_device_start,
            api::boff_device_poll,
            api::boff_device_cancel,
            api::boff_session_restore,
            api::boff_sign_out,
            api::boff_accounts,
            api::boff_switch,
            api::boff_offline,
            api::boff_revalidate,
            api::server_health,
            api::packs_list,
            api::pack_manifest,
            api::invite_redeem,
            install::install_pack,
            install::launch_pack,
            install::stop_game,
            install::instance_scan,
            install::repair_instance,
            // Locked vs. user space, and version rollback.
            install::instance_versions,
            install::instance_revert,
            install::instance_unpin,
            install::instance_optional,
            install::instance_optional_set,
            install::instance_optional_model,
            install::instance_feature_set,
            install::instance_mod_graph,
            // Per-instance Java runtime + memory.
            install::instance_runtime,
            install::instance_runtime_set,
            install::jvm_args_check,
            // User-provided files.
            install::instance_provide_file,
            // Emulator ROM library sweep + resolution + settings.
            install::instance_user_files_scan,
            install::instance_rom_slot,
            install::pack_manifest_cache,
            dialogs::file_picker,
            dialogs::folder_picker,
            // Tools section — streamed export writes (see dialogs.rs).
            dialogs::save_dialog,
            dialogs::save_stream_begin,
            dialogs::save_stream_chunk,
            dialogs::save_stream_finish,
            dialogs::save_stream_abort,
            tool_api::tool_api_request,
            emulators::emulator_status,
            emulators::emulator_set_path,
            emulators::emulator_clear_path,
            settings::rom_dirs_get,
            settings::rom_dirs_add,
            settings::rom_dirs_remove,
            settings::settings_get,
            settings::settings_set,
            settings::plays_get,
            settings::playtime_get,
            updates::updates_check,
            updates::updates_install,
            status::server_status,
            local_packs::local_packs_list,
            publish::pack_publish_plan,
            publish::pack_publish,
            local_packs::local_pack_get,
            local_packs::local_pack_save,
            local_packs::local_pack_delete,
            local_packs::local_pack_duplicate,
            local_packs::local_pack_icon_set,
            local_packs::local_pack_icon_clear,
            local_packs::local_pack_icon,
            local_packs::local_pack_gallery_list,
            local_packs::local_pack_gallery_add,
            local_packs::local_pack_gallery_remove,
            local_packs::local_pack_gallery_image,
            local_packs::local_pack_world_add_zip,
            local_packs::local_pack_world_promote,
            local_packs::local_pack_world_remove,
            backups::backup_create,
            backups::backup_list,
            backups::backup_restore,
            backups::backup_delete,
            local_packs::export_mrpack,
            local_packs::export_server_mrpack,
            server_pack::export_server_zip,
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
            catalog::catalog_versions_by_hashes,
            install::instance_content,
            install::instance_extra_files,
            install::instance_extra_set_enabled,
            install::instance_extra_delete,
            install::instance_install_files,
            browse::instance_browse,
            browse::instance_delete_path,
            browse::instance_delete,
            browse::instance_reveal,
            browse::instance_screenshots,
            browse::screenshot_image,
            worlds::instance_worlds,
            worlds::world_icon,
            // Randomizer commands
            randomizer::randomizer_get_assignment,
            randomizer::hash_file,
            randomizer::randomizer_download_rom,
            randomizer::randomizer_place_rom,
            randomizer::randomizer_rom_present,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Boffmedia App");
}
