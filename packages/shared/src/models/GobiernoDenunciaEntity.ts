/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoDenunciaEntity = {
    id: number;
    code: string;
    town?: Record<string, any> | null;
    plotNumber?: number | null;
    accused?: PersonRefEntity | null;
    reporter: PersonRefEntity;
    category: string;
    status: string;
    description: string;
    resolution?: Record<string, any> | null;
    resolvedBy?: PersonRefEntity | null;
    resolvedAt?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
};

