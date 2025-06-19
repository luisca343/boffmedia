import { ApiProperty } from '@nestjs/swagger';
import { SmartRotomApp } from './app.entity';

export class SmartRotomUserApp extends SmartRotomApp {
  @ApiProperty({ example: 1, description: 'Display order for this user' })
  order: number;

  @ApiProperty({ example: true, description: 'Whether user has this app installed' })
  isInstalled: boolean;

  constructor(data: any) {
    super(data);
    this.order = data.orden || data.order || 999;
    this.isInstalled = Boolean(data.is_user_app || data.isInstalled);
  }

  static fromPlayerAppsQuery(queryResults: any[]): SmartRotomUserApp[] {
    return queryResults.map(result => new SmartRotomUserApp(result));
  }
}