import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorContext, assertActsAsSelf } from '@api/_utils/auth/actor';
import { Logger } from 'nestjs-pino';
import { PeopleRepository } from '../_shared/people.repository';
import { AuditoriaService } from '../_shared/auditoria.service';
import { TreasuryService } from '../_shared/treasury.service';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { toPersonRef } from '../_shared/entities/person-ref.entity';
import { resolvePageSize } from '../_shared/dto/paged-query.dto';
import { HaciendaRepository } from './hacienda.repository';
import {
  CreateMultaDto,
  UpdateMultaDto,
  ListMultasQueryDto,
  CancelMultaDto,
  CreateTasaDto,
  UpdateTasaDto,
  ListTasasQueryDto,
} from './dto/hacienda.dto';
import {
  GobiernoMultaEntity,
  GobiernoMultaListEntity,
  GobiernoTasaEntity,
  GobiernoTesoreriaEntity,
  TesoreriaBreakdownItemEntity,
} from './entities/hacienda.entity';

// A transaction type is a machine token; the treasury screen shows people a phrase, and
// paints it with the department the money actually moved through.
//
// The SAME type means different things in each direction — a MULTA moving INTO the treasury
// is a fine collected, and one moving OUT is an appeal refunding it. So the label depends on
// the direction, not just the type.
const TX_CONCEPT_IN: Record<string, string> = {
  MULTA: 'Multas cobradas',
  TASA: 'Tasas e impuestos',
  SUBASTA: 'Adjudicaciones de subasta',
  TRANSFERENCIA: 'Ingresos varios',
};

const TX_CONCEPT_OUT: Record<string, string> = {
  MULTA: 'Multas reembolsadas (apelación)',
  RECOMPENSA: 'Recompensas de captura pagadas',
  SUBASTA: 'Devoluciones de subasta',
  TRANSFERENCIA: 'Gastos varios',
};

const TX_DEP: Record<string, string> = {
  MULTA: 'hacienda',
  TASA: 'hacienda',
  SUBASTA: 'urbanismo',
  RECOMPENSA: 'seguridad',
  TRANSFERENCIA: 'gobierno',
};

@Injectable()
export class HaciendaService {
  constructor(
    private readonly logger: Logger,
    private readonly haciendaRepository: HaciendaRepository,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
    private readonly treasuryService: TreasuryService,
  ) {}

  // ==================== MULTAS ====================

