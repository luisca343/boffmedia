import { Injectable } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { tcgpCards, tcgpUserCardHistory, tcgpUsersCards } from '@/_db/schema/TCGP';
import { and, desc, eq } from 'drizzle-orm';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

@Injectable()
export class TgcpUserCardService {
  constructor(private db: MySQL2Service) {}

  async getUserCards(username: string) {
    return this.db.getDrizzle()
      .select({
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
      .where(eq(boffMediaUsers.username, username))
      .execute();
  }

  async batchUpdateUserCards(username: string, cardUpdates: { expansion: string; cardNumber: number; packId: string; change: number }[]) {
    const db = this.db.getDrizzle();

    await db.transaction(async (tx) => {
      const user = await tx.select({ id: boffMediaUsers.id })
        .from(boffMediaUsers)
        .where(eq(boffMediaUsers.username, username))
        .execute();

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const userId = user[0].id;

      for (const update of cardUpdates) {
        const { expansion, cardNumber, change } = update;

        const existingCard = await tx
          .select()
          .from(tcgpUsersCards)
          .where(and(
            eq(tcgpUsersCards.user_id, userId),
            eq(tcgpUsersCards.expansion, expansion),
            eq(tcgpUsersCards.card_number, cardNumber),
          ))
          .execute();

        if (existingCard.length > 0) {
          const newCount = Math.max(existingCard[0].count + change, 0);
          if (newCount === 0) {
            await tx
              .delete(tcgpUsersCards)
              .where(and(
                eq(tcgpUsersCards.user_id, userId),
                eq(tcgpUsersCards.expansion, expansion),
                eq(tcgpUsersCards.card_number, cardNumber),
              ))
              .execute();
          } else {
            await tx
              .update(tcgpUsersCards)
              .set({ count: newCount, obtained_at: new Date() })
              .where(and(
                eq(tcgpUsersCards.user_id, userId),
                eq(tcgpUsersCards.expansion, expansion),
                eq(tcgpUsersCards.card_number, cardNumber),
              ))
              .execute();
          }
        } else if (change > 0) {
          await tx
            .insert(tcgpUsersCards)
            .values({
              user_id: userId,
              expansion,
              card_number: cardNumber,
              count: change,
              obtained_at: new Date(),
            })
            .execute();
        }

        // Add history entry
        await tx
          .insert(tcgpUserCardHistory)
          .values({
            user_id: userId,
            expansion,
            card_number: cardNumber,
            count: change,
          })
          .execute();
      }
    });

    return { success: true, message: 'Cards updated successfully' };
  }

  async getRecentCardUpdates(username: string, limit: number = 10, offset: number = 0) {
    const db = this.db.getDrizzle();

    const user = await db.select({ id: boffMediaUsers.id })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.username, username))
      .execute();

    if (user.length === 0) {
      console.log('User not found');
      throw new Error('User not found');
    }

    const userId = user[0].id;

    const updates = await db
      .select({
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
      .offset(offset)
      .execute();

    console.log('updates', updates);
    return updates;
  }
}