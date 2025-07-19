import { TcgpCard, TcgpBoosterPack, TcgpExpansion, TcgpUserCard } from '@/_db/schema/TCGP';
import { MySql2Database } from 'drizzle-orm/mysql2';

export interface UserCardData {
  expansion: string;
  cardNumber: number;
  count: number;
  cardName: string | null;
}

export interface MissingCardData {
  expansion: string;
  number: number;
  rarity: string | null;
  name: string;
  pack: string | null;
}

export interface RecentCardUpdate {
  id: number;
  expansion: string;
  cardNumber: number;
  count: number;
  updatedAt: Date;
  cardName: string | null;
}

export interface CardHistoryData {
  user_id: number;
  expansion: string;
  card_number: number;
  count: number;
}

export interface CardPackData {
  expansion: string;
  card_number: number;
  pack_id: string;
}

export interface IPtcgpRepository {
  // User Operations
  findUserByUsername(username: string): Promise<{ id: number } | null>;

  // Expansion Operations
  findExpansionById(id: string): Promise<TcgpExpansion | null>;
  createExpansion(data: Partial<TcgpExpansion>): Promise<any>;
  updateExpansion(id: string, data: Partial<TcgpExpansion>): Promise<any>;

  // Booster Pack Operations
  findBoosterPacksByExpansion(expansion?: string): Promise<TcgpBoosterPack[]>;
  findBoosterPackByName(name: string, expansion: string): Promise<TcgpBoosterPack | null>;
  createBoosterPack(data: Partial<TcgpBoosterPack>): Promise<any>;

  // Card Operations
  findCards(expansion?: string): Promise<TcgpCard[]>;
  findCard(expansion: string, number: number): Promise<TcgpCard | null>;
  createCard(data: Partial<TcgpCard>): Promise<any>;
  findCardsByPack(expansion: string, packId: string): Promise<{ rarity: string | null }[]>;

  // User Card Operations
  findUserCards(username: string): Promise<UserCardData[]>;
  findUserCard(userId: number, expansion: string, cardNumber: number): Promise<TcgpUserCard | null>;
  createUserCard(data: Partial<TcgpUserCard>): Promise<any>;
  updateUserCard(userId: number, expansion: string, cardNumber: number, data: Partial<TcgpUserCard>): Promise<any>;
  deleteUserCard(userId: number, expansion: string, cardNumber: number): Promise<any>;

  // Missing Cards Operations
  findMissingCards(userId: number, expansion?: string): Promise<MissingCardData[]>;
  countTotalCards(expansion: string): Promise<number>;

  // Card History Operations
  createCardHistory(data: CardHistoryData): Promise<any>;
  findRecentCardUpdates(userId: number, limit?: number, offset?: number): Promise<RecentCardUpdate[]>;

  // Card Pack Operations
  createCardPack(data: CardPackData): Promise<any>;
  findCardPack(expansion: string, cardNumber: number, packId: string): Promise<CardPackData | null>;

  // Transaction Operations
  executeTransaction<T>(callback: (tx: MySql2Database<Record<string, never>>) => Promise<T>): Promise<T>;
}