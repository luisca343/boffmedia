import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SocketsGateway } from '@api/_utils/sockets/sockets.gateway';

export type GobiernoSocketEvent =
  | { type: 'denuncia:created'; denunciaId: number }
  | { type: 'denuncia:resolved'; denunciaId: number }
  | { type: 'expediente:created'; expedienteId: number }
  | { type: 'expediente:evento'; expedienteId: number }
  | { type: 'multa:created'; multaId: number }
  | { type: 'multa:status_changed'; multaId: number };

/**
 * Tells staff clients that gobierno data changed, so their lists refetch without
 * an F5.
 *
 * The event carries an ID and nothing else, deliberately: clients refetch through
 * the endpoints they already use, so a payload can never disagree with the list,
 * and nothing confidential travels over the socket.
 *
 * KNOWN LIMIT, and the reason the payload is bare: this is `server.emit`, which
 * reaches EVERY connected socket, not only Gobierno staff. The gateway holds a
 * flat uuid -> socketId map with no rooms and no role information, so scoping
 * would mean teaching it about roles. Only the staff pages subscribe, so the
 * practical leak is activity metadata — a player watching the socket learns that
 * *a* denuncia was filed, never by whom or about what. Worth closing when the
 * gateway grows rooms; not worth a role system inside this service.
 */
@Injectable()
export class GobiernoSocketsService {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socketGateway: SocketsGateway,
  ) {}

  emit(event: GobiernoSocketEvent): void {
    if (!this.socketGateway?.server) {
      this.logger.warn('SocketsGateway not ready; event not emitted', event);
      return;
    }
    this.socketGateway.server.emit(`gobierno:${event.type}`, event);
  }
}
