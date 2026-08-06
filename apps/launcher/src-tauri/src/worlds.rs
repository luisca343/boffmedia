// The Worlds tab: singleplayer worlds, read out of each save's `level.dat`.
//
// `level.dat` is gzipped NBT — Minecraft's own binary format, big-endian, with
// no library in this dependency tree that reads it. The parser below is the
// minimum that does: enough tag types to walk the tree, and no writer at all.
// The launcher never modifies a save; a bug in a writer here would corrupt a
// world the player cannot get back.
//
// Everything is best-effort. A world whose level.dat is missing, truncated, or
// from a version whose fields moved still appears in the list, with its folder
// name standing in for its title — a world that vanishes from the UI reads as
// data loss, which is far worse than one with a wrong label.

use std::collections::HashMap;
use std::io::Read;
use std::path::Path;

use base64::Engine;
use serde::Serialize;

use crate::install::paths::Layout;
use crate::install::InstallFailure;
use crate::settings;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct World {
    /// The save's folder name, and its identity — two worlds can share a title.
    pub folder: String,
    pub name: String,
    /// Milliseconds since the epoch; 0 when unknown.
    pub last_played: u64,
    pub size_bytes: u64,
    /// "survival" | "creative" | "adventure" | "spectator" | "unknown"
    pub game_mode: String,
    pub hardcore: bool,
    /// The Minecraft version that last wrote the save, when it says.
    pub version: Option<String>,
    /// True when `icon.png` sits beside level.dat.
    pub has_icon: bool,
}

// ── Minimal NBT ────────────────────────────────────────────────────────────

// Several payloads are parsed only to advance the cursor past them — the walk
// has to know a tag's shape even when nothing reads its value. Keeping the
// payload in the variant makes the parser readable and costs nothing.
#[allow(dead_code)]
#[derive(Debug, Clone)]
enum Nbt {
    Byte(i8),
    Short(i16),
    Int(i32),
    Long(i64),
    Float(f32),
    Double(f64),
    ByteArray(usize),
    String(String),
    List(Vec<Nbt>),
    Compound(HashMap<String, Nbt>),
    IntArray(usize),
    LongArray(usize),
}

struct Cursor<'a> {
    data: &'a [u8],
    at: usize,
}

impl<'a> Cursor<'a> {
    fn take(&mut self, n: usize) -> Option<&'a [u8]> {
        let end = self.at.checked_add(n)?;
        // Every read is bounds-checked and returns None rather than panicking:
        // this parses a file on the player's disk that any tool may have
        // truncated, and a panic here would take the whole command down.
        let slice = self.data.get(self.at..end)?;
        self.at = end;
        Some(slice)
    }
    fn u8(&mut self) -> Option<u8> {
        self.take(1).map(|b| b[0])
    }
    fn i16(&mut self) -> Option<i16> {
        self.take(2).map(|b| i16::from_be_bytes([b[0], b[1]]))
    }
    fn i32(&mut self) -> Option<i32> {
        self.take(4)
            .map(|b| i32::from_be_bytes([b[0], b[1], b[2], b[3]]))
    }
    fn i64(&mut self) -> Option<i64> {
        self.take(8).map(|b| {
            i64::from_be_bytes([b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]])
        })
    }
    fn string(&mut self) -> Option<String> {
        let len = self.i16()? as usize;
        let raw = self.take(len)?;
        // Minecraft writes "modified UTF-8". For the fields read here it is
        // ordinary UTF-8 in practice, and a lossy decode beats refusing to list
        // a world because someone put an unusual character in its name.
        Some(String::from_utf8_lossy(raw).to_string())
    }

    fn payload(&mut self, tag: u8) -> Option<Nbt> {
        Some(match tag {
            1 => Nbt::Byte(self.u8()? as i8),
            2 => Nbt::Short(self.i16()?),
            3 => Nbt::Int(self.i32()?),
            4 => Nbt::Long(self.i64()?),
            5 => Nbt::Float(f32::from_bits(self.i32()? as u32)),
            6 => Nbt::Double(f64::from_bits(self.i64()? as u64)),
            7 => {
                let len = self.i32()?.max(0) as usize;
                self.take(len)?;
                Nbt::ByteArray(len)
            }
            8 => Nbt::String(self.string()?),
            9 => {
                let inner = self.u8()?;
                let len = self.i32()?.max(0) as usize;
                let mut items = Vec::new();
                for _ in 0..len {
                    // A list of TAG_End carries no payload at all; reading one
                    // would consume the rest of the file as garbage.
                    if inner == 0 {
                        break;
                    }
                    items.push(self.payload(inner)?);
                }
                Nbt::List(items)
            }
            10 => Nbt::Compound(self.compound()?),
            11 => {
                let len = self.i32()?.max(0) as usize;
                self.take(len.checked_mul(4)?)?;
                Nbt::IntArray(len)
            }
            12 => {
                let len = self.i32()?.max(0) as usize;
                self.take(len.checked_mul(8)?)?;
                Nbt::LongArray(len)
            }
            _ => return None,
        })
    }

    fn compound(&mut self) -> Option<HashMap<String, Nbt>> {
        let mut map = HashMap::new();
        loop {
            let tag = self.u8()?;
            if tag == 0 {
                return Some(map);
            }
            let name = self.string()?;
            let value = self.payload(tag)?;
            map.insert(name, value);
        }
    }
}

