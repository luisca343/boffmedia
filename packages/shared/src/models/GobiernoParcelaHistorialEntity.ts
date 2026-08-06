/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoParcelaHistorialEntity = {
    id: number;
    regionId: string;
    town: string;
    number: number;
    previousOwner?: PersonRefEntity | null;
    newOwner?: PersonRefEntity | null;
    reason?: Record<string, any> | null;
    changedAt: string;
};

