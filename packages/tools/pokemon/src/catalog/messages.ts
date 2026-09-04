// AUTO-EXTRACTED from apps/web/locales/{es,en}/tools/. This package OWNS these
// keys — the web catalog does not carry them.
//
//   tools.pmdsky.*    — from tools/pmdsky/{common,dungeons}.json
//   tools.tcgpocket.* — from tools/tcgpocket/common.json
//   tools.vgc.*       — from tools/vgc.json (was the top-level `vgc.*`)
//
// One file, and one plain object literal, deliberately: `scripts/check-i18n.mjs`
// reads this catalog by slicing the text between the assignment and `as const`
// and running it through JSON.parse, so it can verify key parity without
// executing TypeScript. A catalog assembled from parts at runtime type-checks
// and then makes that check crash — which is why this is one file rather than
// one per tool.
//
// Both tools' `manifest.*` blocks carry their registry title and description,
// and TCG Pocket's `app.coleccion.*` gained the strings the offline-first
// collection needs (a queued save, a rejected sync, the local-only banner).
//
// Spanish is the source of truth; English is the translation.

export const messages = {
  "es": {
    "tools": {
      "pmdsky": {
        "questTypes": {
          "RESCUE_CLIENT": "Rescatar cliente",
          "RESCUE_TARGET": "Rescatar objetivo",
          "ESCORT_TO_TARGET": "Escoltar hasta el objetivo",
          "EXLORE_WITH_CLIENT": "Explorar con cliente",
          "NORMAL": "Normal",
          "SEALED_CHAMBER": "Cámara sellada",
          "GOLDEN_CHAMBER": "Cámara dorada",
          "NEW_DUNGEON": "Nueva mazmorra (¿roto?)",
          "PROSPECT_WITH_CLIENT": "Investigar con cliente",
          "GUIDE_CLIENT": "Guiar cliente",
          "FIND_TARGET_ITEM": "Encontrar objeto",
          "DELIVER_TARGET_ITEM": "Entregar objeto",
          "SEARCH_FOR_CLIENT": "Buscar cliente",
          "STEAL_FROM_TARGET": "Robar a objetivo",
          "TARGET_HIDDEN": "Objetivo oculto",
          "TARGET_RUNS": "Objetivo huye",
          "CHALLENGE_REQUEST": "Desafío",
          "Mewtwo": "Mewtwo",
          "Entei": "Entei",
          "Raikou": "Raikou",
          "Suicune": "Suicune",
          "Jiraichi": "Jirachi",
          "TREASURE_HUNT": "Búsqueda del tesoro",
          "Normal": "Normal",
          "Escort": "Escoltar",
          "Monster House": "Casa de monstruos",
          "Arrest client (Magnemite)": "Arrestar cliente (Magnemite)",
          "Arrest client (Magnezone)": "Arrestar cliente (Magnezone)",
          "Jirachi": "Jirachi",
          "Special Floor (broken)": "Planta especial (rota)",
          "Unlock seven treasures dungeon (broken)": "Desbloquear la mazmorra de los siete tesoros (roto)"
        },
        "rewardTypes": {
          "CASH": "Dinero",
          "CASH_REWARD_ITEM": "Dinero + ??? (Objeto recompensa)",
          "ITEM": "Objeto",
          "ITEM_RANDOM": "Objeto + ??? (Aleatorio)",
          "REWARD_ITEM": "??? (Objeto recompensa)",
          "EGG": "??? (Huevo)",
          "CLIENT_JOINS": "??? (Cliente se une)"
        },
        "QUEST_TYPE": "Tipo de misión",
        "QUEST_CONFIGURATION": "Configuración de misión",
        "LOCATION_SETTINGS": "Configuración de ubicación",
        "POKEMON_SETTINGS": "Configuración de Pokémon",
        "REWARD_SETTINGS": "Configuración de recompensas",
        "EUROPEAN_VERSION": "Versión europea",
        "USE_EUROPEAN_FORMAT": "Usar formato europeo",
        "ADDITIONAL_SETTINGS": "Configuración adicional",
        "GENERATE_WONDER_MAIL": "Generar Correo Secreto",
        "WONDERMAIL_TITLE": "Generador de",
        "WONDERMAIL_SUBTITLE": "Correos Secretos",
        "WONDERMAIL": "Correo Secreto",
        "WONDER_MAIL_CREATOR": "Generador de Correos Secretos",
        "WONDER_MAIL_CREATOR_DESCRIPTION": "Crea correos secretos personalizados para Pokémon Mundo Misterioso: Exploradores del Cielo. Configura misiones, ubicaciones, Pokémon y recompensas.",
        "EUROPEAN_VERSION_TOOLTIP": "Habilita el formato de correo europeo",
        "COPY_TO_CLIPBOARD": "Copiar al portapapeles",
        "COPIED_SUCCESS": "¡Copiado correctamente!",
        "WONDER_MAIL_RESULT": "Resultado del Correo Secreto",
        "WONDER_MAIL_INSTRUCTIONS": "Haz clic en el botón de copiar para copiar el correo secreto a tu portapapeles",
        "REQUIRED_FIELD": "Campo obligatorio",
        "OPTIONAL_FIELD": "Campo opcional",
        "DISABLED_FIELD": "Campo deshabilitado",
        "MAX_FLOOR": "Planta máxima",
        "GENERATE_SUCCESS": "¡Correo secreto generado correctamente!",
        "FORM_VALIDATION": {
          "QUEST_TYPE_REQUIRED": "Selecciona un tipo de misión",
          "DUNGEON_REQUIRED": "Selecciona una mazmorra",
          "FLOOR_REQUIRED": "Indica una planta válida",
          "FLOOR_OUT_OF_RANGE": "La planta debe estar entre 1 y {max}",
          "POKEMON_REQUIRED": "Selecciona un Pokémon",
          "REWARD_TYPE_REQUIRED": "Selecciona un tipo de recompensa"
        },
        "HELP_TEXT": {
          "QUEST_TYPE": "Selecciona el tipo de misión que quieres crear",
          "QUEST_SUBTYPE": "Algunos tipos de misión tienen variaciones especiales",
          "DUNGEON": "Elige la mazmorra donde tendrá lugar la misión",
          "FLOOR": "Indica en qué planta de la mazmorra ocurrirá la misión",
          "CLIENT_POKEMON": "El Pokémon que solicita ayuda",
          "TARGET_POKEMON": "El Pokémon que debe ser rescatado o encontrado",
          "REWARD_TYPE": "Qué tipo de recompensa recibirás al completar la misión",
          "TARGET_ITEM": "El objeto que debe ser encontrado o entregado",
          "REWARD_ITEM": "El objeto que recibirás como recompensa",
          "EUROPEAN_VERSION": "Marca esta opción si juegas la versión europea del juego"
        },
        "SECTION_DESCRIPTIONS": {
          "QUEST_CONFIGURATION": "Define el tipo y características de la misión",
          "LOCATION_SETTINGS": "Especifica dónde tendrá lugar la aventura",
          "POKEMON_SETTINGS": "Configura qué Pokémon participarán en la misión",
          "REWARD_SETTINGS": "Establece las recompensas por completar la misión",
          "ADDITIONAL_SETTINGS": "Opciones adicionales para personalizar el correo"
        },
        "selectPokemon": "Selecciona un Pokémon",
        "app": {
          "title": "Generador de Correos Secretos",
          "region": "Región",
          "regionIntl": "US / JP",
          "regionEU": "EU",
          "randomize": "Aleatorio",
          "reset": "Reiniciar",
          "secType": "Tipo de misión",
          "secLocation": "Localización",
          "secPokemon": "Pokémon",
          "secReward": "Recompensa",
          "searchDungeon": "Buscar mazmorra…",
          "searchPokemon": "Buscar Pokémon…",
          "itemQuestOnly": "Solo en misiones de objeto",
          "rewardNoItem": "La recompensa actual no da objeto",
          "advanced": "Ajustes avanzados",
          "advancedSub": "Región y codificación",
          "euTitle": "Versión europea (EU)",
          "euSub": "Cambia la codificación regional del código. Mantén US / JP para la versión americana o japonesa.",
          "mailLabel": "Correo Secreto S",
          "codeLabel": "Código",
          "emptyTitle": "Sin código todavía",
          "emptyText": "Configura la misión y pulsa Generar código para obtener tu Correo Secreto.",
          "loadingTitle": "Generando…",
          "loadingText": "Codificando parámetros de la misión.",
          "readyHint": "Introdúcelo en el buzón de Correos Secretos dentro del juego.",
          "summaryHead": "Resumen de la misión",
          "sumMission": "Misión",
          "sumDungeon": "Mazmorra",
          "sumClient": "Cliente",
          "sumTarget": "Objetivo",
          "sumItem": "Objeto",
          "sumReward": "Recompensa",
          "sumPrize": "Premio",
          "errorTitle": "Revisa la configuración",
          "generate": "Generar código",
          "regenerate": "Regenerar código",
          "generating": "Generando…",
          "share": "Compartir",
          "copied": "Copiado",
          "export": "Exportar",
          "needClient": "Selecciona un Pokémon cliente",
          "floorExceeds": "La planta seleccionada supera el tamaño de la mazmorra.",
          "sameMon": "El cliente y el objetivo son el mismo Pokémon.",
          "diff": {
            "1": "Muy fácil",
            "2": "Fácil",
            "3": "Media",
            "4": "Difícil",
            "5": "Muy difícil"
          }
        },
        "DUNGEON": "Mazmorra",
        "FLOOR": "Planta",
        "QUEST_SUBTYPE": "Subtipo de misión",
        "CLIENT_POKEMON": "Pokémon cliente",
        "CLIENT_IS_TARGET": "El cliente es el objetivo",
        "FORCED_BY_QUEST_TYPE": "Forzado por tipo de misión",
        "TARGET_POKEMON": "Pokémon objetivo",
        "TARGET_ITEM": "Objeto objetivo",
        "REWARD_TYPE": "Tipo de recompensa",
        "REWARD_ITEM": "Objeto de recompensa",
        "dungeons": {
          "0": "Test Dungeon",
          "1": "Cueva Bajamar",
          "2": "Cueva Bajamar",
          "3": "Risco Calado",
          "4": "Monte Árido",
          "5": "Monte Árido",
          "6": "Cueva Cascada",
          "7": "Manzanar",
          "8": "Costa Escarpada",
          "9": "Paso Flanco",
          "10": "Monte Cuerno",
          "11": "Paso Rocoso",
          "12": "Bosque Niebla",
          "13": "Paso Boscoso",
          "14": "Cueva Vapor",
          "15": "Cueva Vapor",
          "16": "Cueva Vapor",
          "17": "Pradera Destello",
          "18": "Pradera Destello",
          "19": "Pradera Destello",
          "20": "Desierto Norte",
          "21": "Cueva Arenas",
          "22": "Cueva Arenas",
          "23": "Lago Subterráneo",
          "24": "Cueva Cristal",
          "25": "Vía Cristalina",
          "26": "Lago Cristal",
          "27": "Cueva Abismo",
          "28": "Colina Oscura",
          "29": "Ruinas Herméticas",
          "30": "Ruinas Herméticas",
          "31": "Ruinas Herméticas",
          "32": "Bosque Sombrío",
          "33": "Corazón Bosque Sombrío",
          "34": "Bosque Enraizado",
          "35": "Cueva Aguamar",
          "36": "Cueva Aguamar",
          "37": "Cueva Aguamar",
          "38": "Tierra Oculta",
          "39": "Tierra Oculta",
          "40": "Ruinas Arcanas",
          "41": "Torre del Tiempo",
          "42": "Torre del Tiempo",
          "43": "Torre del Tiempo",
          "44": "Bosque Misterio",
          "45": "Bosque Misterio",
          "46": "Isla Ventisca",
          "47": "Cueva Témpano",
          "48": "Cueva Témpano",
          "49": "Cueva Témpano",
          "50": "Mar Circundante",
          "51": "Mar Milagro",
          "52": "Mar Milagro",
          "53": "Mar Milagro",
          "54": "Cueva Regia",
          "55": "Cámara Regice",
          "56": "Cueva Regia",
          "57": "Cámara Regirock",
          "58": "Cueva Regia",
          "59": "Cámara Registeel",
          "60": "Cueva Regia",
          "61": "Cámara Regigigas",
          "62": "Monte Tribulaciones",
          "63": "La Pesadilla",
          "64": "Grieta Espacial",
          "65": "Grieta Espacial",
          "66": "Grieta Espacial",
          "67": "Cráter Oscuro",
          "68": "Cráter Oscuro",
          "69": "Cráter Oscuro",
          "70": "Ruinas Camufladas",
          "71": "Ruinas Camufladas",
          "72": "Refugio Marino",
          "73": "Mar Insondable",
          "74": "Mar Insondable",
          "75": "Desierto Trémulo",
          "76": "Desierto Trémulo",
          "77": "Monte Avalancha",
          "78": "Monte Avalancha",
          "79": "Volcán Gigante",
          "80": "Volcán Gigante",
          "81": "Gran Abismo",
          "82": "Gran Abismo",
          "83": "Escalera Celeste",
          "84": "Escalera Celeste",
          "85": "Selva Misterio",
          "86": "Selva Misterio",
          "87": "Río Sereno",
          "88": "Cueva Alud",
          "89": "Pradera Exuberante",
          "90": "Prado Chico",
          "91": "Cueva Laberinto",
          "92": "Aranjal",
          "93": "Lago Recóndito",
          "94": "Mirador Alegría",
          "95": "Monte Mistral",
          "96": "Colina Trémula",
          "97": "Espesura Perdida",
          "98": "Bosque Nocturno",
          "99": "Isla Cero Norte",
          "100": "Isla Cero Este",
          "101": "Isla Cero Oeste",
          "102": "Isla Cero Sur",
          "103": "Corazón Isla Cero",
          "104": "Torre del Destino",
          "107": "Bosque Olvido",
          "108": "Aguas Peligrosas",
          "109": "Archipiélago Sureste",
          "110": "Cueva Flama",
          "111": "Cumbre del Cielo",
          "112": "Cumbre del Cielo",
          "113": "Cumbre del Cielo",
          "114": "Cumbre del Cielo",
          "115": "Cumbre del Cielo",
          "116": "Cumbre del Cielo",
          "117": "Cumbre del Cielo",
          "118": "Cumbre del Cielo",
          "119": "Cumbre del Cielo",
          "120": "Cumbre del Cielo",
          "121": "Cumbre del Cielo",
          "122": "Cumbre del Cielo",
          "123": "Cueva Estrella",
          "124": "Cueva Estrella",
          "125": "Cueva Estrella",
          "126": "Cueva Estrella",
          "127": "Cueva Estrella",
          "128": "Bosque Oscuro",
          "129": "Cueva Oriental",
          "130": "Risco Fortuna",
          "131": "Risco Fortuna",
          "132": "Risco Fortuna",
          "133": "Valle Desolado",
          "134": "Valle Desolado",
          "135": "Valle Desolado",
          "136": "Páramo Sombrío",
          "137": "Torre del Tiempo",
          "138": "Torre del Tiempo",
          "139": "Bosque Sombrío",
          "140": "Iceberg Oscuro",
          "141": "Acantilado Abismo",
          "142": "Iceberg Oscuro",
          "143": "Iceberg Oscuro",
          "144": "Iceberg Oscuro",
          "145": "Bosque Carámbano",
          "146": "Gran Iceberg",
          "147": "Gran Iceberg",
          "148": "Gran Iceberg",
          "149": "Selva Meridional",
          "150": "Roquedal",
          "151": "Roquedal",
          "152": "Roquedal",
          "153": "Right Cave Path",
          "154": "Left Cave Path",
          "155": "Caverna Caliza",
          "156": "Caverna Caliza",
          "157": "Caverna Caliza",
          "158": "Cueva Fuente",
          "159": "Cueva Fuente",
          "160": "Cueva Fuente",
          "161": "Cueva Fuente",
          "162": "Cueva Fuente",
          "163": "Cueva Fuente",
          "164": "Cueva Fuente",
          "165": "Little Plains (Demo)",
          "166": "Mt. Clear Challenge (Demo)",
          "167": "River Trial Forest (Demo)",
          "168": "Guiding Sea (Demo)",
          "169": "Hidden Shopkeeper Village (Demo)",
          "173": "Cueva Estrella",
          "174": "Cueva Estrella",
          "175": "Armaldo's Shelter",
          "176": "Manantial Luminoso",
          "177": "Termas",
          "178": "Dojo Normal/Volador",
          "179": "Dojo Fuego/Siniestro",
          "180": "Dojo Roca/Agua",
          "181": "Dojo Planta",
          "182": "Dojo Eléctrico/Acero",
          "183": "Dojo Hielo/Tierra",
          "184": "Dojo Lucha/Psíquico",
          "185": "Dojo Veneno/Bicho",
          "186": "Dojo Dragón",
          "187": "Dojo Fantasma",
          "188": "Dojo Explorador",
          "189": "Dojo Final",
          "212": "???",
          "213": "Playa",
          "234": "Armaldo's Shelter",
          "235": "Valle Desolado",
          "239": "Risco Sharpedo",
          "240": "Risco Sharpedo",
          "241": "Cumbre del Cielo",
          "245": "Aldea Tesoro",
          "246": "Aldea Tesoro",
          "254": "Cueva Cascada",
          "255": "Cascada Secreta",
          "256": "Desierto Tremedal",
          "259": "Cueva Bajamar"
        },
        "manifest": {
          "name": "Generador de Correos Secretos",
          "category": "Generador",
          "description": "Crea correos secretos y misiones para Pokémon Mundo Misterioso: Exploradores del Cielo."
        }
      },
      "tcgpocket": {
        "loading": "Cargando…",
        "geneticapex": "Genes Formidables",
        "promo-a": "Promo A",
        "mythicalisland": "Isla Singular",
        "space-timesmackdown": "Pugna Espaciotemporal",
        "triumphantlight": "Luz Triunfal",
        "shiningrevelry": "Festival Brillante",
        "packs": {
          "mewtwo": "Mewtwo - Genes Formidables",
          "charizard": "Charizard - Genes Formidables",
          "pikachu": "Pikachu - Genes Formidables",
          "mew": "Mew - Isla Singular",
          "dialga": "Dialga - Pugna Espaciotemporal",
          "palkia": "Palkia - Pugna Espaciotemporal",
          "arceus": "Arceus - Luz Triunfal"
        },
        "item": {
          "xp": "XP",
          "packhourglass": "Reloj de arena de sobres",
          "wonderhourglass": "Reloj de arena mágico",
          "shopticket": "Cupón de tienda",
          "shinedust": "Polvo Iris"
        },
        "mewQuest": "Mew Inmersivo",
        "heroAlt": "Pokémon TCG Pocket",
        "logoAlt": "Logo de TCG Pocket",
        "heading": {
          "title": "Herramientas para",
          "highlight": "TCG Pocket",
          "subtitle": "Explora tu colección, consulta todas las cartas y optimiza tus combates"
        },
        "quickSearch": {
          "title": "Consulta rápida",
          "description": "Introduce un nombre de usuario para ver su galería de cartas",
          "placeholder": "Nombre de usuario",
          "searchButton": "Buscar"
        },
        "viewGallery": {
          "title": "Ver galería",
          "description": "Explora tu colección de cartas"
        },
        "cardsList": {
          "title": "Lista de cartas",
          "description": "Navega por todas las cartas disponibles",
          "pageTitle": "Todas las cartas",
          "noResults": "No se encontraron cartas que coincidan con la búsqueda."
        },
        "battles": {
          "title": "Combates individuales",
          "description": "Comprueba los equipos y recompensas"
        },
        "common": {
          "access": "Acceder"
        },
        "types": {
          "grass": "Planta",
          "fire": "Fuego",
          "water": "Agua",
          "lightning": "Rayo",
          "psychic": "Psíquico",
          "fighting": "Lucha",
          "darkness": "Oscuridad",
          "metal": "Metal",
          "dragon": "Dragón",
          "colorless": "Incolora"
        },
        "cardDetail": {
          "loading": "Cargando…",
          "number": "Número",
          "expansion": "Expansión",
          "rarity": "Rareza",
          "type": "Tipo",
          "hp": "PS",
          "weakness": "Debilidad",
          "retreatCost": "Coste de retirada"
        },
        "gallery": {
          "notFound": {
            "title": "Galería no encontrada",
            "description": "Esta galería no existe o todavía no tiene cartas."
          },
          "recentCards": "Cartas recientes",
          "noCards": "No se encontraron cartas.",
          "saveChanges": "Guardar cambios",
          "unknownCard": "Carta desconocida",
          "errors": {
            "recentUpdates": "No se pudieron obtener las actualizaciones recientes. Inténtalo de nuevo más tarde.",
            "bestPack": "No se pudo calcular el mejor sobre. Inténtalo de nuevo."
          },
          "header": {
            "title": "Galería de {username}",
            "cardCount": "{count} cartas en la colección"
          },
          "options": {
            "hideMissing": "Ocultar cartas faltantes",
            "showAmounts": "Mostrar cantidades",
            "selectEvent": "Seleccionar evento",
            "allCards": "Todas las cartas",
            "bestPack": "Recomendar mejor sobre"
          },
          "recentUpdates": {
            "title": "Actualizaciones recientes",
            "noUpdates": "No hay actualizaciones recientes",
            "loadMore": "Cargar más"
          }
        },
        "filter": {
          "searchPlaceholder": "Buscar cartas por nombre o número",
          "expansionPlaceholder": "Filtrar por expansión",
          "allExpansions": "Todas las expansiones"
        },
        "bestPack": {
          "dialogTitle": "Probabilidades de carta nueva por sobre",
          "bestPackGeneral": "El mejor sobre para obtener nuevas cartas es: {packName}",
          "bestPackEvent": "El mejor sobre para obtener nuevas cartas de '{eventName}' es: {packName}",
          "missingCardsCount": "Cartas faltantes: {missing} de {total}",
          "missingCardsList": "Lista de cartas faltantes:",
          "availableIn": "Disponible en:",
          "table": {
            "packName": "Nombre del sobre",
            "card": "Carta {number}",
            "total": "Total"
          }
        },
        "app": {
          "tagline": "Colección · Meta · Sobres",
          "searchCards": "Buscar carta…",
          "showing": "Mostrando {shown} de {total} cartas",
          "clearFilters": "Limpiar filtros",
          "loadMore": "Cargar más ({n} restantes)",
          "ownedOnly": "Solo mías",
          "errorTitle": "No se pudo cargar",
          "errorLead": "No pudimos cargar la base de datos de cartas. Inténtalo de nuevo más tarde.",
          "empty": {
            "title": "Sin resultados",
            "lead": "Prueba con otro término o quita algún filtro."
          },
          "tabs": {
            "panel": "Panel",
            "cartas": "Cartas",
            "coleccion": "Colección",
            "sobres": "Sobres"
          },
          "filters": {
            "expansion": "Expansión",
            "allSets": "Todas las expansiones",
            "category": "Categoría",
            "allCategories": "Todas las categorías"
          },
          "category": {
            "pokemon": "Pokémon",
            "trainer": "Entrenador",
            "supporter": "Partidario",
            "item": "Objeto",
            "energy": "Energía"
          },
          "stage": {
            "basic": "Básica",
            "stage1": "Fase 1",
            "stage2": "Fase 2"
          },
          "sort": {
            "label": "Orden",
            "num": "Número",
            "name": "Nombre",
            "rarity": "Rareza",
            "hp": "PS"
          },
          "cartas": {
            "title": "Lista de cartas",
            "lead": "Base de datos completa · {cards} cartas en {sets} expansiones."
          },
          "panel": {
            "collection": "Colección",
            "lead": "Explora cada expansión, sigue tu colección carta a carta, calcula qué sobre te conviene abrir y consulta galerías de otros jugadores. Todo en un solo panel.",
            "exploreCards": "Explorar cartas",
            "myCollection": "Mi colección",
            "openPacks": "Ver sobres",
            "owned": "Poseídas",
            "ofTotal": "de {total} cartas",
            "expansions": "Expansiones",
            "activeSets": "series activas",
            "exCards": "Cartas ex",
            "specialArt": "ilustraciones especiales",
            "crowns": "Coronas",
            "maxRarity": "máxima rareza",
            "dupes": "Repetidas",
            "forTrade": "para intercambio",
            "progressBySet": "Progreso por expansión",
            "viewCollection": "Ver colección",
            "playerGallery": "Galería de jugador",
            "galleryHint": "Consulta la colección pública de cualquier jugador de la comunidad.",
            "usernamePlaceholder": "Nombre de usuario…",
            "view": "Ver",
            "recentActivity": "Actividad reciente",
            "loginForActivity": "Inicia sesión para seguir tu actividad.",
            "noActivity": "Sin movimientos todavía."
          },
          "coleccion": {
            "myTitle": "Mi colección",
            "galleryTitle": "Galería · {user}",
            "summary": "{have} de {total} cartas · {pct}% completado · {dupes} repetidas.",
            "viewingGallery": "Viendo la galería de {user}",
            "readOnly": "Solo lectura.",
            "backToMine": "Volver a la mía",
            "searchPlaceholder": "Buscar en la colección…",
            "hideMissing": "Ocultar faltantes",
            "loginTitle": "Inicia sesión",
            "loginLead": "Accede para seguir tu colección carta a carta y guardar tus cambios.",
            "login": "Iniciar sesión",
            "unsaved": "{count, plural, one {cambio sin guardar} other {cambios sin guardar}}",
            "discard": "Descartar",
            "saveChanges": "Guardar cambios",
            "saving": "Guardando…",
            "saveSuccess": "Cambios guardados",
            "saveError": "No se pudieron guardar los cambios",
            "bestPack": "Analizador de sobres",
            "bestPackHint": "Según tu colección, calculamos el sobre con más probabilidad de darte una carta que aún no tienes.",
            "analyze": "Analizar",
            "analyzing": "Analizando…",
            "bestPackEmpty": "No hay datos suficientes para analizar los sobres.",
            "newCardOdds": "{odds} de carta nueva por sobre.",
            "pack": "Sobre",
            "new": "Nueva",
            "best": "Mejor",
            "slot": "{n}.ª",
            "saveQueued": "Guardado en este dispositivo. Se sincronizará cuando vuelva la conexión.",
            "syncRejected": "El servidor rechazó un cambio: {detail}",
            "localTitle": "Tu colección, en este dispositivo",
            "localLead": "Puedes usarla sin cuenta. Inicia sesión con Boffmedia para sincronizarla y verla desde cualquier sitio.",
            "localSignIn": "Iniciar sesión",
            "pendingSync": "{count, plural, one {# cambio sin sincronizar} other {# cambios sin sincronizar}}"
          },
          "sobres": {
            "title": "Sobres",
            "lead": "Cada expansión reparte sus cartas en uno o varios sobres. Ábrelos para ver qué cartas contienen.",
            "cardCount": "{count} cartas",
            "packCards": "Cartas del sobre",
            "noPackCards": "Este sobre no tiene cartas registradas.",
            "noPacks": "Sin sobres registrados para esta expansión.",
            "tileAria": "Sobre {name} · {setId}"
          },
          "combates": {
            "title": "Combates",
            "lead": "Los combates en solitario llegarán pronto, cuando su fuente de datos esté disponible.",
            "back": "Volver al panel"
          },
          "drawer": {
            "prev": "Anterior",
            "next": "Siguiente",
            "close": "Cerrar",
            "inCollection": "en tu colección",
            "owned": "en la colección",
            "notOwned": "No la tienes",
            "number": "Número",
            "expansion": "Expansión",
            "type": "Tipo",
            "hp": "Puntos de salud",
            "weakness": "Debilidad",
            "retreat": "Coste de retirada",
            "availableIn": "Disponible en",
            "illustrator": "Ilustrador"
          }
        },
        "manifest": {
          "name": "TCG Pocket",
          "category": "Colección",
          "description": "Explora las cartas, sigue tu colección y descubre qué sobre te conviene abrir."
        }
      },
      "vgc": {
        "calc": {
          "title": "Calculadora de daño",
          "subtitle": "Calcula el daño con condiciones de campo VGC completas",
          "share": "Compartir",
          "shareCopied": "¡Copiado!",
          "tabs": {
            "combate": "Combate",
            "matriz": "Matriz",
            "velocidad": "Velocidad",
            "tipos": "Tipos",
            "teamThreats": "Equipo → Amenazas",
            "threatsTeam": "Amenazas → Equipo"
          },
          "ui": {
            "attacker": "Atacante",
            "defender": "Defensor",
            "saved": "Equipos",
            "verdictEmpty": "Elige un movimiento con daño en cualquiera de los dos lados para ver el veredicto.",
            "emptyMove": "— vacío —",
            "add": "Añadir",
            "myTeam": "Mi equipo",
            "threats": "Amenazas",
            "matrixHint": "Pulsa un Pokémon para editar su set",
            "matrixCorner": "Atacante ↓ · Defensor →",
            "matrixEmpty": "Añade Pokémon a ambos lados para ver la matriz de daño.",
            "saveNote": "Guarda el equipo actual para reutilizarlo en la matriz o entre sesiones.",
            "editPrefix": "Editar",
            "twHint": "Espacio Raro: el más lento actúa primero",
            "reference": "Referencia",
            "referenceSub": "(máx / neutra, 31 IV)",
            "speedEmpty": "Añade Pokémon a tu equipo y a rivales para comparar velocidades.",
            "typesEmpty": "Añade Pokémon a tu equipo (pestaña Matriz) para ver su cobertura de tipos.",
            "close": "Cerrar"
          },
          "panel": {
            "attacker": "Pokémon 1 — Atacante",
            "defender": "Pokémon 2 — Defensor",
            "searchPlaceholder": "Buscar Pokémon…",
            "nature": "Naturaleza",
            "ability": "Habilidad",
            "item": "Objeto",
            "tera": "Tera",
            "status": "Estado",
            "moves": "Movimientos",
            "lv": "Nv.",
            "teraNone": "Ninguno",
            "teraTypes": {
              "Normal": "Normal",
              "Fire": "Fuego",
              "Water": "Agua",
              "Electric": "Eléctrico",
              "Grass": "Planta",
              "Ice": "Hielo",
              "Fighting": "Lucha",
              "Poison": "Veneno",
              "Ground": "Tierra",
              "Flying": "Volador",
              "Psychic": "Psíquico",
              "Bug": "Bicho",
              "Rock": "Roca",
              "Ghost": "Fantasma",
              "Dragon": "Dragón",
              "Dark": "Siniestro",
              "Steel": "Acero",
              "Fairy": "Hada",
              "Stellar": "Astral"
            },
            "statuses": {
              "Healthy": "Saludable",
              "Burned": "Quemado",
              "Paralyzed": "Paralizado",
              "Poisoned": "Envenenado",
              "Badly Poisoned": "Grav. Envenenado",
              "Frozen": "Congelado",
              "Asleep": "Dormido"
            },
            "statHp": "PS",
            "statAtk": "Atq",
            "statDef": "Def",
            "statSpa": "AtE",
            "statSpd": "DfE",
            "statSpe": "Vel",
            "colStat": "Stat",
            "colBase": "Base",
            "colStage": "Etapa",
            "colIvs": "IVs",
            "colEvs": "EVs",
            "colSp": "SP",
            "colTotal": "Total",
            "totalEvs": "Total EVs",
            "totalSp": "Total SP",
            "overBudget": "presupuesto excedido",
            "hpLabel": "PS",
            "hpReset": "Reiniciar",
            "movePlaceholder": "Movimiento {n}…",
            "loadingMoves": "Cargando movimientos…",
            "basePower": "Poder base",
            "categoryPhysical": "Fís",
            "categorySpecial": "Esp",
            "categoryStatus": "Est"
          },
          "field": {
            "title": "Campo",
            "format": "Formato",
            "singles": "Individual",
            "doubles": "Dobles",
            "weather": "Clima",
            "terrain": "Terreno",
            "conditions": "Condiciones",
            "attackerSide": "Lado atacante",
            "defenderSide": "Lado defensor",
            "weathers": {
              "Sun": "Sol",
              "Rain": "Lluvia",
              "Sand": "Tormenta de arena",
              "Snow": "Nieve",
              "Harsh Sunshine": "Sol abrasador",
              "Heavy Rain": "Diluvio"
            },
            "terrains": {
              "Electric": "Eléctrico",
              "Grassy": "Hierba",
              "Psychic": "Psíquico",
              "Misty": "Niebla"
            },
            "pill": {
              "Trick Room": "Espacio Raro",
              "Gravity": "Gravedad",
              "Magic Room": "Zona Mágica",
              "Wonder Room": "Zona Extraña",
              "Stealth Rock": "Trampa Rocas",
              "Reflect": "Reflejo",
              "Light Screen": "Pantalla de Luz",
              "Aurora Veil": "Velo Aurora",
              "Tailwind": "Viento Afín",
              "Helping Hand": "Refuerzo",
              "Spikes": "Púas"
            }
          },
          "matrix": {
            "teamLabel": "Tu equipo",
            "manyLabel": "Amenazas",
            "addPokemon": "+ Añadir Pokémon",
            "emptyTeam": "No hay Pokémon en tu equipo aún",
            "emptyMany": "No hay amenazas añadidas aún",
            "searchPlaceholder": "Buscar Pokémon…",
            "atkDefCorner": "Atacante ↓ / Defensor →"
          },
          "saved": {
            "title": "Equipos guardados",
            "empty": "No hay equipos guardados aún",
            "saveTeam": "+ Guardar equipo",
            "saveThreats": "+ Guardar rivales",
            "namePlaceholder": "Nombre para este equipo…",
            "saveButton": "Guardar",
            "cancel": "Cancelar",
            "importButton": "Importar",
            "importTitle": "Importar a biblioteca",
            "importPlaceholder": "Pega un equipo en formato Showdown…",
            "importNamePlaceholder": "Nombre para esta entrada…",
            "importSave": "Guardar en biblioteca",
            "importLoading": "Cargando datos…",
            "importError": "No se encontraron Pokémon válidos.",
            "importNameRequired": "Escribe un nombre para esta entrada.",
            "noTeam": "No hay Pokémon en el equipo",
            "noThreats": "No hay Pokémon en los rivales",
            "copied": "¡Copiado!",
            "loadAsTeam": "→ Equipo",
            "loadAsThreats": "→ Rivales",
            "copy": "Copiar",
            "view": "Ver",
            "rename": "Renombrar",
            "delete": "Eliminar",
            "pokemon": "{count} Pokémon"
          },
          "mobile": {
            "attacker": "⚔ Atacante",
            "field": "⚡ Campo",
            "defender": "🛡 Defensor",
            "spBadge": "SP"
          },
          "moveStrip": {
            "selectMoveLeft": "← selecciona un movimiento",
            "selectMoveRight": "selecciona un movimiento →",
            "noDamage": "Sin daño / inmune",
            "noKO": "sin KO",
            "possibleOHKO": "posible OHKO",
            "guaranteedOHKO": "OHKO garantizado",
            "guaranteed2HKO": "2HKO garantizado",
            "possible2HKO": "posible 2HKO"
          },
          "speedView": {
            "tailwind": "Viento Afín",
            "scarf": "Pañuelo",
            "para": "Parál",
            "trickRoom": "Espacio Raro",
            "boostPlus1": "+1",
            "boostPlus2": "+2",
            "boostMinus1": "-1",
            "boostMinus2": "-2",
            "fasterThan": "▲ Más rápido que",
            "tiesWith": "= Empate con",
            "slowerThan": "▼ Más lento que",
            "baseSpeed": "base {speed}",
            "myTeam": "Mi equipo",
            "rival": "Rival",
            "level": "Nivel",
            "vsRivals": "vs Rivales",
            "allPokemon": "Todos los Pokémon",
            "filterPlaceholder": "Filtrar referencia…",
            "modMyTeam": "Mi equipo",
            "modRivals": "Rivales",
            "emptyState": "Añade Pokémon a ambos equipos para comparar velocidades",
            "noFilterMatch": "Ningún Pokémon coincide con tu filtro",
            "comparisonTitle": "Comparación de velocidad — mi equipo vs. rivales (objetos aplicados por Pokémon)",
            "sectionMyTeam": "Mi equipo",
            "sectionRivals": "Rivales",
            "referenceTitle": "Referencia — arriba: +Vel 252 EVs / abajo: neutral · {count} Pokémon{format}{filter}",
            "formatSuffix": " (formato)",
            "filterSuffix": " filtrado"
          },
          "typeCalc": {
            "immune": "Inmune",
            "quarterX": "¼×",
            "halfX": "½×",
            "normalX": "1×",
            "doubleX": "2×",
            "quadX": "4×",
            "nve": "NVE",
            "se": "SE",
            "weak": "Débil",
            "res": "Res",
            "addPokemon": "Añade Pokémon a tu equipo",
            "addPokemonHint": "Cambia a las pestañas 1v1 o matriz para configurar tu equipo, luego vuelve aquí.",
            "noThreats": "Sin amenazas que analizar",
            "noTeam": "Sin equipo que analizar",
            "noThreatsHint": "Añade amenazas en la pestaña matriz.",
            "noTeamHint": "Cambia a las pestañas 1v1 o matriz para configurar tu equipo.",
            "rivalsCanThreaten": "⚔ Rivales pueden amenazar",
            "offensiveCoverage": "⚔ Cobertura ofensiva",
            "rivalsVulnerabilities": "🛡 Vulnerabilidades de rivales",
            "defensiveProfile": "🛡 Perfil defensivo",
            "rivalsThreatsTitle": "⚔ Amenazas de rivales",
            "offensiveCoverageTitle": "⚔ Cobertura ofensiva",
            "rivalsWeaknessesTitle": "🛡 Debilidades de rivales",
            "defensiveCoverageTitle": "🛡 Cobertura defensiva",
            "stabByDefenderType": "Amenazas STAB de rivales por tipo defensor",
            "stabVsDefenderType": "Cobertura STAB de tu equipo vs cada tipo defensor",
            "rivalsBestThreaten": "Rivales amenazan más:",
            "bestCovered": "Mejor cubierto:",
            "rivalsResistMost": "Rivales resisten más:",
            "mostResistedBy": "Más resistido por:",
            "insights": "Conclusiones",
            "canHit": "Puede golpear",
            "typesSe": "tipos SE",
            "notVeryEffective": "poco efectivo",
            "insightImmune": "inmune",
            "membersHitSe": "({count} miembros golpean SE)",
            "resists": "resiste",
            "insightWeak": "débil",
            "membersCount": "({count} miembros)",
            "myTeamToggle": "⚔ Mi equipo",
            "rivalsToggle": "🛡 Rivales"
          },
          "matrixExtras": {
            "importLabel": "Importar",
            "noPokemon": "Sin Pokémon añadidos",
            "addPokemon": "Añadir Pokémon",
            "emptyMatrix": "Añade Pokémon en ambos lados para ver la matriz de daño"
          },
          "compactField": {
            "singles": "Individual",
            "doubles": "Dobles",
            "trickRoom": "Espacio Raro",
            "gravity": "Gravedad",
            "atkTailwind": "Atq VA",
            "atkHelpingHand": "Atq Refuerzo",
            "defTailwind": "Def VA",
            "defReflect": "Def Reflejo",
            "defLightScreen": "Def Pantalla de Luz"
          },
          "moveStripCard": {
            "level": "Nv. {level}"
          },
          "shareCopyFailed": "No se pudo copiar. Enlace: {url}"
        },
        "speed": {
          "title": "Velocidad",
          "subtitle": "Referencia de niveles de velocidad y calculadora de matchups",
          "modifiers": {
            "title": "Modificadores",
            "clear": "Limpiar modificadores",
            "boostTitle": "Etapa de velocidad {n}",
            "tailwind": "Viento Afín (×2 velocidad)",
            "tailwindShort": "V. Afín",
            "scarf": "Pañuelo Elegido (×1.5 velocidad)",
            "scarfShort": "Pañuelo",
            "paralysis": "Parálisis (×0.5 velocidad)",
            "paralysisShort": "Parál."
          },
          "tabs": {
            "tiers": "Niveles",
            "matchup": "Comparador"
          },
          "clearInput": "Limpiar"
        },
        "speedTiers": {
          "title": "Niveles de velocidad",
          "subtitle": "Velocidad a nivel 50 de los Pokémon legales, ordenados por velocidad base",
          "search": "Filtrar Pokémon…",
          "highlightPlaceholder": "Resaltar velocidad…",
          "showingTier": "Mostrando el nivel de velocidad {speed}",
          "pokemonCount": "{count} Pokémon",
          "loading": "Cargando niveles de velocidad…",
          "error": "No se pudieron cargar los niveles de velocidad. Comprueba que la API esté activa.",
          "empty": "No se encontraron Pokémon.",
          "footer": "N = naturaleza neutra · + = naturaleza +Velocidad · todos los cálculos a nivel 50 · 31 IVs",
          "legend": {
            "restricted": "Restringido",
            "mythical": "Mítico",
            "highlighted": "Nivel de velocidad resaltado"
          },
          "badge": {
            "restricted": "Restringido",
            "restrictedTitle": "Legendario restringido",
            "mythical": "Mítico",
            "mythicalTitle": "Pokémon mítico"
          },
          "columns": {
            "number": "#",
            "pokemon": "Pokémon",
            "base": "Base",
            "baseTitle": "Estadística de velocidad base",
            "minNeutral": "0/N",
            "minNeutralTitle": "0 EVs, naturaleza neutra",
            "minPlus": "0/+",
            "minPlusTitle": "0 EVs, naturaleza +Velocidad",
            "maxNeutral": "252/N",
            "maxNeutralTitle": "252 EVs, naturaleza neutra",
            "maxPlus": "252/+",
            "maxPlusTitle": "252 EVs, naturaleza +Velocidad",
            "scarf": "Pañuelo",
            "scarfTitle": "252 EVs, Pañuelo Elegido",
            "scarfPlus": "Pañuelo+",
            "scarfPlusTitle": "252 EVs, +Velocidad, Pañuelo Elegido",
            "noScarf": "No puede llevar Pañuelo Elegido",
            "types": "Tipos"
          },
          "team": {
            "title": "Mi equipo",
            "add": "Añadir al equipo",
            "remove": "Quitar del equipo",
            "full": "El equipo está lleno (6 Pokémon)",
            "clearTeam": "Vaciar equipo",
            "filterToggle": "Supera al equipo"
          },
          "comparison": {
            "faster": "Más rápido",
            "slower": "Más lento",
            "tie": "Empate",
            "column": "vs Equipo"
          },
          "reference": {
            "title": "Tu referencia",
            "searchPlaceholder": "Elige un Pokémon…",
            "customMode": "Personalizado",
            "pokemonMode": "Pokémon",
            "clearRef": "Limpiar",
            "effectiveSpeed": "Velocidad efectiva",
            "evLabel": "EVs / naturaleza",
            "noRef": "Elige un Pokémon para ver tu posición en la tabla de velocidad"
          },
          "zones": {
            "separator": "TU VELOCIDAD",
            "fasterCount": "{count} más rápidos",
            "slowerCount": "{count} más lentos",
            "tieCount": "{count} empate"
          },
          "expanded": {
            "breakdown": "Desglose de velocidad",
            "vsRef": "vs tú ({speed})",
            "sendToMatchup": "Comparar en el comparador",
            "noRef": "Establece una referencia para comparar velocidades"
          }
        },
        "speedComparison": {
          "title": "Comparación de velocidad",
          "subtitle": "Compara la velocidad de tu equipo contra cualquier rival",
          "opponentTitle": "Rival",
          "opponentSearch": "Buscar Pokémon…",
          "opponentManual": "O introduce la velocidad directamente",
          "opponentSpeedPlaceholder": "Velocidad…",
          "opponentModifiers": "Modificadores del rival",
          "effectiveSpeed": "Velocidad efectiva",
          "myTeamTitle": "Mi equipo",
          "myTeamModifiers": "Condiciones del equipo",
          "teamMemberName": "Nombre (opcional)",
          "teamMemberSpeed": "Velocidad",
          "addMember": "Añadir casilla",
          "removeMember": "Quitar",
          "clearTeam": "Limpiar todo",
          "faster": "Más rápido",
          "slower": "Más lento",
          "tie": "Empate",
          "noOpponent": "Introduce la velocidad del rival para comparar",
          "invalidSpeed": "Introduce una velocidad válida",
          "referenceSpeed": "Velocidades de referencia",
          "loading": "Cargando datos de Pokémon…",
          "empty": "No se encontraron Pokémon"
        },
        "tracker": {
          "title": "Tracker VGC",
          "subtitle": "Registra tus combates clasificados",
          "buttons": {
            "presets": "Presets ({count})",
            "newSession": "Nueva sesión",
            "newMatch": "Nuevo combate",
            "newSeries": "Nueva serie",
            "importCsv": "Importar CSV",
            "importing": "Importando…",
            "finish": "Terminar",
            "delete": "Eliminar",
            "cancel": "Cancelar",
            "import": "Importar",
            "importFile": "Importar {name}",
            "importNewPreset": "Importar nuevo preset",
            "startSession": "Iniciar sesión",
            "archive": "Archivar",
            "unarchive": "Desarchivar",
            "duplicate": "Duplicar",
            "editPreset": "Editar",
            "save": "Guardar",
            "changePreset": "Cambiar preset",
            "exportSession": "Exportar sesión",
            "exportAll": "Exportar todo",
            "importData": "Importar datos",
            "restoreVersion": "Restaurar",
            "export": "Exportar"
          },
          "labels": {
            "sessionLabel": "Etiqueta de sesión",
            "presetName": "Nombre del preset",
            "regulation": "Reglamento",
            "format": "Formato",
            "startingElo": "ELO inicial",
            "teamPreset": "Preset de equipo",
            "noPreset": "Sin preset",
            "myTeam": "Mi equipo",
            "opponent": "Rival",
            "startDate": "Fecha y hora de inicio",
            "minsPerGame": "Minutos por partida",
            "showdownPaste": "Paste de Showdown",
            "tournamentName": "Nombre del torneo",
            "limitlessTournament": "Vincular torneo de Limitless",
            "optional": "opcional",
            "noTournamentLink": "Ninguno",
            "noImportedTournaments": "No hay torneos importados para este reglamento"
          },
          "placeholders": {
            "rivalName": "Nombre del rival…",
            "sessionLabel": "ej. Ranked grind Abr 24",
            "presetName": "ej. Reg H — Abril 2025",
            "typeName": "Escribe nombre…",
            "addNote": "Añadir nota… (Enter para guardar)",
            "startingElo": "opcional",
            "tournamentName": "ej. EUIC 2025"
          },
          "stats": {
            "wins": "Victorias",
            "losses": "Derrotas",
            "draws": "Empates",
            "elo": "ELO"
          },
          "matchRow": {
            "match": "Combate #{number}",
            "vs": "vs",
            "noPicks": "Sin selecciones",
            "noteSingular": "1 nota",
            "notesPlural": "{count} notas"
          },
          "tooltips": {
            "deleteMatch": "Eliminar combate",
            "removeFromTeam": "Quitar del equipo",
            "removeFromSlot": "Quitar del espacio",
            "assignSlot": "Clic para asignar al siguiente espacio",
            "slotsFull": "Los 4 espacios están llenos",
            "assignedSlot": "{role} — clic en × en la zona inferior para quitar",
            "pressKey": "Presiona {hint}",
            "importCsv": "Importar combates desde CSV"
          },
          "modals": {
            "newSession": "Nueva sesión",
            "teamPresets": "Presets de equipo",
            "importCsv": "Importar CSV"
          },
          "indicators": {
            "saved": "Guardado",
            "myElo": "Mi ELO",
            "rival": "Rival",
            "live": "EN VIVO",
            "post": "POST"
          },
          "result": {
            "winShort": "V",
            "drawShort": "E",
            "lossShort": "D",
            "win": "Victoria",
            "loss": "Derrota",
            "draw": "Empate",
            "none": "Sin resultado"
          },
          "empty": {
            "noSessions": "Sin sesiones aún",
            "noSessionsHint": "Importa un preset de equipo y luego inicia una sesión.",
            "noMatches": "Sin combates aún — ¡empieza uno!",
            "noPresets": "Sin presets aún. Importa un paste de Showdown para empezar.",
            "noArchivedSessions": "Sin sesiones archivadas",
            "noMatch": "Ninguna sesión coincide con «{q}».",
            "noSeriesTitle": "Sin series",
            "noMatchesTitle": "Sin combates"
          },
          "archive": {
            "showArchived": "Mostrar archivadas ({count})",
            "hideArchived": "Ocultar archivadas",
            "badge": "Archivada"
          },
          "duplicate": {
            "title": "Duplicar sesión",
            "newLabel": "Nueva etiqueta",
            "inherits": "Hereda"
          },
          "exportImport": {
            "title": "Datos",
            "exportSession": "Exportar sesión",
            "exportAll": "Exportar todo",
            "importFile": "Importar archivo",
            "importHint": "Combina datos, omite duplicados",
            "importSuccess": "{sessions} sesiones · {matches} combates importados",
            "importError": "Archivo inválido o corrupto"
          },
          "preset": {
            "editTitle": "Editar preset",
            "versionHistory": "Historial de versiones",
            "versionN": "v{n}",
            "currentTag": "actual",
            "changeTitle": "Cambiar preset activo",
            "activeLabel": "Preset activo",
            "backToList": "Volver a la lista",
            "noPreviousVersions": "Sin versiones anteriores."
          },
          "sessionType": {
            "ladder": "Ladder",
            "tournament": "Torneo"
          },
          "tournament": {
            "seriesWins": "Series V",
            "seriesLosses": "Series D",
            "gameRecord": "Partidas",
            "noSeries": "Sin series aún — ¡empieza una!",
            "round": "R{n}",
            "allRounds": "Todas las rondas",
            "seriesNumber": "Serie #{n}",
            "seriesUnit": "series",
            "filterByRound": "Filtrar por ronda"
          },
          "errors": {
            "presetNameRequired": "Dale un nombre a este preset.",
            "invalidPaste": "No se pudo procesar el paste. Comprueba el formato."
          },
          "outcomeTag": {
            "label": "Resultado",
            "skill": "Habilidad",
            "misplay": "Error",
            "luck": "Suerte",
            "disconnect": "Desconexión"
          },
          "turnCount": {
            "label": "Turnos"
          },
          "archetype": {
            "label": "Arquetipo",
            "placeholder": "ej. Lluvia, HO, ER…"
          },
          "sessionNotes": {
            "label": "Notas de sesión",
            "placeholder": "Notas sobre esta sesión…"
          },
          "workspace": {
            "roundPrefix": "R",
            "game": "Partida {n}",
            "gameAbbr": "P{n}",
            "endGame": "Terminar partida {n}",
            "noGameData": "Sin datos de partida.",
            "previousGames": "Partidas anteriores",
            "matchTitle": "Combate",
            "matchNotFound": "Combate no encontrado.",
            "seriesNotFound": "Serie no encontrada."
          },
          "notes": {
            "gameTab": "Notas de partida",
            "seriesTab": "Notas de serie",
            "noGameNotes": "Sin notas de partida aún",
            "noSeriesNotes": "Sin notas de serie aún",
            "addSeriesPlaceholder": "Añadir nota de serie… (Enter)"
          },
          "speedWidget": {
            "label": "Velocidades",
            "expand": "Mostrar",
            "collapse": "Ocultar",
            "summary": "{count} mons · {min}-{max}",
            "trickroom": "ER ↕",
            "opponentSpeed": "Velocidad Base Rival",
            "opponentSpeedPlaceholder": "Introduce la velocidad base del rival…",
            "presetHint": "Haz clic en una fila para cambiar el preset de EVs"
          },
          "zones": {
            "leads": "Inicios",
            "backs": "Respaldos"
          },
          "sessionStats": {
            "tabs": {
              "matches": "Combates",
              "stats": "Estadísticas",
              "aria": "Vista de sesión"
            },
            "kpi": {
              "played": "Combates",
              "winRate": "Win rate",
              "streak": "Racha",
              "streakWin": "{count}V seguidas",
              "streakLoss": "{count}D seguidas",
              "eloNow": "ELO actual",
              "eloBest": "Máximo",
              "eloWorst": "Mínimo",
              "avgDelta": "±ELO/combate",
              "bestStreak": "Mejor racha"
            },
            "chart": {
              "title": "Evolución del ELO",
              "start": "Inicio",
              "noData": "Sin combates completados aún"
            },
            "table": {
              "pokemon": "Pokémon",
              "uses": "Usos",
              "brought": "Traídos",
              "discards": "Descartes",
              "record": "V/D/E",
              "winRate": "WR",
              "tournamentUsage": "Torneo %",
              "noData": "Sin datos de combates completados.",
              "tabs": {
                "myTeam": "Mi equipo",
                "preview": "Vista previa rival",
                "leads": "Leads rivales",
                "backs": "Backs rivales"
              },
              "title": "Uso de Pokémon",
              "empty": "Sin datos suficientes."
            },
            "regulationMeta": {
              "title": "Meta del reglamento",
              "matchCount": "{n} combates",
              "noData": "Sin datos de rivales en este reglamento aún.",
              "tournamentUsage": "Uso en torneo"
            },
            "comparison": {
              "title": "Comparar sesiones",
              "clearAll": "Limpiar todo",
              "hint": "Selecciona sesiones arriba para superponer sus gráficas de ELO."
            },
            "pairs": {
              "title": "Parejas de leads",
              "mine": "Mías",
              "rivals": "Rivales",
              "empty": "Sin datos."
            },
            "archetype": {
              "title": "Por arquetipo rival",
              "empty": "Sin datos de arquetipos aún."
            },
            "matchup": {
              "title": "Matriz de matchups",
              "hint": "win rate al enfrentarlos",
              "empty": "Sin datos suficientes."
            },
            "activity": {
              "title": "Actividad",
              "hint": "partidas por hora"
            },
            "timeOfDay": {
              "title": "Por momento del día",
              "morning": "Mañana",
              "afternoon": "Tarde",
              "evening": "Noche",
              "night": "Madrugada",
              "empty": "Sin datos."
            },
            "days": {
              "0": "Dom",
              "1": "Lun",
              "2": "Mar",
              "3": "Mié",
              "4": "Jue",
              "5": "Vie",
              "6": "Sáb"
            }
          },
          "filters": {
            "sessionType": "Tipo de sesión",
            "all": "Todas",
            "ladder": "Ladder",
            "tournaments": "Torneos",
            "clear": "Limpiar filtros"
          },
          "search": {
            "session": "Buscar sesión…"
          },
          "career": {
            "sessions": "Sesiones",
            "record": "Récord total",
            "winRate": "Win rate",
            "bestElo": "Mejor ELO"
          },
          "nav": {
            "backToSessions": "Volver a sesiones",
            "backToSession": "Volver a la sesión"
          },
          "sessionSub": {
            "record": "{played} combates · {wins}-{losses}"
          },
          "roles": {
            "lead1": "Lead 1",
            "lead2": "Lead 2",
            "back1": "Back 1",
            "back2": "Back 2",
            "unknown": "Banca"
          },
          "notePhase": {
            "live": "en vivo",
            "post": "post",
            "series": "serie"
          },
          "sync": {
            "conflict": "Conflicto de sincronización",
            "conflictHint": "Otra pestaña o dispositivo tiene datos más recientes.",
            "refreshFromCloud": "Actualizar desde la nube",
            "synced": "Sincronizado",
            "syncing": "Sincronizando",
            "error": "Error de sincronización",
            "rejected": "El servidor rechazó un cambio: {detail}",
            "refreshed": "Tracker actualizado desde la nube",
            "conflictBody": "Otro dispositivo tiene datos más recientes. Actualiza desde la nube para continuar.",
            "pending": "{count} sin enviar"
          },
          "claim": {
            "title": "Datos sin cuenta en este equipo",
            "body": "Este equipo guarda sesiones registradas sin haber iniciado sesión. Puedes importarlas a esta cuenta y sincronizarlas, o dejarlas aparte: seguirán disponibles cuando cierres sesión.",
            "import": "Importar a mi cuenta",
            "keepSeparate": "Dejarlas aparte"
          }
        },
        "meta": {
          "title": "Análisis de meta",
          "subtitle": "Uso en el ladder y composición de equipos, según Smogon Stats",
          "formats": {
            "gen9vgc2026regi": "VGC 2026 Reg I",
            "gen9vgc2026regh": "VGC 2026 Reg H",
            "gen9vgc2025regg": "VGC 2025 Reg G",
            "gen9vgc2025regf": "VGC 2025 Reg F"
          },
          "pickers": {
            "format": "Formato",
            "month": "Mes",
            "monthPlaceholder": "Último",
            "cutoff": "ELO mín.",
            "load": "Aplicar",
            "regulation": "Reglamento",
            "tournament": "Torneo"
          },
          "options": "Opciones",
          "sidebar": {
            "search": "Buscar Pokémon…",
            "noResults": "Sin resultados"
          },
          "table": {
            "rank": "#",
            "pokemon": "Pokémon",
            "usage": "Uso",
            "item": "Objeto",
            "move": "Movimiento",
            "tera": "Tera",
            "loading": "Cargando datos de meta…",
            "empty": "Sin datos para este formato y mes.",
            "error": "Error al cargar la meta. Comprueba que la API esté activa."
          },
          "detail": {
            "baseStats": "Estadísticas base",
            "abilities": "Habilidades",
            "items": "Objetos",
            "moves": "Movimientos",
            "teraTypes": "Teratipos",
            "teammates": "Compañeros",
            "spreads": "Repartos de EVs",
            "close": "Cerrar",
            "loading": "Cargando detalles…",
            "backToList": "Volver",
            "notFound": "Sin datos disponibles para este Pokémon.",
            "battles": "{count} combates",
            "other": "Otros",
            "usagePercent": "{percent}% de uso",
            "featuringTeams": "Equipos con este Pokémon",
            "teamsLoading": "Cargando equipos…",
            "copyPaste": "Copiar paste",
            "copied": "¡Copiado!",
            "rentalCode": "Código de alquiler",
            "rank": "Puesto",
            "usage": "Uso",
            "appearances": "Apariciones",
            "topN": "top {n}",
            "noData": "—",
            "abilitiesTeras": "Habilidades y teratipos",
            "clickToJump": "clic para saltar",
            "teamsWith": "Equipos con {name}",
            "tournamentResults": "resultados de torneo",
            "noTeams": "Sin equipos registrados para esta especie.",
            "emptyTitle": "Elige un Pokémon",
            "emptyLead": "Selecciona una especie del ranking para ver su detalle competitivo: movimientos, objetos, repartos y equipos."
          },
          "standings": {
            "loading": "Cargando resultados…",
            "empty": "No se encontraron jugadores.",
            "col": {
              "rank": "#",
              "player": "Jugador",
              "record": "Balance",
              "team": "Equipo"
            },
            "teamLoading": "Cargando…",
            "copyPaste": "Copiar Poképaste",
            "copied": "¡Copiado!",
            "tera": "Tera: {type}",
            "search": "Buscar jugador…",
            "count": "{count} jugadores",
            "teamEmpty": "Equipo no disponible para este jugador."
          },
          "divergence": {
            "loading": "Cargando datos de divergencia…",
            "empty": "Sin datos de divergencia. Importa un torneo primero.",
            "selectTournament": "Selecciona un reglamento y un torneo para ver la divergencia.",
            "rowCount": "{count} Pokémon",
            "allElo": "Todos los ELO",
            "col": {
              "pokemon": "Pokémon",
              "ladder": "Ladder",
              "tournament": "Torneo",
              "delta": "|Δ|",
              "badge": "Insignia"
            },
            "badges": {
              "ladderTrap": "Trampa de ladder",
              "ladderTrapTitle": "Muy usado en el ladder y poco en torneos: puede estar sobrevalorado en top cut",
              "tournamentStaple": "Pilar de torneo",
              "tournamentStapleTitle": "Poco usado en el ladder y mucho en torneos: infravalorado en el ladder"
            },
            "emptyTitle": "Sin datos de divergencia",
            "note": "Compara el uso en el <b>ladder</b> ({format} · {month} · 1630+ ELO) con el uso en <b>torneos</b>. Δ positivo = más usado en torneo."
          },
          "refresh": "Actualizar",
          "footer": "Datos de Smogon Stats · Actualización mensual · Corte de ELO por defecto: 1760",
          "barTitle": "Meta VGC",
          "barSub": {
            "ladder": "Ladder · Smogon",
            "tournament": "Circuito oficial"
          },
          "tabs": {
            "stats": "Ladder",
            "tournament": "Torneos",
            "combined": "Todos los torneos",
            "aggregate": "Agregado",
            "players": "Jugadores",
            "divergence": "Divergencia",
            "championsNotice": "Uso calculado a partir de los equipos importados de VGCPastes, no del Ladder de Smogon."
          },
          "cutoff": {
            "all": "Todos los ELO"
          },
          "chip": {
            "battles": "{count} combates",
            "teams": "{count} equipos"
          },
          "aria": {
            "source": "Fuente de datos",
            "tournamentView": "Vista de torneo",
            "usageRanking": "Ranking de uso",
            "standings": "Clasificación del torneo",
            "divergence": "Divergencia ladder–torneos"
          },
          "list": {
            "appearances": "{count} apariciones"
          },
          "empty": {
            "noMatch": "Ningún Pokémon coincide con «{q}».",
            "noPlayer": "Ningún jugador coincide con «{q}».",
            "clear": "Limpiar búsqueda"
          },
          "sub": {
            "combined": "Combinado · {count} torneos",
            "tourWithPlayers": "{name} · {count} jug.",
            "formatNote": "Reglamento actual. Permite dos Pokémon restringidos por equipo."
          },
          "adapter": {
            "teamFallback": "Equipo",
            "teraNone": "Nada"
          }
        },
        "manifest": {
          "calc": {
            "name": "Calculadora de daño",
            "description": "Calcula daño, KOs y velocidad para dobles VGC.",
            "category": "Competitivo"
          },
          "speed": {
            "name": "Niveles de velocidad",
            "description": "Compara velocidades del formato y sus modificadores.",
            "category": "Competitivo"
          },
          "meta": {
            "name": "Análisis de meta",
            "description": "Uso, equipos y divergencias por reglamento y torneo.",
            "category": "Competitivo"
          },
          "tracker": {
            "name": "Tracker VGC",
            "description": "Registra sesiones, combates y series, con o sin conexión.",
            "category": "Competitivo"
          }
        }
      }
    }
  },
  "en": {
    "tools": {
      "pmdsky": {
        "questTypes": {
          "RESCUE_CLIENT": "Rescue client",
          "RESCUE_TARGET": "Rescue target",
          "ESCORT_TO_TARGET": "Escort to target",
          "EXLORE_WITH_CLIENT": "Explore with client",
          "NORMAL": "Normal",
          "SEALED_CHAMBER": "Sealed chamber",
          "GOLDEN_CHAMBER": "Golden chamber",
          "NEW_DUNGEON": "New dungeon (broken?)",
          "PROSPECT_WITH_CLIENT": "Prospect with client",
          "GUIDE_CLIENT": "Guide client",
          "FIND_TARGET_ITEM": "Find target item",
          "DELIVER_TARGET_ITEM": "Deliver target item",
          "SEARCH_FOR_CLIENT": "Search for client",
          "STEAL_FROM_TARGET": "Steal from target",
          "TARGET_HIDDEN": "Target hidden",
          "TARGET_RUNS": "Target runs",
          "CHALLENGE_REQUEST": "Challenge request",
          "Mewtwo": "Mewtwo",
          "Entei": "Entei",
          "Raikou": "Raikou",
          "Suicune": "Suicune",
          "Jiraichi": "Jirachi",
          "TREASURE_HUNT": "Treasure hunt",
          "Normal": "Normal",
          "Escort": "Escort",
          "Monster House": "Monster house",
          "Arrest client (Magnemite)": "Arrest client (Magnemite)",
          "Arrest client (Magnezone)": "Arrest client (Magnezone)",
          "Jirachi": "Jirachi",
          "Special Floor (broken)": "Special floor (broken)",
          "Unlock seven treasures dungeon (broken)": "Unlock seven treasures dungeon (broken)"
        },
        "rewardTypes": {
          "CASH": "Cash",
          "CASH_REWARD_ITEM": "Cash + ??? (Reward item)",
          "ITEM": "Item",
          "ITEM_RANDOM": "Item + ??? (Random)",
          "REWARD_ITEM": "??? (Reward item)",
          "EGG": "??? (Egg)",
          "CLIENT_JOINS": "??? (Client joins)"
        },
        "QUEST_TYPE": "Quest type",
        "QUEST_CONFIGURATION": "Quest Configuration",
        "LOCATION_SETTINGS": "Location Settings",
        "POKEMON_SETTINGS": "Pokémon Settings",
        "REWARD_SETTINGS": "Reward Settings",
        "EUROPEAN_VERSION": "European Version",
        "USE_EUROPEAN_FORMAT": "Use European format",
        "ADDITIONAL_SETTINGS": "Additional Settings",
        "GENERATE_WONDER_MAIL": "Generate",
        "WONDERMAIL_TITLE": "Pokémon Mystery Dungeon: Explorers of Sky",
        "WONDERMAIL_SUBTITLE": "Wonder Mail Creator",
        "WONDERMAIL": "Wonder Mail",
        "WONDER_MAIL_CREATOR": "Wonder Mail Creator",
        "WONDER_MAIL_CREATOR_DESCRIPTION": "Generate wonder mails for PMD Explorers of Sky.",
        "EUROPEAN_VERSION_TOOLTIP": "Enables the European mail format",
        "COPY_TO_CLIPBOARD": "Copy to clipboard",
        "COPIED_SUCCESS": "Copied to clipboard!",
        "WONDER_MAIL_RESULT": "Wonder Mail Result",
        "WONDER_MAIL_INSTRUCTIONS": "Click the copy button to copy the wonder mail to your clipboard",
        "REQUIRED_FIELD": "Required field",
        "OPTIONAL_FIELD": "Optional field",
        "DISABLED_FIELD": "Disabled field",
        "MAX_FLOOR": "Max floor",
        "GENERATE_SUCCESS": "Wonder mail generated successfully!",
        "FORM_VALIDATION": {
          "QUEST_TYPE_REQUIRED": "You must select a quest type",
          "DUNGEON_REQUIRED": "You must select a dungeon",
          "FLOOR_REQUIRED": "You must specify a valid floor",
          "FLOOR_OUT_OF_RANGE": "The floor must be between 1 and {max}",
          "POKEMON_REQUIRED": "You must select a Pokémon",
          "REWARD_TYPE_REQUIRED": "You must select a reward type"
        },
        "HELP_TEXT": {
          "QUEST_TYPE": "Select the type of quest you want to create",
          "QUEST_SUBTYPE": "Some quest types have special variations",
          "DUNGEON": "Choose the dungeon where the quest takes place",
          "FLOOR": "Specify which floor of the dungeon the quest occurs on",
          "CLIENT_POKEMON": "The Pokémon requesting help",
          "TARGET_POKEMON": "The Pokémon that must be rescued or found",
          "REWARD_TYPE": "What kind of reward you'll get for completing the quest",
          "TARGET_ITEM": "The item that must be found or delivered",
          "REWARD_ITEM": "The item you'll receive as a reward",
          "EUROPEAN_VERSION": "Check this option if you play the European version of the game"
        },
        "SECTION_DESCRIPTIONS": {
          "QUEST_CONFIGURATION": "Defines the quest's type and characteristics",
          "LOCATION_SETTINGS": "Specifies where the adventure takes place",
          "POKEMON_SETTINGS": "Configures which Pokémon take part in the quest",
          "REWARD_SETTINGS": "Sets the rewards for completing the quest",
          "ADDITIONAL_SETTINGS": "Extra options to customize the mail"
        },
        "selectPokemon": "Select a Pokémon",
        "app": {
          "title": "Wonder Mail Generator",
          "region": "Region",
          "regionIntl": "US / JP",
          "regionEU": "EU",
          "randomize": "Random",
          "reset": "Reset",
          "secType": "Mission type",
          "secLocation": "Location",
          "secPokemon": "Pokémon",
          "secReward": "Reward",
          "searchDungeon": "Search dungeon…",
          "searchPokemon": "Search Pokémon…",
          "itemQuestOnly": "Only on item missions",
          "rewardNoItem": "The current reward gives no item",
          "advanced": "Advanced settings",
          "advancedSub": "Region and encoding",
          "euTitle": "European version (EU)",
          "euSub": "Switches the code's regional encoding. Keep US / JP for the American or Japanese version.",
          "mailLabel": "Wonder Mail S",
          "codeLabel": "Code",
          "emptyTitle": "No code yet",
          "emptyText": "Configure the mission and press Generate code to get your Wonder Mail.",
          "loadingTitle": "Generating…",
          "loadingText": "Encoding the mission parameters.",
          "readyHint": "Enter it in the Wonder Mail mailbox in-game.",
          "summaryHead": "Mission summary",
          "sumMission": "Mission",
          "sumDungeon": "Dungeon",
          "sumClient": "Client",
          "sumTarget": "Target",
          "sumItem": "Item",
          "sumReward": "Reward",
          "sumPrize": "Prize",
          "errorTitle": "Check the configuration",
          "generate": "Generate code",
          "regenerate": "Regenerate code",
          "generating": "Generating…",
          "share": "Share",
          "copied": "Copied",
          "export": "Export",
          "needClient": "Select a client Pokémon",
          "floorExceeds": "The selected floor exceeds the dungeon's size.",
          "sameMon": "The client and target are the same Pokémon.",
          "diff": {
            "1": "Very easy",
            "2": "Easy",
            "3": "Medium",
            "4": "Hard",
            "5": "Very hard"
          }
        },
        "DUNGEON": "Dungeon",
        "FLOOR": "Floor",
        "QUEST_SUBTYPE": "Quest subtype",
        "CLIENT_POKEMON": "Client Pokémon",
        "CLIENT_IS_TARGET": "Client is the target",
        "FORCED_BY_QUEST_TYPE": "Forced by quest type",
        "TARGET_POKEMON": "Target Pokémon",
        "TARGET_ITEM": "Target item",
        "REWARD_TYPE": "Reward type",
        "REWARD_ITEM": "Reward item",
        "dungeons": {
          "0": "Test Dungeon",
          "1": "Beach Cave",
          "2": "Beach Cave",
          "3": "Drenched Bluff",
          "4": "Mt. Bristle",
          "5": "Mt. Bristle",
          "6": "Waterfall Cave",
          "7": "Apple Woods",
          "8": "Craggy Coast",
          "9": "Side Path",
          "10": "Mt. Horn",
          "11": "Rock Path",
          "12": "Foggy Forest",
          "13": "Forest Path",
          "14": "Steam Cave",
          "15": "Steam Cave",
          "16": "Steam Cave",
          "17": "Amp Plains",
          "18": "Amp Plains",
          "19": "Amp Plains",
          "20": "Northern Desert",
          "21": "Quicksand Cave",
          "22": "Quicksand Cave",
          "23": "Underground Lake",
          "24": "Crystal Cave",
          "25": "Crystal Crossing",
          "26": "Crystal Lake",
          "27": "Chasm Cave",
          "28": "Dark Hill",
          "29": "Sealed Ruin",
          "30": "Sealed Ruin",
          "31": "Sealed Ruin",
          "32": "Dusk Forest",
          "33": "Deep Dusk Forest",
          "34": "Treeshroud Forest",
          "35": "Brine Cave",
          "36": "Brine Cave",
          "37": "Brine Cave",
          "38": "Hidden Land",
          "39": "Hidden Land",
          "40": "Old Ruins",
          "41": "Temporal Tower",
          "42": "Temporal Tower",
          "43": "Temporal Tower",
          "44": "Mystifying Forest",
          "45": "Mystifying Forest",
          "46": "Blizzard Island",
          "47": "Crevice Cave",
          "48": "Crevice Cave",
          "49": "Crevice Cave",
          "50": "Surrounded Sea",
          "51": "Miracle Sea",
          "52": "Miracle Sea",
          "53": "Miracle Sea",
          "54": "Aegis Cave",
          "55": "Regice Chamber",
          "56": "Aegis Cave",
          "57": "Regirock Chamber",
          "58": "Aegis Cave",
          "59": "Registeel Chamber",
          "60": "Aegis Cave",
          "61": "Regigigas Chamber",
          "62": "Mt. Travail",
          "63": "The Nightmare",
          "64": "Spacial Rift",
          "65": "Spacial Rift",
          "66": "Spacial Rift",
          "67": "Dark Crater",
          "68": "Dark Crater",
          "69": "Dark Crater",
          "70": "Concealed Ruins",
          "71": "Concealed Ruins",
          "72": "Marine Resort",
          "73": "Bottomless Sea",
          "74": "Bottomless Sea",
          "75": "Shimmer Desert",
          "76": "Shimmer Desert",
          "77": "Mt. Avalanche",
          "78": "Mt. Avalanche",
          "79": "Giant Volcano",
          "80": "Giant Volcano",
          "81": "World Abyss",
          "82": "World Abyss",
          "83": "Sky Stairway",
          "84": "Sky Stairway",
          "85": "Mystery Jungle",
          "86": "Mystery Jungle",
          "87": "Serenity River",
          "88": "Landslide Cave",
          "89": "Lush Prairie",
          "90": "Tiny Meadow",
          "91": "Labyrinth Cave",
          "92": "Oran Forest",
          "93": "Lake Afar",
          "94": "Happy Outlook",
          "95": "Mt. Mistral",
          "96": "Shimmer Hill",
          "97": "Lost Wilderness",
          "98": "Midnight Forest",
          "99": "Zero Isle North",
          "100": "Zero Isle East",
          "101": "Zero Isle West",
          "102": "Zero Isle South",
          "103": "Zero Isle Center",
          "104": "Destiny Tower",
          "107": "Oblivion Forest",
          "108": "Treacherous Waters",
          "109": "Southeastern Islands",
          "110": "Inferno Cave",
          "111": "Sky Peak",
          "112": "Sky Peak",
          "113": "Sky Peak",
          "114": "Sky Peak",
          "115": "Sky Peak",
          "116": "Sky Peak",
          "117": "Sky Peak",
          "118": "Sky Peak",
          "119": "Sky Peak",
          "120": "Sky Peak",
          "121": "Sky Peak",
          "122": "Sky Peak",
          "123": "Star Cave",
          "124": "Star Cave",
          "125": "Star Cave",
          "126": "Star Cave",
          "127": "Star Cave",
          "128": "Murky Forest",
          "129": "Eastern Cave",
          "130": "Fortune Ravine",
          "131": "Fortune Ravine",
          "132": "Fortune Ravine",
          "133": "Barren Valley",
          "134": "Barren Valley",
          "135": "Barren Valley",
          "136": "Dark Wasteland",
          "137": "Temporal Tower",
          "138": "Temporal Tower",
          "139": "Dusk Forest",
          "140": "Black Swamp",
          "141": "Spacial Cliffs",
          "142": "Dark Ice Mountain",
          "143": "Dark Ice Mountain",
          "144": "Dark Ice Mountain",
          "145": "Icicle Forest",
          "146": "Vast Ice Mountain",
          "147": "Vast Ice Mountain",
          "148": "Vast Ice Mountain",
          "149": "Southern Jungle",
          "150": "Boulder Quarry",
          "151": "Boulder Quarry",
          "152": "Boulder Quarry",
          "153": "Right Cave Path",
          "154": "Left Cave Path",
          "155": "Limestone Cavern",
          "156": "Limestone Cavern",
          "157": "Limestone Cavern",
          "158": "Spring Cave",
          "159": "Spring Cave",
          "160": "Spring Cave",
          "161": "Spring Cave",
          "162": "Spring Cave",
          "163": "Spring Cave",
          "164": "Spring Cave",
          "165": "Little Plains",
          "166": "Mt. Clear Challenge",
          "167": "River Trial Forest",
          "168": "Guiding Sea",
          "169": "Hidden Shopkeeper Village",
          "173": "Star Cave",
          "174": "Star Cave",
          "175": "Armaldo's Shelter",
          "176": "Luminous Spring",
          "177": "Hot Spring Rescue",
          "178": "Normal/Fly Maze",
          "179": "Dark/Fire Maze",
          "180": "Rock/Water Maze",
          "181": "Grass Maze",
          "182": "Elec/Steel Maze",
          "183": "Ice/Ground Maze",
          "184": "Fight/Psych Maze",
          "185": "Poison/Bug Maze",
          "186": "Dragon Maze",
          "187": "Ghost Maze",
          "188": "Explorer Maze",
          "189": "Final Maze",
          "212": "???",
          "213": "Beach",
          "234": "Armaldo's Shelter",
          "235": "Barren Valley",
          "239": "Sharpedo Bluff",
          "240": "Sharpedo Bluff",
          "241": "Sky Peak",
          "245": "Treasure Town",
          "246": "Treasure Town",
          "254": "Waterfall Cave",
          "255": "Secret Waterfall",
          "256": "Quicksand Desert",
          "259": "Beach Cave"
        },
        "manifest": {
          "name": "Wonder Mail Generator",
          "category": "Generator",
          "description": "Craft secret mail and missions for Pokémon Mystery Dungeon: Explorers of Sky."
        }
      },
      "tcgpocket": {
        "loading": "Loading...",
        "geneticapex": "Genetic Apex",
        "promo-a": "Promo A",
        "mythicalisland": "Mythical Island",
        "space-timesmackdown": "Space-Time Smackdown",
        "triumphantlight": "Triumphant Light",
        "shiningrevelry": "Shining Revelry",
        "packs": {
          "mewtwo": "Mewtwo - Genetic Apex",
          "charizard": "Charizard - Genetic Apex",
          "pikachu": "Pikachu - Genetic Apex",
          "mew": "Mew - Mythical Island",
          "dialga": "Dialga - Space-Time Smackdown",
          "palkia": "Palkia - Space-Time Smackdown",
          "arceus": "Arceus - Triumphant Light"
        },
        "item": {
          "xp": "XP",
          "packhourglass": "Pack Hourglass",
          "wonderhourglass": "Wonder Hourglass",
          "shopticket": "Shop Ticket",
          "shinedust": "Shinedust"
        },
        "mewQuest": "Immersive Mew",
        "heroAlt": "Pokémon TCG Pocket",
        "logoAlt": "TCG Pocket Logo",
        "heading": {
          "title": "Tools for",
          "highlight": "TCG Pocket",
          "subtitle": "Explore your collection, check all cards and optimize your battles"
        },
        "quickSearch": {
          "title": "Quick Search",
          "description": "Enter a username to see their card gallery",
          "placeholder": "Username",
          "searchButton": "Search"
        },
        "viewGallery": {
          "title": "View Gallery",
          "description": "Explore your card collection"
        },
        "cardsList": {
          "title": "Card List",
          "description": "Browse all available cards",
          "pageTitle": "All Cards",
          "noResults": "No cards found matching your search criteria."
        },
        "battles": {
          "title": "Individual Battles",
          "description": "Check teams and rewards"
        },
        "common": {
          "access": "Access"
        },
        "types": {
          "grass": "Grass",
          "fire": "Fire",
          "water": "Water",
          "lightning": "Lightning",
          "psychic": "Psychic",
          "fighting": "Fighting",
          "darkness": "Darkness",
          "metal": "Metal",
          "dragon": "Dragon",
          "colorless": "Colorless"
        },
        "cardDetail": {
          "loading": "Loading...",
          "number": "Number",
          "expansion": "Expansion",
          "rarity": "Rarity",
          "type": "Type",
          "hp": "HP",
          "weakness": "Weakness",
          "retreatCost": "Retreat Cost"
        },
        "gallery": {
          "notFound": {
            "title": "Gallery not found",
            "description": "This gallery doesn't exist or doesn't have any cards yet."
          },
          "recentCards": "Recent Cards",
          "noCards": "No cards found.",
          "saveChanges": "Save Changes",
          "unknownCard": "Unknown Card",
          "errors": {
            "recentUpdates": "Failed to fetch recent updates. Please try again later.",
            "bestPack": "Couldn't get the best pack. Please try again."
          },
          "header": {
            "title": "{username}'s Gallery",
            "cardCount": "{count} cards in collection"
          },
          "options": {
            "hideMissing": "Hide missing cards",
            "showAmounts": "Show amounts",
            "selectEvent": "Select event",
            "allCards": "All cards",
            "bestPack": "Recommend Best Pack"
          },
          "recentUpdates": {
            "title": "Recent Updates",
            "noUpdates": "No recent updates",
            "loadMore": "Load More"
          }
        },
        "filter": {
          "searchPlaceholder": "Search cards by name or number",
          "expansionPlaceholder": "Filter by expansion",
          "allExpansions": "All expansions"
        },
        "bestPack": {
          "dialogTitle": "New Card Probabilities by Pack",
          "bestPackGeneral": "The best pack to get new cards is: {packName}",
          "bestPackEvent": "The best pack to get new cards from '{eventName}' is: {packName}",
          "missingCardsCount": "Missing cards: {missing} of {total}",
          "missingCardsList": "List of missing cards:",
          "availableIn": "Available in:",
          "table": {
            "packName": "Pack Name",
            "card": "Card {number}",
            "total": "Total"
          }
        },
        "app": {
          "tagline": "Collection · Meta · Packs",
          "searchCards": "Search card…",
          "showing": "Showing {shown} of {total} cards",
          "clearFilters": "Clear filters",
          "loadMore": "Load more ({n} left)",
          "ownedOnly": "Owned only",
          "errorTitle": "Couldn't load",
          "errorLead": "We couldn't load the card database. Please try again later.",
          "empty": {
            "title": "No results",
            "lead": "Try another term or remove a filter."
          },
          "tabs": {
            "panel": "Panel",
            "cartas": "Cards",
            "coleccion": "Collection",
            "sobres": "Packs"
          },
          "filters": {
            "expansion": "Expansion",
            "allSets": "All expansions",
            "category": "Category",
            "allCategories": "All categories"
          },
          "category": {
            "pokemon": "Pokémon",
            "trainer": "Trainer",
            "supporter": "Supporter",
            "item": "Item",
            "energy": "Energy"
          },
          "stage": {
            "basic": "Basic",
            "stage1": "Stage 1",
            "stage2": "Stage 2"
          },
          "sort": {
            "label": "Sort",
            "num": "Number",
            "name": "Name",
            "rarity": "Rarity",
            "hp": "HP"
          },
          "cartas": {
            "title": "Card list",
            "lead": "Full database · {cards} cards across {sets} expansions."
          },
          "panel": {
            "collection": "Collection",
            "lead": "Explore every expansion, track your collection card by card, work out which pack is worth opening and browse other players' galleries. All in one panel.",
            "exploreCards": "Explore cards",
            "myCollection": "My collection",
            "openPacks": "View packs",
            "owned": "Owned",
            "ofTotal": "of {total} cards",
            "expansions": "Expansions",
            "activeSets": "active sets",
            "exCards": "ex cards",
            "specialArt": "special art",
            "crowns": "Crowns",
            "maxRarity": "highest rarity",
            "dupes": "Duplicates",
            "forTrade": "for trading",
            "progressBySet": "Progress by expansion",
            "viewCollection": "View collection",
            "playerGallery": "Player gallery",
            "galleryHint": "Look up any community player's public collection.",
            "usernamePlaceholder": "Username…",
            "view": "View",
            "recentActivity": "Recent activity",
            "loginForActivity": "Sign in to track your activity.",
            "noActivity": "No changes yet."
          },
          "coleccion": {
            "myTitle": "My collection",
            "galleryTitle": "Gallery · {user}",
            "summary": "{have} of {total} cards · {pct}% complete · {dupes} duplicates.",
            "viewingGallery": "Viewing {user}'s gallery",
            "readOnly": "Read only.",
            "backToMine": "Back to mine",
            "searchPlaceholder": "Search the collection…",
            "hideMissing": "Hide missing",
            "loginTitle": "Sign in",
            "loginLead": "Sign in to track your collection card by card and save your changes.",
            "login": "Sign in",
            "unsaved": "{count, plural, one {unsaved change} other {unsaved changes}}",
            "discard": "Discard",
            "saveChanges": "Save changes",
            "saving": "Saving…",
            "saveSuccess": "Changes saved",
            "saveError": "Could not save changes",
            "bestPack": "Pack analyzer",
            "bestPackHint": "Based on your collection, we work out the pack most likely to give you a card you don't own yet.",
            "analyze": "Analyze",
            "analyzing": "Analyzing…",
            "bestPackEmpty": "Not enough data to analyze the packs.",
            "newCardOdds": "{odds} for a new card per pack.",
            "pack": "Pack",
            "new": "New",
            "best": "Best",
            "slot": "{n}",
            "saveQueued": "Saved on this device. It will sync when you are back online.",
            "syncRejected": "The server refused a change: {detail}",
            "localTitle": "Your collection, on this device",
            "localLead": "You can use it with no account. Sign in with Boffmedia to sync it and see it anywhere.",
            "localSignIn": "Sign in",
            "pendingSync": "{count, plural, one {# change not synced} other {# changes not synced}}"
          },
          "sobres": {
            "title": "Packs",
            "lead": "Each expansion splits its cards across one or more packs. Open them to see what they contain.",
            "cardCount": "{count} cards",
            "packCards": "Pack cards",
            "noPackCards": "This pack has no registered cards.",
            "noPacks": "No packs registered for this expansion.",
            "tileAria": "Pack {name} · {setId}"
          },
          "combates": {
            "title": "Battles",
            "lead": "Solo battles are coming soon, once their data source is available.",
            "back": "Back to panel"
          },
          "drawer": {
            "prev": "Previous",
            "next": "Next",
            "close": "Close",
            "inCollection": "in your collection",
            "owned": "in collection",
            "notOwned": "Not owned",
            "number": "Number",
            "expansion": "Expansion",
            "type": "Type",
            "hp": "Hit points",
            "weakness": "Weakness",
            "retreat": "Retreat cost",
            "availableIn": "Available in",
            "illustrator": "Illustrator"
          }
        },
        "manifest": {
          "name": "TCG Pocket",
          "category": "Collection",
          "description": "Browse the cards, track your collection and see which pack is worth opening."
        }
      },
      "vgc": {
        "calc": {
          "title": "Damage Calculator",
          "subtitle": "Calculate damage with full VGC field conditions",
          "share": "Share",
          "shareCopied": "Copied!",
          "tabs": {
            "combate": "Combat",
            "matriz": "Matrix",
            "velocidad": "Speed",
            "tipos": "Types",
            "teamThreats": "Team → Threats",
            "threatsTeam": "Threats → Team"
          },
          "ui": {
            "attacker": "Attacker",
            "defender": "Defender",
            "saved": "Teams",
            "verdictEmpty": "Pick a damaging move on either side to see the verdict.",
            "emptyMove": "— empty —",
            "add": "Add",
            "myTeam": "My team",
            "threats": "Threats",
            "matrixHint": "Tap a Pokémon to edit its set",
            "matrixCorner": "Attacker ↓ · Defender →",
            "matrixEmpty": "Add Pokémon to both sides to see the damage matrix.",
            "saveNote": "Save the current team to reuse it in the matrix or across sessions.",
            "editPrefix": "Edit",
            "twHint": "Trick Room: the slowest acts first",
            "reference": "Reference",
            "referenceSub": "(max / neutral, 31 IV)",
            "speedEmpty": "Add Pokémon to your team and to threats to compare speeds.",
            "typesEmpty": "Add Pokémon to your team (Matrix tab) to see their type coverage.",
            "close": "Close"
          },
          "panel": {
            "attacker": "Pokémon 1 — Attacker",
            "defender": "Pokémon 2 — Defender",
            "searchPlaceholder": "Search Pokémon...",
            "nature": "Nature",
            "ability": "Ability",
            "item": "Item",
            "tera": "Tera",
            "status": "Status",
            "moves": "Moves",
            "lv": "Lv.",
            "teraNone": "None",
            "teraTypes": {
              "Normal": "Normal",
              "Fire": "Fire",
              "Water": "Water",
              "Electric": "Electric",
              "Grass": "Grass",
              "Ice": "Ice",
              "Fighting": "Fighting",
              "Poison": "Poison",
              "Ground": "Ground",
              "Flying": "Flying",
              "Psychic": "Psychic",
              "Bug": "Bug",
              "Rock": "Rock",
              "Ghost": "Ghost",
              "Dragon": "Dragon",
              "Dark": "Dark",
              "Steel": "Steel",
              "Fairy": "Fairy",
              "Stellar": "Stellar"
            },
            "statuses": {
              "Healthy": "Healthy",
              "Burned": "Burned",
              "Paralyzed": "Paralyzed",
              "Poisoned": "Poisoned",
              "Badly Poisoned": "Badly Poisoned",
              "Frozen": "Frozen",
              "Asleep": "Asleep"
            },
            "statHp": "HP",
            "statAtk": "Atk",
            "statDef": "Def",
            "statSpa": "SpA",
            "statSpd": "SpD",
            "statSpe": "Spe",
            "colStat": "Stat",
            "colBase": "Base",
            "colStage": "Stage",
            "colIvs": "IVs",
            "colEvs": "EVs",
            "colSp": "SP",
            "colTotal": "Total",
            "totalEvs": "Total EVs",
            "totalSp": "Total SP",
            "overBudget": "budget exceeded",
            "hpLabel": "HP",
            "hpReset": "Reset",
            "movePlaceholder": "Move {n}...",
            "loadingMoves": "Loading moves…",
            "basePower": "Base Power",
            "categoryPhysical": "Phys",
            "categorySpecial": "Spec",
            "categoryStatus": "Stat"
          },
          "field": {
            "title": "Field",
            "format": "Format",
            "singles": "Singles",
            "doubles": "Doubles",
            "weather": "Weather",
            "terrain": "Terrain",
            "conditions": "Conditions",
            "attackerSide": "Attacker Side",
            "defenderSide": "Defender Side",
            "weathers": {
              "Sun": "Sun",
              "Rain": "Rain",
              "Sand": "Sand",
              "Snow": "Snow",
              "Harsh Sunshine": "Harsh Sunshine",
              "Heavy Rain": "Heavy Rain"
            },
            "terrains": {
              "Electric": "Electric",
              "Grassy": "Grassy",
              "Psychic": "Psychic",
              "Misty": "Misty"
            },
            "pill": {
              "Trick Room": "Trick Room",
              "Gravity": "Gravity",
              "Magic Room": "Magic Room",
              "Wonder Room": "Wonder Room",
              "Stealth Rock": "SR",
              "Reflect": "Reflect",
              "Light Screen": "Light Screen",
              "Aurora Veil": "Aurora Veil",
              "Tailwind": "Tailwind",
              "Helping Hand": "Helping Hand",
              "Spikes": "Spikes"
            }
          },
          "matrix": {
            "teamLabel": "Your Team",
            "manyLabel": "Threats",
            "addPokemon": "+ Add Pokémon",
            "emptyTeam": "No Pokémon in your team yet",
            "emptyMany": "No threats added yet",
            "searchPlaceholder": "Search Pokémon...",
            "atkDefCorner": "ATK ↓ / DEF →"
          },
          "saved": {
            "title": "Saved Teams",
            "empty": "No saved teams yet",
            "saveTeam": "+ Save Team",
            "saveThreats": "+ Save Threats",
            "namePlaceholder": "Name this team...",
            "saveButton": "Save",
            "cancel": "Cancel",
            "importButton": "Import",
            "importTitle": "Import to Library",
            "importPlaceholder": "Paste a team in Showdown format...",
            "importNamePlaceholder": "Name for this entry...",
            "importSave": "Save to Library",
            "importLoading": "Loading data...",
            "importError": "No valid Pokémon found.",
            "importNameRequired": "Enter a name for this entry.",
            "noTeam": "No Pokémon in team",
            "noThreats": "No Pokémon in threats",
            "copied": "Copied!",
            "loadAsTeam": "→ Team",
            "loadAsThreats": "→ Threats",
            "copy": "Copy",
            "view": "View",
            "rename": "Rename",
            "delete": "Delete",
            "pokemon": "{count} Pokémon"
          },
          "mobile": {
            "attacker": "⚔ Attacker",
            "field": "⚡ Field",
            "defender": "🛡 Defender",
            "spBadge": "SP"
          },
          "moveStrip": {
            "selectMoveLeft": "← select a move",
            "selectMoveRight": "select a move →",
            "noDamage": "No damage / immune",
            "noKO": "no KO",
            "possibleOHKO": "possible OHKO",
            "guaranteedOHKO": "guaranteed OHKO",
            "guaranteed2HKO": "guaranteed 2HKO",
            "possible2HKO": "possible 2HKO"
          },
          "speedView": {
            "tailwind": "Tailwind",
            "scarf": "Scarf",
            "para": "Para",
            "trickRoom": "TR",
            "boostPlus1": "+1",
            "boostPlus2": "+2",
            "boostMinus1": "-1",
            "boostMinus2": "-2",
            "fasterThan": "▲ Faster than",
            "tiesWith": "= Ties with",
            "slowerThan": "▼ Slower than",
            "baseSpeed": "base {speed}",
            "myTeam": "My Team",
            "rival": "Rival",
            "level": "Level",
            "vsRivals": "vs Rivals",
            "allPokemon": "All Pokémon",
            "filterPlaceholder": "Filter reference...",
            "modMyTeam": "My Team",
            "modRivals": "Rivals",
            "emptyState": "Add Pokémon to both teams to compare speeds",
            "noFilterMatch": "No Pokémon match your filter",
            "comparisonTitle": "Speed comparison — My Team vs Rivals (items applied per Pokémon)",
            "sectionMyTeam": "My Team",
            "sectionRivals": "Rivals",
            "referenceTitle": "Reference — top: +Spd 252 EVs / bottom: neutral · {count} Pokémon{format}{filter}",
            "formatSuffix": " (format)",
            "filterSuffix": " filtered"
          },
          "typeCalc": {
            "immune": "Immune",
            "quarterX": "¼×",
            "halfX": "½×",
            "normalX": "1×",
            "doubleX": "2×",
            "quadX": "4×",
            "nve": "NVE",
            "se": "SE",
            "weak": "Weak",
            "res": "Res",
            "addPokemon": "Add Pokémon to your team",
            "addPokemonHint": "Switch to the 1v1 or matrix tabs to configure your team, then come back here.",
            "noThreats": "No threats to analyze",
            "noTeam": "No team to analyze",
            "noThreatsHint": "Add threats in the matrix tab.",
            "noTeamHint": "Switch to the 1v1 or matrix tabs to configure your team.",
            "rivalsCanThreaten": "⚔ Rivals can threaten",
            "offensiveCoverage": "⚔ Offensive coverage",
            "rivalsVulnerabilities": "🛡 Rivals' vulnerabilities",
            "defensiveProfile": "🛡 Defensive profile",
            "rivalsThreatsTitle": "⚔ Rivals' Threats",
            "offensiveCoverageTitle": "⚔ Offensive Coverage",
            "rivalsWeaknessesTitle": "🛡 Rivals' Weaknesses",
            "defensiveCoverageTitle": "🛡 Defensive Coverage",
            "stabByDefenderType": "Rivals' STAB threats by defender type",
            "stabVsDefenderType": "Your team's STAB coverage vs each defender type",
            "rivalsBestThreaten": "Rivals best threaten:",
            "bestCovered": "Best covered:",
            "rivalsResistMost": "Rivals resist most:",
            "mostResistedBy": "Most resisted by:",
            "insights": "Insights",
            "canHit": "Can hit",
            "typesSe": "types SE",
            "notVeryEffective": "not very effective",
            "insightImmune": "immune",
            "membersHitSe": "({count} members hit SE)",
            "resists": "resists",
            "insightWeak": "weak",
            "membersCount": "({count} members)",
            "myTeamToggle": "⚔ My Team",
            "rivalsToggle": "🛡 Rivals"
          },
          "matrixExtras": {
            "importLabel": "Import",
            "noPokemon": "No Pokémon added",
            "addPokemon": "Add Pokémon",
            "emptyMatrix": "Add Pokémon on both sides to see the damage matrix"
          },
          "compactField": {
            "singles": "Singles",
            "doubles": "Doubles",
            "trickRoom": "TR",
            "gravity": "Gravity",
            "atkTailwind": "Atk TW",
            "atkHelpingHand": "Atk HH",
            "defTailwind": "Def TW",
            "defReflect": "Def Reflect",
            "defLightScreen": "Def Light Screen"
          },
          "moveStripCard": {
            "level": "Lv. {level}"
          },
          "shareCopyFailed": "Could not copy. Link: {url}"
        },
        "speed": {
          "title": "Speed",
          "subtitle": "Speed tier reference and head-to-head matchup calculator",
          "modifiers": {
            "title": "Modifiers",
            "clear": "Clear all modifiers",
            "boostTitle": "Speed stage {n}",
            "tailwind": "Tailwind (×2 Speed)",
            "tailwindShort": "Tailwind",
            "scarf": "Choice Scarf (×1.5 Speed)",
            "scarfShort": "Scarf",
            "paralysis": "Paralysis (×0.5 Speed)",
            "paralysisShort": "Para"
          },
          "tabs": {
            "tiers": "Tiers",
            "matchup": "Matchup"
          },
          "clearInput": "Clear"
        },
        "speedTiers": {
          "title": "Speed Tiers",
          "subtitle": "Level 50 speed stats for legal Pokémon — sorted by base Speed",
          "search": "Filter Pokémon...",
          "highlightPlaceholder": "Highlight speed...",
          "showingTier": "Showing {speed} speed tier",
          "pokemonCount": "{count} Pokémon",
          "loading": "Loading speed tiers...",
          "error": "Failed to load speed tiers. Make sure the API is running.",
          "empty": "No Pokémon found.",
          "footer": "N = Neutral nature · + = +Speed nature · all calculations at level 50 · 31 IVs",
          "legend": {
            "restricted": "Restricted",
            "mythical": "Mythical",
            "highlighted": "Highlighted speed tier"
          },
          "badge": {
            "restricted": "Restricted",
            "restrictedTitle": "Restricted Legendary",
            "mythical": "Mythical",
            "mythicalTitle": "Mythical Pokémon"
          },
          "columns": {
            "number": "#",
            "pokemon": "Pokémon",
            "base": "Base",
            "baseTitle": "Base Speed stat",
            "minNeutral": "0/N",
            "minNeutralTitle": "0 EVs, Neutral nature",
            "minPlus": "0/+",
            "minPlusTitle": "0 EVs, +Speed nature",
            "maxNeutral": "252/N",
            "maxNeutralTitle": "252 EVs, Neutral nature",
            "maxPlus": "252/+",
            "maxPlusTitle": "252 EVs, +Speed nature",
            "scarf": "Scarf",
            "scarfTitle": "252 EVs, Choice Scarf",
            "scarfPlus": "Scarf+",
            "scarfPlusTitle": "252 EVs, +Speed, Choice Scarf",
            "noScarf": "Cannot hold Choice Scarf",
            "types": "Types"
          },
          "team": {
            "title": "My Team",
            "add": "Add to team",
            "remove": "Remove from team",
            "full": "Team is full (6 Pokémon)",
            "clearTeam": "Clear team",
            "filterToggle": "Outspeeds team"
          },
          "comparison": {
            "faster": "Faster",
            "slower": "Slower",
            "tie": "Tie",
            "column": "vs Team"
          },
          "reference": {
            "title": "Your Reference",
            "searchPlaceholder": "Pick a Pokémon...",
            "customMode": "Custom",
            "pokemonMode": "Pokémon",
            "clearRef": "Clear",
            "effectiveSpeed": "Effective Speed",
            "evLabel": "EV / Nature",
            "noRef": "Pick a Pokémon to see your speed position in the tier list"
          },
          "zones": {
            "separator": "YOUR SPEED",
            "fasterCount": "{count} faster",
            "slowerCount": "{count} slower",
            "tieCount": "{count} tie"
          },
          "expanded": {
            "breakdown": "Speed Breakdown",
            "vsRef": "vs you ({speed})",
            "sendToMatchup": "Compare in Matchup",
            "noRef": "Set a reference to compare speeds"
          }
        },
        "speedComparison": {
          "title": "Speed Comparison",
          "subtitle": "Compare your team's speed against any opponent",
          "opponentTitle": "Opponent",
          "opponentSearch": "Search Pokémon...",
          "opponentManual": "Or enter speed directly",
          "opponentSpeedPlaceholder": "Speed stat...",
          "opponentModifiers": "Opponent modifiers",
          "effectiveSpeed": "Effective speed",
          "myTeamTitle": "My Team",
          "myTeamModifiers": "Team conditions",
          "teamMemberName": "Name (optional)",
          "teamMemberSpeed": "Speed stat",
          "addMember": "Add slot",
          "removeMember": "Remove",
          "clearTeam": "Clear all",
          "faster": "Faster",
          "slower": "Slower",
          "tie": "Tie",
          "noOpponent": "Enter an opponent speed to compare",
          "invalidSpeed": "Enter a valid speed stat",
          "referenceSpeed": "Reference speeds",
          "loading": "Loading Pokémon data...",
          "empty": "No Pokémon found"
        },
        "tracker": {
          "title": "VGC Tracker",
          "subtitle": "Log your ranked matches",
          "buttons": {
            "presets": "Presets ({count})",
            "newSession": "New session",
            "newMatch": "New match",
            "newSeries": "New series",
            "importCsv": "Import CSV",
            "importing": "Importing…",
            "finish": "Finish",
            "delete": "Delete",
            "cancel": "Cancel",
            "import": "Import",
            "importFile": "Import {name}",
            "importNewPreset": "Import new preset",
            "startSession": "Start session",
            "archive": "Archive",
            "unarchive": "Unarchive",
            "duplicate": "Duplicate",
            "editPreset": "Edit",
            "save": "Save",
            "changePreset": "Change preset",
            "exportSession": "Export session",
            "exportAll": "Export all",
            "importData": "Import data",
            "restoreVersion": "Restore",
            "export": "Export"
          },
          "labels": {
            "sessionLabel": "Session label",
            "presetName": "Preset name",
            "regulation": "Regulation",
            "format": "Format",
            "startingElo": "Starting ELO",
            "teamPreset": "Team preset",
            "noPreset": "No preset",
            "myTeam": "My team",
            "opponent": "Opponent",
            "startDate": "Start date & time",
            "minsPerGame": "Minutes per game",
            "showdownPaste": "Showdown paste",
            "tournamentName": "Tournament name",
            "limitlessTournament": "Link to Limitless tournament",
            "optional": "optional",
            "noTournamentLink": "None",
            "noImportedTournaments": "No imported tournaments for this regulation yet"
          },
          "placeholders": {
            "rivalName": "Rival name…",
            "sessionLabel": "e.g. Ranked grind Apr 24",
            "presetName": "e.g. Reg H — April 2025",
            "typeName": "Type name…",
            "addNote": "Add note... (Enter to save)",
            "startingElo": "optional",
            "tournamentName": "e.g. EUIC 2025"
          },
          "stats": {
            "wins": "Wins",
            "losses": "Losses",
            "draws": "Draws",
            "elo": "ELO"
          },
          "matchRow": {
            "match": "Match #{number}",
            "vs": "vs",
            "noPicks": "No picks entered",
            "noteSingular": "1 note",
            "notesPlural": "{count} notes"
          },
          "tooltips": {
            "deleteMatch": "Delete match",
            "removeFromTeam": "Remove from team",
            "removeFromSlot": "Remove from slot",
            "assignSlot": "Click to assign to next open slot",
            "slotsFull": "All 4 slots are full",
            "assignedSlot": "{role} — click × in zone below to remove",
            "pressKey": "Press {hint}",
            "importCsv": "Import matches from CSV"
          },
          "modals": {
            "newSession": "New Session",
            "teamPresets": "Team Presets",
            "importCsv": "Import CSV"
          },
          "indicators": {
            "saved": "Saved",
            "myElo": "My ELO",
            "rival": "Rival",
            "live": "LIVE",
            "post": "POST"
          },
          "result": {
            "winShort": "W",
            "drawShort": "D",
            "lossShort": "L",
            "win": "Win",
            "loss": "Loss",
            "draw": "Draw",
            "none": "No result"
          },
          "empty": {
            "noSessions": "No sessions yet",
            "noSessionsHint": "Import a team preset, then start a session.",
            "noMatches": "No matches yet — start one!",
            "noPresets": "No presets yet. Import a Showdown paste to get started.",
            "noArchivedSessions": "No archived sessions",
            "noMatch": "No session matches «{q}».",
            "noSeriesTitle": "No series",
            "noMatchesTitle": "No matches"
          },
          "archive": {
            "showArchived": "Show archived ({count})",
            "hideArchived": "Hide archived",
            "badge": "Archived"
          },
          "duplicate": {
            "title": "Duplicate session",
            "newLabel": "New label",
            "inherits": "Inherits"
          },
          "exportImport": {
            "title": "Data",
            "exportSession": "Export session",
            "exportAll": "Export all",
            "importFile": "Import file",
            "importHint": "Merges data, skips duplicates",
            "importSuccess": "{sessions} sessions · {matches} matches imported",
            "importError": "Invalid or corrupt file"
          },
          "preset": {
            "editTitle": "Edit preset",
            "versionHistory": "Version history",
            "versionN": "v{n}",
            "currentTag": "current",
            "changeTitle": "Change active preset",
            "activeLabel": "Active preset",
            "backToList": "Back to list",
            "noPreviousVersions": "No previous versions."
          },
          "sessionType": {
            "ladder": "Ladder",
            "tournament": "Tournament"
          },
          "tournament": {
            "seriesWins": "Series W",
            "seriesLosses": "Series L",
            "gameRecord": "Game record",
            "noSeries": "No series yet — start one!",
            "round": "R{n}",
            "allRounds": "All rounds",
            "seriesNumber": "Series #{n}",
            "seriesUnit": "series",
            "filterByRound": "Filter by round"
          },
          "errors": {
            "presetNameRequired": "Give this preset a name.",
            "invalidPaste": "Could not parse the paste. Check the format."
          },
          "outcomeTag": {
            "label": "Outcome",
            "skill": "Skill",
            "misplay": "Misplay",
            "luck": "Luck",
            "disconnect": "Disconnect"
          },
          "turnCount": {
            "label": "Turns"
          },
          "archetype": {
            "label": "Archetype",
            "placeholder": "e.g. Rain, HO, TR..."
          },
          "sessionNotes": {
            "label": "Session notes",
            "placeholder": "Notes about this session..."
          },
          "workspace": {
            "roundPrefix": "R",
            "game": "Game {n}",
            "gameAbbr": "G{n}",
            "endGame": "End game {n}",
            "noGameData": "No game data.",
            "previousGames": "Previous games",
            "matchTitle": "Match",
            "matchNotFound": "Match not found.",
            "seriesNotFound": "Series not found."
          },
          "notes": {
            "gameTab": "Game notes",
            "seriesTab": "Series notes",
            "noGameNotes": "No game notes yet",
            "noSeriesNotes": "No series notes yet",
            "addSeriesPlaceholder": "Add series note… (Enter)"
          },
          "speedWidget": {
            "label": "Speed Tiers",
            "expand": "Show",
            "collapse": "Hide",
            "summary": "{count} mons · {min}-{max}",
            "trickroom": "TR ↕",
            "opponentSpeed": "Opponent Base Speed",
            "opponentSpeedPlaceholder": "Enter opponent base speed...",
            "presetHint": "Click a row to change EV preset"
          },
          "zones": {
            "leads": "Leads",
            "backs": "Backs"
          },
          "sessionStats": {
            "tabs": {
              "matches": "Matches",
              "stats": "Stats",
              "aria": "Session view"
            },
            "kpi": {
              "played": "Played",
              "winRate": "Win Rate",
              "streak": "Streak",
              "streakWin": "{count}W streak",
              "streakLoss": "{count}L streak",
              "eloNow": "Current ELO",
              "eloBest": "Best",
              "eloWorst": "Worst",
              "avgDelta": "±ELO/game",
              "bestStreak": "Best streak"
            },
            "chart": {
              "title": "ELO Timeline",
              "start": "Start",
              "noData": "No completed matches yet"
            },
            "table": {
              "pokemon": "Pokémon",
              "uses": "Uses",
              "brought": "Brought",
              "discards": "Discards",
              "record": "W/L/D",
              "winRate": "WR",
              "tournamentUsage": "Tournament %",
              "noData": "No completed match data yet.",
              "tabs": {
                "myTeam": "My team",
                "preview": "Opponent preview",
                "leads": "Opp. leads",
                "backs": "Opp. backs"
              },
              "title": "Pokémon usage",
              "empty": "Not enough data."
            },
            "regulationMeta": {
              "title": "Regulation meta",
              "matchCount": "{n} matches",
              "noData": "No opponent data across this regulation yet.",
              "tournamentUsage": "Tournament usage"
            },
            "comparison": {
              "title": "Compare sessions",
              "clearAll": "Clear all",
              "hint": "Select sessions above to overlay their ELO charts."
            },
            "pairs": {
              "title": "Lead pairs",
              "mine": "Mine",
              "rivals": "Rivals",
              "empty": "No data."
            },
            "archetype": {
              "title": "By opponent archetype",
              "empty": "No archetype data yet."
            },
            "matchup": {
              "title": "Matchup matrix",
              "hint": "win rate when facing them",
              "empty": "Not enough data."
            },
            "activity": {
              "title": "Activity",
              "hint": "matches per hour"
            },
            "timeOfDay": {
              "title": "By time of day",
              "morning": "Morning",
              "afternoon": "Afternoon",
              "evening": "Evening",
              "night": "Night",
              "empty": "No data."
            },
            "days": {
              "0": "Sun",
              "1": "Mon",
              "2": "Tue",
              "3": "Wed",
              "4": "Thu",
              "5": "Fri",
              "6": "Sat"
            }
          },
          "filters": {
            "sessionType": "Session type",
            "all": "All",
            "ladder": "Ladder",
            "tournaments": "Tournaments",
            "clear": "Clear filters"
          },
          "search": {
            "session": "Search session…"
          },
          "career": {
            "sessions": "Sessions",
            "record": "Total record",
            "winRate": "Win rate",
            "bestElo": "Best ELO"
          },
          "nav": {
            "backToSessions": "Back to sessions",
            "backToSession": "Back to session"
          },
          "sessionSub": {
            "record": "{played} matches · {wins}-{losses}"
          },
          "roles": {
            "lead1": "Lead 1",
            "lead2": "Lead 2",
            "back1": "Back 1",
            "back2": "Back 2",
            "unknown": "Bench"
          },
          "notePhase": {
            "live": "live",
            "post": "post",
            "series": "series"
          },
          "sync": {
            "conflict": "Sync conflict",
            "conflictHint": "Another tab or device has newer data.",
            "refreshFromCloud": "Refresh from cloud",
            "synced": "Synced",
            "syncing": "Syncing",
            "error": "Sync error",
            "rejected": "The server rejected a change: {detail}",
            "refreshed": "Tracker refreshed from the cloud",
            "conflictBody": "Another device has newer data. Refresh from the cloud to continue.",
            "pending": "{count} unsent"
          },
          "claim": {
            "title": "Signed-out data on this device",
            "body": "This device has sessions recorded while signed out. You can import them into this account and sync them, or leave them alone: they stay available when you sign out.",
            "import": "Import into my account",
            "keepSeparate": "Leave them alone"
          }
        },
        "meta": {
          "title": "Meta Analysis",
          "subtitle": "Ladder usage & team composition data from Smogon Stats",
          "formats": {
            "gen9vgc2026regi": "VGC 2026 Reg I",
            "gen9vgc2026regh": "VGC 2026 Reg H",
            "gen9vgc2025regg": "VGC 2025 Reg G",
            "gen9vgc2025regf": "VGC 2025 Reg F"
          },
          "pickers": {
            "format": "Format",
            "month": "Month",
            "monthPlaceholder": "Latest",
            "cutoff": "Min ELO",
            "load": "Apply",
            "regulation": "Regulation",
            "tournament": "Tournament"
          },
          "options": "Options",
          "sidebar": {
            "search": "Search Pokémon...",
            "noResults": "No results"
          },
          "table": {
            "rank": "#",
            "pokemon": "Pokémon",
            "usage": "Usage",
            "item": "Item",
            "move": "Move",
            "tera": "Tera",
            "loading": "Loading meta data...",
            "empty": "No data found for this format and month.",
            "error": "Failed to load meta data. Make sure the API is running."
          },
          "detail": {
            "baseStats": "Base Stats",
            "abilities": "Abilities",
            "items": "Items",
            "moves": "Moves",
            "teraTypes": "Tera Types",
            "teammates": "Teammates",
            "spreads": "EV Spreads",
            "close": "Close",
            "loading": "Loading details...",
            "backToList": "Back",
            "notFound": "No data available for this Pokémon.",
            "battles": "{count} battles",
            "other": "Other",
            "usagePercent": "{percent}% usage",
            "featuringTeams": "Featuring Teams",
            "teamsLoading": "Loading teams…",
            "copyPaste": "Copy Paste",
            "copied": "Copied!",
            "rentalCode": "Rental Code",
            "rank": "Rank",
            "usage": "Usage",
            "appearances": "Appearances",
            "topN": "top {n}",
            "noData": "—",
            "abilitiesTeras": "Abilities & Tera Types",
            "clickToJump": "click to jump",
            "teamsWith": "Teams with {name}",
            "tournamentResults": "tournament results",
            "noTeams": "No teams recorded for this species.",
            "emptyTitle": "Pick a Pokémon",
            "emptyLead": "Select a species from the ranking to see its competitive breakdown: moves, items, spreads and teams."
          },
          "standings": {
            "loading": "Loading standings…",
            "empty": "No players found.",
            "col": {
              "rank": "#",
              "player": "Player",
              "record": "Record",
              "team": "Team"
            },
            "teamLoading": "Loading…",
            "copyPaste": "Copy Poképaste",
            "copied": "Copied!",
            "tera": "Tera: {type}",
            "search": "Search player…",
            "count": "{count} players",
            "teamEmpty": "Team not available for this player."
          },
          "divergence": {
            "loading": "Loading divergence data…",
            "empty": "No divergence data. Import a tournament first.",
            "selectTournament": "Select a regulation and tournament to view divergence.",
            "rowCount": "{count} Pokémon",
            "allElo": "All ELO",
            "col": {
              "pokemon": "Pokémon",
              "ladder": "Ladder",
              "tournament": "Tournament",
              "delta": "|Δ|",
              "badge": "Badge"
            },
            "badges": {
              "ladderTrap": "Ladder trap",
              "ladderTrapTitle": "High ladder usage, low tournament usage — may be overrated in top-cut",
              "tournamentStaple": "Tournament staple",
              "tournamentStapleTitle": "Low ladder usage, high tournament usage — underrated on the ladder"
            },
            "emptyTitle": "No divergence data",
            "note": "Compares <b>ladder</b> usage ({format} · {month} · 1630+ ELO) with <b>tournament</b> usage. Positive Δ = more used in tournaments."
          },
          "refresh": "Refresh",
          "footer": "Data from Smogon Stats · Updated monthly · Default ELO cutoff: 1760",
          "barTitle": "VGC Meta",
          "barSub": {
            "ladder": "Ladder · Smogon",
            "tournament": "Official circuit"
          },
          "tabs": {
            "stats": "Ladder",
            "tournament": "Tournaments",
            "combined": "All tournaments",
            "aggregate": "Aggregate",
            "players": "Players",
            "divergence": "Divergence",
            "championsNotice": "Usage computed from the imported VGCPastes teams, not from the Smogon ladder."
          },
          "cutoff": {
            "all": "All ELO"
          },
          "chip": {
            "battles": "{count} battles",
            "teams": "{count} teams"
          },
          "aria": {
            "source": "Data source",
            "tournamentView": "Tournament view",
            "usageRanking": "Usage ranking",
            "standings": "Tournament standings",
            "divergence": "Ladder–tournament divergence"
          },
          "list": {
            "appearances": "{count} appearances"
          },
          "empty": {
            "noMatch": "No Pokémon matches “{q}”.",
            "noPlayer": "No player matches “{q}”.",
            "clear": "Clear search"
          },
          "sub": {
            "combined": "Combined · {count} tournaments",
            "tourWithPlayers": "{name} · {count} players",
            "formatNote": "Current regulation. Allows two restricted Pokémon per team."
          },
          "adapter": {
            "teamFallback": "Team",
            "teraNone": "None"
          }
        },
        "manifest": {
          "calc": {
            "name": "Damage calculator",
            "description": "Damage, KO chances and speed for VGC doubles.",
            "category": "Competitive"
          },
          "speed": {
            "name": "Speed tiers",
            "description": "Compare the format’s speeds and their modifiers.",
            "category": "Competitive"
          },
          "meta": {
            "name": "Meta analysis",
            "description": "Usage, teams and divergence by regulation and tournament.",
            "category": "Competitive"
          },
          "tracker": {
            "name": "VGC tracker",
            "description": "Log sessions, matches and series, online or off.",
            "category": "Competitive"
          }
        }
      }
    }
  }
} as const;





export type ToolsPokemonLocale = keyof typeof messages;
