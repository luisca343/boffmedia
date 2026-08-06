/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoAnuncioEntity = {
    id: number;
    kind: string;
    title: string;
    body: string;
    town?: Record<string, any> | null;
    author: PersonRefEntity;
    pinned: boolean;
    audience: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
};

