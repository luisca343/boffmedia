/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ForumMember = {
    /**
     * BoffMedia user id
     */
    id: number;
    /**
     * Display name (username)
     */
    name: string;
    /**
     * Handle (username)
     */
    handle: string;
    /**
     * Uppercased first-letter avatar initial (fallback "?")
     */
    avatar: string;
    /**
     * The author's profile picture URL, or null to fall back to the initial
     */
    avatarUrl?: string | null;
    /**
     * Deterministic display tone (id-derived)
     */
    tone: ForumMember.tone;
    /**
     * Role label
     */
    role: string;
    /**
     * Presence status
     */
    status: ForumMember.status;
};
export namespace ForumMember {
    /**
     * Deterministic display tone (id-derived)
     */
    export enum tone {
        ORANGE = 'orange',
        ACCENT = 'accent',
        EMERALD = 'emerald',
        PURPLE = 'purple',
    }
    /**
     * Presence status
     */
    export enum status {
        ONLINE = 'online',
        IDLE = 'idle',
        OFFLINE = 'offline',
    }
}

