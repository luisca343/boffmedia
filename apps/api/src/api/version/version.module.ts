import { Module } from '@nestjs/common';
import { ProductVersionService } from './product-version.service';
import { VersionController } from './version.controller';

@Module({
  controllers: [VersionController],
  providers: [ProductVersionService],
  exports: [ProductVersionService],
})
export class VersionModule {}
