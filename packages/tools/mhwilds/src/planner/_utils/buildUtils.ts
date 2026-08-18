import { BuildData, BuildDataWithIds, DecorationAssignment, EquipmentType } from "../../types";

export interface BuildResolvers {
  getWeaponById: (id: string | null) => any;
  getArmorById: (id: string | null) => any;
  getDecorationById: (id: string) => any;
  getCharmById: (id: string | null) => any;
}

/**
 * Resolve an id-based build into full equipment objects, using the getters from
 * `useGameData`. Shared by the live build state and the compare view so any saved
 * build can be run through the real calc engine.
 */
export function resolveBuild(build: BuildDataWithIds, g: BuildResolvers): BuildData {
  return {
    name: build.name,
    weapon: g.getWeaponById(build.weaponId),
    secondaryWeapon: g.getWeaponById(build.secondaryWeaponId),
    head: g.getArmorById(build.headId),
    chest: g.getArmorById(build.chestId),
    arms: g.getArmorById(build.armsId),
    waist: g.getArmorById(build.waistId),
    legs: g.getArmorById(build.legsId),
    charm: g.getCharmById(build.charmId),
    decorations: build.decorations
      .map((d: { equipmentType: EquipmentType; slotIndex: number; decorationId: string }) => ({
        equipmentType: d.equipmentType,
        slotIndex: d.slotIndex,
        decoration: g.getDecorationById(d.decorationId),
      }))
      .filter((d: { decoration: any }) => d.decoration !== null) as DecorationAssignment[],
  };
}

/**
 * Convert single letter equipment type to full type
 */
export const getFullEquipmentType = (shortType: string): EquipmentType => {
  const typeMap: Record<string, EquipmentType> = {
    'w': 'weapon',
    's': 'secondaryWeapon',
    'h': 'head',
    'c': 'chest',
    'a': 'arms',
    'v': 'waist',
    'l': 'legs',
    'm': 'charm'
  };
  
  return typeMap[shortType] || 'weapon';
};

/**
 * Convert full equipment type to short form for URL encoding
 */
export const getShortEquipmentType = (fullType: EquipmentType): string => {
  const typeMap: Record<string, string> = {
    'weapon': 'w',
    'secondaryWeapon': 's',
    'head': 'h',
    'chest': 'c',
    'arms': 'a',
    'waist': 'v',
    'legs': 'l',
    'charm': 'm'
  };
  
  return typeMap[fullType] || 'w';
};

/**
 * Convert a string to URL-safe Base64
 */
export const toUrlSafeBase64 = (str: string): string => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  /**
   * Convert URL-safe Base64 back to a regular string
   */
  export const fromUrlSafeBase64 = (safeB64: string): string => {
    // Add back padding if needed
    let b64 = safeB64;
    while (b64.length % 4) {
      b64 += '=';
    }
    
    // Replace URL-safe chars with standard Base64 chars
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    
    return atob(b64);
  };
  


/**
 * Import a build from a URL parameter
 */
export const importBuildFromUrl = (defaultName: string = "Mi Build"): BuildDataWithIds | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Extract the build parameter from the URL
      const params = new URLSearchParams(window.location.search);
      const buildParam = params.get('b');
      
      if (buildParam) {
        // Decode and parse the build data using URL-safe Base64 decoder
        const decodedData = fromUrlSafeBase64(buildParam);
        const minimalBuild = JSON.parse(decodedData);
        
        // Convert the minimal build back to a full BuildDataWithIds
        const importedBuild: BuildDataWithIds = {
          name: minimalBuild.n || defaultName,
          weaponId: minimalBuild.w || null,
          secondaryWeaponId: minimalBuild.s || null,
          headId: minimalBuild.h || null,
          chestId: minimalBuild.c || null,
          armsId: minimalBuild.a || null,
          waistId: minimalBuild.v || null,
          legsId: minimalBuild.l || null,
          charmId: minimalBuild.m || null,
          decorations: (minimalBuild.d || []).map((d: any) => ({
            equipmentType: getFullEquipmentType(d.e),
            slotIndex: d.i,
            slotSize: d.s,
            decorationId: d.d
          }))
        };
        
        // Clean up the URL to avoid reimporting on refresh
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        return importedBuild;
      }
    } catch (error) {
      console.error("Failed to import build from URL:", error);
    }
    
    return null;
  };

