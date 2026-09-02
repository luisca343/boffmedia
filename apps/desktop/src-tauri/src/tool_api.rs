//! The desktop half of `@boffmedia/tool-kit`'s `api` capability.
//!
//! A tool cannot call the API straight from the page here. In a browser the
//! cookie for the API origin *is* the session; the webview has no such cookie —
//! the launcher's session is a device-flow JWT in the OS credential store, which
//! JavaScript deliberately cannot read. So every tool API call is proxied
//! through here and Rust attaches the bearer.
//!
//! Auth is OPTIONAL by default, and that is the point rather than an oversight:
//! `/tools/mhwilds/*` and friends are `@Public()`, and the Tools section must
//! work with no Boffmedia account at all. Failing closed with no session would
//! break exactly the tools this capability exists to unblock.

use std::collections::HashMap;

use crate::api::{base_url, error_message, response_error, ApiError, ApiState, CONTROL_TIMEOUT};

/// Whether the call needs the player's session. Mirrors `ToolApiAuth` in
/// `@boffmedia/tool-kit`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolAuth {
    Optional,
    Required,
}

impl Default for ToolAuth {
    fn default() -> Self {
        Self::Optional
    }
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolApiRequest {
    /// API path with a leading slash, e.g. `/tools/mhwilds/weapons`.
    pub path: String,
    #[serde(default)]
    pub method: Option<String>,
    /// Sent as a JSON body when present.
    #[serde(default)]
    pub body: Option<serde_json::Value>,
    #[serde(default)]
    pub query: HashMap<String, String>,
    #[serde(default)]
    pub auth: ToolAuth,
}

/// Reject anything that is not a path on OUR API host.
///
/// This proxy attaches the player's credential, so letting a caller pass an
/// absolute URL would hand that credential to whatever host it named — a
/// confused deputy. Tools are first-party code, so this is a guard rail rather
/// than a defence against a live attacker, but the check costs nothing and the
/// alternative fails silently and badly.
pub(crate) fn normalize_path(path: &str) -> Result<String, ApiError> {
    let trimmed = path.trim();
    if !trimmed.starts_with('/') {
        return Err(ApiError::Message(format!(
            "Ruta de API inválida (debe empezar por «/»): {trimmed}"
        )));
    }
    // `//host/x` is protocol-relative: it starts with a slash and still leaves
    // our origin entirely.
    if trimmed.starts_with("//") || trimmed.contains("://") {
        return Err(ApiError::Message(format!(
            "Ruta de API inválida (no se permiten URLs absolutas): {trimmed}"
        )));
    }
    Ok(trimmed.to_string())
}

pub(crate) fn parse_method(method: Option<&str>) -> Result<reqwest::Method, ApiError> {
    match method.unwrap_or("GET").to_ascii_uppercase().as_str() {
        "GET" => Ok(reqwest::Method::GET),
        "POST" => Ok(reqwest::Method::POST),
        "PUT" => Ok(reqwest::Method::PUT),
        "PATCH" => Ok(reqwest::Method::PATCH),
        "DELETE" => Ok(reqwest::Method::DELETE),
        other => Err(ApiError::Message(format!(
            "Método HTTP no permitido: {other}"
        ))),
    }
}

/// Proxy one tool API call and return the response body VERBATIM.
///
/// The envelope (`{ success, statusCode, data }`) is deliberately NOT unwrapped:
/// the web host returns the raw body too, and tool code must see one shape on
/// both hosts or the whole seam stops being a seam.
#[tauri::command]
pub async fn tool_api_request(
    api: tauri::State<'_, ApiState>,
    request: ToolApiRequest,
) -> Result<serde_json::Value, ApiError> {
    let path = normalize_path(&request.path)?;
    let method = parse_method(request.method.as_deref())?;

    let token = match request.auth {
        // A hard requirement surfaces `needsSignin` immediately rather than
        // sending an anonymous request just to be handed the 401 back.
        ToolAuth::Required => Some(api.current_token().await?),
        // `.ok()` also swallows a credential-store failure into "anonymous".
        // That is the honest reading: whatever the cause, we have no token to
        // send, and a public endpoint should still answer.
        ToolAuth::Optional => api.current_token().await.ok(),
    };

    let mut builder = api
        .http()
        .request(method.clone(), format!("{}{}", base_url(), path))
        .timeout(CONTROL_TIMEOUT);

    if !request.query.is_empty() {
        builder = builder.query(&request.query);
    }
    if let Some(token) = &token {
        builder = builder.bearer_auth(token);
    }
    if let Some(body) = &request.body {
        builder = builder.json(body);
    }

    let res = builder.send().await?;

    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        // Same rule as `authed`: a launcher session is approved by a human in a
        // browser, so there is nothing to re-mint. Dropping it here is what
        // makes the next call report `needsSignin` instead of looping on 401s.
        //
        // Only when we actually SENT a session, though — a 401 on an anonymous
        // call to a protected endpoint says nothing about the stored token, and
        // signing the player out over it would be a bug.
        if token.is_some() {
            api.forget_session().await;
        }
        return Err(ApiError::NeedsSignin(
            error_message(res, "Tu sesión ha caducado. Vuelve a iniciar sesión.").await,
        ));
    }

