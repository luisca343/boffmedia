// Randomizer ROM flow: claim assignment, hash ROM locally, upload and download randomized version.

use serde::{Deserialize, Deserializer, Serialize};

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
#[tauri::command]
pub async fn randomizer_download_rom(
    event_id: String,
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

    // Stream the ROM bytes to a temporary file
    let temp_dir = std::env::temp_dir();
    let output_name = format!("randomized_{}.gba", uuid::Uuid::new_v4());
    let output_path = temp_dir.join(&output_name);

    let rom_data = res.bytes().await
        .map_err(|e| RandomizerError {
            code: "network_error".to_string(),
            message: format!("Failed to download ROM bytes: {}", e),
        })?;

    std::fs::write(&output_path, &rom_data)
        .map_err(|e| RandomizerError {
            code: "io_error".to_string(),
            message: format!("Failed to save randomized ROM: {}", e),
        })?;

    Ok(RandomizerRomResult {
        output_path: output_path.to_string_lossy().to_string(),
        output_sha512,
    })
}

/// Update the instance marker's expected hash for a file path.
/// Used by randomizer to mark a ROM slot as expecting the output ROM hash
/// instead of the clean ROM hash.
#[tauri::command]
pub async fn randomizer_update_expected_hash(
    slug: String,
    path: String,
    sha512: String,
    app: tauri::AppHandle,
) -> Result<(), RandomizerError> {
    let settings_val = settings::load(&app);
    let layout = install::paths::Layout::new(&app, settings_val.game_dir())
        .map_err(|e| RandomizerError {
            code: "io_error".to_string(),
            message: format!("Failed to access layout: {}", e.message),
        })?;

    let instance = layout.instance(&slug);

    // Read the current marker
    let raw = std::fs::read_to_string(&instance.marker)
        .map_err(|e| RandomizerError {
            code: "io_error".to_string(),
            message: format!("Failed to read marker: {}", e),
        })?;

    let mut marker: install::instance::Marker = serde_json::from_str(&raw)
        .map_err(|e| RandomizerError {
            code: "parse_error".to_string(),
            message: format!("Failed to parse marker: {}", e),
        })?;

    // Find the file entry matching the path (case-insensitive)
    let norm = |p: &str| p.to_lowercase().replace('\\', "/");
    let target_norm = norm(&path);

    if let Some(entry) = marker.managed.iter_mut().find(|f| norm(&f.path) == target_norm) {
        entry.sha512 = sha512.to_lowercase();
    } else {
        return Err(RandomizerError {
            code: "not_found".to_string(),
            message: format!("File {} not found in instance marker", path),
        });
    }

    // Write the marker back
    let json = serde_json::to_string_pretty(&marker)
        .map_err(|e| RandomizerError {
            code: "serialize_error".to_string(),
            message: format!("Failed to serialize marker: {}", e),
        })?;

    std::fs::write(&instance.marker, json)
        .map_err(|e| RandomizerError {
            code: "io_error".to_string(),
            message: format!("Failed to write marker: {}", e),
        })?;

    Ok(())
}
