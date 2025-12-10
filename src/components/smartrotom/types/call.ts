export enum UserStatus {
    RINGING = "RINGING",
    IN_CALL = "IN_CALL",
    IDLE = "IDLE",
  }
  
  export interface UserData {
    uuid: string
    status: UserStatus
    username: string
  }
  
  export interface CallData {
    users: UserData[]
    caller: string
    chatId: string
  }
  
  