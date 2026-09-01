import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgImageService } from './tcg-image.service';
import { TcgRepository } from '../repositories/tcg.repository';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import {
  TcgSyncRequestDto,
  TcgSyncSetState,
  TcgSyncStatus,
} from '../dto/tcg-sync.dto';

export const TCG_DEFAULT_SERIES = 'tcgp';

export type TcgSyncStage = 'series' | 'sets' | 'cards' | 'images';

export interface TcgSyncCounts {
  downloaded: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface TcgSyncFailure {
  stage: TcgSyncStage;
  scope: string;
  message: string;
}

export type TcgSyncEvent =
  | {
      type: 'start';
      seriesId: string;
      stages: TcgSyncStage[];
      sets: Array<{ id: string; name: string }>;
    }
  | {
      type: 'stage';
      stage: TcgSyncStage;
      state: 'running' | 'done' | 'error';
      message?: string;
      counts?: TcgSyncCounts;
    }
  | {
      type: 'set';
      stage: 'cards' | 'images';
      setId: string;
      setName: string;
      index: number;
      total: number;
      state: 'running' | 'done' | 'skipped' | 'error';
      counts?: TcgSyncCounts;
      message?: string;
      /** Cards upstream publishes no artwork for. Not a failure - an absence. */
      unavailable?: number;
    }
  | {
      type: 'item';
      stage: 'cards' | 'images';
      setId: string;
      done: number;
      total: number;
      label?: string;
    }
  | {
      type: 'done';
      cancelled: boolean;
      durationMs: number;
      counts: TcgSyncCounts;
      failures: TcgSyncFailure[];
    };

/**
 * A failure line an admin can actually read.
 *
 * A driver error arrives with the entire failed statement and every bound
 * parameter attached — a Drizzle insert dumped thousands of characters of SQL
 * straight onto the screen. The full error still goes to the server log; the
 * stream carries the first line, capped.
 */
const summarize = (error: unknown): string => {
  const raw =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const firstLine = raw.split('\n')[0].trim();
  return firstLine.length > 240 ? `${firstLine.slice(0, 237)}...` : firstLine;
};

interface TcgSyncTarget {
  id: string;
  name: string;
  cardsRemote: number;
  cardsInDb: number;
  /** Whether `tools_tcg_sets` already holds this set. */
  inDb: boolean;
}

const zero = (): TcgSyncCounts => ({
  downloaded: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
});

const add = (into: TcgSyncCounts, from: TcgSyncCounts): void => {
  into.downloaded += from.downloaded;
  into.updated += from.updated;
  into.skipped += from.skipped;
  into.failed += from.failed;
};

/**
 * Selective catalogue synchronisation for TCG Pocket.
 *
 * The old admin flow was one button that pulled series, sets, every card and
 * every image in a single blocking request - minutes of silence, and any failure
 * meant starting over. This service splits the work into four independent stages
 * over an explicit set selection, streams progress as it goes, and isolates
 * failures per set so one bad expansion never sinks the run.
 */
@Injectable()
export class TcgSyncService {
  constructor(
    private readonly logger: Logger,
    private readonly fetchService: TcgFetchService,
    private readonly imageService: TcgImageService,
    @Inject(TCGPOCKET_REPOSITORY_TOKEN)
    private readonly tcgRepository: TcgRepository,
  ) {}

  // ==================== STATUS ====================

