/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Competitor } from './Competitor';
export type MatchView = {
    id: number;
    bracket: MatchView.bracket;
    roundNumber: number;
    position: number;
    top: Competitor | null;
    bot: Competitor | null;
    /**
     * Games won by top (TnMatch g1).
     */
    g1: Record<string, any> | null;
    /**
     * Games won by bot (TnMatch g2).
     */
    g2: Record<string, any> | null;
    status: MatchView.status;
    winner: Competitor | null;
    /**
     * Effective games-per-match (phase finals may escalate).
     */
    bestOf: number;
    scheduledAt: string | null;
    /**
     * Active self-report proposal state, if any.
     */
    proposalState: MatchView.proposalState | null;
};
export namespace MatchView {
    export enum bracket {
        WINNERS = 'winners',
        LOSERS = 'losers',
        GRAND = 'grand',
        GROUP = 'group',
        LEAGUE = 'league',
        SWISS = 'swiss',
        THIRD = 'third',
    }
    export enum status {
        PENDING = 'pending',
        READY = 'ready',
        LIVE = 'live',
        COMPLETED = 'completed',
        BYE = 'bye',
    }
    /**
     * Active self-report proposal state, if any.
     */
    export enum proposalState {
        PENDING = 'pending',
        DISPUTED = 'disputed',
    }
}

