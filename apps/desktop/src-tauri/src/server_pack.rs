//! A runnable dedicated-server bundle.
//!
//! Two shapes exist in the ecosystem and they are NOT interchangeable, which is
//! the whole reason this module sits next to the `.mrpack` exporter rather than
//! replacing it:
//!
//!   * Modrinth's `.mrpack` (`local_packs::export_server_mrpack`) is a
//!     MANIFEST. Something else — mrpack-install, mrpack4server, a host's
//!     control panel — reads it, downloads the files and installs the loader.
//!     Nothing in the file itself runs, and that is by design: Modrinth
//!     deliberately has no separate server artifact, it has `env.server` plus
//!     `server-overrides/` and delegates the setup to an installer.
//!   * CurseForge's server pack is a DIRECTORY. The jars are already inside and
//!     a start script installs the modloader server on first boot. Unzip, run
//!     the script, done — no third-party tool in the loop.
//!
//! This module produces the second one, because "create a server pack" reads to
//! an admin as "give me something that sets the server up" and only that shape
//! does. The `.mrpack` export stays and is still the right answer for a host
//! panel: it is one to three orders of magnitude smaller, since it ships URLs
//! where this ships bytes.
//!
//! Scope, deliberately: LOCAL packs only, matching `export_mrpack`. A managed
//! pack's files come through the entitlement-checked API proxy, so bundling
//! them into a ZIP that then travels anywhere is a redistribution decision, not
//! a packaging one.

use std::collections::HashSet;
use std::io::Write as _;

use serde::Serialize;
use tauri_plugin_dialog::DialogExt;

use crate::install::files::{local_blob_path, resolve_url};
use crate::install::paths::Layout;
use crate::install::resolve::{fetch_for, loader_of, Fetch, LoaderKind, PlannedFile};
use crate::install::InstallFailure;
use crate::pack::PackManifest;
use crate::pack::PackManifestVersionFilesItemEnvServer as EnvServer;

/// Emitted once per bundled file so the UI can show a real bar: a server pack
/// is the mod jars themselves, so this is a multi-hundred-megabyte operation
/// and a spinner would look like a hang.
pub const EVENT_SERVER_ZIP_PROGRESS: &str = "server-zip-progress";

/// Written into `user_jvm_args.txt` (Forge/NeoForge >= 1.17) or passed to
/// `java -jar` directly. Conservative on purpose — the admin's box is not ours
/// to size, and the README says where to change it.
const DEFAULT_JVM_ARGS: &str = "-Xms2G -Xmx4G";

/// Used only if meta.fabricmc.net cannot be reached at export time. The Fabric
/// server-jar endpoint takes the INSTALLER version in its path
/// (`/v2/versions/loader/{game}/{loader}/{installer}/server/jar`) — there is no
/// two-argument form — so the script cannot be written without one.
const FABRIC_INSTALLER_FALLBACK: &str = "1.1.0";

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload<'a> {
    slug: &'a str,
    done: usize,
    total: usize,
    file: &'a str,
}

