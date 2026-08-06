/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RookerPostCaptureEntity = {
    pokemonId: number;
    formId: string;
    paletteId: string;
    /**
     * Derived: paletteId !== "none".
     */
    shiny: boolean;
    caughtAt?: Record<string, any> | null;
};

