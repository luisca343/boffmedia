import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RotomUser } from '@/_db/schema/SmartRotom';
import { CreateSmartrotomUserDto } from '../dto/create-user.dto';
import { UpdateSmartrotomUserDto } from '../dto/update-user.dto';
import { IUsersRepository } from '../repositories/interfaces/users-repository.interface';
import { USERS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { Logger } from 'nestjs-pino';
import { RookerService } from '../../rooker/rooker.service';

export interface UserCreationResult {
  user: RotomUser;
  isNew: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
    private readonly rookerService: RookerService,
    private readonly logger: Logger,
  ) {}

  /**
   * Every new player gets a Rooker handle, derived from their username.
   *
   * This lives here rather than in the facade because there are two doors into user
   * creation — `POST /users` (findOrCreateUser) and the full new-player setup
   * (initializeUserAndAccounts) — and only one of them goes through the facade. This
   * method is what both of them share.
   *
   * Non-fatal, matching how the Saved Messages chat is provisioned: a player must not
   * fail to exist because a social handle could not be minted. A warning here means
   * someone is left without a profile, which the backfill
   * (`drizzle/seed/06-rooker.sql`, or `seed/rooker.ts`) then repairs.
   */
  private async provisionRookerProfile(user: RotomUser): Promise<void> {
    try {
      const handle = await this.rookerService.ensureProfile(
        user.uuid,
        user.username,
      );
      if (handle) {
        this.logger.log(`Rooker profile @${handle} created for ${user.uuid}`);
      } else {
        this.logger.warn(
          `No free Rooker handle for ${user.uuid} (${user.username}) — ` +
            'run the rooker backfill to give them one.',
        );
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to create Rooker profile for ${user.uuid}, continuing anyway: ${error.message}`,
      );
    }
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(): Promise<RotomUser[]> {
    return this.usersRepository.findAll();
  }

  async getUserById(id: number): Promise<RotomUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByUuid(uuid: string): Promise<RotomUser | null> {
    this.validateUuid(uuid);
    return this.usersRepository.findByUuid(uuid);
  }

  async createUser(createUserDto: CreateSmartrotomUserDto): Promise<RotomUser> {
    // Check for duplicate UUID
    const existingUser = await this.usersRepository.findByUuid(
      createUserDto.uuid,
    );
    if (existingUser) {
      throw new ConflictException(
        `User with UUID '${createUserDto.uuid}' already exists`,
      );
    }

    // Check for duplicate username
    const existingUsername = await this.usersRepository.findByUsername(
      createUserDto.username,
    );
    if (existingUsername) {
      throw new ConflictException(
        `User with username '${createUserDto.username}' already exists`,
      );
    }

    const created = await this.usersRepository.create(createUserDto);
    await this.provisionRookerProfile(created);
    return created;
  }

  async findOrCreateUser(
    createUserDto: CreateSmartrotomUserDto,
  ): Promise<UserCreationResult> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findByUuid(
      createUserDto.uuid,
    );
    if (existingUser) {
      return { user: existingUser, isNew: false };
    }

    // Check for duplicate username
    const existingUsername = await this.usersRepository.findByUsername(
      createUserDto.username,
    );
    if (existingUsername) {
      throw new ConflictException(
        `Username '${createUserDto.username}' is already taken`,
      );
    }

    const newUser = await this.usersRepository.create(createUserDto);
    await this.provisionRookerProfile(newUser);
    return { user: newUser, isNew: true };
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateSmartrotomUserDto,
  ): Promise<RotomUser> {
    const existingUser = await this.getUserById(id);

    // Check for duplicate username if updating username
    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const duplicateUser = await this.usersRepository.findByUsername(
        updateUserDto.username,
      );
      if (duplicateUser && duplicateUser.id !== id) {
        throw new ConflictException(
          `Username '${updateUserDto.username}' is already taken`,
        );
      }
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const exists = await this.usersRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const deleted = await this.usersRepository.delete(id);
    return {
      success: deleted,
      message: deleted ? 'User deleted successfully' : 'Failed to delete user',
    };
  }

  // ==================== BATCH OPERATIONS ====================

  async getMultipleUsers(
    uuids: string[],
  ): Promise<{ [uuid: string]: RotomUser | null }> {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return {};
    }

    // Validate UUIDs
    uuids.forEach((uuid) => this.validateUuid(uuid));

    return this.usersRepository.findByUuids(uuids);
  }

  // ==================== STATISTICS ====================

  async getUserCount(): Promise<number> {
    return this.usersRepository.getUserCount();
  }

  async validateUserExists(uuid: string): Promise<boolean> {
    this.validateUuid(uuid);
    const user = await this.usersRepository.findByUuid(uuid);
    return !!user;
  }

  // ==================== VALIDATION HELPERS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    // Basic UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new BadRequestException('Invalid UUID format');
    }
  }
}
