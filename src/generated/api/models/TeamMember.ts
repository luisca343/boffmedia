/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TeamMember = {
    /**
     * User ID
     */
    userId: number;
    /**
     * Team ID
     */
    teamId: number;
    /**
     * Participant ID
     */
    participantId: number;
    /**
     * Username
     */
    username: string;
    /**
     * Display name
     */
    displayName: string;
    /**
     * User avatar URL
     */
    avatar?: string;
    /**
     * Member role in the team
     */
    role: TeamMember.role;
    /**
     * When the user joined the team
     */
    joinedAt: string;
    /**
     * When the team member was last updated
     */
    updatedAt: string;
};
export namespace TeamMember {
    /**
     * Member role in the team
     */
    export enum role {
        LEADER = 'leader',
        MEMBER = 'member',
    }
}

