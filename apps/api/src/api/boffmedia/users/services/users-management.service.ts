import {
  HttpException,
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { PasswordService } from '@api/auth/password.service';
import {
  BoffMediaUserSafe,
  FullUserData,
  FullUserDataSafe,
} from '../repositories/interfaces/users.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Logger } from 'nestjs-pino';

export interface UserCreationResult {
  user: BoffMediaUserSafe;
  isNew: boolean;
}

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  /** Linked Minecraft uuid; minted as the `mcUuid` JWT claim. */
  mcUuid?: string;
  smartRotomUser: {
    username: string;
    uuid: string;
    world: string;
  } | null;
}

export interface GoogleUserData {
  email: string;
  name: string;
  googleId: string;
  profilePicture?: string;
}

export interface DiscordUserData {
  discordId: string;
  // Discord only returns an email when the `email` scope is granted; account
  // creation requires it, but linking by discordId does not.
  email?: string;
  name?: string;
  profilePicture?: string;
}

export interface TwitchUserData {
  twitchId: string;
  // Twitch only returns an email with the `user:read:email` scope and a verified
  // address; account creation requires it, linking by twitchId does not.
  email?: string;
  name?: string;
  profilePicture?: string;
}

export interface MinecraftRegistrationData {
  username: string;
  email: string;
  password: string;
  minecraft: {
    username: string;
    uuid: string;
    world: string;
  };
}

export interface MinecraftLinkData {
  username: string;
  email: string;
  password: string;
  minecraft: {
    username: string;
    uuid: string;
    world: string;
  };
}

@Injectable()
export class BoffMediaUsersManagementService {
  private readonly saltRounds = 12;