/// What the export actually produced, so the UI can tell the truth about it
/// instead of a bare "done". `skipped` is the load-bearing field: a
/// user-provided file cannot be shipped to a server by definition, and an admin
/// who is not told that finds out when the server crashes on boot.
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerZipReport {
    pub path: String,
    pub file_count: usize,
    pub total_bytes: u64,
    pub skipped: Vec<SkippedFile>,
    pub minecraft: String,
    /// The mrpack dependency key (`forge`, `neoforge`, `fabric-loader`) or
    /// `null` for a pack that declares no loader.
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    /// The save directory the bundle ships and `server.properties` points
    /// `level-name` at, if the pack bundles a world.
    pub world_folder: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkippedFile {
    pub path: String,
    pub reason: String,
}

/// Anything that ends up interpolated into a shell or batch script. A pack
/// author types the loader version, so treat it as untrusted: a version string
/// carrying `;` or `$(` would be a command injection into a file the admin runs
/// as their server user.
fn script_safe(value: &str, what: &str) -> Result<String, InstallFailure> {
    let ok = !value.is_empty()
        && value.len() <= 64
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-' | '+'));
    if !ok {
        return Err(InstallFailure::message(format!(
            "«{value}» no sirve como {what} en un script de arranque; corrige la versión del pack."
        )));
    }
    Ok(value.to_string())
}

/// A `.properties` value: ASCII-safe, backslash-escaped, one line. Anything
/// outside printable ASCII is dropped rather than escaped to `\uXXXX` — this is
/// a MOTD, not data, and a mangled accent is better than a file the server
/// refuses to parse.
fn properties_value(value: &str) -> String {
    value
        .chars()
        .filter(|c| c.is_ascii_graphic() || *c == ' ')
        .map(|c| if c == '\\' { '/' } else { c })
        .take(120)
        .collect()
}

#[tauri::command]
pub async fn export_server_zip(
    app: tauri::AppHandle,
    slug: String,
) -> Result<ServerZipReport, InstallFailure> {
    let dir = crate::local_packs::safe_local_dir(&app, &slug)?;
    let manifest = crate::local_packs::read_manifest(&dir)?;

    // Only Minecraft has a dedicated server. An emulator pack has no such
    // thing, and saying so beats producing a ZIP of ROMs with a start script.
    match manifest.pack.game_type.as_ref() {
        None | Some(crate::pack::PackManifestPackGameType::Minecraft) => {}
        Some(_) => {
            return Err(InstallFailure::message(
                "Solo los packs de Minecraft pueden generar un servidor.".to_string(),
            ))
        }
    }

    let deps = manifest.version.dependencies.as_ref().ok_or_else(|| {
        InstallFailure::message("El pack debe declarar la versión de Minecraft.".to_string())
    })?;
    let minecraft = script_safe(deps.minecraft.as_str(), "versión de Minecraft")?;

    let loader = loader_of(&manifest);
    if let Some((LoaderKind::QuiltLoader, _)) = loader {
        // The Quilt installer puts the Minecraft server in a `server/`
        // SUBDIRECTORY, so a bundle whose mods/ and config/ sit at the root
        // would silently start a server that loads none of them. Refusing is
        // honest; the `.mrpack` export covers Quilt because mrpack-install
        // handles that layout itself.
        return Err(InstallFailure::message(
            "Quilt todavía no tiene servidor autoinstalable aquí: exporta el .mrpack y \
             despliégalo con mrpack-install."
                .to_string(),
        ));
    }
    let loader_version = match &loader {
        Some((_, v)) => Some(script_safe(v, "versión del modloader")?),
        None => None,
    };

    let file_name = format!("{}-server.zip", manifest.pack.slug.as_str());
    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog
            .file()
            .set_file_name(&file_name)
            .add_filter("Servidor (ZIP)", &["zip"])
            .blocking_save_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La exportación se interrumpió: {e}")))?;

    let Some(target) = chosen else {
        return Err(InstallFailure::message("Exportación cancelada.".to_string()));
    };
    let target = target
        .into_path()
        .map_err(|e| InstallFailure::message(format!("Ruta de destino inválida: {e}")))?;

    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffmediaApp/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    let settings = crate::settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;

    let out = std::fs::File::create(&target)
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el archivo: {e}")))?;
    let mut zip = zip::ZipWriter::new(out);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // Every path already written, so the generated server.properties / eula.txt
    // never overwrite one the pack ships itself (an author who put a tuned
    // server.properties in their pack meant it), and so a duplicate zip entry
    // is impossible.
    let mut written: HashSet<String> = HashSet::new();
    let mut skipped: Vec<SkippedFile> = Vec::new();
    let mut total_bytes: u64 = 0;

    // Only the files a dedicated server can actually use. `unsupported` means
    // the mod cannot load headless at all — shipping a shader pack to a server
    // is the exact chore this feature exists to remove.
    let wanted: Vec<_> = manifest
        .version
        .files
        .iter()
        .filter(|f| f.env.server != EnvServer::Unsupported)
        .collect();
    let total = wanted.len();

    for (index, f) in wanted.iter().enumerate() {
        let path = f.path.to_string();
        let _ = app_emit(
            &app,
            ProgressPayload {
                slug: &slug,
                done: index,
                total,
                file: &path,
            },
        );

        let fetch = fetch_for(&f.source, &path)?;
        match &fetch {
            // The player supplies these on their own machine; there is nothing
            // to bundle and no way to obtain one. Reported, never silent.
            Fetch::UserProvided { hint } => {
                skipped.push(SkippedFile {
                    path,
                    reason: format!("lo aporta el jugador ({hint})"),
                });
                continue;
            }
            // Emulator-only by construction, so unreachable for a Minecraft
            // pack — but a skip with a reason beats a panic if that changes.
            Fetch::Patched { .. } => {
                skipped.push(SkippedFile {
                    path,
                    reason: "se genera al instalar (romhack)".to_string(),
                });
                continue;
            }
            _ => {}
        }

        let sha512 = f.sha512.to_string().to_lowercase();
        let bytes = load_bytes(&app, &http, &layout, &manifest, &path, &sha512, &fetch).await?;
        total_bytes += bytes.len() as u64;

        zip.start_file(&path, options)
            .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{path}»: {e}")))?;
        zip.write_all(&bytes)
            .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{path}»: {e}")))?;
        written.insert(path);
    }

    // A dedicated server reads ONE world, from `level-name`, at the server
    // root — not from `saves/`, which is a client-side convention. So the first
    // bundled world becomes the server's world under its own folder name and
    // server.properties points at it; any further world is reported, because a
    // server cannot run two.
    let mut world_folder: Option<String> = None;
    for (index, world) in manifest.version.worlds.iter().enumerate() {
        let folder = world.folder.as_str().to_string();
        if index > 0 {
            skipped.push(SkippedFile {
                path: folder,
                reason: "un servidor solo puede tener un mundo".to_string(),
            });
            continue;
        }
        let sha512 = world.sha512.as_str().to_lowercase();
        let fetch = fetch_for_world(&world.source)?;
        let bytes = match load_bytes(
            &app, &http, &layout, &manifest, &folder, &sha512, &fetch,
        )
        .await
        {
            Ok(b) => b,
            Err(e) => {
                skipped.push(SkippedFile {
                    path: folder,
                    reason: format!("no se pudo obtener el mundo: {}", e.message),
                });
                continue;
            }
        };

        let mut archive = zip::ZipArchive::new(std::io::Cursor::new(&bytes)).map_err(|e| {
            InstallFailure::message(format!("El mundo «{folder}» no es un zip válido: {e}"))
        })?;
        for i in 0..archive.len() {
            let Ok(mut entry) = archive.by_index(i) else {
                continue;
            };
            let Some(name) = entry.enclosed_name().map(|p| p.to_string_lossy().replace('\\', "/"))
            else {
                continue;
            };
            if name.is_empty() || name.ends_with('/') {
                continue;
            }
            let dest = format!("{folder}/{name}");
            if !written.insert(dest.clone()) {
                continue;
            }
            zip.start_file(&dest, options).map_err(|e| {
                InstallFailure::message(format!("No se pudo escribir «{dest}»: {e}"))
            })?;
            std::io::copy(&mut entry, &mut zip).map_err(|e| {
                InstallFailure::message(format!("No se pudo escribir «{dest}»: {e}"))
            })?;
        }
        world_folder = Some(world.folder.as_str().to_string());
    }

    let loader_key = loader.map(|(kind, _)| kind.key().to_string());
    let fabric_installer = match loader_key.as_deref() {
        Some("fabric-loader") => resolve_fabric_installer(&http).await,
        _ => FABRIC_INSTALLER_FALLBACK.to_string(),
    };

    let generated = GeneratedFiles {
        pack_name: manifest.pack.name.as_str(),
        minecraft: &minecraft,
        loader: loader_key.as_deref(),
        loader_version: loader_version.as_deref(),
        fabric_installer: &fabric_installer,
        world_folder: world_folder.as_deref(),
        skipped: &skipped,
    };
    for (path, body) in generated.emit() {
        if !written.insert(path.clone()) {
            continue;
        }
        zip.start_file(&path, options)
            .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{path}»: {e}")))?;
        zip.write_all(body.as_bytes())
            .map_err(|e| InstallFailure::message(format!("No se pudo escribir «{path}»: {e}")))?;
    }

    zip.finish()
        .map_err(|e| InstallFailure::message(format!("No se pudo cerrar el archivo: {e}")))?;

    let _ = app_emit(
        &app,
        ProgressPayload {
            slug: &slug,
            done: total,
            total,
            file: "",
        },
    );

    Ok(ServerZipReport {
        path: target.to_string_lossy().to_string(),
        file_count: written.len(),
        total_bytes,
        skipped,
        minecraft,
        loader: loader_key,
        loader_version,
        world_folder,
    })
}

/// `worlds[]` and `files[]` share one `FileSource` in the zod schema, but the
/// JSON-Schema → Rust generator emits a separate enum per USE SITE, so
/// `install::resolve::fetch_for` cannot take this one. Same mapping, and it has
/// to stay the same mapping — a world reached by a different route than a file
/// is a bug waiting for the first non-`override` world.
fn fetch_for_world(
    source: &crate::pack::PackManifestVersionWorldsItemSource,
) -> Result<Fetch, InstallFailure> {
    use crate::pack::PackManifestVersionWorldsItemSource as S;
    Ok(match source {
        S::Modrinth { version_id, .. } => Fetch::ModrinthVersion {
            version_id: version_id.to_string(),
        },
        S::Url { url } => Fetch::Direct(url.clone()),
        S::Curseforge {
            project_id,
            file_id,
        } => Fetch::Proxied(crate::api::PackFile::Curseforge {
            project_id: *project_id,
            file_id: *file_id,
        }),
        S::Override { blob_sha512 } => Fetch::Proxied(crate::api::PackFile::Override {
            sha512: blob_sha512.as_str().to_lowercase(),
        }),
        S::UserProvided { hint } => Fetch::UserProvided {
            hint: hint.to_string(),
        },
        S::Patched { .. } => {
            return Err(InstallFailure::message(
                "Un mundo no puede tener origen «patched».".to_string(),
            ))
        }
    })
}

fn app_emit(app: &tauri::AppHandle, payload: ProgressPayload<'_>) -> Result<(), tauri::Error> {
    use tauri::Emitter as _;
    app.emit(EVENT_SERVER_ZIP_PROGRESS, payload)
}

/// Local blob store first, API second, public URL third.
///
/// The order is not an optimisation: an IMPORTED pack's overrides exist only on
/// this machine — the API never hosted them — so asking the API first would 404
/// and make the pack un-exportable. It is also why an installed pack exports
/// without re-downloading a gigabyte it already has on disk.
async fn load_bytes(
    app: &tauri::AppHandle,
    http: &reqwest::Client,
    layout: &Layout,
    manifest: &PackManifest,
    path: &str,
    sha512: &str,
    fetch: &Fetch,
) -> Result<Vec<u8>, InstallFailure> {
    let local = local_blob_path(layout, sha512);
    if local.is_file() {
        return std::fs::read(&local)
            .map_err(|e| InstallFailure::message(format!("No se pudo leer «{path}»: {e}")));
    }

    if let Fetch::Proxied(pack_file) = fetch {
        let response = crate::api::fetch_pack_file(
            app,
            &manifest.pack.id.to_string(),
            None,
            pack_file,
            None,
        )
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo descargar «{path}»: {e:?}")))?;
        return Ok(response
            .bytes()
            .await
            .map_err(|e| InstallFailure::message(format!("No se pudo leer «{path}»: {e}")))?
            .to_vec());
    }

    let planned = PlannedFile {
        path: path.to_string(),
        sha512: sha512.to_string(),
        size: 0,
        fetch: fetch.clone(),
        is_mod: path.to_lowercase().starts_with("mods/"),
        optional: false,
    };
    let url = resolve_url(http, &planned).await?;
    let response = http
        .get(&url)
        .send()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo descargar «{path}»: {e}")))?;
    if !response.status().is_success() {
        return Err(InstallFailure::message(format!(
            "No se pudo descargar «{path}» ({}).",
            response.status()
        )));
    }
    Ok(response
        .bytes()
        .await
        .map_err(|e| InstallFailure::message(format!("No se pudo leer «{path}»: {e}")))?
        .to_vec())
}

/// Fabric's server-jar route takes the installer version in its path, so the
/// script cannot be generated without one. Resolved HERE rather than in the
/// script: the export is already online and has a JSON parser, where the start
/// script would need `jq` on Linux and PowerShell on Windows to do the same.
async fn resolve_fabric_installer(http: &reqwest::Client) -> String {
    #[derive(serde::Deserialize)]
    struct Entry {
        version: String,
        #[serde(default)]
        stable: bool,
    }
    let fetched = async {
        let res = http
            .get("https://meta.fabricmc.net/v2/versions/installer")
            .send()
            .await
            .ok()?;
        let list: Vec<Entry> = res.json().await.ok()?;
        list.iter()
            .find(|e| e.stable)
            .or_else(|| list.first())
            .map(|e| e.version.clone())
    }
    .await;
    fetched.unwrap_or_else(|| FABRIC_INSTALLER_FALLBACK.to_string())
}

// ---------------------------------------------------------------------------
// The generated half of the bundle
// ---------------------------------------------------------------------------

struct GeneratedFiles<'a> {
    pack_name: &'a str,
    minecraft: &'a str,
    loader: Option<&'a str>,
    loader_version: Option<&'a str>,
    fabric_installer: &'a str,
    world_folder: Option<&'a str>,
    skipped: &'a [SkippedFile],
}

