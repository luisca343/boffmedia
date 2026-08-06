// The emulator side of multi-game: no runtime to install (the emulator binary
// ships as ordinary pack files, hash-verified like any mod), so the whole job
// is to verify the pieces are on disk, pin the emulator to portable mode, and
// hand process.rs a command to spawn.

use super::game::Prepared;
use super::instance;
use super::process::Launchable;
use super::resolve::{EmulatorKind, PlannedGame};
use super::InstallFailure;

/// Build the launch command for an emulator pack. Called AFTER the payload
/// phase, because unlike Minecraft (whose runtime portablemc installs first)
/// the executable and the ROM only exist once the pack's files are placed.
pub fn launchable(prepared: &Prepared) -> Result<Launchable, InstallFailure> {
    let PlannedGame::Emulator { kind, executable, rom, args } = &prepared.plan.game else {
        return Err(InstallFailure::message(
            "Este pack no es un pack de emulador.".to_string(),
        ));
    };

    let exe = resolve_instance_file(prepared, executable, "el emulador")?;
    let rom = resolve_instance_file(prepared, rom, "la ROM")?;

    ensure_portable(*kind, &exe);

    Ok(Launchable::Emulator {
        exe,
        args: args.clone(),
        rom,
        cwd: prepared.instance.root.clone(),
    })
}

fn resolve_instance_file(
    prepared: &Prepared,
    rel: &str,
    label: &str,
) -> Result<std::path::PathBuf, InstallFailure> {
    let path = instance::safe_join(&prepared.instance.minecraft, rel).ok_or_else(|| {
        InstallFailure::message(format!("La ruta de {label} no es válida: {rel}"))
    })?;
    if !path.is_file() {
        return Err(InstallFailure::message(format!(
            "No se encontró {label} en «{rel}». Reinstala el pack o aporta el archivo que falta."
        )));
    }
    Ok(path)
}

/// Pin the emulator's config to the instance instead of the user's profile.
/// Both mGBA and melonDS switch to portable mode when their config file exists
/// beside the executable, so an empty file is enough — and an existing one
/// (shipped by the pack, or written by the emulator itself) is never touched.
/// Best-effort: a failure here means the emulator falls back to its global
/// config, which launches fine and is not worth failing the play button over.
fn ensure_portable(kind: EmulatorKind, exe: &std::path::Path) {
    let Some(dir) = exe.parent() else { return };
    let marker = match kind {
        EmulatorKind::Mgba => dir.join("portable.ini"),
        EmulatorKind::MelonDs => dir.join("melonDS.ini"),
    };
    if !marker.exists() {
        let _ = std::fs::write(&marker, b"");
    }
}
