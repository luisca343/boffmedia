/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateShopTransactionDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * UUID of the user
     */
    uuid: string;
    /**
     * Name of the NPC
     */
    npcName: string;
    /**
     * Name of the item
     */
    itemName: string;
    /**
     * Operation type: COMPRA (player pays) or VENTA (player is paid)
     */
    operation: CreateShopTransactionDto.operation;
    /**
     * Unit price of the item
     */
    unitPrice: number;
    /**
     * Count of the items
     */
    count: number;
};
export namespace CreateShopTransactionDto {
    /**
     * Operation type: COMPRA (player pays) or VENTA (player is paid)
     */
    export enum operation {
        COMPRA = 'COMPRA',
        VENTA = 'VENTA',
    }
}

