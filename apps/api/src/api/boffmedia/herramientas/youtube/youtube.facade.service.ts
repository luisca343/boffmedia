import { HttpException, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  TranscriptionService,
  TranscriptionResult,
  VideoInfoResult,
} from './services/transcription.service';

@Injectable()
export class YoutubeFacadeService {
  constructor(
    private readonly logger: Logger,
    private readonly transcriptionService: TranscriptionService,
  ) {}

  // ==================== TRANSCRIPTION OPERATIONS ====================

  async getTranscription(videoId: string): Promise<TranscriptionResult> {
    try {
      return await this.transcriptionService.getTranscription(videoId);
    } catch (error: any) {
      this.logger.error('Error getting transcription:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve transcription: ${error.message}`);
    }
  }

  async getVideoInfo(videoId: string): Promise<VideoInfoResult> {
    try {
      return await this.transcriptionService.getVideoInfo(videoId);
    } catch (error: any) {
      this.logger.error('Error getting video info:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve video info: ${error.message}`);
    }
  }
}
