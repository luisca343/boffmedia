/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartelDestinationDto } from './CartelDestinationDto';
export type UpdateCartelDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    name?: string;
    highway?: string;
    destinations?: Array<CartelDestinationDto>;
};

