import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { ISettingsShim } from '../ports/settings-shim.port';
import { RandomizerSettings } from '@boffmedia/pack-schema';

/**
 * Error thrown when settings shim fails.
 */
export class SettingsShimError extends Error {
  constructor(
    message: string,
    public exitCode?: number,
    public stderr?: string,
  ) {
    super(message);
    this.name = 'SettingsShimError';
  }
}

/**
 * Semaphore for controlling concurrency of settings shim operations.
 */
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }
}

@Injectable()
export class FvxSettingsShim implements ISettingsShim {
  private semaphore: Semaphore;
  private readonly javaPath: string;
  private readonly fvxJarPath: string;
  private readonly shimJarPath: string;
  private readonly scratchDir: string;
  private readonly timeoutMs: number;
  private readonly logger: Logger;

  constructor(
    logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.logger = logger;
    const env = this.configService.get<any>('env') || {};

    this.javaPath = env.RANDOMIZER_JAVA || 'java';
    this.fvxJarPath = env.RANDOMIZER_JAR || '';
    this.shimJarPath = env.RANDOMIZER_SHIM_JAR || '';
    const maxConcurrency = env.RANDOMIZER_SHIM_MAX_CONCURRENCY || 2;
    this.timeoutMs = env.RANDOMIZER_SHIM_TIMEOUT_MS || 30000;

    // If no scratch dir specified, use system temp + randomizer-shim
    if (env.RANDOMIZER_SCRATCH_DIR) {
      this.scratchDir = path.join(env.RANDOMIZER_SCRATCH_DIR, 'shim');
    } else {
      this.scratchDir = path.join(os.tmpdir(), 'randomizer-shim');
    }

    this.semaphore = new Semaphore(maxConcurrency);

    // Ensure scratch dir exists
    if (!fs.existsSync(this.scratchDir)) {
      fs.mkdirSync(this.scratchDir, { recursive: true });
    }
  }

  async encode(json: Record<string, unknown>): Promise<Buffer> {
    // Acquire permit from semaphore
    await this.semaphore.acquire();

    const jobId = randomUUID();
    const jobDir = path.join(this.scratchDir, jobId);

    try {
      // Validate input against schema
      RandomizerSettings.parse(json);

      // Create job directory
      fs.mkdirSync(jobDir, { recursive: true });

      const outPath = path.join(jobDir, 'settings.rnqs');

      // Spawn the shim process with java -cp syntax
      const args = [
        '--enable-preview',
        '-cp',
        this.buildClasspath(),
        'SettingsShim',
        'encode',
        outPath,
      ];

      this.logger.debug(
        `Spawning settings shim encode: ${this.javaPath} ${args.slice(0, 3).join(' ')} ... SettingsShim encode ${outPath}`,
      );

      const rnqsBuffer = await this.runShimProcess(
        args,
        JSON.stringify(json),
        jobDir,
        outPath,
      );

      return rnqsBuffer;
    } finally {
      // Clean up job directory and release semaphore permit
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (err) {
        this.logger.warn(
          `Failed to clean up shim job directory ${jobDir}:`,
          err,
        );
      }
      this.semaphore.release();
    }
  }

  async decode(rnqs: Buffer): Promise<Record<string, unknown>> {
    // Acquire permit from semaphore
    await this.semaphore.acquire();

    const jobId = randomUUID();
    const jobDir = path.join(this.scratchDir, jobId);

    try {
      // Create job directory
      fs.mkdirSync(jobDir, { recursive: true });

      const inPath = path.join(jobDir, 'settings.rnqs');

      // Write input .rnqs bytes to file
      fs.writeFileSync(inPath, rnqs);

      // Spawn the shim process
      const args = [
        '--enable-preview',
        '-cp',
        this.buildClasspath(),
        'SettingsShim',
        'decode',
        inPath,
      ];

      this.logger.debug(
        `Spawning settings shim decode: ${this.javaPath} ${args.slice(0, 3).join(' ')} ... SettingsShim decode ${inPath}`,
      );

      return this.runShimDecodeProcess(args, jobDir);
    } finally {
      // Clean up job directory and release semaphore permit
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (err) {
        this.logger.warn(
          `Failed to clean up shim job directory ${jobDir}:`,
          err,
        );
      }
      this.semaphore.release();
    }
  }

  async caps(_gameId: string): Promise<unknown> {
    // caps is deferred — the shim's caps endpoint is not yet implemented
    // Editor greying uses a static map for now
    this.logger.debug(
      'caps() requested but not yet implemented; returning empty',
    );
    return {};
  }

  /**
   * Build the classpath for the Java process (platform-aware separator).
   */
  private buildClasspath(): string {
    // On Windows, use semicolon; on Unix, use colon
    const sep = process.platform === 'win32' ? ';' : ':';
    return `${this.fvxJarPath}${sep}${this.shimJarPath}`;
  }

