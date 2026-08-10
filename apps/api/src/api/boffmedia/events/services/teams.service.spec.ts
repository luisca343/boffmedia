import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { TeamsRepository } from '../../../_repositories/boffmedia/teams.repository';
import { ParticipantsService } from './participants.service';

const mockTeamsRepo = {
  findAll: jest.fn(),
  findByEventId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  addMember: jest.fn(),
  findParticipantTeamInEvent: jest.fn(),
  removeMember: jest.fn(),
  findTeamMembers: jest.fn(),
  calculateTeamScore: jest.fn(),
  updateScore: jest.fn(),
  findMember: jest.fn(),
};

const mockParticipantsService = {
  getOrCreateParticipantByUserId: jest.fn(),
  joinEvent: jest.fn(),
  // ensureEventMembership consults this before writing any team/member row so a
  // `removed` player cannot re-enter via a team, and a `declined` one re-joins.
  getParticipationForUser: jest.fn(),
};

const mockTeam = {
  id: 1,
  eventId: 10,
  name: 'Team Rocket',
  tag: 'TR',
  icon: 'rocket.png',
  score: 0,
};

const mockParticipant = {
  id: 5,
  userId: 1,
  nickname: 'TrainerAsh',
  avatar: null,
};

const mockMember = {
  id: 1,
  teamId: 1,
  participantId: 5,
  role: 'member',
};

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: TeamsRepository, useValue: mockTeamsRepo },
        { provide: ParticipantsService, useValue: mockParticipantsService },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllTeams ───────────────────────────────────────────────────────────────

  describe('getAllTeams()', () => {
    it('returns all teams from repo', async () => {
      mockTeamsRepo.findAll.mockResolvedValue([mockTeam]);

      await expect(service.getAllTeams()).resolves.toEqual([mockTeam]);
    });
  });

  // ─── getTeamsByEventId ────────────────────────────────────────────────────────

  describe('getTeamsByEventId()', () => {
    it('returns teams filtered by event', async () => {
      mockTeamsRepo.findByEventId.mockResolvedValue([mockTeam]);

      await expect(service.getTeamsByEventId(10)).resolves.toEqual([mockTeam]);
      expect(mockTeamsRepo.findByEventId).toHaveBeenCalledWith(10);
    });
  });

  // ─── getTeamById ──────────────────────────────────────────────────────────────

  describe('getTeamById()', () => {
    it('returns team by id', async () => {
      mockTeamsRepo.findById.mockResolvedValue(mockTeam);

      await expect(service.getTeamById(1)).resolves.toEqual(mockTeam);
    });
  });

  // ─── createTeam ───────────────────────────────────────────────────────────────

  describe('createTeam()', () => {
    const dto = {
      name: 'Team Rocket',
      tag: 'TR',
      icon: 'rocket.png',
      leaderId: 1,
    };

    beforeEach(() => {
      mockParticipantsService.getOrCreateParticipantByUserId.mockResolvedValue(
        mockParticipant,
      );
      // No prior participation by default (clearAllMocks keeps implementations,
      // so reset it explicitly to avoid a 'removed' leaking from another test).
      mockParticipantsService.getParticipationForUser.mockResolvedValue(
        undefined,
      );
      mockTeamsRepo.create.mockResolvedValue({ insertId: 1 });
      mockTeamsRepo.addMember.mockResolvedValue(undefined);
      mockParticipantsService.joinEvent.mockResolvedValue({});
      mockTeamsRepo.findById.mockResolvedValue(mockTeam);
    });

    it('creates team, adds leader as member, and joins event', async () => {
      const result = await service.createTeam(10, dto);

      expect(
        mockParticipantsService.getOrCreateParticipantByUserId,
      ).toHaveBeenCalledWith(1);
      expect(mockTeamsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 10,
          name: 'Team Rocket',
          tag: 'TR',
        }),
      );
      expect(mockTeamsRepo.addMember).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          participantId: 5,
          role: 'leader',
        }),
      );
      expect(mockParticipantsService.joinEvent).toHaveBeenCalledWith(
        10,
        mockParticipant.id,
        expect.objectContaining({ userId: mockParticipant.userId }),
      );
      expect(result).toEqual(mockTeam);
    });

    it('returns team fetched by the newly created insertId', async () => {
      mockTeamsRepo.create.mockResolvedValue({ insertId: 42 });
      mockTeamsRepo.findById.mockResolvedValue({ ...mockTeam, id: 42 });

      const result = await service.createTeam(10, dto);

      expect(mockTeamsRepo.findById).toHaveBeenCalledWith(42);
      expect(result.id).toBe(42);
    });

    it('ensures event membership BEFORE writing any row — a removed player writes nothing (F-11)', async () => {
      // Membership is checked first: an expelled player's create must be refused
      // with no orphaned team/member rows left behind.
      mockParticipantsService.getParticipationForUser.mockResolvedValue({
        status: 'removed',
      });

      await expect(service.createTeam(10, dto)).rejects.toThrow(/expulsado/i);

      expect(mockTeamsRepo.create).not.toHaveBeenCalled();
      expect(mockTeamsRepo.addMember).not.toHaveBeenCalled();
      expect(mockParticipantsService.joinEvent).not.toHaveBeenCalled();
    });
  });

  // ─── updateTeam ───────────────────────────────────────────────────────────────

  describe('updateTeam()', () => {
    const dto = { name: 'Team Magma', tag: 'TM', icon: 'magma.png' };

    it('updates team and returns refreshed entity', async () => {
      mockTeamsRepo.update.mockResolvedValue(undefined);
      mockTeamsRepo.findById.mockResolvedValue({
        ...mockTeam,
        name: 'Team Magma',
      });

      const result = await service.updateTeam(1, dto);

      expect(mockTeamsRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Team Magma' }),
      );
      expect(result.name).toBe('Team Magma');
    });
  });

  // ─── joinTeam ─────────────────────────────────────────────────────────────────

  describe('joinTeam()', () => {
    beforeEach(() => {
      mockParticipantsService.getOrCreateParticipantByUserId.mockResolvedValue(
        mockParticipant,
      );
      // No prior participation by default (clearAllMocks keeps implementations,
      // so reset it explicitly to avoid a 'removed' leaking from another test).
      mockParticipantsService.getParticipationForUser.mockResolvedValue(
        undefined,
      );
      mockTeamsRepo.findParticipantTeamInEvent.mockResolvedValue([]);
      mockTeamsRepo.addMember.mockResolvedValue(undefined);
      mockParticipantsService.joinEvent.mockResolvedValue({});
      mockTeamsRepo.findMember.mockResolvedValue(mockMember);
    });

    it('adds participant to team and joins event', async () => {
      const result = await service.joinTeam(10, 1, 1);

      expect(mockTeamsRepo.addMember).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          participantId: 5,
          role: 'member',
        }),
      );
      expect(mockParticipantsService.joinEvent).toHaveBeenCalled();
      expect(result).toEqual(mockMember);
    });

    it('returns member fetched after adding', async () => {
      await service.joinTeam(10, 1, 1);

      expect(mockTeamsRepo.findMember).toHaveBeenCalledWith(
        1,
        mockParticipant.id,
      );
    });

    it('throws when participant is already in a team for this event', async () => {
      mockTeamsRepo.findParticipantTeamInEvent.mockResolvedValue([
        { teamId: 2 },
      ]);

      await expect(service.joinTeam(10, 1, 1)).rejects.toThrow(
        'Participant is already in a team for this event',
      );
      expect(mockTeamsRepo.addMember).not.toHaveBeenCalled();
    });

    it('refuses a removed player at the membership gate before any team read/write (F-11)', async () => {
      // The membership check runs first now: a removed player never reaches the
      // team-membership lookup or the member insert (which previously left an
      // "on the team but not in the event" row that needed manual SQL to fix).
      mockParticipantsService.getParticipationForUser.mockResolvedValue({
        status: 'removed',
      });

      await expect(service.joinTeam(10, 1, 1)).rejects.toThrow(/expulsado/i);

      expect(mockTeamsRepo.findParticipantTeamInEvent).not.toHaveBeenCalled();
      expect(mockTeamsRepo.addMember).not.toHaveBeenCalled();
    });
  });

  // ─── leaveTeam ────────────────────────────────────────────────────────────────

  describe('leaveTeam()', () => {
    beforeEach(() => {
      mockParticipantsService.getOrCreateParticipantByUserId.mockResolvedValue(
        mockParticipant,
      );
    });

    it('removes member from team and returns success', async () => {
      mockTeamsRepo.findMember.mockResolvedValue({
        ...mockMember,
        role: 'member',
      });
      mockTeamsRepo.removeMember.mockResolvedValue(undefined);

      const result = await service.leaveTeam(1, 1);

      expect(mockTeamsRepo.removeMember).toHaveBeenCalledWith(
        1,
        mockParticipant.id,
      );
      expect(result).toEqual({ success: true });
    });

    it('throws when participant is not a member of the team', async () => {
      mockTeamsRepo.findMember.mockResolvedValue(null);

      await expect(service.leaveTeam(1, 1)).rejects.toThrow(
        'Participant is not a member of this team',
      );
      expect(mockTeamsRepo.removeMember).not.toHaveBeenCalled();
    });

    it('throws when the leader tries to leave', async () => {
      mockTeamsRepo.findMember.mockResolvedValue({
        ...mockMember,
        role: 'leader',
      });

      await expect(service.leaveTeam(1, 1)).rejects.toThrow(
        'Team leader cannot leave the team.',
      );
      expect(mockTeamsRepo.removeMember).not.toHaveBeenCalled();
    });
  });

  // ─── getTeamMembers ───────────────────────────────────────────────────────────

  describe('getTeamMembers()', () => {
    it('returns team members from repo', async () => {
      const members = [{ id: 1, nickname: 'TrainerAsh' }];
      mockTeamsRepo.findTeamMembers.mockResolvedValue(members);

      await expect(service.getTeamMembers(1)).resolves.toEqual(members);
    });
  });

  // ─── updateTeamScore ──────────────────────────────────────────────────────────

  describe('updateTeamScore()', () => {
    it('calculates and persists the team score', async () => {
      mockTeamsRepo.calculateTeamScore.mockResolvedValue(500);
      mockTeamsRepo.updateScore.mockResolvedValue(undefined);

      await service.updateTeamScore(1);

      expect(mockTeamsRepo.calculateTeamScore).toHaveBeenCalledWith(1);
      expect(mockTeamsRepo.updateScore).toHaveBeenCalledWith(1, 500);
    });
  });

  // ─── validateTeamExists ───────────────────────────────────────────────────────

  describe('validateTeamExists()', () => {
    it('returns true when team is found', async () => {
      mockTeamsRepo.findById.mockResolvedValue(mockTeam);

      await expect(service.validateTeamExists(1)).resolves.toBe(true);
    });

    it('returns false when team is not found', async () => {
      mockTeamsRepo.findById.mockResolvedValue(null);

      await expect(service.validateTeamExists(999)).resolves.toBe(false);
    });
  });

  // ─── validateTeamInEvent ──────────────────────────────────────────────────────

  describe('validateTeamInEvent()', () => {
    it('returns true when team belongs to the event', async () => {
      mockTeamsRepo.findById.mockResolvedValue({ ...mockTeam, eventId: 10 });

      await expect(service.validateTeamInEvent(1, 10)).resolves.toBe(true);
    });

    it('returns false when team belongs to a different event', async () => {
      mockTeamsRepo.findById.mockResolvedValue({ ...mockTeam, eventId: 99 });

      await expect(service.validateTeamInEvent(1, 10)).resolves.toBe(false);
    });

    it('returns false when team is not found', async () => {
      mockTeamsRepo.findById.mockResolvedValue(null);

      await expect(service.validateTeamInEvent(999, 10)).resolves.toBe(false);
    });
  });
});
