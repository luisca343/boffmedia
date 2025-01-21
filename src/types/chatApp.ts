export type Group = {
    id: number;
    name: string;
    type: number;
    description: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
    messages: {
        id: number;
        content: string;
        createdAt: string;
    }[];
    unread: number;
    members: {
        uuid: string;
    }[];
};

export type RotomMessage = {
    id: number;
    text: string;
    date: Date;
    uuid: string;
}