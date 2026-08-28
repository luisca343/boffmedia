import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RotomApp } from '@/_db/schema/SmartRotom';
import { IUserAppsRepository } from '../repositories/interfaces/user-apps-repository.interface';
import { IAppsRepository } from '../repositories/interfaces/apps-repository.interface';
import {
  APPS_REPOSITORY_TOKEN,
  USER_APPS_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import {
  APP_GRID_SLOTS,
  firstFreeSlot,
  isGridSlot,
} from '../app-grid.constants';

@Injectable()
export class UserAppsService {
  constructor(
    @Inject(USER_APPS_REPOSITORY_TOKEN)
    private readonly userAppsRepository: IUserAppsRepository,
    @Inject(APPS_REPOSITORY_TOKEN)
    private readonly appsRepository: IAppsRepository,
  ) {}

  // ==================== PLAYER APP MANAGEMENT ====================

  async getAppsForPlayer(uuid: string): Promise<RotomApp[]> {
    this.validateUuid(uuid);
    return this.userAppsRepository.getAppsForPlayer(uuid);
  }

  async addAppToPlayer(
    uuid: string,
    appId: number,
  ): Promise<{ success: boolean }> {
    this.validateUuid(uuid);
    this.validateAppId(appId);

    const app = await this.appsRepository.findById(appId);
    if (!app) {
      throw new NotFoundException('App not found');
    }

    if (!app.active) {
      throw new BadRequestException('App is inactive');
    }

    const existingUserApp = await this.userAppsRepository.findUserApp(
      uuid,
      appId,
    );
    if (existingUserApp) {
      throw new ConflictException('App already added to player');
    }

    // The lowest FREE cell, counting from 0. This scan used to start at 1, which
    // is why the very first app a player was given landed in the second slot and
    // cell 0 could only ever be filled by dragging something into it. It also
    // stopped at 36 while the grid has APP_GRID_SLOTS cells, and on overflow fell
    // out of the loop and inserted the out-of-range value anyway.
    // `order` is nullable in the schema, and a null one is not occupying a cell —
    // it is a row the dock cannot place. Treat it as free so the next add does not
    // skip a slot on its account.
    const dock = await this.userAppsRepository.findByPlayerUuid(uuid);
    const taken = new Set(
      dock
        .map((a) => a.order)
        .filter((o): o is number => o !== null && o !== undefined),
    );
    const order = firstFreeSlot(taken);
    if (order === null) {
      throw new ConflictException(
        `The player's dock is full (${APP_GRID_SLOTS} slots)`,
      );
    }

    await this.userAppsRepository.addUserApp(uuid, appId, order);

    return { success: true };
  }

  async removeAppFromPlayer(
    uuid: string,
    appId: number,
  ): Promise<{ success: boolean }> {
    this.validateUuid(uuid);
    this.validateAppId(appId);

    const removed = await this.userAppsRepository.removeUserApp(uuid, appId);
    if (!removed) {
      throw new NotFoundException("App not found in player's list");
    }

    return { success: true };
  }

  // ==================== APP ORDERING ====================

  async orderAppsForPlayer(
    order: { id: number | string; order: number }[],
    uuid: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(uuid);

    if (!order?.length) {
      throw new BadRequestException('Order data is required');
    }

    // An id the player does not own is ignored, but a bad SLOT is rejected: a cell
    // outside the grid does not sort last, it makes the app vanish from the dock,
    // and two apps sharing a cell silently hides one of them. Both used to be
    // written straight through from the client.
    const existingApps = await this.userAppsRepository.findByPlayerUuid(uuid);
    const existingAppIds = new Set(existingApps.map((app) => app.appId));
    const validOrder = order.filter((app) => existingAppIds.has(Number(app.id)));

    const claimed = new Set<number>();
    for (const app of validOrder) {
      const slot = Number(app.order);
      if (!isGridSlot(slot)) {
        throw new BadRequestException(
          `Slot ${app.order} is outside the ${APP_GRID_SLOTS}-cell grid`,
        );
      }
      if (claimed.has(slot)) {
        throw new BadRequestException(`Slot ${slot} was assigned twice`);
      }
      claimed.add(slot);
    }

    for (const app of validOrder) {
      await this.userAppsRepository.updateOrder(
        uuid,
        Number(app.id),
        Number(app.order),
      );
    }

    // Apps the payload left out are compacted into the lowest free cells. They used
    // to be handed to `resetOrderExcept(uuid, appsToReset)`, which resets everything
    // NOT in the list it is given — so it wiped the order just written for the apps
    // that WERE ordered, and parked them at 999, past the end of the grid.
    const placed = new Set(validOrder.map((app) => Number(app.id)));
    for (const appId of existingAppIds) {
      if (placed.has(appId)) continue;
      const slot = firstFreeSlot(claimed);
      // Dock full: leave the app where it is rather than move it out of the grid.
      if (slot === null) break;
      claimed.add(slot);
      await this.userAppsRepository.updateOrder(uuid, appId, slot);
    }

    return { success: true };
  }

  // ==================== VALIDATION HELPERS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  private validateAppId(appId: number): void {
    if (!appId || appId <= 0) {
      throw new BadRequestException('Valid App ID is required');
    }
  }
}
