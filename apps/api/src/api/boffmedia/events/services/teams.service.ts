import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamsRepository } from '../../../_repositories/boffmedia/teams.repository';
import { ParticipantsService } from './participants.service';
import {
  EventTeam,
  EventTeamMember,
  PARTICIPANT_STATUS,
  Participant,
} from '@/_db/schema/BoffMediaEvents';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly participantsService: ParticipantsService,
  ) {}

  async getAllTeams(): Promise<EventTeam[]> {
    return this.teamsRepository.findAll();
  }

  async getTeamsByEventId(eventId: number): Promise<EventTeam[]> {
    return this.teamsRepository.findByEventId(eventId);
  }

  async getTeamById(teamId: number): Promise<EventTeam> {
    return this.teamsRepository.findById(teamId);
  }

  async createTeam(
    eventId: number,
    createTeamDto: CreateTeamDto,
  ): Promise<EventTeam> {
    // 1. Get or create participant for leader
    const leaderParticipant =
      await this.participantsService.getOrCreateParticipantByUserId(
        createTeamDto.leaderId,
      );

    // 2. Event membership FIRST: it is the step that can refuse (removed,
    // etc.), so failing here leaves no orphaned team/member rows behind.
    await this.ensureEventMembership(
      eventId,
      leaderParticipant,
      `Created team ${createTeamDto.name}`,
    );

    // 3. Create the team
    const teamData = {
      eventId,
      name: createTeamDto.name,
      tag: createTeamDto.tag,
      icon: createTeamDto.icon,
    };

    const result = await this.teamsRepository.create(teamData);
    const teamId = result.insertId;

    // 4. Add leader as team member with leader role
    const memberData = {
      teamId,
      participantId: leaderParticipant.id,
      role: 'leader' as const,
    };

    await this.teamsRepository.addMember(memberData);

    return this.getTeamById(teamId);
  }

  /**
   * Idempotent event join: an existing active membership is fine (joining a
   * team is the expected follow-up to joining the event), `declined` re-joins,
   * `removed` stays refused.
   */
  private async ensureEventMembership(
    eventId: number,
    participant: Participant,
    comment: string,
  ): Promise<void> {
    const existing =
      participant.userId != null
        ? await this.participantsService.getParticipationForUser(
            participant.userId,
            eventId,
          )
        : undefined;

    if (existing?.status === PARTICIPANT_STATUS.REMOVED) {
      throw new ForbiddenException(
        'Has sido expulsado de este evento por un administrador',
      );
    }
    if (
      existing &&
      existing.status !== PARTICIPANT_STATUS.DECLINED
    ) {
      return; // already an active member
    }

    await this.participantsService.joinEvent(eventId, participant.id, {
      userId: participant.userId ?? undefined,
      comment,
    });
  }

  async updateTeam(
    teamId: number,
    updateTeamDto: UpdateTeamDto,
  ): Promise<EventTeam> {
    const teamData = {
      name: updateTeamDto.name,
      tag: updateTeamDto.tag,
      icon: updateTeamDto.icon,
    };

    await this.teamsRepository.update(teamId, teamData);
    return this.getTeamById(teamId);
  }

  async joinTeam(
    eventId: number,
    teamId: number,
    userId: number,
  ): Promise<EventTeamMember> {
    // 1. Get or create participant
    const participant =
      await this.participantsService.getOrCreateParticipantByUserId(userId);

    // 2. Event membership FIRST — it can refuse (removed), and doing it before
    // the member insert avoids a half-committed "on the team but not in the
    // event" state that was unrecoverable without manual SQL.
    await this.ensureEventMembership(
      eventId,
      participant,
      `Joined team ${teamId}`,
    );

    // 3. Check if participant is already in a team for this event
    const existingTeam = await this.teamsRepository.findParticipantTeamInEvent(
      participant.id,
      eventId,
    );

    if (existingTeam.length > 0) {
      throw new ConflictException(
        'Participant is already in a team for this event',
      );
    }

    // 4. Add participant to team members
    const memberData = {
      teamId,
      participantId: participant.id,
      role: 'member' as const,
    };

    await this.teamsRepository.addMember(memberData);

    return this.teamsRepository.findMember(teamId, participant.id);
  }

  async leaveTeam(
    teamId: number,
    userId: number,
  ): Promise<{ success: boolean; message?: string }> {
    // 1. Get participant
    const participant =
      await this.participantsService.getOrCreateParticipantByUserId(userId);

    // 2. Check if participant is the team leader
    const member = await this.teamsRepository.findMember(
      teamId,
      participant.id,
    );

    if (!member) {
      throw new NotFoundException('Participant is not a member of this team');
    }

    if (member.role === 'leader') {
      throw new ForbiddenException(
        'Team leader cannot leave the team. Transfer leadership or disband the team.',
      );
    }

    // 3. Remove from team members
    await this.teamsRepository.removeMember(teamId, participant.id);

    return { success: true };
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    return this.teamsRepository.findTeamMembers(teamId);
  }
  async updateTeamScore(teamId: number): Promise<void> {
    const totalScore = await this.teamsRepository.calculateTeamScore(teamId);
    await this.teamsRepository.updateScore(teamId, totalScore);
  }

  async validateTeamExists(teamId: number): Promise<boolean> {
    const team = await this.teamsRepository.findById(teamId);
    return !!team;
  }

  async validateTeamInEvent(teamId: number, eventId: number): Promise<boolean> {
    const team = await this.teamsRepository.findById(teamId);
    return !!team && team.eventId === eventId;
  }
}
