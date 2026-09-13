/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DeploymentEntity = {
    id: number;
    releaseId?: number | null;
    surface: DeploymentEntity.surface;
    environment: DeploymentEntity.environment;
    productVersion: string;
    buildId: string;
    gitSha?: string | null;
    status: DeploymentEntity.status;
    idempotencyKey: string;
    recordedBy: string;
    deployedAt: string;
};
export namespace DeploymentEntity {
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

