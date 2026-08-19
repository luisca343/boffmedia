import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FicusAIFacadeService } from './ficusai.facade.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { FicusMessageContentDto } from './dto/ficus-message-content.dto';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { FicusAiUserStatsEntity } from './entities/ficusai-user-stats.entity';
import { FicusAiHealthEntity } from './entities/ficusai-health.entity';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import { RequireSession } from '@api/_utils/decorators/require-session.decorator';

@ApiTags('FicusAI - Chat Assistant')
// The assistant answers for ONE player: the conversation is theirs. Reads of
// public stats stay open; sending, initialising and clearing take the player
// from the session, not from a query string or body field.
@Public()
@Controller('smartrotom/ficusai')
export class FicusAIController {
  constructor(private readonly ficusAIFacadeService: FicusAIFacadeService) {}

  @Get('messages')
  @ApiOperation({
    summary: 'Get chat messages for a user',
    description:
      'Retrieves the chat history for a specific user UUID with optional limit',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: [FicusMessageContentDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID or parameters',
  })
  @ApiQuery({
    name: 'uuid',
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of messages to retrieve',
    example: 20,
    required: false,
  })
  async getMessages(
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<FicusMessageContentDto[]> {
    return this.ficusAIFacadeService.getMessages(getMessagesDto);
  }

  @RequireSession()
  @Post('send')
  @ApiOperation({
    summary: 'Send a message to the AI assistant',
    description:
      'Sends a user message to Professor Ficus and returns the AI response',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message sent and response received successfully',
    type: FicusMessageContentDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message format or parameters',
  })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<FicusMessageContentDto> {
    return this.ficusAIFacadeService.sendMessage(sendMessageDto);
  }

  @RequireSession()
  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize chat for a user',
    description: 'Creates a welcome message for a new user chat session',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat initialized successfully',
    type: FicusMessageContentDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID',
  })
  async initializeChat(
    @CurrentMcUuid() uuid: string,
  ): Promise<FicusMessageContentDto> {
    return this.ficusAIFacadeService.initializeChat(uuid);
  }

  @RequireSession()
  @Delete('messages')
  @ApiOperation({
    summary: 'Delete all messages for a user',
    description: 'Soft deletes all chat messages for a specific user UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages deleted successfully',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID',
  })
  @ApiQuery({
    name: 'uuid',
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  async deleteUserMessages(
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    const result = await this.ficusAIFacadeService.deleteUserMessages(uuid);
    return {
      success: result.success,
      message: 'Messages deleted successfully',
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get user chat statistics',
    description: 'Returns statistics about the user chat history',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: FicusAiUserStatsEntity,
  })
  @ApiQuery({
    name: 'uuid',
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  async getUserStats(@Query('uuid') uuid: string) {
    const messageCount =
      await this.ficusAIFacadeService.getUserMessageCount(uuid);

    return {
      uuid,
      messageCount,
      hasHistory: messageCount > 0,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check for FicusAI service',
    description: 'Returns the health status of the FicusAI chat service',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    type: FicusAiHealthEntity,
  })
  async healthCheck() {
    return {
      service: 'FicusAI',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
