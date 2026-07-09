import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PokemonLogService } from './pokemon-log.service';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';

@ApiTags('Pokemon')
@Controller('pokemon-log')
@SkipEnvelope()
export class PokemonLogController {
  private readonly logger = new Logger(PokemonLogController.name);

  constructor(private readonly pokemonLogService: PokemonLogService) {}

  @Get('process/:spreadsheetId')
  async processLogs(
    @Param('spreadsheetId') spreadsheetId: string,
  ): Promise<{ message: string; processed: number; errors: number }> {
    try {
      this.logger.log(
        `Starting Pokemon log processing for spreadsheet: ${spreadsheetId}`,
      );

      const result =
        await this.pokemonLogService.processShowdownLogs(spreadsheetId);

      const message = `Processing complete. ${result.processed} logs processed successfully, ${result.errors} errors.`;
      this.logger.log(message);

      return {
        message,
        processed: result.processed,
        errors: result.errors,
      };
    } catch (error: any) {
      this.logger.error('Error in processLogs:', error);
      throw error;
    }
  }
}
