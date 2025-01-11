import { Body, Controller, Get, Param, Post, HttpStatus, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UuidDto } from '../_dto/smartrotom-request-dto';

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
  async first(@Body() initializeChatDto: UuidDto) {
    const action = 'get first chat message';
    try {
      this.responseService.logRequest(action, initializeChatDto);
      const firstMessage = await this.chatService.first(initializeChatDto.uuid);
      this.responseService.logSuccess(action, firstMessage);
      return this.responseService.createSuccessResponse('Chat initialized successfully', firstMessage);
    } catch (error) {
      this.responseService.handleError(action, error, initializeChatDto);
    }
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message sent successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to send message.' })
  async send(@Body() sendMessageDto: SendMessageDto) {
    const action = 'send chat message';
    try {
      this.responseService.logRequest(action, sendMessageDto);
      const result = await this.chatService.send(sendMessageDto.uuid, sendMessageDto.mensaje);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Message sent successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, sendMessageDto);
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