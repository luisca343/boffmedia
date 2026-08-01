# Publicar una versión del Boff Launcher

Cómo se firma, se sube y se distribuye una actualización. Handoff §9
("Launcher self-update + code signing").

---

## 1. Las dos firmas, que no son la misma

Se confunden constantemente y resuelven problemas distintos:

| | **Firma del updater** (minisign) | **Code signing del SO** |
|---|---|---|
| Qué protege | Que el bundle que descarga el launcher lo hayas emitido tú | Que Windows/macOS no traten el `.exe` como malware |
| Quién la comprueba | El plugin updater de Tauri, dentro del launcher | SmartScreen, Gatekeeper, antivirus |
| Coste | 0 € | Certificado Windows + Apple Developer 99 $/año |
| Estado | **hecha** | **pendiente** — sin ella, SmartScreen avisa en la primera instalación |

Lo de abajo es todo la primera. La segunda se compra cuando toque y se
conecta en `bundle.windows.certificateThumbprint` / la config de macOS.

**La firma minisign no sustituye al code signing.** Solo la comprueba un
launcher *ya instalado*, al aplicarse una actualización; Windows no la mira
nunca, así que no hace nada por la primera instalación. Mientras no haya
certificado, lo que cubre ese hueco es el **SHA-512 publicado** en la página
de descargas (§4.4.1): no evita el aviso de SmartScreen, pero permite a
cualquiera verificar que el archivo que tiene es el que publicamos.

---

## 2. La clave privada del updater

Generada una sola vez. Está en:

```
~/.boff-launcher/boff-launcher-updater.key       # PRIVADA, chmod 600
~/.boff-launcher/boff-launcher-updater.key.pub   # pública
```

La pública ya está commiteada en `src-tauri/tauri.conf.json`
(`plugins.updater.pubkey`) — es la que el launcher lleva dentro para
verificar lo que descarga.

**Si pierdes la privada, no puedes volver a actualizar a nadie que ya tenga
el launcher instalado.** El pubkey está compilado dentro de su binario: una
clave nueva no valida las firmas viejas, y la única salida es que cada
usuario reinstale a mano. Haz una copia fuera de esta máquina (gestor de
contraseñas o un secret del CI). No la metas nunca en el repo.

Tiene contraseña, así que `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` lleva el
valor real. Guárdala **junto a la clave**: una clave que no puedes
desbloquear está tan muerta como una perdida.

---

## 3. Entornos y variables

### 3.1 Los dos entornos, elegidos por el comando

| | dev / pre-producción | producción |
|---|---|---|
| API | `https://api.ficuslab.es` | `https://api.boffmedia.es` |
| Arrancar | `pnpm --filter launcher dev` | `pnpm --filter launcher dev:prod` |
| Construir | `pnpm --filter launcher build` | `pnpm --filter launcher build:prod` |
| Config | `src-tauri/tauri.dev.conf.json` (overlay) | `src-tauri/tauri.conf.json` |
| Identificador | `es.boffmedia.launcher.dev` | `es.boffmedia.launcher` |

El entorno lo elige **el comando**, no una variable suelta del shell, y el
perfil mueve las **dos** mitades a la vez: el endpoint del updater vive en
`tauri.conf.json`, pero el host de packs/auth va compilado en Rust
(`api.rs`, `option_env!("BOFF_API_URL")`). Un build con esas dos en
desacuerdo buscaría actualizaciones en un servidor y descargaría los packs
de otro.

Por defecto se construye contra **dev**: publicar para jugadores reales es
un acto deliberado y por eso lleva su propio comando (`build:prod`).

Los identificadores distintos hacen que un build de dev y uno de
producción no compartan ni instancias ni credenciales guardadas, así que se
pueden tener los dos instalados a la vez sin que se pisen.

`build.rs` declara `cargo:rerun-if-env-changed=BOFF_API_URL`: sin esa
línea, cambiar de perfil reutiliza el binario anterior y se publica
silenciosamente con el host equivocado dentro.

Si hace falta un tercer entorno puntual, un `BOFF_API_URL` explícito en el
shell gana sobre el perfil.

### 3.2 Resumen de qué va dónde

