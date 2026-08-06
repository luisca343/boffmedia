// The game process: spawn, stream its output, know when it died.
//
// stdout and stderr are piped rather than inherited for two reasons. The
// obvious one is that a packaged GUI app has no terminal to inherit. The one
// that matters is §9: crash-report parsing is the highest-leverage support tool
// there is, and it needs the lines, not a console window nobody screenshots.
//
// A piped child that nobody reads FILLS ITS PIPE BUFFER AND HANGS, which looks
// exactly like the game freezing on the Mojang splash — hence one reader thread
// per stream, always, even when the log panel is closed.

use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::Emitter;

use super::crash::{diagnose, Diagnosis, LogTail};
use super::progress::{log, EVENT_GAME_STATE};
use super::InstallFailure;

#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum GameStatePayload {
    Idle,
    Preparing,
    #[serde(rename_all = "camelCase")]
    Running {
        pid: u32,
        since: u64,
    },
    #[serde(rename_all = "camelCase")]
    Crashed {
        exit_code: i32,
        /// §9 — the plain-language verdict, when the log tail matched a known
        /// signature. `None` (null in JSON) means "it crashed and we do not
        /// know why", which the UI must say instead of inventing a cause.
        diagnosis: Option<Diagnosis>,
    },
}

/// A live game. Held in the install manager so `stop_game` has something to
/// kill and a second `launch_pack` can refuse rather than start a duplicate.
pub struct RunningGame {
    pub pid: u32,
    pub since: u64,
    child: Arc<Mutex<Child>>,
}

impl RunningGame {
    /// True once the process has exited. Cheap, non-blocking — used to decide
    /// whether a pack is "running" without waiting on it.
    pub fn has_exited(&self) -> bool {
        self.child
            .lock()
            .ok()
            .and_then(|mut c| c.try_wait().ok())
            .flatten()
            .is_some()
    }

    /// SIGKILL / TerminateProcess. There is no graceful path: Minecraft has no
    /// IPC to ask it to quit, and a player pressing "stop" has already decided.
    pub fn kill(&self) -> Result<(), InstallFailure> {
        let mut child = self
            .child
            .lock()
            .map_err(|_| InstallFailure::message("El proceso del juego no responde."))?;
        match child.kill() {
            Ok(()) => Ok(()),
            // Already gone between the check and the kill — the caller's goal
            // is met, so this is not an error.
            Err(err) if err.kind() == std::io::ErrorKind::InvalidInput => Ok(()),
            Err(err) => Err(InstallFailure::message(format!(
                "No se pudo detener el juego: {err}"
            ))),
        }
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or_default()
}

/// What `spawn` runs. Minecraft carries portablemc's ready-made `Game`; an
/// emulator is a plain executable + args, already verified on disk by
/// `emulator::launchable`. Everything downstream — piped output, exit watching,
/// playtime — is identical for both.
pub enum Launchable {
    Minecraft(portablemc::base::Game),
    Emulator {
        exe: std::path::PathBuf,
        args: Vec<String>,
        rom: std::path::PathBuf,
        cwd: std::path::PathBuf,
    },
}

/// Spawn the game and wire up its output. Returns as soon as the process is
/// alive; everything after that arrives as `game://log` and `game://state`.
pub fn spawn(
    app: &tauri::AppHandle,
    launchable: &Launchable,
    quick_play: Option<&str>,
    pack_id: String,
) -> Result<RunningGame, InstallFailure> {
    let (mut command, exe_label): (Command, String) = match launchable {
        Launchable::Minecraft(game) => {
            let mut command: Command = game.command();
            // RF-01/RF-02: only appended when the pack declares a server AND the
            // pack's Minecraft version supports it (resolve::supports_quick_play);
            // absent, the command is byte-for-byte what it was before this feature.
            if let Some(target) = quick_play {
                command.arg("--quickPlayMultiplayer").arg(target);
            }
            (command, game.jvm_file.display().to_string())
        }
        Launchable::Emulator { exe, args, rom, cwd } => {
            let mut command = Command::new(exe);
            command.args(args).arg(rom).current_dir(cwd);
            (command, exe.display().to_string())
        }
    };
    // §9 — crash-signature parsing is Minecraft log analysis; an emulator's exit
    // gets the honest "it crashed and we do not know why" instead of a Minecraft
    // diagnosis that cannot apply.
    let diagnose_crashes = matches!(launchable, Launchable::Minecraft(_));
    command.stdout(Stdio::piped()).stderr(Stdio::piped());
    // The game reads nothing from stdin; leaving it inherited keeps a handle to
    // the launcher's own console alive on Windows.
    command.stdin(Stdio::null());

    let mut child = command.spawn().map_err(|e| {
        InstallFailure::message(format!(
            "No se pudo iniciar el juego con {exe_label}: {e}"
        ))
    })?;

    let pid = child.id();
    let since = now_ms();

    // One buffer fed by BOTH readers: a modded crash prints its cause on stderr
    // and its context on stdout, and classifying half of it gets it wrong.
    let tail = LogTail::new();

    if let Some(stdout) = child.stdout.take() {
        pump(app.clone(), stdout, "info", tail.clone());
    }
    if let Some(stderr) = child.stderr.take() {
        pump(app.clone(), stderr, "error", tail.clone());
    }

    let child = Arc::new(Mutex::new(child));
    let _ = app.emit(EVENT_GAME_STATE, GameStatePayload::Running { pid, since });

    watch_exit(app.clone(), Arc::clone(&child), tail, pack_id, since, diagnose_crashes);

    Ok(RunningGame { pid, since, child })
}

/// One reader thread per stream. std::thread rather than a tokio task: this is
/// a blocking read that lives for the whole session, which is precisely what an
/// async runtime's worker threads must not be used for.
fn pump<R: std::io::Read + Send + 'static>(
    app: tauri::AppHandle,
    stream: R,
    level: &'static str,
    tail: LogTail,
) {
    std::thread::spawn(move || {
        let reader = BufReader::new(stream);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            tail.push(&line);
            // Minecraft writes its own severity into the line; trusting the
            // stream alone would mark every log4j INFO on stderr as an error.
            let level = if line.contains("/ERROR]") || line.contains("Exception") {
                "error"
            } else if line.contains("/WARN]") {
                "warn"
            } else {
                level
            };
            log(&app, level, "game", &line);
        }
    });
}

