import { Config, defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: "./src/_db/schema/*.ts",
  out: "./drizzle/migrations",
  driver: "mysql2",
}) satisfies Config