| Archivo | Variables |
|---|---|
| `apps/api/.env` (prod: el entorno del contenedor) | `LAUNCHER_RELEASE_DIR`, `LAUNCHER_UPDATE_BASE_URL`, `PACK_BLOB_DIR` |
| `apps/launcher/.env` (nuevo, sólo para firmar y publicar por CLI/API) | `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `BOFF_ADMIN_USERNAME`/`BOFF_ADMIN_PASSWORD`, `BOFF_API_URL` |
| `apps/web/.env*` | **nada** — el panel no habla con el updater; todo pasa por la API |
| GitHub Actions secrets | sólo si se construye en CI (§3.3) |

Las tres plantillas están actualizadas: `apps/api/.env.example` y el nuevo
`apps/launcher/.env.example`.

### Para construir una release (tu máquina Windows, o el CI)

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.boff-launcher/boff-launcher-updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<la contraseña de la clave>"
```

Acepta también la ruta en `TAURI_SIGNING_PRIVATE_KEY_PATH`. Sin estas,
`tauri build` no genera los `.sig` y no hay nada que subir; con la
contraseña mal puesta, el build se queda esperando un prompt que en CI no
va a contestar nadie.

La contraseña se guarda **junto a la clave** en el gestor de contraseñas:
una clave privada que no puedes desbloquear está tan muerta como una
perdida.

### Para el servidor (apps/api)

Cada despliegue de la API apunta a sí mismo, así que el valor cambia por
entorno:

```
# API local en WSL (con `pnpm setup`):
LAUNCHER_RELEASE_DIR=./laboon/launcher-releases

# API en el contenedor de producción:
LAUNCHER_RELEASE_DIR=/app/laboon/launcher-releases
LAUNCHER_UPDATE_BASE_URL=https://api.ficuslab.es   # dev/pre-producción
# LAUNCHER_UPDATE_BASE_URL=https://api.boffmedia.es  # producción
```

En local, `pnpm setup` crea `laboon/` en la raíz del repositorio y enlaza
`apps/api/laboon` hacia ella. En producción, `/app/laboon` debe ser el volumen
persistente montado en el contenedor. `laboon` está fuera de `public` a
propósito: los blobs y los bundles se sirven detrás de la API, no como
archivos públicos estáticos.

| Variable | Obligatoria | Qué hace |
|---|---|---|
| `LAUNCHER_RELEASE_DIR` | **sí en prod** | Dónde se guardan los bundles. Por defecto `cwd/data/launcher-releases`, que en Docker vive en la capa de escritura del contenedor y **se borra en cada redespliegue**. Ruta absoluta tal como la ve el contenedor, no la del host. No hay que crearla a mano: el upload hace `mkdir` recursivo. |
| `LAUNCHER_UPDATE_BASE_URL` | recomendada | Origen absoluto que el feed escribe en sus campos `url`, sin barra final. Sin ella se deriva de `x-forwarded-proto`/`host`, que es correcto en dev y detrás de un proxy bien configurado, y silenciosamente incorrecto detrás de uno mal configurado — el launcher acabaría descargando de `http://localhost`. Tauri pide esa URL desde otro proceso, así que el fallo saldría en la máquina del usuario, no en la tuya. |

Nunca hay que copiar un artefacto a mano a ese directorio: se sube por HTTP
(§4.3) y es el servidor el que escribe el archivo.

#### `PACK_BLOB_DIR` tiene el mismo problema, y hoy está sin definir

Resuelve a `<cwd>/data/pack-blobs` dentro del contenedor, así que un
redespliegue se lleva por delante los blobs de override de todos los packs
publicados y esos packs empiezan a fallar en la instalación con «falta
subirlo». Debe apuntar también al mount persistente:

```
PACK_BLOB_DIR=/app/laboon/pack-blobs
```

Si ya hay algún pack de override publicado, sus blobs hay que volver a
subirlos después de mover la variable.

### En el launcher (`apps/launcher/.env`)

`BOFF_API_URL` apunta el launcher a otra API. Vale tanto para los packs
como para el updater, y en tiempo de ejecución gana sobre lo compilado.
Normalmente no hace falta tocarlo: el perfil de build (§3.1) ya lo pone.

