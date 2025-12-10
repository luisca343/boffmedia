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

export type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
    type: string;
}

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