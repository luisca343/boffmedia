import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { identifySocket, tokenFromHandshake } from './socket-identity';

const SECRET = 'test-secret';
const jwt = new JwtService({ secret: SECRET });

const socketWith = (handshake: Record<string, unknown>): Socket =>
  ({ handshake: { auth: {}, query: {}, headers: {}, ...handshake } }) as Socket;

describe('socket identity', () => {
  describe('tokenFromHandshake', () => {
    it('prefers socket.io handshake auth', () => {
      expect(tokenFromHandshake(socketWith({ auth: { token: 'a' } }))).toBe(
        'a',
      );
    });

    it('accepts a query token — MCEF clients cannot set handshake auth', () => {
      expect(tokenFromHandshake(socketWith({ query: { token: 'b' } }))).toBe(
        'b',
      );
    });

    it('accepts a Bearer header', () => {
      expect(
        tokenFromHandshake(
          socketWith({ headers: { authorization: 'Bearer c' } }),
        ),
      ).toBe('c');
    });

    it('returns null when nothing carries a token', () => {
      expect(tokenFromHandshake(socketWith({}))).toBeNull();
    });
  });

  describe('identifySocket', () => {
    it('accepts a website session and reads the linked Minecraft uuid', () => {
      const token = jwt.sign({ sub: 7, mcUuid: 'uuid-7' });
      expect(identifySocket(jwt, socketWith({ auth: { token } }))).toEqual({
        userId: 7,
        mcUuid: 'uuid-7',
      });
    });

    it('accepts an in-game session — the Rotom phone runs on one', () => {
      const token = jwt.sign({ sub: 7, mcUuid: 'uuid-7', typ: 'ingame' });
      expect(identifySocket(jwt, socketWith({ auth: { token } }))).toEqual({
        userId: 7,
        mcUuid: 'uuid-7',
      });
    });

    it.each(['refresh', 'launcher'])('refuses a %s token', (typ) => {
      const token = jwt.sign({ sub: 7, mcUuid: 'uuid-7', typ });
      expect(identifySocket(jwt, socketWith({ auth: { token } }))).toBeNull();
    });

    it('refuses a token signed with a different secret', () => {
      const other = new JwtService({ secret: 'not-our-secret' });
      const token = other.sign({ sub: 7, mcUuid: 'uuid-7' });
      expect(identifySocket(jwt, socketWith({ auth: { token } }))).toBeNull();
    });

    it('refuses an unsigned uuid claim — the whole point of the fix', () => {
      // The gateway must never take this shape straight out of the message body.
      expect(
        identifySocket(
          jwt,
          socketWith({ auth: { token: JSON.stringify({ uuid: 'uuid-7' }) } }),
        ),
      ).toBeNull();
    });

    it('reports a null mcUuid for an account with no Minecraft linked', () => {
      const token = jwt.sign({ sub: 9 });
      expect(identifySocket(jwt, socketWith({ auth: { token } }))).toEqual({
        userId: 9,
        mcUuid: null,
      });
    });
  });
});
