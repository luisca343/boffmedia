type Group = {
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
        createdAt: Date;
    }[];
    unread: number;
    members: {
        uuid: string;
    }[];
};

type RotomMessage = {
    id: number;
    text: string;
    date: Date;
    uuid: string;
}