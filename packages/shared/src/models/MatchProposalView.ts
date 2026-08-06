/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MatchProposalView = {
    /**
     * Stringified proposer participant id.
     */
    byParticipantId: string;
    /**
     * True when the viewer wrote this proposal.
     */
    mine: boolean;
    /**
     * Per-game 'W'/'L' from the VIEWER's perspective (top's for spectators).
     */
    games: string;
    topScore: number;
    botScore: number;
    state: MatchProposalView.state;
    expiresAt: string;
};
export namespace MatchProposalView {
    export enum state {
        PENDING = 'pending',
        DISPUTED = 'disputed',
    }
}

