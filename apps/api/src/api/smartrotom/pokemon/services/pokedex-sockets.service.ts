import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SocketsGateway } from '@api/_utils/sockets/sockets.gateway';

export type PokedexSocketEvent =
  | { type: 'pokedex:capture'; uuid: string; pokemonId: number; form: string }
  | { type: 'pokedex:updated'; uuid: string };

/**
 * Tells ONE player's clients that their Pokédex changed, so they refetch without an F5.
 *
 * The event carries an id and nothing more: clients refetch through the endpoint they
 * already use (GET /smartrotom/pokemon/dex/status/:uuid), so a payload can never
 * disagree with the list, and the server stays the source of truth. That is the S2
 * pattern and the reason this is an invalidation signal rather than a data channel.
 *
 * It is addressed with `emitToUuid`, NOT `server.emit`. The first version of this
 * service broadcast to every connected socket, and the client subscribed with no uuid
 * check, so EVERY player refetched their whole Pokédex whenever ANY player caught
 * anything — a refetch storm that scales with players x captures, and strictly worse
 * than the 30s TTL S1 set out to fix. Its docblock argued the leak was acceptable
 * because a watcher "never learns by whom exactly or what species", while the payload
 * three lines below carried uuid, pokemonId and form. Both problems have one cause and
 * one fix: address the player who owns the dex.
 */
@Injectable()
export class PokedexSocketsService {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socketGateway: SocketsGateway,
  ) {}

  emitCapture(uuid: string, pokemonId: number, form: string): void {
    if (!this.socketGateway?.server) {
      this.logger.warn('SocketsGateway not ready; capture event not emitted', {
        uuid,
        pokemonId,
        form,
      });
      return;
    }
    const event: PokedexSocketEvent = {
      type: 'pokedex:capture',
      uuid,
      pokemonId,
      form,
    };
    this.socketGateway.emitToUuid(uuid, 'pokedex:capture', event);
  }

  emitDexUpdate(uuid: string): void {
    if (!this.socketGateway?.server) {
      this.logger.warn(
        'SocketsGateway not ready; dex update event not emitted',
        { uuid },
      );
      return;
    }
    const event: PokedexSocketEvent = {
      type: 'pokedex:updated',
      uuid,
    };
    this.socketGateway.emitToUuid(uuid, 'pokedex:updated', event);
  }
}
