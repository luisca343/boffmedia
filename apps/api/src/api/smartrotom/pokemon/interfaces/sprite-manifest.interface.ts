/**
 * Interface for sprite location entries in the manifest
 */
export interface SpriteLocation {
  /**
   * Path to the sprite file
   */
  path: string;

  /**
   * Whether the sprite is from the default resourcepack or custom
   */
  isDefault: boolean;
}

/**
 * Interface for the sprite manifest structure
 */
export interface SpriteManifest {
  /**
   * Mapping of pokemonId:form:palette to sprite locations
   */
  sprites: { [key: string]: SpriteLocation };

  /**
   * Count of sprites in the manifest
   */
  count: {
    total: number;
    default: number;
    custom: number;
  };

  /**
   * When the manifest was last generated
   */
  lastUpdated: string;
}
