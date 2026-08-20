// Randomizer ROM flow: claim assignment, hash ROM locally, upload and download randomized version.

use std::io::Write;

use serde::{Deserialize, Deserializer, Serialize};
use sha2::{Digest, Sha512};

use crate::api::{self, ApiState};
use crate::install;
use crate::settings;

/// eventId is an opaque id we only ever use as a URL path segment. The API may
/// send it as a JSON number or string, so accept either and normalise to String.
fn de_id_as_string<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
    match serde_json::Value::deserialize(d)? {
        serde_json::Value::String(s) => Ok(s),
        serde_json::Value::Number(n) => Ok(n.to_string()),
        other => Err(serde::de::Error::custom(format!(
            "expected string or number for eventId, got {other}"
        ))),
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RandomizerAssignment {
    #[serde(deserialize_with = "de_id_as_string")]
    pub event_id: String,
    pub status: String, // "pending" | "claimed" | "patched" | "verified"
    pub clean_rom_sha512: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output_sha512: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RandomizerRomResult {
    #[serde(rename = "outputPath")]
    pub output_path: String,
    #[serde(rename = "outputSha512")]
    pub output_sha512: String,
}

#[derive(Debug, Serialize)]
pub struct RandomizerError {
    pub code: String,
    pub message: String,
}

/// Map a shared-client `ApiError` onto the randomizer's error shape. A session
/// problem stays actionable ("auth_error"); a transport failure is "network_error".
fn randomizer_error_from_api(err: api::ApiError) -> RandomizerError {
    match err {
        api::ApiError::NeedsSignin(m) => RandomizerError {
            code: "auth_error".to_string(),
            message: m,
        },
        api::ApiError::Denied(m) => RandomizerError {
            code: "auth_error".to_string(),
            message: m,
        },
        api::ApiError::Message(m) => RandomizerError {
            code: "network_error".to_string(),
            message: m,
        },
        // Split out from the generic network failure so this screen can say
        // whether the fault is reaching the server at all or the server itself
        // answering 5xx — the two need different advice.
        api::ApiError::Unreachable(m) => RandomizerError {
            code: "server_unreachable".to_string(),
            message: m,
        },
        api::ApiError::ServerDown(m) => RandomizerError {
            code: "server_down".to_string(),
            message: m,
        },
        // The OS credential store failed — not a network problem, and not fixable
        // by signing in again from this screen.
        api::ApiError::Store(m) => RandomizerError {
            code: "store_error".to_string(),
            message: m,
        },
    }
}

/// Get the player's assignment for a pack's active randomizer event.
/// Returns 404 (error code "not_found") if the pack has no active event.
#[tauri::command]
pub async fn randomizer_get_assignment(
    pack_id: String,
    api: tauri::State<'_, ApiState>,
) -> Result<RandomizerAssignment, RandomizerError> {
    // Through the shared authed client: same session invalidation and
    // `X-Boff-Game-Types` header as every other API call. `authed_get` already
    // folds a missing/rejected session into NeedsSignin.
    let res = api::authed_get(&api, &format!("/randomizer/launcher/packs/{}/my-assignment", pack_id))
        .await
        .map_err(randomizer_error_from_api)?;

    if res.status() == 404 {
        return Err(RandomizerError {
            code: "not_found".to_string(),
            message: "No active event for this pack".to_string(),
        });
    }

    // Any other non-success status (401 no session, 403 not entitled, 5xx) must
    // surface the server's reason rather than being masked as a parse error when
    // the error envelope has no `data` field.
    if !res.status().is_success() {
        let status = res.status().as_u16();
        let body: serde_json::Value = res.json().await.unwrap_or_default();
        let reason = body
            .get("userMessage")
            .or_else(|| body.get("message"))
            .and_then(|v| v.as_str())
            .unwrap_or("Request failed")
            .to_string();
        return Err(RandomizerError {
            code: "http_error".to_string(),
            message: format!("{} ({})", reason, status),
        });
    }

    let body: serde_json::Value = res.json().await
        .map_err(|e| RandomizerError {
            code: "parse_error".to_string(),
            message: format!("Failed to parse response: {}", e),
        })?;

    // Expect { success, data: {...} } from the API
    let data = body.get("data")
        .ok_or_else(|| RandomizerError {
            code: "parse_error".to_string(),
            message: "Invalid response structure".to_string(),
        })?;

    serde_json::from_value::<RandomizerAssignment>(data.clone())
        .map_err(|e| RandomizerError {
            code: "parse_error".to_string(),
            message: format!("Failed to parse assignment: {}", e),
        })
}

/// Hash a file locally using SHA-512.
#[tauri::command]
pub fn hash_file(path: String) -> Result<String, RandomizerError> {
    let file_path = std::path::PathBuf::from(&path);

    if !file_path.is_file() {
        return Err(RandomizerError {
            code: "not_found".to_string(),
            message: "File not found".to_string(),
        });
    }

    // Use the existing sha512_of function from install::files
    install::files::sha512_of(&file_path)
        .ok_or_else(|| RandomizerError {
            code: "hash_error".to_string(),
            message: "Failed to compute file hash".to_string(),
        })
}

/// Download the player's randomized ROM.
/// The server generates it on first request, caches it, and streams it.
/// Returns the path to the output ROM and its SHA-512 hash (from x-output-sha512 header).
///
/// The bytes are STREAMED to a temp file and hashed as they arrive, then the
/// digest is checked against the `x-output-sha512` header before the path is
/// returned — a truncated or tampered transfer never reaches `place_rom`. The
/// temp file is removed on every failure so a rejected download leaves nothing
/// behind. `rom_path` gives the slot's extension so an mgba pack lands a `.gba`
/// and a melonDS pack a `.nds`; absent or unknown, `.gba` is the fallback.
#[tauri::command]
pub async fn randomizer_download_rom(
    event_id: String,
    rom_path: Option<String>,
    api: tauri::State<'_, ApiState>,
) -> Result<RandomizerRomResult, RandomizerError> {
    let res = api::authed_get(&api, &format!("/randomizer/launcher/events/{}/rom", event_id))
        .await
        .map_err(randomizer_error_from_api)?;

    let status = res.status();
    if !status.is_success() {
        let status_code = status.as_u16();
        let body: serde_json::Value = res.json().await.unwrap_or_default();
        let reason = body
            .get("userMessage")
            .or_else(|| body.get("message"))
            .and_then(|v| v.as_str())
            .unwrap_or("Request failed")
            .to_string();

        let code = match status {
            reqwest::StatusCode::NOT_FOUND => "not_found",
            reqwest::StatusCode::FORBIDDEN => "not_registered",
            reqwest::StatusCode::CONFLICT => "no_base_rom",
            _ => "http_error",
        };

        return Err(RandomizerError {
            code: code.to_string(),
            message: format!("{} ({})", reason, status_code),
        });
    }

    // Read the x-output-sha512 header
    let output_sha512 = res
        .headers()
        .get("x-output-sha512")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_lowercase())
        .ok_or_else(|| RandomizerError {
            code: "parse_error".to_string(),
            message: "Missing x-output-sha512 header in response".to_string(),
        })?;

    // The output extension is the ROM slot's, not a fixed `.gba`: melonDS packs
    // hand the emulator a `.nds`.
    let ext = rom_path
        .as_deref()
        .and_then(|p| std::path::Path::new(p).extension().and_then(|e| e.to_str()))
        .map(|e| e.to_lowercase())
        .filter(|e| e == "gba" || e == "nds")
        .unwrap_or_else(|| "gba".to_string());

    let output_path = std::env::temp_dir().join(format!("randomized_{}.{ext}", uuid::Uuid::new_v4()));

    let remove_temp = || {
        let _ = std::fs::remove_file(&output_path);
    };

    // Stream to disk, hashing as we go, so a multi-MB ROM never sits fully in
    // memory and a cut transfer is caught by the hash rather than silently
    // saved short.
    let mut res = res;
    let mut hasher = Sha512::new();
    {
        let mut file = std::fs::File::create(&output_path).map_err(|e| RandomizerError {
            code: "io_error".to_string(),
            message: format!("Failed to create temp ROM: {}", e),
        })?;
        loop {
            match res.chunk().await {
                Ok(Some(chunk)) => {
                    hasher.update(&chunk);
                    if let Err(e) = file.write_all(&chunk) {
                        remove_temp();
                        return Err(RandomizerError {
                            code: "io_error".to_string(),
                            message: format!("Failed to write ROM: {}", e),
                        });
                    }
                }
                Ok(None) => break,
                Err(e) => {
                    drop(file);
                    remove_temp();
                    return Err(RandomizerError {
                        code: "network_error".to_string(),
                        message: format!("Failed to download ROM bytes: {}", e),
                    });
                }
            }
        }
    }

    let actual = install::files::hex(&hasher.finalize()).to_lowercase();
    if actual != output_sha512 {
        remove_temp();
        return Err(RandomizerError {
            code: "hash_error".to_string(),
            message: "El ROM descargado no coincide con el hash anunciado por el servidor."
                .to_string(),
        });
    }

    Ok(RandomizerRomResult {
        output_path: output_path.to_string_lossy().to_string(),
        output_sha512,
    })
}

/// Place a downloaded randomized ROM into an instance's ROM slot ATOMICALLY.
///
/// Ordering is the whole point: the ROM is imported to the never-purged local
/// blob store and copied into the slot on disk FIRST, and only once it is in
/// place is the marker entry rewritten — its `sha512` AND `size` together, read
/// back from the file that was just written. Marking the hash first and placing
/// the file second leaves the marker claiming a hash for a ROM that is not there
/// yet, and never touches `size` — so a partial run leaves the gate looking
/// cleared over an empty slot.
#[tauri::command]
pub async fn randomizer_place_rom(
    slug: String,
    temp_path: String,
    rom_path: String,
    expected_sha512: String,
    app: tauri::AppHandle,
) -> Result<(), RandomizerError> {
    let io_err = |m: String| RandomizerError {
        code: "io_error".to_string(),
        message: m,
    };

    let source = std::path::PathBuf::from(&temp_path);
    if !source.is_file() {
        return Err(RandomizerError {
            code: "not_found".to_string(),
            message: "El ROM descargado ya no existe.".to_string(),
        });
    }

    // Re-verify the downloaded bytes against the hash the caller expects before
    // anything touches the instance: a mismatch here means a corrupt temp file,
    // not a marker to rewrite.
    let expected = expected_sha512.to_lowercase();
    let actual = install::files::sha512_of(&source).ok_or_else(|| RandomizerError {
        code: "hash_error".to_string(),
        message: "No se pudo leer el ROM descargado.".to_string(),
    })?;
    if actual != expected {
        return Err(RandomizerError {
            code: "hash_error".to_string(),
            message: "El ROM descargado no coincide con el hash esperado.".to_string(),
        });
    }

    let settings_val = settings::load(&app);
    let layout = install::paths::Layout::new(&app, settings_val.game_dir())
        .map_err(|e| io_err(format!("Failed to access layout: {}", e.message)))?;
    let instance = layout.instance(&slug);

    // Import into the content-addressed local blob store keyed by the output
    // hash, so a deleted randomized ROM self-heals from the cache on the next
    // install/launch (the emulator payload pass, gate satisfied).
    let blob = install::files::local_blob_path(&layout, &expected);
    if let Some(parent) = blob.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::copy(&source, &blob).map_err(|e| io_err(format!("No se pudo guardar en el almacén: {e}")))?;

    let rel = install::instance::normalise(&rom_path);
    let dest = install::instance::safe_join(&instance.minecraft, &rel).ok_or_else(|| RandomizerError {
        code: "invalid_path".to_string(),
        message: format!("Ruta de ROM no válida: {rom_path}"),
    })?;
    if let Some(parent) = dest.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::copy(&blob, &dest).map_err(|e| io_err(format!("No se pudo colocar el ROM: {e}")))?;

    // ONLY NOW rewrite the marker, from the file actually on disk.
    let placed_size = std::fs::metadata(&dest)
        .map_err(|e| io_err(format!("No se pudo leer el ROM colocado: {e}")))?
        .len();

    let raw = std::fs::read_to_string(&instance.marker)
        .map_err(|e| io_err(format!("Failed to read marker: {}", e)))?;
    let mut marker: install::instance::Marker = serde_json::from_str(&raw)
        .map_err(|e| RandomizerError {
            code: "parse_error".to_string(),
            message: format!("Failed to parse marker: {}", e),
        })?;

    let norm = |p: &str| p.to_lowercase().replace('\\', "/");
    let target = norm(&rom_path);
    let Some(entry) = marker.managed.iter_mut().find(|f| norm(&f.path) == target) else {
        return Err(RandomizerError {
            code: "not_found".to_string(),
            message: format!("File {} not found in instance marker", rom_path),
        });
    };
    entry.sha512 = expected;
    entry.size = placed_size;

    let json = serde_json::to_string_pretty(&marker).map_err(|e| RandomizerError {
        code: "serialize_error".to_string(),
        message: format!("Failed to serialize marker: {}", e),
    })?;
    std::fs::write(&instance.marker, json).map_err(|e| io_err(format!("Failed to write marker: {}", e)))?;

    Ok(())
}

/// Whether the emulator ROM slot for this instance is present on disk right now.
/// A REAL on-disk check — not derived from the marker or the missing-files list,
/// both of which exclude the randomizer slot — so the panel can tell a slot that
/// still needs the ROM from one that already holds it.
#[tauri::command]
pub fn randomizer_rom_present(slug: String, app: tauri::AppHandle) -> Result<bool, RandomizerError> {
    let settings_val = settings::load(&app);
    let layout = install::paths::Layout::new(&app, settings_val.game_dir())
        .map_err(|e| RandomizerError {
            code: "io_error".to_string(),
            message: format!("Failed to access layout: {}", e.message),
        })?;
    let instance = layout.instance(&slug);

    let raw = match std::fs::read_to_string(&instance.marker) {
        Ok(raw) => raw,
        Err(_) => return Ok(false),
    };
    let marker: install::instance::Marker = match serde_json::from_str(&raw) {
        Ok(m) => m,
        Err(_) => return Ok(false),
    };
    let Some(rom) = install::randomizer_rom_slot_path(&marker) else {
        return Ok(false);
    };
    let present = install::instance::safe_join(&instance.minecraft, &install::instance::normalise(&rom))
        .map(|p| p.is_file())
        .unwrap_or(false);
    Ok(present)
}
