/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PhaseAdvanceRule } from './PhaseAdvanceRule';
export type PhaseView = {
    id: number;
    /**
     * 1-based phase order.
     */
    order: number;
    name: string;
    format: PhaseView.format;
    status: PhaseView.status;
    /**
     * Swiss: fixed round count.
     */
    rounds: Record<string, any> | null;
    bestOf: number;
    /**
     * Best-of override for the decisive match (final/grand final).
     */
    finalsBestOf: Record<string, any> | null;
    /**
     * Groups: number of groups.
     */
    groupCount: Record<string, any> | null;
    /**
     * Single: third-place match is played.
     */
    thirdPlace: boolean;
    carryStandings: boolean;
    advance?: PhaseAdvanceRule | null;
    /**
     * Competitors that entered this phase.
     */
    entrantCount: number;
    /**
     * Competitors that advanced to the next phase (null on the final).
     */
    qualifiedCount: Record<string, any> | null;
    /**
     * Competitor ids currently making the cut under this phase advancement rule, server-computed from the same function `advance` uses. Empty on a phase with no rule. Clients render the cut from this instead of reimplementing the rule.
     */
    projectedQualifierIds: Array<string>;
    /**
     * Per-format render model for this phase.
     */
    view: Record<string, any>;
};
export namespace PhaseView {
    export enum format {
        SINGLE = 'single',
        DOUBLE = 'double',
        ROUNDROBIN = 'roundrobin',
        SWISS = 'swiss',
        LEADERBOARD = 'leaderboard',
        GROUPS = 'groups',
    }
    export enum status {
        PENDING = 'pending',
        LIVE = 'live',
        COMPLETED = 'completed',
    }
}

