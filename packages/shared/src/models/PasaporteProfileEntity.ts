/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PasaporteProfileEntity = {
    uuid: string;
    username: string;
    /**
     * Deterministic in the uuid — printed on the carné and encoded in its QR. Never regenerated.
     */
    trainerId: string;
    /**
     * The trainer's world, or Fukitsu when they have none.
     */
    region: string;
    memberSince?: string | null;
    createdAt?: string | null;
    /**
     * Derived, never stored: completed achievements in the "Gimnasios" category — the badges earned.
     */
    rank: number;
    /**
     * Derived from completionPct: 90+ / 70+ / 40+ / 15+ / else Novato.
     */
    title: string;
    /**
     * Derived: completed / total achievements * 100, rounded.
     */
    completionPct: number;
};

