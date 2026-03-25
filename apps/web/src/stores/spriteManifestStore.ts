import { create } from 'zustand';
import { PokemonService } from '@/services/api/smartrotom/pokemonService';
import { SpriteInfo, SpriteManifest } from '@/types/Pokemon';

interface SpriteManifestState {
  manifest: SpriteManifest | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchManifest: () => Promise<void>;
  refreshManifest: () => Promise<number | null>;
  getSprite: (params: { id: number; form?: string; palette?: string }) => SpriteInfo | null;
}

export const useSpriteManifestStore = create<SpriteManifestState>((set, get) => ({
  manifest: null,
  isLoading: false,
  error: null,
  
  fetchManifest: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching sprite manifest...');
      const manifest = (await PokemonService.getSpriteManifest()).data as SpriteManifest;
      set({ manifest, isLoading: false });
    } catch (error) {
      console.error('Error fetching sprite manifest:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sprite manifest', 
        isLoading: false 
      });
    }
  },
  
  refreshManifest: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = (await PokemonService.refreshSpriteManifest()).data as { count: number };
      await get().fetchManifest();
      return result.count;
    } catch (error) {
      console.error('Error refreshing sprite manifest:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh sprite manifest', 
        isLoading: false 
      });
      return null;
    }
  },
  
  getSprite: ({ id, form = 'base', palette = 'none' }) => {
    const { manifest } = get();
    if (!manifest) return null;
    
    // Create the sprite key in the format "id:form:palette"
    const spriteKey = `${id}:${form}:${palette}`;
    
    // Check if the sprite exists in the manifest
    if (spriteKey in manifest.sprites) {
      return manifest.sprites[spriteKey];
    }
    
    // If the requested palette doesn't exist, try to fall back to "none" palette
    if (palette !== 'none') {
      const fallbackKey = `${id}:${form}:none`;
      if (fallbackKey in manifest.sprites) {
        return manifest.sprites[fallbackKey];
      }
    }
    
    // If the requested form doesn't exist, try to fall back to "base" form
    if (form !== 'base') {
      const fallbackKey = `${id}:base:${palette}`;
      if (fallbackKey in manifest.sprites) {
        return manifest.sprites[fallbackKey];
      }
      
      // Try base form with none palette as a last resort
      const lastResortKey = `${id}:base:none`;
      if (lastResortKey in manifest.sprites) {
        return manifest.sprites[lastResortKey];
      }
    }
    
    return null;
  }
}));