impl GeneratedFiles<'_> {
    fn emit(&self) -> Vec<(String, String)> {
        vec![
            ("eula.txt".to_string(), self.eula()),
            ("server.properties".to_string(), self.properties()),
            ("start.sh".to_string(), self.start_sh()),
            ("start.bat".to_string(), self.start_bat()),
            ("LEEME-servidor.txt".to_string(), self.readme()),
        ]
    }

    /// Shipped as `false`. Accepting Mojang's EULA is the admin's act, not
    /// ours — so the start script stops with a one-line instruction instead,
    /// which costs one edit and keeps the acceptance where it belongs.
    fn eula(&self) -> String {
        "# https://aka.ms/MinecraftEULA\n\
         # Pon esto en true para aceptar el EULA de Minecraft y poder arrancar.\n\
         eula=false\n"
            .to_string()
    }

    fn properties(&self) -> String {
        let motd = properties_value(self.pack_name);
        let level = self.world_folder.map(properties_value);
        let mut out = String::from("# Generado por Boffmedia App. Edita a gusto.\n");
        out.push_str(&format!("motd={motd}\n"));
        if let Some(level) = level {
            // The bundle ships the world under its own folder name, so the
            // server has to be told to load THAT one; the default is `world`.
            out.push_str(&format!("level-name={level}\n"));
        }
        out.push_str("online-mode=true\nmax-players=20\nview-distance=10\n");
        out
    }

    /// The generated variables, then a fixed body. Same split ServerPackCreator
    /// uses, and for the same reason: the body is the part that must not drift
    /// per pack, so it stays a constant and only the values above it change.
    fn start_sh(&self) -> String {
        let mut out = String::from("#!/usr/bin/env sh\n");
        out.push_str(&format!("# {} — servidor dedicado\n", self.pack_name));
        out.push_str("# Generado por Boffmedia App.\n\n");
        out.push_str(&format!("MC_VERSION='{}'\n", self.minecraft));
        out.push_str(&format!("LOADER='{}'\n", self.loader.unwrap_or("vanilla")));
        out.push_str(&format!(
            "LOADER_VERSION='{}'\n",
            self.loader_version.unwrap_or("")
        ));
        out.push_str(&format!("FABRIC_INSTALLER='{}'\n", self.fabric_installer));
        out.push_str(&format!("JAVA_ARGS='{DEFAULT_JVM_ARGS}'\n"));
        out.push_str(START_SH_BODY);
        out
    }

    fn start_bat(&self) -> String {
        let mut out = String::from("@echo off\r\n");
        out.push_str(&format!("rem {} - servidor dedicado\r\n", self.pack_name));
        out.push_str("rem Generado por Boffmedia App.\r\n");
        out.push_str("setlocal enabledelayedexpansion\r\n");
        out.push_str(&format!("set \"MC_VERSION={}\"\r\n", self.minecraft));
        out.push_str(&format!(
            "set \"LOADER={}\"\r\n",
            self.loader.unwrap_or("vanilla")
        ));
        out.push_str(&format!(
            "set \"LOADER_VERSION={}\"\r\n",
            self.loader_version.unwrap_or("")
        ));
        out.push_str(&format!(
            "set \"FABRIC_INSTALLER={}\"\r\n",
            self.fabric_installer
        ));
        out.push_str(&format!("set \"JAVA_ARGS={DEFAULT_JVM_ARGS}\"\r\n"));
        out.push_str(&START_BAT_BODY.replace('\n', "\r\n"));
        out
    }

    fn readme(&self) -> String {
        let loader = match (self.loader, self.loader_version) {
            (Some(l), Some(v)) => format!("{l} {v}"),
            _ => "sin modloader (vanilla)".to_string(),
        };
        let mut out = String::new();
        out.push_str(&format!("{}\n", self.pack_name));
        out.push_str("Servidor dedicado generado por Boffmedia App.\n\n");
        out.push_str(&format!("Minecraft: {}\n", self.minecraft));
        out.push_str(&format!("Modloader: {loader}\n"));
        if let Some(w) = self.world_folder {
            out.push_str(&format!("Mundo incluido: {w} (ya apuntado en server.properties)\n"));
        }
        out.push_str(
            "\nCOMO ARRANCARLO\n\
             1. Descomprime este ZIP en la carpeta del servidor.\n\
             2. Abre eula.txt y pon eula=true (aceptas https://aka.ms/MinecraftEULA).\n\
             3. Linux/macOS: sh start.sh   ·   Windows: start.bat\n\n\
             El primer arranque descarga el servidor de Minecraft y el modloader; \
             tarda unos minutos. Los siguientes son inmediatos.\n\n\
             REQUISITOS\n\
             - Java instalado y en el PATH (17 para 1.18-1.20.4, 21 para 1.20.5+).\n\
             - curl o wget (Linux/macOS). Windows 10+ ya trae curl.\n\n\
             MEMORIA\n\
             Edita JAVA_ARGS arriba del todo en start.sh / start.bat. Si tu modloader\n\
             genera user_jvm_args.txt, cambialo tambien ahi.\n",
        );
        if !self.skipped.is_empty() {
            out.push_str("\nNO INCLUIDO EN ESTE PAQUETE\n");
            for s in self.skipped {
                out.push_str(&format!("- {}: {}\n", s.path, s.reason));
            }
        }
        out
    }
}

