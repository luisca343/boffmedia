; Textos del instalador en español.
;
; Cableado desde tauri.conf.json (bundle.windows.nsis.customLanguageFiles). Un
; fichero personalizado REEMPLAZA por completo al de Tauri, no lo extiende: si
; falta una de las LangStrings que installer.nsi usa, la compilación de NSIS
; falla. Por eso están las 27 de Tauri aquí, aunque solo se cambie el tono de
; unas pocas.
;
; Tauri incluye este fichero DESPUÉS de `!insertmacro MUI_LANGUAGE`, así que
; redefinir una LangString MUI_TEXT_*/MUI_UNTEXT_* aquí gana sobre la traducción
; que trae MUI. Es la única forma de tocar los textos de las páginas estándar.
;
; ${PRODUCTNAME} y ${VERSION} son defines reales de NSIS. No uses {{...}}: los
; ficheros de idioma no pasan por el motor de plantillas, se copian tal cual.

; --- Páginas del asistente (referenciadas desde installer/hooks.nsh) ---
LangString boffWelcomeTitle ${LANG_SPANISH} "Instalar ${PRODUCTNAME}"
LangString boffWelcomeText ${LANG_SPANISH} "Este asistente instalará ${PRODUCTNAME} ${VERSION} en tu equipo.$\r$\n$\r$\nLa app se encarga de descargar, actualizar y arrancar los packs de Boffmedia, y trae las herramientas de Boffmedia integradas: no hace falta instalar Java ni Forge por tu cuenta.$\r$\n$\r$\nPulsa Siguiente para continuar."
LangString boffDirText ${LANG_SPANISH} "La app se instalará en la carpeta indicada. Aquí solo va el programa: los mundos, los mods y las instancias se guardan aparte, en tu carpeta de usuario, y no se borran al desinstalar."
LangString boffFinishTitle ${LANG_SPANISH} "${PRODUCTNAME} está listo"
LangString boffFinishText ${LANG_SPANISH} "Ya puedes abrir ${PRODUCTNAME} y autorizarla con tu cuenta de Boffmedia. Las herramientas funcionan sin iniciar sesión.$\r$\n$\r$\nSe actualiza sola: cuando haya una versión nueva te avisará dentro de la propia app."
LangString boffRunApp ${LANG_SPANISH} "Abrir ${PRODUCTNAME} ahora"
LangString boffFinishLink ${LANG_SPANISH} "Ir a boffmedia.es"
LangString boffAbortWarning ${LANG_SPANISH} "¿Seguro que quieres salir de la instalación de ${PRODUCTNAME}?"
LangString boffUnAbortWarning ${LANG_SPANISH} "¿Seguro que quieres cancelar la desinstalación de ${PRODUCTNAME}?"

; --- Textos de páginas estándar de MUI que merece la pena concretar ---
LangString MUI_TEXT_DIRECTORY_TITLE ${LANG_SPANISH} "Carpeta de instalación"
LangString MUI_TEXT_DIRECTORY_SUBTITLE ${LANG_SPANISH} "Elige dónde se instalará ${PRODUCTNAME}."
LangString MUI_TEXT_INSTALLING_TITLE ${LANG_SPANISH} "Instalando"
LangString MUI_TEXT_INSTALLING_SUBTITLE ${LANG_SPANISH} "Espera mientras se instala ${PRODUCTNAME}."
LangString MUI_TEXT_FINISH_TITLE ${LANG_SPANISH} "Instalación completada"
LangString MUI_TEXT_FINISH_SUBTITLE ${LANG_SPANISH} "${PRODUCTNAME} se ha instalado correctamente."
LangString MUI_UNTEXT_CONFIRM_TITLE ${LANG_SPANISH} "Desinstalar ${PRODUCTNAME}"
LangString MUI_UNTEXT_CONFIRM_SUBTITLE ${LANG_SPANISH} "Se quitará ${PRODUCTNAME} de tu equipo."
LangString MUI_UNTEXT_UNINSTALLING_TITLE ${LANG_SPANISH} "Desinstalando"
LangString MUI_UNTEXT_UNINSTALLING_SUBTITLE ${LANG_SPANISH} "Espera mientras se quita ${PRODUCTNAME}."

; --- Las 27 de Tauri. Obligatorias: installer.nsi las referencia siempre. ---
LangString addOrReinstall ${LANG_SPANISH} "Añadir o reinstalar componentes"
LangString alreadyInstalled ${LANG_SPANISH} "Ya está instalado"
LangString alreadyInstalledLong ${LANG_SPANISH} "${PRODUCTNAME} ${VERSION} ya está instalado. Elige qué quieres hacer y pulsa Siguiente."
LangString appRunning ${LANG_SPANISH} "${PRODUCTNAME} está abierto. Ciérralo y vuelve a intentarlo."
LangString appRunningOkKill ${LANG_SPANISH} "${PRODUCTNAME} está abierto.$\nPulsa Aceptar para cerrarlo y continuar."
LangString chooseMaintenanceOption ${LANG_SPANISH} "Elige qué operación quieres realizar."
LangString choowHowToInstall ${LANG_SPANISH} "Elige cómo quieres instalar ${PRODUCTNAME}."
LangString createDesktop ${LANG_SPANISH} "Crear un acceso directo en el escritorio"
LangString deleteAppData ${LANG_SPANISH} "Borrar también los datos: instancias, mundos, mods y sesión iniciada"
LangString dontUninstall ${LANG_SPANISH} "No desinstalar"
LangString dontUninstallDowngrade ${LANG_SPANISH} "No desinstalar (este instalador no permite volver a una versión anterior sin desinstalar)"
LangString failedToKillApp ${LANG_SPANISH} "No se ha podido cerrar ${PRODUCTNAME}. Ciérralo a mano y vuelve a intentarlo."
LangString installingWebview2 ${LANG_SPANISH} "Instalando WebView2..."
LangString newerVersionInstalled ${LANG_SPANISH} "Ya tienes instalada una versión más reciente de ${PRODUCTNAME}. No conviene instalar una anterior; si aun así quieres hacerlo, desinstala primero la actual. Elige qué quieres hacer y pulsa Siguiente."
LangString older ${LANG_SPANISH} "anterior"
LangString olderOrUnknownVersionInstalled ${LANG_SPANISH} "Tienes instalada una versión $R4 de ${PRODUCTNAME}. Conviene desinstalarla antes de continuar. Elige qué quieres hacer y pulsa Siguiente."
LangString silentDowngrades ${LANG_SPANISH} "Este instalador no permite volver a una versión anterior en modo silencioso. Usa el instalador con interfaz gráfica.$\n"
LangString unableToUninstall ${LANG_SPANISH} "No se ha podido desinstalar."
LangString uninstallApp ${LANG_SPANISH} "Desinstalar ${PRODUCTNAME}"
LangString uninstallBeforeInstalling ${LANG_SPANISH} "Desinstalar antes de instalar"
LangString unknown ${LANG_SPANISH} "desconocida"
LangString webview2AbortError ${LANG_SPANISH} "No se ha podido instalar WebView2, y ${PRODUCTNAME} no funciona sin él. Prueba a lanzar el instalador otra vez."
LangString webview2DownloadError ${LANG_SPANISH} "Error al descargar WebView2: $0"
LangString webview2DownloadSuccess ${LANG_SPANISH} "WebView2 descargado."
LangString webview2Downloading ${LANG_SPANISH} "Descargando WebView2..."
LangString webview2InstallError ${LANG_SPANISH} "La instalación de WebView2 ha fallado con el código $1."
LangString webview2InstallSuccess ${LANG_SPANISH} "WebView2 instalado."
