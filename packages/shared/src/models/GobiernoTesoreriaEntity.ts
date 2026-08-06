/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GobiernoTasaEntity } from './GobiernoTasaEntity';
import type { TesoreriaBreakdownItemEntity } from './TesoreriaBreakdownItemEntity';
import type { TesoreriaSeriePuntoEntity } from './TesoreriaSeriePuntoEntity';
export type GobiernoTesoreriaEntity = {
    /**
     * Current GOVERNMENT account balance
     */
    balance: number;
    /**
     * Window size in days used for the series/totals below
     */
    days: number;
    /**
     * Income over the window
     */
    ingresosMes: number;
    /**
     * Expense over the window
     */
    gastosMes: number;
    series: Array<TesoreriaSeriePuntoEntity>;
    ingresos: Array<TesoreriaBreakdownItemEntity>;
    gastos: Array<TesoreriaBreakdownItemEntity>;
    /**
     * The rate card, each row carrying what the ledger says it actually collected.
     */
    tasas: Array<GobiernoTasaEntity>;
};

