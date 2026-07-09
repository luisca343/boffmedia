// Demo data for the Comunidad chapter — the blog/forum APIs aren't wired to the
// v3 design system yet, so every specimen is fed from here. Mirrors the seed in
// comunidad-data.js (authors, posts, forum). [deferred]
import {
  CM_NOW,
  type BlogPostLike,
  type CmAuthor,
  type ForumCategoryLike,
  type ForumMember,
  type ForumStatsData,
  type ForumThreadLike,
} from "@/components/boffmedia/ui/community"

// Relative-date helper anchored to CM_NOW so timestamps read naturally.
function ago(spec: string): string {
  const d = spec.match(/(\d+)d/)
  const h = spec.match(/(\d+)h/)
  const days = d ? parseInt(d[1], 10) : 0
  const hours = h ? parseInt(h[1], 10) : 0
  return new Date(CM_NOW.getTime() - days * 86400000 - hours * 3600000).toISOString()
}

// ── Authors ──────────────────────────────────────────────────────────────────
const A: Record<string, CmAuthor> = {
  alex: { id: 1, name: "Alex Boffmedia", handle: "alex", avatar: "A", tone: "orange", role: "Fundador" },
  teralucia: { id: 2, name: "Lucía Tera", handle: "teralucia", avatar: "L", tone: "accent", role: "Editora · VGC" },
  pixelmateo: { id: 3, name: "Mateo Pixel", handle: "pixelmateo", avatar: "M", tone: "emerald", role: "Admin · Servidor" },
  norahunts: { id: 4, name: "Nora Wilds", handle: "norahunts", avatar: "N", tone: "purple", role: "Redacción · Guías" },
  danisplat: { id: 5, name: "Dani Splat", handle: "danisplat", avatar: "D", tone: "accent", role: "Comunidad" },
  boffmedia: { id: 6, name: "Equipo BoffMedia", handle: "boffmedia", avatar: "B", tone: "orange", role: "Cuenta oficial" },
}

export const CM_AUTHORS: CmAuthor[] = Object.values(A)

