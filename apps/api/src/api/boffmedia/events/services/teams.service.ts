import { Injectable } from '@nestjs/common';
import { TeamsRepository } from '../../../_repositories/boffmedia/teams.repository';
import { ParticipantsService } from './participants.service';
import { EventTeam, EventTeamMember } from '@/_db/schema/BoffMediaEvents';
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

    // 2. Create the team
    const teamData = {
      eventId,
      name: createTeamDto.name,
      tag: createTeamDto.tag,
      icon: createTeamDto.icon,
    };

    const result = await this.teamsRepository.create(teamData);
    const teamId = result.insertId;

    // 3. Add leader as team member with leader role
    const memberData = {
      teamId,
      participantId: leaderParticipant.id,
      role: 'leader' as const,
    };

    await this.teamsRepository.addMember(memberData);

    // 4. Add leader to event participants
    await this.participantsService.joinEvent(eventId, leaderParticipant.id, {
      userId: leaderParticipant.userId!,
      comment: `Created team ${createTeamDto.name}`,
    });

    return this.getTeamById(teamId);
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

    // 2. Check if participant is already in a team for this event
    const existingTeam = await this.teamsRepository.findParticipantTeamInEvent(
      participant.id,
      eventId,
    );

    if (existingTeam.length > 0) {
      throw new Error('Participant is already in a team for this event');
    }

    // 3. Add participant to team members
    const memberData = {
      teamId,
      participantId: participant.id,
      role: 'member' as const,
    };

    await this.teamsRepository.addMember(memberData);

    // 4. Add to event participants
    await this.participantsService.joinEvent(eventId, participant.id, {
      userId: participant.userId!,
      comment: `Joined team ${teamId}`,
    });

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
      throw new Error('Participant is not a member of this team');
    }

    if (member.role === 'leader') {
      throw new Error(
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
