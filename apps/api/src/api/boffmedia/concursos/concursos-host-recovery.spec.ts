import { ConcursosRoomsService } from './concursos-rooms.service';
const token = (n: number) => n.toString(16).padStart(48, '0');

describe('Host bootstrap recovery never creates another room', () => {
  it('finds only the room owned by the saved host capability', () => {
    const rooms = new ConcursosRoomsService();
    const room = rooms.create(token(1), 'qa');
    rooms.join(room.code, token(2), 'Player');
    expect(rooms.restoreHost(token(1))).toMatchObject({
      code: room.code,
      role: 'host',
      members: [{ nickname: 'Player' }],
    });
    expect(() => rooms.restoreHost(token(2))).toThrow('host session not found');
    expect(() => rooms.restoreHost(token(3))).toThrow('host session not found');
    expect(() => rooms.restoreHost(null)).toThrow();
  });
  it('returns closed while retained, then refuses expiry or API restart without creation', () => {
    jest.useFakeTimers();
    try {
      const rooms = new ConcursosRoomsService();
      const room = rooms.create(token(1), 'qa');
      rooms.close(room.code, token(1));
      expect(rooms.restoreHost(token(1)).status).toBe('closed');
      jest.advanceTimersByTime(60_001);
      expect(() => rooms.restoreHost(token(1))).toThrow();
      expect(() => new ConcursosRoomsService().restoreHost(token(1))).toThrow();
    } finally {
      jest.useRealTimers();
    }
  });
});
