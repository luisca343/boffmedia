import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { ReviewSuggestionDto } from './dto/review-suggestion.dto';
import {
  CreateSuggestionResultEntity,
  SuggestionEntity,
} from './entities/suggestion.entity';

@ApiTags('BoffMedia | Event Suggestions')
@ApiBearerAuth('JWT')
@Controller('events/suggestions')
export class SuggestionsController {
  constructor(private readonly service: SuggestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit an event suggestion' })
  @ApiResponse({ status: 201, type: CreateSuggestionResultEntity })
  create(@Body() dto: CreateSuggestionDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({ summary: 'List all event suggestions (admin)' })
  @ApiResponse({ status: 200, type: [SuggestionEntity] })
  list() {
    return this.service.list();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({ summary: 'Approve / reject an event suggestion (admin)' })
  @ApiResponse({ status: 200, type: SuggestionEntity })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewSuggestionDto,
  ) {
    return this.service.review(id, dto);
  }
}
