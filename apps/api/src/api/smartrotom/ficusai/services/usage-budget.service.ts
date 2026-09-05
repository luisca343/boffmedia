import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import { FicusAiUsageRepository } from '../repositories/ficusai-usage.repository';

/**
 * Per-user daily token budget tracking for FicusAI.
 *
 * Design principle: single upsert per request on a (uuid, date) key,
 * never SELECT all rows. This prevents amplification where a rate limiter
 * that queries every row gets slower the more it is flooded (the bug pattern
 * caught on telemetry ingest).
 */
@Injectable()
export class UsageBudgetService {
  constructor(
    private readonly logger: Logger,
    private readonly usage: FicusAiUsageRepository,
  ) {}

  /** Daily token budget per user. Default: 100k tokens/day. */
  private readonly dailyBudget = env.FICUSAI_DAILY_TOKEN_BUDGET;

  /**
   * Check if a user has available tokens and log the request.
   * Returns false when the budget is spent; the caller decides what that means.
   *
   * @param uuid - Minecraft UUID of the user
   * @param estimatedInputTokens - Expected input tokens for this request
   * @returns true if within budget, false otherwise
   */
  async checkAndLogUsage(
    uuid: string,
    estimatedInputTokens: number = 0,
  ): Promise<boolean> {
    const today = this.getTodayDate();

    const currentTotal = await this.usage.totalFor(uuid, today);
    const projectedTotal = currentTotal + estimatedInputTokens;

    if (projectedTotal > this.dailyBudget) {
      this.logger.warn(
        `[FicusAI Budget] User ${uuid} would exceed daily limit: ${projectedTotal} > ${this.dailyBudget}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Log the actual token usage for a request. Called after model response.
   *
   * @param uuid - Minecraft UUID of the user
   * @param inputTokens - Actual input tokens used
   * @param outputTokens - Actual output tokens used
   */
  async logUsage(
    uuid: string,
    inputTokens: number = 0,
    outputTokens: number = 0,
  ): Promise<void> {
    const today = this.getTodayDate();
    const totalTokens = inputTokens + outputTokens;

    try {
      await this.usage.addUsage(uuid, today, inputTokens, outputTokens);

      this.logger.debug(
        `[FicusAI Usage] User ${uuid} consumed ${totalTokens} tokens (in: ${inputTokens}, out: ${outputTokens})`,
      );
    } catch (error) {
      this.logger.error(
        `[FicusAI Usage] Failed to log usage for ${uuid}`,
        error as Error,
      );
      // Do not throw: a logging failure should not fail the user's request.
    }
  }

  /**
   * Get current day's total for a user. For telemetry/display only.
   */
  async getTodayUsage(uuid: string): Promise<number> {
    const today = this.getTodayDate();
    return this.usage.totalFor(uuid, today);
  }

  /**
   * Get daily budget limit.
   */
  getDailyBudget(): number {
    return this.dailyBudget;
  }

  /**
   * The day this request counts against, in UTC.
   *
   * `setHours(0,0,0,0)` would use the HOST's timezone, which is the W11 defect
   * one layer down: apps/api's Dockerfile sets no TZ, so production is UTC
   * while a developer's machine is not, and the budget would roll over at a
   * different moment in each. UTC is stated here rather than inherited.
   */
  private getTodayDate(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }
}
