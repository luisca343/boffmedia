import {
  Controller,
  Get,
  Param,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { YoutubeFacadeService } from './youtube.facade.service';

@ApiTags('BoffMedia | YouTube')
@Controller('boffmedia/herramientas/youtube')
@UseInterceptors(ResponseInterceptor)
export class YoutubeController {
  constructor(private readonly youtubeFacadeService: YoutubeFacadeService) {}

  // ==================== TRANSCRIPTION OPERATIONS ====================

  @Get('transcription/:videoId')
  @ApiOperation({ summary: 'Get transcription from a YouTube video' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transcription retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Video not found or transcription not available.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid video ID or URL.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve transcription.',
  })
  @ApiParam({
    name: 'videoId',
    description: 'YouTube video ID or full URL',
    example: 'dQw4w9WgXcQ',
  })
  async getTranscription(@Param('videoId') videoId: string) {
    return await this.youtubeFacadeService.getTranscription(videoId);
  }

  @Get('video-info/:videoId')
  @ApiOperation({ summary: 'Get basic information from a YouTube video' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Video information retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Video not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid video ID or URL.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve video information.',
  })
  @ApiParam({
    name: 'videoId',
    description: 'YouTube video ID or full URL',
    example: 'dQw4w9WgXcQ',
  })
  async getVideoInfo(@Param('videoId') videoId: string) {
    return await this.youtubeFacadeService.getVideoInfo(videoId);
  }
}
