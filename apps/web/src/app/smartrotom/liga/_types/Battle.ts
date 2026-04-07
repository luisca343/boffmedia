

export interface BattleReplay {
    id: number;
    side1: string;
    side2: string;
    team1: string;
    team2: string;
    replay: string;
    winner: number;
    date: string;
}

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