/// POSIX `sh`, not bash: a minimal container image may have no bash, and
/// nothing here needs it.
const START_SH_BODY: &str = r##"
set -eu
cd "$(dirname "$0")"

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: Java no esta en el PATH."
  echo "Instala el JDK que pide Minecraft $MC_VERSION (17 para 1.18-1.20.4, 21 para 1.20.5+)."
  exit 1
fi

if ! grep -qi '^[[:space:]]*eula[[:space:]]*=[[:space:]]*true' eula.txt 2>/dev/null; then
  echo "ERROR: falta aceptar el EULA de Minecraft."
  echo "Abre eula.txt, pon 'eula=true' y vuelve a ejecutar este script."
  echo "https://aka.ms/MinecraftEULA"
  exit 1
fi

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 3 -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$2" "$1"
  else
    echo "ERROR: hace falta curl o wget para instalar el modloader."
    exit 1
  fi
}

# Marker rather than "does a jar exist": Forge >=1.17 leaves no jar at the root
# at all, so testing for one would reinstall the loader on every boot.
if [ ! -f .boffmedia-server-installed ]; then
  echo "Instalando servidor ($LOADER $LOADER_VERSION, Minecraft $MC_VERSION)..."
  case "$LOADER" in
    forge)
      fetch "https://maven.minecraftforge.net/net/minecraftforge/forge/$MC_VERSION-$LOADER_VERSION/forge-$MC_VERSION-$LOADER_VERSION-installer.jar" bm-installer.jar
      java -jar bm-installer.jar --installServer
      rm -f bm-installer.jar bm-installer.jar.log
      ;;
    neoforge)
      fetch "https://maven.neoforged.net/releases/net/neoforged/neoforge/$LOADER_VERSION/neoforge-$LOADER_VERSION-installer.jar" bm-installer.jar
      java -jar bm-installer.jar --installServer
      rm -f bm-installer.jar bm-installer.jar.log
      ;;
    fabric-loader)
      fetch "https://meta.fabricmc.net/v2/versions/loader/$MC_VERSION/$LOADER_VERSION/$FABRIC_INSTALLER/server/jar" server.jar
      ;;
    *)
      echo "Este pack no declara modloader: deja un server.jar de Minecraft $MC_VERSION aqui."
      ;;
  esac

  # Forge/NeoForge >=1.17 run through run.sh + user_jvm_args.txt, so the memory
  # settings have to land THERE — a -Xmx on the java command line would be
  # ignored by the generated launcher.
  if [ -f user_jvm_args.txt ]; then
    for arg in $JAVA_ARGS; do echo "$arg" >> user_jvm_args.txt; done
  fi
  : > .boffmedia-server-installed
