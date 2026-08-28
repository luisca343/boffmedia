/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DesktopSessionUserEntity = {
    id: number;
    username: string;
    /**
     * Solo si la cuenta tiene Minecraft vinculado.
     */
    mcUuid: Record<string, any> | null;
    /**
     * URL ABSOLUTA del avatar, o null si la cuenta nunca ha puesto uno (la app dibuja su monograma). Se absolutiza aquí porque la columna guarda rutas relativas además de URLs de Discord/Twitch, y en `tauri://localhost` una ruta relativa no resuelve a nada. El `?v=` es `updated_at`: la caché de iconos del launcher indexa por URL y no caduca, así que sin él un avatar cambiado nunca se refrescaría.
     */
    avatarUrl: Record<string, any> | null;
};

