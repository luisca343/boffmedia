/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdaterPlatformEntity } from './UpdaterPlatformEntity';
export type UpdaterFeedEntity = {
    version: string;
    /**
     * Notas de la versión, en markdown
     */
    notes: string;
    /**
     * RFC 3339
     */
    pub_date: string;
    /**
     * Clave `{os}-{arch}`: windows-x86_64, darwin-aarch64, linux-x86_64…
     */
    platforms: Record<string, UpdaterPlatformEntity>;
};

