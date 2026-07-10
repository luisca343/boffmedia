import { BoffMediaUser } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { CreateUserDto } from '../../dto/create-user.dto';

// Entity types for responses (without password, the internal soft-delete marker,
// or the forum presence marker — lastSeenAt is read directly by the forum, never
// surfaced through the general user reads).
export type BoffMediaUserSafe = Omit<
  BoffMediaUser,
  'password' | 'deletedAt' | 'lastSeenAt'
>;

// Complex query result types. Keeps `password` (for credential checks) but not
// the internal soft-delete / presence markers, matching the repository's select
// clause.
export interface FullUserData {
  boffmedia_users: Omit<BoffMediaUser, 'deletedAt' | 'lastSeenAt'>;
  rotom_users: SmartRotomUser | null;
}

export interface FullUserDataSafe {
  boffmedia_users: BoffMediaUserSafe;
  rotom_users: SmartRotomUser | null;
}

export interface IBoffMediaUsersRepository {
  // ==================== CREATE OPERATIONS ====================
  createUser(userData: CreateUserDto): Promise<BoffMediaUserSafe>;
  createParticipant(userId: number, username: string): Promise<void>;

  // ==================== READ OPERATIONS ====================
  findAllUsers(): Promise<BoffMediaUserSafe[]>;
  findUserById(id: number): Promise<BoffMediaUserSafe | null>;
  findUserByUsername(username: string): Promise<BoffMediaUserSafe | null>;
  findUserByEmail(email: string): Promise<BoffMediaUserSafe | null>;
  findUserByUuid(uuid: string): Promise<BoffMediaUserSafe | null>;
  findUserByGoogleId(googleId: string): Promise<BoffMediaUserSafe | null>;
  findUserByDiscordId(discordId: string): Promise<BoffMediaUserSafe | null>;
  findUserBySteamId(steamId: string): Promise<BoffMediaUserSafe | null>;
  findUserByTwitchId(twitchId: string): Promise<BoffMediaUserSafe | null>;

  // ==================== COMPLEX QUERIES ====================
  findFullUserByUsernameWithPassword(
    username: string,
  ): Promise<FullUserData | null>;
  findFullUserByUsername(username: string): Promise<FullUserDataSafe | null>;
  findFullUserByUuid(uuid: string): Promise<FullUserDataSafe | null>;
  findFullUserByEmail(email: string): Promise<FullUserDataSafe | null>;
  getUserRoles(userId: number): Promise<string[]>;

  // ==================== UPDATE OPERATIONS ====================
  // Broad partial: the public HTTP path is narrowed by UpdateUserDto in the
  // controller/service, but internal callers (OAuth linking, minecraft uuid,
  // provider unlink) legitimately set googleId/discordId/uuid/steamId here.
  updateUser(
    id: number,
    updateData: Partial<BoffMediaUser>,
  ): Promise<BoffMediaUserSafe>;

  // ==================== DELETE OPERATIONS ====================
  deleteUser(id: number): Promise<boolean>;

  // ==================== VALIDATION OPERATIONS ====================
  checkUserExists(
    identifier: string,
    type: 'id' | 'username' | 'email' | 'uuid',
  ): Promise<boolean>;
  checkMultipleFieldsExist(fields: {
    username?: string;
    email?: string;
    uuid?: string;
  }): Promise<BoffMediaUserSafe[]>;

  // ==================== STATISTICS ====================
  getUserCount(): Promise<number>;
}
