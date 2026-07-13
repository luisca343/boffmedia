import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PC_MARKS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PcMarksController } from './pc-marks.controller';
import { PcMarksService } from './services/pc-marks.service';
import { PcMarksRepository } from './repositories/pc-marks.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [PcMarksController],
  providers: [
    PcMarksService,
    {
      provide: PC_MARKS_REPOSITORY_TOKEN,
      useClass: PcMarksRepository,
    },
  ],
  exports: [PcMarksService, PC_MARKS_REPOSITORY_TOKEN],
})
export class PcModule {}
