export type NoteBase = {
    id: number;
    title: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

export type Note = NoteBase & {
    content: string;
}

export type RotomNews = {
    id: number;
    title: string;
    subtitle: string;
    category: string;
    subcategory: string;
    published: number;
    featured: number;
    content: string;
    buttonText: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
}