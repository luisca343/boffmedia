import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  InvitesRepository,
  CreateInviteData,
  InviteResult,
} from '@repositories/boffmedia/invites.repository';

export interface InviteCreationResult {
  success: boolean;
  invite?: InviteResult;
  message?: string;
}

export interface InviteStatistics {
  total: number;
  active: number;
  used: number;
  deleted: number;
}

@Injectable()
export class InviteManagementService {
  constructor(
    private readonly logger: Logger,
    private readonly invitesRepository: InvitesRepository,
  ) {}

  // ==================== INVITE CREATION ====================

  async createInvite(data: CreateInviteData): Promise<InviteCreationResult> {
    try {
      // Check if invite with this ID already exists
      const existingInvite = await this.invitesRepository.findInviteById(
        data.id,
      );
      if (existingInvite) {
        return {
          success: false,
          message: 'Invite with this ID already exists',
        };
      }

      const result = await this.invitesRepository.createInvite(data);

      if (result.success) {
        return {
          success: true,
          invite: result.invite,
          message: 'Invite created successfully',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to create invite',
        };
      }
    } catch (error: any) {
      this.logger.error('Failed to create invite:', error);
      return {
        success: false,
        message: `Invite creation failed: ${error.message}`,
      };
    }
  }

  // ==================== INVITE RETRIEVAL ====================

  async getAllInvites(): Promise<InviteResult[]> {
    try {
      return await this.invitesRepository.findAllInvites();
    } catch (error: any) {
      this.logger.error('Failed to get all invites:', error);
      throw new Error(`Invites retrieval failed: ${error.message}`);
    }
  }

  async getInviteById(id: string): Promise<InviteResult | null> {
    try {
      return await this.invitesRepository.findInviteById(id);
    } catch (error: any) {
      this.logger.error(`Failed to get invite ${id}:`, error);
      throw new Error(`Invite retrieval failed: ${error.message}`);
    }
  }

  async getActiveInviteById(id: string): Promise<InviteResult | null> {
    try {
      return await this.invitesRepository.findActiveInviteById(id);
    } catch (error: any) {
      this.logger.error(`Failed to get active invite ${id}:`, error);
      throw new Error(`Active invite retrieval failed: ${error.message}`);
    }
  }

  async getInvitesByUser(uuid: string): Promise<InviteResult[]> {
    try {
      return await this.invitesRepository.findInvitesByUuid(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get invites for user ${uuid}:`, error);
      throw new Error(`User invites retrieval failed: ${error.message}`);
    }
  }

  async getInvitesByUsername(username: string): Promise<InviteResult[]> {
    try {
      return await this.invitesRepository.findInvitesByUsername(username);
    } catch (error: any) {
      this.logger.error(
        `Failed to get invites for username ${username}:`,
        error,
      );
      throw new Error(`Username invites retrieval failed: ${error.message}`);
    }
  }

  // ==================== INVITE STATUS MANAGEMENT ====================

  async markInviteAsUsed(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if invite exists and is active
      const invite = await this.invitesRepository.findActiveInviteById(id);
      if (!invite) {
        return {
          success: false,
          message: 'Invite not found or already used/deleted',
        };
      }

      const result = await this.invitesRepository.markInviteAsUsed(id);

      if (result.success) {
        return {
          success: true,
          message: 'Invite marked as used successfully',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to mark invite as used',
        };
      }
    } catch (error: any) {
      this.logger.error(`Failed to mark invite ${id} as used:`, error);
      return {
        success: false,
        message: `Mark as used failed: ${error.message}`,
      };
    }
  }

  async deleteInvite(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if invite exists
      const invite = await this.invitesRepository.findInviteById(id);
      if (!invite) {
        return {
          success: false,
          message: 'Invite not found',
        };
      }

      const result = await this.invitesRepository.markInviteAsDeleted(id);

      if (result.success) {
        return {
          success: true,
          message: 'Invite deleted successfully',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to delete invite',
        };
      }
    } catch (error: any) {
      this.logger.error(`Failed to delete invite ${id}:`, error);
      return {
        success: false,
        message: `Invite deletion failed: ${error.message}`,
      };
    }
  }

  async permanentlyDeleteInvite(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if invite exists
      const invite = await this.invitesRepository.findInviteById(id);
      if (!invite) {
        return {
          success: false,
          message: 'Invite not found',
        };
      }

      const result = await this.invitesRepository.deleteInvite(id);

      if (result.success) {
        return {
          success: true,
          message: 'Invite permanently deleted successfully',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to permanently delete invite',
        };
      }
    } catch (error: any) {
      this.logger.error(`Failed to permanently delete invite ${id}:`, error);
      return {
        success: false,
        message: `Permanent deletion failed: ${error.message}`,
      };
    }
  }

  // ==================== INVITE VALIDATION ====================

  async validateInvite(
    id: string,
  ): Promise<{ valid: boolean; message: string; invite?: InviteResult }> {
    try {
      const invite = await this.invitesRepository.findInviteById(id);

      if (!invite) {
        return {
          valid: false,
          message: 'Invite not found',
        };
      }

      if (invite.usedAt) {
        return {
          valid: false,
          message: 'Invite has already been used',
          invite,
        };
      }

      if (invite.deletedAt) {
        return {
          valid: false,
          message: 'Invite has been deleted',
          invite,
        };
      }

      return {
        valid: true,
        message: 'Invite is valid and active',
        invite,
      };
    } catch (error: any) {
      this.logger.error(`Failed to validate invite ${id}:`, error);
      return {
        valid: false,
        message: `Validation failed: ${error.message}`,
      };
    }
  }

  // ==================== INVITE STATISTICS ====================

  async getInviteStatistics(): Promise<InviteStatistics> {
    try {
      const [total, active, used] = await Promise.all([
        this.invitesRepository.getInviteCount(),
        this.invitesRepository.getActiveInviteCount(),
        this.invitesRepository.getUsedInviteCount(),
      ]);

      return {
        total,
        active,
        used,
        deleted: total - active - used,
      };
    } catch (error: any) {
      this.logger.error('Failed to get invite statistics:', error);
      throw new Error(`Statistics retrieval failed: ${error.message}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  async isInviteValid(id: string): Promise<boolean> {
    try {
      const validation = await this.validateInvite(id);
      return validation.valid;
    } catch (error: any) {
      this.logger.error(`Failed to check invite validity ${id}:`, error);
      return false;
    }
  }

  async generateInviteId(): Promise<string> {
    // Generate a 6-character invite ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    // Check if this ID already exists
    const existingInvite = await this.invitesRepository.findInviteById(result);
    if (existingInvite) {
      // Recursively generate a new ID if this one exists
      return await this.generateInviteId();
    }

    return result;
  }
}
