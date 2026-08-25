import type { InspectReport, Pack } from "./types";

/** Packs must be loaded in `audit` mode, or the files this audits are missing. */
export declare function inspectPacks(packs: Pack[]): InspectReport;
export declare function formatInspect(report: InspectReport): string;