  /**
   * Run the shim process for encode operations.
   */
  private runShimProcess(
    args: string[],
    stdinJson: string,
    jobDir: string,
    outPath: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let process: ChildProcess | null = null;
      let timedOut = false;
      let timeoutHandle: NodeJS.Timeout | null = null;
      let stderr = '';

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        if (process && process.pid) {
          this.logger.warn(
            `Shim process ${process.pid} timeout after ${this.timeoutMs}ms, killing...`,
          );
          process.kill('SIGKILL');
        }
      }, this.timeoutMs);

      // Spawn process
      try {
        process = spawn(this.javaPath, args, {
          cwd: jobDir,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!process.stdout || !process.stderr || !process.stdin) {
          throw new SettingsShimError('Failed to create process streams');
        }

        // Capture stderr with size limit
        const maxOutputSize = 1024 * 1024; // 1MB cap
        process.stderr.on('data', (chunk: Buffer) => {
          if (stderr.length < maxOutputSize) {
            stderr += chunk.toString(
              'utf-8',
              0,
              Math.min(chunk.length, maxOutputSize - stderr.length),
            );
          }
        });

        // Write JSON to stdin
        process.stdin.write(stdinJson);
        process.stdin.end();

        process.on('exit', (exitCode: number | null) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);

          if (timedOut) {
            reject(
              new SettingsShimError(
                `Settings shim timeout after ${this.timeoutMs}ms`,
                -1,
                stderr,
              ),
            );
            return;
          }

          if (exitCode !== 0) {
            reject(
              new SettingsShimError(
                `Settings shim exited with code ${exitCode ?? 'unknown'}`,
                exitCode ?? -1,
                stderr,
              ),
            );
            return;
          }

          // Process succeeded, read output file
          try {
            if (!fs.existsSync(outPath)) {
              reject(
                new SettingsShimError(
                  `Shim did not produce output file at ${outPath}`,
                ),
              );
              return;
            }
            const rnqsBuffer = fs.readFileSync(outPath);
            resolve(rnqsBuffer);
          } catch (err) {
            reject(
              new SettingsShimError(
                `Failed to read output file: ${(err as Error).message}`,
              ),
            );
          }
        });

        process.on('error', (err) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          reject(
            new SettingsShimError(
              `Failed to spawn shim process: ${(err as Error).message}`,
              -1,
              stderr,
            ),
          );
        });
      } catch (err) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(
          new SettingsShimError(
            `Error starting shim process: ${(err as Error).message}`,
          ),
        );
      }
    });
  }

  /**
   * Run the shim process for decode operations.
   */
  private runShimDecodeProcess(
    args: string[],
    jobDir: string,
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let process: ChildProcess | null = null;
      let timedOut = false;
      let timeoutHandle: NodeJS.Timeout | null = null;
      let stdout = '';
      let stderr = '';

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        if (process && process.pid) {
          this.logger.warn(
            `Shim process ${process.pid} timeout after ${this.timeoutMs}ms, killing...`,
          );
          process.kill('SIGKILL');
        }
      }, this.timeoutMs);

      // Spawn process
      try {
        process = spawn(this.javaPath, args, {
          cwd: jobDir,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        if (!process.stdout || !process.stderr) {
          throw new SettingsShimError('Failed to create process streams');
        }

        // Capture stdout/stderr with size limit
        const maxOutputSize = 10 * 1024 * 1024; // 10MB cap for JSON
        process.stdout.on('data', (chunk: Buffer) => {
          if (stdout.length < maxOutputSize) {
            stdout += chunk.toString(
              'utf-8',
              0,
              Math.min(chunk.length, maxOutputSize - stdout.length),
            );
          }
        });

        process.stderr.on('data', (chunk: Buffer) => {
          if (stderr.length < maxOutputSize) {
            stderr += chunk.toString(
              'utf-8',
              0,
              Math.min(chunk.length, maxOutputSize - stderr.length),
            );
          }
        });

        process.on('exit', (exitCode: number | null) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);

          if (timedOut) {
            reject(
              new SettingsShimError(
                `Settings shim timeout after ${this.timeoutMs}ms`,
                -1,
                stderr,
              ),
            );
            return;
          }

          if (exitCode !== 0) {
            reject(
              new SettingsShimError(
                `Settings shim exited with code ${exitCode ?? 'unknown'}`,
                exitCode ?? -1,
                stderr,
              ),
            );
            return;
          }

          // Parse JSON output
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (err) {
            reject(
              new SettingsShimError(
                `Failed to parse shim output JSON: ${(err as Error).message}`,
              ),
            );
          }
        });

        process.on('error', (err) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          reject(
            new SettingsShimError(
              `Failed to spawn shim process: ${(err as Error).message}`,
              -1,
              stderr,
            ),
          );
        });
      } catch (err) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(
          new SettingsShimError(
            `Error starting shim process: ${(err as Error).message}`,
          ),
        );
      }
    });
  }
}
