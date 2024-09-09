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