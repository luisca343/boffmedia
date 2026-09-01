//! Durable tool storage and the outbound write queue.
//!
//! The existing `storage` capability is `localStorage`: a string KV inside the
//! webview's origin, fine for "which tab was open" and wrong for anything a
//! player would be upset to lose. A card collection edited on a train has to
//! survive the trip, the webview's cache being cleared, and the app being
//! killed — so it lives in SQLite under `%APPDATA%\Boffmedia[ Dev]`, beside the
//! instances, where it can be backed up and inspected like any other file.
//!
//! Two tables, because there are two different things to keep:
//!
//! * `docs` — what the tool knows. Rows are opaque JSON: the shell has no
//!   business understanding a tool's shape, and a schema per tool would put
//!   every tool's migrations in this crate.
//! * `outbox` — what the tool still owes the server. A write made offline is
//!   applied to `docs` immediately (so the UI is honest about what the player
//!   did) and queued here, then replayed in order once the API answers again.
//!
//! # Why the queue is replayed HERE and not in the renderer
//!
//! The session is a device-flow JWT in the OS credential store, which the
//! webview deliberately cannot read (see `tool_api.rs`) — so only this side can
//! authenticate a replay at all. It also means a flush keeps running while the
//! player is on another screen, and survives a renderer reload.
//!
//! # What this does NOT promise
//!
//! Exactly-once delivery. Each op carries a UUID sent as `Idempotency-Key`, but
//! the API only honours that on the routes that implement it; elsewhere the
//! guarantee is at-least-once, which is why the queue is for writes that are
//! safe to repeat (a PUT of the final state), not for "increment by one".
//! Ops are replayed oldest-first and a network failure stops the run rather
//! than skipping ahead, so a queue can never be applied out of order.

use std::sync::Mutex;

use rusqlite::{params, Connection, OptionalExtension};

/// Bumped when the schema below changes; `migrate` is the only thing that reads
/// it. Kept in `user_version` rather than a table so an empty database and a
/// fresh one are the same thing.
const SCHEMA_VERSION: i64 = 1;

#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("No se ha podido abrir el almacenamiento de las herramientas.")]
    Open,
    #[error("No se ha podido leer o escribir en el almacenamiento de las herramientas.")]
    Query,
    #[error("Datos inválidos para el almacenamiento de las herramientas.")]
    Invalid,
}

/// Serialised for the renderer the same way the other modules do it: a message
/// it can show, never a raw SQL error.
pub struct DbErrorWire(String);

impl From<DbError> for DbErrorWire {
    fn from(err: DbError) -> Self {
        Self(err.to_string())
    }
}

impl serde::Serialize for DbErrorWire {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut map = std::collections::BTreeMap::new();
        map.insert("message", self.0.as_str());
        serde::Serialize::serialize(&map, s)
    }
}

pub struct DbState {
    conn: Mutex<Option<Connection>>,
}

impl Default for DbState {
    fn default() -> Self {
        Self {
            conn: Mutex::new(None),
        }
    }
}

impl DbState {
    /// Opens on first use rather than at startup: a player who never opens a
    /// tool never pays for the file, and a failure to open surfaces at the call
    /// that needed it instead of as a boot error about a feature they are not
    /// using.
    fn with<T>(
        &self,
        app: &tauri::AppHandle,
        f: impl FnOnce(&Connection) -> Result<T, DbError>,
    ) -> Result<T, DbError> {
        let mut guard = self.conn.lock().map_err(|_| DbError::Open)?;
        if guard.is_none() {
            let root = crate::datadir::data_root(app).map_err(|_| DbError::Open)?;
            std::fs::create_dir_all(&root).map_err(|_| DbError::Open)?;
            let conn = Connection::open(root.join("tools.db")).map_err(|_| DbError::Open)?;
            migrate(&conn)?;
            *guard = Some(conn);
        }
        f(guard.as_ref().expect("connection was just opened"))
    }
}

