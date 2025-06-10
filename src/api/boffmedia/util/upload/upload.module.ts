import { Module } from '@nestjs/common';

import { UploadRepository } from '@repositories/boffmedia/upload.repository';
import { FileUploadService } from './services/file-upload.service';
import { ImageUploadService } from './services/image-upload.service';
import { UploadFacadeService } from './upload.facade.service';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  providers: [
    UploadRepository,
    
    FileUploadService,
    ImageUploadService,
    
    UploadFacadeService,
  ],
  exports: [
    UploadFacadeService,
    
    FileUploadService,
    ImageUploadService,
  ],
})
export class UploadModule {}