import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  TwitchStream,
  TwitchStreamsResponse,
  TwitchTokenResponse,
} from '../interfaces/twitch-stream.interface';

@Injectable()
export class TwitchApiService {
  private readonly logger = new Logger(TwitchApiService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Get OAuth token from Twitch
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TWITCH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Twitch credentials not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<TwitchTokenResponse>(
          'https://id.twitch.tv/oauth2/token',
          new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(
        Date.now() + (response.data.expires_in - 60) * 1000,
      ); // Refresh 1 minute before expiry

      this.logger.log('Successfully obtained Twitch access token');
      return this.accessToken;
    } catch (error: any) {
      this.logger.error('Failed to obtain Twitch access token', error.stack);
      throw error;
    }
  }

  /**
   * Get specific stream by user login
   */
  async getStreamByUsername(username: string): Promise<TwitchStream | null> {
    const accessToken = await this.getAccessToken();
    const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');

    try {
      const response = await firstValueFrom(
        this.httpService.get<TwitchStreamsResponse>(
          'https://api.twitch.tv/helix/streams',
          {
            params: {
              user_login: username,
            },
            headers: {
              'Client-ID': clientId,
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data.data.length > 0 ? response.data.data[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch stream for user "${username}"`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get multiple streams by user logins
   */
  async getStreamsByUsernames(usernames: string[]): Promise<TwitchStream[]> {
    if (usernames.length === 0) return [];

    const accessToken = await this.getAccessToken();
    const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');

    try {
      const chunks = this.chunkArray(usernames, 100);
      const allStreams: TwitchStream[] = [];

      for (const chunk of chunks) {
        const response = await firstValueFrom(
          this.httpService.get<TwitchStreamsResponse>(
            'https://api.twitch.tv/helix/streams',
            {
              params: {
                user_login: chunk,
              },
              headers: {
                'Client-ID': clientId,
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
        );

        allStreams.push(...response.data.data);
      }

      this.logger.log(
        `Found ${allStreams.length} live streams from ${usernames.length} usernames`,
      );
      return allStreams;
    } catch (error: any) {
      this.logger.error(`Failed to fetch streams for usernames`, error.stack);
      throw error;
    }
  }

  /**
   * Utility method to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