fn migrate(conn: &Connection) -> Result<(), DbError> {
    // WAL so a long flush cannot block the UI's reads, and because a crash
    // mid-write leaves a recoverable file rather than a truncated one.
    let _ = conn.pragma_update(None, "journal_mode", "WAL");
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|_| DbError::Open)?;

    let version: i64 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap_or(0);
    if version >= SCHEMA_VERSION {
        return Ok(());
    }

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS docs (
            ns          TEXT NOT NULL,
            collection  TEXT NOT NULL,
            id          TEXT NOT NULL,
            value       TEXT NOT NULL,
            updated_at  INTEGER NOT NULL,
            PRIMARY KEY (ns, collection, id)
         );
         CREATE TABLE IF NOT EXISTS outbox (
            op_id       TEXT PRIMARY KEY,
            ns          TEXT NOT NULL,
            method      TEXT NOT NULL,
            path        TEXT NOT NULL,
            body        TEXT,
            dedupe_key  TEXT,
            created_at  INTEGER NOT NULL,
            attempts    INTEGER NOT NULL DEFAULT 0,
            last_error  TEXT
         );
         -- Ordering is the queue's contract, so this is what keeps the replay's
         -- read from scanning. `rowid` is deliberately NOT part of it: SQLite
         -- refuses to index the rowid -- cannot use ROWID in index -- and it does
         -- not need to — it is already the implicit tiebreaker inside the index.
         CREATE INDEX IF NOT EXISTS outbox_order ON outbox (created_at);
         -- One pending op per (tool, dedupe key): setting a card's count to 3
         -- and then to 4 while offline should send 4, not both.
         CREATE UNIQUE INDEX IF NOT EXISTS outbox_dedupe
            ON outbox (ns, dedupe_key) WHERE dedupe_key IS NOT NULL;",
    )
    .map_err(|_| DbError::Open)?;

    conn.pragma_update(None, "user_version", SCHEMA_VERSION)
        .map_err(|_| DbError::Open)?;
    Ok(())
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// A namespace is a tool id (`pokemon.tcgpocket`). Rejecting the odd ones keeps
/// one tool's rows from colliding with another's through an empty or padded
/// string; it is hygiene, not a security boundary, since every tool is
/// first-party code running in the same page.
fn check_ns(ns: &str) -> Result<(), DbError> {
    if ns.trim().is_empty() || ns.len() > 128 || ns.trim() != ns {
        return Err(DbError::Invalid);
    }
    Ok(())
}

// ── Documents ──────────────────────────────────────────────────────────────

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocRow {
    pub id: String,
    /// JSON text, decoded by the renderer. Kept as text end to end so the shell
    /// never has an opinion about a tool's shape.
    pub value: String,
    pub updated_at: i64,
}

fn doc_get(conn: &Connection, ns: &str, collection: &str, id: &str) -> Result<Option<String>, DbError> {
    conn.query_row(
        "SELECT value FROM docs WHERE ns = ?1 AND collection = ?2 AND id = ?3",
        params![ns, collection, id],
        |row| row.get(0),
    )
    .optional()
    .map_err(|_| DbError::Query)
}

fn doc_put(conn: &Connection, ns: &str, collection: &str, id: &str, value: &str) -> Result<(), DbError> {
    conn.execute(
        "INSERT INTO docs (ns, collection, id, value, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (ns, collection, id) DO UPDATE SET value = ?4, updated_at = ?5",
        params![ns, collection, id, value, now_ms()],
    )
    .map(|_| ())
    .map_err(|_| DbError::Query)
}

fn doc_remove(conn: &Connection, ns: &str, collection: &str, id: &str) -> Result<(), DbError> {
    conn.execute(
        "DELETE FROM docs WHERE ns = ?1 AND collection = ?2 AND id = ?3",
        params![ns, collection, id],
    )
    .map(|_| ())
    .map_err(|_| DbError::Query)
}

