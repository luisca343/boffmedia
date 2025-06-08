import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { eq, or } from 'drizzle-orm';
import { BoffMediaUser, boffMediaRoles, boffMediaUserRoles, boffMediaUsers } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { boffMediaParticipants } from '@/_db/schema/Events';
import { StarbankService } from '@api/smartrotom/starbank/starbank.service';

type FullUser = {
  boff_name: string,
  email: string,
  uuid: string,
  mc_name: string,
  world: string
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly starbankService: StarbankService
  ) {}

  async createFromBoffMedia(boffMediaUser: Partial<BoffMediaUser>) {
    if (!boffMediaUser.password || boffMediaUser.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(boffMediaUser.password, salt);

      const user = {
        email: boffMediaUser.email,
        username: boffMediaUser.username,
        password: hash,
        uuid: boffMediaUser.uuid
      };

      const result = await this.db.insert(boffMediaUsers).values(user as BoffMediaUser).execute();
      const userId = result[0].insertId;

      // Create or find participant for the new user
      await this.createOrFindParticipant(userId, user.username);

      // Remove the password from the returned user object
      const { password, ...userWithoutPassword } = user;
      return { ...userWithoutPassword, id: userId, ok: true };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return { error: 'Nombre de usuario o email ya en uso' };
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Error creating user: ' + error.message);
    }
  }

  private async createOrFindParticipant(userId: number, username: string): Promise<void> {
    try {
      const existingParticipant = await this.db.select()
        .from(boffMediaParticipants)
        .where(eq(boffMediaParticipants.nickname, username))
        .execute();

      if (existingParticipant.length === 0) {
        await this.db.insert(boffMediaParticipants).values({
          userId,
          nickname: username,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }).execute();
      }
    } catch (error) {
      console.error('Error creating participant:', error);
    }
  }

  async create(boffMediaUser: BoffMediaUser, smartrotomUser: SmartRotomUser) {
    console.log('Creando usuario en BoffMedia', boffMediaUser);
    const hash = await bcrypt.hash(boffMediaUser.password, 12);
    const user = {
      email: boffMediaUser.email,
      username: boffMediaUser.username,
      password: hash
    };
    const existe = await this.db.select().from(boffMediaUsers).where(or(eq(boffMediaUsers.uuid, boffMediaUser.uuid), eq(boffMediaUsers.username, boffMediaUser.username))).execute();

    if (existe.length > 0) return { error: "El usuario ya existe" }

    const boffInsert = await this.db.insert(boffMediaUsers).values({ ...user, uuid: boffMediaUser.uuid } as BoffMediaUser).execute();
    const newUser = await this.findFullUserWithName(boffMediaUser.username);
    return newUser;
  }

  async findAll() {
    const rows = await this.db.select().from(boffMediaUsers).execute();
    return rows;
  }

  async findOne(id: number) {
    const rows = await this.db.select().from(boffMediaUsers).where(eq(boffMediaUsers.id, id)).execute();
    return rows[0];
  }

  async findFromUserName(username: string) {
    const rows = await this.db.select().from(boffMediaUsers).where(eq(boffMediaUsers.username, username)).execute();
    return rows[0];
  }

  async findFullUserWithName(username: string) {
    const users = await this.db.select().from(boffMediaUsers)
      .leftJoin(smartrotomUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
      .where(eq(boffMediaUsers.username, username)).execute();

    return users[0];
  }

  async getUserRoles(userId: number) {
    const data = await this.db.select({ role: boffMediaRoles.name }).from(boffMediaUserRoles)
      .leftJoin(boffMediaRoles, eq(boffMediaRoles.id, boffMediaUserRoles.roleId))
      .where(eq(boffMediaUserRoles.userId, userId)).execute();

    const roles = data.map((d: { role: string }) => d.role);

    return roles;
  }

  async validateUser(username: string, password: string): Promise<SessionUser | null> {
    const user = await this.findFullUserWithName(username);
    if (!user) {
      return null;
    }

    const match = await bcrypt.compare(password, user.boffmedia_users.password);
    if (!match) return null;

    let userToReturn = this.getSessionUser(user);

    return userToReturn;
  }

  async findFullUserWithUUID(uuid: string) {
    let test = await this.db.select().from(smartrotomUsers)
      .leftJoin(boffMediaUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
      .where(eq(smartrotomUsers.uuid, uuid)).execute();

    if (test.length === 0) return null;

    let res = test[0];
    let user = this.getSessionUser(res);

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.db.update(boffMediaUsers).set(updateUserDto).where(eq(boffMediaUsers.id, id)).execute();
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.db.delete(boffMediaUsers).where(eq(boffMediaUsers.id, id)).execute();
    return { success: true };
  }

  async getSessionUser({ boffmedia_users, rotom_users }: { boffmedia_users: BoffMediaUser, rotom_users: SmartRotomUser }) {
    if(!boffmedia_users) {
      return {
        id: null,
        name: null,
        email: null,
        mcUUid: null,
        roles: [],
        smartRotomUser: {
          username: rotom_users?.username,
          uuid: rotom_users?.uuid,
          world: rotom_users?.world
        }
      }
    }
    const roles = await this.getUserRoles(boffmedia_users.id);

    return {
      id: boffmedia_users?.id,
      name: boffmedia_users?.username,
      email: boffmedia_users?.email,
      mcUUid: boffmedia_users?.uuid,
      roles,
      smartRotomUser: {
        username: rotom_users?.username,
        uuid: rotom_users?.uuid,
        world: rotom_users?.world
      }
    } as SessionUser;
  }

  async findByEmail(email: string): Promise<SessionUser | null> {
    let test = await this.db.select().from(boffMediaUsers)
      .leftJoin(smartrotomUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
      .where(eq(boffMediaUsers.email, email)).execute();

    if (test.length === 0) return null;

    let res = test[0];
    let user = this.getSessionUser(res);

    return user;
  }

  async createFromGoogle(googleUser: any): Promise<SessionUser> {
    console.log('Creating user from Google:', googleUser);
    const exists = await this.db.select().from(boffMediaUsers)
      .leftJoin(smartrotomUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
      .where(eq(boffMediaUsers.email, googleUser.email)).execute();

    if (exists.length > 0) {
      console.log('User already exists:', exists[0]);
      return this.getSessionUser(exists[0]);
    }

    try {
      const user = {
        email: googleUser.email,
        username: googleUser.email.split('@')[0],
        password: '',
        uuid: null,
      };

      const result = await this.db.insert(boffMediaUsers).values(user as BoffMediaUser).execute();
      const newUser = await this.findByEmail(user.email);
      return newUser;

    } catch (error) {
      console.error('Error creating user from Google:', error);
      throw error;
    }
  }


  async createMinecraftUser(registerData: {
    username: string;
    email: string;
    password: string;
    minecraft: {
      username: string;
      uuid: string;
      world: string;
    };
  }) {
    if (!registerData.password || registerData.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    try {
      // Check if user already exists
      const existingBoffUser = await this.db.select().from(boffMediaUsers)
        .where(or(
          eq(boffMediaUsers.username, registerData.username),
          eq(boffMediaUsers.email, registerData.email),
          eq(boffMediaUsers.uuid, registerData.minecraft.uuid)
        )).execute();

      if (existingBoffUser.length > 0) {
        return { error: 'Username, email, or Minecraft UUID already in use' };
      }

      const existingMcUser = await this.db.select().from(smartrotomUsers)
        .where(or(
          eq(smartrotomUsers.username, registerData.minecraft.username),
          eq(smartrotomUsers.uuid, registerData.minecraft.uuid)
        )).execute();

      if (existingMcUser.length > 0) {
        return { error: 'Minecraft username or UUID already in use' };
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(registerData.password, salt);

      // Create SmartRotom user first
      const smartrotomUser = {
        username: registerData.minecraft.username,
        uuid: registerData.minecraft.uuid,
        world: registerData.minecraft.world
      };

      await this.db.insert(smartrotomUsers).values(smartrotomUser as SmartRotomUser).execute();

      // Create BoffMedia user
      const boffMediaUser = {
        email: registerData.email,
        username: registerData.username,
        password: hash,
        uuid: registerData.minecraft.uuid
      };

      const result = await this.db.insert(boffMediaUsers).values(boffMediaUser as BoffMediaUser).execute();
      const userId = result[0].insertId;

      // Create participant for the new user
      await this.createOrFindParticipant(userId, registerData.username);

      // Create StarBank main account for the new user
      try {
        await this.starbankService.createMainAccount(registerData.minecraft.uuid, registerData.minecraft.username);
        console.log('StarBank account created for user:', registerData.minecraft.username);
      } catch (error) {
        console.error('Error creating StarBank account:', error);
        // Don't fail the entire registration if StarBank account creation fails
      }

      // Get the full user data
      const fullUser = await this.findFullUserWithUUID(registerData.minecraft.uuid);

      return { user: fullUser, ok: true };
    } catch (error) {
      console.error('Error creating Minecraft user:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return { error: 'Username, email, or Minecraft data already in use' };
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Error creating user: ' + error.message);
    }
  }

  async linkMinecraftAccount(linkData: {
    username: string;
    email: string;
    password: string;
    minecraft: {
      username: string;
      uuid: string;
      world: string;
    };
  }) {
    if (!linkData.password || linkData.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    try {
      // Find existing BoffMedia user and validate credentials
      const existingUser = await this.db.select().from(boffMediaUsers)
        .where(or(
          eq(boffMediaUsers.username, linkData.username),
          eq(boffMediaUsers.email, linkData.email)
        )).execute();

      if (existingUser.length === 0) {
        return { error: 'BoffMedia account not found. Please register first.' };
      }

      const user = existingUser[0];

      // Validate password
      const match = await bcrypt.compare(linkData.password, user.password);
      if (!match) {
        return { error: 'Invalid credentials' };
      }

      // Check if user already has a Minecraft account linked
      if (user.uuid) {
        return { error: 'This account already has a Minecraft account linked' };
      }

      // Check if Minecraft account is already in use
      const existingMcUser = await this.db.select().from(smartrotomUsers)
        .where(or(
          eq(smartrotomUsers.username, linkData.minecraft.username),
          eq(smartrotomUsers.uuid, linkData.minecraft.uuid)
        )).execute();

      if (existingMcUser.length > 0) {
        return { error: 'Minecraft username or UUID already in use' };
      }

      const existingBoffUserWithUuid = await this.db.select().from(boffMediaUsers)
        .where(eq(boffMediaUsers.uuid, linkData.minecraft.uuid))
        .execute();

      if (existingBoffUserWithUuid.length > 0) {
        return { error: 'Minecraft UUID already linked to another account' };
      }

      // Create SmartRotom user
      const smartrotomUser = {
        username: linkData.minecraft.username,
        uuid: linkData.minecraft.uuid,
        world: linkData.minecraft.world
      };

      await this.db.insert(smartrotomUsers).values(smartrotomUser as SmartRotomUser).execute();

      // Update BoffMedia user with Minecraft UUID
      await this.db.update(boffMediaUsers)
        .set({ uuid: linkData.minecraft.uuid } as Partial<BoffMediaUser>)
        .where(eq(boffMediaUsers.id, user.id))
        .execute();

      // Create StarBank main account for the linked user
      try {
        await this.starbankService.createMainAccount(linkData.minecraft.uuid, linkData.minecraft.username);
        console.log('StarBank account created for linked user:', linkData.minecraft.username);
      } catch (error) {
        console.error('Error creating StarBank account:', error);
        // Don't fail the entire linking process if StarBank account creation fails
      }

      // Get the full user data with linked accounts
      const fullUser = await this.findFullUserWithUUID(linkData.minecraft.uuid);

      return { user: fullUser, ok: true };
    } catch (error) {
      console.error('Error linking Minecraft account:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return { error: 'Minecraft data already in use' };
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Error linking account: ' + error.message);
    }
  }
}



type SessionUser = {
  name: string,
  email: string,
  smartRotomUser: {
    username: string,
    uuid: string,
    world: string
  }
}