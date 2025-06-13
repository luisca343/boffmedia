// ==================== BASE TYPES ====================
export interface BaseDocument {
  id: number;
  title: string;
  type: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseDocumentUser {
  uuid: string;
  documentId: number;
}

export interface BaseNews {
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

// ==================== REQUEST TYPES ====================
export interface GetDocumentRequest {
  id: number;
}

export interface GetUserNotesRequest {
  uuid: string;
}

export interface CreateDocumentRequest {
  title: string;
  content: string;
  type: number;
  public?: number;
}

export interface UpdateDocumentRequest {
  id: number;
  title?: string;
  content?: string;
  type?: number;
  public?: number;
}

export interface DeleteDocumentRequest {
  id: number;
}

export interface SaveDocumentRequest {
  id: number;
  title: string;
  content: string;
  type: number;
}

export interface CreateNoteWithUserRequest {
  title: string;
  content: string;
  type: number;
  uuid: string;
}

export interface AddNoteToUserRequest {
  documentId: number;
  uuid: string;
}

export interface RemoveNoteFromUserRequest {
  documentId: number;
  uuid: string;
}

export interface GetAllNewsRequest {
  published?: boolean;
}

export interface GetNewsRequest {
  newsId: number;
}

export interface CreateNewsRequest {
  title: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface UpdateNewsRequest {
  newsId: number;
  title?: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content?: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface DeleteNewsRequest {
  newsId: number;
}

export interface UpdateNewsStatusRequest {
  publishedIds: number[];
  featuredId: number;
}

export interface SaveNewsRequest {
  news: CreateNewsRequest;
  newsId: number;
}

// ==================== RESPONSE TYPES ====================
export interface DocumentResponse extends BaseDocument {
  public?: number;
}

export interface CreateDocumentResponse extends DocumentResponse {}

export interface UpdateDocumentResponse extends DocumentResponse {}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

export interface SaveDocumentResponse {
  success: boolean;
  id: number;
}

export interface NotePreviewResponse {
  id: number;
  title: string;
  type: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserNotesResponse {
  notes: NotePreviewResponse[];
}

export interface CreateNoteWithUserResponse {
  id: number;
  success: boolean;
}

export interface AddNoteToUserResponse {
  success: boolean;
}

export interface RemoveNoteFromUserResponse {
  success: boolean;
}

export interface NewsResponse extends BaseNews {}

export interface CreateNewsResponse extends NewsResponse {}

export interface UpdateNewsResponse extends NewsResponse {}

export interface DeleteNewsResponse {
  success: boolean;
  message: string;
}

export interface GetAllNewsResponse {
  featured: NewsResponse | null;
  news: NewsResponse[];
}

export interface GetPublishedNewsResponse {
  featured: NewsResponse | null;
  news: NewsResponse[];
}

export interface GetFeaturedNewsResponse extends NewsResponse {}

export interface UpdateNewsStatusResponse {
  success: boolean;
}

export interface SaveNewsResponse {
  success: boolean;
  id: number;
}

// ==================== INTERNAL TYPES ====================
export interface DocumentDetails {
  id: number;
  title: string;
  content: string;
  type: number;
  public: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotePreview {
  id: number;
  title: string;
  type: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsDetails {
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

export interface DocumentCreationData {
  title: string;
  content: string;
  type: number;
  public?: number;
}

export interface DocumentUpdateData {
  title?: string;
  content?: string;
  type?: number;
  public?: number;
}

export interface NewsCreationData {
  title: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface NewsUpdateData {
  title?: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content?: string;
  buttonText?: string;
  imageUrl?: string;
}

// ==================== TYPE ALIASES ====================
export type Note = NotePreviewResponse;
export type RotomNews = NewsResponse;
export type Document = DocumentResponse;

// ==================== DTO TYPES ====================
export interface CreateDocumentDto {
  title: string;
  content: string;
  type: number;
}

export interface CreateDocumentWithUuidDto extends CreateDocumentDto {
  uuid: string;
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  type?: number;
}

export interface CreateNewsDto {
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
}

export interface UpdateNewsDto {
  title?: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content?: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface NewsStatusDto {
  published: number[];
  featured: number;
}

// ==================== VALIDATION TYPES ====================
export interface DocumentValidationResult {
  exists: boolean;
  valid: boolean;
}

export interface NewsValidationResult {
  exists: boolean;
  valid: boolean;
}

export interface UserDocumentAccessResult {
  hasAccess: boolean;
  document?: DocumentDetails;
}