Ese archivo **no lo carga nadie solo**: a diferencia de la API y la web,
aquí las variables las consumen `cargo` y el CLI de Tauri, que heredan el
entorno del shell. Vite sólo carga `.env` para el renderer y sólo expone
los prefijos `VITE_`/`TAURI_ENV_`. Por eso el flujo es:

```bash
cd apps/launcher
cp .env.example .env
set -a; source .env; set +a
pnpm build          # dev/ficuslab · pnpm build:prod para producción
```

### 3.3 La credencial de admin

Si publicas desde el portal de administración, no necesitas configurar
`BOFF_ADMIN_USERNAME`/`BOFF_ADMIN_PASSWORD`: el portal reutiliza la sesión del
administrador y envía el JWT automáticamente. Esta sección solo aplica al
flujo por `curl`, CLI o CI.

**No existe ninguna API key ni cuenta de servicio en este proyecto.** El
único credencial que pasa `@Roles(BOFF_ADMIN)` es un JWT de un usuario real
(`apps/api/src/api/_utils/guards/roles.guard.ts:10-18`, que lee
`req.user.roles` del payload del token). Los tokens de máquina que sí
existen no sirven aquí:

- el `apiToken` del mod (`TERAS_API_TOKEN`) es opaco, sólo lo acepta
  `GameOrUserAuthGuard` y nunca rellena `req.user`, así que `RolesGuard`
  lo rechaza;
- la sesión del launcher sólo vale para `/packs/launcher/*` y rellena
  `req.launcher`, no `req.user`.

#### Crear el usuario de servicio (una vez)

Usa un usuario **dedicado**, no tu cuenta personal: la release queda
firmada con su `actorId`, se puede revocar sin tocar tu acceso, y su
contraseña puede vivir en un secret sin ser la tuya.

Requisitos reales de la tabla (`apps/api/src/_db/schema/BoffMedia.ts`):
`username` único de 3–32, `email` NOT NULL y único, `password` bcrypt (si
es NULL el login devuelve siempre null — es el caso de las cuentas sólo
OAuth), y `uuid` **nullable**, así que no hace falta cuenta de Minecraft.
El login no comprueba `email_verified`. El patrón a copiar es
`apps/api/src/seed/default.ts:44-55`.

Después, el rol se concede por la tabla puente:

```sql
INSERT INTO boffmedia_user_roles (user_id, role_id)
VALUES (
  (SELECT id FROM boffmedia_users WHERE username = 'launcher-ci'),
  (SELECT id FROM boffmedia_roles WHERE name = 'BOFF_ADMIN')
);
```

Los roles se hornean en el token al hacer login, así que **un rol recién
concedido necesita un token nuevo**; no basta con reutilizar uno anterior.

#### Obtener el token

```bash
curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"launcher-ci","password":"…"}' \
  | jq -r .data.access_token
```

Ojo con dos cosas de esta API: la respuesta va envuelta en
`{success,statusCode,data}` (el token está en `data.access_token`, no en la
raíz), y el `statusCode` de un POST es **201**, así que cualquier
comprobación de `=== 200` falla. Comprueba `success`.

`/auth/login` está limitado a 10 peticiones por minuto.

#### Caducidad y renovación

| Token | Vida | Dónde |
|---|---|---|
| `access_token` | **1 h** | `apps/api/src/api/auth/auth.module.ts:25-28` |
| `refresh_token` | **7 d** | `apps/api/src/api/auth/auth.service.ts:36` |

**No guardes un token en un secret.** Guarda usuario y contraseña, y haz
login en cada publicación: un token de 1 h sobra para construir y subir, y
así no hay nada que renovar ni que caduque en el peor momento.

(Detalle a tener en cuenta si alguna vez te tienta: los dos tokens se
firman con el mismo secreto y el mismo payload, y `JwtStrategy` no mira
ningún claim de tipo, así que un `refresh_token` funciona como bearer
durante 7 días. Funciona, pero es un bearer de larga duración sin lista de
revocación — no lo uses como atajo.)

### 3.4 GitHub Actions (opcional)

