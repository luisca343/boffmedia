/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RecordDeploymentDto = {
    /**
     * Existing product release, when one exists
     */
    releaseId?: number;
    surface: RecordDeploymentDto.surface;
    environment: RecordDeploymentDto.environment;
    productVersion: string;
    buildId: string;
    gitSha?: string;
    versionFileSha?: string;
    status: RecordDeploymentDto.status;
    healthCheckUrl?: string;
    healthCheckedAt?: string;
    failureReason?: string;
    idempotencyKey: string;
};
export namespace RecordDeploymentDto {
    export enum surface {
        WEB = 'web',
        API = 'api',
        DESKTOP = 'desktop',
    }
    export enum environment {
        DEVELOPMENT = 'development',
        STAGING = 'staging',
        PRODUCTION = 'production',
    }
    export enum status {
        VERIFIED = 'verified',
        FAILED = 'failed',
    }
}

