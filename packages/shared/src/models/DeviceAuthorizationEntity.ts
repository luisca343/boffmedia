/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DeviceAuthorizationEntity = {
    /**
     * La mitad secreta: solo la guarda el launcher
     */
    deviceCode: string;
    /**
     * La mitad legible: el jugador la escribe en la web
     */
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    intervalSeconds: number;
};

