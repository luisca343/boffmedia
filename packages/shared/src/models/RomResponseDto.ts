/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RomResponseDto = {
    id: number;
    name: string;
    gamePlatform: RomResponseDto.gamePlatform;
    /**
     * SHA-512 content address in the blob store
     */
    sha512: string;
    fileSize: number;
    /**
     * How many configs pin this ROM (by rom_id or clean hash).
     */
    referencedBy: number;
    createdAt: string;
    updatedAt: string;
};
export namespace RomResponseDto {
    export enum gamePlatform {
        GBA = 'gba',
        NDS = 'nds',
    }
}

