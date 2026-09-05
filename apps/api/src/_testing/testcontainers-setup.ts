import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

/**
 * Singleton container management for integration tests.
 * One container per test run, reused across all specs, torn down after.
 *
 * The container is NOT started in module scope — it is started by beforeAll()
 * in the test harness, where it can trigger a graceful skip if Docker is
 * unavailable. Starting it here would fail the import.
 */

let container: StartedTestContainer | null = null;
let initError: Error | null = null;

export interface TestDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Check Docker availability by attempting a simple operation.
 * Returns true if Docker is available, false otherwise.
 * Does NOT throw — a return value is all the caller needs.
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    // testcontainers checks this internally, so we can use it too
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Lazy load to gracefully handle missing docker-modem
    const Docker = require('docker-modem');
    const modem = new Docker();
    await new Promise<void>((resolve, reject) => {
      modem.ping((err: any) => (err ? reject(err) : resolve()));
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Start the MySQL container. Called once per test run via beforeAll().
 * Throws if Docker is unavailable (the caller handles this in a skip).
 */
export async function startTestDatabase(): Promise<TestDatabaseConfig> {
  if (container) {
    return getTestDatabaseConfig();
  }

  if (initError) {
    throw initError;
  }

  try {
    container = await new GenericContainer('mysql:8.0')
      // testcontainers 10 takes ONE record, not key/value pairs. The v9
      // two-argument form does not type-check, so this file never compiled.
      .withEnvironment({
        MYSQL_DATABASE: 'test_db',
        MYSQL_USER: 'test_user',
        MYSQL_PASSWORD: 'test_password',
        MYSQL_ROOT_PASSWORD: 'test_root_password',
      })
      .withExposedPorts(3306)
      .withWaitStrategy(
        Wait.forLogMessage(/port: 3306  MySQL Server - MySQL Community Server/),
      )
      .withStartupTimeout(60000)
      .start();

    return getTestDatabaseConfig();
  } catch (err) {
    initError = err as Error;
    throw err;
  }
}

/**
 * Get the database connection config from the running container.
 */
export function getTestDatabaseConfig(): TestDatabaseConfig {
  if (!container) {
    throw new Error('Database container not started');
  }

  return {
    host: container.getHost(),
    port: container.getMappedPort(3306),
    user: 'test_user',
    password: 'test_password',
    database: 'test_db',
  };
}

/**
 * Stop the container and clean up. Called once after all tests via afterAll().
 */
export async function stopTestDatabase(): Promise<void> {
  if (container) {
    await container.stop();
    container = null;
  }
}

/**
 * Create a connection URL from the config. Used by drizzle-kit and tests.
 */
export function getDatabaseUrl(config: TestDatabaseConfig): string {
  return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}
