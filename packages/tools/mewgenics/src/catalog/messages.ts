// AUTO-EXTRACTED from apps/web/locales/{es,en}/smartrotom/mewgenics.json.
// This package OWNS these keys — the web catalog no longer carries them.
//
// One file, and one plain object literal, deliberately: `scripts/check-i18n.mjs`
// reads this catalog by slicing the text between the assignment and `as const`
// and running it through JSON.parse, so it can verify key parity without
// executing TypeScript. A catalog assembled from parts at runtime type-checks
// and then makes that check crash — which is why this is one file rather than
// one per tool.
//
// Spanish is the source of truth; English is the translation.

export const messages = {
  "es": {
    "tools": {
      "mewgenics": {
        "loading": "Desenterrando el códice de Mewgenics…",
        "error": {
          "title": "No se pudieron cargar los datos",
          "checkPath": "Revisa que {path} exista. {error}"
        },
        "codex": "Códice",
        "chrome": {
          "entries": "{total} entradas · datos wiki · {lang}",
          "entriesLoading": "Desenterrando el códice…",
          "randomTitle": "Abrir una entrada al azar",
          "random": "Al azar",
          "cursorToggleTitle": "Alternar cursor personalizado",
          "soundToggleTitle": "Alternar efectos de sonido",
          "catBuilderTitle": "Abrir Constructor de Gatos",
          "catBuilder": "Constructor de Gatos",
          "tabsAriaLabel": "Categorías"
        },
        "roster": {
          "count": "{count, plural, one {{count} {singular}} other {{count} {label}}}",
          "searchPlaceholder": "Buscar en {category}…",
          "searchLabel": "Buscar en {category}",
          "clearSearch": "Limpiar búsqueda",
          "viewGrid": "Rejilla",
          "viewList": "Lista",
          "sortLabel": "Ordenar",
          "filterAll": "Todo",
          "filters": "Filtros",
          "favoritesLabel": "★ Favoritos ({count})",
          "clearFilters": "Limpiar filtros",
          "loadMoreHint": "{remaining} resultados más",
          "kbdCategory": "categoría",
          "kbdSearch": "buscar",
          "showingCap": "· mostrando {n}",
          "loadMore": "Mostrar más",
          "loadingAbilities": "Cargando habilidades…",
          "abilitiesErrorTitle": "Habilidades no disponibles",
          "abilitiesErrorLead": "No se pudo cargar abilities.json.",
          "emptyTitle": "Sin resultados",
          "emptyLead": "Ajusta la búsqueda o los filtros.",
          "overflowHint": "Refina la búsqueda para ver el resto.",
          "mutationFold": "Mutaciones",
          "mutationNamedOnly": "Solo con nombre",
          "mutationShowAll": "Mostrar numeradas"
        },
        "panel": {
          "data": "Datos",
          "stats": "Estadísticas",
          "combat": "Combate",
          "traitsPassives": "Rasgos y pasivas",
          "equipment": "Equipo",
          "variantOf": "Variante de",
          "appearsIn": "Aparece en",
          "costRange": "Coste y alcance",
          "damageEffect": "Daño y efecto",
          "chainsWith": "Encadena con",
          "grantsPassives": "Otorga pasivas",
          "tags": "Etiquetas",
          "usedBy": "La usan",
          "mods": "Modificadores",
          "passivesGranted": "Pasivas que otorga",
          "use": "Uso",
          "sets": "Conjuntos",
          "setMembers": "Piezas del conjunto",
          "carriers": "Lo llevan",
          "baseEffect": "Efecto base",
          "ranks": "Rangos",
          "innateWeapon": "Arma innata",
          "starterAbilities": "Habilidades iniciales",
          "abilityPool": "Reserva de habilidades",
          "statMods": "Modificadores de estadística",
          "classPassives": "Pasivas de clase",
          "bosses": "Jefes",
          "enemyPools": "Reservas de enemigos",
          "itemPools": "Reservas de objetos",
          "choices": "Elecciones",
          "whereToGet": "Dónde conseguirlo",
          "shops": "Tiendas",
          "classCharacters": "Personajes",
          "effects": "Efectos"
        },
        "label": {
          "id": "ID",
          "type": "Tipo",
          "rarity": "Rareza",
          "faction": "Facción",
          "hp": "Salud",
          "sprite": "Sprite",
          "spriteAvailable": "Disponible",
          "spriteNone": "Sin sprite",
          "move": "Movimiento",
          "canBeChamp": "Puede ser campeón",
          "yes": "Sí",
          "no": "No",
          "attack": "Ataque",
          "spells": "Hechizos",
          "actPoints": "Puntos de acción",
          "movePoints": "Puntos de movimiento",
          "hpThreshold": "Umbral de salud",
          "target": "Objetivo",
          "range": "Alcance",
          "area": "Área",
          "damage": "Daño",
          "heal": "Cura",
          "selfDmg": "Daño propio",
          "splash": "Salpicadura",
          "abilityClass": "Clase de habilidad",
          "template": "Plantilla",
          "shield": "Escudo",
          "durability": "Durabilidad",
          "consumable": "Consumible",
          "cursed": "Maldito",
          "parasite": "Parásito",
          "questItem": "Objeto de misión",
          "indestructible": "Indestructible",
          "divineShield": "Escudo divino",
          "class": "Clase",
          "general": "General",
          "rule": "Regla",
          "stackPos": "Acumulación positiva",
          "stackNeg": "Acumulación negativa",
          "stackNegNamed": "{name} (negativo)",
          "stackNone": "Sin acumulación",
          "statusBadge": "Estado",
          "noStatusDesc": "Este estado no expone una descripción en el conjunto de datos.",
          "act": "Acto",
          "chapter": "Capítulo",
          "tileset": "Tileset",
          "music": "Música",
          "minibosses": "Minijefes",
          "poolSmall": "Pequeños",
          "poolMedium": "Medianos",
          "poolLarge": "Grandes",
          "mapBadge": "Acto {act} · Cap. {chapter}",
          "abilities": "Habilidades",
          "classes": "Clases",
          "characters": "Personajes",
          "applies": "Aplica",
          "check": "Chequeo",
          "success": "Éxito",
          "failure": "Fallo",
          "result": "Resultado",
          "noRef": "Sin ficha en la base de datos",
          "bossLabel": "Jefes",
          "data": "Datos",
          "special": "Especial",
          "removed": "Eliminado",
          "bodyPart": "Parte del cuerpo",
          "properties": "Propiedades",
          "piecesRequired": "Piezas requeridas",
          "storyCat": "Categoría de historia",
          "comfort": "Comodidad",
          "appeal": "Atractivo",
          "stimulation": "Estimulación",
          "evolution": "Evolución",
          "champion": "Campeón",
          "setFamily": "Familia de muebles",
          "mutationNumber": "Mutación #",
          "health": "Salud",
          "ability": "Habilidad",
          "cost": "Coste",
          "group": "Grupo",
          "panHint": "Arrastra para explorar el mapa",
          "viewFull": "Ver a tamaño completo",
          "noData": "El juego no expone más datos para esta entrada.",
          "unique": "Único",
          "eliteValue": "Valor de élite"
        },
        "targetMode": {
          "none": "Sin objetivo",
          "self": "Sí mismo",
          "single": "Un objetivo",
          "tile": "Una casilla",
          "direction": "Dirección",
          "line": "Línea",
          "cone": "Cono",
          "all": "Todos",
          "aoe": "Área"
        },
        "stat": {
          "str": "FUE",
          "dex": "DES",
          "con": "CON",
          "int": "INT",
          "spd": "VEL",
          "cha": "CAR",
          "lck": "SUE"
        },
        "reward": {
          "getItemFromPool": "Objeto de reserva",
          "getItem": "Objeto",
          "getParasite": "Parásito",
          "partyHeal": "Cura al grupo",
          "gainFood": "Comida",
          "gainGold": "Oro",
          "loseGold": "Pierde oro",
          "selfStatusNextFight": "Estado propio (próx. combate)",
          "allyAmbushNextFights": "Emboscada aliada",
          "spawnUnitNextFight": "Invoca unidad",
          "gainDisorderFromPool": "Trastorno",
          "randomPool": "Recompensa aleatoria",
          "setFlag": "Activa bandera",
          "heal": "Cura",
          "gainXp": "Experiencia",
          "addCat": "Añade gato",
          "removeCat": "Pierde gato",
          "line": {
            "gainCoins": "Gana {n} monedas",
            "gainFood": "Gana {n} de comida",
            "gainXp": "Gana {n} de experiencia",
            "loseCoins": "Pierde {n} monedas",
            "getItem": "Consigue un objeto",
            "getItemFromPool": "Consigue un objeto aleatorio de",
            "equipItem": "Consigue y equipa",
            "equipItemFromPool": "Consigue y equipa un objeto de",
            "getParasite": "Recibe un parásito",
            "getParasiteFromPool": "Recibe un parásito de",
            "loseItem": "Pierde un objeto",
            "loseAllItems": "Pierde todo el equipo",
            "damage": "Recibe {n} de daño",
            "selfDamage": "Se hace {n} de daño",
            "partyDamage": "El grupo recibe {n} de daño",
            "kill": "Muere",
            "heal": "Se cura {n}",
            "partyHeal": "El grupo se cura {n}",
            "fullHeal": "Se cura por completo",
            "injury": "Sufre una lesión",
            "gainDisorder": "Adquiere un trastorno",
            "gainDisorderFromPool": "Adquiere un trastorno de",
            "randomMutation": "Recibe una mutación aleatoria",
            "mutation": "Recibe la mutación",
            "permanentStats": "Cambio permanente de estadísticas",
            "selfStatusNextFight": "Empieza el siguiente combate con",
            "partyStatusNextFight": "El grupo empieza el siguiente combate con",
            "gainFamiliar": "Consigue un familiar",
            "addCat": "Se une un gato",
            "removeCat": "Pierdes un gato",
            "spawnUnitNextFight": "Aparece en el siguiente combate",
            "allyAmbush": "Emboscada aliada en los próximos combates",
            "ambush": "Emboscada en los próximos combates",
            "battle": "Comienza un combate",
            "shopNow": "Se abre una tienda",
            "eventNow": "Ocurre otro evento",
            "eventNowSameCat": "Ocurre otro evento con el mismo gato",
            "nextEventBonus": "Bonificación en el siguiente evento",
            "counterUp": "Contador +{n}",
            "counterDown": "Contador −{n}",
            "setToken": "Marca un token",
            "setFlag": "Activa una marca"
          }
        },
        "pop": {
          "noDesc": "Sin descripción en los datos.",
          "setFlag": "Conjunto",
          "setPieces": "{n, plural, one {# pieza} other {# piezas}}",
          "setFooter": "Conjunto de equipo",
          "openCard": "Clic para abrir la ficha",
          "passiveRanks": "{n} rangos",
          "slots": "Ranuras",
          "passivesCount": "{n} que otorga",
          "effect": "Efecto"
        },
        "inline": {
          "targetAbbr": "Obj",
          "rangeAbbr": "Alc",
          "damageAbbr": "Daño",
          "healAbbr": "Cura",
          "appliesAbbr": "Aplica",
          "shieldAbbr": "Escudo",
          "durabilityAbbr": "Durab",
          "passivesAbbr": "Pasivas"
        },
        "classGroup": {
          "attack": "Ataque",
          "defense": "Defensa",
          "move": "Movimiento",
          "misc": "Varios"
        },
        "filter": {
          "kind": {
            "label": "Tipo",
            "weapon": "Arma",
            "head": "Cabeza",
            "face": "Cara",
            "neck": "Cuello",
            "trinket": "Abalorio"
          },
          "rarity": "Rareza",
          "faction": "Facción",
          "type": "Tipo",
          "cls": {
            "label": "Clase",
            "general": "General"
          },
          "subject": "Asunto",
          "act": "Acto",
          "furniture": {
            "stat": "Estadística principal",
            "special": "Especial",
            "comfort": "Comodidad",
            "appeal": "Atractivo",
            "stimulation": "Estimulación",
            "health": "Salud",
            "evolution": "Evolución",
            "removed": "Eliminado",
            "normal": "Normal"
          },
          "mutations": {
            "bodyPart": "Parte del cuerpo",
            "body": "Cuerpo",
            "ears": "Orejas",
            "eyes": "Ojos",
            "eyebrows": "Cejas",
            "head": "Cabeza",
            "legs": "Piernas",
            "mouth": "Boca",
            "tail": "Cola",
            "texture": "Textura"
          },
          "statuses": {
            "kind": "Tipo",
            "weather": "Clima",
            "injuries": "Lesiones",
            "elite_buffs": "Mejoras de élite"
          }
        },
        "browse": {
          "act": "Acto"
        },
        "sort": {
          "name": "A–Z",
          "rarity": "Rareza",
          "kind": "Tipo",
          "hp": "Salud",
          "faction": "Facción",
          "furniture": {
            "comfort": "Comodidad",
            "appeal": "Atractivo",
            "stimulation": "Estimulación"
          }
        },
        "cat": {
          "items": {
            "label": "Objetos",
            "singular": "objeto",
            "desc": "Armas, cabeza, cara, cuello, abalorios, consumibles, malditos y parásitos."
          },
          "characters": {
            "label": "Bestiario",
            "singular": "personaje",
            "desc": "Enemigos, jefes, minijefes, kaijus, aliados y familiares."
          },
          "abilities": {
            "label": "Habilidades",
            "singular": "habilidad",
            "desc": "Ataques y hechizos: coste, alcance, daño y efectos."
          },
          "passives": {
            "label": "Pasivas",
            "singular": "pasiva",
            "desc": "Pasivas de clase y trastornos, con sus rangos."
          },
          "keywords": {
            "label": "Estados",
            "singular": "estado",
            "desc": "Efectos de estado y palabras clave con sus reglas."
          },
          "events": {
            "label": "Eventos",
            "singular": "evento",
            "desc": "Eventos de mapa: elecciones, chequeos de estadística y recompensas."
          },
          "classes": {
            "label": "Clases",
            "singular": "clase",
            "desc": "Clases y clases avanzadas con sus reservas de habilidades."
          },
          "maps": {
            "label": "Mapas",
            "singular": "mapa",
            "desc": "Áreas por acto y capítulo: enemigos, jefes, objetos y eventos."
          },
          "furniture": {
            "label": "Muebles",
            "singular": "mueble",
            "desc": "Decoraciones de sala con bonificaciones de comodidad, atractivo, estimulación, salud y evolución."
          },
          "mutations": {
            "label": "Mutaciones",
            "singular": "mutación",
            "desc": "Mutaciones de partes del cuerpo con modificadores de estadística y efectos pasivos."
          },
          "sets": {
            "label": "Conjuntos",
            "singular": "conjunto",
            "desc": "Conjuntos de equipo con bonificaciones por llevar múltiples piezas."
          },
          "story_cats": {
            "label": "Gatos de Historia",
            "singular": "gato",
            "desc": "Gatos con nombre de la historia, jefes y variantes campeonas."
          },
          "statuses": {
            "label": "Estados",
            "singular": "estado",
            "desc": "Clima, lesiones y mejoras de élite con sus efectos."
          }
        },
        "fiche": {
          "back": "Volver a {category}",
          "prev": "Entrada anterior",
          "next": "Entrada siguiente",
          "position": "{n} de {total}",
          "share": "Copiar enlace",
          "shareCopied": "Enlace copiado",
          "favAdd": "Añadir a favoritos",
          "favRemove": "Quitar de favoritos",
          "trailLabel": "Historial"
        },
        "common": {
          "moreCount": "{n} más",
          "openLightbox": "Ver imagen",
          "closeLightbox": "Cerrar",
          "copy": "Copiar",
          "copied": "Copiado"
        },
        "data": {
          "rarity": {
            "common": "Común",
            "uncommon": "Poco común",
            "rare": "Raro",
            "very_rare": "Muy raro",
            "consumable_common": "Consumible",
            "consumable_uncommon": "Consumible+",
            "consumable_rare": "Consumible★",
            "consumable_very_rare": "Consumible★★",
            "quest": "Misión",
            "sidequest": "Sub-misión"
          },
          "faction": {
            "enemies": "Enemigo",
            "solitary_enemies": "Solitario",
            "allies": "Aliado",
            "birds": "Pájaro",
            "cavemen": "Cavernícola",
            "mammoths": "Mamut",
            "sabertooths": "Dientes de sable",
            "kaiju1": "Kaiju",
            "kaiju2": "Kaiju",
            "third_party": "Neutral",
            "none": "Objeto"
          },
          "statName": {
            "strength": "Fuerza",
            "dexterity": "Destreza",
            "constitution": "Constitución",
            "intelligence": "Inteligencia",
            "speed": "Velocidad",
            "charisma": "Carisma",
            "luck": "Suerte"
          },
          "statMod": {
            "str": "Fuerza",
            "dex": "Destreza",
            "con": "Constitución",
            "int": "Inteligencia",
            "spd": "Velocidad",
            "cha": "Carisma",
            "lck": "Suerte",
            "speed": "Velocidad",
            "shield": "Escudo",
            "max_health": "Salud máx.",
            "durability": "Durabilidad",
            "max_durability": "Durabilidad máx."
          },
          "kind": {
            "weapon": "Arma",
            "head": "Cabeza",
            "face": "Cara",
            "neck": "Cuello",
            "trinket": "Abalorio",
            "modifier": "Modificador",
            "armor": "Armadura"
          },
          "token": {
            "shield": "Escudo",
            "divineshield": "Escudo divino",
            "str": "FUE",
            "dex": "DES",
            "con": "CON",
            "int": "INT",
            "spd": "VEL",
            "cha": "CAR",
            "lck": "SUE",
            "health": "Salud",
            "mana": "Maná",
            "crit": "Crít",
            "block": "Bloqueo",
            "exhaustion": "Agotamiento"
          },
          "statAbbr": {
            "pa": "PA",
            "pm": "PM",
            "pv": "PV"
          }
        },
        "builder": {
          "equipment": "Equipo",
          "export": "Exportar PNG",
          "exporting": "Exportando...",
          "palette": "Paleta",
          "parts": {
            "body": "Cuerpo",
            "claws": "Garras",
            "ears": "Orejas",
            "eyebrows": "Cejas",
            "eyes": "Ojos",
            "head": "Cabeza",
            "legs": "Patas",
            "mouth": "Boca",
            "tail": "Cola",
            "texture": "Textura",
            "arms": "Brazos"
          },
          "partsTitle": "Partes del Gato",
          "pose": {
            "eyes": {
              "closed": "Cerrados",
              "open": "Abiertos"
            },
            "mouth": {
              "normal": "Normal",
              "open": "Abierta",
              "smile": "Sonrisa"
            }
          },
          "poseEyesLabel": "Ojos",
          "poseMouthLabel": "Boca",
          "presets": "Gatos de Historia",
          "randomize": "Aleatorio",
          "title": "Constructor de Gatos Mewgenics",
          "search": "Buscar partes…",
          "none": "Ninguno",
          "noResults": "No hay partes que coincidan",
          "partOf": "{n} de {total}",
          "equipHead": "Objeto de cabeza",
          "equipFace": "Objeto de cara",
          "equipNeck": "Objeto de cuello",
          "equipWeapon": "Arma",
          "equipTrinket": "Abalorio",
          "equipOnCat": "Puesto en el gato",
          "equipSideOnly": "Mostrado junto al gato",
          "loadingParts": "Cargando partes…",
          "paletteStandard": "Estándar (genética)",
          "paletteSpecial": "Historia y especiales",
          "stageBg": "Fondo",
          "stageBgOption": {
            "night": "Noche",
            "paper": "Papel",
            "grid": "Cuadrícula"
          },
          "zoomIn": "Acercar",
          "zoomOut": "Alejar",
          "zoomFit": "Ajustar al escenario",
          "close": "Cerrar",
          "searchPresets": "Buscar gatos…",
          "searchItems": "Buscar objetos…",
          "presetCustom": "Gato personalizado",
          "paletteAll": "Ver las {n}",
          "undo": "Deshacer",
          "reset": "Reiniciar",
          "copyLink": "Copiar enlace",
          "copied": "¡Copiado!",
          "backToCodex": "Volver al códice"
        },
        "event": {
          "calc": {
            "title": "Calculadora de probabilidad",
            "intro": "Ajusta las estadísticas del gato: cada opción usa la suya y el modificador de stat más bajo/alto se deduce solo.",
            "difficulty": "Dificultad",
            "difficultyNote": "La dificultad no aparece en los datos extraídos del juego; déjala en 0 salvo que quieras simular una tirada más dura.",
            "lowest": "la más baja",
            "highest": "la más alta",
            "reset": "Reiniciar",
            "success": "Éxito",
            "rare": "Raro",
            "fixed": "Probabilidad fija",
            "checkOf": "Tirada de {stat}",
            "difficultyShort": "Dif",
            "luckOnly": "Solo suerte",
            "noRoll": "Sin tirada",
            "tierOnly": "Resultado garantizado",
            "isLowest": "su stat más bajo",
            "isHighest": "su stat más alto",
            "decrease": "Bajar {stat}",
            "increase": "Subir {stat}"
          },
          "outcome": {
            "goodRare": "Bien raro",
            "goodCommon": "Bien común",
            "badCommon": "Mal común",
            "badRare": "Mal raro"
          },
          "tier": {
            "common": "Común",
            "rare": "Raro",
            "weight": "peso"
          },
          "intro": {
            "title": "Textos de introducción",
            "counter": "Contador"
          },
          "req": {
            "title": "Requisitos",
            "counterMax": "contador ≤ {n}",
            "counterMin": "contador ≥ {n}",
            "counterRange": "contador {a}–{b}",
            "slotEquipped": "lleva equipado: {slot}"
          },
          "cost": "Cuesta {n} {what}"
        },
        "source": {
          "hint": "Pasa el cursor (o tabula) por una fuente para ver lo que contiene."
        },
        "storyCat": {
          "appearance": "Apariencia",
          "voice": "Voz",
          "pitch": "Tono",
          "openInBuilder": "Abrir en el constructor"
        },
        "manifest": {
          "codex": {
            "name": "Códice Mewgenics",
            "description": "Base de datos completa de Mewgenics",
            "category": "Referencia"
          },
          "builder": {
            "name": "Constructor de Gatos",
            "description": "Personaliza tu propio gato",
            "category": "Herramienta"
          }
        }
      }
    }
  },
  "en": {
    "tools": {
      "mewgenics": {
        "loading": "Unearthing the Mewgenics codex…",
        "error": {
          "title": "Failed to load data",
          "checkPath": "Check that {path} exists. {error}"
        },
        "codex": "Codex",
        "chrome": {
          "entries": "{total} entries · wiki data · {lang}",
          "entriesLoading": "Unearthing the codex…",
          "randomTitle": "Open a random entry",
          "random": "Random",
          "cursorToggleTitle": "Toggle custom cursor",
          "soundToggleTitle": "Toggle sound effects",
          "catBuilderTitle": "Open Cat Builder",
          "catBuilder": "Cat Builder",
          "tabsAriaLabel": "Categories"
        },
        "roster": {
          "count": "{count, plural, one {{count} {singular}} other {{count} {label}}}",
          "searchPlaceholder": "Search in {category}…",
          "searchLabel": "Search in {category}",
          "clearSearch": "Clear search",
          "viewGrid": "Grid",
          "viewList": "List",
          "sortLabel": "Sort",
          "filterAll": "All",
          "filters": "Filters",
          "favoritesLabel": "★ Favorites ({count})",
          "clearFilters": "Clear filters",
          "loadMoreHint": "{remaining} more results",
          "kbdCategory": "category",
          "kbdSearch": "search",
          "showingCap": "· showing {n}",
          "loadMore": "Load more",
          "loadingAbilities": "Loading abilities…",
          "abilitiesErrorTitle": "Abilities unavailable",
          "abilitiesErrorLead": "Could not load abilities.json.",
          "emptyTitle": "No results",
          "emptyLead": "Adjust the search or filters.",
          "overflowHint": "Narrow your search to see the rest.",
          "mutationFold": "Mutations",
          "mutationNamedOnly": "Named only",
          "mutationShowAll": "Show numbered"
        },
        "panel": {
          "data": "Data",
          "stats": "Statistics",
          "combat": "Combat",
          "traitsPassives": "Traits & Passives",
          "equipment": "Equipment",
          "variantOf": "Variant of",
          "appearsIn": "Appears in",
          "costRange": "Cost & Range",
          "damageEffect": "Damage & Effect",
          "chainsWith": "Chains with",
          "grantsPassives": "Grants Passives",
          "tags": "Tags",
          "usedBy": "Used by",
          "mods": "Modifiers",
          "passivesGranted": "Passives granted",
          "use": "Use",
          "sets": "Sets",
          "setMembers": "Set pieces",
          "carriers": "Carried by",
          "baseEffect": "Base Effect",
          "ranks": "Ranks",
          "innateWeapon": "Innate Weapon",
          "starterAbilities": "Starter Abilities",
          "abilityPool": "Ability Pool",
          "statMods": "Stat Modifiers",
          "classPassives": "Class Passives",
          "bosses": "Bosses",
          "enemyPools": "Enemy Pools",
          "itemPools": "Item Pools",
          "choices": "Choices",
          "whereToGet": "Where to Get It",
          "shops": "Shops",
          "classCharacters": "Characters",
          "effects": "Effects"
        },
        "label": {
          "id": "ID",
          "type": "Type",
          "rarity": "Rarity",
          "faction": "Faction",
          "hp": "Health",
          "sprite": "Sprite",
          "spriteAvailable": "Available",
          "spriteNone": "No sprite",
          "move": "Move",
          "canBeChamp": "Can be champion",
          "yes": "Yes",
          "no": "No",
          "attack": "Attack",
          "spells": "Spells",
          "actPoints": "Action points",
          "movePoints": "Move points",
          "hpThreshold": "HP threshold",
          "target": "Target",
          "range": "Range",
          "area": "Area",
          "damage": "Damage",
          "heal": "Heal",
          "selfDmg": "Self damage",
          "splash": "Splash",
          "abilityClass": "Ability class",
          "template": "Template",
          "shield": "Shield",
          "durability": "Durability",
          "consumable": "Consumable",
          "cursed": "Cursed",
          "parasite": "Parasite",
          "questItem": "Quest item",
          "indestructible": "Indestructible",
          "divineShield": "Divine Shield",
          "class": "Class",
          "general": "General",
          "rule": "Rule",
          "stackPos": "Positive stacking",
          "stackNeg": "Negative stacking",
          "stackNegNamed": "{name} (negative)",
          "stackNone": "No stacking",
          "statusBadge": "Status",
          "noStatusDesc": "This status has no description in the dataset.",
          "act": "Act",
          "chapter": "Chapter",
          "tileset": "Tileset",
          "music": "Music",
          "minibosses": "Minibosses",
          "poolSmall": "Small",
          "poolMedium": "Medium",
          "poolLarge": "Large",
          "mapBadge": "Act {act} · Ch. {chapter}",
          "abilities": "Abilities",
          "classes": "Classes",
          "characters": "Characters",
          "applies": "Applies",
          "check": "Check",
          "success": "Success",
          "failure": "Failure",
          "result": "Result",
          "noRef": "No card in the database",
          "bossLabel": "Bosses",
          "data": "Data",
          "special": "Special",
          "removed": "Removed",
          "bodyPart": "Body Part",
          "properties": "Properties",
          "piecesRequired": "Pieces Required",
          "storyCat": "Story Category",
          "comfort": "Comfort",
          "appeal": "Appeal",
          "stimulation": "Stimulation",
          "evolution": "Evolution",
          "champion": "Champion",
          "setFamily": "Furniture Family",
          "mutationNumber": "Mutation #",
          "health": "Health",
          "ability": "Ability",
          "cost": "Cost",
          "group": "Group",
          "panHint": "Drag to explore the map",
          "viewFull": "View full size",
          "noData": "The game data holds nothing more for this entry.",
          "unique": "Unique",
          "eliteValue": "Elite value"
        },
        "targetMode": {
          "none": "No target",
          "self": "Self",
          "single": "Single target",
          "tile": "Tile",
          "direction": "Direction",
          "line": "Line",
          "cone": "Cone",
          "all": "All",
          "aoe": "Area"
        },
        "stat": {
          "str": "STR",
          "dex": "DEX",
          "con": "CON",
          "int": "INT",
          "spd": "SPD",
          "cha": "CHA",
          "lck": "LCK"
        },
        "reward": {
          "getItemFromPool": "Pool item",
          "getItem": "Item",
          "getParasite": "Parasite",
          "partyHeal": "Party heal",
          "gainFood": "Food",
          "gainGold": "Gold",
          "loseGold": "Lose gold",
          "selfStatusNextFight": "Self status (next fight)",
          "allyAmbushNextFights": "Ally ambush",
          "spawnUnitNextFight": "Spawn unit",
          "gainDisorderFromPool": "Disorder",
          "randomPool": "Random reward",
          "setFlag": "Set flag",
          "heal": "Heal",
          "gainXp": "Experience",
          "addCat": "Add cat",
          "removeCat": "Remove cat",
          "line": {
            "gainCoins": "Gain {n} coins",
            "gainFood": "Gain {n} food",
            "gainXp": "Gain {n} XP",
            "loseCoins": "Lose {n} coins",
            "getItem": "Get an item",
            "getItemFromPool": "Get a random item from",
            "equipItem": "Get and equip",
            "equipItemFromPool": "Get and equip an item from",
            "getParasite": "Get a parasite",
            "getParasiteFromPool": "Get a parasite from",
            "loseItem": "Lose an item",
            "loseAllItems": "Lose all equipped items",
            "damage": "Take {n} damage",
            "selfDamage": "Take {n} self damage",
            "partyDamage": "The party takes {n} damage",
            "kill": "Dies",
            "heal": "Heal {n}",
            "partyHeal": "The party heals {n}",
            "fullHeal": "Fully healed",
            "injury": "Receive an injury",
            "gainDisorder": "Gain a disorder",
            "gainDisorderFromPool": "Gain a disorder from",
            "randomMutation": "Gain a random mutation",
            "mutation": "Gain the mutation",
            "permanentStats": "Permanent stat change",
            "selfStatusNextFight": "Starts the next fight with",
            "partyStatusNextFight": "The party starts the next fight with",
            "gainFamiliar": "Gain a familiar",
            "addCat": "A cat joins",
            "removeCat": "Lose a cat",
            "spawnUnitNextFight": "Spawns in the next fight",
            "allyAmbush": "Allied ambush in the next fights",
            "ambush": "Ambush in the next fights",
            "battle": "Start a battle",
            "shopNow": "A shop opens",
            "eventNow": "Another event happens",
            "eventNowSameCat": "Another event with the same cat",
            "nextEventBonus": "Bonus on the next event",
            "counterUp": "Counter +{n}",
            "counterDown": "Counter −{n}",
            "setToken": "Set a token",
            "setFlag": "Set a flag"
          }
        },
        "pop": {
          "noDesc": "No description in the data.",
          "setFlag": "Set",
          "setPieces": "{n, plural, one {# piece} other {# pieces}}",
          "setFooter": "Equipment set",
          "openCard": "Click to open the card",
          "passiveRanks": "{n} ranks",
          "slots": "Slots",
          "passivesCount": "{n} granted",
          "effect": "Effect"
        },
        "inline": {
          "targetAbbr": "Tgt",
          "rangeAbbr": "Rng",
          "damageAbbr": "Dmg",
          "healAbbr": "Heal",
          "appliesAbbr": "Applies",
          "shieldAbbr": "Shield",
          "durabilityAbbr": "Dur",
          "passivesAbbr": "Passives"
        },
        "classGroup": {
          "attack": "Attack",
          "defense": "Defense",
          "move": "Move",
          "misc": "Misc"
        },
        "filter": {
          "kind": {
            "label": "Type",
            "weapon": "Weapon",
            "head": "Head",
            "face": "Face",
            "neck": "Neck",
            "trinket": "Trinket"
          },
          "rarity": "Rarity",
          "faction": "Faction",
          "type": "Type",
          "cls": {
            "label": "Class",
            "general": "General"
          },
          "subject": "Subject",
          "act": "Act",
          "furniture": {
            "stat": "Primary Stat",
            "special": "Special",
            "comfort": "Comfort",
            "appeal": "Appeal",
            "stimulation": "Stimulation",
            "health": "Health",
            "evolution": "Evolution",
            "removed": "Removed",
            "normal": "Normal"
          },
          "mutations": {
            "bodyPart": "Body Part",
            "body": "Body",
            "ears": "Ears",
            "eyes": "Eyes",
            "eyebrows": "Eyebrows",
            "head": "Head",
            "legs": "Legs",
            "mouth": "Mouth",
            "tail": "Tail",
            "texture": "Texture"
          },
          "statuses": {
            "kind": "Type",
            "weather": "Weather",
            "injuries": "Injuries",
            "elite_buffs": "Elite Buffs"
          }
        },
        "browse": {
          "act": "Act"
        },
        "sort": {
          "name": "A–Z",
          "rarity": "Rarity",
          "kind": "Type",
          "hp": "Health",
          "faction": "Faction",
          "furniture": {
            "comfort": "Comfort",
            "appeal": "Appeal",
            "stimulation": "Stimulation"
          }
        },
        "cat": {
          "items": {
            "label": "Items",
            "singular": "item",
            "desc": "Weapons, head, face, neck, trinkets, consumables, cursed items and parasites."
          },
          "characters": {
            "label": "Bestiary",
            "singular": "character",
            "desc": "Enemies, bosses, mini-bosses, kaiju, allies and familiars."
          },
          "abilities": {
            "label": "Abilities",
            "singular": "ability",
            "desc": "Attacks and spells: cost, range, damage and effects."
          },
          "passives": {
            "label": "Passives",
            "singular": "passive",
            "desc": "Class passives and disorders, with their ranks."
          },
          "keywords": {
            "label": "Statuses",
            "singular": "status",
            "desc": "Status effects and keywords with their rules."
          },
          "events": {
            "label": "Events",
            "singular": "event",
            "desc": "Map events: choices, stat checks and rewards."
          },
          "classes": {
            "label": "Classes",
            "singular": "class",
            "desc": "Classes and advanced classes with their ability pools."
          },
          "maps": {
            "label": "Maps",
            "singular": "map",
            "desc": "Areas by act and chapter: enemies, bosses, items and events."
          },
          "furniture": {
            "label": "Furniture",
            "singular": "furniture",
            "desc": "Room decorations with comfort, appeal, stimulation, health and evolution bonuses."
          },
          "mutations": {
            "label": "Mutations",
            "singular": "mutation",
            "desc": "Body part mutations with stat modifiers and passive effects."
          },
          "sets": {
            "label": "Sets",
            "singular": "set",
            "desc": "Equipment sets with bonuses for wearing multiple pieces."
          },
          "story_cats": {
            "label": "Story Cats",
            "singular": "cat",
            "desc": "Named story cats, bosses and champion variants."
          },
          "statuses": {
            "label": "Statuses",
            "singular": "status",
            "desc": "Weather, injuries and elite buffs with their effects."
          }
        },
        "fiche": {
          "back": "Back to {category}",
          "prev": "Previous entry",
          "next": "Next entry",
          "position": "{n} of {total}",
          "share": "Copy link",
          "shareCopied": "Link copied",
          "favAdd": "Add to favorites",
          "favRemove": "Remove from favorites",
          "trailLabel": "History"
        },
        "common": {
          "moreCount": "{n} more",
          "openLightbox": "View image",
          "closeLightbox": "Close",
          "copy": "Copy",
          "copied": "Copied"
        },
        "data": {
          "rarity": {
            "common": "Common",
            "uncommon": "Uncommon",
            "rare": "Rare",
            "very_rare": "Very Rare",
            "consumable_common": "Consumable",
            "consumable_uncommon": "Consumable+",
            "consumable_rare": "Consumable★",
            "consumable_very_rare": "Consumable★★",
            "quest": "Quest",
            "sidequest": "Side Quest"
          },
          "faction": {
            "enemies": "Enemy",
            "solitary_enemies": "Solitary",
            "allies": "Ally",
            "birds": "Bird",
            "cavemen": "Caveman",
            "mammoths": "Mammoth",
            "sabertooths": "Saber-tooth",
            "kaiju1": "Kaiju",
            "kaiju2": "Kaiju",
            "third_party": "Neutral",
            "none": "Object"
          },
          "statName": {
            "strength": "Strength",
            "dexterity": "Dexterity",
            "constitution": "Constitution",
            "intelligence": "Intelligence",
            "speed": "Speed",
            "charisma": "Charisma",
            "luck": "Luck"
          },
          "statMod": {
            "str": "Strength",
            "dex": "Dexterity",
            "con": "Constitution",
            "int": "Intelligence",
            "spd": "Speed",
            "cha": "Charisma",
            "lck": "Luck",
            "speed": "Speed",
            "shield": "Shield",
            "max_health": "Max Health",
            "durability": "Durability",
            "max_durability": "Max Durability"
          },
          "kind": {
            "weapon": "Weapon",
            "head": "Head",
            "face": "Face",
            "neck": "Neck",
            "trinket": "Trinket",
            "modifier": "Modifier",
            "armor": "Armor"
          },
          "token": {
            "shield": "Shield",
            "divineshield": "Divine Shield",
            "str": "STR",
            "dex": "DEX",
            "con": "CON",
            "int": "INT",
            "spd": "SPD",
            "cha": "CHA",
            "lck": "LCK",
            "health": "Health",
            "mana": "Mana",
            "crit": "Crit",
            "block": "Block",
            "exhaustion": "Exhaustion"
          },
          "statAbbr": {
            "pa": "AP",
            "pm": "MP",
            "pv": "HP"
          }
        },
        "builder": {
          "equipment": "Equipment",
          "export": "Export PNG",
          "exporting": "Exporting...",
          "palette": "Palette",
          "parts": {
            "body": "Body",
            "claws": "Claws",
            "ears": "Ears",
            "eyebrows": "Eyebrows",
            "eyes": "Eyes",
            "head": "Head",
            "legs": "Legs",
            "mouth": "Mouth",
            "tail": "Tail",
            "texture": "Texture",
            "arms": "Arms"
          },
          "partsTitle": "Cat Parts",
          "pose": {
            "eyes": {
              "closed": "Closed",
              "open": "Open"
            },
            "mouth": {
              "normal": "Normal",
              "open": "Open",
              "smile": "Smile"
            }
          },
          "poseEyesLabel": "Eyes",
          "poseMouthLabel": "Mouth",
          "presets": "Story Cats",
          "randomize": "Randomize",
          "title": "Mewgenics Cat Builder",
          "search": "Search parts…",
          "none": "None",
          "noResults": "No parts match",
          "partOf": "{n} of {total}",
          "equipHead": "Head item",
          "equipFace": "Face item",
          "equipNeck": "Neck item",
          "equipWeapon": "Weapon",
          "equipTrinket": "Trinket",
          "equipOnCat": "Worn on the cat",
          "equipSideOnly": "Shown beside the cat",
          "loadingParts": "Loading parts…",
          "paletteStandard": "Standard (genetics)",
          "paletteSpecial": "Story & special",
          "stageBg": "Backdrop",
          "stageBgOption": {
            "night": "Night",
            "paper": "Paper",
            "grid": "Checker"
          },
          "zoomIn": "Zoom in",
          "zoomOut": "Zoom out",
          "zoomFit": "Fit to stage",
          "close": "Close",
          "searchPresets": "Search story cats…",
          "searchItems": "Search items…",
          "presetCustom": "Custom cat",
          "paletteAll": "All {n}",
          "undo": "Undo",
          "reset": "Reset",
          "copyLink": "Copy link",
          "copied": "Copied!",
          "backToCodex": "Back to the codex"
        },
        "event": {
          "calc": {
            "title": "Chance calculator",
            "intro": "Set the cat's stats: each option uses its own, and the lowest/highest-stat modifier is worked out for you.",
            "difficulty": "Difficulty",
            "difficultyNote": "Difficulty is not present in the extracted game data — leave it at 0 unless you want to model a harder check.",
            "lowest": "lowest",
            "highest": "highest",
            "reset": "Reset",
            "success": "Success",
            "rare": "Rare",
            "fixed": "Fixed chance",
            "checkOf": "{stat} check",
            "difficultyShort": "Diff",
            "luckOnly": "Luck only",
            "noRoll": "No roll",
            "tierOnly": "Guaranteed outcome",
            "isLowest": "their lowest stat",
            "isHighest": "their highest stat",
            "decrease": "Decrease {stat}",
            "increase": "Increase {stat}"
          },
          "outcome": {
            "goodRare": "Good rare",
            "goodCommon": "Good common",
            "badCommon": "Bad common",
            "badRare": "Bad rare"
          },
          "tier": {
            "common": "Common",
            "rare": "Rare",
            "weight": "weight"
          },
          "intro": {
            "title": "Intro text",
            "counter": "Counter"
          },
          "req": {
            "title": "Requirements",
            "counterMax": "counter ≤ {n}",
            "counterMin": "counter ≥ {n}",
            "counterRange": "counter {a}–{b}",
            "slotEquipped": "has equipped: {slot}"
          },
          "cost": "Costs {n} {what}"
        },
        "source": {
          "hint": "Hover or tab a source to see what it holds."
        },
        "storyCat": {
          "appearance": "Appearance",
          "voice": "Voice",
          "pitch": "Pitch",
          "openInBuilder": "Open in the builder"
        },
        "manifest": {
          "codex": {
            "name": "Mewgenics Codex",
            "description": "The complete Mewgenics database",
            "category": "Reference"
          },
          "builder": {
            "name": "Cat Builder",
            "description": "Customize your own cat",
            "category": "Tool"
          }
        }
      }
    }
  }
} as const;

export type ToolsMewgenicsLocale = typeof messages;