fi

# Forge/NeoForge >=1.17 ship this and it forwards "$@", so nogui gets through.
if [ -f run.sh ]; then
  chmod +x run.sh
  exec ./run.sh nogui
fi

JAR=""
for candidate in server.jar fabric-server-launch.jar minecraft_server.jar; do
  if [ -f "$candidate" ]; then JAR="$candidate"; break; fi
done
if [ -z "$JAR" ]; then
  JAR=$(ls -1 forge-*.jar neoforge-*.jar 2>/dev/null | head -n 1 || true)
fi
if [ -z "$JAR" ]; then
  echo "ERROR: no encuentro el jar del servidor. Borra .boffmedia-server-installed y reintenta."
  exit 1
fi

exec java $JAVA_ARGS -jar "$JAR" nogui
"##;

const START_BAT_BODY: &str = r##"
cd /d "%~dp0"

where java >nul 2>&1
if errorlevel 1 (
  echo ERROR: Java no esta en el PATH.
  echo Instala el JDK que pide Minecraft %MC_VERSION% ^(17 para 1.18-1.20.4, 21 para 1.20.5+^).
  pause
  exit /b 1
)

findstr /i /r /c:"^ *eula *= *true" eula.txt >nul 2>&1
if errorlevel 1 (
  echo ERROR: falta aceptar el EULA de Minecraft.
  echo Abre eula.txt, pon eula=true y vuelve a ejecutar este script.
  echo https://aka.ms/MinecraftEULA
  pause
  exit /b 1
)

