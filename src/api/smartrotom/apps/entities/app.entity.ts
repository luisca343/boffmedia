import { ApiProperty } from '@nestjs/swagger';
import { AppStatus } from '@/api/_shared/constants/app.constants';
import { SmartRotomApp as SmartRotomAppSchema } from '@/_db/schema/SmartRotom';

export class SmartRotomApp {
  @ApiProperty({ example: 1, description: 'Unique identifier for the app' })
  id: number;

  @ApiProperty({ example: 'Pokedex', description: 'Name of the app' })
  name: string;

  @ApiProperty({ example: 'pokedex', description: 'URL slug for the app' })
  url: string;

  @ApiProperty({ 
    example: AppStatus.ACTIVE, 
    description: 'App status',
    enum: AppStatus
  })
  status: AppStatus;

  constructor(app: SmartRotomAppSchema) {
    this.id = app.id;
    this.name = app.name;
    this.url = app.url;
    this.status = app.active as AppStatus;
  }

  static fromEntity(app: SmartRotomAppSchema): SmartRotomApp {
    return new SmartRotomApp(app);
  }

  static fromEntities(apps: SmartRotomAppSchema[]): SmartRotomApp[] {
    return apps.map(app => new SmartRotomApp(app));
  }
}