import { Injectable, NotFoundException } from '@nestjs/common';
import { AppsRepository } from '@api/_repositories/smartrotom/apps.repository';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';
import { AppResponse } from '../types/app.types';
import { SuccessResponse } from '@/types/request';

@Injectable()
export class AppsService {
  constructor(
    private readonly appsRepository: AppsRepository,
  ) {}

  async getAllApps(): Promise<AppResponse[]> {
    return this.appsRepository.findAll();
  }

  async getAppById(id: number): Promise<AppResponse> {
    const app = await this.appsRepository.findById(id);
    if (!app) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }
    return app;
  }

  async createApp(createAppDto: CreateAppDto): Promise<AppResponse> {
    const result = await this.appsRepository.create(createAppDto);
    return this.getAppById(result.insertId);
  }

  async updateApp(id: number, updateAppDto: UpdateAppDto): Promise<AppResponse> {
    const existingApp = await this.getAppById(id);
    if (!existingApp) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    await this.appsRepository.update(id, updateAppDto);
    return this.getAppById(id);
  }

  async deleteApp(id: number): Promise<SuccessResponse> {
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