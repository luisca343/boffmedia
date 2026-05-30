# SmartRotom Apps

SmartRotom is a Pixelmon/Minecraft companion app styled as a cellphone UI. Each "app" is a route under `/smartrotom/` and represents a distinct feature available to players on the server.

Apps are registered in the database (`rotom_apps` table) and assigned to players. Their order is configurable per user via drag-and-drop on the home screen.

---

## App Directory

### Admin
**Route:** `/smartrotom/admin`  
**Status:** Active  
Administration panel for server staff. Manages app visibility, player notifications, performance monitoring (rendimiento), signs/cartels, ArceuSpeak announcements, and other admin-only tools.

---

### Arcade
**Route:** `/smartrotom/arcade`  
**Status:** Active  
Mini-game hub. Contains multiple standalone games: Squirdle, Voltorb Flip, Typedoku, Maze, Puzzle, and Loot. Tracks weekly streaks and stars earned.

**Planned improvements:**
- BattleSim mini-game port (explore viability)
- Seasonal tournament mode for existing games

---

### Bidkea
**Route:** `/smartrotom/bidkea`  
**Status:** Active  
3D furniture and item viewer, styled after a catalog shop (IKEA-inspired). Allows players to browse and preview in-game decorative items in a 3D canvas.

---

### Cámara
**Route:** `/smartrotom/camara`  
**Status:** Active  
In-game screenshot camera integration. Allows players to take and view photos from within Minecraft using the MCEF bridge. Supports screenshot capture with/without UI, gallery view, and a screenshot preview dialog.

**Planned sub-sections:**
- **Álbum** — Collection album: shiny checklist, event Pokémon showcase, rarity display. Completion-driven feature for collectors. Lives at `/smartrotom/camara/album` (not a standalone app).

---

### ChatApp
**Route:** `/smartrotom/chatapp`  
**Status:** Active  
Real-time in-game chat application. Enables player-to-player and group messaging within the SmartRotom interface.

---

### Cinder ⭐ New
**Route:** `/smartrotom/cinder`  
**Status:** Scaffold (in development)  
Breeding tool app inspired by "Tinder"-style swipe mechanics. Helps players find compatible Pokémon for breeding by matching IVs, natures, egg groups, and other criteria.

**Planned features:**
- Pull Pokémon directly from the player's PC box (PC integration)
- Compatibility score based on egg groups, nature, IVs
- Swipe-to-match interface between two Pokémon
- Breeding chain calculator (multiple generations for hidden ability or specific nature)
- EV training suggestion based on desired competitive build
- Cross-link with Pokédex egg group entries

---

### FurretToday
**Route:** `/smartrotom/furrettoday`  
**Status:** Active  
News and daily events feed, themed around Furret. Shows server news, event announcements, and daily content for players.

---

### Guías ⭐ New
**Route:** `/smartrotom/guias`  
**Status:** Scaffold (in development)  
Tutorial and guide library for players. Hosts written guides, tips, and how-to articles covering server mechanics, Pixelmon gameplay, and SmartRotom features.

**Planned sub-sections:**
- **Crafting** — Pixelmon-specific crafting recipes: Apricorn Pokéballs, fossil restoration machines, held items, evolution stones. Lives at `/smartrotom/guias/crafting` (not a standalone app).

**Planned features:**
- Category browser: Breeding, Combat, Items, Locations, Crafting, Server Rules
- Staff-curated content with Markdown + image support
- Full-text search
- Deep-links from Pokédex entries ("Guía para capturar este Pokémon")

---

### Karts ⭐ New
**Route:** `/smartrotom/karts`  
**Status:** Scaffold (in development)  
Racing companion app. Displays available kart races, circuits, personal best times, leaderboards, and upcoming race events on the server.

**Planned features:**
- Circuit catalog with map previews
- Personal best times and global leaderboard per circuit
- Event calendar with countdowns and sign-up
- Season standings (points, wins, podium history)
- Post-race results and replay links

---

