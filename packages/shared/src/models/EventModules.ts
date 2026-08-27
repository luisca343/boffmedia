/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventTournamentSummary } from './EventTournamentSummary';
export type EventModules = {
    /**
     * Randomizer lifecycle, or null when the event has no randomizer. A `draft` config reads as null here: drafts are admin-only, so the public shape never reveals one.
     */
    randomizer?: EventModules.randomizer | null;
    /**
     * The tournament composed into this event, or null. Derived from tournaments.event_id — the same satellite-table rule as the randomizer, so it cannot drift from the thing it describes.
     */
    tournament?: EventTournamentSummary | null;
};
export namespace EventModules {
    /**
     * Randomizer lifecycle, or null when the event has no randomizer. A `draft` config reads as null here: drafts are admin-only, so the public shape never reveals one.
     */
    export enum randomizer {
        OPEN = 'open',
        CLOSED = 'closed',
        PUBLISHED = 'published',
    }
}