  constructor(
    private readonly logger: Logger,

    private readonly usersRepository: BoffMediaUsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  // ==================== USER CREATION ====================

  async createUser(userData: CreateUserDto): Promise<BoffMediaUserSafe> {
    // Validate input
    const validation = this.validateUserData(userData);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid user data: ${validation.errors.join(', ')}`,
      );
    }

    try {
      // Check for existing users
      const existingUsers = await this.usersRepository.checkMultipleFieldsExist(
        {
          username: userData.username,
          email: userData.email,
          uuid: userData.uuid,
        },
      );

      if (existingUsers.length > 0) {
        const conflicts = [];
        if (existingUsers.some((u) => u.username === userData.username)) {
          conflicts.push('username');
        }
        if (existingUsers.some((u) => u.email === userData.email)) {
          conflicts.push('email');
        }
        if (
          userData.uuid &&
          existingUsers.some((u) => u.uuid === userData.uuid)
        ) {
          conflicts.push('uuid');
        }
        throw new ConflictException(
          `User already exists with: ${conflicts.join(', ')}`,
        );
      }

      // Hash password using PasswordService
      const hashedPassword = await this.passwordService.hashPassword(
        userData.password,
      );

      // Create user with hashed password
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword,
        profilePicture:
          userData.profilePicture ||
          'https://cdn.boffmedia.es/default-profile.png',
      };

      this.logger.log('Creating new BoffMedia user:', {
        username: userData.username,
        email: userData.email,
      });
      const newUser = await this.usersRepository.createUser(
        userDataWithHashedPassword,
      );

      // Create participant entry
      await this.usersRepository.createParticipant(
        newUser.id,
        newUser.username,
      );

      return newUser;
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error('Failed to create user:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async findOrCreateUser(userData: CreateUserDto): Promise<UserCreationResult> {
    try {
      // Try to find existing user by username or email
      let user = await this.usersRepository.findUserByUsername(
        userData.username,
      );

      if (!user && userData.email) {
        user = await this.usersRepository.findUserByEmail(userData.email);
      }

      if (user) {
        return { user, isNew: false };
      }

      // Create new user if not found
      const newUser = await this.createUser(userData);
      return { user: newUser, isNew: true };
    } catch (error: any) {
      this.logger.error('Error in findOrCreateUser:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to find or create user: ${error.message}`);
    }
  }

  // ==================== USER RETRIEVAL ====================

  async getAllUsers(): Promise<BoffMediaUserSafe[]> {
    try {
      return await this.usersRepository.findAllUsers();
    } catch (error: any) {
      this.logger.error('Failed to get all users:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async getUserById(id: number): Promise<BoffMediaUserSafe | null> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }

    try {
      return await this.usersRepository.findUserById(id);
    } catch (error: any) {
      this.logger.error(`Failed to get user by ID ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByUsername(username: string): Promise<BoffMediaUserSafe | null> {
    if (!username || username.trim() === '') {
      throw new BadRequestException('Username is required');
    }

    try {
      return await this.usersRepository.findUserByUsername(username);
    } catch (error: any) {
      this.logger.error(`Failed to get user by username ${username}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<BoffMediaUserSafe | null> {
    if (!email || email.trim() === '') {
      throw new BadRequestException('Email is required');
    }

    try {
      return await this.usersRepository.findUserByEmail(email);
    } catch (error: any) {
      this.logger.error(`Failed to get user by email ${email}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByUuid(uuid: string): Promise<BoffMediaUserSafe | null> {
    if (!uuid || uuid.trim() === '') {
      throw new BadRequestException('UUID is required');
    }

    try {
      return await this.usersRepository.findUserByUuid(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get user by UUID ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByGoogleId(googleId: string): Promise<BoffMediaUserSafe | null> {
    if (!googleId || googleId.trim() === '') {
      throw new BadRequestException('Google ID is required');
    }

    try {
      return await this.usersRepository.findUserByGoogleId(googleId);
    } catch (error: any) {
      this.logger.error(`Failed to get user by Google ID ${googleId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByDiscordId(
    discordId: string,
  ): Promise<BoffMediaUserSafe | null> {
    if (!discordId || discordId.trim() === '') {
      throw new BadRequestException('Discord ID is required');
    }

    try {
      return await this.usersRepository.findUserByDiscordId(discordId);
    } catch (error: any) {
      this.logger.error(
        `Failed to get user by Discord ID ${discordId}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByTwitchId(twitchId: string): Promise<BoffMediaUserSafe | null> {
    if (!twitchId || twitchId.trim() === '') {
      throw new BadRequestException('Twitch ID is required');
    }

    try {
      return await this.usersRepository.findUserByTwitchId(twitchId);
    } catch (error: any) {
      this.logger.error(`Failed to get user by Twitch ID ${twitchId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  // ==================== FULL USER RETRIEVAL ====================
  async getFullUserByUsernameWithPassword(
    username: string,
  ): Promise<FullUserData | null> {
    if (!username || username.trim() === '') {
      throw new BadRequestException('Username is required');
    }

    try {
      return await this.usersRepository.findFullUserByUsernameWithPassword(
        username,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to get full user by username ${username}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve full user: ${error.message}`);
    }
  }

  async getFullUserByUsername(
    username: string,
  ): Promise<FullUserDataSafe | null> {
    if (!username || username.trim() === '') {
      throw new BadRequestException('Username is required');
    }

    try {
      return await this.usersRepository.findFullUserByUsername(username);
    } catch (error: any) {
      this.logger.error(
        `Failed to get full user by username ${username}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve full user: ${error.message}`);
    }
  }

  async getFullUserByEmail(email: string): Promise<FullUserDataSafe | null> {
    if (!email || email.trim() === '') {
      throw new BadRequestException('Email is required');
    }

    try {
      return await this.usersRepository.findFullUserByEmail(email);
    } catch (error: any) {
      this.logger.error(`Failed to get full user by email ${email}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve full user: ${error.message}`);
    }
  }

  async getFullUserByUuid(uuid: string): Promise<FullUserDataSafe | null> {
    if (!uuid || uuid.trim() === '') {
      throw new BadRequestException('UUID is required');
    }

    try {
      return await this.usersRepository.findFullUserByUuid(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get full user by UUID ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve full user: ${error.message}`);
    }
  }

  // ==================== USER UPDATE ====================

  async updateUser(
    id: number,
    updateData: UpdateUserDto,
  ): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }

    // Validate update data
    if (updateData.username && !this.isValidUsername(updateData.username)) {
      throw new BadRequestException('Invalid username format');
    }

    if (updateData.email && !this.isValidEmail(updateData.email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      // Password and OAuth-identity changes are intentionally NOT handled here.
      // UpdateUserDto carries no `password`/`googleId`/`discordId`/`uuid`, so a
      // generic profile update cannot overwrite credentials or hijack an
      // account. Password change belongs to its own owner-checked endpoint.
      return await this.usersRepository.updateUser(id, updateData);
    } catch (error: any) {
      this.logger.error(`Failed to update user ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  /**
   * Change a user's password. Verifies the current password first, so this is
   * the only path that can set a password (the generic update can't). OAuth-only
   * accounts (no local password) can't use it.
   */
  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }

    const user = await this.usersRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const full = await this.usersRepository.findFullUserByUsernameWithPassword(
      user.username,
    );
    if (!full?.boffmedia_users.password) {
      throw new BadRequestException(
        'This account has no password (linked via an OAuth provider)',
      );
    }

    const currentValid = await this.passwordService.verifyPassword(
      currentPassword,
      full.boffmedia_users.password,
    );
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const validation = this.passwordService.validatePassword(newPassword);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Password validation failed: ${validation.errors.join(', ')}`,
      );
    }

    const hashed = await this.passwordService.hashPassword(newPassword);
    await this.usersRepository.updateUser(id, { password: hashed });
    return { success: true };
  }

  // ==================== PROVIDER LINKING ====================

  /**
   * Link a verified SteamID64 to a user. Steam has no OAuth login of its own
   * (OpenID, no email) — it is link-only, attached to an already-authenticated
   * account. The web verifies the Steam OpenID assertion before calling this.
   */
  async linkSteam(id: number, steamId: string): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      throw new BadRequestException('A valid SteamID64 is required');
    }

    // Refuse to steal a SteamID already linked to a different account.
    const owner = await this.usersRepository.findUserBySteamId(steamId);
    if (owner && owner.id !== id) {
      throw new ConflictException(
        'This Steam account is already linked to another user',
      );
    }

    try {
      return await this.usersRepository.updateUser(id, {
        steamId,
      } as UpdateUserDto);
    } catch (error: any) {
      this.logger.error(`Failed to link Steam for user ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Steam link failed: ${error.message}`);
    }
  }

  /**
   * Attach a Discord id to a user, by user id — session-preserving linking from
   * the profile (as opposed to Discord *login*, which merges by email). The web
   * verifies the Discord OAuth handshake before calling this.
   */
  async linkDiscord(id: number, discordId: string): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }
    if (!discordId || !/^\d{5,32}$/.test(discordId)) {
      throw new BadRequestException('A valid Discord ID is required');
    }

    // Refuse to steal a Discord account already linked to someone else.
    const owner = await this.usersRepository.findUserByDiscordId(discordId);
    if (owner && owner.id !== id) {
      throw new ConflictException(
        'This Discord account is already linked to another user',
      );
    }

    try {
      return await this.usersRepository.updateUser(id, {
        discordId,
      } as UpdateUserDto);
    } catch (error: any) {
      this.logger.error(`Failed to link Discord for user ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Discord link failed: ${error.message}`);
    }
  }

  /**
   * Attach a Google id (`sub`) to a user, by user id — session-preserving
   * linking from the profile (as opposed to Google *login*, which merges by
   * email). The web verifies the Google OAuth handshake before calling this.
   */
  async linkGoogle(id: number, googleId: string): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }
    if (!googleId || googleId.trim() === '' || googleId.length > 255) {
      throw new BadRequestException('A valid Google ID is required');
    }

    // Refuse to steal a Google account already linked to someone else.
    const owner = await this.usersRepository.findUserByGoogleId(googleId);
    if (owner && owner.id !== id) {
      throw new ConflictException(
        'This Google account is already linked to another user',
      );
    }

    try {
      return await this.usersRepository.updateUser(id, {
        googleId,
      } as UpdateUserDto);
    } catch (error: any) {
      this.logger.error(`Failed to link Google for user ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Google link failed: ${error.message}`);
    }
  }

  /**
   * Attach a Twitch id to a user, by user id — session-preserving linking from
   * the profile (as opposed to Twitch *login*, which merges by email). The web
   * verifies the Twitch OAuth handshake before calling this.
   */
  async linkTwitch(id: number, twitchId: string): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }
    if (!twitchId || !/^\d{1,20}$/.test(twitchId)) {
      throw new BadRequestException('A valid Twitch ID is required');
    }

    // Refuse to steal a Twitch account already linked to someone else.
    const owner = await this.usersRepository.findUserByTwitchId(twitchId);
    if (owner && owner.id !== id) {
      throw new ConflictException(
        'This Twitch account is already linked to another user',
      );
    }

    try {
      return await this.usersRepository.updateUser(id, {
        twitchId,
      } as UpdateUserDto);
    } catch (error: any) {
      this.logger.error(`Failed to link Twitch for user ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Twitch link failed: ${error.message}`);
    }
  }

  /**
   * Clear a linked provider id (google/discord/twitch/steam) on a user.
   * Only removes the link — re-linking happens through the normal flow.
   */
  async unlinkProvider(
    id: number,
    provider: 'google' | 'discord' | 'twitch' | 'steam',
  ): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }

    const column = {
      google: 'googleId',
      discord: 'discordId',
      twitch: 'twitchId',
      steam: 'steamId',
    }[provider] as
      | 'googleId'
      | 'discordId'
      | 'twitchId'
      | 'steamId'
      | undefined;

    if (!column) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    try {
      return await this.usersRepository.updateUser(id, {
        [column]: null,
      } as UpdateUserDto);
    } catch (error: any) {
      this.logger.error(`Failed to unlink ${provider} for user ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Provider unlink failed: ${error.message}`);
    }
  }

  // ==================== USER DELETION ====================

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ID is required');
    }

    try {
      const success = await this.usersRepository.deleteUser(id);

      return {
        success,
        message: success
          ? 'User deleted successfully'
          : 'Failed to delete user',
      };
    } catch (error: any) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      return {
        success: false,
        message: `User deletion failed: ${error.message}`,
      };
    }
  }

  // ==================== AUTHENTICATION ====================

  async validateUser(
    username: string,
    password: string,
  ): Promise<SessionUser | null> {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    try {
      const fullUser = await this.getFullUserByUsernameWithPassword(username);
      if (!fullUser) {
        return null;
      }

      // OAuth-only accounts have no local password → credentials login can't apply.
      if (!fullUser.boffmedia_users.password) {
        return null;
      }

      // Use PasswordService for verification
      const isValidPassword = await this.passwordService.verifyPassword(
        password,
        fullUser.boffmedia_users.password,
      );
      if (!isValidPassword) {
        return null;
      }

      const roles = await this.getUserRoles(fullUser.boffmedia_users.id);
      return this.createSessionUser(fullUser, roles);
    } catch (error: any) {
      this.logger.error(`Failed to validate user ${username}:`, error);
      return null;
    }
  }

  // ==================== GOOGLE AUTHENTICATION ====================

  async createFromGoogle(googleUser: GoogleUserData): Promise<SessionUser> {
    try {
      // Resolve by google id first (when the caller sent one — older login
      // requests didn't, and getUserByGoogleId throws on an empty id).
      let existingUser = googleUser.googleId
        ? await this.getUserByGoogleId(googleUser.googleId)
        : null;

      if (!existingUser) {
        // Check by email
        existingUser = await this.getUserByEmail(googleUser.email);

        if (existingUser) {
          // Link Google to the existing account. Goes straight to the repository:
          // googleId is not a public UpdateUserDto field (account-takeover guard).
          existingUser = await this.usersRepository.updateUser(
            existingUser.id,
            {
              googleId: googleUser.googleId,
              profilePicture:
                googleUser.profilePicture || existingUser.profilePicture,
              // Google verifies the address — trust it.
              emailVerified: true,
            },
          );
        } else {
          // Create new user with secure random password
          const userData: CreateUserDto = {
            email: googleUser.email,
            username: this.generateUsernameFromEmail(googleUser.email),
            password: this.passwordService.generateOAuthPassword(), // Use PasswordService
            googleId: googleUser.googleId,
            profilePicture:
              googleUser.profilePicture ||
              'https://cdn.boffmedia.es/default-profile.png',
          };

          existingUser = await this.createUser(userData);
          // Google verifies the address — new Google accounts start verified.
          existingUser = await this.usersRepository.updateUser(
            existingUser.id,
            { emailVerified: true },
          );
        }
      }

      const fullUser = await this.getFullUserByUsernameWithPassword(
        existingUser.username,
      );
      if (!fullUser) {
        throw new Error(
          'Failed to retrieve full user data after Google authentication',
        );
      }

      const roles = await this.getUserRoles(fullUser.boffmedia_users.id);
      return this.createSessionUser(fullUser, roles);
    } catch (error: any) {
      this.logger.error('Failed to create user from Google:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  // ==================== DISCORD AUTHENTICATION ====================

  async createFromDiscord(discordUser: DiscordUserData): Promise<SessionUser> {
    try {
      // Resolve by discordId first (returning Discord user).
      let existingUser = await this.getUserByDiscordId(discordUser.discordId);

      if (!existingUser) {
        // Then by email — links Discord to an existing account.
        if (discordUser.email) {
          existingUser = await this.getUserByEmail(discordUser.email);
        }

        if (existingUser) {
          // Attach discordId to the matched account. Straight to the repository:
          // discordId is not a public UpdateUserDto field (account-takeover guard).
          existingUser = await this.usersRepository.updateUser(
            existingUser.id,
            {
              discordId: discordUser.discordId,
              profilePicture:
                discordUser.profilePicture || existingUser.profilePicture,
              // Discord returns the email only for verified accounts — trust it.
              emailVerified: true,
            },
          );
        } else {
          // A brand-new Discord account needs an email to onboard (email is
          // NOT NULL). The web requests the `email` scope, so this is expected.
          if (!discordUser.email) {
            throw new Error('Discord did not provide an email address');
          }

          const userData: CreateUserDto = {
            email: discordUser.email,
            username: this.generateUsernameFromEmail(discordUser.email),
            password: this.passwordService.generateOAuthPassword(),
            discordId: discordUser.discordId,
            profilePicture:
              discordUser.profilePicture ||
              'https://cdn.boffmedia.es/default-profile.png',
          };

          existingUser = await this.createUser(userData);
          existingUser = await this.usersRepository.updateUser(
            existingUser.id,
            {
              emailVerified: true,
            },
          );
        }
      }

      const fullUser = await this.getFullUserByUsernameWithPassword(
        existingUser.username,
      );
      if (!fullUser) {
        throw new Error(
          'Failed to retrieve full user data after Discord authentication',
        );
      }

      const roles = await this.getUserRoles(fullUser.boffmedia_users.id);
      return this.createSessionUser(fullUser, roles);
    } catch (error: any) {
      this.logger.error('Failed to create user from Discord:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Discord authentication failed: ${error.message}`);
    }
  }

  // ==================== TWITCH AUTHENTICATION ====================

  async createFromTwitch(twitchUser: TwitchUserData): Promise<SessionUser> {
    try {
      // Resolve by twitchId first (returning Twitch user).
      let existingUser = await this.getUserByTwitchId(twitchUser.twitchId);

      if (!existingUser) {
        // Then by email — links Twitch to an existing account.
        if (twitchUser.email) {
          existingUser = await this.getUserByEmail(twitchUser.email);
        }

        if (existingUser) {
          // Attach twitchId to the matched account. Straight to the repository:
          // twitchId is not a public UpdateUserDto field (account-takeover guard).
          existingUser = await this.usersRepository.updateUser(
            existingUser.id,
            {
              twitchId: twitchUser.twitchId,
              profilePicture:
                twitchUser.profilePicture || existingUser.profilePicture,
              // Twitch returns the email only for verified accounts — trust it.
              emailVerified: true,
            },
          );
        } else {
          // A brand-new Twitch account needs an email to onboard (email is
          // NOT NULL). The web requests the `user:read:email` scope.
          if (!twitchUser.email) {
            throw new Error('Twitch did not provide an email address');
          }

          const userData: CreateUserDto = {
            email: twitchUser.email,
            username: this.generateUsernameFromEmail(twitchUser.email),
            password: this.passwordService.generateOAuthPassword(),
            twitchId: twitchUser.twitchId,
            profilePicture:
              twitchUser.profilePicture ||
              'https://cdn.boffmedia.es/default-profile.png',
          };

          existingUser = await this.createUser(userData);
          existingUser = await this.usersRepository.updateUser(
            existingUser.id,
            {
              emailVerified: true,
            },
          );
        }
      }

      const fullUser = await this.getFullUserByUsernameWithPassword(
        existingUser.username,
      );
      if (!fullUser) {
        throw new Error(
          'Failed to retrieve full user data after Twitch authentication',
        );
      }

      const roles = await this.getUserRoles(fullUser.boffmedia_users.id);
      return this.createSessionUser(fullUser, roles);
    } catch (error: any) {
      this.logger.error('Failed to create user from Twitch:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Twitch authentication failed: ${error.message}`);
    }
  }

  // ==================== MINECRAFT INTEGRATION ====================

  async createMinecraftUser(
    registerData: MinecraftRegistrationData,
  ): Promise<BoffMediaUserSafe> {
    try {
      const userData: CreateUserDto = {
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
        uuid: registerData.minecraft.uuid,
      };

      return await this.createUser(userData);
    } catch (error: any) {
      this.logger.error('Failed to create Minecraft user:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Minecraft user creation failed: ${error.message}`);
    }
  }

  /** Records an already-proved Minecraft identity on an account. `uuid` is not a
   *  public UpdateUserDto field, so it goes through the repository directly. */
  async setMinecraftUuid(
    userId: number,
    uuid: string,
  ): Promise<BoffMediaUserSafe> {
    return this.usersRepository.updateUser(userId, { uuid });
  }

  async linkMinecraftAccount(
    linkData: MinecraftLinkData,
  ): Promise<BoffMediaUserSafe> {
    try {
      // Validate user credentials first
      const sessionUser = await this.validateUser(
        linkData.username,
        linkData.password,
      );
      if (!sessionUser) {
        throw new BadRequestException('Invalid credentials');
      }

      // Find the user and update with Minecraft UUID
      const user = await this.getUserByUsername(linkData.username);
      if (!user) {
        throw new Error('User not found');
      }

      // uuid is not a public UpdateUserDto field → link via the repository.
      return await this.usersRepository.updateUser(user.id, {
        uuid: linkData.minecraft.uuid,
      });
    } catch (error: any) {
      this.logger.error('Failed to link Minecraft account:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Minecraft account linking failed: ${error.message}`);
    }
  }

  // ==================== ROLES MANAGEMENT ====================

  async getUserRoles(userId: number): Promise<string[]> {
    if (!userId || userId <= 0) {
      throw new BadRequestException('Valid user ID is required');
    }

    try {
      return await this.usersRepository.getUserRoles(userId);
    } catch (error: any) {
      this.logger.error(`Failed to get user roles for ${userId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async getUserCount(): Promise<number> {
    try {
      return await this.usersRepository.getUserCount();
    } catch (error: any) {
      this.logger.error('Failed to get user count:', error);
      return 0;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private createSessionUser(
    fullUser: FullUserData,
    roles: string[] = [],
  ): SessionUser {
    return {
      id: fullUser.boffmedia_users.id,
      name: fullUser.boffmedia_users.username,
      email: fullUser.boffmedia_users.email,
      roles,
      // Load-bearing: `@CurrentMcUuid()` 403s without it, and `assertActsAsSelf`
      // silently skips ownership checks without it.
      mcUuid: fullUser.boffmedia_users.uuid ?? undefined,
      smartRotomUser: fullUser.rotom_users
        ? {
            username: fullUser.rotom_users.username,
            uuid: fullUser.rotom_users.uuid,
            world: fullUser.rotom_users.world || '',
          }
        : null,
    };
  }

  private generateUsernameFromEmail(email: string): string {
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${baseUsername}${randomSuffix}`;
  }

  // ==================== VALIDATION METHODS ====================

  private validateUserData(userData: CreateUserDto): UserValidationResult {
    const errors: string[] = [];

    this.logger.log('Validating user data:', userData);

    if (!userData.email || userData.email.trim() === '') {
      errors.push('Email is required');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (!userData.username || userData.username.trim() === '') {
      errors.push('Username is required');
    } else if (!this.isValidUsername(userData.username)) {
      errors.push('Invalid username format');
    }

    if (!userData.password || userData.password.trim() === '') {
      errors.push('Password is required');
    } else if (!this.isValidPassword(userData.password)) {
      errors.push('Password must be at least 6 characters long');
    }

    if (userData.uuid && !this.isValidUuid(userData.uuid)) {
      errors.push('Invalid UUID format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUsername(username: string): boolean {
    // Username: 3-32 characters, alphanumeric, underscores, hyphens
    return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  private isValidUuid(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      uuid,
    );
  }
}
