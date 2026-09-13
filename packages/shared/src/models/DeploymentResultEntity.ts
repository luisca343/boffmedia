/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeploymentEntity } from './DeploymentEntity';
import type { ReleaseReadinessEntity } from './ReleaseReadinessEntity';
export type DeploymentResultEntity = {
    deployment: DeploymentEntity;
    readiness: ReleaseReadinessEntity | null;
    releasePublished: boolean;
};