/**
 * Generate a shareable URL for a build
 */
export const generateShareableLink = (buildData: BuildDataWithIds): string => {
    try {
      // Create a minimal representation of the build
      const minimalBuild = {
        n: buildData.name,
        w: buildData.weaponId,
        s: buildData.secondaryWeaponId,
        h: buildData.headId,
        c: buildData.chestId,
        a: buildData.armsId,
        v: buildData.waistId,
        l: buildData.legsId,
        m: buildData.charmId,
        d: buildData.decorations.map(d => ({
          e: getShortEquipmentType(d.equipmentType),
          i: d.slotIndex,
          d: d.decorationId
        }))
      };
      
      // Compress the minimal data - use URL-safe Base64 encoding
      const compressedData = toUrlSafeBase64(JSON.stringify(minimalBuild));
      
      // Build the URL with the encoded data as a query parameter
      const shareableUrl = `${window.location.origin}${window.location.pathname}?b=${compressedData}`;
      
      return shareableUrl;
    } catch (error) {
      console.error("Error generating shareable link:", error);
      throw new Error("Failed to generate shareable link");
    }
  };
/**
 * Export a build as a JSON file
 */
export const exportBuildAsJson = (buildData: BuildDataWithIds): void => {
  try {
    // Prepare the build data as a JSON string
    const dataStr = JSON.stringify(buildData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create a download link and trigger it
    const fileName = `${buildData.name.replace(/\s+/g, "-")}-${Date.now()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", fileName);
    linkElement.click();
  } catch (error) {
    console.error("Error exporting build:", error);
    throw new Error("Failed to export build as JSON");
  }
};

/**
 * Save a build to localStorage
 */
export const saveBuildToLocalStorage = (buildData: BuildDataWithIds): string => {
  try {
    // Create a unique key using the name and timestamp
    const sanitizedName = buildData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const key = `mhw-build-${sanitizedName}-${Date.now()}`;
    
    // Add metadata to help with listing builds later
    const buildWithMetadata = {
      ...buildData,
      _meta: {
        savedAt: new Date().toISOString(),
        key
      }
    };
    
    localStorage.setItem(key, JSON.stringify(buildWithMetadata));
    return key;
  } catch (error) {
    console.error("Error saving build:", error);
    throw new Error("Failed to save build to local storage");
  }
};

/**
 * Get all saved builds from localStorage
 */
export const getSavedBuilds = (): Array<{
  key: string;
  name: string;
  savedAt: string;
  build: BuildDataWithIds;
}> => {
  try {
    const savedBuilds = [];
    
    // Scan localStorage for saved builds
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('mhw-build-')) {
        const buildJson = localStorage.getItem(key);
        if (buildJson) {
          const buildData = JSON.parse(buildJson);
          savedBuilds.push({
            key,
            name: buildData.name,
            savedAt: buildData._meta?.savedAt || new Date().toISOString(),
            build: buildData
          });
        }
      }
    }
    
    // Sort by saved date, newest first
    return savedBuilds.sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch (error) {
    console.error("Error loading saved builds:", error);
    return [];
  }
};

/**
 * Load a build from localStorage by key
 */
export const loadBuildFromLocalStorage = (key: string): BuildDataWithIds | null => {
  try {
    const buildJson = localStorage.getItem(key);
    if (buildJson) {
      const buildData = JSON.parse(buildJson);
      return buildData;
    }
    return null;
  } catch (error) {
    console.error("Error loading build:", error);
    return null;
  }
};

/**
 * Delete a build from localStorage by key
 */
export const deleteBuildFromLocalStorage = (key: string): boolean => {
  try {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting build:", error);
    return false;
  }
};