if not exist .boffmedia-server-installed (
  echo Instalando servidor ^(%LOADER% %LOADER_VERSION%, Minecraft %MC_VERSION%^)...
  if "%LOADER%"=="forge" (
    call :fetch "https://maven.minecraftforge.net/net/minecraftforge/forge/%MC_VERSION%-%LOADER_VERSION%/forge-%MC_VERSION%-%LOADER_VERSION%-installer.jar" bm-installer.jar || goto :failed
    java -jar bm-installer.jar --installServer || goto :failed
    del /q bm-installer.jar bm-installer.jar.log 2>nul
  ) else if "%LOADER%"=="neoforge" (
    call :fetch "https://maven.neoforged.net/releases/net/neoforged/neoforge/%LOADER_VERSION%/neoforge-%LOADER_VERSION%-installer.jar" bm-installer.jar || goto :failed
    java -jar bm-installer.jar --installServer || goto :failed
    del /q bm-installer.jar bm-installer.jar.log 2>nul
  ) else if "%LOADER%"=="fabric-loader" (
    call :fetch "https://meta.fabricmc.net/v2/versions/loader/%MC_VERSION%/%LOADER_VERSION%/%FABRIC_INSTALLER%/server/jar" server.jar || goto :failed
  ) else (
    echo Este pack no declara modloader: deja un server.jar de Minecraft %MC_VERSION% aqui.
  )

  rem Forge/NeoForge >=1.17 arrancan con run.bat + user_jvm_args.txt: la memoria
  rem va ahi, no en la linea de java.
  if exist user_jvm_args.txt (
    for %%A in (%JAVA_ARGS%) do echo %%A>>user_jvm_args.txt
  )
  echo.>.boffmedia-server-installed
)

