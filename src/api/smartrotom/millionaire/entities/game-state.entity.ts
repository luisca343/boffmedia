import { ApiProperty } from '@nestjs/swagger';

export class GameStateEntity {
  @ApiProperty({ example: 1, description: 'Game state ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Session ID' })
  sessionId: number;

  @ApiProperty({ example: 5, description: 'Question number' })
  questionNumber: number;

  @ApiProperty({ example: 1, description: 'Question ID' })
  questionId: number;

  @ApiProperty({ example: 2, description: 'Player answer index', required: false })
  playerAnswer?: number;

  @ApiProperty({ example: true, description: 'Is answer correct', required: false })
  isCorrect?: boolean;

  @ApiProperty({ example: '50:50', description: 'Lifeline used', required: false })
  lifelineUsed?: string;

  @ApiProperty({ 
    example: { question: {}, lifelines: {} },
    description: 'Complete game state snapshot' 
  })
  stateSnapshot: any;

  @ApiProperty({ example: '2025-06-28T10:00:00Z', description: 'State creation time' })
  createdAt: Date;
}
