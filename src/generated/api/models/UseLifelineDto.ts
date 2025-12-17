/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UseLifelineDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Session ID
     */
    sessionId: number;
    /**
     * Player UUID
     */
    playerUuid: string;
    /**
     * Lifeline type
     */
    lifelineType: UseLifelineDto.lifelineType;
};
export namespace UseLifelineDto {
    /**
     * Lifeline type
     */
    export enum lifelineType {
        _50_50 = '50:50',
        PHONE = 'phone',
        AUDIENCE = 'audience',
    }
}

