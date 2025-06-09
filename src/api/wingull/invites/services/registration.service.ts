import { Injectable } from '@nestjs/common';
import { InviteManagementService } from './invite-management.service';
import { UsersService } from '@api/boffmedia/users/users.service';
import { UsersFacadeService } from '@api/smartrotom/users/users.facade.service';
import { shortToLongUUID } from '@/_utils/stringUtils';
import { BoffMediaUser } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';

export interface RegistrationData {
  username: string;
  mc_username: string;
  email: string;
  password: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  user?: {
    uuid: string;
    username: string;
    email: string;
  };
  error?: string;
}

export interface MinecraftUser {
  id: string;
  name: string;
}

@Injectable()
export class RegistrationService {
  constructor(
    private readonly inviteManagementService: InviteManagementService,
    private readonly boffMediaUsersService: UsersService,
    private readonly smartRotomUsersService: UsersFacadeService,
  ) {}

  // ==================== REGISTRATION OPERATIONS ====================

  async registerUser(inviteId: string, registrationData: RegistrationData): Promise<RegistrationResult> {
    try {
      console.log(`Starting registration process for invite ${inviteId}`);

      // 1. Validate the invite
      const inviteValidation = await this.inviteManagementService.validateInvite(inviteId);
      if (!inviteValidation.valid) {
        return {
          success: false,
          message: inviteValidation.message,
          error: 'INVALID_INVITE'
        };
      }

      // 2. Validate Minecraft username
      const minecraftUser = await this.validateMinecraftUsername(registrationData.mc_username);
      if (!minecraftUser) {
        return {
          success: false,
          message: 'Invalid Minecraft username',
          error: 'INVALID_MINECRAFT_USERNAME'
        };
      }

      // 3. Convert short UUID to long UUID
      const uuid = shortToLongUUID(minecraftUser.id);
      console.log(`Minecraft UUID: ${minecraftUser.id} -> ${uuid}`);

      // 4. Create SmartRotom user first
      const smartRotomUser: SmartRotomUser = {
        uuid,
        username: registrationData.username,
      } as SmartRotomUser;

      const smartRotomResult = await this.smartRotomUsersService.createUser(smartRotomUser);
      if ('error' in smartRotomResult) {
        console.error('Error creating SmartRotom user:', smartRotomResult.error);
        return {
          success: false,
          message: 'Failed to create SmartRotom user',
          error: 'SMARTROTOM_USER_CREATION_FAILED'
        };
      }

      // 5. Create BoffMedia user
      const boffMediaUser: BoffMediaUser = {
        email: registrationData.email,
        password: registrationData.password,
        username: registrationData.username,
        uuid: uuid,
      } as BoffMediaUser;

      const boffMediaResult = await this.boffMediaUsersService.create(boffMediaUser, smartRotomResult);
      if ('error' in boffMediaResult) {
        console.error('Error creating BoffMedia user:', boffMediaResult.error);
        
        // TODO: Rollback SmartRotom user creation if needed
        
        return {
          success: false,
          message: 'Failed to create BoffMedia user',
          error: 'BOFFMEDIA_USER_CREATION_FAILED'
        };
      }

      // 6. Mark invite as used
      const markUsedResult = await this.inviteManagementService.markInviteAsUsed(inviteId);
      if (!markUsedResult.success) {
        console.error('Error marking invite as used:', markUsedResult.message);
        // This is not a critical error, so we'll continue
      }

      console.log('User registration completed successfully');
      
      return {
        success: true,
        message: 'User registered successfully',
        user: {
          uuid,
          username: registrationData.username,
          email: registrationData.email
        }
      };

    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: `Registration failed: ${error.message}`,
        error: 'REGISTRATION_ERROR'
      };
    }
  }

  // ==================== MINECRAFT VALIDATION ====================

  private async validateMinecraftUsername(username: string): Promise<MinecraftUser | null> {
    try {
      console.log(`Validating Minecraft username: ${username}`);
      
      const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
      
      if (!response.ok) {
        console.error(`Minecraft API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.id || !data.name) {
        console.error('Invalid response from Minecraft API:', data);
        return null;
      }

      console.log(`Minecraft user found: ${data.name} (${data.id})`);
      return {
        id: data.id,
        name: data.name
      };

    } catch (error) {
      console.error('Error validating Minecraft username:', error);
      return null;
    }
  }

  // ==================== REGISTRATION VALIDATION ====================

  async validateRegistrationData(data: RegistrationData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate username
    if (!data.username || data.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (data.username && data.username.length > 32) {
      errors.push('Username must be less than 32 characters');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate password
    if (!data.password || data.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Validate Minecraft username
    if (!data.mc_username || data.mc_username.length < 3) {
      errors.push('Minecraft username must be at least 3 characters long');
    }

    if (data.mc_username && data.mc_username.length > 16) {
      errors.push('Minecraft username must be less than 16 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== UTILITY METHODS ====================

  async canRegisterWithInvite(inviteId: string): Promise<{ canRegister: boolean; message: string }> {
    try {
      const validation = await this.inviteManagementService.validateInvite(inviteId);
      
      if (!validation.valid) {
        return {
          canRegister: false,
          message: validation.message
        };
      }

      return {
        canRegister: true,
        message: 'Invite is valid for registration'
      };
    } catch (error) {
      console.error(`Failed to check registration eligibility for invite ${inviteId}:`, error);
      return {
        canRegister: false,
        message: `Validation failed: ${error.message}`
      };
    }
  }
}