  /**
   * What is stored versus what the remote catalogue offers, per set. The screen
   * needs this before anything is downloaded, so an admin can see at a glance
   * which expansions are missing, half-imported or already complete.
   *
   * A remote outage is reported, not thrown: local counts are still useful, and
   * the screen degrades to "cannot compare" instead of showing nothing.
   */
  async getStatus(seriesId = TCG_DEFAULT_SERIES): Promise<TcgSyncStatus> {
    const [dbSets, stats] = await Promise.all([
      this.tcgRepository.getSetsBySeriesId(seriesId),
      this.tcgRepository.getSyncStatsBySeries(seriesId),
    ]);

    let remoteSets: any[] = [];
    let remoteAvailable = true;
    let remoteError: string | null = null;

    try {
      remoteSets = await this.fetchService.fetchAndMergeSetsForSeries(seriesId);
    } catch (error: any) {
      remoteAvailable = false;
      remoteError = summarize(error);
      this.logger.warn(
        `[TCG] Sync status: remote catalogue unreachable for ${seriesId}: ${remoteError}`,
      );
    }

    const statsBySet = new Map(stats.map((s) => [s.setId, s]));
    const dbBySet = new Map(dbSets.map((s: any) => [s.id, s]));
    const remoteBySet = new Map(remoteSets.map((s: any) => [s.id, s]));

    // Union of both catalogues: a set can be remote-only (never imported) or
    // local-only (pulled from a series that no longer lists it).
    const ids = new Set<string>([
      ...remoteSets.map((s: any) => s.id),
      ...dbSets.map((s: any) => s.id),
    ]);

    const sets = Array.from(ids).map((id) => {
      const remote: any = remoteBySet.get(id);
      const local: any = dbBySet.get(id);
      const stat = statsBySet.get(id);

      // `remote` is the merged API shape (snake_case); `local` is a Drizzle row
      // (camelCase). Reading one convention on both silently yields 0/undefined.
      const cardsRemote = Number(
        remote?.card_count_total ??
          local?.cardCountTotal ??
          local?.card_count_total ??
          0,
      );
      const cardsInDb = stat?.cards ?? 0;
      const imagesEn = stat?.imagesEn ?? 0;
      const imagesEs = stat?.imagesEs ?? 0;
      const imagesAny = stat?.imagesAny ?? 0;
      // A card is covered once it has artwork in EITHER locale. tcgdex has no EN
      // asset at all for many promos (P-A 060+ 404s in every quality and format
      // while the ES one is fine), so counting two files per card would leave the
      // set permanently "incomplete" and re-request the same 404s on every run.
      const imagesMissing = Math.max(0, cardsInDb - imagesAny);

      let state: TcgSyncSetState;
      if (!local || cardsInDb === 0) state = 'missing';
      else if (cardsRemote > 0 && cardsInDb < cardsRemote)
        state = 'cards-partial';
      else if (imagesMissing > 0) state = 'images-partial';
      else state = 'ok';

      return {
        id,
        name:
          remote?.name_en ||
          remote?.name_es ||
          local?.nameEn ||
          local?.nameEs ||
          local?.name_en ||
          local?.name_es ||
          id,
        inDb: Boolean(local),
        cardsRemote,
        cardsInDb,
        imagesEn,
        imagesEs,
        imagesAny,
        imagesMissing,
        state,
      };
    });

    sets.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

    const cardsInDb = sets.reduce((n, s) => n + s.cardsInDb, 0);

    return {
      seriesId,
      remoteAvailable,
      remoteError,
      setsRemote: remoteSets.length,
      setsInDb: dbSets.length,
      cardsRemote: sets.reduce((n, s) => n + s.cardsRemote, 0),
      cardsInDb,
      // Cards with artwork, out of cards stored - not files out of files.
      imagesPresent: sets.reduce((n, s) => n + s.imagesAny, 0),
      imagesExpected: cardsInDb,
      sets,
    };
  }

  // ==================== SYNC STREAM ====================

