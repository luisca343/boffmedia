import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EventInvite } from '@/_db/schema/BoffMediaEvents';
import { EventInvitesRepository } from '../repositories/event-invites.repository';

@Injectable()
export class EventInvitesService {
  constructor(private readonly repository: EventInvitesRepository) {}

  async create(
    eventId: number,
    createdBy: number | null,
    options: { expiresAt?: string; maxUses?: number } = {},
  ): Promise<EventInvite> {
    const maxUses = options.maxUses ?? 1;
    if (maxUses < 1) {
      throw new BadRequestException('maxUses must be at least 1');
    }

    // Base32-ish over a full 10 bytes: short enough to paste into Discord,
    // long enough that guessing a live code is not a strategy.
    const code = randomBytes(10).toString('hex').toUpperCase();

    await this.repository.create({
      code,
      eventId,
      createdBy,
      expiresAt: options.expiresAt ? new Date(options.expiresAt) : null,
      maxUses,
    });

    const created = await this.repository.findByCode(code);
    if (!created) throw new NotFoundException('Invite not found after create');
    return created;
  }

  async listForEvent(eventId: number): Promise<EventInvite[]> {
    return this.repository.findByEvent(eventId);
  }

  async revoke(code: string): Promise<void> {
    const invite = await this.repository.findByCode(code);
    if (!invite) throw new NotFoundException('Invite not found');
    await this.repository.revoke(code);
  }

  /**
   * Burns one use and returns the event it belongs to. The use is consumed
   * before the join runs: a redemption that fails downstream is not worth
   * risking a code that two people can spend at once.
   */
  async consume(code: string): Promise<EventInvite> {
    const invite = await this.repository.findByCode(code);
    if (!invite) throw new NotFoundException('Código de invitación no válido');

    const won = await this.repository.consume(code);
    if (!won) {
      throw new BadRequestException(
        'Esta invitación ya no es válida (caducada, revocada o agotada)',
      );
    }

    return invite;
  }
}
