import { Config, defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: "./src/_db/schema/*.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || 'mysql://Usuario:Contraseña@148.251.3.244:3306/bofftest'
  },
}) satisfies Config