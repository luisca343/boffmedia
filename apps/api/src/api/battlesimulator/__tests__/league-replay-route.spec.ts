import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BattlesimController } from '../battlesim.controller';
import { BattlesimRepository } from '../battlesim.repository';
import { BattleTicketService } from '../battle-ticket.service';
import { ReplayService } from '@api/smartrotom/liga/services/replay.service';

/**
 * Audit B14 — `GET /battlesimulator/replays/liga/:id`.
 *
 * The battlesim replay viewer used to fetch league replays straight from
 * `/smartrotom/liga/replay/:id`, so a battle-simulator screen depended on a
 * SmartRotom module. The route now lives here and delegates to Liga's
 * `ReplayService`, which still owns the data.
 *
 * These drive the REAL controller method. The point is the HTTP semantics the
 * Liga route could not give: it signals absence by throwing a bare `Error`,
 * which the global filter can only render as a 500.
 */
describe('BattlesimController — league replays (B14)', () => {
  let controller: BattlesimController;
  let leagueReplays: { findReplayById: jest.Mock };

  const row = {
    id: 42,
    side1: 'Red',
    side2: 'Blue',
    team1: 'paste-1',
    team2: 'paste-2',
    replay: '|player|p1|Red\n|start\n|turn|1',
    winner: 'Red',
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
    updatedAt: new Date('2026-01-02T03:04:05.000Z'),
  };

  beforeEach(() => {
    leagueReplays = { findReplayById: jest.fn().mockResolvedValue(row) };
    controller = new BattlesimController(
      {} as unknown as BattleTicketService,
      {} as unknown as BattlesimRepository,
      leagueReplays as unknown as ReplayService,
    );
  });

  it('returns the league replay the viewer needs, by numeric id', async () => {
    const res = await controller.getLeagueReplay('42');

    expect(leagueReplays.findReplayById).toHaveBeenCalledWith(42);
    // Exactly the fields ReplayDetailView reads off the envelope.
    expect(res).toEqual({
      id: 42,
      side1: 'Red',
      side2: 'Blue',
      team1: 'paste-1',
      team2: 'paste-2',
      replay: row.replay,
      createdAt: row.createdAt,
    });
  });

  it('does not leak league-only columns the viewer has no use for', async () => {
    const res = await controller.getLeagueReplay('42');
    expect(res).not.toHaveProperty('winner');
    expect(res).not.toHaveProperty('updatedAt');
  });

  it('answers 404 for a replay that does not exist, not 500', async () => {
    leagueReplays.findReplayById.mockResolvedValue(null);
    await expect(controller.getLeagueReplay('9999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a non-numeric id instead of coercing it', async () => {
    // `parseInt("12abc")` is 12, which would serve a DIFFERENT replay than the
    // link asked for. Liga's own route throws a bare Error here, i.e. a 500.
    for (const bad of ['12abc', 'abc', '', ' ', '-1', '1.5', '1e3']) {
      await expect(controller.getLeagueReplay(bad)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
    expect(leagueReplays.findReplayById).not.toHaveBeenCalled();
  });

  it('does not confuse a battlesim uuid replay id for a league id', async () => {
    // Battlesim's own replays are uuids on `replays/:id`; a uuid must never
    // reach the league lookup, which keys on an integer primary key.
    await expect(
      controller.getLeagueReplay('3f7c1a9e-0b2d-4c5e-8a1f-9d6b2c4e7a01'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
