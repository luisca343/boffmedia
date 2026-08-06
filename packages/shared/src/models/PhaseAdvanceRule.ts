/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PhaseAdvanceRule = {
    type: PhaseAdvanceRule.type;
    /**
     * record: "X-N or better" loss cap.
     */
    maxLosses: Record<string, any> | null;
    /**
     * top_n: N · record: optional cap by standings order.
     */
    count: Record<string, any> | null;
};
export namespace PhaseAdvanceRule {
    export enum type {
        ALL = 'all',
        TOP_N = 'top_n',
        RECORD = 'record',
        TOP_OR_RECORD = 'top_or_record',
    }
}

