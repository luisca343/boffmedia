/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SetParticipantStatusDto = {
    /**
     * Membership status. `registered` and `confirmed` both entitle the player to the event pack; `declined` and `removed` do not.
     */
    status: SetParticipantStatusDto.status;
};
export namespace SetParticipantStatusDto {
    /**
     * Membership status. `registered` and `confirmed` both entitle the player to the event pack; `declined` and `removed` do not.
     */
    export enum status {
        REGISTERED = 'registered',
        CONFIRMED = 'confirmed',
        DECLINED = 'declined',
        REMOVED = 'removed',
    }
}

