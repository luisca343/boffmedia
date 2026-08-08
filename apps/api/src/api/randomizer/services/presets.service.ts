import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import type { RandomizerPreset } from '@/_db/schema/Randomizer';
import {
  SETTINGS_SHIM_TOKEN,
  type ISettingsShim,
} from '../ports/settings-shim.port';
import { PresetResponseDto } from '../dto/randomizer.dto';

@Injectable()
export class PresetsService {
  constructor(
    private readonly logger: Logger,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    @Inject(SETTINGS_SHIM_TOKEN)
    private readonly settingsShim: ISettingsShim,
  ) {}

  /**
   * Create a new preset with settings JSON only.
   * Does not encode to .rnqs yet (that happens on demand).
   */
  async createPreset(data: {
    name: string;
    description?: string;
    gameScope?: string;
    settingsJson: Record<string, unknown>;
    updatedBy?: number;
  }): Promise<PresetResponseDto> {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Preset name is required');
    }

    try {
      const presetId = await this.repository.createPreset({
        name: data.name,
        description: data.description || null,
        gameScope: data.gameScope || null,
        settingsJson: data.settingsJson,
        rnqsBlobSha512: null, // Not encoded yet
        updatedBy: data.updatedBy || null,
      });

      const preset = await this.repository.getPresetById(presetId);
      if (!preset) {
        throw new Error('Failed to retrieve created preset');
      }

      this.logger.debug(`Created preset ${presetId}: ${data.name}`);
      return this.mapToDto(preset);
    } catch (error: any) {
      this.logger.error('Failed to create preset:', error);
      throw error;
    }
  }

  /**
   * Get a preset by ID.
   */
  async getPreset(presetId: number): Promise<PresetResponseDto> {
    if (!presetId || presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }

    const preset = await this.repository.getPresetById(presetId);
    if (!preset) {
      throw new NotFoundException(`Preset ${presetId} not found`);
    }

    return this.mapToDto(preset);
  }

  /**
   * List all presets.
   */
  async listPresets(): Promise<PresetResponseDto[]> {
    const presets = await this.repository.listPresets();
    return presets.map((p) => this.mapToDto(p));
  }

  /**
   * Update a preset (name, description, gameScope, or settingsJson).
   */
  async updatePreset(
    presetId: number,
    patch: {
      name?: string;
      description?: string;
      gameScope?: string;
      settingsJson?: Record<string, unknown>;
      updatedBy?: number;
    },
  ): Promise<PresetResponseDto> {
    if (!presetId || presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }

    const preset = await this.repository.getPresetById(presetId);
    if (!preset) {
      throw new NotFoundException(`Preset ${presetId} not found`);
    }

    const updated = {
      name: patch.name !== undefined ? patch.name : preset.name,
      description:
        patch.description !== undefined
          ? patch.description
          : preset.description,
      gameScope:
        patch.gameScope !== undefined ? patch.gameScope : preset.gameScope,
      settingsJson:
        patch.settingsJson !== undefined
          ? patch.settingsJson
          : preset.settingsJson,
      updatedBy:
        patch.updatedBy !== undefined ? patch.updatedBy : preset.updatedBy,
      // Clear encoded blob if settings changed
      rnqsBlobSha512:
        patch.settingsJson !== undefined ? null : preset.rnqsBlobSha512,
    };

    await this.repository.updatePreset(presetId, updated);

    const updated_preset = await this.repository.getPresetById(presetId);
    if (!updated_preset) {
      throw new Error('Failed to retrieve updated preset');
    }

    this.logger.debug(`Updated preset ${presetId}`);
    return this.mapToDto(updated_preset);
  }

  /**
   * Delete a preset by ID.
   */
  async deletePreset(presetId: number): Promise<void> {
    if (!presetId || presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }

    const preset = await this.repository.getPresetById(presetId);
    if (!preset) {
      throw new NotFoundException(`Preset ${presetId} not found`);
    }

    await this.repository.deletePreset(presetId);
    this.logger.debug(`Deleted preset ${presetId}`);
  }

  /**
   * Encode a preset's settings to .rnqs format.
   * Calls SettingsShim (stub in Phase 0).
   */
  async encodePreset(presetId: number): Promise<Buffer> {
    if (!presetId || presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }

    const preset = await this.repository.getPresetById(presetId);
    if (!preset) {
      throw new NotFoundException(`Preset ${presetId} not found`);
    }

    // Call shim to encode (will throw 503 in Phase 0)
    const rnqs = await this.settingsShim.encode(preset.settingsJson);

    // TODO: Store blob via PacksDownloadsService
    // For now, just return buffer to caller

    return rnqs;
  }

  /**
   * Decode .rnqs to settings JSON.
   * Calls SettingsShim (stub in Phase 0).
   */
  async decodeRnqs(rnqs: Buffer): Promise<Record<string, unknown>> {
    // Call shim to decode (will throw 503 in Phase 0)
    return this.settingsShim.decode(rnqs);
  }

  /**
   * Import a .rnqs file as a new preset.
   * Calls SettingsShim to decode first.
   */
  async importPreset(
    rnqs: Buffer,
    metadata: { name: string; gameScope?: string; updatedBy?: number },
  ): Promise<PresetResponseDto> {
    // Decode via shim (will throw 503 in Phase 0)
    const settingsJson = await this.settingsShim.decode(rnqs);

    return this.createPreset({
      name: metadata.name,
      gameScope: metadata.gameScope,
      settingsJson,
      updatedBy: metadata.updatedBy,
    });
  }

  /**
   * Export a preset as .rnqs.
   * Calls SettingsShim to encode.
   */
  async exportPreset(presetId: number): Promise<Buffer> {
    return this.encodePreset(presetId);
  }

  private mapToDto(preset: RandomizerPreset): PresetResponseDto {
    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      gameScope: preset.gameScope,
      // `settings_json` is a MySQL json column but the driver returns a raw string on read.
      settingsJson:
        typeof preset.settingsJson === 'string'
          ? (JSON.parse(preset.settingsJson) as Record<string, unknown>)
          : preset.settingsJson,
      rnqsBlobSha512: preset.rnqsBlobSha512,
      updatedBy: preset.updatedBy,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    };
  }
}
