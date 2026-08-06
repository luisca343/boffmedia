/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoParcelaEntity = {
    /**
     * Null when this plot has no gobierno metadata row yet
     */
    id?: number | null;
    regionId: string;
    town: string;
    number: number;
    zonaId?: number | null;
    status: string;
    taxAmount?: number | null;
    taxDueAt?: Record<string, any> | null;
    notes?: Record<string, any> | null;
    owner?: PersonRefEntity | null;
    createdAt?: Record<string, any> | null;
    updatedAt?: Record<string, any> | null;
};

