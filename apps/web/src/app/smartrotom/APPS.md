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
- **Álbum** — Pokémon collection album living at `/smartrotom/camara/album`. Shows the full server-available Pokédex as a collection grid. Each entry has three states: unseen / seen / caught / shiny caught. Completion-driven feature for collectors.
  - Filter by type, generation, biome, egg group
  - Progress bars: overall %, per-type %, recently added entries
  - Shiny showcase: highlight your rarest catches
  - Share card: "I completed my Bug-type album!" → one-tap share to Rooker
  - Data sourced from the same Pokédex registry already tracked in `/smartrotom/pokedex/registro`

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

**UX flow:**
1. Choose your target — what Pokémon + stat spread do you want to produce
2. App scans your PC box and scores every Pokémon by breeding relevance
3. Top candidates presented for selection — swipe/pick a breeding pair
4. Result preview: expected IV spread, probability of hitting target, generations needed
5. Held item recommendations: Destiny Knot (pass 5 IVs), Everstone (pass nature), Power items (pin specific IV)
6. One-tap chain planner: if 3+ generations are needed, shows the full chain step-by-step

**Planned features:**
- Pull Pokémon directly from the player's PC box via PC integration
- Egg group compatibility check (using `@pkmn` libraries)
- Hidden ability inheritance rules (female or Ditto required)
- Masuda method indicator when a foreign-language Ditto is detected
- Breeding chain calculator with generation-by-generation breakdown
- Cross-link to Pokédex egg group entries ("Other Pokémon in this egg group")
- Cross-link to Wigglypop ("Ditto not in your PC? Find one on the market")
- EV training suggestion for the target build once breeding is done

---

### FurretToday
**Route:** `/smartrotom/furrettoday`  
**Status:** Active  
News and daily events feed, themed around Furret. Shows server news, event announcements, and daily content for players.

**Planned sub-sections:**
- **Eventos** — Structured event calendar at `/smartrotom/furrettoday/eventos`. FurretToday becomes a two-tab app: *Noticias* (news feed) + *Eventos* (calendar). No separate home screen slot needed for events.
  - Calendar view + list view, filterable by type: Competitive, Shiny Hunt, Social, Seasonal
  - Countdown timer per event
  - "Recordatorio" reminder feature: sends a notification (via Rooker notification layer) before the event starts
  - Integration with Misiones: event-exclusive missions surface with an event badge during active events
  - Integration with Karts: upcoming races appear in the Eventos calendar

---

### Guías ⭐ New
**Route:** `/smartrotom/guias`  
**Status:** Scaffold (in development)  
Tutorial and guide library for players. Hosts written guides, tips, and how-to articles covering server mechanics, Pixelmon gameplay, and SmartRotom features.

**Planned sub-sections:**
- **Crafting** — Pixelmon-specific crafting recipes: Apricorn Pokéballs, fossil restoration machines, held items, evolution stones. Searchable by output item or by ingredient. Lives at `/smartrotom/guias/crafting`.

**Planned features:**
- Category browser: Breeding, Combat, Items, Locations, Crafting, Server Rules, SmartRotom How-To
- Staff-curated content authored in Markdown with image support (rich content stored backend-side)
- Full-text search across all guides
- Difficulty tags: Beginner / Intermediate / Advanced
- Deep-links into guide context from other apps:
  - Pokédex entry → "Guide: how to catch this Pokémon"
  - Wigglypop item listing → "Guide: how to craft this item"
  - Cinder pair result → "Guide: breeding chain for this species"
- Crafting sub-section cross-links: rare ingredients with Wigglypop price indicator ("this item costs ~X stars on the market")
- "Suggested for you" based on player progression (new player sees basics first)

---

### Karts ⭐ New
**Route:** `/smartrotom/karts`  
**Status:** Scaffold (in development)  
Racing companion app. Displays available kart races, circuits, personal best times, leaderboards, and upcoming race events on the server.

**Data flow:** Lap times and race results are submitted by the server plugin after each race finishes. The app is read-only for players; staff manages circuits and events.

**Planned features:**
- Circuit catalog: name, biome/theme, length, difficulty rating, preview image
- Global leaderboard per circuit + personal best with delta vs. your previous record
- Season standings: points, wins, podium count, star reward for top finishers
- Live race indicator: when a race is in progress, show a live view with current lap/position (via Socket.io)
- Event calendar (surfaces in FurretToday/Eventos): upcoming races with countdown and how-to-join instructions (in-game command)
- Race history: personal results per circuit with a podium summary
- Post-race results view: full finishing order, fastest lap, time gaps

---

