import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { NotificationsService } from '../../notifications/notifications.service';

// Every Wigglypop notification funnels through here. `type` on rotom_notifications is a free
// varchar, so the `wigglypop.*` namespace needs no migration.
//
// Notifying is never allowed to break the thing it is reporting on: a failed notification must
// not roll back a settled sale. Every send is therefore best-effort and swallowed with a log.
@Injectable()
export class WigglypopNotifyService {
  constructor(
    private readonly logger: Logger,
    private readonly notifications: NotificationsService,
  ) {}

  private async send(
    userUuid: string,
    type: string,
    title: string,
    body: string,
    link?: string,
  ): Promise<void> {
    try {
      await this.notifications.createNotification({
        userUuid,
        type,
        title,
        body,
        link,
      });
    } catch (error: any) {
      this.logger.error(
        `Wigglypop notification ${type} to ${userUuid} failed: ${error?.message}`,
      );
    }
  }

  private listingLink(listingId: number): string {
    return `/smartrotom/wigglypop/listing/${listingId}`;
  }

  private orderLink(orderId: number): string {
    return `/smartrotom/wigglypop/orders/${orderId}`;
  }

  async outbid(
    userUuid: string,
    listingId: number,
    title: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      userUuid,
      'wigglypop.outbid',
      'Te han superado la puja',
      `Alguien ha pujado ${amount} por "${title}".`,
      this.listingLink(listingId),
    );
  }

  async offerReceived(
    sellerUuid: string,
    listingId: number,
    title: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      sellerUuid,
      'wigglypop.offer.received',
      'Nueva oferta',
      `Han ofrecido ${amount} por "${title}".`,
      this.listingLink(listingId),
    );
  }

  async offerAccepted(
    buyerUuid: string,
    listingId: number,
    title: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      buyerUuid,
      'wigglypop.offer.accepted',
      'Oferta aceptada',
      `Tu oferta de ${amount} por "${title}" ha sido aceptada.`,
      this.listingLink(listingId),
    );
  }

  async offerRejected(
    buyerUuid: string,
    listingId: number,
    title: string,
  ): Promise<void> {
    await this.send(
      buyerUuid,
      'wigglypop.offer.rejected',
      'Oferta rechazada',
      `Tu oferta por "${title}" ha sido rechazada.`,
      this.listingLink(listingId),
    );
  }

  async tradeReceived(
    sellerUuid: string,
    listingId: number,
    title: string,
  ): Promise<void> {
    await this.send(
      sellerUuid,
      'wigglypop.trade.received',
      'Nueva propuesta de intercambio',
      `Te proponen un intercambio por "${title}".`,
      this.listingLink(listingId),
    );
  }

  async tradeAccepted(
    proposerUuid: string,
    listingId: number,
    title: string,
  ): Promise<void> {
    await this.send(
      proposerUuid,
      'wigglypop.trade.accepted',
      'Intercambio aceptado',
      `Tu propuesta por "${title}" ha sido aceptada.`,
      this.listingLink(listingId),
    );
  }

  async tradeRejected(
    proposerUuid: string,
    listingId: number,
    title: string,
  ): Promise<void> {
    await this.send(
      proposerUuid,
      'wigglypop.trade.rejected',
      'Intercambio rechazado',
      `Tu propuesta por "${title}" ha sido rechazada.`,
      this.listingLink(listingId),
    );
  }

  async sale(
    sellerUuid: string,
    orderId: number,
    title: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      sellerUuid,
      'wigglypop.sale',
      '¡Has vendido!',
      `"${title}" se ha vendido por ${amount}.`,
      this.orderLink(orderId),
    );
  }

  async auctionWon(
    winnerUuid: string,
    orderId: number,
    title: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      winnerUuid,
      'wigglypop.auction.won',
      '¡Has ganado la subasta!',
      `Has ganado "${title}" por ${amount}.`,
      this.orderLink(orderId),
    );
  }

  async auctionLost(
    bidderUuid: string,
    listingId: number,
    title: string,
  ): Promise<void> {
    await this.send(
      bidderUuid,
      'wigglypop.auction.lost',
      'Subasta terminada',
      `No has ganado "${title}".`,
      this.listingLink(listingId),
    );
  }

  async auctionNoBids(
    sellerUuid: string,
    listingId: number,
    title: string,
  ): Promise<void> {
    await this.send(
      sellerUuid,
      'wigglypop.auction.nobids',
      'Subasta sin pujas',
      `"${title}" ha terminado sin pujas y se ha cancelado.`,
      this.listingLink(listingId),
    );
  }

  async orderTransferred(
    buyerUuid: string,
    orderId: number,
    code: string,
  ): Promise<void> {
    await this.send(
      buyerUuid,
      'wigglypop.order.transferred',
      'Entrega marcada',
      `El vendedor ha marcado el pedido ${code} como entregado. Confírmalo para liberar el pago.`,
      this.orderLink(orderId),
    );
  }

  async orderConfirmed(
    sellerUuid: string,
    orderId: number,
    code: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      sellerUuid,
      'wigglypop.order.confirmed',
      'Pago liberado',
      `El comprador ha confirmado el pedido ${code}. Has recibido ${amount}.`,
      this.orderLink(orderId),
    );
  }

  async orderCancelled(
    buyerUuid: string,
    orderId: number,
    code: string,
    amount: number,
  ): Promise<void> {
    await this.send(
      buyerUuid,
      'wigglypop.order.cancelled',
      'Pedido cancelado',
      `El pedido ${code} se ha cancelado y se te han devuelto ${amount}.`,
      this.orderLink(orderId),
    );
  }
}
