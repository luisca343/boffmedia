import { Injectable } from '@nestjs/common';

export interface TranscriptSegment {
  text: string;
  startMs: string;
  endMs: string;
  startTime: string;
  endTime: string;
}

export interface TranscriptionResult {
  success: boolean;
  videoId?: string;
  title?: string;
  author?: string;
  duration?: number;
  transcript?: TranscriptSegment[];
  message?: string;
}

export interface VideoInfoResult {
  success: boolean;
  videoId?: string;
  title?: string;
  author?: string;
  duration?: number;
  description?: string;
  viewCount?: string;
  uploadDate?: string;
  thumbnails?: any[];
  message?: string;
}

@Injectable()
export class TranscriptionService {
  private youtubeClient: any = null;
  private Innertube: any = null;

  // ==================== CLIENT INITIALIZATION ====================

  private async getYoutubeClient(): Promise<any> {
    if (!this.youtubeClient) {
      // Dynamic import for ES Module using Function constructor to prevent TypeScript from transforming it
      if (!this.Innertube) {
        const importDynamic = new Function('specifier', 'return import(specifier)');
        const youtubeModule = await importDynamic('youtubei.js');
        this.Innertube = youtubeModule.Innertube;
      }
      this.youtubeClient = await this.Innertube.create();
    }
    return this.youtubeClient;
  }

  // ==================== VIDEO ID EXTRACTION ====================

  private extractVideoId(input: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }

    throw new Error('Invalid YouTube URL or video ID');
  }

  // ==================== TIME FORMATTING ====================

  private formatTime(ms: string): string {
    const totalSeconds = Math.floor(parseInt(ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // ==================== TRANSCRIPTION RETRIEVAL ====================

  async getTranscription(videoId: string): Promise<TranscriptionResult> {
    try {
      const youtube = await this.getYoutubeClient();
      const extractedVideoId = this.extractVideoId(videoId);

      // Get video info
      const info = await youtube.getInfo(extractedVideoId);

      // Get transcript
      const transcriptData = await info.getTranscript();

      if (!transcriptData || !transcriptData.transcript) {
        return {
          success: false,
          message: 'Transcription not available for this video'
        };
      }

      // Format transcript
      const transcript: TranscriptSegment[] = transcriptData.transcript.content?.body?.initial_segments?.map((segment: any) => ({
        text: segment.snippet.text,
        startMs: segment.start_ms,
        endMs: segment.end_ms,
        startTime: this.formatTime(segment.start_ms),
        endTime: this.formatTime(segment.end_ms)
      })) || [];

      return {
        success: true,
        videoId: extractedVideoId,
        title: info.basic_info.title,
        author: info.basic_info.author,
        duration: info.basic_info.duration,
        transcript
      };
    } catch (error) {
      console.error('Failed to get transcription:', error);
      return {
        success: false,
        message: `Failed to get transcription: ${error.message}`
      };
    }
  }

  // ==================== VIDEO INFO RETRIEVAL ====================

  async getVideoInfo(videoId: string): Promise<VideoInfoResult> {
    try {
      const youtube = await this.getYoutubeClient();
      const extractedVideoId = this.extractVideoId(videoId);

      // Get video info
      const info = await youtube.getInfo(extractedVideoId);

      return {
        success: true,
        videoId: extractedVideoId,
        title: info.basic_info.title,
        author: info.basic_info.author,
        duration: info.basic_info.duration,
        description: info.basic_info.short_description,
        viewCount: info.basic_info.view_count?.toString(),
        uploadDate: info.basic_info.start_timestamp?.toString(),
        thumbnails: info.basic_info.thumbnail
      };
    } catch (error) {
      console.error('Failed to get video info:', error);
      return {
        success: false,
        message: `Failed to get video info: ${error.message}`
      };
    }
  }
}
