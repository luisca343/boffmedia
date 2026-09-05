import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { createHmac } from 'crypto';

import { ResendWebhookService } from './resend-webhook.service';
import { EmailBounceRepository } from './repositories/email-bounce.repository';

// `env` is validated by zod AT IMPORT TIME and frozen, so assigning
// process.env.RESEND_WEBHOOK_SECRET inside a test does nothing at all. The
// first version of this spec did exactly that and its "valid signature" case
// passed only because the service SKIPPED verification when the secret was
// missing — the fail-open hole this file is now supposed to be guarding.
const mockEnv: { RESEND_WEBHOOK_SECRET?: string } = {};
jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

const SECRET = 'test-secret';
const sign = (body: string, secret = SECRET) =>
  createHmac('sha256', secret).update(body).digest('base64');

describe('ResendWebhookService', () => {
  let service: ResendWebhookService;
  let bounces: { markBounced: jest.Mock };

  beforeEach(async () => {
    mockEnv.RESEND_WEBHOOK_SECRET = SECRET;
    bounces = { markBounced: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendWebhookService,
        { provide: EmailBounceRepository, useValue: bounces },
        {
          provide: Logger,
          useValue: {
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ResendWebhookService);
  });

  describe('verifySignature', () => {
    it('accepts a signature made with the configured secret', () => {
      const body = '{"test":"data"}';
      expect(service.verifySignature(body, sign(body))).toBe('ok');
    });

    it('accepts a Buffer body, which is what the controller passes', () => {
      // The controller hands it req.rawBody. If only strings worked, every real
      // delivery would fail while every test here passed.
      const body = '{"test":"data"}';
      expect(
        service.verifySignature(Buffer.from(body, 'utf8'), sign(body)),
      ).toBe('ok');
    });

    it('rejects a malformed signature', () => {
      expect(service.verifySignature('body', 'invalid')).toBe('invalid');
    });

    it('rejects a missing signature', () => {
      expect(service.verifySignature('body', undefined)).toBe('invalid');
    });

    it('rejects a well-formed signature made with the wrong secret', () => {
      // Same length as a real one, so this cannot pass on a length check alone.
      const body = '{"test":"data"}';
      expect(service.verifySignature(body, sign(body, 'not-the-secret'))).toBe(
        'invalid',
      );
    });

    it('rejects a signature for different content', () => {
      expect(
        service.verifySignature('{"test":"tampered"}', sign('{"test":"data"}')),
      ).toBe('invalid');
    });

    it('REFUSES the webhook when no secret is configured', () => {
      // The one that matters. This route is @Public(), and marking an address
      // as bounced stops its password-reset mail — so failing OPEN here lets
      // anyone who knows an address lock that account out of every recovery
      // path. The original skipped verification and logged a warning.
      delete mockEnv.RESEND_WEBHOOK_SECRET;

      expect(service.verifySignature('body', 'anything')).toBe('unconfigured');
    });
  });

  describe('processEvent', () => {
    it('ignores events that are neither a bounce nor a complaint', async () => {
      const result = await service.processEvent({
        type: 'email.delivered',
        data: { email: 'test@example.com' },
      } as never);

      expect(result.processed).toBe(false);
      expect(bounces.markBounced).not.toHaveBeenCalled();
    });

    it('marks the address on a bounce', async () => {
      const result = await service.processEvent({
        type: 'email.bounced',
        data: { email: 'test@example.com' },
      } as never);

      expect(result.processed).toBe(true);
      expect(bounces.markBounced).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Date),
      );
    });

    it('marks the address on a complaint', async () => {
      const result = await service.processEvent({
        type: 'email.complained',
        data: { email: 'spam@example.com' },
      } as never);

      expect(result.processed).toBe(true);
      expect(bounces.markBounced).toHaveBeenCalledWith(
        'spam@example.com',
        expect.any(Date),
      );
    });

    it('reports an address with no account without failing', async () => {
      bounces.markBounced.mockResolvedValue(false);

      const result = await service.processEvent({
        type: 'email.bounced',
        data: { email: 'unknown@example.com' },
      } as never);

      expect(result.processed).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });
});
