/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TwoFactorEnrolmentEntity = {
    /**
     * Base32 shared secret, for typing in when the QR cannot be scanned
     */
    secret: string;
    /**
     * RFC 6238 / Key Uri Format provisioning URI
     */
    otpauth_url: string;
    /**
     * The provisioning URI as an inline SVG, so clients need no QR library
     */
    qr_svg: string;
};