### Liga
**Route:** `/smartrotom/liga`  
**Status:** Active (expanding)  
Pokémon League tracker. Shows trainer ranking and competitive status, collected gym badges, battle replays (via Camara Lucha sub-route), and progress through the server's official league structure.

**Planned sub-sections:**
- **Torneos** (`/smartrotom/liga/torneos`) — Tournament bracket viewer.
  - Bracket types: single elimination, double elimination, Swiss, round-robin
  - Active bracket visualization with results filled in as matches complete
  - Player sign-up flow: tournament opens → register in app → bracket generated
  - Staff controls bracket generation and result entry (from Admin app)
  - Season history with champion records
- **Raids** (`/smartrotom/liga/raids`) — Raid boss tracker. *(if implemented)*
  - Active raid bosses: name, level tier, difficulty stars, rewards
  - Player count needed + current sign-ups
  - Join code or in-game location
  - Countdown to raid expiry
- **Gimnasios** (`/smartrotom/liga/gimnasios`) — Gym leader directory.
  - Each gym: leader profile, type specialization, current team (staff-updated), badge image
  - Personal badge progress per player (same data source as Pasaporte badge wall)
  - "Challenger" status: whether you've beaten this gym or have an open challenge

**Planned improvements:**
- ELO/rating graph over time (line chart per season)
- Battle replay list with player and Pokémon tagging (linked from Camara Lucha records)
- Full badge wall independent of Pasaporte — both share the same data

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

**Technical note:** Rooker is also the natural home for the **shared notification layer** — multiple apps need push notifications (Wigglypop sold, new ChatApp message, Karts race starting, FurretToday event reminder). Building this infra as part of Rooker's backend means other apps can tap into it without duplicating notification plumbing. Socket.io is already present in the stack.

**Planned features:**
- Feed: follows-based chronological, with staff-pinned posts anchored at top
- Post composer with attachments:
  - Screenshot from Cámara gallery
  - Wigglypop listing link ("WTS Shiny Charizard — see listing")
  - Trainer card preview (from Pasaporte data)
  - Liga rank badge
- Profile page: trainer card header pulled from Pasaporte, post history, follower/following count
- Hashtag/topic system: `#breeding`, `#trades`, `#shiny`, `#eventos`, `#liga`
- Like, reply, repost
- Follow system — mutual follow unlocks DM (or routes to ChatApp conversation)
- Staff-verified badge for gym leaders / server staff
- Notification inbox: likes, replies, new followers, mentions
- Report system for moderation (staff acts from Admin app)

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
- Full transaction history with filters (sent/received, date range, counterparty)
- P2P transfer flow: recipient selector → amount → note (optional) → confirmation step with summary
- Escrow display: stars locked in active Wigglypop deals shown separately from free balance
- Savings vault: deposit stars for a time-locked period and earn a star bonus on return (server-controlled interest rate)
- Economy dashboard (public stats): total stars in circulation, top transactions of the day, market activity summary
- Low-balance notification via Rooker notification layer

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

**Exchange model:** The app handles the agreement and payment. The physical Pokémon/item handoff happens in-game (players meet and use `/trade` or the server plugin facilitates it). StarBank stars are locked in escrow when a deal is struck and released to the seller after the buyer confirms receipt.

**Planned features:**
- Listing categories: Pokémon, held items, TMs/HMs, evolution items, berries, rare candy, Apricorn Pokéballs, decorations
- Listing creation: pull Pokémon from PC box directly (IV/nature pre-filled) or pick an item from catalog
- Pricing: fixed price or "make an offer" mode
- Price history chart per item type + market trend indicator (rising/stable/falling)
- Wishlist: notify when a matching listing appears (via Rooker notification layer)
- Direct offer to a specific player vs. public listing
- Escrow: stars locked on both sides until trade is confirmed in-app post in-game handoff
- Transaction history with status tracking (pending / completed / cancelled / disputed)
- Listing reports → Admin moderation queue (Admin app)
- Rooker deep-link: attach a live listing to a social post
- Cinder cross-link: "Need this Pokémon for a breeding chain? Check Wigglypop"

---

### Equipo (Team Builder) ⭐ New
**Route:** `/smartrotom/equipo`  
**Status:** Scaffold (in development)  
Team composition tool. PC already has a team slot builder for Pokémon you own — Equipo extends beyond that: build hypothetical teams with any Pokémon (owned or not), run scenarios for Liga/Torneos prep, and analyze coverage without being limited to your box.

**Rationale for standalone over PC sub-route:** PC is box management (what you have). Equipo is theory-crafting (what you want to build). The workflows and audience overlap but the depth warrants its own space — and it can deep-link *from* PC ("analyze this team in Equipo") without being buried inside it.

