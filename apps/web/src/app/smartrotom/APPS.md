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

---

### Bidkea
**Route:** `/smartrotom/bidkea`  
**Status:** Active  
3D furniture and item viewer, styled after a catalog shop (IKEA-inspired). Allows players to browse and preview in-game decorative items in a 3D canvas.

---

### Cámara
**Route:** `/smartrotom/camara`  
**Status:** Active  
In-game screenshot camera integration. Allows players to take and view photos from within Minecraft using the MCEF bridge.

---

### ChatApp
**Route:** `/smartrotom/chatapp`  
**Status:** Active  
Real-time in-game chat application. Enables player-to-player and group messaging within the SmartRotom interface.

---

### Cinder ⭐ New
**Route:** `/smartrotom/cinder`  
**Status:** Scaffold (in development)  
Breeding tool app inspired by "Tinder"-style swipe mechanics. Helps players find compatible Pokémon for breeding by matching IVs, natures, egg groups, and other breeding criteria.

---

### FurretToday
**Route:** `/smartrotom/furrettoday`  
**Status:** Active  
News and daily events feed, themed around Furret. Shows server news, event announcements, and daily content for players.

---

### Guías ⭐ New
**Route:** `/smartrotom/guias`  
**Status:** Scaffold (in development)  
Tutorial and guide library for players. Will host written guides, tips, and how-to articles covering server mechanics, Pixelmon gameplay, and SmartRotom features.

---

### Karts ⭐ New
**Route:** `/smartrotom/karts`  
**Status:** Scaffold (in development)  
Racing companion app. Displays available kart races, circuits, best lap times per player, leaderboards, and upcoming race events on the server.

---

### Liga ⭐ New (extended)
**Route:** `/smartrotom/liga`  
**Status:** Active (expanding)  
Pokémon League tracker. Shows trainer ranking and competitive status, collected gym badges, battle replays (via Camara Lucha), and progress through the server's official league structure.

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
**Status:** Active  
Mission and quest tracker. Displays active and completed missions for the player, with progress tracking, types, and utilities for managing server quest content.

---

### Notas
**Route:** `/smartrotom/notas`  
**Status:** Active  
Personal notes app. Players can write and save private notes accessible through the SmartRotom interface.

---

### Pasaporte
**Route:** `/smartrotom/pasaporte`  
**Status:** Active  
Player passport/profile booklet. Displays the trainer's active team, collected badges, achievements, and player stats in a flip-book style UI.

---

### PC
**Route:** `/smartrotom/pc`  
**Status:** Active  
Pokémon PC box viewer. Lets players browse and manage their stored Pokémon, mirroring the in-game PC storage system with a web interface.

---

### Pokédex
**Route:** `/smartrotom/pokedex`  
**Status:** Active  
Full Pokédex browser. Features quick search, localization by biome, move lists, ability details, spawn information, type chart, and a player's personal registry of caught Pokémon.

---

### Rooker ⭐ New
**Route:** `/smartrotom/rooker`  
**Status:** Scaffold (in development)  
Twitter/X-inspired social network for server players. Will allow posting short updates, following other trainers, liking and commenting on posts, and building a community feed.

---

### StarBank
**Route:** `/smartrotom/starbank`  
**Status:** Active  
In-game economy and banking app. Manages the server's star currency — balance, transactions, transfers, and economy-related features.

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

---

## Architecture Notes

- All apps live under `apps/web/src/app/smartrotom/<app-name>/page.tsx`.
- Private components go in `<app-name>/_components/`. Types in `_types/`, hooks in `_hooks/`, utilities in `_utils/`.
- Apps use the SmartRotom design system (`components/smartrotom/ui/`) — **do not use Boffmedia's shadcn/Radix primitives**.
- MCEF functions (for Minecraft bridge) are imported from `services/mcef/mcefApi.ts`.
- App registration is database-driven via the `rotom_apps` table — new apps must be seeded before they appear on the home screen.
