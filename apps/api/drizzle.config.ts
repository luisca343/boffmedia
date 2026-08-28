import * as dotenv from 'dotenv';
dotenv.config();

import { Config, defineConfig } from 'drizzle-kit';
import { env } from './src/config/env';

export default defineConfig({
  // Excludes `*.spec.ts`: drizzle-kit `require()`s every file this glob matches,
  // and a vitest file calling `describe` at module scope throws outside the test
  // runner — which made `drizzle-kit generate` fail before it read a schema.
  schema: './src/_db/schema/!(*.spec).ts',
  out: './drizzle/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
}) satisfies Config;