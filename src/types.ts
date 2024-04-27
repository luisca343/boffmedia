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
  
  export interface BoffSession {
    user: User;
    expires: string; // ISO date string format
  }