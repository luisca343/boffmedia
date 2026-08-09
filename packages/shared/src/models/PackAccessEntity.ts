/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccessRowEntity } from './AccessRowEntity';
import type { GrantingEventEntity } from './GrantingEventEntity';
import type { LegacyAccessRowEntity } from './LegacyAccessRowEntity';
export type PackAccessEntity = {
    grants: Array<AccessRowEntity>;
    legacy: Array<LegacyAccessRowEntity>;
    events: Array<GrantingEventEntity>;
};

