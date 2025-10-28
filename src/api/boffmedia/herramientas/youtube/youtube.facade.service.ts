import { Injectable } from '@nestjs/common';
import { TranscriptionService, TranscriptionResult, VideoInfoResult } from './services/transcription.service';

@Injectable()
export class YoutubeFacadeService {
  constructor(
    private readonly transcriptionService: TranscriptionService,
  ) {}

  // ==================== TRANSCRIPTION OPERATIONS ====================

  async getTranscription(videoId: string): Promise<TranscriptionResult> {
    try {
      return await this.transcriptionService.getTranscription(videoId);
    } catch (error) {
      console.error('Error getting transcription:', error);
      throw new Error(`Failed to retrieve transcription: ${error.message}`);
    }
  }

  async getVideoInfo(videoId: string): Promise<VideoInfoResult> {
    try {
      return await this.transcriptionService.getVideoInfo(videoId);
    } catch (error) {
      console.error('Error getting video info:', error);
      throw new Error(`Failed to retrieve video info: ${error.message}`);
    }
  }
}
