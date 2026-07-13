import type { Screenshot } from "@/stores/cameraGalleryStore";

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface LookingAt extends Position {
    block?: string;
}

export interface ImageLocation {
    playerPosition: Position;
    lookingAt: LookingAt;
}

export interface ImageEntity {
    distance: number;
    coverage: number;
    position: Position;
}

export interface NPCEntity extends ImageEntity {
    type: 'npc';
    name: string;
}

export interface PokemonEntity extends ImageEntity {
    type: 'pokemon';
    species: string;
    dex: number;
    form: string;
    palette: string;
}

export interface ImageMessageData {
    imageUrl: string;
    meta: {
        id: string;
        timestamp: number;
        location?: ImageLocation;
        entities?: (NPCEntity | PokemonEntity)[];
        caption?: string;
    };
}

export interface VideoMessageData {
    videoId: string;
    url: string;
    title?: string;
}

export interface DocumentMessageData {
    documentId: number;
    title: string;
    content?: string;
}

export interface WaypointMessageData {
    name: string;
    x: number;
    y: number;
    z: number;
    dimension?: string;
    color?: string;
}

export interface CallMessageData {
    duration: number;
    participants?: string[];
}

export type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
    type: string;
}

// TODO(P9): shadows shared `Chat`/`ChatMessage` (this file predates Phase 5's `_types/view.ts`
// `ChatVM`/`ChatMessageVM`, which is the type actually wired to the UI); `members: string[]`
// has already drifted from the entity's `ChatMember[]`, but nothing reads `.members` off this
// type today (only `.id`/`.messages`/`.unread` are touched, via `useGetChats.ts`'s `any`-typed
// state) — aligning it would mean re-deriving `Message` (a socket payload with `chatId`, which
// has no generated counterpart) against `ChatMessage` too. Left unlinked rather than mechanically
// forced.
export type ChatData = {
    id: number;
    name: string;
    type: number;
    description: string;
    image: string;
    updatedAt: string;
    messages: Message[];
    unread: number;
    members: string[];
}