Hoy no hace falta: construir en tu máquina Windows funciona. Si se quiere
CI, el runner tiene que ser **`windows-latest`** — los dos workflows
actuales son `ubuntu-latest` y compilar cruzado no es opción, porque `ring`
y `zstd-sys` necesitan el `lib.exe` de MSVC.

Secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
y `BOFF_ADMIN_USERNAME`/`BOFF_ADMIN_PASSWORD` (no un token ya emitido: ver
§3.3). `BOFF_API_URL` puede ir como `env:` normal.
`DEPLOY_HOST`/`SSH_PRIVATE_KEY` no hacen falta: el launcher se publica por
HTTP contra la API, nunca por SSH contra la máquina.

---

## 4. El proceso, de principio a fin

### 4.1 Subir la versión

`src-tauri/tauri.conf.json` → `version`. Es semver y es la que el updater
compara; las prerelease ordenan por debajo (`1.2.0-rc1 < 1.2.0`).

### 4.2 Construir en Windows

WebView2 es lo que ejecutan los usuarios; WSL da WebKitGTK, que es el
camino frágil.

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content ~/.boff-launcher/boff-launcher-updater.key -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<la contraseña>"
pnpm --filter launcher tauri build
```

`bundle.createUpdaterArtifacts` ya está en `true`, así que salen en
`src-tauri/target/release/bundle/`:

- `nsis/BoffLauncher_<v>_x64-setup.exe` + `.exe.sig`

**Ya no se genera `.msi`.** `bundle.targets` excluye `msi` a propósito: WiX no
deja personalizar los diálogos sin reescribir su UI entera, y su plantilla
arranca la app como **proceso hijo de `msiexec`** desde el botón *Finish*
(`<CustomAction Id="LaunchApplication" … Return="asyncNoWait">`), que es lo que
ataba el cierre del launcher a un diálogo «Setup was interrupted». NSIS lanza el
binario con `nsis_tauri_utils::RunAsUser`, fuera de la sesión del instalador.

Con `createUpdaterArtifacts: true`, Tauri 2 usa el formato nativo: se sube el
`.exe` y la firma es el contenido del `.sig` que lo acompaña. La extensión es
significativa: el updater elige cómo instalar a partir de ella. Los `.zip` solo
se generan si se configura `createUpdaterArtifacts` como `v1Compatible`.

Si alguna vez vuelve a hacer falta el `.msi`, basta con añadir `"msi"` a
`bundle.targets`; la personalización de `bundle.windows.wix` habría que
rehacerla (se retiró en su momento).

### 4.2.1 Personalizar el instalador

Todo vive en `src-tauri/installer/` y se cablea desde
`bundle.windows.nsis` en `tauri.conf.json`.

| Fichero | Qué controla |
|---|---|
| `nsis-header.bmp` · `nsis-sidebar.bmp` | Imágenes del asistente y del desinstalador |
| `hooks.nsh` | Estructura y comportamiento del asistente (`!define MUI_*`) |
| `lang/Spanish.nsh` · `lang/English.nsh` | **Todos** los textos |

**Imágenes.** Se generan a partir de `src-tauri/icons/icon.png`:

```bash
pnpm --filter launcher gen:installer-art
```

BMP de 24 bits con tamaños exactos (150×57 la cabecera, 164×314 el sidebar); si
no cuadran, NSIS los ignora sin avisar. Si cambias el logo, regenéralos y
**commitea los `.bmp`**: el build de Windows no ejecuta el script. La cabecera
lleva texto negro encima, por eso la banda oscura solo cubre su tercio derecho.

**Estructura (`hooks.nsh`).** Tauri hace `!include` de este fichero justo
después de `MUI2.nsh` y **antes** de insertar las páginas, así que un `!define
MUI_*` aquí llega a tiempo y se personaliza el asistente entero sin forkear la
plantilla con `nsis.template` (que habría que rebasar en cada actualización de
Tauri). La regla: solo se puede definir lo que la plantilla no define ya — un
`!define` repetido es un **error de compilación**. Lo que la plantilla ya fija
(iconos, imágenes, `MUI_FINISHPAGE_RUN`, `MUI_FINISHPAGE_SHOWREADME`) se toca
desde `tauri.conf.json`, no desde aquí.

**Textos (`lang/*.nsh`).** Un fichero en `customLanguageFiles` **reemplaza** por
completo al de Tauri, no lo extiende: si falta una de las 27 LangStrings que
`installer.nsi` referencia, NSIS no compila. Como se incluyen *después* de
`!insertmacro MUI_LANGUAGE`, redefinir aquí una `MUI_TEXT_*`/`MUI_UNTEXT_*` gana
sobre la traducción de MUI — es la única forma de tocar las páginas estándar.
Usa `${PRODUCTNAME}`/`${VERSION}`, nunca `{{...}}`: estos ficheros se copian tal
cual, sin pasar por el motor de plantillas.

Con dos idiomas y `displayLanguageSelector: false`, NSIS elige por el idioma del
sistema y cae al primero de la lista (español).

NSIS se instala en modo `currentUser` (`%LOCALAPPDATA%`), así que no pide UAC ni
al instalar ni al actualizar. La casilla de «abrir al terminar» sale
**desmarcada** (`MUI_FINISHPAGE_RUN_NOTCHECKED`).

### 4.2.2 Versión portable (sin instalador)

```powershell
pnpm --filter launcher build:portable
```

Deja `src-tauri/target/portable/BoffLauncher_<v>_portable_x64.zip` con el `.exe`
suelto. El binario ya es autocontenido (el frontend va incrustado); lo único
externo es el runtime de WebView2, presente de serie desde Windows 10 1803.

Se compila con `BOFF_PORTABLE=1`, que **desactiva la auto-actualización**: el
updater solo sabe entregar un instalador `.exe` a Windows, así que instalaría una
copia paralela y reiniciaría en ella dejando la portable huérfana. La portable
se actualiza volviendo a descargar el zip, y **no se sube al feed de releases**.

Ojo: "portable" es solo el ejecutable. Las instancias, la caché y las
credenciales siguen en las rutas de usuario de siempre, no junto al `.exe`.

### 4.3 Subir el artefacto

#### Desde el portal de administración

La forma normal para una publicación manual es `Boffmedia → Administración →
Launcher → Releases`. La pantalla usa la sesión del administrador que ya está
iniciada: no hay que copiar ni generar ningún bearer token, ni crear una cuenta
de servicio.

Selecciona el `-setup.exe` generado por Tauri, su `.sig`, la versión, la plataforma y
las notas. **Subir borrador** guarda el artefacto sin ofrecerlo todavía a los
launchers. Cuando hayas revisado la fila, pulsa **Publicar**. El botón
**Despublicar** lo saca del feed sin borrar el artefacto.

La API sigue comprobando `BOFF_ADMIN` y registra el usuario de la sesión como
`uploaded_by`; el portal solo evita gestionar el JWT manualmente.

#### Desde la API (alternativa)

Cuerpo binario en crudo, sin multipart (`express.json()` está condicionado
al content-type, así que el cuerpo llega sin consumir y va directo a
disco). El sha512 lo calcula el servidor: no se acepta del cliente.

```bash
curl -X POST "$API/launcher/admin/releases?version=0.1.0&target=windows-x86_64&notes=Arreglado%20el%20crash%20al%20revertir" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  -H "X-Updater-Signature: $(cat BoffLauncher_0.1.0_x64-setup.exe.sig)" \
  -H "X-Artifact-Filename: BoffLauncher_0.1.0_x64-setup.exe" \
  --data-binary @BoffLauncher_0.1.0_x64-setup.exe
```

`target` es la clave `{os}-{arch}` de Tauri: `windows-x86_64`,
`linux-x86_64`, `darwin-aarch64`. Requiere rol `BOFF_ADMIN`.

Re-subir la misma versión+plataforma reemplaza el artefacto.

### 4.4 Publicar

**Nace en borrador.** Hasta que no publicas, el feed no la ve — eso es lo
que te deja subir Windows, Linux y macOS por separado y soltarlas a la vez.

```bash
curl -X POST "$API/launcher/admin/releases/$ID/publish" -H "Authorization: Bearer $TOKEN"
```

`GET /launcher/admin/releases` lista todo con sus ids.

### 4.4.1 El hash publicado

Al publicar, la versión aparece automáticamente en la **página pública de
descargas** (`/launcher` en la web) con su tamaño y su **SHA-512**.

Ese hash **no hay que calcularlo a mano ni pegarlo en ningún sitio**: lo
calcula `LauncherUpdatesService.publishArtifact` sobre los bytes según
entran, se guarda en `launcher_releases.artifact_sha512` y es el mismo valor
que sirven el panel de admin y la web. No hay ninguna ruta por la que el
cliente pueda proponerlo, que es justo lo que hace que valga como
verificación.

Por qué importa mientras no haya code signing (§1): al no ir firmado con
Authenticode, Windows dice «editor desconocido» y no hay nada en el archivo
que identifique quién lo hizo. El hash publicado es lo único que permite a
alguien comprobar que el `.exe` que se ha bajado es el que publicamos —
sobre todo si le llega reenviado por Discord en vez de desde la web.

**Comprobarlo tú antes de anunciar la versión** (en la máquina de build, con
el artefacto que acabas de subir):

```powershell
Get-FileHash -Algorithm SHA512 .\BoffLauncher_0.0.2_x64-setup.exe
```

```bash
sha512sum BoffLauncher_0.0.2_x64-setup.exe   # Linux / macOS
```

Si no coincide con el que muestra `/launcher`, la subida se corrompió: hay
que despublicar (§4.5) y volver a subir el artefacto, **no** editar el hash.

En el panel de admin el hash se copia entero pulsándolo; la tabla solo
enseña los 12 primeros caracteres para que quepa.

La versión **portable** (§4.2.2) no pasa por aquí: no se sube al feed, así
que si la distribuyes, publica su hash a mano junto al enlace.

### 4.5 Si sale mal

```bash
curl -X POST "$API/launcher/admin/releases/$ID/unpublish" -H "Authorization: Bearer $TOKEN"
```

Despublicar hace que el feed vuelva a servir la anterior. Quien ya se haya
actualizado **no** vuelve atrás solo: para eso publicas una versión nueva y
más alta con el arreglo. (El rollback de *packs* es otra cosa distinta y sí
es de un clic, desde PackDetail.)

---

## 5. Qué hace el launcher

1. Al arrancar, `UpdateBanner` lanza una comprobación en segundo plano. No
   bloquea el sign-in.
2. La comprobación vive en Rust (`src-tauri/src/updates.rs`) y no en JS,
   porque el `check()` de JS no puede sobrescribir los endpoints y el host
   tiene que salir de `BOFF_API_URL` en tiempo de ejecución.
3. Pide `GET /launcher/updates/{{target}}-{{arch}}/{{current_version}}`.
   **El `-{{arch}}` es imprescindible**: Tauri sustituye `{{target}}` sólo
   por el SO (`windows`), pero el feed está indexado por la plataforma
   completa (`windows-x86_64`). Sin el sufijo, ninguna búsqueda acierta
   nunca y el launcher parece que "no tiene actualizaciones".
4. Si estás al día, el servidor responde **204** y no aparece nada.
5. Si hay versión nueva, sale un banner descartable con las notas y un
   botón que descarga, verifica la firma minisign contra el pubkey
   compilado, instala y reinicia. El progreso llega por `update://progress`.
6. Sin conexión, el banner **no** aparece ni da error: un jugador offline no
   tiene que ver un fallo que no puede arreglar. La comprobación manual de
   Ajustes → Actualizaciones sí muestra el motivo.

En modo navegador (`pnpm --filter launcher dev:renderer`) todo esto es un
no-op limpio.

---

## 6. Comprobado y no comprobado

Verificado: `cargo check`, 73 tests de Rust, `pnpm type-check`.

**Nada de esto se ha ejecutado todavía contra un updater real.** El primer
ciclo (publicar 0.0.2 y ver que un 0.0.1 instalado se actualiza solo) es lo
que valida las tres cosas que aún pueden fallar: la plantilla del endpoint,
que Tauri 2 acepte el `pub_date` con milisegundos, y la extensión del
artefacto.

Y antes de nada: **la migración 0042 (`launcher_releases`) está generada
pero sin aplicar.** El feed devuelve 500 hasta que se aplique.
