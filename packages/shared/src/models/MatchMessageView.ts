/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MatchMessageView = {
    id: number;
    kind: MatchMessageView.kind;
    authorUserId: Record<string, any> | null;
    authorName: Record<string, any> | null;
    body: string;
    createdAt: string;
};
export namespace MatchMessageView {
    export enum kind {
        SYS = 'sys',
        PLAYER = 'player',
        JUDGE = 'judge',
    }
}