### Liga
**Route:** `/smartrotom/liga`  
**Status:** Active (expanding)  
Pokémon League tracker. Shows trainer ranking and competitive status, collected gym badges, battle replays (via Camara Lucha sub-route), and progress through the server's official league structure.

**Planned sub-sections:**
- **Torneos** — Tournament bracket viewer: active brackets, results, standings, sign-up. Lives at `/smartrotom/liga/torneos` (not a standalone app).
- **Raids** — Raid boss tracker: active raids, difficulty tiers, rewards, how to join. Lives at `/smartrotom/liga/raids` (if implemented; not a standalone app).
- **Gimnasios** — Gym map: leaders, their Pokémon teams, badge requirements, and personal badge progress. Complements the existing Pasaporte badge wall.

**Planned improvements:**
- ELO/rating graph over time
- Battle replay list with player/Pokémon tagging (linked from Camara Lucha)
- Full badge wall display independent of Pasaporte

---

### Mapa *(redirect)*
**Route:** `/smartrotom/mapa`  
**Status:** Active (external redirect)  
Embeds the external Wingull map at `https://mapawingull.boffmedia.es` using the `WebExterna` component. Shows the interactive server world map with biome zones, spawn locations, and points of interest. Lives inside the `(redirects)` route group — not a database-registered app; its URL is opened directly.

---

### MewTube
**Route:** `/smartrotom/mewtube`  
**Status:** Active  
YouTube-inspired video platform. Players and staff can upload, browse, and watch in-game videos and content. Includes channels, video history, and a dedicated video player.

---

### MewTwitch
**Route:** `/smartrotom/mewtwitch`  
**Status:** Active  
Twitch-inspired live streaming viewer. Shows active streams and lets players watch live content from the server community.

---

### Mina
**Route:** `/smartrotom/mina`  
**Status:** Active  
Mining idle/clicker game. Players excavate resources, claim drops, track rankings, and view their digging history. Includes a dedicated CSS theme (`mina.css`).

---

### Misiones
**Route:** `/smartrotom/misiones`  
**Status:** Active — improvements planned  
Mission and quest tracker. Displays active and completed missions for the player, with progress tracking, types, and utilities for managing server quest content.

**Planned improvements:**
- Mission chain / story arc support (sequential quests)
- Daily mission refresh with notification badge on app icon
- Reward preview before accepting a mission

---

### Navegador *(redirect)*
**Route:** `/smartrotom/navegador`  
**Status:** Active (external redirect)  
Embedded browser using `WebExterna`, pointing to Google. Serves as a general-purpose web browser accessible from the SmartRotom interface. Lives inside `(redirects)`.

---

### Notas
**Route:** `/smartrotom/notas`  
**Status:** Active  
Personal notes app. Players can write and save private notes accessible through the SmartRotom interface.

---

### Pasaporte
**Route:** `/smartrotom/pasaporte`  
**Status:** Active — improvements planned  
Player passport/profile booklet. Displays the trainer's active team, collected badges, achievements, and player stats in a flip-book style UI.

**Planned improvements:**
- Shareable trainer card (QR code or public URL)
- Shiny showcase page in the booklet
- "Last seen" activity timeline

---

### PC
**Route:** `/smartrotom/pc`  
**Status:** Active ✅ (complete)  
Pokémon PC box viewer. Lets players browse and manage their stored Pokémon, mirroring the in-game PC storage system with a web interface. Includes IV/EV display and team builder with type coverage overlay.

---

### PCOld *(redirect)*
**Route:** `/smartrotom/pcold`  
**Status:** Legacy (redirect)  
Old PC integration that used MCEF's `openPC()` to trigger the in-game PC and immediately redirect back to the SmartRotom home. Superseded by the full `/smartrotom/pc` app. Lives inside `(redirects)`.

---

### Pokédex
**Route:** `/smartrotom/pokedex`  
**Status:** Active ✅ (complete)  
Full Pokédex browser. Features quick search, localization by biome, move lists, ability details, spawn information, type chart, and a player's personal registry of caught Pokémon.

---

