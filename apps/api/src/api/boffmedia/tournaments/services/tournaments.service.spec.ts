import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsRepository } from '../repositories/tournaments.repository';

/** Covers TN-6: the lifecycle is a table, not just a completed-is-final check. */
describe('TournamentsService.setStatus', () => {
  let service: TournamentsService;
  let repo: any;

  const at = (status: string) => ({ id: 1, status });

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      update: jest.fn(),
      listMatches: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: TournamentsRepository, useValue: repo },
      ],
    }).compile();
    service = module.get(TournamentsService);
  });

  const allow = async (from: string, to: string) => {
    repo.findById.mockResolvedValue(at(from));
    await service.setStatus(1, to as any);
    expect(repo.update).toHaveBeenCalledWith(1, { status: to });
  };

  const refuse = async (from: string, to: string) => {
    repo.findById.mockResolvedValue(at(from));
    await expect(service.setStatus(1, to as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  };

  it('runs draft → registration → live → completed', async () => {
    await allow('draft', 'registration');
    jest.clearAllMocks();
    await allow('registration', 'live');
    jest.clearAllMocks();
    await allow('live', 'completed');
  });

  it('refuses live → registration', async () => {
    // The bracket is already seeded from the field; letting new entrants in
    // afterwards produces a roster the bracket cannot represent.
    await refuse('live', 'registration');
  });

  it('refuses draft → completed', async () => {
    await refuse('draft', 'completed');
  });

  it('refuses reopening a completed tournament', async () => {
    await refuse('completed', 'live');
  });

  it('allows cancelling from any live-ish state', async () => {
    await allow('registration', 'cancelled');
  });

  it('revives a cancelled tournament only while it has no bracket', async () => {
    repo.findById.mockResolvedValue(at('cancelled'));
    repo.listMatches.mockResolvedValue([{ id: 1 }]);

    await expect(service.setStatus(1, 'draft' as any)).rejects.toThrow(
      BadRequestException,
    );

    repo.listMatches.mockResolvedValue([]);
    await service.setStatus(1, 'draft' as any);
    expect(repo.update).toHaveBeenCalledWith(1, { status: 'draft' });
  });

  it('is a no-op when the status already matches', async () => {
    repo.findById.mockResolvedValue(at('live'));
    await service.setStatus(1, 'live' as any);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
