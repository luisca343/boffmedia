import { Injectable, Logger } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import { env } from '@/config/env';
import { safeFetch } from '@api/_utils/http/safe-fetch';

export interface PokemonTeam {
  pokemon: string[];
  lead: string[];
}

export interface ParsedLog {
  rivalPlayer: string;
  rivalPlayerName: string;
  rivalTeam: PokemonTeam;
  luiscaTeam: PokemonTeam;
  row: number;
}

@Injectable()
export class PokemonLogService {
  private readonly logger = new Logger(PokemonLogService.name);

  async processShowdownLogs(
    spreadsheetId: string,
  ): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      const keyFile = env.POKEMON_LOG_SERVICE_KEY_FILE || 'boffmedia-b6e4f721c326.json';
      const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const client = (await auth.getClient()) as any;
      const sheets = google.sheets({
        version: 'v4',
        auth: client,
      }) as sheets_v4.Sheets;

      // Read column D starting from row 2
      const range = 'VGC!D2:D';
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      this.logger.log(`Found ${rows.length} rows to check for links`);

      const parsedLogs: ParsedLog[] = [];

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const actualRowNumber = i + 2; // Starting from row 2

        // Check if there's a link in this row
        if (!row[0] || typeof row[0] !== 'string') {
          continue; // Skip empty cells
        }

        const cellValue = row[0];
        // Simple URL detection
        if (!cellValue.startsWith('http')) {
          continue; // Skip non-URLs
        }

        try {
          this.logger.log(
            `Processing link ${i + 1}/${rows.length}: ${cellValue} (row ${actualRowNumber})`,
          );

          // Fetch log data
          const logData = await this.fetchLogData(cellValue);

          // Parse log data
          const localPlayerName = env.POKEMON_LOG_LOCAL_PLAYER || 'Luisca343';
          const parsedLog = this.parseShowdownLog(logData, localPlayerName);

          if (parsedLog) {
            parsedLog.row = actualRowNumber;
            parsedLogs.push(parsedLog);
            processed++;
            this.logger.log(
              `Successfully parsed log for row ${actualRowNumber}`,
            );
          } else {
            this.logger.warn(`Could not parse log for row ${actualRowNumber}`);
            errors++;
          }
        } catch (error: any) {
          this.logger.error(
            `Error processing link in row ${actualRowNumber}:`,
            error,
          );
          errors++;
        }

