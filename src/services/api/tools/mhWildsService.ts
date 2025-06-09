import { ArmorPiece, Charm, Decoration, Weapon } from "@/types/tools/mhwilds";
import { apiGET } from "@/services/boffAPI";

export const mhWildsService = {
    getWeapons: (locale: string) => apiGET<Weapon[]>(`/herramientas/mhwilds/weapons/${locale}`),
    getArmor: (locale: string) => apiGET<ArmorPiece[]>(`/herramientas/mhwilds/armor/${locale}`),
    getCharms: (locale: string) => apiGET<Charm[]>(`/herramientas/mhwilds/ranks/${locale}`),
    getDecorations: (locale: string) => apiGET<Decoration[]>(`/herramientas/mhwilds/decorations/${locale}`),
    getSkills: (locale: string) => apiGET<any[]>(`/herramientas/mhwilds/skills/${locale}`),
    getWeaponTree: (locale: string) => apiGET<any>(`/herramientas/mhwilds/weapon-tree/${locale}`),
};