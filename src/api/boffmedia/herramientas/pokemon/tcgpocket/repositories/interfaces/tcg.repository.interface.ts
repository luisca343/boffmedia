import { TcgSeries } from '@/_db/schema/TCG';
import { TcgSeriesDto } from '../../dto/tcg-series.dto';

export interface ITcgRepository {
  // Series operations
  insertSeries(series: TcgSeriesDto[]): Promise<void>;
  findAll(): Promise<TcgSeries[]>;
  findSeriesById(id: string): Promise<TcgSeries | null>;
  
  // Sets operations
  getSetsBySeriesId(seriesId: string): Promise<any[]>;
  insertSets(sets: any[]): Promise<void>;
  findSetById(id: string): Promise<any | null>;
  
  // Cards operations
  getCardsBySetId(setId: string): Promise<any[]>;
  insertCards(cards: any[]): Promise<void>;
  findCardById(id: string): Promise<any | null>;
  
  // Utility operations
  checkExistingCards(setId: string): Promise<any[]>;
  checkExistingSets(seriesId: string): Promise<any[]>;
  checkIfSeriesExists(id: string): Promise<boolean>;
  checkIfSetExists(id: string): Promise<boolean>;
  checkIfCardExists(id: string): Promise<boolean>;
}