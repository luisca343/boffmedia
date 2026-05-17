import { Injectable, Logger } from '@nestjs/common';
import { TwitchApiService } from './twitch-api.service';
import { NotificationService } from './notification.service';
import { TwitchStream } from '../interfaces/twitch-stream.interface';

interface MonitoredStream {
  streamId: string;
  userId: string;
  username: string;
  lastSeen: Date;
  isCurrentlyLive: boolean;
}

@Injectable()
export class TwitchMonitorService {
  private readonly logger = new Logger(TwitchMonitorService.name);
  private readonly monitoredUsers: string[] = [];
  private readonly streamCache = new Map<string, MonitoredStream>();

  constructor(
    private readonly twitchApiService: TwitchApiService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Monitor streams every 2 minutes
   */
  //@Cron('0 */2 * * * *') // Every 2 minutes
  async checkStreams(): Promise<void> {
    this.logger.log('Starting stream monitoring cycle...');

    try {
      await this.checkStreamsByUsers();

      // Clean up old cache entries (streams not seen for 30 minutes)
      this.cleanupStreamCache();

      this.logger.log('Stream monitoring cycle completed');
    } catch (error: any) {
      this.logger.error('Error during stream monitoring cycle', error.stack);
    }
  }

  /**
   * Manual trigger for immediate check
   */
  async checkStreamsNow(): Promise<{
    foundStreams: number;
    notifications: number;
  }> {
    this.logger.log('Manual stream check triggered');

    let foundStreams = 0;
    let notifications = 0;

    try {
      const userResults = await this.checkStreamsByUsers();
      foundStreams = userResults.foundStreams;
      notifications = userResults.notifications;

      return { foundStreams, notifications };
    } catch (error: any) {
      this.logger.error('Error during manual stream check', error.stack);
      throw error;
    }
  }

  /**
   * Check streams by monitored users
   */
  private async checkStreamsByUsers(): Promise<{
    foundStreams: number;
    notifications: number;
  }> {
    if (this.monitoredUsers.length === 0) {
      this.logger.log(
        'No users to monitor. Add users with addMonitoredUser() method.',
      );
      return { foundStreams: 0, notifications: 0 };
    }

    let foundStreams = 0;
    let notifications = 0;

    try {
      const streams = await this.twitchApiService.getStreamsByUsernames(
        this.monitoredUsers,
      );
      foundStreams = streams.length;

      for (const stream of streams) {
        // Check if stream contains "wingull" in title, tags, or game
        const containsWingull = this.streamContainsWingull(stream);

        if (containsWingull) {
          const notificationSent = await this.processStream(stream, 'user');
          if (notificationSent) notifications++;
        } else {
          this.logger.debug(
            `Stream ${stream.user_name} does not contain "wingull" - skipping notification`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        'Failed to check streams for monitored users',
        error.stack,
      );
    }

    return { foundStreams, notifications };
  }

  /**
   * Check if stream contains "wingull" in title, tags, or is "Pixelmon Wingull 2" game category
   */
  private streamContainsWingull(stream: TwitchStream): boolean {
    // Check title for "wingull"
    const titleContains = stream.title?.toLowerCase().includes('wingull');

    // Check tags for "wingull"
    const tagsContain = stream.tags?.some((tag) =>
      tag.toLowerCase().includes('wingull'),
    );

    // Check if game is exactly "Pixelmon Wingull 2"
    const gameIsPixelmonWingull =
      stream.game_name?.toLowerCase() === 'pixelmon wingull 2';

    const result = titleContains || tagsContain || gameIsPixelmonWingull;

    if (result) {
      this.logger.log(
        `Stream "${stream.user_name}" contains wingull content - ` +
          `Title: ${titleContains ? '✓' : '✗'}, ` +
          `Tags: ${tagsContain ? '✓' : '✗'}, ` +
          `Game is "Pixelmon Wingull 2": ${gameIsPixelmonWingull ? '✓' : '✗'}`,
      );
    }

    return result;
  }

  /**
   * Process individual stream and determine if notification should be sent
   */
  private async processStream(
    stream: TwitchStream,
    _source: 'user',
  ): Promise<boolean> {
    const cacheKey = stream.user_id;
    const existing = this.streamCache.get(cacheKey);
    const now = new Date();

    // Determine if this is a new stream
    const isNewStream = !existing || !existing.isCurrentlyLive;

    // Update cache
    this.streamCache.set(cacheKey, {
      streamId: stream.id,
      userId: stream.user_id,
      username: stream.user_login,
      lastSeen: now,
      isCurrentlyLive: true,
    });

    // Send notification if it's a new stream
    if (isNewStream) {
      this.logger.log(
        `New wingull stream detected: ${stream.user_name} - "${stream.title}"`,
      );

      await this.notificationService.sendStreamNotification({
        stream: {
          id: stream.id,
          user_name: stream.user_name,
          title: stream.title,
          game_name: stream.game_name,
          viewer_count: stream.viewer_count,
          started_at: stream.started_at,
          thumbnail_url: stream.thumbnail_url,
          tags: stream.tags,
        },
        isLive: true,
        isNewStream: true,
        timestamp: now,
      });

      return true;
    }

    return false;
  }

  /**
   * Mark streams as offline if they're no longer in the current check
   */
  private async markStreamsOffline(
    currentStreamIds: Set<string>,
  ): Promise<void> {
    for (const [_userId, cached] of this.streamCache) {
      if (cached.isCurrentlyLive && !currentStreamIds.has(cached.streamId)) {
        // Stream went offline
        cached.isCurrentlyLive = false;
        cached.lastSeen = new Date();

        this.logger.log(`Stream went offline: ${cached.username}`);

        await this.notificationService.sendStreamNotification({
          stream: {
            id: cached.streamId,
            user_name: cached.username,
            title: '',
            game_name: '',
            viewer_count: 0,
            started_at: '',
            thumbnail_url: '',
            tags: [],
          },
          isLive: false,
          isNewStream: false,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanupStreamCache(): void {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, cached] of this.streamCache) {
      if (cached.lastSeen < thirtyMinutesAgo && !cached.isCurrentlyLive) {
        this.streamCache.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old stream cache entries`);
    }
  }

  /**
   * Get current monitored streams status
   */
  getMonitoringStatus(): {
    monitoredUsers: string[];
    cachedStreams: number;
    liveStreams: number;
  } {
    const liveStreams = Array.from(this.streamCache.values()).filter(
      (s) => s.isCurrentlyLive,
    ).length;

    return {
      monitoredUsers: this.monitoredUsers,
      cachedStreams: this.streamCache.size,
      liveStreams,
    };
  }

  /**
   * Add a user to monitoring list
   */
  addMonitoredUser(username: string): void {
    if (!this.monitoredUsers.includes(username.toLowerCase())) {
      this.monitoredUsers.push(username.toLowerCase());
      this.logger.log(`Added user "${username}" to monitoring list`);
    }
  }

  /**
   * Remove a user from monitoring list
   */
  removeMonitoredUser(username: string): void {
    const index = this.monitoredUsers.indexOf(username.toLowerCase());
    if (index > -1) {
      this.monitoredUsers.splice(index, 1);
      this.logger.log(`Removed user "${username}" from monitoring list`);
    }
  }
}
