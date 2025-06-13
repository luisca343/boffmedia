// ==================== BASE TYPES ====================
export interface BaseChat {
  id: number;
  type: number;
  name: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseChatUser {
  chatId: number;
  uuid: string;
}

export interface BaseChatMessage {
  id: number;
  chatId: number;
  senderUUID: string;
  content: string;
  type: string;
  createdAt: Date;
}

export interface BaseChatMessageRead {
  messageId: number;
  uuid: string;
}

export interface BaseUserProfile {
  uuid: string;
  username: string;
}

// ==================== REQUEST TYPES ====================
export interface CreateChatRequest {
  player: string;
  users: string[];
  name: string;
}

export interface GetChatsRequest {
  uuid: string;
}

export interface GetChatByIdRequest {
  chatId: number;
  requestingUserUuid: string;
}

export interface CreateChatMessageRequest {
  uuid: string;
  message: string;
  type?: string;
}

export interface UpdateChatMessageRequest {
  messageId: number;
  content: string;
  senderUuid: string;
}

export interface DeleteChatMessageRequest {
  messageId: number;
  senderUuid: string;
}

export interface MarkMessageAsReadRequest {
  messageId: number;
  uuid: string;
}

export interface AddMemberToGroupRequest {
  groupId: number;
  uuid: string;
  requestingUserUuid: string;
}

export interface RemoveMemberFromGroupRequest {
  groupId: number;
  uuid: string;
  requestingUserUuid: string;
}

export interface InitiateCallRequest {
  chatId: number;
  callerUuid: string;
}

export interface EndCallRequest {
  chatId: number;
  startTime: number;
}

export interface UpdateChatRequest {
  chatId: number;
  name?: string;
  description?: string;
  image?: string;
}

// ==================== RESPONSE TYPES ====================
export interface ChatResponse extends BaseChat {}

export interface CreateChatResponse {
  chatId: number;
}

export interface GroupResponse {
  id: number;
  name: string;
  type: number;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessageSummary[];
  unread: number;
  members: ChatMemberResponse[];
}

export interface ChatMessageResponse {
  id: number;
  text: string;
  date: Date;
  uuid: string;
}

export interface CreateChatMessageResponse extends ChatMessageResponse {}

export interface UpdateChatMessageResponse extends ChatMessageResponse {}

export interface DeleteChatMessageResponse {
  success: boolean;
  message: string;
}

export interface MarkMessageAsReadResponse {
  success: boolean;
  message: string;
}

export interface AddMemberToGroupResponse {
  success: boolean;
  message: string;
}

export interface RemoveMemberFromGroupResponse {
  success: boolean;
  message: string;
}

export interface CallSessionResponse {
  chatId: number;
  caller: string;
  users: CallUserResponse[];
}

export interface EndCallResponse extends ChatMessageResponse {}

export interface GetChatsResponse {
  groups: GroupResponse[];
}

export interface GetMessagesResponse {
  messages: ChatMessageResponse[];
}

// ==================== INTERNAL TYPES ====================
export interface ChatDetails {
  id: number;
  name: string;
  type: number;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  content: string;
  createdAt: Date;
  uuid: string;
  type: string;
}

export interface ChatMember {
  uuid: string;
}

export interface ChatMessageSummary {
  id: number;
  content: string;
  createdAt: Date;
}

export interface ChatMemberResponse {
  uuid: string;
}

export interface CallUser {
  uuid: string;
  status: 'RINGING' | 'IN_CALL' | 'DECLINED' | 'BUSY';
}

export interface CallUserResponse extends CallUser {}

export interface CallSession {
  chatId: number;
  caller: string;
  users: CallUser[];
}

export interface CreateMessageResult {
  messageId: number;
  message: ChatMessageResponse;
}

export interface EndCallResult {
  messageId: number;
  duration: number;
}

export interface ChatCreationData {
  type: number;
  name: string;
  description: string;
  image?: string;
}

export interface MessageCreationData {
  chatId: number;
  content: string;
  senderUUID: string;
  type: string;
}

// ==================== TYPE ALIASES ====================
export type Group = GroupResponse;
export type RotomMessage = ChatMessageResponse;

// ==================== DTO TYPES ====================
export interface CreateChatDto {
  player: string;
  users: string[];
  name: string;
}

export interface CreateChatMessageDto {
  uuid: string;
  message: string;
}

export interface UpdateChatMessageDto {
  content: string;
  uuid: string;
}

export interface UuidDto {
  uuid: string;
}

export interface ShareReplayDto {
  targetUuid: string;
  sourceUuid?: string;
}

// ==================== SOCKET EVENT TYPES ====================
export interface SocketChatMessageEvent {
  chatId: number;
  id: number;
  content: string;
  createdAt: Date;
  uuid: string;
}

export interface SocketCallEvent extends CallSession {}