export type CreateNewsDto = {
  id: number;
  title: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published: number;
  featured: number;
  content: string;
  buttonText?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};
