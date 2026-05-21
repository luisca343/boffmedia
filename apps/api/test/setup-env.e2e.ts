const defaults: Record<string, string> = {
  DB_HOST: 'localhost',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  DB_PORT: '3306',
  JWT_SECRET: 'test-secret-minimum-length-32-chars',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  MC_WORLD: 'test-world',
  WINGULL_API: 'http://localhost:3001',
  WINGULL_DB_NAME: 'wingull_test',
  DISCORD_KEY: 'test-discord-key',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
