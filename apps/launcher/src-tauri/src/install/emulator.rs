// The emulator side of multi-game. A pack never ships the emulator — the
// launcher resolves the PLAYER'S OWN install (emulators::resolve: settings
// override → EmuDeck → common locations → PATH), so their controls, shaders
// and config apply untouched and we never write into an install we do not own.
// The only pack payload is the ROM (and any extra override files), so the
// whole job here is: find their emulator, verify the ROM is in place, and hand
// process.rs a command to spawn.

use super::game::Prepared;
use super::instance;
use super::process::Launchable;
use super::resolve::PlannedGame;
use super::InstallFailure;

/// Build the launch command for an emulator pack. Called AFTER the payload
/// phase — the ROM only exists once the pack's files are placed (or provided).
pub fn launchable(prepared: &Prepared) -> Result<Launchable, InstallFailure> {
    let PlannedGame::Emulator { kind, rom, args } = &prepared.plan.game else {
        return Err(InstallFailure::message(
            "Este pack no es un pack de emulador.".to_string(),
        ));
    };

    let (exe, _source) = crate::emulators::resolve(*kind, &prepared.settings).ok_or_else(|| {
        InstallFailure::message(format!(
            "No se encontró {} en este equipo. Instálalo (recomendamos EmuDeck) o indica su ruta \
             en Ajustes.",
            kind.key()
        ))
    })?;

    let rom_path = instance::safe_join(&prepared.instance.minecraft, rom).ok_or_else(|| {
        InstallFailure::message(format!("La ruta de la ROM no es válida: {rom}"))
    })?;
    if !rom_path.is_file() {
        return Err(InstallFailure::message(format!(
            "No se encontró la ROM en «{rom}». Apórtala desde la ficha del pack."
        )));
    }

    // cwd is the instance so anything the emulator writes relative to the ROM
    // (mGBA's default .sav beside it, screenshots, savestates configured
    // relatively) stays inside the instance and inside the Backups tab's reach.
    Ok(Launchable::Emulator {
        exe,
        args: args.clone(),
        rom: rom_path,
        cwd: prepared.instance.root.clone(),
    })
}
