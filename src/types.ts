export type App = {
  id: number;
  name: string;
  url: string;
  icon: string;
};

export interface SmartRotomUser {
  username: string;
  uuid: string;
  world: null | string; // Assuming world can be either null or a string
}

export interface User {
  email: string;
  username: string;
  smartRotomUser: SmartRotomUser;
  iat: number;
  exp: number;
  jti: string;
}

export type BoffSession = {
  user: {
    username: string | null;
    email: string | null;
    smartRotomUser: {
      username: string;
      uuid: string;
    };
  };
};

export interface SmartRotomResponse {
  status: number;
  message?: string;
  error?: string;
  data?: string;
}

export interface SmartRotomPost {
  server: string;
  uuid: string;
}
