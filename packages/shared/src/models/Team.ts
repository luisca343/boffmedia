/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Team = {
    /**
     * Unique identifier for the team
     */
    id: number;
    /**
     * Event ID this team belongs to
     */
    eventId: number;
    /**
     * Name of the team
     */
    name: string;
    /**
     * Team tag/code
     */
    tag?: string;
    /**
     * Team icon URL
     */
    icon?: string;
    /**
     * Team status
     */
    status?: Team.status;
    /**
     * Total team score
     */
    totalScore?: number;
    /**
     * When the team was created
     */
    createdAt: string;
    /**
     * When the team was last updated
     */
    updatedAt: string;
    /**
     * When the team was deleted
     */
    deletedAt?: string;
};
export namespace Team {
    /**
     * Team status
     */
    export enum status {
        ACTIVE = 'active',
        DISQUALIFIED = 'disqualified',
        WITHDREW = 'withdrew',
    }
}

