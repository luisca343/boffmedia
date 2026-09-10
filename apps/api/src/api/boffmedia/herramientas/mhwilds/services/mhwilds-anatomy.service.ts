import { Injectable } from '@nestjs/common';
import type { MhwildsAnatomyCallouts } from '@/_db/schema/Mhwilds';
import type {
  AnatomyCalloutDto,
  SaveAnatomyOverrideDto,
} from '../dto/anatomy-overrides.dto';
import type {
  AnatomyCalloutEntity,
  AnatomyOverrideEntity,
} from '../entities/anatomy-overrides.entity';
import {
  MhwildsAnatomyRepository,
  type MhwildsAnatomyOverrideRow,
} from '../repositories/mhwilds-anatomy.repository';

@Injectable()
export class MhwildsAnatomyService {
  constructor(private readonly repository: MhwildsAnatomyRepository) {}

  async list(): Promise<AnatomyOverrideEntity[]> {
    const rows = await this.repository.list();
    return rows.map((row) => this.toEntity(row));
  }

  async save(
    dto: SaveAnatomyOverrideDto,
    updatedBy: number,
  ): Promise<AnatomyOverrideEntity> {
    const callouts = this.toCalloutMap(dto.callouts);
    const row = await this.repository.save(
      dto.fixedId,
      dto.variantId,
      callouts,
      updatedBy,
    );
    if (!row) throw new Error('Anatomy override was not persisted');
    return this.toEntity(row);
  }

  async remove(
    fixedId: number,
    variantId: string,
  ): Promise<{ deleted: boolean }> {
    return { deleted: await this.repository.remove(fixedId, variantId) };
  }

  private toCalloutMap(callouts: AnatomyCalloutDto[]): MhwildsAnatomyCallouts {
    return Object.fromEntries(
      callouts.map((callout) => [
        callout.slotKey,
        { x: callout.target.x, y: callout.target.y },
      ]),
    );
  }

  private toEntity(row: MhwildsAnatomyOverrideRow): AnatomyOverrideEntity {
    const callouts: AnatomyCalloutEntity[] = Object.entries(
      row.callouts as MhwildsAnatomyCallouts,
    ).map(([slotKey, target]) => ({ slotKey, target }));
    return {
      fixedId: row.fixedId,
      variantId: row.variantId,
      callouts,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
