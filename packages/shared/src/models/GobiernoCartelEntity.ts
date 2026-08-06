/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartelDestinationDto } from './CartelDestinationDto';
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoCartelEntity = {
    id: number;
    name: string;
    highway: string;
    destinations?: Array<CartelDestinationDto> | null;
    createdBy: PersonRefEntity;
    createdAt: string;
    updatedAt: string;
};

