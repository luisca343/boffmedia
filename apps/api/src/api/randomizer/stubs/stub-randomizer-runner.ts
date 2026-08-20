import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  IRandomizerRunner,
  RandomizeJob,
  RandomizeResult,
} from '../ports/randomizer-runner.port';

/**
 * Stub IRandomizerRunner: always throws ServiceUnavailableException. Replaced by
 * the FVX child-process runner once it exists.
 */
@Injectable()
export class StubRandomizerRunner implements IRandomizerRunner {
  async randomize(_job: RandomizeJob): Promise<RandomizeResult> {
    throw new ServiceUnavailableException({
      message: 'FVX runner not yet wired (Phase 1 awaiting jar provisioning)',
      userMessage:
        'El generador de Randomlocke no está disponible todavía. Disculpa las molestias.',
    });
  }
}
