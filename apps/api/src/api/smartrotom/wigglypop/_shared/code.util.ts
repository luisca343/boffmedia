import { randomBytes } from 'crypto';

// Short human-readable codes for the varchar(24) `code` columns on rotom_wigglypop_listings and
// rotom_wigglypop_orders. Format "<PREFIX>-XXXXXXXX"; both columns are UNIQUE, so a collision
// surfaces as an insert error rather than silently aliasing two rows.
export function generateWpCode(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;
}
