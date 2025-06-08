import { Inject, Injectable } from '@nestjs/common';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { SmartRotomUser, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { eq } from 'drizzle-orm';

@Injectable()
export class SmartRotomUsersService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  async create(user: CreateSmartrotomUserDto) {
    console.log('Creando usuario en SmartRotom', user);
    const existe = await this.findOne(user.uuid);
    if (existe) return existe;
    console.log('El usuario no existe, creando...');
    await this.db.insert(smartrotomUsers).values({ uuid: user.uuid, username: user.username }).execute();
    const usuario = await this.findOne(user.uuid);
    console.log('Usuario creado en SmartRotom', usuario);
    return usuario;
  }

  async findAll(): Promise<SmartRotomUser[]> {
    const rows = await this.db.select().from(smartrotomUsers).execute();
    return rows;
  }

  async findOne(uuid: string): Promise<SmartRotomUser | null> {
    const rows = await this.db.select().from(smartrotomUsers).where(eq(smartrotomUsers.uuid, uuid)).execute();
    return rows.length > 0 ? rows[0] : null;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.db.update(smartrotomUsers).set(updateUserDto).where(eq(smartrotomUsers.id, id)).execute();
    return this.findOneById(id);
  }

  async remove(id: number) {
    await this.db.delete(smartrotomUsers).where(eq(smartrotomUsers.id, id)).execute();
    return { success: true };
  }

  private async findOneById(id: number): Promise<SmartRotomUser | null> {
    const rows = await this.db.select().from(smartrotomUsers).where(eq(smartrotomUsers.id, id)).execute();
    return rows.length > 0 ? rows[0] : null;
  }
}