// ── Blog posts (sorted by id, mirroring BLOG_POSTS) ──────────────────────────
export const CM_POSTS: BlogPostLike[] = [
  { id: 1, slug: "regulacion-h-rompe-el-meta", title: "La Regulación H rompe el meta: adiós legendarios, hola creatividad", excerpt: "Sin restringidos ni paradojas, el formato Series H devuelve el protagonismo a equipos que llevábamos dos temporadas sin ver. Repasamos los ganadores y perdedores del cambio.", category: "vgc", categoryLabel: "VGC competitivo", tags: ["regulación", "meta", "series-h"], author: A.teralucia, publishedAt: ago("2d4h"), readMins: 7, hue: 18, icon: "sword", featured: true, views: 4820, likes: 312 },
  { id: 2, slug: "temporada-verano-2026-mapa-nuevo", title: "Temporada de Verano 2026: mapa nuevo, economía reiniciada y tres meses de eventos", excerpt: "Reabrimos el survival con un continente entero por explorar, una economía desde cero y un calendario de eventos que no para hasta septiembre. Esto es todo lo que cambia.", category: "servidor", categoryLabel: "Servidor & Pixelmon", tags: ["minecraft", "temporada", "survival"], author: A.pixelmateo, publishedAt: ago("5d2h"), readMins: 6, hue: 130, icon: "axe", featured: true, views: 6140, likes: 488 },
  { id: 3, slug: "guia-primer-equipo-vgc", title: "Tu primer equipo de VGC: una guía sin humo para empezar a competir", excerpt: "Olvida las listas de tier importadas. Te explicamos cómo pensar un equipo desde cero, elegir un modo de victoria y no morir en la fase de construcción.", category: "guias", categoryLabel: "Guías & tutoriales", tags: ["vgc", "principiantes", "teambuilding"], author: A.teralucia, publishedAt: ago("8d"), readMins: 11, hue: 265, icon: "book", views: 3290, likes: 274 },
  { id: 4, slug: "resumen-copa-relampago-smash", title: "Resumen Copa Relámpago: la remontada que nadie vio venir", excerpt: "64 jugadores, doble eliminación y una final a cinco que se decidió en el último stock. Crónica del torneo de Smash más reñido de la temporada.", category: "torneos", categoryLabel: "Torneos & eventos", tags: ["smash", "resumen", "bracket"], author: A.alex, publishedAt: ago("11d"), readMins: 5, hue: 350, icon: "bolt", views: 2870, likes: 198 },
  { id: 5, slug: "notas-plataforma-junio-2026", title: "Notas de la plataforma · Junio 2026: clasificación global, perfiles y más", excerpt: "Lanzamos la clasificación global con podio, rediseñamos los perfiles y unificamos los logros entre eventos. Resumen completo de la actualización.", category: "parches", categoryLabel: "Notas & anuncios", tags: ["plataforma", "release", "cambios"], author: A.boffmedia, publishedAt: ago("1d6h"), readMins: 4, hue: 190, icon: "bell", views: 5210, likes: 356 },
  { id: 6, slug: "construir-granja-mobs-eficiente", title: "Granja de mobs eficiente: del diseño al rendimiento sin trampas", excerpt: "Una guía paso a paso para montar una granja de mobs que rinda en el servidor sin reventar el rendimiento ni romper las reglas de la temporada.", category: "guias", categoryLabel: "Guías & tutoriales", tags: ["minecraft", "redstone", "granjas"], author: A.norahunts, publishedAt: ago("14d"), readMins: 9, hue: 130, icon: "book", views: 4080, likes: 301 },
  { id: 7, slug: "analisis-uso-semana-meta", title: "Análisis de uso: los cinco Pokémon que dominan la semana", excerpt: "Cruzamos los datos de uso de la comunidad con los resultados de torneo para señalar qué está realmente carreando y qué solo es moda pasajera.", category: "vgc", categoryLabel: "VGC competitivo", tags: ["meta", "datos", "uso"], author: A.teralucia, publishedAt: ago("3d"), readMins: 6, hue: 18, icon: "chart", views: 3640, likes: 233 },
  { id: 8, slug: "concurso-construccion-tema-revelado", title: "Gran Concurso de Construcción: tema revelado y reglas del jurado", excerpt: "48 horas, un tema sorpresa que por fin podemos contar y un jurado mixto de comunidad y staff. Todo lo que necesitas para competir y ganar.", category: "torneos", categoryLabel: "Torneos & eventos", tags: ["minecraft", "construcción", "concurso"], author: A.pixelmateo, publishedAt: ago("6h"), readMins: 4, hue: 45, icon: "hammer", views: 1920, likes: 144 },
  { id: 9, slug: "curry-dango-de-la-victoria", title: "Curry Dango de la victoria: la receta que alimenta las noches de raid", excerpt: "La comunidad de Monster Hunter llevaba meses pidiéndola. Aquí está: la receta de curry con dango que preparamos en cada quedada, adaptada para cocina real.", category: "guias", categoryLabel: "Guías & tutoriales", tags: ["cocina", "comunidad", "monster-hunter"], author: A.norahunts, publishedAt: ago("12h"), readMins: 5, hue: 32, icon: "flame", views: 2100, likes: 176 },
  { id: 10, slug: "equipo-campeon-copa-relampago-vgc", title: "El equipo campeón de la Copa Relámpago VGC, set por set", excerpt: "Trick Room, Intimidación y una carta sorpresa. Desglosamos la alineación que se llevó la Copa Relámpago en Regulación H y por qué funciona tan bien esta semana.", category: "vgc", categoryLabel: "VGC competitivo", tags: ["vgc", "teambuilding", "análisis"], author: A.teralucia, publishedAt: ago("1d"), readMins: 9, hue: 18, icon: "sword", views: 5400, likes: 402 },
  { id: 11, slug: "recorrido-mapa-temporada-verano", title: "Recorrido en vídeo por el nuevo mapa de la Temporada de Verano", excerpt: "Volamos sobre las tres regiones del nuevo continente antes del reinicio. Vídeo completo del recorrido y una galería con los rincones que no te puedes perder.", category: "servidor", categoryLabel: "Servidor & Pixelmon", tags: ["minecraft", "mapa", "vídeo"], author: A.pixelmateo, publishedAt: ago("8h"), readMins: 3, hue: 130, icon: "axe", views: 3300, likes: 240 },
]

