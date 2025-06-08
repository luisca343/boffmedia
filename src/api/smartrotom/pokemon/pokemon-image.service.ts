import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PokemonDataService } from './pokemon-data.service';

import { and, eq } from 'drizzle-orm';
import { pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class PokemonImageService {
  constructor(
    private readonly pokemonDataService: PokemonDataService,
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
) {}
  private dexCache: { [key: string]: { date: Date; data: any[] } } = {};

  getItemSprite(name: string) {
    const itemFileName1 = name.replaceAll('_', '').toUpperCase();
    const itemFileName2 = name;
    const sprite = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName1 + '.png');
    const sprite2 = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items/other', itemFileName2 + '.png');
    if (fs.existsSync(sprite)) return { url: path.join('/smartrotom/img/sprites/items', itemFileName1 + '.png') };
    if (fs.existsSync(sprite2)) return { url: path.join('/smartrotom/img/sprites/items/other', itemFileName2 + '.png') };
    return { url: '/smartrotom/img/sprites/items/000.png' };
  }

  async getImage({
    pokemonId = 1,
    formName = "base",
    paletteName = 'none',
    uuid,
    type = 'img',
    hide
  }: {
    pokemonId?: number,
    formName: string,
    paletteName?: string,
    uuid: string,
    type?: string,
    hide?: number
  }) {
    const pokemon = this.pokemonDataService.getSpeciesByDex(pokemonId);
    if (!pokemon) {
      throw new Error(`Pokemon with id ${pokemonId} not found`);
    }
    
    const form = pokemon.forms.find((f) => f.name === formName) || pokemon.forms[0];
    let status = 0;
    
    if (pokemonId > 0) {
      if (!this.dexCache[uuid] || new Date().getTime() - this.dexCache[uuid].date.getTime() > 1000) {
        const pokemonStatus = await this.db
        .select()
        .from(pokedexRegistry)
        .where(and(
          eq(pokedexRegistry.uuid, uuid),
        ))
        .execute();
        this.dexCache[uuid] = { date: new Date(), data: pokemonStatus };
      }
      const pokemonStatus = this.dexCache[uuid].data;
      const pokemonStatusFiltered = hide == 1
      ? pokemonStatus.filter((p) => p.pokemonId == pokemonId && p.formId === formName && p.paletteId === paletteName)
      : pokemonStatus.filter((p) => p.pokemonId == pokemonId && p.formId === formName);
      
      if (pokemonStatusFiltered.length > 0) {
        status = pokemonStatusFiltered[0].caughtAt ? 2 : pokemonStatusFiltered[0].seenAt ? 1 : 0;
      }
    }
    
    let showImg = status !== 0;
    showImg = true;
    
    if (type === 'img') {
      const imageFolder = paletteName === 'shiny' ? 'Front Shiny' : paletteName === 'none' ? 'Front' : '';
      const pokemonImageName = formName == "base" ? pokemon.name.toUpperCase() : `${pokemon.name.toUpperCase()}_${form.name.toUpperCase()}`;
      
      const image = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`);
      if (fs.existsSync(image)) return { url: path.join('/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`), type: 'image', status, showImg };
    }
    
    let palette;
    Object.values(form.genderProperties).forEach((genderProperty) => {
      genderProperty.palettes.forEach((p) => {
        if (p.name === paletteName) palette = p;
        return;
      });
    });
    
    if (!palette) {
      palette = form.genderProperties[0].palettes[0];
    }
    
    const sprite = this.getSpriteURL(palette, pokemonId);
    
    const url = `assets/pixelmon/textures/${sprite.split(':')[1]}`;
    const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_resourcepack', url);
    const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/resourcepack', url);
    
    if (fs.existsSync(defaultDirDef)) return { url: path.join('/smartrotom/packs/default_resourcepack', url), type: 'sprite', status, showImg };
    if (fs.existsSync(publicDir)) return { url: path.join('/smartrotom/packs/resourcepack', url), type: 'sprite', status, showImg };
    return { url: '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png', status, showImg };
  }
  
  getSpriteURL(palette, pokemonId?: number){
    if(pokemonId == 774) return 'pixelmon:pokemon/774_minior/all/meteor/none/sprite.png'
    return palette?.sprite?.resource ? palette.sprite.resource : palette.sprite
  }

  getSimpleSprite(pokemonId: number, formName: string = 'base', paletteName: string = 'none'): string {
    try {
      const pokemon = this.pokemonDataService.getSpeciesByDex(pokemonId);
      if (!pokemon) {
        return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
      }
      
      const form = pokemon.forms.find((f) => f.name === formName) || pokemon.forms[0];
      
      // Get palette
      let palette;
      if (form.genderProperties) {
        for (const genderProperty of Object.values(form.genderProperties)) {
          if (genderProperty && genderProperty.palettes) {
            for (const p of genderProperty.palettes) {
              if (p && p.name === paletteName) {
                palette = p;
                break;
              }
            }
            if (palette) break;
          }
        }
      }
      
      if (!palette && form.genderProperties && form.genderProperties[0] && form.genderProperties[0].palettes) {
        palette = form.genderProperties[0].palettes[0];
      }
      
      if (!palette) {
        return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
      }
      
      // Handle special case for Minior
      const spriteResource = pokemonId === 774 ? 
        'pixelmon:pokemon/774_minior/all/meteor/none/sprite.png' : 
        (palette.sprite?.resource || palette.sprite);
        
      if (!spriteResource) {
        return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
      }
      
      const url = `assets/pixelmon/textures/${spriteResource.split(':')[1]}`;
      const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_resourcepack', url);
      const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/resourcepack', url);
      
      if (fs.existsSync(defaultDirDef)) {
        return path.join('/smartrotom/packs/default_resourcepack', url);
      }
      if (fs.existsSync(publicDir)) {
        return path.join('/smartrotom/packs/resourcepack', url);
      }
      
      return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
    } catch (error) {
      return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
    }
  }
}

