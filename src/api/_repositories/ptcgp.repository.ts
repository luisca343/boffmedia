import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, sql, asc, desc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  tcgpExpansions,
  tcgpBoosterPacks, 
  tcgpCards, 
  tcgpCardsPacks, 
  tcgpUsersCards,
  tcgpUserCardHistory,
  TcgpCard,
  TcgpBoosterPack,
  TcgpExpansion,
  TcgpUserCard
} from '@/_db/schema/TCGP';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

@Injectable()
export class PtcgpRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== USER OPERATIONS ====================
  
  async findUserByUsername(username: string) {
    const result = await this.db.select({ id: boffMediaUsers.id })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.username, username))
      .limit(1);
    
    return result[0] || null;
  }

  // ==================== EXPANSION OPERATIONS ====================
  
  async findExpansionById(id: string) {
    const result = await this.db.select()
      .from(tcgpExpansions)
      .where(eq(tcgpExpansions.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async createExpansion(data: Partial<TcgpExpansion>) {
    return this.db.insert(tcgpExpansions).values(data as TcgpExpansion);
  }

  async updateExpansion(id: string, data: Partial<TcgpExpansion>) {
    return this.db.update(tcgpExpansions)
      .set(data as TcgpExpansion)
      .where(eq(tcgpExpansions.id, id));
  }

  // ==================== BOOSTER PACK OPERATIONS ====================
  
  async findBoosterPacksByExpansion(expansion?: string) {
    if (!expansion) {
      return this.db.select().from(tcgpBoosterPacks);
    }
    
    return this.db.select()
      .from(tcgpBoosterPacks)
      .where(eq(tcgpBoosterPacks.expansion, expansion));
  }

  async findBoosterPackByName(name: string, expansion: string) {
    const result = await this.db.select()
      .from(tcgpBoosterPacks)
      .where(and(
        eq(tcgpBoosterPacks.name, name),
        eq(tcgpBoosterPacks.expansion, expansion)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async createBoosterPack(data: Partial<TcgpBoosterPack>) {
    return this.db.insert(tcgpBoosterPacks).values(data as TcgpBoosterPack);
  }

  // ==================== CARD OPERATIONS ====================
  
  async findCards(expansion?: string) {
    if (!expansion) {
      return this.db.select()
        .from(tcgpCards)
        .orderBy(asc(tcgpCards.expansion), asc(tcgpCards.number));
    }
    
    return this.db.select()
      .from(tcgpCards)
      .where(eq(tcgpCards.expansion, expansion))
      .orderBy(asc(tcgpCards.expansion), asc(tcgpCards.number));
  }

  async findCard(expansion: string, number: number) {
    const result = await this.db.select()
      .from(tcgpCards)
      .where(and(
        eq(tcgpCards.expansion, expansion), 
        eq(tcgpCards.number, number)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async createCard(data: Partial<TcgpCard>) {
    return this.db.insert(tcgpCards).values(data as TcgpCard);
  }

  async findCardsByPack(expansion: string, packId: string) {
    return this.db.select({
      rarity: tcgpCards.rarity,
    })
    .from(tcgpCardsPacks)
    .innerJoin(
      tcgpCards,
      and(
        eq(tcgpCardsPacks.expansion, tcgpCards.expansion),
        eq(tcgpCardsPacks.card_number, tcgpCards.number),
      ),
    )
    .where(
      and(
        eq(tcgpCardsPacks.expansion, expansion),
        eq(tcgpCardsPacks.pack_id, packId),
      ),
    );
  }

  // ==================== USER CARD OPERATIONS ====================
  
  async findUserCards(username: string) {
    return this.db.select({
      expansion: tcgpUsersCards.expansion,
      cardNumber: tcgpUsersCards.card_number,
      count: tcgpUsersCards.count,
      cardName: tcgpCards.name
    })
    .from(tcgpUsersCards)
    .innerJoin(boffMediaUsers, eq(tcgpUsersCards.user_id, boffMediaUsers.id))
    .leftJoin(tcgpCards, and(
      eq(tcgpUsersCards.expansion, tcgpCards.expansion),
      eq(tcgpUsersCards.card_number, tcgpCards.number)
    ))
    .where(eq(boffMediaUsers.username, username));
  }

  async findUserCard(userId: number, expansion: string, cardNumber: number) {
    const result = await this.db.select()
      .from(tcgpUsersCards)
      .where(and(
        eq(tcgpUsersCards.user_id, userId),
        eq(tcgpUsersCards.expansion, expansion),
        eq(tcgpUsersCards.card_number, cardNumber),
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async createUserCard(data: Partial<TcgpUserCard>) {
    return this.db.insert(tcgpUsersCards).values(data as TcgpUserCard);
  }

  async updateUserCard(userId: number, expansion: string, cardNumber: number, data: Partial<TcgpUserCard>) {
    return this.db.update(tcgpUsersCards)
      .set(data as TcgpUserCard)
      .where(and(
        eq(tcgpUsersCards.user_id, userId),
        eq(tcgpUsersCards.expansion, expansion),
        eq(tcgpUsersCards.card_number, cardNumber),
      ));
  }

  async deleteUserCard(userId: number, expansion: string, cardNumber: number) {
    return this.db.delete(tcgpUsersCards)
      .where(and(
        eq(tcgpUsersCards.user_id, userId),
        eq(tcgpUsersCards.expansion, expansion),
        eq(tcgpUsersCards.card_number, cardNumber),
      ));
  }

  // ==================== MISSING CARDS OPERATIONS ====================
  
  async findMissingCards(userId: number, expansion?: string) {
    const whereConditions = [isNull(tcgpUsersCards.user_id)];
    
    if (expansion) {
      whereConditions.push(eq(tcgpCards.expansion, expansion));
    }

    return this.db.select({
      expansion: tcgpCards.expansion,
      number: tcgpCards.number,
      rarity: tcgpCards.rarity,
      name: tcgpCards.name,
      pack: tcgpCardsPacks.pack_id,
    })
    .from(tcgpCards)
    .leftJoin(
      tcgpUsersCards,
      and(
        eq(tcgpUsersCards.user_id, userId),
        eq(tcgpUsersCards.expansion, tcgpCards.expansion),
        eq(tcgpUsersCards.card_number, tcgpCards.number),
      ),
    )
    .leftJoin(
      tcgpCardsPacks,
      and(
        eq(tcgpCardsPacks.expansion, tcgpCards.expansion),
        eq(tcgpCardsPacks.card_number, tcgpCards.number),
      ),
    )
    .where(and(...whereConditions));
  }

  async countTotalCards(expansion: string): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` })
      .from(tcgpCards)
      .where(eq(tcgpCards.expansion, expansion));
    
    return result[0]?.count as number || 0;
  }

  // ==================== CARD HISTORY OPERATIONS ====================
  
  async createCardHistory(data: {
    user_id: number;
    expansion: string;
    card_number: number;
    count: number;
  }) {
    return this.db.insert(tcgpUserCardHistory).values(data);
  }

  async findRecentCardUpdates(userId: number, limit: number = 10, offset: number = 0) {
    return this.db.select({
      id: tcgpUserCardHistory.id,
      expansion: tcgpUserCardHistory.expansion,
      cardNumber: tcgpUserCardHistory.card_number,
      count: tcgpUserCardHistory.count,
      updatedAt: tcgpUserCardHistory.updated_at,
      cardName: tcgpCards.name,
    })
    .from(tcgpUserCardHistory)
    .leftJoin(tcgpCards, and(
      eq(tcgpUserCardHistory.expansion, tcgpCards.expansion),
      eq(tcgpUserCardHistory.card_number, tcgpCards.number)
    ))
    .where(eq(tcgpUserCardHistory.user_id, userId))
    .orderBy(desc(tcgpUserCardHistory.updated_at))
    .limit(limit)
    .offset(offset);
  }

  // ==================== CARD PACK OPERATIONS ====================
  
  async createCardPack(data: {
    expansion: string;
    card_number: number;
    pack_id: string;
  }) {
    return this.db.insert(tcgpCardsPacks).values(data);
  }

  // ==================== TRANSACTION OPERATIONS ====================
  
  async executeTransaction<T>(callback: (tx: MySql2Database<Record<string, never>>) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }
}