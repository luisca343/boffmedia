import { ArmorPiece, Charm, Decoration, Weapon } from "@/types/tools/mhwilds";
import { apiGET } from "@/services/boffAPI";

export const mhWildsService = {
    getWeapons: (locale: string) => apiGET<Weapon[]>(`/tools/mhwilds/weapons/${locale}`),
    getArmor: (locale: string) => apiGET<ArmorPiece[]>(`/tools/mhwilds/armor/${locale}`),
    getCharms: (locale: string) => apiGET<Charm[]>(`/tools/mhwilds/ranks/${locale}`),
    getDecorations: (locale: string) => apiGET<Decoration[]>(`/tools/mhwilds/decorations/${locale}`),
    getSkills: (locale: string) => apiGET<any[]>(`/tools/mhwilds/skills/${locale}`),
    getWeaponTree: (locale: string) => apiGET<any>(`/tools/mhwilds/weapon-tree/${locale}`),
};