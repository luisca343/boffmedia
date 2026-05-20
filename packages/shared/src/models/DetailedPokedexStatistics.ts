/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DetailedPokedexStatistics = {
    /**
     * List of seen Pokémon (format: id:form)
     */
    seenPokemon: Array<string>;
    /**
     * List of caught Pokémon (format: id:form)
     */
    caughtPokemon: Array<string>;
    /**
     * List of shiny Pokémon caught (format: id:form)
     */
    shinyPokemon: Array<string>;
    /**
     * Total number of Pokémon species
     */
    totalPokemon: number;
    /**
     * Total number of forms
     */
    totalForms: number;
    /**
     * Number of unique Pokémon seen
     */
    seenCount: number;
    /**
     * Number of unique Pokémon caught
     */
    caughtCount: number;
    /**
     * Number of shiny Pokémon caught
     */
    shinyCount: number;
    /**
     * Number of Pokémon species not seen
     */
    missingSeenPokemon: number;
    /**
     * Number of Pokémon species not caught
     */
    missingCaughtPokemon: number;
    /**
     * Number of forms not seen
     */
    missingSeenForms: number;
    /**
     * Number of forms not caught
     */
    missingCaughtForms: number;
};

