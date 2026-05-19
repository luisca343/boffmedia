// Stub required env vars so env.ts can parse(process.env) without throwing in tests.
// Individual tests may override specific vars via jest.mock('@/config/env', ...) if needed.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_USER = process.env.DB_USER ?? 'test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'test';
process.env.DB_NAME = process.env.DB_NAME ?? 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-that-is-long-enough-32chars';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? 'test-google-client-secret';
process.env.MC_WORLD = process.env.MC_WORLD ?? 'test-world';
process.env.WINGULL_API = process.env.WINGULL_API ?? 'http://localhost:8080';
process.env.WINGULL_DB_NAME = process.env.WINGULL_DB_NAME ?? 'wingull_test';
process.env.DISCORD_KEY = process.env.DISCORD_KEY ?? 'test-discord-key';
