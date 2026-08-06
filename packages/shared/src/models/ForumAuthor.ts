/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ForumAuthor = {
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
    tone: ForumAuthor.tone;
    /**
     * Role label
     */
    role: string;
};
export namespace ForumAuthor {
    /**
     * Deterministic display tone (id-derived)
     */
    export enum tone {
        ORANGE = 'orange',
        ACCENT = 'accent',
        EMERALD = 'emerald',
        PURPLE = 'purple',
    }
}

