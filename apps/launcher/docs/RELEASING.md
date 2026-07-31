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
| `apps/launcher/.env` (nuevo, sólo para firmar y publicar) | `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `BOFF_ADMIN_USERNAME`/`BOFF_ADMIN_PASSWORD`, `BOFF_API_URL` |
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
LAUNCHER_RELEASE_DIR=/app/laboon/launcher-releases
LAUNCHER_UPDATE_BASE_URL=https://api.ficuslab.es   # dev/pre-producción
# LAUNCHER_UPDATE_BASE_URL=https://api.boffmedia.es  # producción
```

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

- `msi/BoffLauncher_<v>_x64_en-US.msi` + `.msi.zip` + `.msi.zip.sig`
- `nsis/BoffLauncher_<v>_x64-setup.exe` + `.nsis.zip` + `.nsis.zip.sig`

**Lo que se sube es el `.zip`, no el `.msi`/`.exe`**, y la firma es el
contenido del `.sig` que lo acompaña. La extensión es significativa: el
updater elige cómo instalar a partir de ella.

### 4.3 Subir el artefacto

Cuerpo binario en crudo, sin multipart (`express.json()` está condicionado
al content-type, así que el cuerpo llega sin consumir y va directo a
disco). El sha512 lo calcula el servidor: no se acepta del cliente.

```bash
curl -X POST "$API/launcher/admin/releases?version=0.1.0&target=windows-x86_64&notes=Arreglado%20el%20crash%20al%20revertir" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  -H "X-Updater-Signature: $(cat BoffLauncher_0.1.0_x64_en-US.msi.zip.sig)" \
  -H "X-Artifact-Filename: BoffLauncher_0.1.0_x64_en-US.msi.zip" \
  --data-binary @BoffLauncher_0.1.0_x64_en-US.msi.zip
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
