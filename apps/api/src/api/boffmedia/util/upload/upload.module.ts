import { Module } from '@nestjs/common';

import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

import { UploadRepository } from '@repositories/boffmedia/upload.repository';
import { UploadsRepository } from '@repositories/boffmedia/uploads.repository';
import { FileUploadService } from './services/file-upload.service';
import { ImageUploadService } from './services/image-upload.service';
import { UploadFacadeService } from './upload.facade.service';
import { UploadController } from './upload.controller';

@Module({
  // UploadsRepository injects DRIZZLE; without this the app does not boot.
  imports: [DrizzleModule],
  controllers: [UploadController],
  providers: [
    UploadRepository,
    UploadsRepository,

    FileUploadService,
    ImageUploadService,

    UploadFacadeService,
  ],
  exports: [
    UploadFacadeService,
    FileUploadService,
    ImageUploadService,
    // The daily-upload quota ledger. PacksDownloadsService reads it so the app's
    // blob uploads bill against the SAME per-user counter as the web /upload
    // routes — a second ledger would let one surface spend the other's budget.
    UploadsRepository,
  ],
})
export class UploadModule {}
