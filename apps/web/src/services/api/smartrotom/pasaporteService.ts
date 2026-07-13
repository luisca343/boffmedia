import { rotomGETOrThrow } from "@/services/boffAPI"
import type {
  PasaporteLogroEntity,
  PasaporteProfileEntity,
  PasaporteSeasonEntity,
} from "@boffmedia/shared"

/**
 * Pasaporte — the trainer's document.
 *
 * Three reads, no writes: a passport is issued by the world, never edited from the web.
 * Everything else the book prints (playtime, team, badges, ledger) already has a service —
 * `PlayerService`, `WingullService`, `AchievementService`, `StarbankService` — and is
 * composed in `pasaporte/_hooks/queries.ts` rather than duplicated here.
 */
export class PasaporteService {
  /** Identity + the derived rank/title/completion the carné and the MRZ are printed from. */
  static getProfile(uuid: string): Promise<PasaporteProfileEntity> {
    return rotomGETOrThrow<PasaporteProfileEntity>(`/pasaporte/profile/${uuid}`)
  }

  /** Every logro with the trainer's progress on it — completed or not. */
  static getLogros(uuid: string): Promise<PasaporteLogroEntity[]> {
    return rotomGETOrThrow<PasaporteLogroEntity[]>(`/pasaporte/logros/${uuid}`)
  }

  /**
   * The competitive season. `season` is null between cycles and the standing is then
   * zeroed — that is a valid answer, not an error, so the chapter renders an interlude
   * rather than a failure.
   */
  static getSeason(uuid: string): Promise<PasaporteSeasonEntity> {
    return rotomGETOrThrow<PasaporteSeasonEntity>(`/pasaporte/season/${uuid}`)
  }
}
