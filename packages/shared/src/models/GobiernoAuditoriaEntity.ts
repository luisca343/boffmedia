/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoAuditoriaEntity = {
    id: number;
    actorUuid: string;
    /**
     * The actor, resolved to a name. Every uuid on a gobierno row is enriched like this — the UI renders names and avatars and must never N+1 to look them up.
     */
    actor: PersonRefEntity | null;
    /**
     * Short verb: create, update, delete, pay, cancel, resolve, capture, close, send, grant, revoke…
     */
    action: string;
    target: string;
    /**
     * urbanismo | seguridad | hacienda | justicia | poblacion | gobierno | eventos | administracion
     */
    dep: string;
    /**
     * Which screen logged this row: gobierno (Auditoría) or actividad (Actividad).
     */
    source: string;
    createdAt: string;
};

