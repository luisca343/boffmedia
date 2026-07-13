/**
 * The NPC payload `MisionesService.updateNPCs` sends. The rest of the quest
 * types this app uses come from `@/types/misiones` (shared-model backed) — see
 * `_types/index.ts`.
 *
 * Not linked to the generated `UpdateNPCsDto`/`NPCData`: those back a same-path
 * (`/misiones/npcs`) but unrelated dialogue-editing DTO (`{ id, name, text?, questId? }`,
 * required `id`) — a different NPC concept from this skin/dialogue-id spawn config, and
 * posting this shape against that DTO would fail its validation. `updateNPCs` has no
 * caller anywhere in the app today, so this is dead code rather than a live bug.
 */
export interface INPC {
  name: string
  dialogId: number
  skin: string
}
