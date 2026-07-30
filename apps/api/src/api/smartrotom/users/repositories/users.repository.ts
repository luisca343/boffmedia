import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, gt, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { RotomUser, rotomUsers } from '@/_db/schema/SmartRotom';
import { CreateSmartrotomUserDto } from '../dto/create-user.dto';
import { UpdateSmartrotomUserDto } from '../dto/update-user.dto';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IUsersRepository } from './interfaces/users-repository.interface';

@Injectable()
export class UsersRepository
  extends BaseRepositoryImpl<
    RotomUser,
    CreateSmartrotomUserDto,
    UpdateSmartrotomUserDto
  >
  implements IUsersRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, rotomUsers);
  }

  async findAll(): Promise<RotomUser[]> {
    return this.db.select().from(rotomUsers).where(gt(rotomUsers.id, 0));
  }

  async create(createUserDto: CreateSmartrotomUserDto): Promise<RotomUser> {
    const result = await this.db.insert(rotomUsers).values({
      uuid: createUserDto.uuid,
      username: createUserDto.username,
      world: createUserDto.world,
    } as RotomUser);

    return this.findById(result[0].insertId) as Promise<RotomUser>;
  }

  async update(
    id: number,
    updateUserDto: UpdateSmartrotomUserDto,
  ): Promise<RotomUser> {
    await this.db
      .update(rotomUsers)
      .set({
        ...updateUserDto,
      } as RotomUser)
      .where(eq(rotomUsers.id, id));

    return this.findById(id) as Promise<RotomUser>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(rotomUsers)
      .where(eq(rotomUsers.id, id));
    return result[0].affectedRows > 0;
  }

  async findByUuid(uuid: string): Promise<RotomUser | null> {
    const result = await this.db
      .select()
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid));
    return result[0] || null;
  }

  async findByUsername(username: string): Promise<RotomUser | null> {
    const result = await this.db
      .select()
      .from(rotomUsers)
      .where(eq(rotomUsers.username, username));
    return result[0] || null;
  }

  async findByUuids(
    uuids: string[],
  ): Promise<{ [uuid: string]: RotomUser | null }> {
    if (!uuids.length) return {};

    const results = await this.db
      .select()
      .from(rotomUsers)
      .where(inArray(rotomUsers.uuid, uuids));

    const userMap: { [uuid: string]: RotomUser | null } = {};

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
