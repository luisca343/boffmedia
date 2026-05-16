import { Injectable, Logger } from '@nestjs/common';
import {
  SpriteLocation,
  SpriteManifest,
} from '../interfaces/sprite-manifest.interface';
import { PokemonDataService } from './data/pokemon-data.service';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { BaseDataService } from './data/base-data.service';

@Injectable()
export class SpriteManifestService extends BaseDataService {
  private readonly logger = new Logger(SpriteManifestService.name);
  private manifest: SpriteManifest;

  // Base paths for resourcepacks
  private readonly DEFAULT_RESOURCEPACK_PATH = path.join(
    process.cwd(),
    'public/smartrotom/packs/default_resourcepack',
  );
  private readonly CUSTOM_RESOURCEPACK_PATH = path.join(
    process.cwd(),
    'public/smartrotom/packs/resourcepack',
  );
  private readonly MANIFEST_PATH = path.join(
    process.cwd(),
    'public/smartrotom/packs/sprite-manifest.json',
  );

  constructor(private readonly pokemonDataService: PokemonDataService) {
    super();
  }

  /**
   * Load the sprite manifest
   */
  async loadSpriteManifest(): Promise<void> {
    await this.loadOrGenerateManifest();
  }

  /**
   * Load an existing manifest or generate a new one if none exists
   */
  private async loadOrGenerateManifest(): Promise<void> {
    try {
      if (fs.existsSync(this.MANIFEST_PATH)) {
        this.logger.log('Loading sprite manifest from file...');
        const manifestData = await fsPromises.readFile(
          this.MANIFEST_PATH,
          'utf8',
        );
        this.manifest = JSON.parse(manifestData);
        this.logger.log(
          `Loaded ${this.manifest.count.total} sprites from manifest`,
        );
      } else {
        this.logger.log('No sprite manifest found, generating a new one...');
        await this.generateManifest();
      }
    } catch (error: any) {
      this.logger.error(`Failed to load sprite manifest: ${error.message}`);
      await this.generateManifest();
    }
  }

