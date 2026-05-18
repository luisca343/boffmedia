import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TcgErrorService } from './tcg-error.service';

describe('TcgErrorService', () => {
  let service: TcgErrorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TcgErrorService],
    }).compile();

    service = module.get<TcgErrorService>(TcgErrorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── handleApiError ───────────────────────────────────────────────────────────

  describe('handleApiError()', () => {
    it('throws 404 NOT_FOUND for 404 responses', () => {
      expect(() =>
        service.handleApiError({ response: { status: 404 } }, 'Get card'),
      ).toThrow(HttpException);

      try {
        service.handleApiError({ response: { status: 404 } }, 'Get card');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('throws with the response status for 4xx client errors', () => {
      try {
        service.handleApiError({ response: { status: 422 }, message: 'unprocessable' }, 'Get set');
      } catch (e: any) {
        expect(e.getStatus()).toBe(422);
      }
    });

    it('throws 502 BAD_GATEWAY for 5xx server errors', () => {
      try {
        service.handleApiError({ response: { status: 503 } }, 'Fetch series');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      }
    });

    it('throws 500 for unknown errors', () => {
      try {
        service.handleApiError(new Error('network'), 'Fetch');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  // ─── handleDatabaseError ──────────────────────────────────────────────────────

  describe('handleDatabaseError()', () => {
    it('throws 500 INTERNAL_SERVER_ERROR', () => {
      try {
        service.handleDatabaseError(new Error('DB down'), 'Insert card');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.message).toContain('Database operation failed');
      }
    });
  });

  // ─── validateSeriesId ─────────────────────────────────────────────────────────

  describe('validateSeriesId()', () => {
    it('does not throw for a valid id', () => {
      expect(() => service.validateSeriesId('sv')).not.toThrow();
    });

    it('throws 400 for empty string', () => {
      expect(() => service.validateSeriesId('')).toThrow(HttpException);
    });

    it('throws 400 for whitespace-only string', () => {
      expect(() => service.validateSeriesId('   ')).toThrow(HttpException);
    });
  });

  // ─── validateSetId ────────────────────────────────────────────────────────────

  describe('validateSetId()', () => {
    it('does not throw for a valid id', () => {
      expect(() => service.validateSetId('sv1')).not.toThrow();
    });

    it('throws for empty string', () => {
      expect(() => service.validateSetId('')).toThrow(HttpException);
    });
  });

  // ─── validateLocale ───────────────────────────────────────────────────────────

  describe('validateLocale()', () => {
    it('does not throw for "en" and "es"', () => {
      expect(() => service.validateLocale('en')).not.toThrow();
      expect(() => service.validateLocale('es')).not.toThrow();
    });

    it('throws 400 for unsupported locale', () => {
      expect(() => service.validateLocale('fr')).toThrow(HttpException);
    });
  });
});
