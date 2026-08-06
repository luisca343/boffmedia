/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ObjetoMC } from './ObjetoMC';
import type { PokemonMC } from './PokemonMC';
export type ReserveCajaResponse = {
    objetos: Array<ObjetoMC>;
    pokemon: Array<PokemonMC>;
    /**
     * Opaque id to pass to POST /caja/confirm after delivery. Null when nothing was owed.
     */
    reservationId: Record<string, any> | null;
};

