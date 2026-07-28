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

export interface UserCreationResult {
  user: RotomUser;
  isNew: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
  ) {}

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

  async createUser(
    createUserDto: CreateSmartrotomUserDto,
  ): Promise<RotomUser> {
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

    return this.usersRepository.create(createUserDto);
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