fn doc_list(conn: &Connection, ns: &str, collection: &str) -> Result<Vec<DocRow>, DbError> {
    let mut stmt = conn
        .prepare(
            "SELECT id, value, updated_at FROM docs
             WHERE ns = ?1 AND collection = ?2 ORDER BY updated_at DESC, id ASC",
        )
        .map_err(|_| DbError::Query)?;
    let rows = stmt
        .query_map(params![ns, collection], |row| {
            Ok(DocRow {
                id: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })
        .map_err(|_| DbError::Query)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|_| DbError::Query)
}

fn doc_clear(conn: &Connection, ns: &str, collection: &str) -> Result<(), DbError> {
    conn.execute(
        "DELETE FROM docs WHERE ns = ?1 AND collection = ?2",
        params![ns, collection],
    )
    .map(|_| ())
    .map_err(|_| DbError::Query)
}

// ── Outbox ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboxOp {
    pub ns: String,
    pub method: String,
    pub path: String,
    #[serde(default)]
    pub body: Option<serde_json::Value>,
    /// Optional: a later op with the same key REPLACES an earlier pending one.
    #[serde(default)]
    pub dedupe_key: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboxRow {
    pub op_id: String,
    pub ns: String,
    pub method: String,
    pub path: String,
    pub body: Option<serde_json::Value>,
    pub dedupe_key: Option<String>,
    pub created_at: i64,
    pub attempts: i64,
    pub last_error: Option<String>,
}

/// What a flush did. `rejected` is the one that matters to a tool: those ops
/// are GONE and were never applied, so a tool that wrote to `docs` optimistically
/// has to reconcile.
#[derive(Debug, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlushResult {
    pub sent: u32,
    pub rejected: Vec<RejectedOp>,
    /// Still queued: either untried (the run stopped at a network failure) or
    /// deferred by a 5xx.
    pub remaining: u32,
    /// Set when the run stopped early, so the caller can tell "nothing left to
    /// do" from "could not continue".
    pub stopped: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RejectedOp {
    pub op_id: String,
    pub ns: String,
    pub path: String,
    pub status: u16,
    pub message: String,
}

fn outbox_enqueue(conn: &Connection, op: &OutboxOp) -> Result<String, DbError> {
    check_ns(&op.ns)?;
    let op_id = uuid::Uuid::new_v4().to_string();
    let body = match &op.body {
        Some(value) => Some(serde_json::to_string(value).map_err(|_| DbError::Invalid)?),
        None => None,
    };
    // The dedupe index makes this an upsert on (ns, dedupe_key): the newest
    // intent wins and keeps its place in the queue by taking a new created_at.
    // Ops with no dedupe key never collide, so they all survive.
    conn.execute(
        "INSERT INTO outbox (op_id, ns, method, path, body, dedupe_key, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         -- The WHERE is not optional: an upsert whose conflict target is a
         -- PARTIAL unique index has to repeat that index's predicate, or SQLite
         -- cannot match the two and rejects the statement outright.
         ON CONFLICT (ns, dedupe_key) WHERE dedupe_key IS NOT NULL DO UPDATE SET
            op_id = ?1, method = ?3, path = ?4, body = ?5, created_at = ?7,
            attempts = 0, last_error = NULL",
        params![
            op_id,
            op.ns,
            op.method.to_ascii_uppercase(),
            op.path,
            body,
            op.dedupe_key,
            now_ms()
        ],
    )
    .map_err(|_| DbError::Query)?;
    Ok(op_id)
}

fn outbox_pending(conn: &Connection, ns: Option<&str>) -> Result<Vec<OutboxRow>, DbError> {
    let mut stmt = conn
        .prepare(
            "SELECT op_id, ns, method, path, body, dedupe_key, created_at, attempts, last_error
             FROM outbox
             WHERE (?1 IS NULL OR ns = ?1)
             ORDER BY created_at ASC, rowid ASC",
        )
        .map_err(|_| DbError::Query)?;
    let rows = stmt
        .query_map(params![ns], |row| {
            let body: Option<String> = row.get(4)?;
            Ok(OutboxRow {
                op_id: row.get(0)?,
                ns: row.get(1)?,
                method: row.get(2)?,
                path: row.get(3)?,
                body: body.and_then(|text| serde_json::from_str(&text).ok()),
                dedupe_key: row.get(5)?,
                created_at: row.get(6)?,
                attempts: row.get(7)?,
                last_error: row.get(8)?,
            })
        })
        .map_err(|_| DbError::Query)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|_| DbError::Query)
}

fn outbox_delete(conn: &Connection, op_id: &str) -> Result<(), DbError> {
    conn.execute("DELETE FROM outbox WHERE op_id = ?1", params![op_id])
        .map(|_| ())
        .map_err(|_| DbError::Query)
}

fn outbox_fail(conn: &Connection, op_id: &str, message: &str) -> Result<(), DbError> {
    conn.execute(
        "UPDATE outbox SET attempts = attempts + 1, last_error = ?2 WHERE op_id = ?1",
        params![op_id, message],
    )
    .map(|_| ())
    .map_err(|_| DbError::Query)
}

