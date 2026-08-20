import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { ISettingsShim } from '../ports/settings-shim.port';

/**
 * Stub ISettingsShim: encode/decode/caps always throw
 * ServiceUnavailableException. Replaced by the real settings service.
 */
@Injectable()
export class StubSettingsShim implements ISettingsShim {
  async encode(_json: Record<string, unknown>): Promise<Buffer> {
    throw new ServiceUnavailableException({
      message: 'Settings shim not yet wired (Phase 0 spike pending)',
      userMessage:
        'La codificación de ajustes no está disponible todavía. Disculpa las molestias.',
    });
  }

  async decode(_rnqs: Buffer): Promise<Record<string, unknown>> {
    throw new ServiceUnavailableException({
      message: 'Settings shim not yet wired (Phase 0 spike pending)',
      userMessage:
        'La decodificación de ajustes no está disponible todavía. Disculpa las molestias.',
    });
  }

  async caps(_gameId: string): Promise<unknown> {
    throw new ServiceUnavailableException({
      message: 'Settings shim not yet wired (Phase 0 spike pending)',
      userMessage:
        'Las capacidades de configuración no están disponibles todavía. Disculpa las molestias.',
    });
  }
}
