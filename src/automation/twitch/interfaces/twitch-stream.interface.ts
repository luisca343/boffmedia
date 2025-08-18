export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  tags: string[];
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchStreamsResponse {
  data: TwitchStream[];
  pagination?: {
    cursor?: string;
  };
}

export interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface TwitchGameResponse {
  data: Array<{
    id: string;
    name: string;
    box_art_url: string;
    igdb_id: string;
  }>;
}
