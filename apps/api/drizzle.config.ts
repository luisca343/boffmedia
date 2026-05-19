import * as dotenv from 'dotenv';
dotenv.config();

import { Config, defineConfig } from 'drizzle-kit';
import { env } from './src/config/env';

export default defineConfig({
  schema: './src/_db/schema/*.ts',
  out: './drizzle/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
}) satisfies Config;