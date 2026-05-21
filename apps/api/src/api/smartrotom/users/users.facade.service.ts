import { Injectable } from '@nestjs/common';
import { UsersService, UserCreationResult } from './services/users.service';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateSmartrotomUserDto } from './dto/update-user.dto';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { ChatappFacadeService } from '../chatapp/chatapp.facade.service';
import { Logger } from 'nestjs-pino';

export interface UserInitializationData {
  uuid: string;
  username: string;
  world?: string;
}

export interface InitializationResult {
  user: SmartRotomUser;
  accounts: any[];
  isNewUser: boolean;
  isNewAccount: boolean;
}

export interface UserWithAccounts {
  user: SmartRotomUser;
  accounts: any[];
}

@Injectable()
export class UsersFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly usersService: UsersService,
    private readonly starbankService: StarbankFacadeService,
    private readonly chatAppService: ChatappFacadeService,
  ) {}

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(): Promise<SmartRotomUser[]> {
    return this.usersService.getAllUsers();
  }

  async getUserById(id: number): Promise<SmartRotomUser> {
    return this.usersService.getUserById(id);
  }

  async getUserByUuid(uuid: string): Promise<SmartRotomUser | null> {
    return this.usersService.getUserByUuid(uuid);
  }

  async createUser(
    createUserDto: CreateSmartrotomUserDto,
  ): Promise<SmartRotomUser> {
    return this.usersService.createUser(createUserDto);
  }

  async findOrCreateUser(
    createUserDto: CreateSmartrotomUserDto,
  ): Promise<UserCreationResult> {
    return this.usersService.findOrCreateUser(createUserDto);
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateSmartrotomUserDto,
  ): Promise<SmartRotomUser> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    return this.usersService.deleteUser(id);
  }

  // ==================== INTEGRATED OPERATIONS ====================

  async initializeUserAndAccounts(
    data: UserInitializationData,
  ): Promise<InitializationResult> {
    // Find or create user
    const userResult = await this.usersService.findOrCreateUser({
      uuid: data.uuid,
      username: data.username,
      world: data.world,
    });

    // Check existing accounts
    const accounts = await this.starbankService.getAccounts(data.uuid);
    let isNewAccount = false;

    // Create main StarBank account if none exist
    if (accounts.length === 0) {
      await this.starbankService.createMainAccount(data.uuid, data.username);
      isNewAccount = true;

      const mainAccount = await this.starbankService.getMainAccount(data.uuid);
      await this.starbankService.transferFromSystem(
        mainAccount!.id,
        1000,
        'Ingreso de Bienvenida',
      );
      this.logger.log(`Welcome bonus credited to user ${data.uuid}`);
    }

    // Create saved messages chat (non-blocking)
    try {
      await this.chatAppService.createChat({
        player: data.uuid,
        users: [],
        name: 'Mensajes Guardados',
      });
      this.logger.log(`Saved Messages chat created for user ${data.uuid}`);
    } catch (error: any) {
      this.logger.warn(
        `Failed to create Saved Messages chat for user ${data.uuid}, continuing anyway:`,
        error.message,
      );
    }

    return {
      user: userResult.user,
      accounts: accounts || [],
      isNewUser: userResult.isNew,
      isNewAccount,
    };
  }

  async getUserWithAccounts(uuid: string): Promise<UserWithAccounts | null> {
    const user = await this.usersService.getUserByUuid(uuid);
    if (!user) {
      return null;
    }

    const accounts = await this.starbankService.getAccounts(uuid);

    return {
      user,
      accounts: accounts || [],
    };
  }

  // ==================== BATCH OPERATIONS ====================

  async getMultipleUsers(
    uuids: string[],
  ): Promise<{ [uuid: string]: SmartRotomUser | null }> {
    return this.usersService.getMultipleUsers(uuids);
  }

  async getMultipleUsersWithAccounts(
    uuids: string[],
  ): Promise<{ [uuid: string]: UserWithAccounts | null }> {
    const results: { [uuid: string]: UserWithAccounts | null } = {};

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < uuids.length; i += batchSize) {
      const batch = uuids.slice(i, i + batchSize);

      const batchPromises = batch.map(async (uuid) => {
        try {
          const userWithAccounts = await this.getUserWithAccounts(uuid);
          return { uuid, result: userWithAccounts };
        } catch (error: any) {
          this.logger.error(
            `Failed to get user with accounts for ${uuid}:`,
            error,
          );
          return { uuid, result: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ uuid, result }) => {
        results[uuid] = result;
      });
    }

    return results;
  }

  // ==================== STATISTICS ====================

  async getUserStatistics(): Promise<{
    totalUsers: number;
    usersWithAccounts: number;
    usersWithoutAccounts: number;
  }> {
    const totalUsers = await this.usersService.getUserCount();

    // This would need more sophisticated querying for accurate counts
    // For now, return basic stats
    return {
      totalUsers,
      usersWithAccounts: 0, // Would need to implement
      usersWithoutAccounts: 0, // Would need to implement
    };
  }

  // ==================== VALIDATION ====================

  async validateUserExists(uuid: string): Promise<boolean> {
    return this.usersService.validateUserExists(uuid);
  }
}
