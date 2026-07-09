// Demo data for the Claves de Steam chapter — the giveaway/library API isn't
// wired to the v3 design system, so specimens are fed from here. Reproduces the
// Steam appdetails shape; art loads from the Steam CDN by appid. [deferred]
import type { KvKey, KvViaKey, KvPlatform } from "@/components/boffmedia/ui/keys"

type Raw = {
  name: string
  appid: number
  stock: number
  given?: boolean
  via: KvViaKey
  price?: string
  initial?: string
  final?: string
  discount?: number
  developer: string
  publisher?: string
  release: string
  platforms: KvPlatform[]
  genres: string[]
  review: number
  reviewCount: number
  metacritic?: number
  tags: string[]
  desc: string
}

function kvGame(g: Raw): KvKey {
  return {
    name: g.name,
    appid: g.appid,
    stock: g.stock,
    given: !!g.given,
    via: g.via,
    tags: g.tags,
    desc: g.desc,
    info: {
      developer: g.developer,
      publisher: g.publisher || g.developer,
      release: g.release,
      platforms: g.platforms,
      genres: g.genres,
      review: g.review,
      reviewCount: g.reviewCount,
      metacritic: g.metacritic ?? null,
    },
    price: { isFree: false, final: g.final || g.price || "", initial: g.initial || g.price || "", discount: g.discount || 0 },
  }
}

export const KV_KEYS: KvKey[] = [
  kvGame({ name: "Elden Ring", appid: 1245620, stock: 1, via: "sorteo", initial: "59,99 €", final: "41,99 €", discount: 30, developer: "FromSoftware", publisher: "Bandai Namco", release: "24 feb 2022", platforms: ["win"], genres: ["Acción", "RPG"], review: 92, reviewCount: 720100, metacritic: 96, tags: ["Souls-like", "Mundo abierto", "Difícil"], desc: "Un nuevo RPG de acción y fantasía de FromSoftware y George R. R. Martin." }),
  kvGame({ name: "Hades", appid: 1145360, stock: 1, given: true, via: "sorteo", price: "24,99 €", developer: "Supergiant Games", release: "17 sep 2020", platforms: ["win", "mac"], genres: ["Acción", "Indie", "RPG"], review: 98, reviewCount: 358120, metacritic: 93, tags: ["Roguelike", "Acción", "Mitología", "Indie"], desc: "Desafía al dios de los muertos en este roguelike de acción aclamado." }),
  kvGame({ name: "Hollow Knight", appid: 367520, stock: 2, via: "sorteo", price: "14,99 €", developer: "Team Cherry", release: "24 feb 2017", platforms: ["win", "mac", "linux"], genres: ["Acción", "Aventura", "Indie"], review: 97, reviewCount: 612340, metacritic: 90, tags: ["Metroidvania", "Plataformas", "Difícil", "Atmosférico"], desc: "Aventura de acción 2D dibujada a mano en un vasto reino de insectos." }),
  kvGame({ name: "Terraria", appid: 105600, stock: 5, via: "manual", initial: "19,50 €", final: "9,75 €", discount: 50, developer: "Re-Logic", release: "16 may 2011", platforms: ["win", "mac", "linux"], genres: ["Acción", "Aventura", "Indie", "RPG"], review: 97, reviewCount: 1024500, metacritic: 83, tags: ["Sandbox", "Construcción", "Cooperativo"], desc: "Cava, lucha, explora y construye en este sandbox de acción y aventuras." }),
]
