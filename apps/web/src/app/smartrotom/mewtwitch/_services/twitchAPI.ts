import { 
  TwitchStream, 
  TwitchUser, 
  TwitchSearchChannel,
  TwitchGame, 
  TwitchVideo, 
  TwitchClip, 
  TWITCH_CLIENT_ID, 
  TWITCH_CLIENT_SECRET 
} from "../types";

interface TwitchAPIResponse<T> {
  data: T[];
  pagination?: {
    cursor?: string;
  };
}

interface TwitchAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class TwitchAPIService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseURL = 'https://api.twitch.tv/helix';

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data: TwitchAuthResponse = await response.json();
      this.accessToken = data.access_token;
      // Set expiry with some buffer (5 minutes before actual expiry)
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Twitch access token:', error);
      throw new Error('Failed to authenticate with Twitch API');
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<TwitchAPIResponse<T>> {
    const token = await this.getAccessToken();
    
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get top live streams
  async getTopStreams(count: number = 20, gameId?: string): Promise<TwitchStream[]> {
    const params: Record<string, any> = { first: count };
    if (gameId) params.game_id = gameId;

    const response = await this.makeRequest<TwitchStream>('/streams', params);
    return response.data;
  }

  // Search for live streams
  async searchStreams(query: string, count: number = 20): Promise<TwitchStream[]> {
    try {
      // First, try to find games matching the query
      const games = await this.searchGames(query, 5);
      let allStreams: TwitchStream[] = [];

      // Get streams for each matching game
      for (const game of games) {
        const gameStreams = await this.getTopStreams(10, game.id);
        allStreams = [...allStreams, ...gameStreams];
      }

      // Also search for channels directly
      const channels = await this.searchChannels(query, 10);
      for (const channel of channels) {
        try {
          const channelStreams = await this.makeRequest<TwitchStream>('/streams', {
            user_login: channel.broadcaster_login,
            first: 1
          });
          allStreams = [...allStreams, ...channelStreams.data];
        } catch (error) {
          // Channel might not be live, continue
        }
      }

      // Remove duplicates and limit results
      const uniqueStreams = allStreams
        .filter((stream, index, self) => 
          index === self.findIndex(s => s.id === stream.id)
        )
        .slice(0, count);

      return uniqueStreams;
    } catch (error) {
      console.error('Error searching streams:', error);
      return [];
    }
  }

  // Search for channels/users
  async searchChannels(query: string, count: number = 20): Promise<TwitchSearchChannel[]> {
    const response = await this.makeRequest<TwitchSearchChannel>('/search/channels', {
      query,
      first: count
    });
    return response.data;
  }

  // Search for games
  async searchGames(query: string, count: number = 20): Promise<TwitchGame[]> {
    const response = await this.makeRequest<TwitchGame>('/search/categories', {
      query,
      first: count
    });
    return response.data;
  }

  // Get top games
  async getTopGames(count: number = 20): Promise<TwitchGame[]> {
    const response = await this.makeRequest<TwitchGame>('/games/top', { first: count });
    return response.data;
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<TwitchUser | null> {
    try {
      const response = await this.makeRequest<TwitchUser>('/users', { login: username });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<TwitchUser | null> {
    try {
      const response = await this.makeRequest<TwitchUser>('/users', { id: userId });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get stream by username
  async getStreamByUsername(username: string): Promise<TwitchStream | null> {
    try {
      const response = await this.makeRequest<TwitchStream>('/streams', { user_login: username });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error getting stream:', error);
      return null;
    }
  }

  // Get game by ID
  async getGameById(gameId: string): Promise<TwitchGame | null> {
    try {
      const response = await this.makeRequest<TwitchGame>('/games', { id: gameId });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  }

  // Get videos for a user
  async getUserVideos(userId: string, count: number = 20): Promise<TwitchVideo[]> {
    try {
      const response = await this.makeRequest<TwitchVideo>('/videos', {
        user_id: userId,
        first: count,
        type: 'archive'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user videos:', error);
      return [];
    }
  }

  // Get clips for a broadcaster
  async getUserClips(broadcasterId: string, count: number = 20): Promise<TwitchClip[]> {
    try {
      const response = await this.makeRequest<TwitchClip>('/clips', {
        broadcaster_id: broadcasterId,
        first: count,
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        ended_at: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user clips:', error);
      return [];
    }
  }

  // Get clips for a game
  async getGameClips(gameId: string, count: number = 20): Promise<TwitchClip[]> {
    try {
      const response = await this.makeRequest<TwitchClip>('/clips', {
        game_id: gameId,
        first: count,
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        ended_at: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting game clips:', error);
      return [];
    }
  }

  // Get clip by ID
  async getClipById(clipId: string): Promise<TwitchClip | null> {
    try {
      const response = await this.makeRequest<TwitchClip>('/clips', { id: clipId });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error getting clip:', error);
      return null;
    }
  }

  // Get video by ID
  async getVideoById(videoId: string): Promise<TwitchVideo | null> {
    try {
      const response = await this.makeRequest<TwitchVideo>('/videos', { id: videoId });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error getting video:', error);
      return null;
    }
  }

  // Get streams for a specific game
  async getStreamsForGame(gameId: string, count: number = 20): Promise<TwitchStream[]> {
    try {
      const response = await this.makeRequest<TwitchStream>('/streams', {
        game_id: gameId,
        first: count
      });
      return response.data;
    } catch (error) {
      console.error('Error getting streams for game:', error);
      return [];
    }
  }

  // Get follower count for a user (Note: This requires user access token in real scenarios)
  async getFollowerCount(userId: string): Promise<number> {
    try {
      // Note: The followers endpoint requires user authentication
      // For now, we'll return undefined to indicate it's not available
      // In a real app, you'd need user OAuth for this
      return 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  }
}

// Export a singleton instance
export const twitchAPI = new TwitchAPIService();
