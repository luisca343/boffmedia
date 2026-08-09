/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConfigResponseDto = {
    id: number;
    eventId: number;
    gamePlatform: string;
    gameTitle: string;
    settingsBlobSha512: string;
    fvxJarSha512: string;
    cleanRomSha512: string;
    /**
     * Provenance: the library ROM this config was pinned from. Null for pre-library configs, which the editor flags for re-selection.
     */
    romId?: number | null;
    romHint: Record<string, any>;
    status: ConfigResponseDto.status;
    /**
     * Emulator pack attached to this config’s event (event.pack_id)
     */
    packId?: Record<string, any> | null;
    /**
     * Whether the full launcher chain resolves: event has a pack, event is active, and config is open.
     */
    launcherResolvable?: boolean;
    /**
     * The first broken gate, or null when launcherResolvable.
     */
    resolutionIssue?: ConfigResponseDto.resolutionIssue | null;
    createdAt: string;
    updatedAt: string;
};
export namespace ConfigResponseDto {
    export enum status {
        DRAFT = 'draft',
        OPEN = 'open',
        CLOSED = 'closed',
        PUBLISHED = 'published',
    }
    /**
     * The first broken gate, or null when launcherResolvable.
     */
    export enum resolutionIssue {
        NO_PACK = 'no-pack',
        EVENT_NOT_ACTIVE = 'event-not-active',
        CONFIG_NOT_OPEN = 'config-not-open',
    }
}