        // Add small delay to avoid rate limiting
        await this.delay(500);
      }

      // Update spreadsheet with results
      if (parsedLogs.length > 0) {
        await this.updateGoogleSheet(spreadsheetId, parsedLogs, sheets);
      }

      return { processed, errors };
    } catch (error: any) {
      this.logger.error('Error in processShowdownLogs:', error);
      throw error;
    }
  }

  private async fetchLogData(url: string): Promise<string> {
    try {
      // Add .log if not present
      const logUrl = url.endsWith('.log') ? url : `${url}.log`;

      // Pokémon Showdown replay server is the only expected source.
      // This prevents SSRF attacks by restricting to the known replay domain.
      const logData = await safeFetch(logUrl, {
        allowedHosts: ['replay.pokemonshowdown.com'],
        timeout: 10000,
        maxBytes: 10_000_000, // 10 MB limit for a log file
        axiosConfig: {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      });

      return logData;
    } catch (error: any) {
      this.logger.error(`Error fetching log data from ${url}:`, error.message);
      throw error;
    }
  }

  parseShowdownLog(logData: string, localPlayerName: string = 'Luisca343'): ParsedLog | null {
    const lines = logData.split('\n');
    let rivalPlayer = '';
    let rivalPlayerName = '';
    let luiscaPlayer = '';
    const rivalTeam: string[] = [];
    const luiscaTeam: string[] = [];
    let rivalLead: string[] = [];
    let luiscaLead: string[] = [];

    // Find players
    for (const line of lines) {
      if (line.startsWith('|player|')) {
        const parts = line.split('|');
        const playerKey = parts[2]; // p1 or p2
        const playerName = parts[3];

        if (playerName === localPlayerName) {
          luiscaPlayer = playerKey;
        } else {
          rivalPlayer = playerKey;
          rivalPlayerName = playerName;
        }
      }
    }

    if (!rivalPlayer || !luiscaPlayer) {
      this.logger.warn('Could not identify players in log');
      return null;
    }

    this.logger.log(
      `Found players - Rival: ${rivalPlayerName} (${rivalPlayer}), Luisca: ${luiscaPlayer}`,
    );

    // Extract teams from |poke| lines
    for (const line of lines) {
      if (line.startsWith('|poke|')) {
        const parts = line.split('|');
        const playerKey = parts[2];
        const pokemonInfo = parts[3];
        const pokemonName = pokemonInfo.split(',')[0].trim();

        if (playerKey === rivalPlayer) {
          rivalTeam.push(pokemonName);
        } else if (playerKey === luiscaPlayer) {
          luiscaTeam.push(pokemonName);
        }
      }
    }

    // Extract leads from first |switch| commands after |start|
    let gameStarted = false;
    const firstSwitches: string[] = [];

    for (const line of lines) {
      if (line.startsWith('|start')) {
        gameStarted = true;
        continue;
      }

      if (gameStarted && line.startsWith('|switch|')) {
        firstSwitches.push(line);

        // We need 4 switches total (2 for each player in doubles)
        if (firstSwitches.length === 4) {
          break;
        }
      }
    }

    // Parse the leads from first switches
    const rivalSwitches = firstSwitches.filter(
      (line) =>
        line.includes(`${rivalPlayer}a:`) || line.includes(`${rivalPlayer}b:`),
    );
    const luiscaSwitches = firstSwitches.filter(
      (line) =>
        line.includes(`${luiscaPlayer}a:`) ||
        line.includes(`${luiscaPlayer}b:`),
    );

    rivalLead = rivalSwitches.map((line) => {
      const parts = line.split('|');
      const pokemonInfo = parts[3];
      return pokemonInfo.split(',')[0].trim();
    });

    luiscaLead = luiscaSwitches.map((line) => {
      const parts = line.split('|');
      const pokemonInfo = parts[3];
      return pokemonInfo.split(',')[0].trim();
    });

    this.logger.log(
      `Rival team: [${rivalTeam.join(', ')}], Lead: [${rivalLead.join(', ')}]`,
    );
    this.logger.log(
      `Luisca team: [${luiscaTeam.join(', ')}], Lead: [${luiscaLead.join(', ')}]`,
    );

    return {
      rivalPlayer,
      rivalPlayerName,
      rivalTeam: {
        pokemon: rivalTeam,
        lead: rivalLead,
      },
      luiscaTeam: {
        pokemon: luiscaTeam,
        lead: luiscaLead,
      },
      row: 0, // Will be set by caller
    };
  }

  private async updateGoogleSheet(
    spreadsheetId: string,
    parsedLogs: ParsedLog[],
    sheets: sheets_v4.Sheets,
  ): Promise<void> {
    try {
      // Prepare batch update requests
      const updateData: any[] = [];

      for (const log of parsedLogs) {
        const row = log.row;

        // Write Luisca's lead to columns Q, R
        if (log.luiscaTeam.lead[0]) {
          updateData.push({
            range: `VGC!Q${row}`,
            values: [[log.luiscaTeam.lead[0]]],
          });
        }
        if (log.luiscaTeam.lead[1]) {
          updateData.push({
            range: `VGC!R${row}`,
            values: [[log.luiscaTeam.lead[1]]],
          });
        }

        // Write rival team to columns U, V, W, X, Y, Z
        const columns = ['U', 'V', 'W', 'X', 'Y', 'Z'];
        for (let i = 0; i < 6 && i < log.rivalTeam.pokemon.length; i++) {
          const pokemon = log.rivalTeam.pokemon[i];
          updateData.push({
            range: `VGC!${columns[i]}${row}`,
            values: [[pokemon]],
          });
        }
      }

      // Execute batch update
      if (updateData.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: updateData,
          },
        });

        // Apply formatting (bold + underline for leads, underline for team)
        const formatRequests: any[] = [];

        for (const log of parsedLogs) {
          const row = log.row;

          for (let i = 0; i < 6 && i < log.rivalTeam.pokemon.length; i++) {
            const pokemon = log.rivalTeam.pokemon[i];
            const isLead = log.rivalTeam.lead.includes(pokemon);
            const columnIndex = 20 + i; // U=20, V=21, etc.

            formatRequests.push({
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: row - 1,
                  endRowIndex: row,
                  startColumnIndex: columnIndex,
                  endColumnIndex: columnIndex + 1,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      bold: isLead,
                      underline: true,
                    },
                  },
                },
                fields: 'userEnteredFormat.textFormat',
              },
            });
          }
        }

        if (formatRequests.length > 0) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: formatRequests,
            },
          });
        }
      }

      this.logger.log(`Google Sheet updated with ${parsedLogs.length} logs`);
    } catch (error: any) {
      this.logger.error('Error updating Google Sheet:', error);
      throw error;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
