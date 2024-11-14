import { Injectable } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { tcgpCards, tcgpUsersCards } from '@/_db/schema/TCGP';
import { and, eq } from 'drizzle-orm';
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
      }
    });

    return { success: true, message: 'Cards updated successfully' };
  }
}