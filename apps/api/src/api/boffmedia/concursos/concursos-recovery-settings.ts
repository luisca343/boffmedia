import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConcursosRecoverySettingsDto } from './concursos.dto';
import { gameConflict } from './concursos-game';
/** Full versioned profile replacement. DTO validators/defaults are the sole API
 * schema; the domain also validates direct calls, not only HTTP/socket inputs. */
export function recoverySettings(
  input?: ConcursosRecoverySettingsDto,
): ConcursosRecoverySettingsDto {
  if (input === null) gameConflict();
  const profile = plainToInstance(ConcursosRecoverySettingsDto, input ?? {});
  if (
    validateSync(profile, { whitelist: true, forbidNonWhitelisted: true })
      .length
  )
    gameConflict();
  return structuredClone(profile);
}
