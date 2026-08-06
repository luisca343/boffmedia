/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoMultaEntity = {
    id: number;
    code: string;
    player: PersonRefEntity;
    amount: number;
    status: string;
    reason: string;
    issuedBy: PersonRefEntity;
    denunciaId?: number | null;
    paidTxId?: number | null;
    paidAt?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
};

