/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StarBankTransaction = {
    /**
     * Source account ID (0 for system account)
     */
    from: number;
    /**
     * Destination account ID (0 for system account)
     */
    to: number;
    /**
     * Indicates if the user is the payer
     */
    isPayer: boolean;
    /**
     * Transaction amount in PokéDollars
     */
    amount: number;
    /**
     * Reason or description for the transaction
     */
    reason: string;
    /**
     * Source account balance after transaction
     */
    fromBalance: number;
    /**
     * Destination account balance after transaction
     */
    toBalance: number;
    /**
     * Type of transaction
     */
    type: StarBankTransaction.type;
    /**
     * Transaction timestamp
     */
    date: string;
    /**
     * Source account name
     */
    fromName?: string;
    /**
     * Destination account name
     */
    toName?: string;
    /**
     * Source account type
     */
    fromType?: string;
    /**
     * Destination account type
     */
    toType?: string;
    /**
     * Display name for the transaction
     */
    displayName?: string;
    /**
     * Display type for the transaction
     */
    displayAccountType?: string;
};
export namespace StarBankTransaction {
    /**
     * Type of transaction
     */
    export enum type {
        TRANSFERENCIA = 'TRANSFERENCIA',
        COMPRA = 'COMPRA',
        VENTA = 'VENTA',
        PREMIO = 'PREMIO',
        DERROTA_ENTRENADOR = 'DERROTA_ENTRENADOR',
        DEPOSITO = 'DEPOSITO',
        RETIRO = 'RETIRO',
        MULTA = 'MULTA',
        TASA = 'TASA',
        SUBASTA = 'SUBASTA',
        RECOMPENSA = 'RECOMPENSA',
        MERCADO = 'MERCADO',
        VENTA_P2P = 'VENTA_P2P',
    }
}

