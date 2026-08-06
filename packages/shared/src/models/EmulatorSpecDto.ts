/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EmulatorSpecDto = {
    kind: EmulatorSpecDto.kind;
    /**
     * Ruta del ROM dentro de la instancia; debe coincidir con una entrada de files[]. El emulador nunca se distribuye: el launcher usa el del jugador.
     */
    rom: string;
    args?: Array<string>;
};
export namespace EmulatorSpecDto {
    export enum kind {
        MGBA = 'mgba',
        MELONDS = 'melonds',
    }
}