fn outbox_count(conn: &Connection, ns: Option<&str>) -> Result<u32, DbError> {
    conn.query_row(
        "SELECT COUNT(*) FROM outbox WHERE (?1 IS NULL OR ns = ?1)",
        params![ns],
        |row| row.get::<_, i64>(0),
    )
    .map(|n| n as u32)
    .map_err(|_| DbError::Query)
}

/// Whether a status means "this will never work" rather than "not now".
///
/// 4xx is the tool's own fault — a malformed body, a card that no longer
/// exists — and retrying it forever would wedge the queue behind an op that
/// cannot succeed. 408 and 429 are the exceptions: both explicitly mean "later".
fn is_permanent(status: u16) -> bool {
    (400..500).contains(&status) && status != 408 && status != 429
}

// ── Commands ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn tool_db_get(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    ns: String,
    collection: String,
    id: String,
) -> Result<Option<String>, DbErrorWire> {
    check_ns(&ns)?;
    Ok(db.with(&app, |conn| doc_get(conn, &ns, &collection, &id))?)
}

#[tauri::command]
pub fn tool_db_put(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    ns: String,
    collection: String,
    id: String,
    value: String,
) -> Result<(), DbErrorWire> {
    check_ns(&ns)?;
    Ok(db.with(&app, |conn| doc_put(conn, &ns, &collection, &id, &value))?)
}

#[tauri::command]
pub fn tool_db_remove(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    ns: String,
    collection: String,
    id: String,
) -> Result<(), DbErrorWire> {
    check_ns(&ns)?;
    Ok(db.with(&app, |conn| doc_remove(conn, &ns, &collection, &id))?)
}

#[tauri::command]
pub fn tool_db_list(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    ns: String,
    collection: String,
) -> Result<Vec<DocRow>, DbErrorWire> {
    check_ns(&ns)?;
    Ok(db.with(&app, |conn| doc_list(conn, &ns, &collection))?)
}

#[tauri::command]
pub fn tool_db_clear(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    ns: String,
    collection: String,
) -> Result<(), DbErrorWire> {
    check_ns(&ns)?;
    Ok(db.with(&app, |conn| doc_clear(conn, &ns, &collection))?)
}

#[tauri::command]
pub fn tool_outbox_enqueue(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    op: OutboxOp,
) -> Result<String, DbErrorWire> {
    Ok(db.with(&app, |conn| outbox_enqueue(conn, &op))?)
}

#[tauri::command]
pub fn tool_outbox_pending(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    ns: Option<String>,
) -> Result<Vec<OutboxRow>, DbErrorWire> {
    Ok(db.with(&app, |conn| outbox_pending(conn, ns.as_deref()))?)
}

/// Replay the queue, oldest first, until it is empty or the network says stop.
#[tauri::command]
pub async fn tool_outbox_flush(
    app: tauri::AppHandle,
    db: tauri::State<'_, DbState>,
    api: tauri::State<'_, crate::api::ApiState>,
    ns: Option<String>,
) -> Result<FlushResult, DbErrorWire> {
    let queued = db.with(&app, |conn| outbox_pending(conn, ns.as_deref()))?;
    let mut result = FlushResult::default();

    for op in queued {
        match send(&api, &op).await {
            Ok(()) => {
                db.with(&app, |conn| outbox_delete(conn, &op.op_id))?;
                result.sent += 1;
            }
            Err(SendError::Permanent { status, message }) => {
                // Dropped, not retried: it cannot succeed, and leaving it would
                // block everything queued behind it forever. The tool is told,
                // because its optimistic local write is now a lie.
                db.with(&app, |conn| outbox_delete(conn, &op.op_id))?;
                result.rejected.push(RejectedOp {
                    op_id: op.op_id.clone(),
                    ns: op.ns.clone(),
                    path: op.path.clone(),
                    status,
                    message,
                });
            }
            Err(SendError::Temporary(message)) => {
                // Stop the whole run rather than skipping ahead: these are
                // writes to the same resources in the order the player made
                // them, and applying #3 after #2 failed is how you get a state
                // nobody asked for.
                db.with(&app, |conn| outbox_fail(conn, &op.op_id, &message))?;
                result.stopped = Some(message);
                break;
            }
        }
    }

    result.remaining = db.with(&app, |conn| outbox_count(conn, ns.as_deref()))?;
    Ok(result)
}

