import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getDBPort(): number {
    return this.configService.get<number>('DB_PORT');
  }
}
