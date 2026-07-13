/**
 * The NPC payload `MisionesService.updateNPCs` sends. The rest of the quest
 * types this app uses come from `@/types/misiones` (shared-model backed) — see
 * `_types/index.ts`.
 */
export interface INPC {
  name: string
  dialogId: number
  skin: string
}
