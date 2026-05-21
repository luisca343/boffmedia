import { TcgSeriesDto } from '../../dto/tcg-series.dto';
import { UserCard, UserCardHistory } from '@/_db/schema/TCG';

export interface ITcgRepository {
  // ==================== SERIES OPERATIONS ====================
  insertSeries(series: TcgSeriesDto[]): Promise<void>;
  findAll(): Promise<any[]>;
  findSeriesById(id: string): Promise<any | null>;
  checkIfSeriesExists(id: string): Promise<boolean>;

  // ==================== SETS OPERATIONS ====================
  getSetsBySeriesId(seriesId: string): Promise<any[]>;
  insertSets(sets: any[]): Promise<void>;
  findSetById(id: string): Promise<any | null>;
  checkIfSetExists(id: string): Promise<boolean>;
  checkExistingSets(seriesId: string): Promise<any[]>;

  // ==================== CARDS OPERATIONS ====================
  getCardsBySetId(setId: string): Promise<any[]>;
  insertCards(cards: any[]): Promise<void>;
  findCardById(id: string): Promise<any | null>;
  checkIfCardExists(id: string): Promise<boolean>;
  checkExistingCards(setId: string): Promise<any[]>;

  // ==================== USER CARDS OPERATIONS ====================
  getUserCards(userId: number): Promise<UserCard[]>;
  getUserCard(userId: number, cardId: string): Promise<UserCard | null>;
  addUserCard(userId: number, cardId: string, quantity: number): Promise<void>;
  updateUserCardQuantity(
    userId: number,
    cardId: string,
    quantity: number,
  ): Promise<void>;
  removeUserCard(userId: number, cardId: string): Promise<void>;
  getUserCardHistory(userId: number): Promise<UserCardHistory[]>;
  addUserCardHistory(
    userId: number,
    cardId: string,
    quantityChange: number,
  ): Promise<void>;
}