/// Reports the exit code as `GameState`. A non-zero exit is `crashed` even when
/// the player closed the window, because the game itself does not distinguish
/// the two and pretending otherwise hides real crashes.
fn watch_exit(
    app: tauri::AppHandle,
    child: Arc<Mutex<Child>>,
    tail: LogTail,
    pack_id: String,
    since: u64,
    diagnose_crashes: bool,
) {
    std::thread::spawn(move || {
        loop {
            let exit_code = {
                let Ok(mut guard) = child.lock() else { return };
                match guard.try_wait() {
                    Ok(Some(status)) => Some(status.code().unwrap_or(-1)),
                    Ok(None) => None,
                    Err(_) => return,
                }
            };

            if let Some(code) = exit_code {
                // The reader threads are still draining the pipe when the
                // process dies, and the crash report is the LAST thing written.
                // Diagnosing immediately would classify a log that is missing
                // its own cause.
                if code != 0 {
                    std::thread::sleep(std::time::Duration::from_millis(600));
                }
                let payload = if code == 0 {
                    GameStatePayload::Idle
                } else {
                    GameStatePayload::Crashed {
                        exit_code: code,
                        diagnosis: if diagnose_crashes {
                            diagnose(code, &tail.snapshot())
                        } else {
                            None
                        },
                    }
                };
                log(
                    &app,
                    if code == 0 { "info" } else { "error" },
                    "launcher",
                    &format!("El juego terminó con código {code}."),
                );
                let _ = app.emit(EVENT_GAME_STATE, payload);

                // Record playtime: best-effort, never fail the exit path.
                let elapsed = now_ms().saturating_sub(since);
                crate::settings::add_playtime(&app, &pack_id, elapsed);

                return;
            }
            // Polling rather than a blocking `wait()` so the mutex is free for
            // `kill()` between checks; a blocking wait would hold it forever.
            std::thread::sleep(std::time::Duration::from_millis(400));
        }
    });
}

/// Emitted before the (potentially slow) verify-and-install pass that precedes
/// every launch, so the UI can disable the play button immediately.
pub fn emit_preparing(app: &tauri::AppHandle) {
    let _ = app.emit(EVENT_GAME_STATE, GameStatePayload::Preparing);
}

pub fn emit_idle(app: &tauri::AppHandle) {
    let _ = app.emit(EVENT_GAME_STATE, GameStatePayload::Idle);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn game_state_matches_the_renderers_union() {
        // types.ts:88 — a discriminated union on `kind`, with camelCase fields.
        let running = serde_json::to_string(&GameStatePayload::Running {
            pid: 42,
            since: 1,
        })
        .unwrap();
        assert!(running.contains(r#""kind":"running""#));
        assert!(running.contains(r#""pid":42"#));

        let crashed = serde_json::to_string(&GameStatePayload::Crashed {
            exit_code: 1,
            diagnosis: None,
        })
        .unwrap();
        assert!(crashed.contains(r#""kind":"crashed""#));
        assert!(crashed.contains(r#""exitCode":1"#));
        // Null, not absent: the renderer's `diagnosis` field is not optional.
        assert!(crashed.contains(r#""diagnosis":null"#));

        let diagnosed = serde_json::to_string(&GameStatePayload::Crashed {
            exit_code: 1,
            diagnosis: super::diagnose(
                1,
                &["java.lang.OutOfMemoryError: Java heap space".to_string()],
            ),
        })
        .unwrap();
        assert!(diagnosed.contains(r#""kind":"out-of-memory""#));

        assert_eq!(
            serde_json::to_string(&GameStatePayload::Idle).unwrap(),
            r#"{"kind":"idle"}"#
        );
    }
}
