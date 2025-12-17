import { ApiProperty } from '@nestjs/swagger';

export class QuestionEntity {
  @ApiProperty({ example: 1, description: 'Question ID' })
  id: number;

  @ApiProperty({ example: 'What is the capital of France?', description: 'Question text' })
  text: string;

  @ApiProperty({ 
    example: ['London', 'Paris', 'Berlin', 'Madrid'],
    description: 'Answer options' 
  })
  answers: string[];

  @ApiProperty({ example: 1, description: 'Correct answer index (0-3)' })
  correctAnswer: number;

  @ApiProperty({ example: 1, description: 'Difficulty level (1-15)' })
  difficultyLevel: number;

  @ApiProperty({ example: 'Geography', description: 'Question category', required: false })
  category?: string;

  @ApiProperty({ example: true, description: 'Is question active' })
  isActive: boolean;
}
