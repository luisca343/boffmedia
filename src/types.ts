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

export interface UserBase {
  iat: number;
  exp: number;
  jti: string;
}

export interface User extends UserBase {
  email: string;
  username: string;
  smartRotomUser: SmartRotomUser;
  roles: string[];
}

export type BoffSession = {
  user: User;
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
