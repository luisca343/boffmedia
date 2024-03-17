import { Config, defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: "./_db/schema/*.ts",
  out: "./_db/migrations",
  driver: "mysql2",
}) satisfies Config