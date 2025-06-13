import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AppsRepository } from '@api/_repositories/smartrotom/apps.repository';
import { SmartRotomApp } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';

@Injectable()
export class AppsService {
  constructor(
    private readonly appsRepository: AppsRepository,
  ) {}

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

  async createApp(createAppDto: CreateAppDto): Promise<SmartRotomApp> {
    const result = await this.appsRepository.create(createAppDto);
    return this.getAppById(result.insertId);
  }

  async updateApp(id: number, updateAppDto: UpdateAppDto): Promise<SmartRotomApp> {
    const existingApp = await this.getAppById(id);
    if (!existingApp) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    await this.appsRepository.update(id, updateAppDto);
    return this.getAppById(id);
  }

  async deleteApp(id: number): Promise<{ success: boolean }> {
    const result = await this.appsRepository.delete(id);
    if (result.affectedRows === 0) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }
    return { success: true };
  }

  async validateAppExists(appId: number): Promise<boolean> {
    const app = await this.appsRepository.findById(appId);
    return !!app;
  }

  async validateActiveApp(appId: number): Promise<boolean> {
    const app = await this.appsRepository.findActiveApp(appId);
    return !!app;
  }
}