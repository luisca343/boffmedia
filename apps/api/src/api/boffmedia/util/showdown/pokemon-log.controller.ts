import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PokemonLogService } from './pokemon-log.service';

@ApiTags('Pokemon')
@Controller('pokemon-log')
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

  @Get('test-parse')
  async testParse(): Promise<any> {
    // Test endpoint with sample log data
    const sampleLog = `|j|☆Gerard planta 0710
|j|☆Luisca343
|t:|1756029327
|gametype|doubles
|player|p1|Gerard planta 0710|shadowtriad|1125
|player|p2|Luisca343|101|1049
|gen|9
|tier|[Gen 9] VGC 2025 Reg H
|rated|
|rule|Species Clause: Limit one of each Pokémon
|rule|Item Clause: Limit 1 of each item
|clearpoke
|poke|p1|Archaludon, L50, M|
|poke|p1|Pelipper, L50, M|
|poke|p1|Maushold, L50|
|poke|p1|Comfey, L50, F|
|poke|p1|Rillaboom, L50, M|
|poke|p1|Sneasler, L50, M|
|poke|p2|Dragonite, L50, F|
|poke|p2|Kingambit, L50, M|
|poke|p2|Tauros-Paldea-Aqua, L50, M|
|poke|p2|Archaludon, L50, M|
|poke|p2|Pelipper, L50, F|
|poke|p2|Rillaboom, L50, M|
|teampreview|4
|
|t:|1756029359
|teamsize|p1|4
|teamsize|p2|4
|start
|switch|p1a: Archaludon|Archaludon, L50, M, shiny|100/100
|switch|p1b: Maushold|Maushold, L50|100/100
|switch|p2a: Dragonite|Dragonite, L50, F|100/100
|switch|p2b: Tauros|Tauros-Paldea-Aqua, L50, M|100/100`;

    return this.pokemonLogService.parseShowdownLog(sampleLog);
  }
}
