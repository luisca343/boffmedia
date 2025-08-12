/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DecorationEntity = {
    /**
     * Unique identifier for the decoration
     */
    id: number;
    /**
     * Name of the decoration
     */
    name: string;
    /**
     * Description of the decoration effect
     */
    description: string;
    /**
     * Slot size required for this decoration
     */
    slotSize: number;
    /**
     * Rarity level of the decoration
     */
    rarity: number;
    /**
     * Skills provided by the decoration
     */
    skills: Array<Record<string, any>>;
};

