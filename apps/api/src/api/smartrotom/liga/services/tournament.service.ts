import { Injectable } from '@nestjs/common';
import {
  LigaRepository,
  Tournament,
  LeagueMatch,
} from '@api/smartrotom/liga/repositories/liga.repository';

export interface TournamentCreationRequest {
  name: string;
  maxParticipants: number;
  startDate: Date;
  description?: string;
}

export interface TournamentRegistration {
  tournamentId: number;
  playerUuid: string;
}

@Injectable()
export class TournamentService {
  constructor(private readonly ligaRepository: LigaRepository) {}

  async getActiveTournaments(): Promise<Tournament[]> {
    return this.ligaRepository.findActiveTournaments();
  }

  async getTournamentById(tournamentId: number): Promise<Tournament> {
    if (!tournamentId || tournamentId <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    const tournament =
      await this.ligaRepository.findTournamentById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return tournament;
  }

  async getTournamentMatches(tournamentId: number): Promise<LeagueMatch[]> {
    // Validate tournament exists
    await this.getTournamentById(tournamentId);

    return this.ligaRepository.findTournamentMatches(tournamentId);
  }

  async createTournament(
    request: TournamentCreationRequest,
  ): Promise<{ success: boolean; message: string }> {
    // Placeholder for future implementation
    // This would require creating tournaments table and implementing the logic

    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Tournament name is required');
    }

    if (!request.maxParticipants || request.maxParticipants < 4) {
      throw new Error('Tournament must allow at least 4 participants');
    }

    if (request.startDate <= new Date()) {
      throw new Error('Tournament start date must be in the future');
    }

    // For now, return a placeholder response
    throw new Error('Tournament creation is not yet implemented');
  }

  async registerForTournament(
    _registration: TournamentRegistration,
  ): Promise<{ success: boolean; message: string }> {
    // Placeholder for future implementation
    throw new Error('Tournament registration is not yet implemented');
  }

  async validateTournamentExists(tournamentId: number): Promise<boolean> {
    try {
      await this.getTournamentById(tournamentId);
      return true;
    } catch {
      return false;
    }
  }
}