    if !res.status().is_success() {
        return Err(response_error(res, "La petición a la API falló.").await);
    }

    // A 204 (and any other empty body) is a success with nothing to decode;
    // `.json()` would fail on it, so it becomes JSON null.
    let bytes = res.bytes().await?;
    if bytes.is_empty() {
        return Ok(serde_json::Value::Null);
    }
    serde_json::from_slice(&bytes).map_err(|err| {
        ApiError::Message(format!("Respuesta inesperada del servidor: {err}"))
    })
}

/// A server-sent-events call, forwarded frame by frame over an IPC channel.
///
/// Separate from `tool_api_request` because that command reads the whole
/// response before returning: for a stream that means every frame lands at
/// once, after the job it was narrating has already finished — a progress bar
/// that fills in one jump when the work is over.
///
/// NO total `.timeout()`, and that omission is the load-bearing part rather
/// than an oversight. `reqwest`'s `.timeout()` bounds the ENTIRE request, body
/// included, so a 20-second control timeout would kill a bulk download exactly
/// 20 seconds in — the same trap the pack downloader hit. The shared client's
/// `connect_timeout` still bounds the part that should be bounded: getting a
/// response at all.
#[tauri::command]
pub async fn tool_api_stream(
    api: tauri::State<'_, ApiState>,
    request: ToolApiRequest,
    on_message: tauri::ipc::Channel<serde_json::Value>,
) -> Result<(), ApiError> {
    let path = normalize_path(&request.path)?;
    // Defaults to POST rather than GET: the endpoints that stream progress are
    // the ones being handed a job to do.
    let method = parse_method(Some(request.method.as_deref().unwrap_or("POST")))?;

    let token = match request.auth {
        ToolAuth::Required => Some(api.current_token().await?),
        ToolAuth::Optional => api.current_token().await.ok(),
    };

    let mut builder = api
        .http()
        .request(method, format!("{}{}", base_url(), path));

    if !request.query.is_empty() {
        builder = builder.query(&request.query);
    }
    if let Some(token) = &token {
        builder = builder.bearer_auth(token);
    }
    if let Some(body) = &request.body {
        builder = builder.json(body);
    }

    let mut res = builder.send().await?;

    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        // Same rule as `tool_api_request`: only drop the session if we actually
        // sent one.
        if token.is_some() {
            api.forget_session().await;
        }
        return Err(ApiError::NeedsSignin(
            error_message(res, "Tu sesión ha caducado. Vuelve a iniciar sesión.").await,
        ));
    }

    if !res.status().is_success() {
        return Err(response_error(res, "La petición a la API falló.").await);
    }

    // SSE frames are line-delimited, and a chunk boundary lands wherever TCP
    // put it — so the tail after the last newline is held back until the next
    // chunk completes it. Dropping it instead loses one frame per boundary,
    // which for a progress stream means a bar that skips.
    let mut buffer = String::new();
    while let Some(chunk) = res.chunk().await? {
        buffer.push_str(&String::from_utf8_lossy(&chunk));
        while let Some(index) = buffer.find('\n') {
            let line: String = buffer.drain(..=index).collect();
            let line = line.trim_end_matches(['\n', '\r']);
            let Some(payload) = line.strip_prefix("data: ") else {
                continue;
            };
            // A malformed frame is SKIPPED, never fatal: abandoning a long
            // server-side job over one bad line would be the worse failure, and
            // it matches what the web implementation has always done.
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(payload) {
                // A send failure means the renderer dropped the channel — the
                // tool navigated away. Stop reading rather than draining a
                // stream nobody is listening to.
                if on_message.send(value).is_err() {
                    return Ok(());
                }
            }
        }
    }

    Ok(())
}

