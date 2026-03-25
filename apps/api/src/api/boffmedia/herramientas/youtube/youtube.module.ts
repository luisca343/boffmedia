import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';

// Import domain services
import { TranscriptionService } from './services/transcription.service';

// Import facade service
import { YoutubeFacadeService } from './youtube.facade.service';

// Import controller
import { YoutubeController } from './youtube.controller';

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
  ],
  controllers: [YoutubeController],
  providers: [
    // Domain services
    TranscriptionService,
    
    // Facade service
    YoutubeFacadeService,
  ],
  exports: [
    YoutubeFacadeService,
  ],
})
export class YoutubeModule {}