  /**
   * Generate a new sprite manifest from scratch
   */
  async generateManifest(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('Generating sprite manifest...');

    this.manifest = {
      sprites: {},
      count: {
        total: 0,
        default: 0,
        custom: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Get all Pokémon species - ensure data is already loaded
    const allSpecies = this.pokemonDataService.getAllSpecies();

    if (!allSpecies || allSpecies.length === 0) {
      this.logger.error(
        'No Pokemon species found! Make sure Pokemon data is loaded first.',
      );
      return;
    }

    this.logger.log(`Processing ${allSpecies.length} Pokémon species...`);

    for (const pokemon of allSpecies) {
      const pokemonId = pokemon.dex;

      if (!pokemon.forms || pokemon.forms.length === 0) {
        this.logger.warn(
          `Pokemon ${pokemon.name} (${pokemonId}) has no forms, skipping`,
        );
        continue;
      }

      // Check if the Pokemon has a 'base' form
      const hasBaseForm = pokemon.forms.some(
        (form) => (form && form.name === 'base') || form.name === '',
      );
      let firstFormName = '';

      // Process all forms
      for (const form of pokemon.forms) {
        if (!form) continue;

        // Keep track of the first form name for fallback
        if (!firstFormName && form.name) {
          firstFormName = form.name;
        }

        const formName = form.name || 'base';

        // Process each gender property and its palettes
        if (form.genderProperties) {
          for (const genderProp of Object.values(form.genderProperties)) {
            if (!genderProp || !genderProp.palettes) continue;

            for (const palette of genderProp.palettes) {
              if (!palette || !palette.name) continue;

              const paletteName = palette.name;
              await this.addSpriteToManifest(
                pokemonId,
                formName,
                paletteName,
                palette,
              );
            }
          }
        }

        // Ensure we always have a "none" palette entry
        await this.addSpriteToManifest(
          pokemonId,
          formName,
          'none',
          form.genderProperties?.[0]?.palettes?.[0] || null,
        );
      }

      // If no base form exists, use the first form as base
      if (!hasBaseForm && firstFormName) {
        this.logger.debug(
          `Pokemon ${pokemon.name} (${pokemonId}) has no base form, using ${firstFormName} as base`,
        );

        // Find the first form's sprites and copy them as 'base' form
        for (const key of Object.keys(this.manifest.sprites)) {
          if (key.startsWith(`${pokemonId}:${firstFormName}:`)) {
            const palettePart = key.split(':')[2];
            const baseKey = `${pokemonId}:base:${palettePart}`;

            // Only add if not already present
            if (!this.manifest.sprites[baseKey]) {
              this.manifest.sprites[baseKey] = {
                ...this.manifest.sprites[key],
              };
              this.manifest.count.total++;

              if (this.manifest.sprites[key].isDefault) {
                this.manifest.count.default++;
              } else {
                this.manifest.count.custom++;
              }
            }
          }
        }
      }
    }

    // Save the manifest to disk
    await this.saveManifest();

    const duration = Date.now() - startTime;
    this.logger.log(
      `Generated sprite manifest with ${this.manifest.count.total} sprites (${this.manifest.count.default} default, ${this.manifest.count.custom} custom) in ${duration}ms`,
    );
  }

  /**
   * Add a sprite to the manifest
   */
  private async addSpriteToManifest(
    pokemonId: number,
    formName: string,
    paletteName: string,
    palette: any,
  ): Promise<void> {
    const key = `${pokemonId}:${formName}:${paletteName}`;

    try {
      // Handle special case for Minior
      const spriteResource =
        pokemonId === 774
          ? 'pixelmon:pokemon/774_minior/all/meteor/none/sprite.png'
          : palette?.sprite?.resource || palette?.sprite;

      if (!spriteResource) {
        // Use missingno as fallback
        this.manifest.sprites[key] = {
          path: '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png',
          isDefault: true,
        };
        this.manifest.count.default++;
        this.manifest.count.total++;
        return;
      }

      // Extract the path from the resource
      const resourcePath = `assets/pixelmon/textures/${spriteResource.split(':')[1]}`;
      const defaultResourcePath = path.join(
        this.DEFAULT_RESOURCEPACK_PATH,
        resourcePath,
      );
      const customResourcePath = path.join(
        this.CUSTOM_RESOURCEPACK_PATH,
        resourcePath,
      );

      // Check if sprite exists in custom pack first, then default pack
      let finalPath: string;
      let isDefault: boolean;

      if (fs.existsSync(customResourcePath)) {
        finalPath = path.join('/smartrotom/packs/resourcepack', resourcePath);
        isDefault = false;
        this.manifest.count.custom++;
      } else if (fs.existsSync(defaultResourcePath)) {
        finalPath = path.join(
          '/smartrotom/packs/default_resourcepack',
          resourcePath,
        );
        isDefault = true;
        this.manifest.count.default++;
      } else {
        // Fallback to missingno if sprite not found
        finalPath =
          '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
        isDefault = true;
        this.manifest.count.default++;
      }

      this.manifest.sprites[key] = {
        path: finalPath,
        isDefault,
      };
      this.manifest.count.total++;
    } catch (error: any) {
      this.logger.warn(`Failed to process sprite for ${key}: ${error.message}`);
      // Add a fallback entry
      this.manifest.sprites[key] = {
        path: '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png',
        isDefault: true,
      };
      this.manifest.count.default++;
      this.manifest.count.total++;
    }
  }

  /**
   * Save the manifest to disk
   */
  private async saveManifest(): Promise<void> {
    try {
      const manifestDir = path.dirname(this.MANIFEST_PATH);
      if (!fs.existsSync(manifestDir)) {
        await fsPromises.mkdir(manifestDir, { recursive: true });
      }
      await fsPromises.writeFile(
        this.MANIFEST_PATH,
        JSON.stringify(this.manifest, null, 2),
      );
      this.logger.log(`Saved sprite manifest to ${this.MANIFEST_PATH}`);
    } catch (error: any) {
      this.logger.error(`Failed to save sprite manifest: ${error.message}`);
    }
  }

  /**
   * Get a sprite URL from the manifest
   */
  getSprite(
    pokemonId: number = 0,
    formName: string = 'base',
    paletteName: string = 'none',
  ): string {
    // Ensure manifest is loaded
    if (!this.manifest || !this.manifest.sprites) {
      return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
    }

    const key = `${pokemonId}:${formName}:${paletteName}`;

    // Try exact match first
    if (this.manifest.sprites[key]) {
      return this.manifest.sprites[key].path;
    }

    // Try with default palette if specific palette not found
    const defaultPaletteKey = `${pokemonId}:${formName}:none`;
    if (this.manifest.sprites[defaultPaletteKey]) {
      return this.manifest.sprites[defaultPaletteKey].path;
    }

    // Try with default form if specific form not found
    const defaultFormKey = `${pokemonId}:base:${paletteName}`;
    if (this.manifest.sprites[defaultFormKey]) {
      return this.manifest.sprites[defaultFormKey].path;
    }

    // Last resort, use the base form with default palette
    const defaultKey = `${pokemonId}:base:none`;
    if (this.manifest.sprites[defaultKey]) {
      return this.manifest.sprites[defaultKey].path;
    }

    // Fallback to missingno
    return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
  }

  /**
   * Get the entire manifest
   */
  getManifest(): SpriteManifest {
    return this.manifest;
  }

  /**
   * Force regeneration of the manifest
   */
  async refreshManifest(): Promise<void> {
    await this.generateManifest();
  }
}
