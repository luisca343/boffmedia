/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoBuscadoEntity = {
    id: number;
    code: string;
    player: PersonRefEntity;
    severity: GobiernoBuscadoEntity.severity;
    status: string;
    bounty: number;
    offense: string;
    reportedBy: PersonRefEntity;
    lastSeen?: Record<string, any> | null;
    notes?: Record<string, any> | null;
    capturedBy?: PersonRefEntity | null;
    capturedAt?: Record<string, any> | null;
    payoutTxId?: number | null;
    createdAt: string;
    updatedAt: string;
};
export namespace GobiernoBuscadoEntity {
    export enum severity {
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
        CRITICAL = 'critical',
    }
}