fn parse_level_dat(bytes: &[u8]) -> Option<HashMap<String, Nbt>> {
    let mut cursor = Cursor { data: bytes, at: 0 };
    // The root is an unnamed compound, but it still carries a tag byte and a
    // (usually empty) name before its payload.
    let tag = cursor.u8()?;
    if tag != 10 {
        return None;
    }
    let _root_name = cursor.string()?;
    let root = cursor.compound()?;
    match root.get("Data") {
        Some(Nbt::Compound(data)) => Some(data.clone()),
        // Bedrock and some third-party tools hoist the fields to the root.
        _ => Some(root),
    }
}

fn read_gzipped(path: &Path) -> Option<Vec<u8>> {
    let raw = std::fs::read(path).ok()?;
    // level.dat is gzipped, but a hand-edited or tool-written one is sometimes
    // left uncompressed. The gzip magic is what tells them apart.
    if raw.first() == Some(&0x1f) && raw.get(1) == Some(&0x8b) {
        let mut out = Vec::new();
        flate2::read::GzDecoder::new(&raw[..])
            .read_to_end(&mut out)
            .ok()?;
        Some(out)
    } else {
        Some(raw)
    }
}

fn game_mode_of(value: Option<&Nbt>) -> String {
    match value {
        Some(Nbt::Int(0)) => "survival",
        Some(Nbt::Int(1)) => "creative",
        Some(Nbt::Int(2)) => "adventure",
        Some(Nbt::Int(3)) => "spectator",
        _ => "unknown",
    }
    .to_string()
}

fn dir_size(path: &Path) -> u64 {
    let Ok(entries) = std::fs::read_dir(path) else {
        return 0;
    };
    entries
        .flatten()
        .map(|e| match e.metadata() {
            Ok(m) if m.is_dir() => dir_size(&e.path()),
            Ok(m) => m.len(),
            Err(_) => 0,
        })
        .sum()
}

fn read_world(dir: &Path) -> Option<World> {
    let folder = dir.file_name()?.to_string_lossy().to_string();
    let data = read_gzipped(&dir.join("level.dat")).and_then(|b| parse_level_dat(&b));

    let name = match data.as_ref().and_then(|d| d.get("LevelName")) {
        Some(Nbt::String(s)) if !s.is_empty() => s.clone(),
        _ => folder.clone(),
    };
    let last_played = match data.as_ref().and_then(|d| d.get("LastPlayed")) {
        Some(Nbt::Long(ms)) if *ms > 0 => *ms as u64,
        _ => 0,
    };
    let hardcore = matches!(data.as_ref().and_then(|d| d.get("hardcore")), Some(Nbt::Byte(1)));
    let version = match data.as_ref().and_then(|d| d.get("Version")) {
        Some(Nbt::Compound(v)) => match v.get("Name") {
            Some(Nbt::String(s)) => Some(s.clone()),
            _ => None,
        },
        _ => None,
    };

    Some(World {
        game_mode: game_mode_of(data.as_ref().and_then(|d| d.get("GameType"))),
        size_bytes: dir_size(dir),
        has_icon: dir.join("icon.png").is_file(),
        folder,
        name,
        last_played,
        hardcore,
        version,
    })
}

/// Every singleplayer world in this instance, most recently played first.
#[tauri::command]
pub async fn instance_worlds(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Vec<World>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let saves = layout.instance(&slug).minecraft.join("saves");
    if !saves.is_dir() {
        return Ok(Vec::new());
    }

    let mut out: Vec<World> = std::fs::read_dir(&saves)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer «saves»: {e}")))?
        .flatten()
        .filter(|e| e.path().is_dir())
        .filter_map(|e| read_world(&e.path()))
        .collect();

    // Never-played worlds (last_played 0) sink to the bottom rather than
    // floating to the top as "oldest".
    out.sort_by(|a, b| b.last_played.cmp(&a.last_played));
    Ok(out)
}

