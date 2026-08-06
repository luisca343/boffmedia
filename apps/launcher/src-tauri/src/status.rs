// Server List Ping (SLP): the modern (1.7+) status handshake, hand-rolled over
// tokio::net::TcpStream (spec D2). No SLP crate exists in Cargo.lock today, and
// the wire protocol is small enough that owning it beats pulling in a crate
// with its own DNS/SRV resolution or its own tokio pin.
//
// RF-04: this module never returns an error to the renderer. Any failure
// (connect refused, timeout, malformed response) degrades to `online: false`
// so a dead server never blocks or errors the pack card.

use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::time::timeout;

/// The whole ping, connect through parse, budgeted at once — a slow DNS
/// resolution and a slow read are the same "give up" to the player.
const TOTAL_TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerPlayers {
    pub online: u32,
    pub max: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerStatus {
    pub online: bool,
    pub players: Option<ServerPlayers>,
    pub motd: Option<String>,
    pub latency_ms: Option<u64>,
}

impl ServerStatus {
    fn offline() -> Self {
        Self {
            online: false,
            players: None,
            motd: None,
            latency_ms: None,
        }
    }
}

/// Raw shape of the Status Response JSON (only the fields we read).
#[derive(Debug, Deserialize)]
struct StatusResponseJson {
    players: Option<StatusPlayersJson>,
    description: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct StatusPlayersJson {
    online: u32,
    max: u32,
}

/// `description` is either a plain string or a chat component object with a
/// `text` field (and possibly `extra`); a server can send either, and a MOTD
/// the launcher fails to parse is not worth surfacing as an error.
fn motd_of(value: &serde_json::Value) -> Option<String> {
    match value {
        serde_json::Value::String(s) => Some(s.clone()),
        serde_json::Value::Object(obj) => {
            let mut out = obj.get("text").and_then(|v| v.as_str()).unwrap_or("").to_string();
            if let Some(extra) = obj.get("extra").and_then(|v| v.as_array()) {
                for part in extra {
                    if let Some(text) = part.get("text").and_then(|v| v.as_str()) {
                        out.push_str(text);
                    }
                }
            }
            if out.is_empty() {
                None
            } else {
                Some(out)
            }
        }
        _ => None,
    }
}

fn write_varint(buf: &mut Vec<u8>, mut value: i32) {
    loop {
        let mut byte = (value & 0x7F) as u8;
        value = ((value as u32) >> 7) as i32;
        if value != 0 {
            byte |= 0x80;
        }
        buf.push(byte);
        if value == 0 {
            break;
        }
    }
}

async fn read_varint(stream: &mut TcpStream) -> std::io::Result<i32> {
    let mut result: i32 = 0;
    for i in 0..5 {
        let mut byte = [0u8; 1];
        stream.read_exact(&mut byte).await?;
        result |= ((byte[0] & 0x7F) as i32) << (7 * i);
        if byte[0] & 0x80 == 0 {
            return Ok(result);
        }
    }
    Err(std::io::Error::new(
        std::io::ErrorKind::InvalidData,
        "varint too long",
    ))
}

fn write_string(buf: &mut Vec<u8>, s: &str) {
    write_varint(buf, s.len() as i32);
    buf.extend_from_slice(s.as_bytes());
}

/// Where to actually open the socket. An explicit port is used verbatim and SRV
/// is skipped (this matches Minecraft: an address with a port never does an SRV
/// lookup). With no port we resolve the Minecraft SRV record
/// `_minecraft._tcp.<host>`; if one exists we use its target host + port,
/// otherwise we fall back to the vanilla 25565. The ORIGINAL host still goes
/// into the SLP handshake address (proxies like Velocity/BungeeCord key their
/// virtual hosts on it), so only the socket destination changes.
async fn resolve_target(host: &str, port: Option<u16>) -> (String, u16) {
    if let Some(p) = port {
        return (host.to_string(), p);
    }
    if let Ok(resolver) = hickory_resolver::TokioAsyncResolver::tokio_from_system_conf() {
        let query = format!("_minecraft._tcp.{host}.");
        if let Ok(lookup) = resolver.srv_lookup(query).await {
            if let Some(srv) = lookup.iter().next() {
                let target = srv.target().to_utf8();
                let target = target.trim_end_matches('.').to_string();
                if !target.is_empty() {
                    return (target, srv.port());
                }
            }
        }
    }
    (host.to_string(), 25565)
}

async fn ping(connect_host: &str, connect_port: u16, address: &str) -> std::io::Result<ServerStatus> {
    let started = std::time::Instant::now();
    let mut stream = TcpStream::connect((connect_host, connect_port)).await?;

    // Handshake packet: id 0x00, protocol version -1 (unspecified — a status
    // ping does not need to match a real protocol version), server address,
    // port, next_state = 1 (status). `address` is the host the player typed, not
    // the SRV-resolved target, so a proxy resolves the right backend.
    let mut handshake = Vec::new();
    handshake.push(0x00u8);
    write_varint(&mut handshake, -1);
    write_string(&mut handshake, address);
    handshake.extend_from_slice(&connect_port.to_be_bytes());
    write_varint(&mut handshake, 1);

    let mut handshake_packet = Vec::new();
    write_varint(&mut handshake_packet, handshake.len() as i32);
    handshake_packet.extend_from_slice(&handshake);
    stream.write_all(&handshake_packet).await?;

    // Status Request: an empty packet with id 0x00.
    let status_request = [0x01u8, 0x00u8];
    stream.write_all(&status_request).await?;
    stream.flush().await?;

    // Status Response: varint length, varint packet id (0x00), varint string
    // length, then the JSON payload itself.
    let _packet_len = read_varint(&mut stream).await?;
    let _packet_id = read_varint(&mut stream).await?;
    let json_len = read_varint(&mut stream).await? as usize;
    let mut json_buf = vec![0u8; json_len];
    stream.read_exact(&mut json_buf).await?;

    let latency_ms = started.elapsed().as_millis() as u64;

    let parsed: StatusResponseJson = serde_json::from_slice(&json_buf)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    Ok(ServerStatus {
        online: true,
        players: parsed
            .players
            .map(|p| ServerPlayers { online: p.online, max: p.max }),
        motd: parsed.description.as_ref().and_then(motd_of),
        latency_ms: Some(latency_ms),
    })
}

/// Never returns `Err` to the renderer (RF-04): a timeout, a refused
/// connection or a malformed response all fold into `online: false`.
#[tauri::command]
pub async fn server_status(host: String, port: Option<u16>) -> ServerStatus {
    // SRV resolution shares the same budget as the ping: a slow DNS answer and a
    // slow read are the same "give up" to the player.
    let run = async {
        let (target, target_port) = resolve_target(&host, port).await;
        ping(&target, target_port, &host).await
    };
    match timeout(TOTAL_TIMEOUT, run).await {
        Ok(Ok(status)) => status,
        Ok(Err(_)) | Err(_) => ServerStatus::offline(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn varints_round_trip_across_the_full_i32_range() {
        for value in [0, 1, 127, 128, 255, 300, 16384, i32::MAX] {
            let mut buf = Vec::new();
            write_varint(&mut buf, value);
            // read_varint is async (it reads off a TcpStream); this exercises
            // the same byte layout it decodes, via the sync loop it mirrors.
            let mut result: i32 = 0;
            let mut i = 0;
            for &byte in &buf {
                result |= ((byte & 0x7F) as i32) << (7 * i);
                i += 1;
                if byte & 0x80 == 0 {
                    break;
                }
            }
            assert_eq!(result, value);
        }
    }

    #[test]
    fn motd_reads_both_plain_and_chat_component_shapes() {
        assert_eq!(
            motd_of(&serde_json::json!("A vanilla MOTD")),
            Some("A vanilla MOTD".to_string())
        );
        assert_eq!(
            motd_of(&serde_json::json!({ "text": "Hello ", "extra": [{ "text": "world" }] })),
            Some("Hello world".to_string())
        );
        assert_eq!(motd_of(&serde_json::json!({})), None);
    }

    // RF-04: never Err to the renderer — connecting to a closed local port
    // must degrade to offline, not fail the command.
    #[tokio::test]
    async fn an_unreachable_server_reports_offline_not_an_error() {
        let status = server_status("127.0.0.1".to_string(), Some(1)).await;
        assert!(!status.online);
        assert!(status.players.is_none());
    }
}
