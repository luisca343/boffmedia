import pino from 'pino';

const logger = pino({ name: 'util' });

export class LoggingUtil {
  private static instance: LoggingUtil;
  private logging: boolean;

  private constructor() {
    this.logging = false;
  }

  static getInstance(): LoggingUtil {
    if (!LoggingUtil.instance) {
      LoggingUtil.instance = new LoggingUtil();
    }
    return LoggingUtil.instance;
  }

  toggleLogging(): boolean {
    this.logging = !this.logging;
    logger.info(`Logging is now ${this.logging}`);
    return this.logging;
  }

  getLogging(): boolean {
    return this.logging;
  }
}