  private async toMultaEntity(
    m: NonNullable<Awaited<ReturnType<HaciendaRepository['findMulta']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoMultaEntity> {
    return {
      id: m.id,
      code: m.code,
      player: toPersonRef(m.playerUuid, names) as any,
      amount: m.amount,
      status: m.status,
      reason: m.reason,
      issuedBy: toPersonRef(m.issuedByUuid, names) as any,
      denunciaId: m.denunciaId,
      paidTxId: m.paidTxId,
      paidAt: m.paidAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  async listMultas(
    query: ListMultasQueryDto,
  ): Promise<GobiernoMultaListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.haciendaRepository.listMultas(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((m) => [m.playerUuid, m.issuedByUuid]),
    );
    return {
      items: await Promise.all(items.map((m) => this.toMultaEntity(m, names))),
      total,
      page,
      pageSize: limit,
    };
  }

  async getMulta(id: number): Promise<GobiernoMultaEntity> {
    const m = await this.haciendaRepository.findMulta(id);
    if (!m) throw new NotFoundException(`Multa ${id} not found`);
    const names = await this.peopleRepository.findUsernames([
      m.playerUuid,
      m.issuedByUuid,
    ]);
    return this.toMultaEntity(m, names);
  }

  async createMulta(dto: CreateMultaDto, actor?: ActorContext): Promise<GobiernoMultaEntity> {
    // Authorization: an officer can only issue a fine as themselves. ROTOM_ADMIN can
    // issue on behalf of any officer (authorization is enforced at the controller
    // guard level; here we just confirm for non-admin users).
    if (actor && !actor.serverAuthed && actor.mcUuid) {
      if (actor.mcUuid !== dto.issuedBy) {
        throw new BadRequestException({
          message: 'Officers may only issue fines as themselves',
          userMessage: 'Solo puedes emitir multas a tu nombre.',
        });
      }
    }

    const m = await this.haciendaRepository.createMulta(dto);
    await this.auditoriaService.log({
      actorUuid: actor?.mcUuid || dto.issuedBy,
      action: 'create',
      target: `multa ${m.code} (${m.amount})`,
      dep: 'hacienda',
    });
    return this.getMulta(m.id);
  }

  async updateMulta(
    id: number,
    dto: UpdateMultaDto,
    actor?: ActorContext,
  ): Promise<GobiernoMultaEntity> {
    const existing = await this.haciendaRepository.findMulta(id);
    if (!existing) throw new NotFoundException(`Multa ${id} not found`);
    if (existing.status !== 'pending') {
      throw new BadRequestException(
        `Multa ${existing.code} is already ${existing.status}`,
      );
    }

    // Authorization: only the issuing official or an admin can edit a fine.
    // The GameOrUserAuthGuard ensures actor.mcUuid is the signed-in player.
    // ROTOM_ADMIN bypasses the official check (role-based authorization is enforced
    // at the controller guard level; here we just confirm the actor is authorized).
    if (actor && !actor.serverAuthed && actor.mcUuid) {
      if (actor.mcUuid !== existing.issuedByUuid) {
        throw new BadRequestException({
          message: 'Only the issuing official or an admin can edit a fine',
          userMessage: 'No tienes permiso para editar esta multa.',
        });
      }
    }

    const oldAmount = existing.amount;
    await this.haciendaRepository.updateMulta(id, {
      amount: dto.amount,
      reason: dto.reason,
      denunciaId: dto.denunciaId,
    });
    await this.auditoriaService.log({
      actorUuid: actor?.mcUuid || existing.issuedByUuid,
      action: 'update',
      target: `multa ${existing.code} (${oldAmount} → ${dto.amount})`,
      dep: 'hacienda',
    });
    return this.getMulta(id);
  }

  async deleteMulta(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.haciendaRepository.findMulta(id);
    if (!existing) throw new NotFoundException(`Multa ${id} not found`);
    await this.haciendaRepository.deleteMulta(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.issuedByUuid,
      action: 'delete',
      target: `multa ${existing.code}`,
      dep: 'hacienda',
    });
    return { success: true };
  }

  async payMulta(
    id: number,
    actor?: ActorContext,
  ): Promise<GobiernoMultaEntity> {
    const existing = await this.haciendaRepository.findMulta(id);
    if (!existing) throw new NotFoundException(`Multa ${id} not found`);
    assertActsAsSelf(existing.playerUuid, actor);
    if (existing.status !== 'pending') {
      throw new BadRequestException(
        `Multa ${existing.code} is already ${existing.status}`,
      );
    }

    const paidTxId = await this.treasuryService.credit(
      existing.playerUuid,
      existing.amount,
      TransactionType.MULTA,
      `Pago de multa ${existing.code}: ${existing.reason}`,
    );

    await this.haciendaRepository.payMulta(id, paidTxId);
    await this.auditoriaService.log({
      actorUuid: existing.playerUuid,
      action: 'pay',
      target: `multa ${existing.code}`,
      dep: 'hacienda',
    });
    return this.getMulta(id);
  }

  async cancelMulta(
    id: number,
    dto: CancelMultaDto,
  ): Promise<GobiernoMultaEntity> {
    const existing = await this.haciendaRepository.findMulta(id);
    if (!existing) throw new NotFoundException(`Multa ${id} not found`);
    if (existing.status === 'paid') {
      throw new BadRequestException(
        `Multa ${existing.code} is already paid — use the apelaciones flow to refund it`,
      );
    }
    if (existing.status === 'cancelled') {
      throw new BadRequestException(
        `Multa ${existing.code} is already cancelled`,
      );
    }

    await this.haciendaRepository.cancelMulta(id);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid,
      action: 'cancel',
      target: `multa ${existing.code}${dto.reason ? ` (${dto.reason})` : ''}`,
      dep: 'hacienda',
    });
    return this.getMulta(id);
  }

  // ==================== TASAS ====================

  private toTasaEntity(
    t: {
      id: number;
      code: string;
      concept: string;
      kind: string;
      rate: string;
      amount: number;
      active: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    collected = 0,
  ): GobiernoTasaEntity {
    return { ...t, active: t.active, collected };
  }

  /**
   * What each tasa actually collected — DERIVED, never stored. The rate card says what is
   * charged; only the ledger says what came in. A TASA transaction into the treasury is
   * attributed to a tasa by its code appearing in the transaction's reason.
   */
  private async collectedByTasa(): Promise<Map<string, number>> {
    const treasuryId = await this.treasuryService.getTreasuryAccountId();
    const tx =
      await this.haciendaRepository.getTreasuryTransactions(treasuryId);

    const byCode = new Map<string, number>();
    for (const t of tx) {
      if (t.toAccountId !== treasuryId || t.type !== TransactionType.TASA)
        continue;
      const reason = t.reason ?? '';
      // The code is a short token (TAS-PARCELA); match it inside the free-text reason.
      const code = reason.match(/TAS-[A-Z0-9_-]+/)?.[0];
      if (!code) continue;
      byCode.set(code, (byCode.get(code) ?? 0) + t.amount);
    }
    return byCode;
  }

  async listTasas(query: ListTasasQueryDto): Promise<GobiernoTasaEntity[]> {
    const [rows, collected] = await Promise.all([
      this.haciendaRepository.listTasas(query),
      this.collectedByTasa(),
    ]);
    return rows.map((t) => this.toTasaEntity(t, collected.get(t.code) ?? 0));
  }

  async getTasa(id: number): Promise<GobiernoTasaEntity> {
    const t = await this.haciendaRepository.findTasa(id);
    if (!t) throw new NotFoundException(`Tasa ${id} not found`);
    return this.toTasaEntity(t);
  }

  async createTasa(dto: CreateTasaDto): Promise<GobiernoTasaEntity> {
    const t = await this.haciendaRepository.createTasa(dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'create',
      target: `tasa "${t.concept}"`,
      dep: 'hacienda',
    });
    return this.toTasaEntity(t);
  }

  async updateTasa(
    id: number,
    dto: UpdateTasaDto,
  ): Promise<GobiernoTasaEntity> {
    const existing = await this.haciendaRepository.findTasa(id);
    if (!existing) throw new NotFoundException(`Tasa ${id} not found`);
    const t = await this.haciendaRepository.updateTasa(id, {
      concept: dto.concept,
      kind: dto.kind,
      rate: dto.rate,
      amount: dto.amount,
      active: dto.active,
    });
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `tasa "${existing.concept}"`,
      dep: 'hacienda',
    });
    return this.toTasaEntity(t as NonNullable<typeof t>);
  }

  async deleteTasa(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.haciendaRepository.findTasa(id);
    if (!existing) throw new NotFoundException(`Tasa ${id} not found`);
    await this.haciendaRepository.deleteTasa(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `tasa "${existing.concept}"`,
      dep: 'hacienda',
    });
    return { success: true };
  }

  // ==================== TESORERIA (fully derived) ====================

  async getTesoreria(days: number): Promise<GobiernoTesoreriaEntity> {
    const treasuryId = await this.treasuryService.getTreasuryAccountId();
    const balance = await this.treasuryService.getBalance();

    const allTx =
      await this.haciendaRepository.getTreasuryTransactions(treasuryId);

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    // `date` is a varchar(32) column — parse explicitly rather than trusting it to sort/compare
    // as a string.
    const inWindow = allTx.filter(
      (tx) => new Date(tx.date).getTime() >= cutoff,
    );

    const seriesByDay = new Map<string, { income: number; expense: number }>();
    const incomeByType = new Map<string, { amount: number; count: number }>();
    const expenseByType = new Map<string, { amount: number; count: number }>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of inWindow) {
      const day = new Date(tx.date).toISOString().slice(0, 10);
      const bucket = seriesByDay.get(day) ?? { income: 0, expense: 0 };

      if (tx.toAccountId === treasuryId) {
        bucket.income += tx.amount;
        totalIncome += tx.amount;
        const t = incomeByType.get(tx.type) ?? { amount: 0, count: 0 };
        t.amount += tx.amount;
        t.count += 1;
        incomeByType.set(tx.type, t);
      }
      if (tx.fromAccountId === treasuryId) {
        bucket.expense += tx.amount;
        totalExpense += tx.amount;
        const t = expenseByType.get(tx.type) ?? { amount: 0, count: 0 };
        t.amount += tx.amount;
        t.count += 1;
        expenseByType.set(tx.type, t);
      }

      seriesByDay.set(day, bucket);
    }

    const toBreakdown = (
      map: Map<string, { amount: number; count: number }>,
      direction: 'in' | 'out',
    ): TesoreriaBreakdownItemEntity[] => {
      const labels = direction === 'in' ? TX_CONCEPT_IN : TX_CONCEPT_OUT;
      return Array.from(map.entries())
        .map(([type, v]) => ({
          concept: labels[type] ?? type,
          amount: v.amount,
          count: v.count,
          dep: TX_DEP[type] ?? 'gobierno',
        }))
        .sort((a, b) => b.amount - a.amount);
    };

    // The rate card, each row carrying what the ledger says it actually collected.
    const tasas = await this.listTasas({});

    return {
      balance,
      days,
      ingresosMes: totalIncome,
      gastosMes: totalExpense,
      series: Array.from(seriesByDay.entries())
        .map(([label, v]) => ({ label, ingreso: v.income, gasto: v.expense }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      ingresos: toBreakdown(incomeByType, 'in'),
      gastos: toBreakdown(expenseByType, 'out'),
      tasas,
    };
  }
}
