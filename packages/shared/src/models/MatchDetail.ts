/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Competitor } from './Competitor';
import type { MatchProposalView } from './MatchProposalView';
import type { MatchSideRecord } from './MatchSideRecord';
import type { TeamsheetMonDto } from './TeamsheetMonDto';
export type MatchDetail = {
    id: number;
    bracket: MatchDetail.bracket;
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
    status: MatchDetail.status;
    winner: Competitor | null;
    /**
     * Effective games-per-match (phase finals may escalate).
     */
    bestOf: number;
    scheduledAt: string | null;
    /**
     * Active self-report proposal state, if any.
     */
    proposalState: MatchDetail.proposalState | null;
    /**
     * When a player asked for a judge at this table, if they have. Carried on the flat list so the admin panel can surface open requests without opening every match.
     */
    judgeRequestedAt: string | null;
    tournamentId: number;
    slug: string;
    tournamentName: string;
    phaseName: Record<string, any> | null;
    /**
     * What the requesting viewer is to this match.
     */
    viewerRole: MatchDetail.viewerRole;
    topRecord: MatchSideRecord | null;
    botRecord: MatchSideRecord | null;
    proposal?: MatchProposalView | null;
    /**
     * Opponent's open teamsheet — only for the two participants and admins.
     */
    opponentTeamsheet: Array<TeamsheetMonDto> | null;
    /**
     * The caller's own open teamsheet, for the two participants of this match. Read-only here: teamsheets lock when the field is resolved, before any match exists.
     */
    viewerTeamsheet: Array<TeamsheetMonDto> | null;
    champion: Competitor | null;
};
export namespace MatchDetail {
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
    /**
     * What the requesting viewer is to this match.
     */
    export enum viewerRole {
        TOP = 'top',
        BOT = 'bot',
        SPECTATOR = 'spectator',
        ADMIN = 'admin',
    }
}

