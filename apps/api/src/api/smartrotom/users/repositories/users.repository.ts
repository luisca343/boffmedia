import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, gt, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { SmartRotomUser, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { CreateSmartrotomUserDto } from '../dto/create-user.dto';
import { UpdateSmartrotomUserDto } from '../dto/update-user.dto';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IUsersRepository } from './interfaces/users-repository.interface';

@Injectable()
export class UsersRepository
  extends BaseRepositoryImpl<
    SmartRotomUser,
    CreateSmartrotomUserDto,
    UpdateSmartrotomUserDto
  >
  implements IUsersRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, smartrotomUsers);
  }

  async findAll(): Promise<SmartRotomUser[]> {
    return this.db
      .select()
      .from(smartrotomUsers)
      .where(gt(smartrotomUsers.id, 0));
  }

  async create(
    createUserDto: CreateSmartrotomUserDto,
  ): Promise<SmartRotomUser> {
    const result = await this.db.insert(smartrotomUsers).values({
      uuid: createUserDto.uuid,
      username: createUserDto.username,
      world: createUserDto.world,
    } as SmartRotomUser);

    return this.findById(result[0].insertId) as Promise<SmartRotomUser>;
  }

  async update(
    id: number,
    updateUserDto: UpdateSmartrotomUserDto,
  ): Promise<SmartRotomUser> {
    await this.db
      .update(smartrotomUsers)
      .set({
        ...updateUserDto,
      } as SmartRotomUser)
      .where(eq(smartrotomUsers.id, id));

    return this.findById(id) as Promise<SmartRotomUser>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(smartrotomUsers)
      .where(eq(smartrotomUsers.id, id));
    return result[0].affectedRows > 0;
  }

  async findByUuid(uuid: string): Promise<SmartRotomUser | null> {
    const result = await this.db
      .select()
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid));
    return result[0] || null;
  }

  async findByUsername(username: string): Promise<SmartRotomUser | null> {
    const result = await this.db
      .select()
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.username, username));
    return result[0] || null;
  }

  async findByUuids(
    uuids: string[],
  ): Promise<{ [uuid: string]: SmartRotomUser | null }> {
    if (!uuids.length) return {};

    const results = await this.db
      .select()
      .from(smartrotomUsers)
      .where(inArray(smartrotomUsers.uuid, uuids));

    const userMap: { [uuid: string]: SmartRotomUser | null } = {};

    // Initialize all UUIDs as null
    uuids.forEach((uuid) => (userMap[uuid] = null));

    // Set found users
    results.forEach((user) => {
      userMap[user.uuid] = user;
    });

    return userMap;
  }

  async getUserCount(): Promise<number> {
    const result = await this.findAll();
    return result.length;
  }
}
