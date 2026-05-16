import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { SmartRotomApp } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';
import { IAppsRepository } from '../repositories/interfaces/apps-repository.interface';
import { APPS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

@Injectable()
export class AppsService {
  constructor(
    @Inject(APPS_REPOSITORY_TOKEN)
    private readonly appsRepository: IAppsRepository,
  ) {}

  // ==================== APP MANAGEMENT ====================

  async getAllApps(): Promise<SmartRotomApp[]> {
    return this.appsRepository.findAll();
  }

  async getAppById(id: number): Promise<SmartRotomApp> {
    const app = await this.appsRepository.findById(id);
    if (!app) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }
    return app;
  }

  async getActiveApps(): Promise<SmartRotomApp[]> {
    return this.appsRepository.findActiveApps();
  }

  async getInactiveApps(): Promise<SmartRotomApp[]> {
    return this.appsRepository.findByActive(0);
  }

  async createApp(createAppDto: CreateAppDto): Promise<SmartRotomApp> {
    // Check for duplicate URL if provided
    if (createAppDto.url) {
      const existingApp = await this.appsRepository.findByUrl(createAppDto.url);
      if (existingApp) {
        throw new ConflictException(
          `App with URL '${createAppDto.url}' already exists`,
        );
      }
    }

    return this.appsRepository.create(createAppDto);
  }

  async updateApp(
    id: number,
    updateAppDto: UpdateAppDto,
  ): Promise<SmartRotomApp> {
    const existingApp = await this.getAppById(id);

    // Check for duplicate URL if updating URL
    if (updateAppDto.url && updateAppDto.url !== existingApp.url) {
      const duplicateApp = await this.appsRepository.findByUrl(
        updateAppDto.url,
      );
      if (duplicateApp && duplicateApp.id !== id) {
        throw new ConflictException(
          `App with URL '${updateAppDto.url}' already exists`,
        );
      }
    }

    return this.appsRepository.update(id, updateAppDto);
  }

  async deleteApp(id: number): Promise<{ success: boolean }> {
    const exists = await this.appsRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    const deleted = await this.appsRepository.delete(id);
    return { success: deleted };
  }

  // ==================== APP STATUS MANAGEMENT ====================

  async activateApp(id: number): Promise<SmartRotomApp> {
    return this.updateApp(id, { active: 1 });
  }

  async deactivateApp(id: number): Promise<SmartRotomApp> {
    return this.updateApp(id, { active: 0 });
  }
}