**Planned features:**
- Pick any Pokémon from Pokédex (not just your box) and build a team of 6
- Type coverage matrix: 18-type grid showing offensive coverage and defensive weaknesses for the full team
- Move set selector with damage class breakdown (physical/special/status)
- Nature + EV spread optimizer for a given role: tank, sweeper, wall, support, lead
- Held item slot with stat preview (Leftovers regen, Choice Band multiplier, etc.)
- Export team to clipboard in Showdown format — direct deep-link to the Showdown embed app
- "Send to Equipo" CTA from PC team builder (pre-fills the team)
- "Bring to PC" indicator: highlights Pokémon in your team plan that you don't own yet → links to Wigglypop search
- Save and name multiple team drafts (e.g. "Torneos Abril", "Rain team")
- Weakness summary: shows which types your team is weak to more than once

---

## Architecture Notes

- All apps live under `apps/web/src/app/smartrotom/<app-name>/page.tsx`.
- Private components go in `<app-name>/_components/`. Types in `_types/`, hooks in `_hooks/`, utilities in `_utils/`.
- The `(redirects)` route group wraps apps that embed external URLs via `WebExterna`. These are NOT registered in `rotom_apps`.
- Sub-sections of an app (e.g. `liga/torneos`, `guias/crafting`) live as nested routes inside their parent — they are **not** separate database entries.
- Apps use the SmartRotom design system (`components/smartrotom/ui/`) — **do not use Boffmedia's shadcn/Radix primitives**.
- MCEF functions (for Minecraft bridge) are imported from `services/mcef/mcefApi.ts`.
- App registration is database-driven via the `rotom_apps` table — new apps must be seeded before they appear on the home screen.

---

## Cross-App Connections

The apps form a connected ecosystem. These are the intentional deep-links and data flows between apps:

| From | To | Connection |
|------|-----|------------|
| **PC** | **Equipo** | "Analyze this team" CTA pre-fills Equipo with your current team |
| **PC** | **Cinder** | Breeding candidates pulled from PC box |
| **Pokédex** | **Equipo** | Pick any Pokémon (not just owned) to fill team slots |
| **Pokédex** | **Cinder** | Egg group cross-reference on species detail |
| **Pokédex** | **Guías** | "Guide: how to catch this Pokémon" deep-link from species entry |
| **Equipo** | **Showdown** | Export team in Showdown format → direct link to Showdown embed |
| **Equipo** | **Wigglypop** | "You don't own this Pokémon" → search Wigglypop for it |
| **Cinder** | **Wigglypop** | "Don't have a compatible Ditto?" → search Wigglypop |
| **Wigglypop** | **StarBank** | Stars locked in escrow during active deals |
| **Wigglypop** | **Rooker** | Attach an active listing to a post |
| **Guías/Crafting** | **Wigglypop** | Rare ingredients show live market price |
| **Rooker** | **Pasaporte** | Trainer card header on profile page |
| **Rooker** | **Cámara** | Attach a screenshot from gallery to a post |
| **Rooker** | **Liga** | Share rank badge or match result |
| **Cámara/Álbum** | **Rooker** | "Share my completion" one-tap to Rooker |
| **FurretToday/Eventos** | **Misiones** | Event-exclusive missions surface with event badge |
| **FurretToday/Eventos** | **Karts** | Upcoming races appear in the event calendar |
| **Liga/Gimnasios** | **Pasaporte** | Same badge data source — both show the badge wall |
| **Liga/Torneos** | **Equipo** | "Prep for this tournament" CTA opens Equipo with current team |

---

## Notification System

### Architecture

Notifications are a **standalone NestJS module** (`NotificationsModule`) — not owned by Rooker. Rooker reads and displays notifications alongside its social feed; other apps (Wigglypop, ChatApp, Karts) inject `NotificationsService` without depending on Rooker being built first.

```
NestJS NotificationsModule
  ├── NotificationsService       ← all apps inject this to create notifications
  ├── NotificationsGateway       ← Socket.io gateway, emits notification:new to player:{uuid} rooms
  └── NotificationsController    ← REST: GET /notifications, PATCH /notifications/:id/read, etc.
```

### Data model

```
notifications
  id              uuid
  recipientUuid   string
  type            enum (see types below)
  title           string
  body            string
  deepLinkUrl     string        ← e.g. /smartrotom/wigglypop/listing/123
  relatedEntity   { type, id }  ← optional, for rendering context
  isRead          boolean
  createdAt       datetime
  expiresAt       datetime?     ← auto-expire event reminders after the event passes
```

### Notification types and triggers

