import { Body, Controller, Get, Param, Post, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { ChatService, FicusMessage } from './chat.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';

@ApiTags('smartrotom/chat')
@Controller('smartrotom/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('first')
  @ApiOperation({ summary: 'Initialize a chat for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat initialized successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initialize chat.' })
  async first(@Body() { uuid }: { uuid: string }) {
    const action = 'get first chat message';
    try {
      this.responseService.logRequest(action, { uuid });
      const firstMessage = await this.chatService.first(uuid);
      this.responseService.logSuccess(action, firstMessage);
      return this.responseService.createSuccessResponse('Chat initialized successfully', firstMessage);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message sent successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to send message.' })
  async send(@Body() { uuid, mensaje }: { uuid: string, mensaje: FicusMessage }) {
    const action = 'send chat message';
    try {
      this.responseService.logRequest(action, { uuid, mensaje });
      const result = await this.chatService.send(uuid, mensaje);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Message sent successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid, mensaje });
    }
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get chat messages for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve messages.' })
  async get(@Param('uuid') uuid: string) {
    const action = 'get chat messages';
    try {
      this.responseService.logRequest(action, { uuid });
      const messages = await this.chatService.getMessages(uuid);
      this.responseService.logSuccess(action, messages);
      return this.responseService.createSuccessResponse('Messages retrieved successfully', messages);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }
}