import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoNpcSkins,
  gobiernoMegafonia,
  gobiernoCarteles,
  GobiernoNpcSkin,
  GobiernoCartel,
} from '@/_db/schema/SmartRotomGobierno';
import {
  CreateNpcSkinDto,
  SendMegafoniaDto,
  CreateCartelDto,
} from './dto/administracion.dto';

@Injectable()
export class AdministracionRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== NPC SKINS ====================

  async listNpcSkins(): Promise<GobiernoNpcSkin[]> {
    return this.db
      .select()
      .from(gobiernoNpcSkins)
      .orderBy(gobiernoNpcSkins.skin);
  }

  async findNpcSkin(skin: string): Promise<GobiernoNpcSkin | null> {
    const rows = await this.db
      .select()
      .from(gobiernoNpcSkins)
      .where(eq(gobiernoNpcSkins.skin, skin));
    return rows[0] ?? null;
  }

  async createNpcSkin(data: CreateNpcSkinDto): Promise<GobiernoNpcSkin> {
    await this.db.insert(gobiernoNpcSkins).values({
      skin: data.skin,
      npcs: data.npcs,
      src: data.src ?? 0,
      face: data.face ?? 0,
      head: data.head ?? 0,
      body: data.body ?? 0,
    });
    return (await this.findNpcSkin(data.skin)) as GobiernoNpcSkin;
  }

  async updateNpcSkin(
    skin: string,
    data: Partial<{
      npcs: string[];
      src: number;
      face: number;
      head: number;
      body: number;
    }>,
  ): Promise<GobiernoNpcSkin | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoNpcSkins)
        .set(data)
        .where(eq(gobiernoNpcSkins.skin, skin));
    }
    return this.findNpcSkin(skin);
  }

  async deleteNpcSkin(skin: string): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoNpcSkins)
      .where(eq(gobiernoNpcSkins.skin, skin));
    return result[0].affectedRows > 0;
  }

  // ==================== MEGAFONIA ====================

  async listMegafonia(limit: number) {
    return this.db
      .select()
      .from(gobiernoMegafonia)
      .orderBy(desc(gobiernoMegafonia.createdAt))
      .limit(limit);
  }

  async recordMegafonia(data: SendMegafoniaDto): Promise<void> {
    await this.db.insert(gobiernoMegafonia).values({
      speaker: data.speaker,
      text: data.text,
      byUuid: data.byUuid,
    });
  }

  // ==================== CARTELES ====================

  async listCarteles(highway?: string): Promise<GobiernoCartel[]> {
    const where = highway ? eq(gobiernoCarteles.highway, highway) : undefined;
    return this.db
      .select()
      .from(gobiernoCarteles)
      .where(where)
      .orderBy(gobiernoCarteles.name);
  }

  async findCartel(id: number): Promise<GobiernoCartel | null> {
    const rows = await this.db
      .select()
      .from(gobiernoCarteles)
      .where(eq(gobiernoCarteles.id, id));
    return rows[0] ?? null;
  }

  async createCartel(data: CreateCartelDto): Promise<GobiernoCartel> {
    const result = await this.db.insert(gobiernoCarteles).values({
      name: data.name,
      highway: data.highway,
      destinations: data.destinations,
      createdBy: data.createdBy,
    });
    return (await this.findCartel(result[0].insertId)) as GobiernoCartel;
  }

  async updateCartel(
    id: number,
    data: Partial<{ name: string; highway: string; destinations: unknown }>,
  ): Promise<GobiernoCartel | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoCarteles)
        .set(data)
        .where(eq(gobiernoCarteles.id, id));
    }
    return this.findCartel(id);
  }

  async deleteCartel(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoCarteles)
      .where(eq(gobiernoCarteles.id, id));
    return result[0].affectedRows > 0;
  }
}
