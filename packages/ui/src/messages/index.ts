// AUTO-EXTRACTED from apps/web/locales/{es,en}/common.json.
// This package OWNS these keys — the web catalog no longer carries them.
//
// The rule the tool packages already follow, one layer down: whichever package
// RENDERS a string owns it. The giveaways kit lives here now and is rendered by
// two hosts, so leaving its copy in apps/web would have meant the launcher
// keeping a second hand-maintained translation of the same screen.
//
// One file, and one plain object literal, deliberately: `scripts/check-i18n.mjs`
// reads this catalog by slicing the text between the assignment and `as const`
// and running it through JSON.parse, so it can verify key parity without
// executing TypeScript. A catalog assembled from parts at runtime type-checks
// and then makes that check crash.
//
// Spanish is the source of truth; English is the translation.

export const messages = {
  "es": {
    "common": {
      "giveaways": {
        "winner": "{count, plural, one {ganador} other {ganadores}}",
        "yourTickets": "Tus tickets",
        "estimatedProbability": "Probabilidad estimada",
        "weightedByTickets": "ponderada por tickets",
        "youAreIn": "Participas",
        "participateNow": "Participar ahora",
        "viewWinner": "Ver ganador",
        "viewDetails": "Ver detalles",
        "viewGiveaway": "Ver sorteo",
        "youreInDotView": "Ya participas · ver",
        "opensIn": "Abre",
        "closesIn": "Cierra",
        "drawingNow": "Sorteando ahora…",
        "prizeValue": "valor del premio",
        "featuredGiveaway": "Sorteo destacado",
        "participants": "participantes",
        "by": "Por",
        "approxValue": "valor aprox.",
        "requirementMet": "Cumplido",
        "requirementPending": "Pendiente",
        "stepDone": "Hecho",
        "verifiableLabel": "Sorteo verificable · semilla pública",
        "recomputeNote": "El resultado puede recomputarse por cualquiera.",
        "reelExplainer": "Cada bloque = un participante; su anchura es proporcional a sus tickets. Más tickets, más espacio en la tira.",
        "wonWith": "Ganó con {tickets, plural, one {# ticket} other {# tickets}} · {odds}% de probabilidad",
        "watchDraw": "Ver cómo se sorteó",
        "share": "Compartir",
        "reel": {
          "live": "En directo",
          "landedTag": "Ganador",
          "spinning": "¡Sorteando!",
          "spinningOf": "Sorteando ganador {i} de {n}",
          "landed": "¡{name}!",
          "winnerOf": "Ganador {i}/{n}",
          "skip": "Saltar animación",
          "soundOn": "Silenciar sonido",
          "soundOff": "Activar sonido",
          "labelsHidden": "{n} participantes · etiquetas ocultas",
          "othersN": "+{n} más"
        },
        "prize": {
          "key": {
            "label": "Clave de juego"
          },
          "item": {
            "label": "Objeto in-game"
          },
          "merch": {
            "label": "Merchandising"
          },
          "nitro": {
            "label": "Suscripción"
          },
          "pass": {
            "label": "Pase de evento"
          },
          "cash": {
            "label": "Saldo / tarjeta"
          }
        },
        "source": {
          "comunidad": {
            "label": "Comunidad",
            "desc": "Los miembros se apuntan cumpliendo los requisitos."
          },
          "twitch": {
            "label": "Viewers de Twitch",
            "desc": "Lista importada del chat en directo."
          },
          "manual": {
            "label": "Lista manual",
            "desc": "Participantes cargados a mano o por CSV."
          }
        },
        "status": {
          "announced": {
            "label": "Ganador anunciado"
          },
          "upcoming": {
            "label": "Próximo"
          },
          "ended": {
            "label": "Sorteando"
          },
          "active": {
            "label": "En curso"
          }
        },
        "countdown": {
          "days": "días",
          "hours": "hrs",
          "minutes": "min"
        }
      }
    }
  },
  "en": {
    "common": {
      "giveaways": {
        "winner": "{count, plural, one {winner} other {winners}}",
        "yourTickets": "Your tickets",
        "estimatedProbability": "Estimated probability",
        "weightedByTickets": "weighted by tickets",
        "youAreIn": "You're in",
        "participateNow": "Participate now",
        "viewWinner": "View winner",
        "viewDetails": "View details",
        "viewGiveaway": "View giveaway",
        "youreInDotView": "You're in · view",
        "opensIn": "Opens",
        "closesIn": "Closes",
        "drawingNow": "Drawing now…",
        "prizeValue": "prize value",
        "featuredGiveaway": "Featured giveaway",
        "participants": "participants",
        "by": "By",
        "approxValue": "approx. value",
        "requirementMet": "Met",
        "requirementPending": "Pending",
        "stepDone": "Done",
        "verifiableLabel": "Verifiable giveaway · public seed",
        "recomputeNote": "The result can be recomputed by anyone.",
        "reelExplainer": "Each block is a participant; its width is proportional to their tickets. More tickets, more room on the strip.",
        "wonWith": "Won with {tickets, plural, one {# ticket} other {# tickets}} · {odds}% odds",
        "watchDraw": "Watch how it was drawn",
        "share": "Share",
        "reel": {
          "live": "Live",
          "landedTag": "Winner",
          "spinning": "Drawing!",
          "spinningOf": "Drawing winner {i} of {n}",
          "landed": "{name}!",
          "winnerOf": "Winner {i}/{n}",
          "skip": "Skip animation",
          "soundOn": "Mute sound",
          "soundOff": "Unmute sound",
          "labelsHidden": "{n} participants · labels hidden",
          "othersN": "+{n} more"
        },
        "prize": {
          "key": {
            "label": "Game key"
          },
          "item": {
            "label": "In-game item"
          },
          "merch": {
            "label": "Merchandise"
          },
          "nitro": {
            "label": "Subscription"
          },
          "pass": {
            "label": "Event pass"
          },
          "cash": {
            "label": "Balance / card"
          }
        },
        "source": {
          "comunidad": {
            "label": "Community",
            "desc": "Members sign up by meeting the requirements."
          },
          "twitch": {
            "label": "Twitch viewers",
            "desc": "List imported from the live chat."
          },
          "manual": {
            "label": "Manual list",
            "desc": "Participants loaded by hand or via CSV."
          }
        },
        "status": {
          "announced": {
            "label": "Winner announced"
          },
          "upcoming": {
            "label": "Upcoming"
          },
          "ended": {
            "label": "Drawing"
          },
          "active": {
            "label": "Ongoing"
          }
        },
        "countdown": {
          "days": "days",
          "hours": "hrs",
          "minutes": "min"
        }
      }
    }
  }
} as const;

export type UiMessagesLocale = typeof messages;
