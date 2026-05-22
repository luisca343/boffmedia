/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MatchSlotDto = {
    slotIndex: number;
    speciesId: Record<string, any> | null;
    speciesName: Record<string, any> | null;
    role: MatchSlotDto.role;
};
export namespace MatchSlotDto {
    export enum role {
        LEAD1 = 'lead1',
        LEAD2 = 'lead2',
        BACK1 = 'back1',
        BACK2 = 'back2',
        UNKNOWN = 'unknown',
    }
}