### Rooker ⭐ New
**Route:** `/smartrotom/rooker`  
**Status:** Scaffold (in development)  
Twitter/X-inspired social network for server players. Will allow posting short updates, following other trainers, liking and commenting on posts, and building a community feed.

**Planned features:**
- Profile page tied to Pasaporte data (trainer card header)
- Hashtag/topic system: `#breeding`, `#trades`, `#shiny`, `#eventos`
- Staff-pinned announcements (complement or replace FurretToday feed)
- Follow system — trainer posts surface in your feed first
- Like, reply, repost
- Wigglypop deep-link: attach a trade listing to a post

---

### Showdown *(redirect)*
**Route:** `/smartrotom/showdown`  
**Status:** Active (external redirect)  
Embeds the server's Pokémon Showdown instance using `WebExterna`. Allows players to do competitive battle simulation from within SmartRotom. Lives inside `(redirects)`.

---

### StarBank
**Route:** `/smartrotom/starbank`  
**Status:** Active — improvements planned  
In-game economy and banking app. Manages the server's star currency — balance, transactions, and transfers.

**Planned improvements:**
- Full transaction history with filters (sent/received, date range)
- P2P transfer flow with confirmation step
- Savings vault / interest mechanic (deposit stars for a time-locked bonus)
- Economy stats: global circulation, top spenders, recent market activity

---

### Taxi
**Route:** `/smartrotom/taxi`  
**Status:** Active  
Teleportation taxi service. Players can request teleports to specific server locations or other players using MCEF integration with the in-game taxi system.

---

### Tiempo
**Route:** `/smartrotom/tiempo`  
**Status:** Active  
In-game weather and time display. Shows current server time, weather conditions, and forecast information for the Minecraft world.

---

### Wigglypop ⭐ New
**Route:** `/smartrotom/wigglypop`  
**Status:** Scaffold (in development)  
Wallapop/marketplace-style trading app. Allows players to list Pokémon and items for trade or sale, browse other players' listings, and complete peer-to-peer exchanges within the server economy.

**Planned features:**
- Category filters: Pokémon, held items, TMs, evolution items, berries
- Price history and market trend indicators per item type
- Wishlist — get notified when a desired Pokémon/item is listed
- Direct trade request vs. public listing
- StarBank integration for in-app transactions
- Listing reports / safety moderation system
- Rooker deep-link: attach a Wigglypop listing to a social post

---

## Roadmap — New Apps

These are proposed standalone apps not yet scaffolded.

### Correo (Mail)
Async in-game mail for sending items or messages between players. Different from ChatApp (real-time) — closer to in-game mail for gifting, formal messages, or admin communications. Would integrate with StarBank for star-attached letters and with Wigglypop for confirmed trades.

### Eventos (Events)
Dedicated event calendar separate from FurretToday. Shows scheduled server events with countdowns, event-exclusive Pokémon spawns, limited-time activities, and registration when applicable. FurretToday covers news; Eventos covers the calendar.

### Equipo (Team Builder)
Team composition tool with type coverage matrix, weakness analysis, and move compatibility checker. Allows building hypothetical teams from the Pokédex or from PC box Pokémon. Feeds into Liga (tournament prep) and Cinder (find the missing piece in your team).

---

## Architecture Notes

- All apps live under `apps/web/src/app/smartrotom/<app-name>/page.tsx`.
- Private components go in `<app-name>/_components/`. Types in `_types/`, hooks in `_hooks/`, utilities in `_utils/`.
- The `(redirects)` route group wraps apps that embed external URLs via `WebExterna`. These are NOT registered in `rotom_apps`.
- Sub-sections of an app (e.g. `liga/torneos`, `guias/crafting`) live as nested routes inside their parent — they are **not** separate database entries.
- Apps use the SmartRotom design system (`components/smartrotom/ui/`) — **do not use Boffmedia's shadcn/Radix primitives**.
- MCEF functions (for Minecraft bridge) are imported from `services/mcef/mcefApi.ts`.
- App registration is database-driven via the `rotom_apps` table — new apps must be seeded before they appear on the home screen.