| Type | Trigger | MCEF in-game? |
|------|---------|---------------|
| `wigglypop.sold` | Buyer confirms receipt | No |
| `wigglypop.offer` | Someone makes an offer on your listing | No |
| `wigglypop.deal_closed` | Both parties confirm | No |
| `chatapp.message` | New direct message received | Yes — sender name in chat |
| `karts.race_starting` | X minutes before scheduled race | Yes — countdown in chat |
| `karts.results` | Race results available | No |
| `eventos.reminder` | Player set a reminder on an event | Yes — event name + time in chat |
| `misiones.new` | New mission unlocked or daily reset | No |
| `misiones.expiring` | Active mission expiring in < 24h | No |
| `liga.match_scheduled` | Torneos match time assigned | No |
| `liga.match_result` | Opponent posted result | No |
| `rooker.like` | Someone liked your post | No |
| `rooker.reply` | Reply on your post | No |
| `rooker.follow` | New follower | No |
| `rooker.mention` | @mention in a post | Yes — username + preview |
| `starbank.received` | Incoming transfer | No |
| `starbank.low_balance` | Balance drops below user-set threshold | No |
| `admin.broadcast` | Staff sends a server-wide or targeted announcement | Yes |

### Real-time delivery (Socket.io)

- On SmartRotom mount: client joins `player:{uuid}` Socket.io room
- NestJS emits `notification:new` to the room whenever a notification is created
- Client updates notification bell badge count instantly — no polling
- `AppGrid` receives a `{ appId: unreadCount }` map via `useNotifications()` hook and renders per-icon badge numbers (matching real smartphone UX)

### MCEF in-game delivery

A secondary channel for time-critical events only. `NotificationsService` calls `sendChatMessage` via the MCEF relay endpoint for the notification types marked above. The in-game message is formatted as:

```
[SmartRotom] {icon} {short message}  →  /smartrotom/{deepLinkPath}
```

### Notification preferences

Players can configure per-category in a SmartRotom Settings screen:
- Enable/disable in-app notification per type group
- Enable/disable MCEF in-game delivery per type group
- Rooker social notifications can be individually toggled (opt-out of follows but keep mentions, etc.)

Settings stored in a `notification_preferences` table keyed by player UUID.

### App icon badges

`AppGrid` (home screen) shows a badge number on each app icon when there are unread notifications for that app. Mapping:

| App | Badge driven by |
|-----|----------------|
| Wigglypop | `wigglypop.*` unread count |
| ChatApp | `chatapp.message` unread count |
| Karts | `karts.race_starting` + `karts.results` |
| Rooker | `rooker.*` unread count |
| FurretToday | `eventos.reminder` + new content |
| Misiones | `misiones.new` + `misiones.expiring` |
| Liga | `liga.match_*` unread count |
| StarBank | `starbank.received` + `starbank.low_balance` |

---

## Ecosystem & General Flow Improvements

### SmartRotom home screen as a dashboard

The current home screen shows app icons + clock. With the notification layer and live data in place, the home screen could surface contextual widgets above the app grid — analogous to a real phone's lock screen:

- **Active Misiones** count badge — "3 active missions"
- **Karts** — "Race in 12 minutes: Circuito Wingull" with a join CTA
- **Wigglypop** — "2 offers on your listings"
- **ChatApp** — "1 new message from [player]"
- **FurretToday** — today's event title if one is running

Widgets are opt-in and configurable. They don't replace app icons; they sit above the grid as a collapsible panel.

### Global search

A single search entry point (magnifier icon on home screen) queries across all apps simultaneously:

| Source | Result type |
|--------|-------------|
| Pokédex | Pokémon entries |
| Wigglypop | Active listings |
| Guías | Guide articles |
| Rooker | Posts and player profiles |
| Misiones | Mission names |

Results are grouped by source and tap directly into the relevant app with the search term pre-applied.

### Cross-app back navigation

When deep-linking between apps (PC → Equipo, Pokédex → Guías), a contextual "← back to {origin}" bar appears inside the destination app. AppWrapper tracks the navigation stack so players don't lose their place.

### Onboarding flow

New players receive a guided tour on first login:
1. **Welcome** — what SmartRotom is
2. **Pokédex** — find your starter's entry
3. **PC** — see your box
4. **Pasaporte** — your trainer card
5. **Misiones** — your first mission

The tour is a special featured article in Guías (`/guias/bienvenida`) and can be replayed. Completion marks the `onboardingDone` flag on the player record.

### App store (Admin-managed)

Admins can enable/disable individual apps per player group (VIP, staff, all players) without a redeploy. The existing `rotom_apps` + `rotom_user_apps` system already supports this. The Admin app's "Apps" section should expose a full matrix: app × player group = enabled/disabled, with bulk assign.
