import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { TournamentsRepository } from '../repositories/tournaments.repository';

/**
 * Covers TN-3 (entrants are addressed through their tournament, and a seeded
 * entrant is not deletable) and TN-4 (capacity is counted under a row lock).
 */
describe('RegistrationService', () => {
  let service: RegistrationService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findParticipant: jest.fn(),
      findParticipantByUser: jest.fn().mockResolvedValue(undefined),
      findUserBasic: jest.fn().mockResolvedValue({ username: 'Ash' }),
      participantCounts: jest.fn().mockResolvedValue(new Map()),
      addParticipant: jest.fn().mockResolvedValue(42),
      addRosterMembers: jest.fn(),
      updateParticipant: jest.fn(),
      removeParticipant: jest.fn(),
      listMatches: jest.fn().mockResolvedValue([]),
      listRoster: jest.fn().mockResolvedValue([]),
      lockTournament: jest.fn(),
      update: jest.fn(),
    };
    repo.transaction = jest.fn((fn: (r: unknown) => unknown) => fn(repo));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: TournamentsRepository, useValue: repo },
      ],
    }).compile();
    service = module.get(RegistrationService);
  });

  describe('entrant ownership', () => {
    it('refuses to update an entrant belonging to another tournament', async () => {
      repo.findParticipant.mockResolvedValue({ id: 5, tournamentId: 999 });

      await expect(
        service.updateParticipant(1, 5, { seed: 2 } as any),
      ).rejects.toThrow(NotFoundException);
      expect(repo.updateParticipant).not.toHaveBeenCalled();
    });

    it('refuses to delete an entrant belonging to another tournament', async () => {
      repo.findParticipant.mockResolvedValue({ id: 5, tournamentId: 999 });

      await expect(service.removeParticipant(1, 5)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.removeParticipant).not.toHaveBeenCalled();
    });
  });

  describe('removeParticipant', () => {
    beforeEach(() => {
      repo.findParticipant.mockResolvedValue({ id: 5, tournamentId: 1 });
      repo.removeParticipant.mockResolvedValue({ success: true });
    });

    it('deletes an entrant that is not in the bracket yet', async () => {
      await expect(service.removeParticipant(1, 5)).resolves.toEqual({
        success: true,
      });
      expect(repo.removeParticipant).toHaveBeenCalledWith(5);
    });

    it('refuses once the entrant is seeded into a match', async () => {
      // The repository atomically checks that the participant is not in any match
      // under a row lock before deleting. The database FK (now RESTRICT) enforces
      // this at the schema level.
      repo.removeParticipant.mockResolvedValue({
        success: false,
        reason: 'in_bracket',
      });

      await expect(service.removeParticipant(1, 5)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.removeParticipant).toHaveBeenCalledWith(5);
    });
  });

  describe('register', () => {
    const open = {
      id: 1,
      status: 'registration',
      registrationOpen: true,
      startDate: null,
      competitorKind: 'solo',
      maxParticipants: 2,
    };

    it('counts capacity inside the locked transaction', async () => {
      repo.findById.mockResolvedValue(open);
      // loadCompetitor re-reads the row the insert just created.
      repo.findParticipant.mockResolvedValue({
        id: 42,
        tournamentId: 1,
        kind: 'solo',
        name: 'Ash',
      });

      await service.register(1, 77, {} as any);

      expect(repo.transaction).toHaveBeenCalled();
      expect(repo.lockTournament).toHaveBeenCalledWith(1);
      // The count must not be read before the lock, or the cap is advisory.
      const lockOrder = repo.lockTournament.mock.invocationCallOrder[0];
      const countOrder = repo.participantCounts.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(countOrder);
      expect(repo.addParticipant).toHaveBeenCalled();
    });

    it('refuses when the tournament is already full', async () => {
      repo.findById.mockResolvedValue(open);
      repo.participantCounts.mockResolvedValue(new Map([[1, 2]]));

      await expect(service.register(1, 77, {} as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.addParticipant).not.toHaveBeenCalled();
    });

    it('refuses when registration is closed', async () => {
      repo.findById.mockResolvedValue({ ...open, registrationOpen: false });

      await expect(service.register(1, 77, {} as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
