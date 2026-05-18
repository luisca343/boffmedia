# Playwright E2E Test Coverage Plan

## Status legend
- ✅ Done
- 🔄 In progress
- ⬜ Pending
- ❌ Skipped (permanent)

---

## Done

| Spec | Route | Domain |
|---|---|---|
| `specs/boffmedia/landing.spec.ts` | `/` | boffmedia public |
| `specs/boffmedia/auth.spec.ts` | `/auth` | boffmedia public |
| `specs/boffmedia/events.spec.ts` | `/eventos` | boffmedia public |
| `specs/boffmedia/leaderboard.spec.ts` | `/clasificacion` | boffmedia public |
| `specs/boffmedia-auth/profile.auth.spec.ts` | `/perfil` | boffmedia auth |
| `specs/smartrotom/home.auth.spec.ts` | `/smartrotom` | smartrotom auth |

---

## Phase 1 — Remaining boffmedia public

| Status | Spec | Route | Notes |
|---|---|---|---|
| ✅ | `specs/boffmedia/games.spec.ts` | `/juegos` | Mocks `GET /events/games`. 4 tests |
| ✅ | `specs/boffmedia/event-detail.spec.ts` | `/eventos/[id]` | Mocks 4 endpoints. 6 tests |
| ✅ | `specs/boffmedia/community.spec.ts` | `/community` | No API (construction page). 3 tests |
| ✅ | `specs/boffmedia/tools.spec.ts` | `/herramientas` | No API (static data). 6 tests |

---

## Phase 2 — SmartRotom (auth required)

| Status | Spec | Route | Notes |
|---|---|---|---|
| ✅ | `specs/smartrotom/pokedex.auth.spec.ts` | `/smartrotom/pokedex` | Mocks `GET /smartrotom/pokemon`. 4 tests |
| ✅ | `specs/smartrotom/pokedex-entry.auth.spec.ts` | `/smartrotom/pokedex/entrada/[id]` | Mocks 5 endpoints. 3 tests |
| ✅ | `specs/smartrotom/furrettoday.auth.spec.ts` | `/smartrotom/furrettoday` | Mocks `GET /documents/news`. 5 tests |

---

## Phase 3 — Authenticated SmartRotom

| Status | Spec | Route | Notes |
|---|---|---|---|
| ✅ | `specs/smartrotom/starbank.auth.spec.ts` | `/smartrotom/starbank` | Mocks accounts/transactions/transfers. 3 tests |
| ✅ | `specs/smartrotom/misiones.auth.spec.ts` | `/smartrotom/misiones` | Mocks POST /misiones/user. 4 tests |
| ✅ | `specs/smartrotom/pasaporte.auth.spec.ts` | `/smartrotom/pasaporte` | Mocks player stats, team, achievements. 1 test (react-pageflip only mounts cover page in DOM initially) |

---

## Phase 4 — Complex interactions

| Status | Spec | What to test |
|---|---|---|
| ⬜ | `specs/boffmedia/tcgpocket.spec.ts` | Search by type/expansion, card grid |
| ⬜ | `specs/boffmedia-auth/admin.auth.spec.ts` | Tab navigation, section headings (smoke only, no mutations) |
| ⬜ | `specs/boffmedia/suggest-event.spec.ts` | Form validation, submit flow |
| ⬜ | `specs/smartrotom/vgc.spec.ts` | Session list visible, search |

---

## Permanent skip

| Route | Reason |
|---|---|
| `/privacidad`, `/terminos`, etc. | Pure static, no test value |
| `/blanco`, `/styles/*` | Internal dev pages |
| `/smartrotom/arcade/*` | Canvas/game loop — wrong tool |
| `/smartrotom/mewtube`, `/smartrotom/mewtwitch` | Need real streaming backend |
| `/showdown` | External redirect |

---

## Infrastructure checklist

- [x] `tests/helpers/api.ts` — `apiOk()`, `mockGet()`, `mockPost()`
- [x] `tests/fixtures/index.ts` — base page fixtures
- [x] `tests/pages/base.page.ts`
- [ ] Typed mock factories per domain (Phase 2)
- [ ] `specs/smartrotom-auth/` folder (Phase 3)
