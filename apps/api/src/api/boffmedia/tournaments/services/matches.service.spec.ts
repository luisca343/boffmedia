import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { TournamentNotificationsService } from './tournament-notifications.service';
import { AuditRepository } from '@api/_repositories/boffmedia/audit.repository';

/**
 * These cover the concurrency contract added for TN-1: three writers can land
 * on one match (rival confirm, proposal expiry, admin report) and only the one
 * that wins the conditional claim may propagate a result.
 *
 * Version-based optimistic locking is added for amends: two admins cannot
 * silently overwrite each other. A version mismatch returns false, and the
 * caller receives a 409 Conflict.
 */
const baseMatch = {
  id: 7,
  tournamentId: 1,
  phaseId: null,
  bracket: 'winners',
  roundNumber: 1,
  position: 1,
  status: 'ready',
  topParticipantId: 10,
  botParticipantId: 20,
  nextMatchId: 99,
  nextMatchSlot: 'top',
  loserNextMatchId: null,
  loserNextMatchSlot: null,
  winnerParticipantId: null,
  topScore: null,
  botScore: null,
  proposalState: null,
  proposedByParticipantId: null,
  version: 0,
} as any;

describe('MatchesService (settlement claim)', () => {
  let service: MatchesService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      claimSettlement: jest.fn().mockResolvedValue(true),
      setMatchSlot: jest.fn(),
      setMatchStatus: jest.fn(),
      findMatch: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue({ id: 1, bestOf: 1 }),
      findPhase: jest.fn().mockResolvedValue(undefined),
      listMatchesByPhase: jest.fn().mockResolvedValue([]),
      listPhases: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      updatePhase: jest.fn(),
    };
    // The transaction helper hands the callback a tx-scoped repo; here the same
    // mock stands in for both so the assertions see every call.
    repo.transaction = jest.fn((fn: (r: unknown) => unknown) => fn(repo));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: TournamentsRepository, useValue: repo },
        {
          provide: TournamentNotificationsService,
          useValue: { notifyMatchReady: jest.fn() },
        },
        {
          provide: AuditRepository,
          useValue: { record: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(MatchesService);
  });

  it('propagates the winner when the claim is won', async () => {
    const applied = await service.settle(baseMatch, {
      winnerId: 10,
      loserId: 20,
      topScore: 1,
      botScore: 0,
      status: 'completed',
    });

    expect(applied).toBe(true);
    expect(repo.claimSettlement).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ winnerParticipantId: 10, status: 'completed' }),
      { allowResolved: false },
    );
    expect(repo.setMatchSlot).toHaveBeenCalledWith(99, 'top', 10);
  });

  it('advances nobody when a concurrent writer settled the match first', async () => {
    repo.claimSettlement.mockResolvedValue(false);

    const applied = await service.settle(baseMatch, {
      winnerId: 10,
      loserId: 20,
      topScore: 1,
      botScore: 0,
      status: 'completed',
    });

    expect(applied).toBe(false);
    // The whole point: the loser of the race must not write the next round.
    expect(repo.setMatchSlot).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('an amend targets an already-resolved match on purpose', async () => {
    await service.settle(
      baseMatch,
      {
        winnerId: 20,
        loserId: 10,
        topScore: 0,
        botScore: 1,
        status: 'completed',
      },
      { amend: true },
    );

    expect(repo.claimSettlement).toHaveBeenCalledWith(7, expect.anything(), {
      allowResolved: true,
      expectedVersion: undefined,
    });
  });

  it('an amend uses optimistic concurrency (version check)', async () => {
    const resolved = { ...baseMatch, status: 'completed', version: 5 };
    await service.settle(
      resolved,
      {
        winnerId: 20,
        loserId: 10,
        topScore: 0,
        botScore: 1,
        status: 'completed',
      },
      {
        amend: true,
        expectedVersion: 5,
        actorUserId: 123,
        previousResult: {
          winnerId: 10,
          topScore: 1,
          botScore: 0,
        },
      },
    );

    expect(repo.claimSettlement).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        version: 6, // incremented from 5
      }),
      {
        allowResolved: true,
        expectedVersion: 5,
      },
    );
  });

  it('amend writes an audit row on success', async () => {
    const resolved = { ...baseMatch, status: 'completed', version: 3 };
    const audit = { record: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: TournamentsRepository, useValue: repo },
        {
          provide: TournamentNotificationsService,
          useValue: { notifyMatchReady: jest.fn() },
        },
        { provide: AuditRepository, useValue: audit },
      ],
    }).compile();
    const svc = module.get<MatchesService>(MatchesService);

    await svc.settle(
      resolved,
      {
        winnerId: 20,
        loserId: 10,
        topScore: 0,
        botScore: 1,
        status: 'completed',
      },
      {
        amend: true,
        expectedVersion: 3,
        actorUserId: 456,
        previousResult: {
          winnerId: 10,
          topScore: 1,
          botScore: 0,
        },
      },
    );

    expect(audit.record).toHaveBeenCalledWith(
      'match',
      7,
      'amend',
      456,
      {
        previous: {
          winnerId: 10,
          topScore: 1,
          botScore: 0,
        },
        new: {
          winnerId: 20,
          topScore: 0,
          botScore: 1,
        },
      },
    );
  });

  it('report surfaces a lost race instead of reporting success', async () => {
    repo.findMatch.mockResolvedValue(baseMatch);
    repo.claimSettlement.mockResolvedValue(false);

    await expect(
      service.report(1, 7, { topScore: 1, botScore: 0 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('defers match-ready notifications until after the transaction', async () => {
    const notify = { notifyMatchReady: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: TournamentsRepository, useValue: repo },
        { provide: TournamentNotificationsService, useValue: notify },
        {
          provide: AuditRepository,
          useValue: { record: jest.fn() },
        },
      ],
    }).compile();
    const svc = module.get<MatchesService>(MatchesService);

    repo.findMatch.mockResolvedValue({
      ...baseMatch,
      id: 99,
      status: 'pending',
      topParticipantId: 10,
      botParticipantId: 20,
    });
    // Nothing may be sent while the transaction is still open.
    repo.transaction.mockImplementation(async (fn: (r: unknown) => unknown) => {
      const result = await fn(repo);
      expect(notify.notifyMatchReady).not.toHaveBeenCalled();
      return result;
    });

    await svc.settle(baseMatch, {
      winnerId: 10,
      loserId: 20,
      topScore: 1,
      botScore: 0,
      status: 'completed',
    });

    expect(notify.notifyMatchReady).toHaveBeenCalledTimes(1);
  });
});
