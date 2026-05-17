import { Injectable } from '@nestjs/common';
import {
  InviteManagementService,
  InviteCreationResult,
  InviteStatistics,
} from './services/invite-management.service';
import {
  RegistrationService,
  RegistrationData,
  RegistrationResult,
} from './services/registration.service';
import { Logger } from 'nestjs-pino';
import {
  CreateInviteData,
  InviteResult,
} from '@repositories/boffmedia/invites.repository';

@Injectable()
export class InvitesFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly inviteManagementService: InviteManagementService,
    private readonly registrationService: RegistrationService,
  ) {}

  // ==================== INVITE OPERATIONS ====================

  async createInvite(
    uuid: string,
    username: string,
  ): Promise<InviteCreationResult> {
    try {
      const inviteId = await this.inviteManagementService.generateInviteId();

      const createData: CreateInviteData = {
        id: inviteId,
        uuid,
        username,
      };

      return await this.inviteManagementService.createInvite(createData);
    } catch (error: any) {
      this.logger.error('Error creating invite:', error);
      return {
        success: false,
        message: `Invite creation failed: ${error.message}`,
      };
    }
  }

  async getAllInvites(): Promise<InviteResult[]> {
    try {
      return await this.inviteManagementService.getAllInvites();
    } catch (error: any) {
      this.logger.error('Error getting all invites:', error);
      throw new Error(`Failed to retrieve invites: ${error.message}`);
    }
  }

  async getInviteById(id: string): Promise<InviteResult | null> {
    try {
      return await this.inviteManagementService.getInviteById(id);
    } catch (error: any) {
      this.logger.error(`Error getting invite ${id}:`, error);
      throw new Error(`Failed to retrieve invite: ${error.message}`);
    }
  }

  async getActiveInviteById(id: string): Promise<InviteResult | null> {
    try {
      return await this.inviteManagementService.getActiveInviteById(id);
    } catch (error: any) {
      this.logger.error(`Error getting active invite ${id}:`, error);
      throw new Error(`Failed to retrieve active invite: ${error.message}`);
    }
  }

  async deleteInvite(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.inviteManagementService.deleteInvite(id);
    } catch (error: any) {
      this.logger.error(`Error deleting invite ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete invite: ${error.message}`,
      };
    }
  }

  async permanentlyDeleteInvite(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.inviteManagementService.permanentlyDeleteInvite(id);
    } catch (error: any) {
      this.logger.error(`Error permanently deleting invite ${id}:`, error);
      return {
        success: false,
        message: `Failed to permanently delete invite: ${error.message}`,
      };
    }
  }

  // ==================== REGISTRATION OPERATIONS ====================

  async registerWithInvite(
    inviteId: string,
    registrationData: RegistrationData,
  ): Promise<RegistrationResult> {
    try {
      // Validate registration data
      const validation =
        await this.registrationService.validateRegistrationData(
          registrationData,
        );
      if (!validation.valid) {
        return {
          success: false,
          message: `Invalid registration data: ${validation.errors.join(', ')}`,
          error: 'VALIDATION_ERROR',
        };
      }

      return await this.registrationService.registerUser(
        inviteId,
        registrationData,
      );
    } catch (error: any) {
      this.logger.error('Error in registration process:', error);
      return {
        success: false,
        message: `Registration failed: ${error.message}`,
        error: 'REGISTRATION_ERROR',
      };
    }
  }

  async canRegisterWithInvite(
    inviteId: string,
  ): Promise<{ canRegister: boolean; message: string }> {
    try {
      return await this.registrationService.canRegisterWithInvite(inviteId);
    } catch (error: any) {
      this.logger.error(
        `Error checking registration eligibility for invite ${inviteId}:`,
        error,
      );
      return {
        canRegister: false,
        message: `Failed to check registration eligibility: ${error.message}`,
      };
    }
  }

  // ==================== INVITE VALIDATION ====================

  async validateInvite(
    id: string,
  ): Promise<{ valid: boolean; message: string; invite?: InviteResult }> {
    try {
      return await this.inviteManagementService.validateInvite(id);
    } catch (error: any) {
      this.logger.error(`Error validating invite ${id}:`, error);
      return {
        valid: false,
        message: `Validation failed: ${error.message}`,
      };
    }
  }

  // ==================== STATISTICS ====================

  async getInviteStatistics(): Promise<InviteStatistics> {
    try {
      return await this.inviteManagementService.getInviteStatistics();
    } catch (error: any) {
      this.logger.error('Error getting invite statistics:', error);
      throw new Error(`Failed to retrieve invite statistics: ${error.message}`);
    }
  }

  // ==================== USER INVITE OPERATIONS ====================

  async getUserInvites(uuid: string): Promise<InviteResult[]> {
    try {
      return await this.inviteManagementService.getInvitesByUser(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting invites for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user invites: ${error.message}`);
    }
  }

  async getUserInvitesByUsername(username: string): Promise<InviteResult[]> {
    try {
      return await this.inviteManagementService.getInvitesByUsername(username);
    } catch (error: any) {
      this.logger.error(
        `Error getting invites for username ${username}:`,
        error,
      );
      throw new Error(`Failed to retrieve username invites: ${error.message}`);
    }
  }
}
