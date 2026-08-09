import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { Logger } from 'nestjs-pino';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';
import type { RandomizerRom } from '@/_db/schema/Randomizer';

/**
 * Central clean-ROM library. Admins upload clean ROMs here; configs pin one at
 * selection time. Blobs live in the shared content-addressed pack blob store
 * keyed by sha512 and are never referenced by any pack manifest, so a player can
 * never download one — only these admin routes and the server randomize job touch them.
 */
@Injectable()
export class RomsService {
  constructor(
    private readonly logger: Logger,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    private readonly blobStorage: PacksDownloadsService,
  ) {}

  /**
   * Store an uploaded clean ROM: stream into the blob store (content-addressed by
   * sha512), then insert the library row. Duplicate sha512 → 409.
   */
  async uploadRom(params: {
    name: string;
    gamePlatform: string;
    romBuffer: Buffer;
  }): Promise<RandomizerRom> {
    const name = (params.name || '').trim();
    if (!name) {
      throw new BadRequestException('A ROM name is required');
    }
    if (params.gamePlatform !== 'gba' && params.gamePlatform !== 'nds') {
      throw new BadRequestException('gamePlatform must be "gba" or "nds"');
    }
    if (!params.romBuffer || params.romBuffer.length === 0) {
      throw new BadRequestException('ROM file is required');
    }

    const { sha512, size } = await this.blobStorage.storeBlob(
      Readable.from(params.romBuffer),
    );

    // Reject a duplicate up front with a clear message (the blob is already
    // stored idempotently; we just refuse a second library row for the same bytes).
    const existing = await this.repository.getRomBySha512(sha512);
    if (existing) {
      throw new ConflictException({
        message: `A ROM with sha512 ${sha512} already exists (id ${existing.id}, "${existing.name}")`,
        userMessage: `Esta ROM ya está en la biblioteca como “${existing.name}”. Usa la existente.`,
      });
    }

    const id = await this.repository.createRom({
      name,
      gamePlatform: params.gamePlatform,
      sha512,
      fileSize: size,
    });

    const rom = await this.repository.getRomById(id);
    if (!rom) {
      throw new Error('Failed to retrieve created ROM');
    }
    this.logger.debug(
      `Uploaded library ROM ${id} "${name}" (${params.gamePlatform}, ${size} bytes, ${sha512.slice(0, 8)}…)`,
    );
    return rom;
  }

  /** List library ROMs with a referenced-by count (configs pinning each ROM). */
  async listRoms(): Promise<(RandomizerRom & { referencedBy: number })[]> {
    return this.repository.listRomsWithRefCount();
  }

  /**
   * Delete a library ROM. 409 if any config references it (by rom_id provenance
   * or by the pinned clean hash) — deletion must never orphan a live event.
   */
  async deleteRom(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new BadRequestException('Valid ROM id is required');
    }
    const rom = await this.repository.getRomById(id);
    if (!rom) {
      throw new NotFoundException(`ROM ${id} not found`);
    }
    const refs = await this.repository.countConfigsReferencingRom(
      rom.id,
      rom.sha512,
    );
    if (refs > 0) {
      throw new ConflictException({
        message: `ROM ${id} is referenced by ${refs} config(s) and cannot be deleted`,
        userMessage: `Esta ROM está en uso por ${refs} configuración(es). Cámbialas antes de eliminarla.`,
      });
    }
    await this.repository.deleteRom(id);
    this.logger.debug(`Deleted library ROM ${id} "${rom.name}"`);
  }
}
