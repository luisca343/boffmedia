import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { GOBIERNO_RANKS } from '@api/_utils/auth/roles.constants';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { AuditoriaService } from '../_shared/auditoria.service';
import { PoblacionRepository } from './poblacion.repository';
import {
  ListCensoQueryDto,
  GrantRoleDto,
  RevokeRoleDto,
  GOBIERNO_ROLE_NAMES,
} from './dto/poblacion.dto';
import {
  GobiernoCensoEntity,
  GobiernoCensoListEntity,
  GobiernoOficialEntity,
  GobiernoOficialRankEntity,
} from './entities/poblacion.entity';
import { UrbanismoRepository } from '../urbanismo/urbanismo.repository';

@Injectable()
export class PoblacionService {
  constructor(
    private readonly logger: Logger,
    private readonly poblacionRepository: PoblacionRepository,
    private readonly wingullFacadeService: WingullFacadeService,
    private readonly urbanismoRepository: UrbanismoRepository,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // ==================== CENSO ====================

  /**
   * The census is DERIVED — there is no census table. Standing, plots owned and towns all
   * fall out of the real registers, so it can never drift from them.
   *
   * Ownership comes from the Teras database and the town each plot sits in comes from this
   * one, so the two are joined here in application code rather than in SQL. Both sides are
   * fetched ONCE and indexed: the one thing this must never do is a call per row.
   */
  private async landByOwner(): Promise<
    Map<string, { count: number; towns: Set<string> }>
  > {
    const [plots, parcelas] = await Promise.all([
      this.wingullFacadeService.getAllPlots(),
      this.urbanismoRepository.listAllParcelaMetadata(),
    ]);
    const townByRegion = new Map(parcelas.map((p) => [p.regionId, p.town]));

    const byOwner = new Map<string, { count: number; towns: Set<string> }>();
    for (const plot of plots) {
      if (plot.type !== 'parcela' || !plot.ownerUuid) continue;
      const entry = byOwner.get(plot.ownerUuid) ?? {
        count: 0,
        towns: new Set<string>(),
      };
      // Counted whether or not it is registered — owning an unregistered plot is still owning
      // land. Only the town is unknown until gobierno has a row for it.
      entry.count += 1;
      const town = townByRegion.get(plot.regionId);
      if (town) entry.towns.add(town);
      byOwner.set(plot.ownerUuid, entry);
    }
    return byOwner;
  }

  private standingOf(
    buscado: boolean,
    multasPendientes: number,
  ): 'bueno' | 'observado' | 'sancionado' {
    if (buscado) return 'sancionado';
    return multasPendientes > 0 ? 'observado' : 'bueno';
  }

  async listCenso(query: ListCensoQueryDto): Promise<GobiernoCensoListEntity> {
    const page = query.page ?? 1;
    const limit = query.pageSize ?? query.limit ?? 20;

    const [activeBuscados, pendingMultas, land] = await Promise.all([
      this.poblacionRepository.getActiveBuscadoUuids(),
      this.poblacionRepository.getPendingMultaCounts(),
      this.landByOwner(),
    ]);

    const enrich = (u: { uuid: string; username: string }) => {
      const buscado = activeBuscados.has(u.uuid);
      const multasPendientes = pendingMultas.get(u.uuid) ?? 0;
      const owned = land.get(u.uuid);

      return {
        uuid: u.uuid,
        username: u.username,
        standing: this.standingOf(buscado, multasPendientes),
        parcelas: owned?.count ?? 0,
        towns: Array.from(owned?.towns ?? []),
        multasPendientes,
        buscado,
      };
    };

    // Standing is DERIVED, so it cannot be a WHERE clause: a row has to be enriched before
    // the predicate can even be evaluated. When the caller filters on it we therefore take
    // every user, derive, filter, and only then cut the page — and `total` is the size of
    // the FILTERED set, which is what the screen's counters read.
    if (query.standing) {
      const all = await this.poblacionRepository.listAllUsers(query.search);
      const matching = all
        .map(enrich)
        .filter((c) => c.standing === query.standing);
      const start = (page - 1) * limit;
      return {
        items: matching.slice(start, start + limit),
        total: matching.length,
        page,
        pageSize: limit,
      };
    }

    const { items: users, total } = await this.poblacionRepository.listUsers(
      page,
      limit,
      query.search,
    );
    return { items: users.map(enrich), total, page, pageSize: limit };
  }

  /**
   * One citizen, same derivation. The dossier drawer opens from any name anywhere in the
   * app, so it asks for exactly the person it has — never the whole register.
   */
  async getCiudadano(uuid: string): Promise<GobiernoCensoEntity> {
    const user = await this.poblacionRepository.findUserByUuid(uuid);
    if (!user) throw new NotFoundException(`No citizen with uuid ${uuid}`);

    const [buscado, multasPendientes, land] = await Promise.all([
      this.poblacionRepository.hasActiveBuscado(uuid),
      this.poblacionRepository.countPendingMultas(uuid),
      this.landByOwner(),
    ]);
    const owned = land.get(uuid);

    return {
      uuid: user.uuid,
      username: user.username,
      standing: this.standingOf(buscado, multasPendientes),
      parcelas: owned?.count ?? 0,
      towns: Array.from(owned?.towns ?? []),
      multasPendientes,
      buscado,
    };
  }

  // ==================== OFICIALES ====================

  private rankFor(roles: string[]): GobiernoOficialRankEntity | null {
    const found = GOBIERNO_RANKS.find((r) => roles.includes(r.role));
    return found
      ? { role: found.role, label: found.label, prefix: found.prefix }
      : null;
  }

  async listOficiales(): Promise<GobiernoOficialEntity[]> {
    const rows = await this.poblacionRepository.listOfficerHolders();

    const byUuid = new Map<
      string,
      {
        uuid: string;
        userId: number;
        username: string;
        profilePicture: string | null;
        roles: string[];
      }
    >();
    for (const row of rows) {
      const existing = byUuid.get(row.uuid);
      if (existing) {
        existing.roles.push(row.role);
      } else {
        byUuid.set(row.uuid, {
          uuid: row.uuid,
          userId: row.userId,
          username: row.username,
          profilePicture: row.profilePicture,
          roles: [row.role],
        });
      }
    }

    return Array.from(byUuid.values()).map((o) => ({
      ...o,
      rank: this.rankFor(o.roles),
    }));
  }

  async grantRole(
    uuid: string,
    dto: GrantRoleDto,
  ): Promise<GobiernoOficialEntity[]> {
    const user = await this.poblacionRepository.findBoffmediaUserByUuid(uuid);
    if (!user) {
      throw new BadRequestException(
        `No boffmedia_users account is linked to ${uuid}`,
      );
    }
    const role = await this.poblacionRepository.findRoleByName(dto.role);
    if (!role) {
      throw new NotFoundException(
        `Role ${dto.role} does not exist — run the seed script`,
      );
    }

    await this.poblacionRepository.grantRole(user.id, role.id);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'grant',
      target: `rol ${dto.role} → ${uuid}`,
      dep: 'poblacion',
    });
    return this.listOficiales();
  }

  async revokeRole(
    uuid: string,
    role: string,
    dto: RevokeRoleDto,
  ): Promise<GobiernoOficialEntity[]> {
    if (!(GOBIERNO_ROLE_NAMES as readonly string[]).includes(role)) {
      throw new BadRequestException(`${role} is not a gobierno role`);
    }
    const user = await this.poblacionRepository.findBoffmediaUserByUuid(uuid);
    if (!user) {
      throw new BadRequestException(
        `No boffmedia_users account is linked to ${uuid}`,
      );
    }
    const roleRow = await this.poblacionRepository.findRoleByName(role);
    if (!roleRow) {
      throw new NotFoundException(`Role ${role} does not exist`);
    }

    await this.poblacionRepository.revokeRole(user.id, roleRow.id);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'revoke',
      target: `rol ${role} → ${uuid}`,
      dep: 'poblacion',
    });
    return this.listOficiales();
  }
}