  /**
   * Runs the selected stages, yielding an event per meaningful step. The caller
   * turns each event into an SSE frame; `isCancelled` lets a disconnected client
   * stop the run instead of leaving it grinding through hundreds of sets.
   */
  async *run(
    dto: TcgSyncRequestDto,
    isCancelled: () => boolean = () => false,
  ): AsyncGenerator<TcgSyncEvent> {
    const seriesId = dto.seriesId || TCG_DEFAULT_SERIES;
    const started = Date.now();
    const total = zero();
    const failures: TcgSyncFailure[] = [];

    const stages: TcgSyncStage[] = [];
    if (dto.series) stages.push('series');
    if (dto.sets) stages.push('sets');
    if (dto.cards) stages.push('cards');
    if (dto.images) stages.push('images');

    // Set to true once the sets stage has written the whole series.
    let setsAreCurrent = false;

    const needsSets = Boolean(dto.cards || dto.images);
    const targetSets = needsSets
      ? await this.resolveTargetSets(seriesId, dto.setIds)
      : [];

    yield {
      type: 'start',
      seriesId,
      stages,
      sets: targetSets.map((s) => ({ id: s.id, name: s.name })),
    };

    // Runs on every sync, whatever was selected: rows written before the public/
    // reorg point at a prefix that no longer serves anything, so the art is on
    // disk and the tool shows nothing. A string swap, idempotent, no downloads.
    try {
      const repaired = await this.tcgRepository.repairLegacyImagePaths();
      if (repaired > 0) total.updated += repaired;
    } catch (error: any) {
      failures.push({
        stage: 'images',
        scope: seriesId,
        message: `Artwork path repair failed: ${summarize(error)}`,
      });
    }

    // -- Series ---------------------------------------------------------------
    if (dto.series && !isCancelled()) {
      yield { type: 'stage', stage: 'series', state: 'running' };
      const counts = zero();
      try {
        const merged = await this.fetchService.fetchAndMergeSeries();
        await this.tcgRepository.insertSeries(
          merged.map((s) => ({
            id: s.id,
            name_en: s.name_en,
            name_es: s.name_es,
            logo: s.logo || null,
          })) as any,
        );
        counts.downloaded = merged.length;
        add(total, counts);
        yield { type: 'stage', stage: 'series', state: 'done', counts };
      } catch (error: any) {
        const message = summarize(error);
        counts.failed = 1;
        add(total, counts);
        failures.push({ stage: 'series', scope: seriesId, message });
        yield { type: 'stage', stage: 'series', state: 'error', message };
      }
    }

    // -- Sets -----------------------------------------------------------------
    if (dto.sets && !isCancelled()) {
      yield { type: 'stage', stage: 'sets', state: 'running' };
      const counts = zero();
      try {
        // Same foreign key, one level up: the series row has to exist first.
        if (!dto.series) await this.ensureSeriesExists(seriesId);

        const merged =
          await this.fetchService.fetchAndMergeSetsForSeries(seriesId);

        // Set logos/symbols are assets too - only fetch them when the admin
        // asked for images, so a metadata-only refresh stays metadata-only.
        if (dto.images) await this.imageService.downloadSetImages(merged);

        const result = await this.tcgRepository.upsertSets(merged);
        counts.downloaded = result.inserted;
        counts.updated = result.updated;
        add(total, counts);
        // Every set of the series now exists, so the cards stage can skip its
        // own parent-row check.
        setsAreCurrent = true;
        for (const target of targetSets) target.inDb = true;
        yield { type: 'stage', stage: 'sets', state: 'done', counts };
      } catch (error: any) {
        const message = summarize(error);
        counts.failed = 1;
        add(total, counts);
        failures.push({ stage: 'sets', scope: seriesId, message });
        yield { type: 'stage', stage: 'sets', state: 'error', message };
      }
    }

    // -- Cards ----------------------------------------------------------------
    if (dto.cards && !isCancelled()) {
      yield { type: 'stage', stage: 'cards', state: 'running' };
      const stageCounts = zero();

      // `tcg_cards.set_id` is a foreign key: a set that was never imported must
      // get its row first, or every card in that expansion is rejected.
      let setRowError: string | null = null;
      if (!setsAreCurrent) {
        try {
          stageCounts.downloaded += await this.ensureSetsExist(
            seriesId,
            targetSets,
          );
        } catch (error: any) {
          // Not fatal to the stage: the sets already in the database can still
          // be walked, and the ones that could not be created are reported
          // individually below.
          setRowError = summarize(error);
          this.logger.error(
            `[TCG] Sync: could not create the missing set rows: ${setRowError}`,
          );
        }
      }

      for (let i = 0; i < targetSets.length; i++) {
        if (isCancelled()) break;
        const set = targetSets[i];

        // Its parent row could not be created, so its cards cannot be stored.
        if (!set.inDb) {
          const message =
            setRowError ?? `Set ${set.id} is not in the database`;
          const counts = { ...zero(), failed: 1 };
          add(stageCounts, counts);
          failures.push({ stage: 'cards', scope: set.id, message });
          yield {
            type: 'set',
            stage: 'cards',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'error',
            counts,
            message,
          };
          continue;
        }

        // A complete set is skipped unless the admin forced a refresh. This is
        // what makes a re-run cheap: only the gaps are fetched.
        if (
          !dto.force &&
          set.cardsRemote > 0 &&
          set.cardsInDb >= set.cardsRemote
        ) {
          const counts = { ...zero(), skipped: set.cardsInDb };
          add(stageCounts, counts);
          yield {
            type: 'set',
            stage: 'cards',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'skipped',
            counts,
          };
          continue;
        }

        yield {
          type: 'set',
          stage: 'cards',
          setId: set.id,
          setName: set.name,
          index: i + 1,
          total: targetSets.length,
          state: 'running',
        };

        try {
          // A big expansion takes a minute of card requests. Progress is pumped
          // out per card, otherwise the bar would sit frozen on one set.
          const cards = yield* this.withProgress<any[]>((emit) =>
            this.fetchService.fetchAndMergeCardsForSet(set.id, {
              withImages: false,
              onCard: (done, cardTotal, cardId) =>
                emit({
                  type: 'item',
                  stage: 'cards',
                  setId: set.id,
                  done,
                  total: cardTotal,
                  label: cardId,
                }),
            }),
          );

          const result = await this.tcgRepository.upsertCards(cards);
          const counts = {
            ...zero(),
            downloaded: result.inserted,
            updated: result.updated,
          };
          add(stageCounts, counts);
          yield {
            type: 'set',
            stage: 'cards',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'done',
            counts,
          };
        } catch (error: any) {
          const message = summarize(error);
          const counts = { ...zero(), failed: 1 };
          add(stageCounts, counts);
          failures.push({ stage: 'cards', scope: set.id, message });
          this.logger.error(
            `[TCG] Sync: cards failed for set ${set.id}: ${message}`,
          );
          // Deliberately no rethrow: the next set still runs, and the summary
          // lists exactly what to retry.
          yield {
            type: 'set',
            stage: 'cards',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'error',
            counts,
            message,
          };
        }
      }

      add(total, stageCounts);
      yield {
        type: 'stage',
        stage: 'cards',
        state: 'done',
        counts: stageCounts,
      };
    }

    // -- Images ---------------------------------------------------------------
    if (dto.images && !isCancelled()) {
      yield { type: 'stage', stage: 'images', state: 'running' };
      const stageCounts = zero();

      for (let i = 0; i < targetSets.length; i++) {
        if (isCancelled()) break;
        const set = targetSets[i];

        try {
          const cards = await this.tcgRepository.getCardImageStateForSet(set.id);
          // Only cards with NO artwork at all. A card that already has one locale
          // is done: chasing the other one would re-request assets that tcgdex
          // does not have, every single run. `force` re-fetches everything.
          const pending = dto.force
            ? cards
            : cards.filter((c) => !c.imageLocalEn && !c.imageLocalEs);
          this.logger.log(
            `[TCG] Sync: set ${set.id} has ${cards.length} card(s), ${pending.length} without artwork`,
          );

          if (pending.length === 0) {
            const counts = { ...zero(), skipped: cards.length };
            add(stageCounts, counts);
            yield {
              type: 'set',
              stage: 'images',
              setId: set.id,
              setName: set.name,
              index: i + 1,
              total: targetSets.length,
              state: 'skipped',
              counts,
            };
            continue;
          }

          yield {
            type: 'set',
            stage: 'images',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'running',
          };

          const { counts, unavailable } = yield* this.withProgress<{
            counts: TcgSyncCounts;
            unavailable: number;
          }>((emit) =>
            this.downloadSetArtwork(
              set.id,
              pending,
              dto,
              (done) =>
                emit({
                  type: 'item',
                  stage: 'images',
                  setId: set.id,
                  done,
                  total: pending.length,
                }),
              isCancelled,
            ),
          );
          add(stageCounts, counts);
          if (counts.failed > 0) {
            failures.push({
              stage: 'images',
              scope: set.id,
              message: `${counts.failed} card(s) could not be downloaded`,
            });
          }
          yield {
            type: 'set',
            stage: 'images',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'done',
            counts,
            // Carried as a number, not a sentence: the wording belongs to the
            // client's message catalogue. Saying it is what keeps "nothing
            // happened" from reading as a silent failure.
            unavailable,
          };
        } catch (error: any) {
          const message = summarize(error);
          const counts = { ...zero(), failed: 1 };
          add(stageCounts, counts);
          failures.push({ stage: 'images', scope: set.id, message });
          this.logger.error(
            `[TCG] Sync: images failed for set ${set.id}: ${message}`,
          );
          yield {
            type: 'set',
            stage: 'images',
            setId: set.id,
            setName: set.name,
            index: i + 1,
            total: targetSets.length,
            state: 'error',
            counts,
            message,
          };
        }
      }

      add(total, stageCounts);
      yield {
        type: 'stage',
        stage: 'images',
        state: 'done',
        counts: stageCounts,
      };
    }

    yield {
      type: 'done',
      cancelled: isCancelled(),
      durationMs: Date.now() - started,
      counts: total,
      failures,
    };
  }

