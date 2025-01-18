type Note = {
    id: number;
    title: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

type RotomNews = {
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