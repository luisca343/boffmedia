import { randomBytes } from 'crypto';

// Short human-readable codes for the varchar(16) `code` columns scattered across the gobierno
// tables (denuncias, buscados, multas, expedientes, apelaciones, subastas, eventos). Format:
// "<PREFIX>-XXXXXX" (6 base36 chars) — collisions are astronomically unlikely at this table
// size, and every caller inserts against a unique index anyway.
export function generateGobCode(prefix: string): string {
  const raw = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${raw}`;
}
