import { Injectable } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { TcgpCard, tcgpCards } from '@/_db/schema/TCGP';
import { and, asc, eq } from 'drizzle-orm';

@Injectable()
export class TgcpCardService {
  constructor(private db: MySQL2Service) {}

  async getCards(expansion: string = null): Promise<TcgpCard[]> {
    if (!expansion) {
      return this.db.getDrizzle().select().from(tcgpCards)
        .orderBy(asc(tcgpCards.expansion), asc(tcgpCards.number)).execute();
    }
    return this.db.getDrizzle().select().from(tcgpCards).where(eq(tcgpCards.expansion, expansion))
      .orderBy(asc(tcgpCards.expansion), asc(tcgpCards.number)).execute();
  }

  async getCard(expansion: string, number: number): Promise<TcgpCard> {
    const result = await this.db.getDrizzle().select().from(tcgpCards)
      .where(and(eq(tcgpCards.expansion, expansion), eq(tcgpCards.number, number)))
      .execute();
    return result[0];
  }
}