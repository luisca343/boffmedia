import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TwitchApiService } from './services/twitch-api.service';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';

@ApiTags('Automation - Twitch Debug')
@Public()
@Controller('automation/twitch/debug')
@SkipEnvelope()
export class TwitchDebugController {
  constructor(private readonly twitchApiService: TwitchApiService) {}

  @Get('check-user/:username')
  @ApiOperation({
    summary: 'Check if a specific user contains wingull content',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug information about user stream',
  })
  async checkUser(@Param('username') username: string) {
    try {
      const stream = await this.twitchApiService.getStreamByUsername(username);

      if (!stream) {
        return {
          username,
          isLive: false,
          message: `User "${username}" is not currently streaming`,
        };
      }

      const containsWingull = this.streamContainsWingull(stream);

      return {
        username,
        isLive: true,
        containsWingull,
        streamDetails: {
          title: stream.title,
          game_name: stream.game_name,
          viewer_count: stream.viewer_count,
          tags: stream.tags,
        },
        wingullAnalysis: {
          inTitle: stream.title?.toLowerCase().includes('wingull'),
          inTags: stream.tags?.some((tag) =>
            tag.toLowerCase().includes('wingull'),
          ),
          isPixelmonWingull2:
            stream.game_name?.toLowerCase() === 'pixelmon wingull 2',
        },
        message: containsWingull
          ? `Stream contains "wingull" content and would trigger notifications`
          : `Stream does not contain "wingull" content`,
      };
    } catch (error: any) {
      return {
        username,
        error: error.message,
        message: 'Failed to fetch stream. Check your Twitch API credentials.',
      };
    }
  }

  private streamContainsWingull(stream: any): boolean {
    const titleContains = stream.title?.toLowerCase().includes('wingull');
    const tagsContain = stream.tags?.some((tag: string) =>
      tag.toLowerCase().includes('wingull'),
    );
    const gameIsPixelmonWingull =
      stream.game_name?.toLowerCase() === 'pixelmon wingull 2';
    return titleContains || tagsContain || gameIsPixelmonWingull;
  }
}
