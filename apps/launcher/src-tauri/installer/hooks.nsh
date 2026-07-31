; Personalización del instalador NSIS del Boff Launcher.
;
; Tauri hace `!include` de este fichero MUY ARRIBA en su installer.nsi (justo
; después de MUI2.nsh y antes de cualquier `!insertmacro MUI_PAGE_*`), que es
; exactamente lo que hace falta: las páginas del asistente leen estos `!define`
; en el momento en que se insertan. Por eso se puede personalizar el asistente
; entero SIN forkear la plantilla (`nsis.template`), que habría que rebasar a
; mano en cada actualización de Tauri.
;
; Solo se puede definir aquí lo que la plantilla NO define ya: un `!define`
; repetido es un error de compilación en NSIS. La plantilla ya fija MUI_ICON,
; MUI_UNICON, MUI_WELCOMEFINISHPAGE_BITMAP, MUI_HEADERIMAGE*,
; MUI_FINISHPAGE_NOAUTOCLOSE, MUI_FINISHPAGE_SHOWREADME* y MUI_FINISHPAGE_RUN
; (con su RUN_FUNCTION), así que esos se configuran desde tauri.conf.json.
;
; Los `$(...)` son LangStrings de installer/lang/*.nsh, que se incluyen DESPUÉS
; que este fichero. No es un problema: NSIS resuelve las LangStrings al final de
; la compilación y el propio MUI usa este mismo patrón para sus textos.

; La casilla «ejecutar al terminar» viene marcada por defecto en MUI. Aquí se
; desmarca: el proceso lo lanza el instalador (nsis_tauri_utils::RunAsUser), y
; encadenar instalación y primer arranque solo sirve para que un fallo de uno se
; lea como fallo del otro.
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_RUN_TEXT "$(boffRunApp)"

; Página de bienvenida.
!define MUI_WELCOMEPAGE_TITLE "$(boffWelcomeTitle)"
!define MUI_WELCOMEPAGE_TEXT "$(boffWelcomeText)"

; Página de destino.
!define MUI_DIRECTORYPAGE_TEXT_TOP "$(boffDirText)"

; Página final.
!define MUI_FINISHPAGE_TITLE "$(boffFinishTitle)"
!define MUI_FINISHPAGE_TEXT "$(boffFinishText)"
!define MUI_FINISHPAGE_LINK "$(boffFinishLink)"
!define MUI_FINISHPAGE_LINK_LOCATION "https://boffmedia.es"

; Salir a medias deja una instalación parcial, así que se confirma.
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT "$(boffAbortWarning)"
!define MUI_UNABORTWARNING
!define MUI_UNABORTWARNING_TEXT "$(boffUnAbortWarning)"

; El desinstalador solo tiene páginas CONFIRM e INSTFILES (la plantilla no
; inserta MUI_UNPAGE_WELCOME), así que sus textos NO se configuran aquí: se
; sobrescriben las LangStrings MUI_UNTEXT_* en installer/lang/*.nsh.
