/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoPatrullaEntity = {
    id: number;
    label: string;
    fromTime: string;
    toTime: string;
    zone?: Record<string, any> | null;
    status: string;
    officers: Array<PersonRefEntity>;
    createdAt: string;
    updatedAt: string;
};