if exist run.bat (
  call run.bat nogui
  exit /b %errorlevel%
)

set "JAR="
for %%C in (server.jar fabric-server-launch.jar minecraft_server.jar) do (
  if exist %%C if not defined JAR set "JAR=%%C"
)
if not defined JAR (
  for %%C in (forge-*.jar neoforge-*.jar) do (
    if not defined JAR set "JAR=%%C"
  )
)
if not defined JAR (
  echo ERROR: no encuentro el jar del servidor. Borra .boffmedia-server-installed y reintenta.
  pause
  exit /b 1
)

java %JAVA_ARGS% -jar "%JAR%" nogui
exit /b %errorlevel%

:fetch
where curl >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Invoke-WebRequest -Uri '%~1' -OutFile '%~2'" || exit /b 1
) else (
  curl -fL --retry 3 -o "%~2" "%~1" || exit /b 1
)
exit /b 0

:failed
echo La instalacion del modloader ha fallado.
pause
exit /b 1
"##;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn script_safe_rejects_injection() {
        assert!(script_safe("47.2.0", "x").is_ok());
        assert!(script_safe("1.20.1", "x").is_ok());
        assert!(script_safe("21.1.5-beta", "x").is_ok());
        // The reason this function exists: a pack author types these.
        assert!(script_safe("1.0; rm -rf /", "x").is_err());
        assert!(script_safe("$(curl evil)", "x").is_err());
        assert!(script_safe("a'b", "x").is_err());
        assert!(script_safe("", "x").is_err());
    }

    #[test]
    fn properties_value_stays_one_line() {
        assert_eq!(properties_value("Mi Pack"), "Mi Pack");
        assert_eq!(properties_value("a\nb"), "ab");
        assert_eq!(properties_value("C:\\x"), "C:/x");
        // Non-ASCII is dropped, not escaped — a mangled accent beats a
        // server.properties the server cannot parse.
        assert_eq!(properties_value("Ñandú"), "and");
    }

    fn gen<'a>(loader: Option<&'a str>, version: Option<&'a str>) -> GeneratedFiles<'a> {
        GeneratedFiles {
            pack_name: "Test Pack",
            minecraft: "1.20.1",
            loader,
            loader_version: version,
            fabric_installer: "1.1.0",
            world_folder: Some("mundo"),
            skipped: &[],
        }
    }

    #[test]
    fn start_scripts_carry_the_pack_values() {
        let sh = gen(Some("neoforge"), Some("47.1.0")).start_sh();
        assert!(sh.starts_with("#!/usr/bin/env sh"));
        assert!(sh.contains("MC_VERSION='1.20.1'"));
        assert!(sh.contains("LOADER='neoforge'"));
        assert!(sh.contains("LOADER_VERSION='47.1.0'"));
        assert!(sh.contains("maven.neoforged.net"));

        let bat = gen(Some("forge"), Some("47.2.0")).start_bat();
        assert!(bat.contains("set \"LOADER=forge\""));
        // CRLF throughout, or cmd.exe mis-parses the here-body.
        assert!(!bat.contains("\n\n") || bat.contains("\r\n"));
    }

    #[test]
    fn properties_points_level_name_at_the_bundled_world() {
        let props = gen(Some("forge"), Some("47.2.0")).properties();
        assert!(props.contains("level-name=mundo"));
        assert!(props.contains("motd=Test Pack"));
    }

    #[test]
    fn eula_ships_unaccepted() {
        // Accepting Mojang's EULA on the admin's behalf is not ours to do.
        assert!(gen(None, None).eula().contains("eula=false"));
    }

    #[test]
    fn readme_lists_what_was_left_out() {
        let skipped = vec![SkippedFile {
            path: "mods/rom.gba".to_string(),
            reason: "lo aporta el jugador".to_string(),
        }];
        let g = GeneratedFiles {
            skipped: &skipped,
            ..gen(Some("forge"), Some("47.2.0"))
        };
        assert!(g.readme().contains("mods/rom.gba"));
    }
}
