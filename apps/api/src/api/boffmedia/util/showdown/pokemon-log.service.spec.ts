import { Test, TestingModule } from '@nestjs/testing';
import { PokemonLogService } from './pokemon-log.service';

// The key testable method is parseShowdownLog — pure parsing of battle log text.

const makeLog = (
  player1 = 'Luisca343',
  player2 = 'Rival123',
  team1 = ['Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew'],
  team2 = ['Raichu', 'Arcanine', 'Gyarados', 'Exeggutor', 'Alakazam', 'Gengar'],
  lead1 = ['Pikachu', 'Charizard'],
  lead2 = ['Raichu', 'Arcanine'],
): string => {
  const lines: string[] = [];

  // Players
  lines.push(`|player|p1|${player1}|`);
  lines.push(`|player|p2|${player2}|`);

  // Teams
  team1.forEach((p) => lines.push(`|poke|p1|${p},|`));
  team2.forEach((p) => lines.push(`|poke|p2|${p},|`));

  // Game start + leads
  lines.push('|start');
  lead1.forEach((p, i) => lines.push(`|switch|p1${i === 0 ? 'a' : 'b'}: ${player1}|${p},|`));
  lead2.forEach((p, i) => lines.push(`|switch|p2${i === 0 ? 'a' : 'b'}: ${player2}|${p},|`));

  return lines.join('\n');
};

describe('PokemonLogService', () => {
  let service: PokemonLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PokemonLogService],
    }).compile();

    service = module.get<PokemonLogService>(PokemonLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── parseShowdownLog ─────────────────────────────────────────────────────────

  describe('parseShowdownLog()', () => {
    it('identifies rival and luisca player keys', () => {
      const log = makeLog();

      const result = service.parseShowdownLog(log);

      expect(result).not.toBeNull();
      expect(result!.rivalPlayerName).toBe('Rival123');
    });

    it('extracts rival team pokemon', () => {
      const log = makeLog();

      const result = service.parseShowdownLog(log);

      expect(result!.rivalTeam.pokemon).toContain('Raichu');
      expect(result!.rivalTeam.pokemon).toHaveLength(6);
    });

    it('extracts luisca team pokemon', () => {
      const log = makeLog();

      const result = service.parseShowdownLog(log);

      expect(result!.luiscaTeam.pokemon).toContain('Pikachu');
      expect(result!.luiscaTeam.pokemon).toHaveLength(6);
    });

    it('extracts rival leads from first switches after |start', () => {
      const log = makeLog(
        'Luisca343',
        'Gary',
        ['Pikachu'],
        ['Eevee', 'Snorlax'],
        ['Pikachu'],
        ['Eevee', 'Snorlax'],
      );

      const result = service.parseShowdownLog(log);

      expect(result!.rivalTeam.lead).toContain('Eevee');
      expect(result!.rivalTeam.lead).toContain('Snorlax');
    });

    it('extracts luisca leads from first switches after |start', () => {
      const log = makeLog();

      const result = service.parseShowdownLog(log);

      expect(result!.luiscaTeam.lead).toContain('Pikachu');
      expect(result!.luiscaTeam.lead).toContain('Charizard');
    });

    it('returns null when neither player is identified', () => {
      const log = '|player|p1|PlayerA|\n|player|p2|PlayerB|';

      const result = service.parseShowdownLog(log);

      expect(result).toBeNull();
    });

    it('returns null when only one player is identified (Luisca only)', () => {
      const log = '|player|p1|Luisca343|';

      const result = service.parseShowdownLog(log);

      expect(result).toBeNull();
    });

    it('sets row to 0 by default (caller sets it later)', () => {
      const log = makeLog();

      const result = service.parseShowdownLog(log);

      expect(result!.row).toBe(0);
    });
  });
});