enum SendError {
    /// Retry later: no network, a 5xx, a 429.
    Temporary(String),
    /// Never going to work: a 4xx that means the request itself is wrong.
    Permanent { status: u16, message: String },
}

/// `ApiError` carries its message per variant and implements no `Display`, so
/// the text has to be taken out by hand. Every variant is the same thing here:
/// a sentence to put in `last_error`.
fn api_message(err: crate::api::ApiError) -> String {
    match err {
        crate::api::ApiError::NeedsSignin(m)
        | crate::api::ApiError::Denied(m)
        | crate::api::ApiError::Message(m)
        | crate::api::ApiError::Unreachable(m)
        | crate::api::ApiError::ServerDown(m)
        | crate::api::ApiError::Store(m) => m,
    }
}

async fn send(api: &crate::api::ApiState, op: &OutboxRow) -> Result<(), SendError> {
    let path = crate::tool_api::normalize_path(&op.path)
        .map_err(|err| SendError::Permanent { status: 400, message: api_message(err) })?;
    let method = crate::tool_api::parse_method(Some(&op.method))
        .map_err(|err| SendError::Permanent { status: 400, message: api_message(err) })?;

    // A queued write is by definition the player's, so it always carries the
    // session. No session means no point sending it: it is not rejected (the
    // player may sign in later), just deferred.
    let token = api
        .current_token()
        .await
        .map_err(|_| SendError::Temporary("Sin sesión de Boffmedia.".to_string()))?;

    let mut builder = api
        .http()
        .request(method, format!("{}{}", crate::api::base_url(), path))
        .timeout(crate::api::CONTROL_TIMEOUT)
        .bearer_auth(token)
        // Honoured only by the routes that implement it (see the module note);
        // sent on every op so that the ones which do can collapse a repeat.
        .header("Idempotency-Key", &op.op_id);
    if let Some(body) = &op.body {
        builder = builder.json(body);
    }

    let res = builder
        .send()
        .await
        .map_err(|err| SendError::Temporary(err.to_string()))?;
    let status = res.status().as_u16();
    if res.status().is_success() {
        return Ok(());
    }
    let message = crate::api::error_message(res, "La sincronización falló.").await;
    if is_permanent(status) {
        Err(SendError::Permanent { status, message })
    } else {
        Err(SendError::Temporary(message))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        conn
    }

    #[test]
    fn documents_round_trip_and_overwrite() {
        let conn = db();
        doc_put(&conn, "t", "cards", "a1-001", r#"{"n":1}"#).unwrap();
        assert_eq!(
            doc_get(&conn, "t", "cards", "a1-001").unwrap().as_deref(),
            Some(r#"{"n":1}"#)
        );
        doc_put(&conn, "t", "cards", "a1-001", r#"{"n":2}"#).unwrap();
        assert_eq!(
            doc_get(&conn, "t", "cards", "a1-001").unwrap().as_deref(),
            Some(r#"{"n":2}"#)
        );
        assert_eq!(doc_list(&conn, "t", "cards").unwrap().len(), 1);
    }

    #[test]
    fn namespaces_and_collections_do_not_bleed() {
        let conn = db();
        doc_put(&conn, "tool.a", "cards", "x", "1").unwrap();
        doc_put(&conn, "tool.b", "cards", "x", "2").unwrap();
        doc_put(&conn, "tool.a", "decks", "x", "3").unwrap();
        assert_eq!(doc_get(&conn, "tool.a", "cards", "x").unwrap().unwrap(), "1");
        assert_eq!(doc_get(&conn, "tool.b", "cards", "x").unwrap().unwrap(), "2");
        assert_eq!(doc_list(&conn, "tool.a", "cards").unwrap().len(), 1);
        doc_clear(&conn, "tool.a", "cards").unwrap();
        assert!(doc_get(&conn, "tool.a", "cards", "x").unwrap().is_none());
        // Clearing one collection leaves the neighbours alone.
        assert_eq!(doc_get(&conn, "tool.b", "cards", "x").unwrap().unwrap(), "2");
        assert_eq!(doc_get(&conn, "tool.a", "decks", "x").unwrap().unwrap(), "3");
    }

    #[test]
    fn remove_deletes_only_its_row() {
        let conn = db();
        doc_put(&conn, "t", "c", "a", "1").unwrap();
        doc_put(&conn, "t", "c", "b", "2").unwrap();
        doc_remove(&conn, "t", "c", "a").unwrap();
        assert!(doc_get(&conn, "t", "c", "a").unwrap().is_none());
        assert!(doc_get(&conn, "t", "c", "b").unwrap().is_some());
    }

    fn op(ns: &str, path: &str, dedupe: Option<&str>) -> OutboxOp {
        OutboxOp {
            ns: ns.to_string(),
            method: "put".to_string(),
            path: path.to_string(),
            body: Some(serde_json::json!({ "count": 1 })),
            dedupe_key: dedupe.map(str::to_string),
        }
    }

    #[test]
    fn queue_keeps_order_and_uppercases_the_method() {
        let conn = db();
        outbox_enqueue(&conn, &op("t", "/a", None)).unwrap();
        outbox_enqueue(&conn, &op("t", "/b", None)).unwrap();
        let pending = outbox_pending(&conn, Some("t")).unwrap();
        assert_eq!(
            pending.iter().map(|o| o.path.as_str()).collect::<Vec<_>>(),
            vec!["/a", "/b"]
        );
        assert_eq!(pending[0].method, "PUT");
    }

    #[test]
    fn a_dedupe_key_collapses_to_the_newest_intent() {
        let conn = db();
        outbox_enqueue(&conn, &op("t", "/card/1?count=3", Some("card:1"))).unwrap();
        outbox_enqueue(&conn, &op("t", "/card/1?count=4", Some("card:1"))).unwrap();
        outbox_enqueue(&conn, &op("t", "/card/2?count=1", Some("card:2"))).unwrap();
        let pending = outbox_pending(&conn, Some("t")).unwrap();
        assert_eq!(pending.len(), 2, "the two edits to card 1 are one op");
        assert!(pending.iter().any(|o| o.path == "/card/1?count=4"));
        assert!(!pending.iter().any(|o| o.path == "/card/1?count=3"));
    }

    #[test]
    fn ops_without_a_dedupe_key_never_collapse() {
        let conn = db();
        outbox_enqueue(&conn, &op("t", "/log", None)).unwrap();
        outbox_enqueue(&conn, &op("t", "/log", None)).unwrap();
        assert_eq!(outbox_pending(&conn, Some("t")).unwrap().len(), 2);
    }

    #[test]
    fn the_same_dedupe_key_in_two_tools_is_two_ops() {
        let conn = db();
        outbox_enqueue(&conn, &op("tool.a", "/x", Some("card:1"))).unwrap();
        outbox_enqueue(&conn, &op("tool.b", "/x", Some("card:1"))).unwrap();
        assert_eq!(outbox_pending(&conn, None).unwrap().len(), 2);
        assert_eq!(outbox_pending(&conn, Some("tool.a")).unwrap().len(), 1);
    }

    #[test]
    fn failing_an_op_records_the_attempt_without_losing_it() {
        let conn = db();
        let id = outbox_enqueue(&conn, &op("t", "/a", None)).unwrap();
        outbox_fail(&conn, &id, "boom").unwrap();
        let pending = outbox_pending(&conn, Some("t")).unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].attempts, 1);
        assert_eq!(pending[0].last_error.as_deref(), Some("boom"));
    }

    #[test]
    fn permanence_is_decided_by_status() {
        assert!(is_permanent(400));
        assert!(is_permanent(404));
        assert!(is_permanent(409));
        assert!(!is_permanent(408), "a timeout means later, not never");
        assert!(!is_permanent(429), "rate limiting means later, not never");
        assert!(!is_permanent(500));
        assert!(!is_permanent(503));
    }

    #[test]
    fn a_namespace_must_look_like_a_tool_id() {
        assert!(check_ns("pokemon.tcgpocket").is_ok());
        assert!(check_ns("").is_err());
        assert!(check_ns("  ").is_err());
        assert!(check_ns(" padded").is_err());
        assert!(check_ns(&"x".repeat(129)).is_err());
    }

    #[test]
    fn migrate_is_idempotent() {
        let conn = db();
        doc_put(&conn, "t", "c", "a", "1").unwrap();
        migrate(&conn).unwrap();
        assert_eq!(doc_get(&conn, "t", "c", "a").unwrap().unwrap(), "1");
    }
}
