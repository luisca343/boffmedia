import { ArmorPiece, Charm, Decoration, Weapon } from "@/types/tools/mhwilds";
import { apiGET } from "@/services/boffAPI";

export const mhWildsService = {
    getWeapons: () => apiGET<Weapon[]>('/tools/mhwilds/weapons'),
    getArmor: () => apiGET<ArmorPiece[]>('/tools/mhwilds/armor'),
    getCharms: () => apiGET<Charm[]>('/tools/mhwilds/ranks'),
    getDecorations: () => apiGET<Decoration[]>('/tools/mhwilds/decorations'),
    getSkills: () => apiGET<any[]>('/tools/mhwilds/skills'),
};

