import { boffMediaOutbox } from './BoffMediaOutbox';

/**
 * MariaDB stores a `JSON` column as `LONGTEXT`, so mysql2 hands back the raw
 * string and drizzle's stock `json()` passes it straight through. Nothing
 * throws — the value just stops being an object, and every
 * `const { to } = row.payload` downstream quietly becomes `undefined`.
 *
 * These pin the mapping at the column, which is the only place that can fix it
 * for every reader at once.
 */
describe('jsonColumn (outbox payload)', () => {
  const col = boffMediaOutbox.payload;

  it('parses the JSON string MariaDB returns', () => {
    const mapped = col.mapFromDriverValue(
      '{"to":"player@example.com","token":"abc"}',
    ) as Record<string, unknown>;

    expect(typeof mapped).toBe('object');
    // The exact destructure the outbox handlers do.
    const { to, token } = mapped as { to: string; token: string };
    expect(to).toBe('player@example.com');
    expect(token).toBe('abc');
  });

  it('passes through an object untouched, for engines that parse natively', () => {
    const source = { to: 'player@example.com' };
    expect(col.mapFromDriverValue(source as never)).toEqual(source);
  });

  it('serialises to a string on the way in', () => {
    expect(col.mapToDriverValue({ to: 'player@example.com' })).toBe(
      '{"to":"player@example.com"}',
    );
  });

  it('still declares a json column, so the DDL is unchanged', () => {
    expect(col.getSQLType()).toBe('json');
  });
});
