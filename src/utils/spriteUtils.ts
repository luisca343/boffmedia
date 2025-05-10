import { useSpriteManifestStore } from '@/stores/spriteManifestStore';

interface GetSpriteUrlOptions {
  id: number;
  form?: string;
  palette?: string;
  baseUrl?: string;
}

/**
 * Gets the complete URL for a Pokémon sprite
 * @param options The sprite options
 * @returns The complete sprite URL or null if not found
 */
export function getSpriteUrl(options: GetSpriteUrlOptions): string | null {
  const { id, form = 'base', palette = 'none', baseUrl = process.env.NEXT_PUBLIC_ROTOM_API_URL || '' } = options;
  
  const spriteInfo = useSpriteManifestStore.getState().getSprite({ id, form, palette });
  if (!spriteInfo) return null;
  
  // Extract the path from the sprite info and convert backslashes to forward slashes for URLs
  const normalizedPath = spriteInfo.path.replace(/\\/g, '/');
  
  // Combine the base URL with the sprite path
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Hook version of getSpriteUrl to use within React components
 */
export function useGetSpriteUrl(): (options: GetSpriteUrlOptions) => string | null {
  return getSpriteUrl;
}