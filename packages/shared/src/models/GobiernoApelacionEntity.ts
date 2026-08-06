/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoApelacionEntity = {
    id: number;
    code: string;
    multaId: number;
    player: PersonRefEntity;
    status: string;
    grounds: string;
    reviewer?: PersonRefEntity | null;
    decision?: Record<string, any> | null;
    resolvedAt?: Record<string, any> | null;
    refundTxId?: number | null;
    createdAt: string;
    updatedAt: string;
};

