/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateConfigDto = {
    romHint?: string;
    /**
     * Re-attach the event to a different emulator pack (draft only)
     */
    packId?: string;
    /**
     * Select / re-select the base library ROM. Allowed while draft, or on a config that has no ROM yet (re-pins sha512 + rom_id).
     */
    romId?: number;
};