/// Fetch a world's icon.png as a data: URL, or None if it doesn't exist.
/// Reuses the base64 approach from icons.rs with the same 4MB cap.
#[tauri::command]
pub async fn world_icon(
    slug: String,
    folder: String,
    app: tauri::AppHandle,
) -> Result<Option<String>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let saves = layout.instance(&slug).minecraft.join("saves");

    // Safe path construction: join saves with the folder name.
    let world_dir =
        crate::install::instance::safe_join(&saves, &folder).ok_or_else(|| {
            InstallFailure::message("Invalid world folder.".to_string())
        })?;

    let icon_path = world_dir.join("icon.png");

    // Check if icon exists and is a file.
    if !icon_path.is_file() {
        return Ok(None);
    }

    // Read the icon, capped at 4MB (same as icons.rs).
    const MAX_ICON_BYTES: u64 = 4 * 1024 * 1024;
    let metadata = std::fs::metadata(&icon_path)
        .map_err(|e| InstallFailure::message(format!("Could not read icon metadata: {e}")))?;

    if metadata.len() > MAX_ICON_BYTES {
        return Err(InstallFailure::message("World icon is too large.".to_string()));
    }

    let bytes = std::fs::read(&icon_path)
        .map_err(|e| InstallFailure::message(format!("Could not read world icon: {e}")))?;

    // PNG sniff and base64 encode.
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Ok(Some(format!("data:image/png;base64,{}", encoded)))
    } else {
        Err(InstallFailure::message(
            "World icon is not a valid PNG file.".to_string(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Builds `{"": {"Data": {...}}}` the way Minecraft writes it.
    fn level_dat(entries: &[(&str, Nbt)]) -> Vec<u8> {
        fn string(out: &mut Vec<u8>, s: &str) {
            out.extend_from_slice(&(s.len() as i16).to_be_bytes());
            out.extend_from_slice(s.as_bytes());
        }
        let mut inner = Vec::new();
        for (name, value) in entries {
            match value {
                Nbt::String(s) => {
                    inner.push(8);
                    string(&mut inner, name);
                    string(&mut inner, s);
                }
                Nbt::Long(v) => {
                    inner.push(4);
                    string(&mut inner, name);
                    inner.extend_from_slice(&v.to_be_bytes());
                }
                Nbt::Int(v) => {
                    inner.push(3);
                    string(&mut inner, name);
                    inner.extend_from_slice(&v.to_be_bytes());
                }
                Nbt::Byte(v) => {
                    inner.push(1);
                    string(&mut inner, name);
                    inner.push(*v as u8);
                }
                _ => unreachable!("fixture only builds the scalar tags"),
            }
        }
        inner.push(0); // end of Data

        let mut out = vec![10];
        string(&mut out, "");
        out.push(10);
        string(&mut out, "Data");
        out.extend_from_slice(&inner);
        out.push(0); // end of root
        out
    }

    #[test]
    fn reads_the_fields_the_worlds_tab_shows() {
        let bytes = level_dat(&[
            ("LevelName", Nbt::String("Mi Mundo".into())),
            ("LastPlayed", Nbt::Long(1_700_000_000_000)),
            ("GameType", Nbt::Int(1)),
            ("hardcore", Nbt::Byte(1)),
        ]);
        let data = parse_level_dat(&bytes).unwrap();
        assert!(matches!(data.get("LevelName"), Some(Nbt::String(s)) if s == "Mi Mundo"));
        assert!(matches!(data.get("LastPlayed"), Some(Nbt::Long(1_700_000_000_000))));
        assert_eq!(game_mode_of(data.get("GameType")), "creative");
        assert!(matches!(data.get("hardcore"), Some(Nbt::Byte(1))));
    }

    #[test]
    fn a_truncated_level_dat_returns_none_instead_of_panicking() {
        // The whole reason every read is bounds-checked: this file is on the
        // player's disk and any tool may have half-written it.
        let bytes = level_dat(&[("LevelName", Nbt::String("x".into()))]);
        for cut in 1..bytes.len() {
            let _ = parse_level_dat(&bytes[..cut]);
        }
    }

    #[test]
    fn an_unknown_game_type_is_unknown_not_survival() {
        // Defaulting to survival would mislabel every world whose GameType the
        // parser failed to reach.
        assert_eq!(game_mode_of(None), "unknown");
        assert_eq!(game_mode_of(Some(&Nbt::Int(9))), "unknown");
        assert_eq!(game_mode_of(Some(&Nbt::Int(0))), "survival");
    }

    #[test]
    fn a_root_without_a_data_compound_still_yields_its_fields() {
        let mut out = vec![10];
        out.extend_from_slice(&0i16.to_be_bytes());
        out.push(8);
        out.extend_from_slice(&9i16.to_be_bytes());
        out.extend_from_slice(b"LevelName");
        out.extend_from_slice(&4i16.to_be_bytes());
        out.extend_from_slice(b"Flat");
        out.push(0);
        let data = parse_level_dat(&out).unwrap();
        assert!(matches!(data.get("LevelName"), Some(Nbt::String(s)) if s == "Flat"));
    }
}
