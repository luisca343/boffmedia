import { Config, defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: "./src/_db/schema/*.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
}) satisfies Config