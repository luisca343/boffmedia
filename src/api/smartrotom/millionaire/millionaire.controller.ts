import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MillionaireFacadeService } from './millionaire.facade.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { UseLifelineDto } from './dto/use-lifeline.dto';
import { SessionEntity } from './entities/session.entity';

@ApiTags('SmartRotom | Millionaire')
@Controller('smartrotom/millionaire')
@UseInterceptors(ResponseInterceptor)
export class MillionaireController {
  constructor(
    private readonly millionaireFacade: MillionaireFacadeService,
  ) {}

  @Post('session/create')
  @ApiOperation({ summary: 'Create a new game session (Conductor)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session created successfully.',
    schema: {
      example: {
        sessionId: 1,
        sessionCode: 'ABCD1234'
      }
    }
  })
  @ApiBody({ type: CreateSessionDto })
  async createSession(@Body() body: CreateSessionDto) {
    return await this.millionaireFacade.createSession(
      body.conductorUuid,
      body.questionTimeLimit
    );
  }

  @Post('session/join')
  @ApiOperation({ summary: 'Join an existing session (Player)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Joined session successfully.',
    schema: {
      example: {
        playerId: 1,
        sessionId: 1
      }
    }
  })
  @ApiBody({ type: JoinSessionDto })
  async joinSession(@Body() body: JoinSessionDto) {
    const playerId = await this.millionaireFacade.joinSession(
      body.sessionCode,
      body.playerUuid,
      'Player Name'
    );
    
    const session = await this.millionaireFacade.getSessionByCode(body.sessionCode);
    
    return {
      playerId,
      sessionId: session.id
    };
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get session details' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session retrieved successfully.',
    type: SessionEntity
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async getSession(@Param('sessionId') sessionId: string) {
    return await this.millionaireFacade.getSession(parseInt(sessionId, 10));
  }

  @Get('session/code/:code')
  @ApiOperation({ summary: 'Get session by code' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session retrieved successfully.',
    type: SessionEntity
  })
  @ApiParam({ name: 'code', description: 'Session code' })
  async getSessionByCode(@Param('code') code: string) {
    return await this.millionaireFacade.getSessionByCode(code);
  }

  @Post('game/start')
  @ApiOperation({ summary: 'Start a game session (Conductor)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game started successfully.' })
  @ApiBody({ 
    schema: {
      properties: {
        sessionId: { type: 'number', example: 1 }
      }
    }
  })
  async startGame(@Body() body: { sessionId: number }) {
    await this.millionaireFacade.startGame(body.sessionId);
    return { success: true };
  }

  @Post('answer/submit')
  @ApiOperation({ summary: 'Submit answer to current question (Player)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Answer submitted successfully.',
    schema: {
      example: {
        isCorrect: true,
        prizeMoney: '1000.00'
      }
    }
  })
  @ApiBody({ type: SubmitAnswerDto })
  async submitAnswer(@Body() body: SubmitAnswerDto) {
    return await this.millionaireFacade.submitAnswer(body);
  }

  @Post('lifeline/use')
  @ApiOperation({ summary: 'Use a lifeline (Player)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lifeline used successfully.',
    schema: {
      example: {
        type: '50:50',
        data: {
          removedAnswers: [0, 2]
        }
      }
    }
  })
  @ApiBody({ type: UseLifelineDto })
  async useLifeline(@Body() body: UseLifelineDto) {
    return await this.millionaireFacade.useLifeline(body);
  }

  @Get('state/:sessionId')
  @ApiOperation({ summary: 'Get current game state' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Game state retrieved successfully.'
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async getGameState(@Param('sessionId') sessionId: string) {
    return await this.millionaireFacade.getCurrentState(parseInt(sessionId, 10));
  }
}