/// Where the API lives, for the renderer's `apiUrl` capability.
///
/// The renderer cannot work this out for itself: `base_url()` reads the RUNTIME
/// `BOFF_API_URL`, while anything baked into the bundle is fixed at build time,
/// so a shell pointed at a staging API would hand out links to production.
/// Asked once at boot and cached there — this is a url builder, and a builder
/// cannot await.
#[tauri::command]
pub fn tool_api_base_url() -> String {
    base_url()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_plain_api_path() {
        assert_eq!(
            normalize_path("/tools/mhwilds/weapons").unwrap(),
            "/tools/mhwilds/weapons"
        );
        // Surrounding whitespace is trimmed rather than rejected.
        assert_eq!(normalize_path("  /tools/x  ").unwrap(), "/tools/x");
    }

    #[test]
    fn rejects_paths_that_leave_our_origin() {
        // Each of these would send the player's bearer token somewhere else.
        for path in [
            "https://evil.test/steal",
            "//evil.test/steal",
            "http://evil.test",
        ] {
            assert!(
                normalize_path(path).is_err(),
                "{path} must not be accepted"
            );
        }
    }

    #[test]
    fn rejects_a_relative_path() {
        // Without a leading slash this would concatenate onto the base URL's
        // host and silently hit the wrong path.
        assert!(normalize_path("tools/mhwilds/weapons").is_err());
    }

    #[test]
    fn parses_methods_case_insensitively_and_defaults_to_get() {
        assert_eq!(parse_method(None).unwrap(), reqwest::Method::GET);
        assert_eq!(parse_method(Some("post")).unwrap(), reqwest::Method::POST);
        assert_eq!(parse_method(Some("DELETE")).unwrap(), reqwest::Method::DELETE);
    }

    #[test]
    fn rejects_methods_outside_the_allowed_set() {
        // Notably TRACE/CONNECT, and anything the caller invents.
        assert!(parse_method(Some("TRACE")).is_err());
        assert!(parse_method(Some("")).is_err());
    }

    #[test]
    fn auth_defaults_to_optional() {
        // The default matters: it is what lets a signed-out player use the
        // public tool endpoints (D4).
        let request: ToolApiRequest =
            serde_json::from_value(serde_json::json!({ "path": "/tools/mhwilds/weapons" })).unwrap();
        assert_eq!(request.auth, ToolAuth::Optional);
        assert!(request.query.is_empty());
        assert!(request.body.is_none());
    }

    #[test]
    fn auth_required_is_deserialized_from_the_renderer() {
        let request: ToolApiRequest = serde_json::from_value(
            serde_json::json!({ "path": "/tools/tcgp/collection", "auth": "required" }),
        )
        .unwrap();
        assert_eq!(request.auth, ToolAuth::Required);
    }
}
