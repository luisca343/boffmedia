import { ConflictException, Injectable } from '@nestjs/common';
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
  /** NDS jobs run with 4G heaps: clamp them to 1 unless the operator explicitly raised RANDOMIZER_MAX_CONCURRENCY. */
  private ndsSemaphore: Semaphore;
  private readonly javaPath: string;
  private readonly jarPath: string;
  private readonly scratchDir: string;
  private readonly timeoutMs: number;
  private readonly logger: Logger;
  private jarSha512Cache: string | null = null;

  constructor(
    logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.logger = logger;
    const env = this.configService.get<any>('env') || {};

    this.javaPath = env.RANDOMIZER_JAVA || 'java';
    this.jarPath = env.RANDOMIZER_JAR || '';
    const explicitConcurrency = env.RANDOMIZER_MAX_CONCURRENCY != null
      ? Number(env.RANDOMIZER_MAX_CONCURRENCY)
      : null;
    const maxConcurrency = explicitConcurrency || 2;
    this.timeoutMs = env.RANDOMIZER_TIMEOUT_MS || 180000;

    // If no scratch dir specified, use system temp + randomizer
    if (env.RANDOMIZER_SCRATCH_DIR) {
      this.scratchDir = env.RANDOMIZER_SCRATCH_DIR;
    } else {
      this.scratchDir = path.join(os.tmpdir(), 'randomizer');
    }

    this.semaphore = new Semaphore(maxConcurrency);
    this.ndsSemaphore = new Semaphore(explicitConcurrency || 1);

    if (!this.jarPath) {
      this.logger.warn(
        'RANDOMIZER_JAR is not configured; randomization requests will fail until it is set',
      );
    }

    // Ensure scratch dir exists
    if (!fs.existsSync(this.scratchDir)) {
      fs.mkdirSync(this.scratchDir, { recursive: true });
    }
  }

  /**
   * Validate the configured jar and return its SHA-512 (cached after first
   * read). Fails with the actual path in the message, not ''.
   */
  private ensureJar(): string {
    if (!this.jarPath) {
      throw new FvxRandomizerError(
        'RANDOMIZER_JAR is not configured (env var is empty or unset)',
      );
    }
    if (this.jarSha512Cache) {
      return this.jarSha512Cache;
    }
    let bytes: Buffer;
    try {
      bytes = fs.readFileSync(this.jarPath);
    } catch (err) {
      throw new FvxRandomizerError(
        `Cannot read randomizer jar at ${this.jarPath}: ${(err as Error).message}`,
      );
    }
    this.jarSha512Cache = createHash('sha512').update(bytes).digest('hex');
    return this.jarSha512Cache;
  }

  async randomize(job: RandomizeJob): Promise<RandomizeResult> {
    const actualJarSha512 = this.ensureJar();
    // The config pinned a jar hash so results stay reproducible/advertised;
    // a swapped jar must refuse, not silently change outputs.
    if (job.jarSha512 && job.jarSha512 !== actualJarSha512) {
      throw new ConflictException({
        message: `Configured randomizer jar (${actualJarSha512.slice(0, 8)}…) does not match the hash pinned by this job (${job.jarSha512.slice(0, 8)}…)`,
        userMessage:
          'La versión del randomizador en el servidor ya no coincide con la fijada para este evento. Avisa a un administrador.',
      });
    }

    const isNds = job.gamePlatform === 'nds';
    // Acquire order is fixed (global → NDS) so mixed workloads cannot deadlock.
    await this.semaphore.acquire();
    if (isNds) {
      await this.ndsSemaphore.acquire();
    }

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
      // Clean up job directory and release semaphore permits
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (err) {
        this.logger.warn(`Failed to clean up job directory ${jobDir}:`, err);
      }
      if (isNds) {
        this.ndsSemaphore.release();
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
      let child: ChildProcess | null = null;
      let timedOut = false;
      let timeoutHandle: NodeJS.Timeout | null = null;
      let stdout = '';
      let stderr = '';

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        if (child && child.pid) {
          this.logger.warn(
            `FVX process ${child.pid} timeout after ${this.timeoutMs}ms, killing...`,
          );
          // Kill the whole process tree: the child is its own process group
          // (detached), so a negative pid signals every descendant on POSIX.
          // Windows has no process groups — it would need `taskkill /pid /T /F`
          // if this ever runs there.
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {
            child.kill('SIGKILL');
          }
        }
      }, this.timeoutMs);

      // Spawn process
      try {
        child = spawn(this.javaPath, args, {
          cwd: jobDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          // Own process group so the timeout can kill java AND anything it forks.
          detached: true,
        });

        if (!child.stdout || !child.stderr) {
          throw new FvxRandomizerError('Failed to create process streams');
        }

        // Capture stdout/stderr with size limit
        const maxOutputSize = 1024 * 1024; // 1MB cap
        child.stdout.on('data', (chunk: Buffer) => {
          if (stdout.length < maxOutputSize) {
            stdout += chunk.toString(
              'utf-8',
              0,
              Math.min(chunk.length, maxOutputSize - stdout.length),
            );
          }
        });

        child.stderr.on('data', (chunk: Buffer) => {
          if (stderr.length < maxOutputSize) {
            stderr += chunk.toString(
              'utf-8',
              0,
              Math.min(chunk.length, maxOutputSize - stderr.length),
            );
          }
        });

        child.on('exit', (exitCode: number | null) => {
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

        child.on('error', (err) => {
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
