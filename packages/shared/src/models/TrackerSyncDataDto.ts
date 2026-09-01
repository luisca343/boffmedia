/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchDto } from './MatchDto';
import type { SeriesDto } from './SeriesDto';
import type { SessionDto } from './SessionDto';
import type { TeamPresetDto } from './TeamPresetDto';
import type { TrackerDeletedIdsDto } from './TrackerDeletedIdsDto';
export type TrackerSyncDataDto = {
    sessions: Array<SessionDto>;
    matches: Array<MatchDto>;
    series: Array<SeriesDto>;
    presets: Array<TeamPresetDto>;
    /**
     * Rows this account has deleted. A client removes these locally instead of treating them as local-only work to push back up.
     */
    deleted: TrackerDeletedIdsDto;
};