// ── Forum categories (stats derived from the thread seed) ────────────────────
export const CM_FORUM_CATEGORIES: ForumCategoryLike[] = [
  { id: 1, slug: "anuncios", name: "Anuncios & novedades", description: "Comunicados oficiales, notas de parche y avisos de la plataforma.", icon: "bell", hue: 190, locked: true, threads: 1, posts: 1, lastAuthor: A.boffmedia, lastAt: ago("30d") },
  { id: 2, slug: "vgc", name: "Pokémon VGC", description: "Equipos, meta, dudas de regulación y crónica competitiva.", icon: "sword", hue: 18, threads: 2, posts: 6, lastAuthor: A.teralucia, lastAt: ago("3h") },
  { id: 3, slug: "servidor", name: "Servidor & Pixelmon", description: "Survival, construcción, redstone y todo lo del Minecraft.", icon: "axe", hue: 130, threads: 2, posts: 6, lastAuthor: A.danisplat, lastAt: ago("7h") },
  { id: 4, slug: "torneos", name: "Torneos & eventos", description: "Organización, inscripciones, resultados y quedadas.", icon: "trophy", hue: 45, threads: 1, posts: 3, lastAuthor: A.pixelmateo, lastAt: ago("1d6h") },
  { id: 5, slug: "guias", name: "Guías & ayuda", description: "Comparte tutoriales y pide ayuda a la comunidad.", icon: "book", hue: 265, threads: 1, posts: 2, lastAuthor: A.norahunts, lastAt: ago("18d") },
  { id: 6, slug: "general", name: "Charla general", description: "Lo que no encaja en otro sitio. Preséntate y socializa.", icon: "message", hue: 320, threads: 1, posts: 3, lastAuthor: A.norahunts, lastAt: ago("20d") },
]

// ── Forum threads ─────────────────────────────────────────────────────────────
export const CM_FORUM_THREADS: ForumThreadLike[] = [
  { id: 101, catSlug: "anuncios", catName: "Anuncios & novedades", catHue: 190, title: "📌 Bienvenido al foro de BoffMedia — normas y cómo empezar", author: A.boffmedia, lastAuthor: A.boffmedia, lastAt: ago("30d"), createdAt: ago("30d"), pinned: true, locked: true, replies: 0, views: 12400, votes: 142 },
  { id: 102, catSlug: "vgc", catName: "Pokémon VGC", catHue: 18, title: "Mi equipo de Trick Room por fin funciona en Serie H — feedback", author: A.teralucia, lastAuthor: A.teralucia, lastAt: ago("3h"), createdAt: ago("6h"), replies: 3, views: 842, votes: 37 },
  { id: 103, catSlug: "servidor", catName: "Servidor & Pixelmon", catHue: 130, title: "¿Cuál es la mejor zona para empezar en la nueva temporada?", author: A.danisplat, lastAuthor: A.danisplat, lastAt: ago("22h"), createdAt: ago("1d2h"), solved: true, replies: 2, views: 1310, votes: 22 },
  { id: 104, catSlug: "guias", catName: "Guías & ayuda", catHue: 265, title: "Megahilo: recursos para principiantes de VGC (se actualiza)", author: A.teralucia, lastAuthor: A.norahunts, lastAt: ago("18d"), createdAt: ago("20d"), pinned: true, replies: 1, views: 5600, votes: 88 },
  { id: 105, catSlug: "torneos", catName: "Torneos & eventos", catHue: 45, title: "Organizando una quedada presencial — ¿quién se apunta?", author: A.alex, lastAuthor: A.pixelmateo, lastAt: ago("1d6h"), createdAt: ago("2d"), replies: 2, views: 980, votes: 41 },
  { id: 106, catSlug: "vgc", catName: "Pokémon VGC", catHue: 18, title: "¿Vale la pena el restrictor de velocidad lento esta semana?", author: A.norahunts, lastAuthor: A.teralucia, lastAt: ago("14h"), createdAt: ago("18h"), replies: 1, views: 620, votes: 11 },
  { id: 107, catSlug: "general", catName: "Charla general", catHue: 320, title: "Preséntate aquí 👋 — quiénes somos la gente de BoffMedia", author: A.boffmedia, lastAuthor: A.norahunts, lastAt: ago("20d"), createdAt: ago("25d"), pinned: true, replies: 2, views: 8900, votes: 167 },
  { id: 108, catSlug: "servidor", catName: "Servidor & Pixelmon", catHue: 130, title: "Bug: el comando de reclamar parcela falla en la región norte", author: A.danisplat, lastAuthor: A.danisplat, lastAt: ago("7h"), createdAt: ago("10h"), solved: true, replies: 2, views: 410, votes: 6 },
]

// ── Sidebar widgets ───────────────────────────────────────────────────────────
export const CM_ONLINE: ForumMember[] = [
  { ...A.alex, status: "online" },
  { ...A.teralucia, status: "online" },
  { ...A.pixelmateo, status: "online" },
  { ...A.danisplat, status: "idle" },
  { ...A.norahunts, status: "online" },
]

export const CM_FORUM_STATS: ForumStatsData = { threads: 8, posts: 21, members: 1284, online: 5, newest: "EnderQueen" }
