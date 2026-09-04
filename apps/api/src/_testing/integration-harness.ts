import { readdirSync, statSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { createPool, Pool } from 'mysql2/promise';
import {
  startTestDatabase,
  stopTestDatabase,
  getTestDatabaseConfig,
  getDatabaseUrl,
  isDockerAvailable,
  TestDatabaseConfig,
} from './testcontainers-setup';

/**
 * Shared state for all integration tests in a run.
 * Tests access it via getIntegrationDatabase() after setupIntegration() is called.
 */
let globalDatabase: MySql2Database | null = null;
let globalConfig: TestDatabaseConfig | null = null;
let globalPool: Pool | null = null;

/**
 * Called by beforeAll() in test suites. Starts the container and sets up
 * the drizzle client. Throws if Docker is unavailable (caller handles via skip).
 */
export async function setupIntegration(): Promise<void> {
  // Container lifecycle is one per jest run, not per suite.
  // A second suite calling this reuses the same container.
  if (globalDatabase) {
    return;
  }

  const config = await startTestDatabase();
  globalConfig = config;

  // Create the mysql2 connection pool
  globalPool = createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 5,
  });

  globalDatabase = drizzle(globalPool);
}

/**
 * Called by afterAll() in the LAST test suite. Tears down the container.
 * Earlier suites should call this too, but it's idempotent.
 */
export async function teardownIntegration(): Promise<void> {
  // Clean up only once
  if (!globalDatabase) {
    return;
  }

  globalDatabase = null;
  globalConfig = null;

  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }

  await stopTestDatabase();
}

/**
 * Get the drizzle client. Throws if setupIntegration() was not called.
 */
export function getIntegrationDatabase(): MySql2Database {
  if (!globalDatabase) {
    throw new Error(
      'Integration database not initialized. Call setupIntegration() in beforeAll().',
    );
  }
  return globalDatabase;
}

/**
 * Get the raw database config. Needed for env var setup in some tests.
 */
export function getIntegrationDatabaseConfig(): TestDatabaseConfig {
  if (!globalConfig) {
    throw new Error(
      'Integration database config not initialized. Call setupIntegration() in beforeAll().',
    );
  }
  return globalConfig;
}

/**
 * Whether a Docker endpoint is reachable, decided SYNCHRONOUSLY at module load.
 *
 * This has to be synchronous, and that is the whole point. Jest can only skip a
 * suite that is declared skipped when the file is evaluated — `describe.skip`.
 * There is no way to skip from inside `beforeAll`: the first version of this
 * harness threw a marker error there, caught it and returned, which made the
 * hook SUCCEED and every test in the file then ran against an uninitialised
 * database and failed. It reported a graceful skip and delivered a red suite.
 *
 * So: probe the socket the daemon listens on, with no daemon round-trip. A
 * false positive (socket present, daemon wedged) fails loudly at container
 * start, which is correct — that is a broken Docker, not an absent one.
 */
function dockerEndpointPresent(): boolean {
  const host = process.env['DOCKER_HOST'];
  if (host && !host.startsWith('unix://')) return true;
  try {
    if (process.platform === 'win32') {
      // A named pipe does not answer statSync; listing the pipe directory does.
      return readdirSync('\\\\.\\pipe\\').some((n) =>
        n.toLowerCase().includes('docker_engine'),
      );
    }
    const socket = host?.replace(/^unix:\/\//, '') ?? '/var/run/docker.sock';
    return statSync(socket).isSocket();
  } catch {
    return false;
  }
}

export const DOCKER_AVAILABLE = dockerEndpointPresent();

/**
 * Use in place of `describe` for every integration suite. With no Docker the
 * suite is reported as skipped, not failed, and nothing in it is evaluated.
 */
export const describeIntegration = DOCKER_AVAILABLE ? describe : describe.skip;

/**
 * Reset all tables to clean state. Runs AFTER each test so the next
 * test starts with an empty database. Foreign keys are temporarily disabled
 * during the truncate to avoid constraint violations.
 *
 * Tables are listed in dependency order (parents before children).
 */
export async function resetDatabase(): Promise<void> {
  if (!globalPool) {
    throw new Error('Database pool not initialized');
  }

  // Order matters: truncate children before parents to avoid FK constraint errors.
  // This is why we disable FKs first.
  const tables = [
    // Boffmedia domain
    'boffmedia_user_roles',
    'boffmedia_roles',
    'boffmedia_participants', // Depends on boffmedia_users
    'boffmedia_users', // Parent
    // SmartRotom domain (not all tables, just what we might touch in users tests)
    'rotom_users', // May be referenced by boffmedia_users.uuid
  ];

  const connection = await globalPool.getConnection();
  try {
    // Disable FK checks for the truncate
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tables) {
      try {
        await connection.execute(`TRUNCATE TABLE ${table}`);
      } catch (err: any) {
        // Table may not exist if migrations haven't run yet. That is fine.
        if (!err.message.includes('Unknown table')) {
          throw err;
        }
      }
    }

    // Re-enable FK checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  } catch (err) {
    // Re-enable FKs even if something went wrong
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch {
      // Ignore
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Run Drizzle migrations to set up the schema.
 * This reads migrations from drizzle/migrations/ and applies all pending ones.
 */
export async function runMigrations(): Promise<void> {
  if (!globalPool) {
    throw new Error('Database pool not initialized');
  }

  const fs = await import('fs');
  const path = await import('path');

  // Read migration files from the standard location
  const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(
      `Migrations directory not found: ${migrationsDir}. Run 'pnpm generate' first.`,
    );
  }

  const connection = await globalPool.getConnection();
  try {
    // Execute all .sql files in order
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filepath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filepath, 'utf-8');

      // Split on `;` and execute each statement separately
      const statements = sql
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      for (const statement of statements) {
        try {
          await connection.execute(statement);
        } catch (err: any) {
          // Skip errors about already-existing objects (idempotency)
          if (
            err.message.includes('already exists') ||
            err.message.includes('Duplicate')
          ) {
            continue;
          }
          throw err;
        }
      }
    }
  } finally {
    connection.release();
  }
}
