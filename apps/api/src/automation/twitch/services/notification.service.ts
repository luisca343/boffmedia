import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  StreamNotification,
  NotificationTarget,
} from '../interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly targets: NotificationTarget[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.initializeDefaultTargets();
  }

  /**
   * Initialize default notification targets
   */
  private initializeDefaultTargets(): void {
    // Example: Discord webhook (you can configure this in your .env)
    const discordWebhook = this.configService.get<string>(
      'DISCORD_WEBHOOK_URL',
    );
    if (discordWebhook) {
      this.targets.push({
        type: 'webhook',
        config: {
          url: discordWebhook,
          headers: {
            'Content-Type': 'application/json',
          },
          template: 'discord',
        },
      });
    }

    // Example: Console logging (always enabled for testing)
    this.targets.push({
      type: 'database',
      config: {
        table: 'console_log',
      },
    });
  }

  /**
   * Send stream notification to all configured targets
   */
  async sendStreamNotification(
    notification: StreamNotification,
  ): Promise<void> {
    this.logger.log(
      `Sending notification for ${notification.stream.user_name} - Live: ${notification.isLive}, New: ${notification.isNewStream}`,
    );

    const promises = this.targets.map((target) =>
      this.sendToTarget(notification, target),
    );

    try {
      await Promise.allSettled(promises);
    } catch (error: any) {
      this.logger.error('Error sending notifications', error.stack);
    }
  }

  /**
   * Send notification to a specific target
   */
  private async sendToTarget(
    notification: StreamNotification,
    target: NotificationTarget,
  ): Promise<void> {
    try {
      switch (target.type) {
        case 'discord':
          await this.sendDiscordNotification(notification, target);
          break;
        case 'webhook':
          await this.sendWebhookNotification(notification, target);
          break;
        case 'database':
          await this.logToConsole(notification, target);
          break;
        default:
          this.logger.warn(`Unknown notification target type: ${target.type}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to send notification to ${target.type}`,
        error.stack,
      );
    }
  }

  /**
   * Send Discord notification (if you have a bot)
   */
  private async sendDiscordNotification(
    notification: StreamNotification,
    target: NotificationTarget,
  ): Promise<void> {
    // This would require discord.js integration
    // For now, we'll log it
    this.logger.log(
      `[Discord] Would send: ${this.formatMessage(notification)}`,
    );
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    notification: StreamNotification,
    target: NotificationTarget,
  ): Promise<void> {
    if (!target.config.url) {
      throw new Error('Webhook URL not configured');
    }

    let payload: any;

    if (target.config.template === 'discord') {
      payload = this.formatDiscordWebhook(notification);
    } else {
      payload = {
        message: this.formatMessage(notification),
        stream: notification.stream,
        metadata: {
          isLive: notification.isLive,
          isNewStream: notification.isNewStream,
          timestamp: notification.timestamp,
        },
      };
    }

    await firstValueFrom(
      this.httpService.post(target.config.url, payload, {
        headers: target.config.headers || {},
      }),
    );

    this.logger.log(`Webhook notification sent to ${target.config.url}`);
  }

  /**
   * Log to console (database placeholder)
   */
  private async logToConsole(
    notification: StreamNotification,
    target: NotificationTarget,
  ): Promise<void> {
    const message = this.formatMessage(notification);
    console.log(`[STREAM NOTIFICATION] ${message}`);

    // Here you could save to your database instead
    // await this.saveToDatabase(notification);
  }

  /**
   * Format message for general use
   */
  private formatMessage(notification: StreamNotification): string {
    if (notification.isLive && notification.isNewStream) {
      return (
        `🔴 ${notification.stream.user_name} just went live!\n` +
        `🎮 Playing: ${notification.stream.game_name}\n` +
        `📺 "${notification.stream.title}"\n` +
        `👥 ${notification.stream.viewer_count} viewers\n` +
        `🏷️ Tags: ${notification.stream.tags.join(', ')}`
      );
    } else if (!notification.isLive) {
      return `⚫ ${notification.stream.user_name} went offline`;
    } else {
      return `📊 ${notification.stream.user_name} is still live - ${notification.stream.viewer_count} viewers`;
    }
  }

  /**
   * Format Discord webhook payload
   */
  private formatDiscordWebhook(notification: StreamNotification): any {
    if (notification.isLive && notification.isNewStream) {
      const thumbnailUrl = notification.stream.thumbnail_url
        .replace('{width}', '1280')
        .replace('{height}', '720');

      return {
        embeds: [
          {
            title: `🔴 ${notification.stream.user_name} is now live!`,
            description: notification.stream.title,
            color: 0x9146ff, // Twitch purple
            fields: [
              {
                name: '🎮 Game',
                value: notification.stream.game_name || 'No game',
                inline: true,
              },
              {
                name: '👥 Viewers',
                value: notification.stream.viewer_count.toString(),
                inline: true,
              },
              {
                name: '🏷️ Tags',
                value:
                  notification.stream.tags.length > 0
                    ? notification.stream.tags.slice(0, 5).join(', ')
                    : 'No tags',
                inline: false,
              },
            ],
            image: {
              url: thumbnailUrl,
            },
            url: `https://twitch.tv/${notification.stream.user_name}`,
            timestamp: notification.timestamp.toISOString(),
            footer: {
              text: 'Twitch Stream Monitor',
              icon_url: 'https://cdn.discordapp.com/attachments/your-icon.png',
            },
          },
        ],
      };
    } else if (!notification.isLive) {
      return {
        embeds: [
          {
            title: `⚫ ${notification.stream.user_name} went offline`,
            color: 0x666666,
            timestamp: notification.timestamp.toISOString(),
            footer: {
              text: 'Twitch Stream Monitor',
            },
          },
        ],
      };
    }

    return null;
  }

  /**
   * Add a new notification target
   */
  addTarget(target: NotificationTarget): void {
    this.targets.push(target);
    this.logger.log(`Added new notification target: ${target.type}`);
  }

  /**
   * Remove a notification target
   */
  removeTarget(type: string, identifier?: string): void {
    const index = this.targets.findIndex(
      (target) =>
        target.type === type &&
        (!identifier ||
          target.config.url === identifier ||
          target.config.channelId === identifier),
    );

    if (index > -1) {
      this.targets.splice(index, 1);
      this.logger.log(`Removed notification target: ${type}`);
    }
  }

  /**
   * Get current targets
   */
  getTargets(): NotificationTarget[] {
    return [...this.targets];
  }
}
