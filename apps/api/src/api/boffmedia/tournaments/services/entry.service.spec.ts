import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EntryService } from './entry.service';
import { TournamentsRepository } from '../repositories/tournaments.repository';

/**
 * The Limitless entry rule: check-in always counts, a teamsheet counts too when
 * the tournament requires one, and whoever is short of that when the field is
 * resolved is dropped rather than silently seeded or silently deleted.
 */
const solo = { teamsheetRequired: false } as any;
const vgc = { teamsheetRequired: true } as any;

const p = (over: Record<string, unknown>) =>
  ({
    id: 1,
    tournamentId: 1,
    status: 'active',
    checkedInAt: null,
    teamsheet: null,
    ...over,
  }) as any;

describe('EntryService', () => {
  let service: EntryService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      lockTournament: jest.fn(),
      listParticipants: jest.fn().mockResolvedValue([]),
      updateParticipant: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findParticipant: jest.fn(),
      listMatches: jest.fn().mockResolvedValue([]),
    };
    repo.transaction = jest.fn((fn: (r: unknown) => unknown) => fn(repo));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntryService,
        { provide: TournamentsRepository, useValue: repo },
      ],
    }).compile();
    service = module.get(EntryService);
  });

  describe('gapsFor', () => {
    it('needs only check-in on a non-teamsheet tournament', () => {
      expect(service.gapsFor(solo, p({}))).toEqual(['check-in']);
      expect(service.gapsFor(solo, p({ checkedInAt: new Date() }))).toEqual([]);
    });

    it('needs the teamsheet first on a VGC tournament', () => {
      expect(service.gapsFor(vgc, p({}))).toEqual(['teamsheet', 'check-in']);
      expect(service.gapsFor(vgc, p({ checkedInAt: new Date() }))).toEqual([
        'teamsheet',
      ]);
      expect(
        service.gapsFor(vgc, p({ checkedInAt: new Date(), teamsheet: '[]' })),
      ).toEqual([]);
    });

    it('ignores the teamsheet when the tournament does not ask for one', () => {
      expect(service.hasEntered(solo, p({ checkedInAt: new Date() }))).toBe(
        true,
      );
    });
  });

  describe('resolve', () => {
    it('drops the un-entered, keeps the entered, and locks teamsheets', async () => {
      repo.lockTournament.mockResolvedValue({
        ...vgc,
        id: 1,
        teamsheetLockedAt: null,
      });
      repo.listParticipants.mockResolvedValue([
        p({ id: 10, checkedInAt: new Date(), teamsheet: '[]' }), // entered
        p({ id: 11, checkedInAt: new Date() }), // no teamsheet
        p({ id: 12, teamsheet: '[]' }), // never checked in
        p({ id: 13, status: 'withdrew' }), // their own decision — untouched
      ]);

      const res = await service.resolve(1);

      expect(res.entered).toEqual([10]);
      expect(res.dropped).toEqual([11, 12]);
      expect(repo.updateParticipant).toHaveBeenCalledWith(11, {
        status: 'dropped',
      });
      expect(repo.updateParticipant).toHaveBeenCalledWith(12, {
        status: 'dropped',
      });
      // A withdrawal is not a drop; the row must keep its own meaning.
      expect(repo.updateParticipant).not.toHaveBeenCalledWith(13, {
        status: 'dropped',
      });
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          registrationOpen: false,
          checkInOpen: false,
          teamsheetLockedAt: expect.any(Date),
        }),
      );
    });

    it('runs under the tournament lock', async () => {
      repo.lockTournament.mockResolvedValue({ ...solo, id: 1 });
      await service.resolve(1);
      expect(repo.transaction).toHaveBeenCalled();
      expect(repo.lockTournament).toHaveBeenCalledWith(1);
    });

    it('keeps the original lock timestamp when re-resolved', async () => {
      const first = new Date('2026-01-01T00:00:00Z');
      repo.lockTournament.mockResolvedValue({
        ...solo,
        id: 1,
        teamsheetLockedAt: first,
      });
      await service.resolve(1);
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ teamsheetLockedAt: first }),
      );
    });
  });

  describe('readmit', () => {
    it('puts a dropped entrant back while no bracket exists', async () => {
      repo.findParticipant.mockResolvedValue(
        p({ id: 11, status: 'dropped', tournamentId: 1 }),
      );
      await expect(service.readmit(1, 11)).resolves.toEqual({ success: true });
      expect(repo.updateParticipant).toHaveBeenCalledWith(11, {
        status: 'active',
      });
    });

    it('refuses once the bracket is built', async () => {
      repo.listMatches.mockResolvedValue([{ id: 1 }]);
      await expect(service.readmit(1, 11)).rejects.toThrow(BadRequestException);
    });

    it('refuses an entrant from another tournament', async () => {
      repo.findParticipant.mockResolvedValue(
        p({ id: 11, status: 'dropped', tournamentId: 999 }),
      );
      await expect(service.readmit(1, 11)).rejects.toThrow(BadRequestException);
    });

    it('refuses someone who was never dropped', async () => {
      repo.findParticipant.mockResolvedValue(
        p({ id: 11, status: 'active', tournamentId: 1 }),
      );
      await expect(service.readmit(1, 11)).rejects.toThrow(BadRequestException);
    });
  });
});