  // ==================== INTERNALS ====================

  /**
   * Bridges a callback-reporting async task into the event stream: whatever the
   * task emits is yielded as it happens, and the task's own return value comes
   * back from `yield*`. Without this, a stage could only report progress after
   * its long await had already finished.
   */
  private async *withProgress<T>(
    work: (emit: (event: TcgSyncEvent) => void) => Promise<T>,
  ): AsyncGenerator<TcgSyncEvent, T> {
    const queue: TcgSyncEvent[] = [];
    let wake: (() => void) | null = null;
    let finished = false;
    let result!: T;
    let failure: unknown = null;

    const emit = (event: TcgSyncEvent) => {
      queue.push(event);
      wake?.();
      wake = null;
    };

    void work(emit)
      .then(
        (value) => {
          result = value;
        },
        (error) => {
          failure = error;
        },
      )
      .finally(() => {
        finished = true;
        wake?.();
        wake = null;
      });

    while (!finished || queue.length > 0) {
      const event = queue.shift();
      if (event) {
        yield event;
        continue;
      }
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }

    if (failure) throw failure;
    return result;
  }

  /**
   * Downloads the artwork still missing for one set and writes the paths back.
   * Per-card failures are counted, never thrown - one dead asset URL must not
   * cost the rest of the expansion.
   */
  private async downloadSetArtwork(
    setId: string,
    pending: Array<{
      id: string;
      imageLocalEn: string | null;
      imageLocalEs: string | null;
    }>,
    dto: TcgSyncRequestDto,
    onCard?: (done: number) => void,
    isCancelled: () => boolean = () => false,
  ): Promise<{ counts: TcgSyncCounts; unavailable: number }> {
    const counts = zero();
    const urls = await this.fetchService.fetchCardImageUrlsForSet(setId);

    // Cards tcgdex publishes no artwork for, in any locale. Verified against the
    // API, not inferred from a failed download: the 27 P-A promos from 074 up
    // carry no `image` field in the set brief NOR on their own card endpoint.
    // That is an absence, not an error - reporting it as a failure is what made
    // a working run look broken.
    let unavailable = 0;
    let done = 0;

    for (const card of pending) {
      // A big set is hundreds of downloads; a disconnect should stop it here,
      // not only when the set is finished.
      if (isCancelled()) break;
      onCard?.(++done);

      const remote = urls.get(card.id);
      if (!remote || (!remote.en && !remote.es)) {
        unavailable += 1;
        counts.skipped += 1;
        continue;
      }

      const wanted: Array<'en' | 'es'> = [];
      if (dto.force || !card.imageLocalEn) wanted.push('en');
      if (dto.force || !card.imageLocalEs) wanted.push('es');

      const written: {
        imageLocalEn?: string | null;
        imageLocalEs?: string | null;
      } = {};

      for (const locale of wanted) {
        const url = locale === 'en' ? remote.en : remote.es;
        if (!url) continue;

        const path = await this.imageService.downloadCardImage(
          { image: url },
          card.id,
          setId,
          locale,
        );
        if (path) {
          counts.downloaded += 1;
          if (locale === 'en') written.imageLocalEn = path;
          else written.imageLocalEs = path;
        }
      }

      if (Object.keys(written).length > 0) {
        await this.tcgRepository.updateCardImages(card.id, written);
      } else {
        // Upstream offered a URL and every attempt still came back empty - that
        // one is a real failure, worth retrying.
        counts.failed += 1;
      }
    }

    if (unavailable > 0) {
      this.logger.log(
        `[TCG] Sync: ${setId} - ${unavailable} card(s) have no artwork published upstream, nothing to download`,
      );
    }

    return { counts, unavailable };
  }

