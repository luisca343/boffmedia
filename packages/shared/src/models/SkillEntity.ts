/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SkillEntity = {
    /**
     * Unique identifier for the skill
     */
    id: number;
    /**
     * Name of the skill
     */
    name: string;
    /**
     * Description of the skill effect
     */
    description: string;
    /**
     * Maximum level for this skill
     */
    maxLevel: number;
    /**
     * Effect descriptions for each level
     */
    levels: Array<string>;
};

