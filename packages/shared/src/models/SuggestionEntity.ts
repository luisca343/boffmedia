/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SuggestionEntity = {
    id: number;
    proposerUserId: Record<string, any> | null;
    title: string;
    gameName: string;
    type: string;
    description: string;
    additionalInfo: Record<string, any> | null;
    suggestedDate: string | null;
    endDate: string | null;
    maxParticipants: Record<string, any> | null;
    status: SuggestionEntity.status;
    reviewNote: Record<string, any> | null;
    createdAt: string;
};
export namespace SuggestionEntity {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        REJECTED = 'rejected',
    }
}

