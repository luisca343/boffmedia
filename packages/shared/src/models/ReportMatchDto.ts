/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportMatchDto = {
    /**
     * Games won by the top competitor.
     */
    topScore: number;
    /**
     * Games won by the bottom competitor.
     */
    botScore: number;
    /**
     * Explicit winner (overrides score-derived).
     */
    winnerParticipantId?: number;
    /**
     * Walkover: the named winner advances by the opponent's absence (no-show / disqualification). Requires winnerParticipantId; scores and best-of bounds are ignored.
     */
    forfeit?: boolean;
    /**
     * Correct an already-resolved match. Allowed only while its successors (next/loser-next targets, later swiss rounds) are still unplayed.
     */
    amend?: boolean;
};

