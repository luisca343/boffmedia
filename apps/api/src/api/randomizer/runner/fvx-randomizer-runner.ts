import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';
import type {
  IRandomizerRunner,
  RandomizeJob,
  RandomizeResult,
} from '../ports/randomizer-runner.port';

/**
 * Error thrown when FVX randomizer fails.
 */
export class FvxRandomizerError extends Error {
  constructor(
    message: string,
    public exitCode?: number,
    public stderr?: string,
  ) {
    super(message);
    this.name = 'FvxRandomizerError';
  }
}

/**
 * Semaphore for controlling concurrency of FVX randomizer jobs.
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
export class FvxRandomizerRunner implements IRandomizerRunner {
  private semaphore: Semaphore;
  private readonly javaPath: string;
  private readonly jarPath: string;
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
    this.jarPath = env.RANDOMIZER_JAR || '';
    const maxConcurrency = env.RANDOMIZER_MAX_CONCURRENCY || 2;
    this.timeoutMs = env.RANDOMIZER_TIMEOUT_MS || 180000;

    // If no scratch dir specified, use system temp + randomizer
    if (env.RANDOMIZER_SCRATCH_DIR) {
      this.scratchDir = env.RANDOMIZER_SCRATCH_DIR;
    } else {
      this.scratchDir = path.join(os.tmpdir(), 'randomizer');
    }

    this.semaphore = new Semaphore(maxConcurrency);

    // Ensure scratch dir exists
    if (!fs.existsSync(this.scratchDir)) {
      fs.mkdirSync(this.scratchDir, { recursive: true });
    }
  }

  async randomize(job: RandomizeJob): Promise<RandomizeResult> {
    // Acquire permit from semaphore
    await this.semaphore.acquire();

    const jobId = randomUUID();
    const jobDir = path.join(this.scratchDir, jobId);

    try {
      // Create job directory
      fs.mkdirSync(jobDir, { recursive: true });

      // Determine ROM file extension based on platform
      const romExt = job.gamePlatform === 'nds' ? '.nds' : '.gba';
      const inPath = path.join(jobDir, `input${romExt}`);
      const outPath = path.join(jobDir, `output${romExt}`);
      const settingsPath = path.join(jobDir, 'settings.rnqs');

      // Stream ROM to disk
      await this.streamToFile(job.romStream, inPath);

      // Write settings.rnqs
      fs.writeFileSync(settingsPath, job.settingsRnqs);

      // Spawn the FVX randomizer
      const heap = job.gamePlatform === 'nds' ? '4096m' : '512m';
      const args = [
        '--enable-preview',
        `-Xmx${heap}`,
        '-jar',
        this.jarPath,
        'cli',
        '-i',
        inPath,
        '-o',
        outPath,
        '-s',
        settingsPath,
        '--seed',
        String(job.seed),
        '-l',
      ];

      this.logger.debug(`Spawning FVX: ${this.javaPath} ${args.join(' ')}`);

      const result = await this.runFvxProcess(args, jobDir, inPath, outPath);

      return result;
    } finally {
      // Clean up job directory and release semaphore permit
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (err) {
        this.logger.warn(`Failed to clean up job directory ${jobDir}:`, err);
      }
      this.semaphore.release();
    }
  }

  /**
   * Stream readable input to a file on disk.
   */
  private streamToFile(
    readable: Readable | undefined,
    filePath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!readable) {
        reject(new FvxRandomizerError('ROM stream is required'));
        return;
      }

      const writeStream = fs.createWriteStream(filePath);
      readable.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve();
      });

      writeStream.on('error', (err) => {
        reject(
          new FvxRandomizerError(
            `Failed to write ROM to ${filePath}: ${(err as Error).message}`,
          ),
        );
      });

      readable.on('error', (err) => {
        reject(
          new FvxRandomizerError(`ROM stream error: ${(err as Error).message}`),
        );
      });
    });
  }

  /**
   * Run the FVX randomizer process with timeout and error handling.
   */
  private runFvxProcess(
    args: string[],
    jobDir: string,
    inPath: string,
    outPath: string,
  ): Promise<RandomizeResult> {
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
            `FVX process ${process.pid} timeout after ${this.timeoutMs}ms, killing...`,
          );
          // Kill the entire process tree
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
          throw new FvxRandomizerError('Failed to create process streams');
        }

        // Capture stdout/stderr with size limit
        const maxOutputSize = 1024 * 1024; // 1MB cap
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
              new FvxRandomizerError(
                `FVX randomizer timeout after ${this.timeoutMs}ms`,
                -1,
                stderr,
              ),
            );
            return;
          }

          if (exitCode !== 0) {
            reject(
              new FvxRandomizerError(
                `FVX randomizer exited with code ${exitCode ?? 'unknown'}`,
                exitCode ?? -1,
                stderr,
              ),
            );
            return;
          }

          // Process succeeded, read output files
          try {
            this.readOutputFiles(inPath, outPath, jobDir)
              .then(resolve)
              .catch(reject);
          } catch (err) {
            reject(err);
          }
        });

        process.on('error', (err) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          reject(
            new FvxRandomizerError(
              `Failed to spawn FVX process: ${(err as Error).message}`,
              -1,
              stderr,
            ),
          );
        });
      } catch (err) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(
          new FvxRandomizerError(
            `Error starting FVX process: ${(err as Error).message}`,
          ),
        );
      }
    });
  }

  /**
   * Read the output ROM and log files after successful randomization.
   */
  private readOutputFiles(
    inPath: string,
    outPath: string,
    jobDir: string,
  ): Promise<RandomizeResult> {
    return new Promise((resolve, reject) => {
      try {
        // Read output ROM
        if (!fs.existsSync(outPath)) {
          reject(new FvxRandomizerError(`Output ROM not found at ${outPath}`));
          return;
        }

        const romBytes = fs.readFileSync(outPath);

        // Compute SHA-512 of output ROM
        const romHash = createHash('sha512');
        romHash.update(romBytes);
        const outputSha512 = romHash.digest('hex');

        // Find and read the log file
        // FVX writes log next to the output ROM with the same name + .log
        const logPath = `${outPath}.log`;

        let logBytes: Buffer;
        if (fs.existsSync(logPath)) {
          logBytes = fs.readFileSync(logPath);
        } else {
          // Fallback: log file might be in the job dir with a different name
          const files = fs.readdirSync(jobDir);
          const logFile = files.find((f) => f.endsWith('.log'));
          if (logFile) {
            logBytes = fs.readFileSync(path.join(jobDir, logFile));
          } else {
            this.logger.warn(
              `No .log file found in ${jobDir}, using empty buffer`,
            );
            logBytes = Buffer.alloc(0);
          }
        }

        resolve({
          outputSha512,
          logBytes,
          romBytes,
        });
      } catch (err) {
        reject(
          new FvxRandomizerError(
            `Failed to read output files: ${(err as Error).message}`,
          ),
        );
      }
    });
  }
}
