/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GobiernoExpedienteEventoEntity } from './GobiernoExpedienteEventoEntity';
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoExpedienteEntity = {
    id: number;
    code: string;
    title: string;
    subject: PersonRefEntity;
    dep: string;
    status: string;
    severity: string;
    lead: PersonRefEntity;
    openedAt: string;
    closedAt?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
    timeline?: Array<GobiernoExpedienteEventoEntity>;
};

