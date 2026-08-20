// AUTO-EXTRACTED from apps/web/locales/{es,en}/tools/mhwilds.json during the
// tools-mhwilds extraction. This package OWNS these keys now — the web catalog
// no longer carries them.
//
// Namespace: `tools.mhwilds.*` (re-rooted from the old `mhwilds.*`, matching
// the convention @boffmedia/tools-minecraft set with `tools.schematicCompat.*`).
// Shape is nested, which is what both hosts want: next-intl in apps/web and
// `useToolT("<namespace>")` in apps/desktop.
//
// The `manifest.*` block is new: the registry needs a title and tagline per
// tool, and the old web catalog had none because the web hub named these tools
// from its own tools-data.ts instead.
//
// Spanish is the source of truth; English is the translation.

export const messages = {
  "es": {
    "tools": {
      "mhwilds": {
        "weapons": {
          "great-sword": "Gran Espada",
          "long-sword": "Espada Larga",
          "sword-shield": "Espada y Escudo",
          "dual-blades": "Espadas Duales",
          "hammer": "Martillo",
          "hunting-horn": "Cornamusa",
          "lance": "Lanza",
          "gunlance": "Lanza Pistola",
          "switch-axe": "Hacha Espada",
          "charge-blade": "Hacha Cargada",
          "insect-glaive": "Glaive Insecto",
          "light-bowgun": "Ballesta Ligera",
          "heavy-bowgun": "Ballesta Pesada",
          "bow": "Arco"
        },
        "weaponType": "Tipo de Arma",
        "app": {
          "source": "API · caché",
          "loading": "Cargando"
        },
        "tree": {
          "titlePrefix": "Árbol de",
          "titleAccent": "armas",
          "tree": "Árbol",
          "list": "Lista",
          "weaponsCount": "{count, plural, one {# arma} other {# armas}}",
          "forgedCount": "{count, plural, one {# forjada} other {# forjadas}}",
          "searchWeapon": "Buscar arma…",
          "allRarity": "Toda rareza",
          "allElement": "Todo elemento",
          "noElement": "Sin elemento",
          "upgradePath": "Ruta de mejora",
          "progress": "Progreso",
          "dragHint": "Arrastra para mover · rueda para zoom",
          "zoomIn": "Acercar",
          "zoomOut": "Alejar",
          "fit": "Ajustar a la vista",
          "final": "Final",
          "soon": "pronto",
          "markForged": "Marcar forjada",
          "forgedState": "Forjada",
          "plan": "Planificar",
          "improvesFrom": "Mejora desde",
          "improvesTo": "Mejora a",
          "craftMaterials": "Materiales de forja",
          "upgradeMaterials": "Materiales de mejora",
          "noResults": "Sin resultados",
          "noResultsLead": "Ninguna arma coincide con los filtros.",
          "loadError": "Error al cargar el árbol de armas",
          "loadErrorDetail": "Error al cargar el árbol de armas. Por favor, inténtalo de nuevo."
        },
        "shell": {
          "ariaLabel": "Herramientas de Monster Hunter Wilds",
          "back": "Volver a MH Wilds",
          "favorites": "Favoritos",
          "removeFav": "Quitar de favoritos",
          "addFav": "Añadir a favoritos",
          "tabs": {
            "monsters": "Bestiario",
            "armas": "Armas",
            "armor": "Armadura",
            "planner": "Planner",
            "caza": "Caza",
            "dano": "Daño"
          }
        },
        "db": {
          "vial": {
            "impact": "Vial de impacto",
            "element": "Vial elemental",
            "power": "Vial de potencia",
            "dragon": "Vial dragón"
          },
          "elderseal": {
            "low": "Bajo",
            "average": "Medio",
            "high": "Alto"
          },
          "weapon": {
            "noSharpness": "Sin afilado (arma a distancia)",
            "sharpnessValue": "{value} de afilado",
            "handicraftStatus": "Artesanía · nivel {level}",
            "handicraftLevel": "Nivel de Artesanía",
            "handicraftAriaLevel": "Artesanía {level}",
            "melodyNotes": "Notas de la melodía"
          },
          "armor": {
            "noRes": "sin res.",
            "groupBonus": "Bonus de grupo",
            "setBonus": "Bonus de conjunto"
          }
        },
        "title": "Monster Hunter Wilds",
        "equipment": "Equipamiento",
        "weapon": "Arma",
        "head": "Casco",
        "chest": "Cota",
        "arms": "Brazales",
        "waist": "Faja",
        "legs": "Grebas",
        "skills": "Habilidades",
        "stats": "Estadísticas",
        "defense": "Defensa",
        "attack": "Ataque",
        "affinity": "Afinidad",
        "element": "Elemento",
        "status": "Estado",
        "totalElement": "Elemento total",
        "def": "Def",
        "rarity": "Rareza",
        "lv": "Nv.",
        "slot": "Ranura",
        "fire": "Fuego",
        "water": "Agua",
        "thunder": "Trueno",
        "ice": "Hielo",
        "dragon": "Draco",
        "sleep": "Sueño",
        "paralysis": "Parálisis",
        "poison": "Veneno",
        "blast": "Nitro",
        "exhaust": "Agotamiento",
        "stamina": "Resistencia",
        "health": "Salud",
        "lowRank": "Rango Bajo",
        "highRank": "Rango Alto",
        "hidden": "Oculto",
        "elderseal": "Sello Anciano",
        "low": "Bajo",
        "average": "Promedio",
        "high": "Alto",
        "defenseBonus": "Bonus de defensa",
        "charm": "Amuleto",
        "secondaryWeapon": "Arma Secundaria",
        "emptySlot": "Ranura vacía",
        "header": {
          "title": {
            "prefix": "Herramientas de",
            "highlight": "Monster Hunter Wilds"
          },
          "subtitle": "Optimiza tu caza con nuestras herramientas especializadas"
        },
        "tools": {
          "buildPlanner": {
            "title": "Planificador de Builds",
            "description": "Construye y optimiza sets completos: armadura, decoraciones, talismán y arma. Calcula habilidades, resistencias y afilado en tiempo real.",
            "features": {
              "optimizer": "Optimizador de builds",
              "calculator": "Calculadora de daño",
              "comparison": "Comparador de sets"
            }
          },
          "weaponTrees": {
            "title": "Árboles de Armas",
            "description": "Árboles de progresión y estadísticas de todas las armas",
            "features": {
              "trees": "Árboles de armas",
              "comparison": "Comparador",
              "stats": "Estadísticas detalladas"
            }
          },
          "bestiary": {
            "title": "Bestiario",
            "description": "Información detallada sobre debilidades y recompensas",
            "features": {
              "weaknesses": "Tabla de debilidades",
              "materials": "Materiales y drops",
              "locations": "Ubicaciones"
            }
          },
          "armor": {
            "title": "Sets de Armadura",
            "description": "Base de datos completa de armaduras y habilidades",
            "features": {
              "sets": "Sets completos",
              "skills": "Habilidades",
              "defense": "Estadísticas de defensa"
            }
          },
          "materials": {
            "title": "Rastreador de Materiales",
            "description": "Rastrea y calcula los materiales necesarios para crafting",
            "features": {
              "tracker": "Lista de seguimiento",
              "calculator": "Calculadora de crafting",
              "locations": "Dónde conseguir"
            }
          }
        },
        "externalLinks": {
          "title": "Enlaces Útiles",
          "officialWebsite": "Sitio Oficial",
          "redditCommunity": "Reddit Community",
          "wiki": "Monster Hunter Wiki",
          "videos": "Guías en YouTube"
        },
        "accessButton": "Acceder a {tool}",
        "explore": "Explorar",
        "ui": {
          "hidden": "(oculto)",
          "slotLevel": "Ranura nivel {size}",
          "emptySlot": "Nivel {size} — vacía",
          "removeJewel": "Quitar joya",
          "markObtained": "Marcar como obtenido",
          "atk": "ATQ",
          "affinity": "afin.",
          "rarity": "Rareza",
          "def": "DEF",
          "pieces": "pzs",
          "requires": "Requiere",
          "piecesN": "piezas",
          "search": "Buscar…",
          "clear": "Limpiar",
          "close": "Cerrar"
        },
        "bestiary": {
          "kicker": "Monster Hunter Wilds",
          "title": "Bestiario",
          "count": "{count} monstruos",
          "errorTitle": "No se pudo cargar el bestiario",
          "searchPlaceholder": "Buscar monstruo…",
          "sortName": "Ordenar: nombre",
          "sortHealth": "Ordenar: salud",
          "filterKind": "Clase",
          "all": "Todos",
          "kindLarge": "Grande",
          "kindSmall": "Pequeño",
          "filterWeakness": "Debilidad elemental",
          "results": "{count} resultados",
          "noResults": "Sin resultados.",
          "overview": "Resumen",
          "baseHealth": "Salud base",
          "baseSize": "Tamaño base",
          "crownSilver": "Corona plata",
          "crownGold": "Corona oro",
          "elements": "Elementos",
          "weaknesses": "Debilidades elementales",
          "statusVulns": "Vulnerabilidad a estados",
          "resistances": "Resistencias",
          "ailments": "Estados que inflige",
          "locations": "Ubicaciones",
          "noLocations": "Sin ubicaciones conocidas",
          "drops": "Recompensas",
          "noDrops": "Sin recompensas registradas",
          "errorLoadFailed": "Error al cargar el bestiario. Por favor, inténtalo de nuevo.",
          "flagship": "Insignia",
          "flagshipTitle": "Monstruo insignia",
          "dropChancePct": "{chance}% de probabilidad",
          "investigation": "Investigación",
          "threat": {
            "low": {
              "label": "Menor",
              "desc": "Presa o estorbo. Poco riesgo."
            },
            "med": {
              "label": "Estándar",
              "desc": "Gran monstruo de cacería habitual."
            },
            "high": {
              "label": "Peligroso",
              "desc": "Alta amenaza. Ataques que noquean."
            },
            "apex": {
              "label": "Ápex",
              "desc": "Depredador dominante del bioma."
            },
            "elder": {
              "label": "Anciano",
              "desc": "Dragón anciano. Nivel de catástrofe."
            }
          },
          "dropCarve": "Corte",
          "dropReward": "Recompensa",
          "dropBreak": "Rotura",
          "dropTrack": "Rastro"
        },
        "build_planner": {
          "compare": {
            "mode_edit": "Editar",
            "mode_compare": "Comparar",
            "title": "Comparar builds",
            "lead": "Tu build actual frente a hasta 2 guardadas. Se resalta la mejor de cada fila.",
            "back": "Volver a editar",
            "current": "actual",
            "pick": "Elige builds guardadas ({count}/2)",
            "res_total": "Res. total",
            "wasted": "Desperdiciado",
            "emptyLead": "Guarda al menos una build para enfrentarla con la actual.",
            "emptyTitle": "Nada que comparar",
            "topSkills": "Top habilidades"
          },
          "target": {
            "title": "Monstruo objetivo",
            "change": "Cambiar",
            "clear": "Quitar objetivo",
            "recommended": "Armas recomendadas",
            "no_elem_weak": "Sin debilidad elemental",
            "no_suggestions": "Ningún arma elemental aprovecha sus debilidades — prioriza daño físico y afilado alto.",
            "equip": "Equipar",
            "bestiary": "Ver en el bestiario",
            "ctaLead": "Sugerencias de armas según sus debilidades",
            "ctaTitle": "Elegir monstruo objetivo",
            "drawerEmpty": "Ningún monstruo coincide con la búsqueda.",
            "drawerTitle": "Elegir monstruo objetivo",
            "weakTo": "Débil a"
          },
          "skillsearch": {
            "title": "Buscar por habilidad",
            "sub": "Qué equipo otorga cada habilidad",
            "placeholder": "Buscar habilidad…",
            "all": "Todas las habilidades",
            "empty": "Ninguna habilidad coincide con la búsqueda.",
            "kind_armor": "Armadura",
            "kind_charm": "Talismán",
            "kind_decoration": "Joya",
            "no_slot": "Sin ranura libre para esta joya — equipa armadura con ranuras.",
            "ctaLead": "Encuentra qué pieza, joya o talismán la otorga",
            "ctaTitle": "Buscar por habilidad",
            "sourceCount": "{count, plural, one {# fuente} other {# fuentes}}"
          },
          "forge": {
            "owned": "{owned}/{total} obtenidos",
            "full_path": "Ruta completa · {steps} pasos",
            "loading_path": "Calculando ruta de mejora…"
          },
          "swap": "Cambiar",
          "import_export": "Importar / exportar",
          "import_export_sub": "Pega un código o comparte un enlace",
          "base_defense": "Defensa base",
          "no_weapon": "Sin arma equipada",
          "no_weapon_lead": "Elige un arma para ver ataque, afinidad, elemento y afilado.",
          "cat_attack": "Ataque",
          "cat_utility": "Utilidad",
          "forge_materials": "Materiales de forja",
          "all": "Todas",
          "no_results": "Sin resultados",
          "deco_level": "Joya · ranura nivel {size}",
          "save_current": "Guardar la actual",
          "export": "Exportar",
          "copy_json": "Copiar JSON",
          "import_placeholder": "Pega aquí un build JSON…",
          "title": "Planificador de Builds",
          "subtitle": "Crea y optimiza tus builds para Monster Hunter Wilds",
          "build_name_placeholder": "Nombre de la Build",
          "save": "Guardar",
          "share": "Compartir",
          "reset": "Reiniciar",
          "saved_local": "Build guardada en almacenamiento local",
          "error_saving": "Error al guardar la build",
          "copied_clipboard": "Build copiada al portapapeles",
          "error_copying": "Error al copiar la build",
          "link_copied": "Link de compartir copiado al portapapeles",
          "error_link": "Error al generar el link para compartir",
          "exported_json": "Build exportada como archivo JSON",
          "error_exporting": "Error al exportar la build",
          "image_placeholder": "Exportar imagen no disponible",
          "share_link": "Enlace para compartir",
          "share_options": "Opciones para compartir",
          "export_json": "Generar JSON",
          "generate_image": "Generar Imagen",
          "back": "Volver",
          "details": "Detalles de la build",
          "current_build": "Equipamiento actual",
          "active_decorations": "Decoraciones activas",
          "decorations_equipped": "{count, plural, =0 {No hay decoraciones equipadas} =1 {1 decoración equipada} other {{count} decoraciones equipadas}}",
          "no_decorations": "No hay adornos equipados",
          "add_decorations": "Haz click en una ranura de adorno para asignar una joya",
          "error_invalid_file_format_full": "Formato de archivo inválido. Asegúrate de que sea un build JSON válido.",
          "error_invalid_file_format": "Formato de archivo inválido",
          "error_reading_file": "Error leyendo archivo",
          "import_build": "Importar build desde archivo",
          "remove": "Quitar",
          "no_equipment": "Sin {name}",
          "no_description": "Descripción no disponible",
          "slots": "Ranuras",
          "currently_equipped": "Equipado actualmente",
          "select_decoration": "Seleccionar adorno",
          "search": "Buscar...",
          "assigned_to": "Asignado a",
          "slot_size": "Nivel de ranura:",
          "loading": "Cargando {item}...",
          "decorations": "decoraciones",
          "retry": "Reintentar",
          "no_decorations_found": "No se encontró ninguna decoración con los filtros actuales",
          "no_equipment_found": "No se encontró ningún equipamiento con los filtros actuales",
          "filters": "Filtros",
          "clear_filters": "Limpiar filtros",
          "sort": "Ordenar",
          "active_filters": "Filtros activos",
          "set": "Conjunto",
          "select": "Seleccionar",
          "close": "Cerrar",
          "active_skills": "Habilidades activas",
          "overallocated_skills": "Habilidades sobreasignadas",
          "no_active_skills": "No hay habilidades activas",
          "no_active_skills_description": "Añade armas y armaduras con habilidades",
          "skill_description_not_found": "Descripción no encontrada",
          "wasted_points": "{count, plural, =1 {1 punto sin efecto} other {{count} puntos sin efecto}}",
          "current_level": "Nivel actual",
          "elemental_resistances": "Resistencias Elementales",
          "sharpness": "Afilado",
          "description": "Crea y optimiza tus builds de equipo y armaduras",
          "swap_weapons": "Intercambiar armas",
          "build_count": "{count, plural, =0 {0 builds guardadas} one {# build guardada} other {# builds guardadas}}",
          "clear_search": "Limpiar Búsqueda",
          "no_builds_found": "No se encontraron builds con tu búsqueda",
          "no_saved_builds": "No tienes builds guardadas",
          "load": "Cargar",
          "cancel": "Cancelar",
          "confirm": "Confirmar",
          "search_builds": "Buscar builds...",
          "saved_builds_description": "Gestiona tus builds guardadas localmente",
          "saved_builds": "Builds guardadas",
          "build_loaded": "Build \"{name}\" cargada",
          "open": "Abrir",
          "hidden": "(O)",
          "select_charm": "Elegir amuleto",
          "charms": "Amuletos",
          "no_charms_found": "No se han encontrado amuletos",
          "skill_count": "{count, plural, =1 {# habilidad} other {# habilidades}}",
          "tools": {
            "weapon_tree": "Árbol de armas"
          },
          "compatibleCount": "{count, plural, one {# compatible} other {# compatibles}}",
          "optionsCount": "{count, plural, one {# opción} other {# opciones}}",
          "piecesCount": "{filled}/{total} piezas",
          "defaultBuildName": "Mi Build",
          "errors": {
            "loadDecorations": "Error al cargar las decoraciones. Por favor, inténtalo de nuevo.",
            "loadWeapons": "Error al cargar las armas. Por favor, inténtalo de nuevo.",
            "loadArmor": "Error al cargar las armaduras. Por favor, inténtalo de nuevo.",
            "loadSkills": "Error al cargar las habilidades. Por favor, inténtalo de nuevo.",
            "loadCharms": "Error al cargar los amuletos. Por favor, inténtalo de nuevo."
          }
        },
        "manifest": {
          "planner": {
            "name": "Planificador de Builds",
            "tagline": "Monster Hunter Wilds"
          },
          "tree": {
            "name": "Árbol de Armas",
            "tagline": "Monster Hunter Wilds"
          },
          "bestiary": {
            "name": "Bestiario",
            "tagline": "Monster Hunter Wilds"
          }
        }
      }
    }
  },
  "en": {
    "tools": {
      "mhwilds": {
        "weapons": {
          "great-sword": "Great Sword",
          "long-sword": "Long Sword",
          "sword-shield": "Sword and Shield",
          "dual-blades": "Dual Blades",
          "hammer": "Hammer",
          "hunting-horn": "Hunting Horn",
          "lance": "Lance",
          "gunlance": "Gunlance",
          "switch-axe": "Switch Axe",
          "charge-blade": "Charge Blade",
          "insect-glaive": "Insect Glaive",
          "light-bowgun": "Light Bowgun",
          "heavy-bowgun": "Heavy Bowgun",
          "bow": "Bow"
        },
        "weaponType": "Weapon Type",
        "app": {
          "source": "API · cached",
          "loading": "Loading"
        },
        "tree": {
          "titlePrefix": "Weapon",
          "titleAccent": "tree",
          "tree": "Tree",
          "list": "List",
          "weaponsCount": "{count, plural, one {# weapon} other {# weapons}}",
          "forgedCount": "{count, plural, one {# forged} other {# forged}}",
          "searchWeapon": "Search weapon…",
          "allRarity": "Any rarity",
          "allElement": "Any element",
          "noElement": "No element",
          "upgradePath": "Upgrade path",
          "progress": "Progress",
          "dragHint": "Drag to pan · scroll to zoom",
          "zoomIn": "Zoom in",
          "zoomOut": "Zoom out",
          "fit": "Fit to view",
          "final": "Final",
          "soon": "soon",
          "markForged": "Mark forged",
          "forgedState": "Forged",
          "plan": "Plan",
          "improvesFrom": "Upgrades from",
          "improvesTo": "Upgrades to",
          "craftMaterials": "Forge materials",
          "upgradeMaterials": "Upgrade materials",
          "noResults": "No results",
          "noResultsLead": "No weapon matches the filters.",
          "loadError": "Error loading the weapon tree",
          "loadErrorDetail": "Error loading the weapon tree. Please try again."
        },
        "shell": {
          "ariaLabel": "Monster Hunter Wilds Tools",
          "back": "Back to MH Wilds",
          "favorites": "Favorites",
          "removeFav": "Remove from favorites",
          "addFav": "Add to favorites",
          "tabs": {
            "monsters": "Bestiary",
            "armas": "Weapons",
            "armor": "Armor",
            "planner": "Planner",
            "caza": "Hunt",
            "dano": "Damage"
          }
        },
        "db": {
          "vial": {
            "impact": "Impact Phial",
            "element": "Elemental Phial",
            "power": "Power Phial",
            "dragon": "Dragon Phial"
          },
          "elderseal": {
            "low": "Low",
            "average": "Average",
            "high": "High"
          },
          "weapon": {
            "noSharpness": "No sharpness (ranged weapon)",
            "sharpnessValue": "{value} sharpness",
            "handicraftStatus": "Handicraft · level {level}",
            "handicraftLevel": "Handicraft Level",
            "handicraftAriaLevel": "Handicraft {level}",
            "melodyNotes": "Melody notes"
          },
          "armor": {
            "noRes": "no res.",
            "groupBonus": "Group bonus",
            "setBonus": "Set bonus"
          }
        },
        "title": "Monster Hunter Wilds",
        "equipment": "Equipment",
        "weapon": "Weapon",
        "head": "Head",
        "chest": "Chest",
        "arms": "Arms",
        "waist": "Waist",
        "legs": "Legs",
        "skills": "Skills",
        "stats": "Stats",
        "defense": "Defense",
        "attack": "Attack",
        "affinity": "Affinity",
        "element": "Element",
        "status": "Status",
        "totalElement": "Total element",
        "def": "Def",
        "rarity": "Rarity",
        "lv": "Lv.",
        "slot": "Slot",
        "fire": "Fire",
        "water": "Water",
        "thunder": "Thunder",
        "ice": "Ice",
        "dragon": "Dragon",
        "sleep": "Sleep",
        "paralysis": "Paralysis",
        "poison": "Poison",
        "blast": "Blast",
        "exhaust": "Exhaust",
        "stamina": "Stamina",
        "health": "Health",
        "lowRank": "Low Rank",
        "highRank": "High Rank",
        "hidden": "Hidden",
        "elderseal": "Elderseal",
        "low": "Low",
        "average": "Average",
        "high": "High",
        "defenseBonus": "Defense bonus",
        "charm": "Charm",
        "secondaryWeapon": "Secondary Weapon",
        "emptySlot": "Empty slot",
        "header": {
          "title": {
            "prefix": "Tools for",
            "highlight": "Monster Hunter Wilds"
          },
          "subtitle": "Optimize your hunt with our specialized tools"
        },
        "tools": {
          "buildPlanner": {
            "title": "Build Planner",
            "description": "Create optimal builds by comparing armor, decorations and skills",
            "features": {
              "optimizer": "Build optimizer",
              "calculator": "Damage calculator",
              "comparison": "Set comparator"
            }
          },
          "weaponTrees": {
            "title": "Weapon Trees",
            "description": "Progression trees and statistics for all weapons",
            "features": {
              "trees": "Weapon trees",
              "comparison": "Comparator",
              "stats": "Detailed statistics"
            }
          },
          "bestiary": {
            "title": "Bestiary",
            "description": "Detailed information about weaknesses and rewards",
            "features": {
              "weaknesses": "Weakness chart",
              "materials": "Materials and drops",
              "locations": "Locations"
            }
          },
          "armor": {
            "title": "Armor Sets",
            "description": "Complete database of armor and skills",
            "features": {
              "sets": "Complete sets",
              "skills": "Skills",
              "defense": "Defense statistics"
            }
          },
          "materials": {
            "title": "Material Tracker",
            "description": "Track and calculate materials needed for crafting",
            "features": {
              "tracker": "Tracking list",
              "calculator": "Crafting calculator",
              "locations": "Where to get"
            }
          }
        },
        "externalLinks": {
          "title": "Useful Links",
          "officialWebsite": "Official Website",
          "redditCommunity": "Reddit Community",
          "wiki": "Monster Hunter Wiki",
          "videos": "YouTube Guides"
        },
        "accessButton": "Access {tool}",
        "explore": "Explore",
        "ui": {
          "hidden": "(hidden)",
          "slotLevel": "Slot level {size}",
          "emptySlot": "Level {size} — empty",
          "removeJewel": "Remove jewel",
          "markObtained": "Mark as obtained",
          "atk": "ATK",
          "affinity": "affinity",
          "rarity": "Rarity",
          "def": "DEF",
          "pieces": "pcs",
          "requires": "Requires",
          "piecesN": "pieces",
          "search": "Search…",
          "clear": "Clear",
          "close": "Close"
        },
        "bestiary": {
          "kicker": "Monster Hunter Wilds",
          "title": "Bestiary",
          "count": "{count} monsters",
          "errorTitle": "Failed to load the bestiary",
          "searchPlaceholder": "Search monster…",
          "sortName": "Sort: name",
          "sortHealth": "Sort: health",
          "filterKind": "Class",
          "all": "All",
          "kindLarge": "Large",
          "kindSmall": "Small",
          "filterWeakness": "Elemental weakness",
          "results": "{count} results",
          "noResults": "No results.",
          "overview": "Overview",
          "baseHealth": "Base health",
          "baseSize": "Base size",
          "crownSilver": "Silver crown",
          "crownGold": "Gold crown",
          "elements": "Elements",
          "weaknesses": "Elemental weaknesses",
          "statusVulns": "Status vulnerability",
          "resistances": "Resistances",
          "ailments": "Ailments inflicted",
          "locations": "Locations",
          "noLocations": "No known locations",
          "drops": "Rewards",
          "noDrops": "No rewards recorded",
          "errorLoadFailed": "Failed to load the bestiary. Please try again.",
          "flagship": "Flagship",
          "flagshipTitle": "Flagship monster",
          "dropChancePct": "{chance}% chance",
          "investigation": "Investigation",
          "threat": {
            "low": {
              "label": "Minor",
              "desc": "Prey or nuisance. Low risk."
            },
            "med": {
              "label": "Standard",
              "desc": "Common large-monster hunt."
            },
            "high": {
              "label": "Dangerous",
              "desc": "High threat. Knock-out attacks."
            },
            "apex": {
              "label": "Apex",
              "desc": "Dominant predator of the biome."
            },
            "elder": {
              "label": "Elder",
              "desc": "Elder dragon. Catastrophe-level."
            }
          },
          "dropCarve": "Carve",
          "dropReward": "Reward",
          "dropBreak": "Break",
          "dropTrack": "Track"
        },
        "build_planner": {
          "compare": {
            "mode_edit": "Edit",
            "mode_compare": "Compare",
            "title": "Compare builds",
            "lead": "Your current build against up to 2 saved ones. The best in each row is highlighted.",
            "back": "Back to editing",
            "current": "current",
            "pick": "Pick saved builds ({count}/2)",
            "res_total": "Total res.",
            "wasted": "Wasted",
            "emptyLead": "Save at least one build to pit it against the current one.",
            "emptyTitle": "Nothing to compare",
            "topSkills": "Top skills"
          },
          "target": {
            "title": "Target monster",
            "change": "Change",
            "clear": "Clear target",
            "recommended": "Recommended weapons",
            "no_elem_weak": "No elemental weakness",
            "no_suggestions": "No elemental weapon exploits its weaknesses — prioritise raw damage and high sharpness.",
            "equip": "Equip",
            "bestiary": "View in bestiary",
            "ctaLead": "Weapon suggestions based on its weaknesses",
            "ctaTitle": "Choose target monster",
            "drawerEmpty": "No monster matches your search.",
            "drawerTitle": "Choose target monster",
            "weakTo": "Weak to"
          },
          "skillsearch": {
            "title": "Search by skill",
            "sub": "What equipment grants each skill",
            "placeholder": "Search skill…",
            "all": "All skills",
            "empty": "No skill matches your search.",
            "kind_armor": "Armor",
            "kind_charm": "Charm",
            "kind_decoration": "Jewel",
            "no_slot": "No free slot for this jewel — equip armor with slots.",
            "ctaLead": "Find which piece, jewel or charm grants it",
            "ctaTitle": "Search by skill",
            "sourceCount": "{count, plural, one {# source} other {# sources}}"
          },
          "forge": {
            "owned": "{owned}/{total} owned",
            "full_path": "Full path · {steps} steps",
            "loading_path": "Computing upgrade path…"
          },
          "swap": "Swap",
          "import_export": "Import / export",
          "import_export_sub": "Paste a code or share a link",
          "base_defense": "Base defense",
          "no_weapon": "No weapon equipped",
          "no_weapon_lead": "Pick a weapon to see attack, affinity, element and sharpness.",
          "cat_attack": "Attack",
          "cat_utility": "Utility",
          "forge_materials": "Forge materials",
          "all": "All",
          "no_results": "No results",
          "deco_level": "Jewel · level {size} slot",
          "save_current": "Save current",
          "export": "Export",
          "copy_json": "Copy JSON",
          "import_placeholder": "Paste a build JSON here…",
          "title": "Build Planner",
          "subtitle": "Create and optimize your builds for Monster Hunter Wilds",
          "build_name_placeholder": "Build Name",
          "save": "Save",
          "share": "Share",
          "reset": "Reset",
          "saved_local": "Build saved in local storage",
          "error_saving": "Error saving build",
          "copied_clipboard": "Build copied to clipboard",
          "error_copying": "Error copying build",
          "link_copied": "Share link copied to clipboard",
          "error_link": "Error generating share link",
          "exported_json": "Build exported as JSON file",
          "error_exporting": "Error exporting build",
          "image_placeholder": "Export image not available",
          "share_link": "Share link",
          "share_options": "Share options",
          "export_json": "Generate JSON",
          "generate_image": "Generate Image",
          "back": "Back",
          "details": "Build details",
          "current_build": "Current equipment",
          "active_decorations": "Active decorations",
          "decorations_equipped": "{count, plural, =0 {No decorations equipped} =1 {1 decoration equipped} other {{count} decorations equipped}}",
          "no_decorations": "No decorations equipped",
          "add_decorations": "Click on a decoration slot to assign a jewel",
          "error_invalid_file_format_full": "Invalid file format. Make sure it's a valid build JSON.",
          "error_invalid_file_format": "Invalid file format",
          "error_reading_file": "Error reading file",
          "import_build": "Import build from file",
          "remove": "Remove",
          "no_equipment": "No {name}",
          "no_description": "Description not available",
          "slots": "Slots",
          "currently_equipped": "Currently equipped",
          "select_decoration": "Select decoration",
          "search": "Search...",
          "assigned_to": "Assigned to",
          "slot_size": "Slot level:",
          "loading": "Loading {item}...",
          "decorations": "decorations",
          "retry": "Retry",
          "no_decorations_found": "No decorations found with current filters",
          "no_equipment_found": "No equipment found with current filters",
          "filters": "Filters",
          "clear_filters": "Clear filters",
          "sort": "Sort",
          "active_filters": "Active filters",
          "set": "Set",
          "select": "Select",
          "close": "Close",
          "active_skills": "Active skills",
          "overallocated_skills": "Overallocated skills",
          "no_active_skills": "No active skills",
          "no_active_skills_description": "Add weapons and armor with skills",
          "skill_description_not_found": "Description not found",
          "wasted_points": "{count, plural, =1 {1 point wasted} other {{count} points wasted}}",
          "current_level": "Current level",
          "elemental_resistances": "Elemental Resistances",
          "sharpness": "Sharpness",
          "description": "Create and optimize your equipment and armor builds",
          "swap_weapons": "Swap weapons",
          "build_count": "{count, plural, =0 {0 saved builds} one {# saved build} other {# saved builds}}",
          "clear_search": "Clear Search",
          "no_builds_found": "No builds found with your search",
          "no_saved_builds": "You don't have any saved builds",
          "load": "Load",
          "cancel": "Cancel",
          "confirm": "Confirm",
          "search_builds": "Search builds...",
          "saved_builds_description": "Manage your locally saved builds",
          "saved_builds": "Saved builds",
          "build_loaded": "Build \"{name}\" loaded",
          "open": "Open",
          "hidden": "(H)",
          "select_charm": "Select charm",
          "charms": "Charms",
          "no_charms_found": "No charms found",
          "skill_count": "{count, plural, =1 {# skill} other {# skills}}",
          "tools": {
            "weapon_tree": "Weapon Tree"
          },
          "compatibleCount": "{count, plural, one {# compatible} other {# compatible}}",
          "optionsCount": "{count, plural, one {# option} other {# options}}",
          "piecesCount": "{filled}/{total} pieces",
          "defaultBuildName": "My Build",
          "errors": {
            "loadDecorations": "Error loading decorations. Please try again.",
            "loadWeapons": "Error loading weapons. Please try again.",
            "loadArmor": "Error loading armor. Please try again.",
            "loadSkills": "Error loading skills. Please try again.",
            "loadCharms": "Error loading charms. Please try again."
          }
        },
        "manifest": {
          "planner": {
            "name": "Build Planner",
            "tagline": "Monster Hunter Wilds"
          },
          "tree": {
            "name": "Weapon Tree",
            "tagline": "Monster Hunter Wilds"
          },
          "bestiary": {
            "name": "Bestiary",
            "tagline": "Monster Hunter Wilds"
          }
        }
      }
    }
  }
} as const;

export type ToolsMhwildsLocale = keyof typeof messages;
