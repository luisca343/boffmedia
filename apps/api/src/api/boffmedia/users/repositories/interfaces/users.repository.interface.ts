import { BoffMediaUser } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';

// Entity types for responses (without password)
export type BoffMediaUserSafe = Omit<BoffMediaUser, 'password'>;

// Complex query result types
export interface FullUserData {
  boffmedia_users: BoffMediaUser;
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

  // ==================== COMPLEX QUERIES ====================
  findFullUserByUsernameWithPassword(
    username: string,
  ): Promise<FullUserData | null>;
  findFullUserByUsername(username: string): Promise<FullUserDataSafe | null>;
  findFullUserByUuid(uuid: string): Promise<FullUserDataSafe | null>;
  findFullUserByEmail(email: string): Promise<FullUserDataSafe | null>;
  getUserRoles(userId: number): Promise<string[]>;

  // ==================== UPDATE OPERATIONS ====================
  updateUser(id: number, updateData: UpdateUserDto): Promise<BoffMediaUserSafe>;

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
