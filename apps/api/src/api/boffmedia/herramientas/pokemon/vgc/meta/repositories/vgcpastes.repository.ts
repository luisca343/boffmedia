import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcPastesRepository,
  vgcPokepastes,
  VgcRepositoryPaste,
} from '@/_db/schema/Vgc';

@Injectable()
export class VgcPastesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findByRegulation(
    regulationId: string,
  ): Promise<VgcRepositoryPaste[]> {
    return this.db
      .select()
      .from(vgcPastesRepository)
      .where(eq(vgcPastesRepository.regulationId, regulationId));
  }

  async upsertTeam(data: {
    id: string;
    pasteId?: number | null;
    pasteUrl?: string | null;
    playerName?: string | null;
    teamDescription?: string | null;
    tournament?: string | null;
    dateShared?: string | null;
    rank?: string | null;
    regulationId?: string | null;
    species: string[];
    items?: string[];
    replicaStatus?: string | null;
    hasEvs?: string | null;
    sourceUrl?: string | null;
    owner?: string | null;
  }): Promise<void> {
    const row = {
      id: data.id,
      pasteId: data.pasteId ?? null,
      pasteUrl: data.pasteUrl ?? null,
      playerName: data.playerName ?? null,
      teamDescription: data.teamDescription ?? null,
      tournament: data.tournament ?? null,
      dateShared: data.dateShared ?? null,
      rank: data.rank ?? null,
      regulationId: data.regulationId ?? null,
      species: JSON.stringify(data.species),
      items: JSON.stringify(data.items ?? []),
      replicaStatus: data.replicaStatus ?? null,
      hasEvs: data.hasEvs ?? null,
      sourceUrl: data.sourceUrl ?? null,
      owner: data.owner ?? null,
      fetchedAt: new Date(),
    };
    await this.db
      .insert(vgcPastesRepository)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          pasteId: row.pasteId,
          pasteUrl: row.pasteUrl,
          playerName: row.playerName,
          teamDescription: row.teamDescription,
          tournament: row.tournament,
          dateShared: row.dateShared,
          rank: row.rank,
          species: row.species,
          items: row.items,
          replicaStatus: row.replicaStatus,
          hasEvs: row.hasEvs,
          sourceUrl: row.sourceUrl,
          owner: row.owner,
          fetchedAt: row.fetchedAt,
        },
      });
  }

  async linkPaste(teamId: string, pasteId: number): Promise<void> {
    await this.db
      .update(vgcPastesRepository)
      .set({ pasteId })
      .where(eq(vgcPastesRepository.id, teamId));
  }

  async deleteByRegulation(regulationId: string): Promise<void> {
    await this.db
      .delete(vgcPastesRepository)
      .where(eq(vgcPastesRepository.regulationId, regulationId));
  }

  async findTeamIdsByRegulation(regulationId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: vgcPastesRepository.id })
      .from(vgcPastesRepository)
      .where(eq(vgcPastesRepository.regulationId, regulationId));
    return rows.map((row) => row.id);
  }

  async deleteTeamsByIds(teamIds: string[]): Promise<void> {
    if (teamIds.length === 0) return;
    await this.db
      .delete(vgcPastesRepository)
      .where(inArray(vgcPastesRepository.id, teamIds));
  }

  async findAvailableRegulations(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ regulationId: vgcPastesRepository.regulationId })
      .from(vgcPastesRepository)
      .where(isNotNull(vgcPastesRepository.regulationId));
    return rows.map((r) => r.regulationId).filter(Boolean) as string[];
  }

  /** Teams that have a paste URL but have not yet had their paste fetched and linked. */
  async findTeamsNeedingFetch(regulationId: string): Promise<
    Array<{
      id: string;
      pasteUrl: string;
      owner: string | null;
      teamDescription: string | null;
    }>
  > {
    const rows = await this.db
      .select({
        id: vgcPastesRepository.id,
        pasteUrl: vgcPastesRepository.pasteUrl,
        owner: vgcPastesRepository.owner,
        teamDescription: vgcPastesRepository.teamDescription,
      })
      .from(vgcPastesRepository)
      .where(
        and(
          eq(vgcPastesRepository.regulationId, regulationId),
          isNotNull(vgcPastesRepository.pasteUrl),
          isNull(vgcPastesRepository.pasteId),
        ),
      );
    return rows.filter(
      (r): r is (typeof rows)[number] & { pasteUrl: string } =>
        r.pasteUrl !== null,
    );
  }

  /** All parsed paste slots for teams in a regulation that have a linked paste. */
  async findParsedSlotsByRegulation(
    regulationId: string,
  ): Promise<Array<{ parsedSlots: string }>> {
    return this.db
      .select({ parsedSlots: vgcPokepastes.parsedSlots })
      .from(vgcPastesRepository)
      .innerJoin(
        vgcPokepastes,
        eq(vgcPastesRepository.pasteId, vgcPokepastes.id),
      )
      .where(eq(vgcPastesRepository.regulationId, regulationId));
  }

  /**
   * Returns all VGCPastes teams with their parsed paste for a regulation.
   * Used to build the "teams featuring this Pokémon" panel — filtered in-app.
   */
  async findTeamsByRegulationWithPastes(regulationId: string): Promise<
    Array<{
      teamId: string;
      playerName: string | null;
      rank: string | null;
      tournament: string | null;
      dateShared: string | null;
      parsedSlots: string;
      rawText: string;
      replicaCode: string | null;
    }>
  > {
    return this.db
      .select({
        teamId: vgcPastesRepository.id,
        playerName: vgcPastesRepository.playerName,
        rank: vgcPastesRepository.rank,
        tournament: vgcPastesRepository.tournament,
        dateShared: vgcPastesRepository.dateShared,
        parsedSlots: vgcPokepastes.parsedSlots,
        rawText: vgcPokepastes.rawText,
        replicaCode: vgcPokepastes.replicaCode,
      })
      .from(vgcPastesRepository)
      .innerJoin(
        vgcPokepastes,
        eq(vgcPastesRepository.pasteId, vgcPokepastes.id),
      )
      .where(eq(vgcPastesRepository.regulationId, regulationId));
  }
}