  /**
   * The sets a run will touch. An explicit selection wins; otherwise every set
   * of the series is used. Local counts ride along so the stages can decide what
   * is already complete without re-querying per set.
   */
  private async resolveTargetSets(
    seriesId: string,
    setIds?: string[],
  ): Promise<TcgSyncTarget[]> {
    const status = await this.getStatus(seriesId);
    const wanted = new Set(setIds ?? []);
    return status.sets
      .filter((s) => wanted.size === 0 || wanted.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        cardsRemote: s.cardsRemote,
        cardsInDb: s.cardsInDb,
        inDb: s.inDb,
      }));
  }

  /**
   * Makes sure the series row exists before any set is written.
   *
   * `tools_tcg_sets.series_id` is a foreign key too, so this is the same
   * precondition one level up: a first-ever import that selects Sets without
   * Series would otherwise fail on the very first write.
   */
  private async ensureSeriesExists(seriesId: string): Promise<void> {
    if (await this.tcgRepository.checkIfSeriesExists(seriesId)) return;

    this.logger.log(`[TCG] Sync: creating missing series row ${seriesId}`);
    const merged = await this.fetchService.fetchAndMergeSeries();
    await this.tcgRepository.insertSeries(
      merged.map((x) => ({
        id: x.id,
        name_en: x.name_en,
        name_es: x.name_es,
        logo: x.logo || null,
      })) as any,
    );
  }

  /**
   * Makes sure every target expansion has a row in `tools_tcg_sets` before any
   * card is written.
   *
   * The status view unions the remote catalogue with the database, so a set that
   * has never been imported is a legitimate thing to select — but `tcg_cards.set_id`
   * is a foreign key, so inserting its cards without the parent row fails the whole
   * batch. Requiring the admin to also tick "Sets" would be a trap: the selection
   * they made is valid, and this is a precondition the run can satisfy on its own.
   */
  private async ensureSetsExist(
    seriesId: string,
    targets: TcgSyncTarget[],
  ): Promise<number> {
    const missing = targets.filter((t) => !t.inDb).map((t) => t.id);
    if (missing.length === 0) return 0;

    const remote = await this.fetchService.fetchAndMergeSetsForSeries(seriesId);
    const needed = remote.filter((set: any) => missing.includes(set.id));
    if (needed.length === 0) return 0;

    this.logger.log(
      `[TCG] Sync: creating ${needed.length} missing set row(s) before cards: ${missing.join(', ')}`,
    );
    await this.ensureSeriesExists(seriesId);
    const result = await this.tcgRepository.upsertSets(needed);
    for (const target of targets) {
      if (missing.includes(target.id)) target.inDb = true;
    }
    return result.inserted;
  }
}
