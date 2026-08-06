/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoBitacoraEntity = {
    id: number;
    patrullaId?: number | null;
    officer: PersonRefEntity;
    text: string;
    tone: GobiernoBitacoraEntity.tone;
    createdAt: string;
};
export namespace GobiernoBitacoraEntity {
    export enum tone {
        OK = 'ok',
        WARN = 'warn',
        DANGER = 'danger',
        INFO = 'info',
    }
}

