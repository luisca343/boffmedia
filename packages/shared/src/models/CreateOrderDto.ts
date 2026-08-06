/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderLineInputDto } from './OrderLineInputDto';
export type CreateOrderDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    buyerUuid: string;
    lines: Array<OrderLineInputDto>;
};

