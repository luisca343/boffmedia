import { Injectable } from '@nestjs/common';
import { SmogonRepository } from '../repositories/smogon.repository';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import { LimitlessRepository } from '../repositories/limitless.repository';

export type VgcIngestionJobType = 'smogon_snapshot' | 'champions_regulation' | 'limitless_tournament';

export interface VgcIngestionJob {
  id: string;
  type: VgcIngestionJobType;
  status: 'idle' | 'queued' | 'running' | 'done' | 'error';
  revisionKey: string;
  progress?: number;
  total?: number;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  metadata: Record<string, unknown>;
}

function normalizeStatus(value?: string | null): VgcIngestionJob['status'] {
  if (!value) return 'idle';
  if (value.startsWith('running')) return 'running';
  if (value === 'pending') return 'queued';
  if (value === 'done') return 'done';
  if (value === 'error') return 'error';
  if (value === 'idle') return 'idle';
  return 'idle';
}

@Injectable()
export class IngestionJobsService {
  constructor(
    private readonly smogonRepository: SmogonRepository,
    private readonly regulationsRepository: VgcRegulationsRepository,
    private readonly limitlessRepository: LimitlessRepository,
  ) {}

  async listJobs(regulationId?: string): Promise<VgcIngestionJob[]> {
    const [snapshots, regulations, tournaments] = await Promise.all([
      this.smogonRepository.findAvailableSnapshots(),
      this.regulationsRepository.findActive(),
      regulationId
        ? this.limitlessRepository.findTournamentsByRegulation(regulationId)
        : this.limitlessRepository.findAllTournaments(),
    ]);

    const smogonJobs: VgcIngestionJob[] = snapshots.map((s) => ({
      id: `smogon:${s.formatId}:${s.month}:${s.cutoff}`,
      type: 'smogon_snapshot',
      status: 'done',
      revisionKey: `${s.formatId}:${s.month}:${s.cutoff}`,
      completedAt: s.fetchedAt?.toISOString(),
      metadata: {
        formatId: s.formatId,
        month: s.month,
        cutoff: s.cutoff,
        pokemonCount: s.pokemonCount,
      },
    }));

    const championJobs: VgcIngestionJob[] = regulations
      .filter((r) => !regulationId || r.id === regulationId)
      .map((r) => ({
        id: `champions:${r.id}`,
        type: 'champions_regulation',
        status: normalizeStatus(r.importStatus),
        revisionKey: `${r.id}:${r.importStartedAt?.toISOString() ?? 'na'}`,
        progress: r.importFetchedCount ?? 0,
        total: r.importTeamCount ?? 0,
        startedAt: r.importStartedAt?.toISOString(),
        completedAt: r.importCompletedAt?.toISOString(),
        lastError: r.importError ?? undefined,
        metadata: {
          regulationId: r.id,
          formatId: r.formatId,
          name: r.name,
          importStatus: r.importStatus,
        },
      }));

    const limitlessJobs: VgcIngestionJob[] = tournaments.map((t) => ({
      id: `limitless:${t.id}`,
      type: 'limitless_tournament',
      status: normalizeStatus(t.status),
      revisionKey: `${t.id}:${t.fetchedAt?.toISOString() ?? 'na'}`,
      progress: t.progress ?? 0,
      total: t.total ?? 0,
      lastError: t.errorMessage ?? undefined,
      completedAt: t.status === 'done' ? t.fetchedAt?.toISOString() : undefined,
      metadata: {
        tournamentId: t.id,
        limitlessId: t.limitlessId,
        regulationId: t.regulationId,
        name: t.name,
        date: t.date,
        format: t.format,
      },
    }));

    return [...championJobs, ...limitlessJobs, ...smogonJobs];
  }
}
