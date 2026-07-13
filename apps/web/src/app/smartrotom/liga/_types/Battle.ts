// Unused today (no consumer imports it), kept as the read-side counterpart of BattleConfig.
// Re-exported rather than hand-duplicated: the old copy typed `winner` as `number`, but the
// wire (and `CreateReplayDto`) both send it as a `string`.
export type { Replay as BattleReplay } from "@boffmedia/shared"

export interface BattleConfig {
    nombre: string;
    logro: string;
    nivel: string;
    dinero: number;
    modalidad: string;
    tamanoEquipos: string;
    frecuencia: string;
    IA: string;
    curar: boolean;
    preview: boolean;
    mecanica: string[];
    equipos: number[];
    recompensas: {
        objeto: string;
        cantidad: number;
        nbt?: string;
    }[];
    normas: string[];

}