export interface FolderRow {
  id: number;
  name: string;
  color: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagRow {
  id: number;
  label: string;
  color: string;
}

export interface TagLink {
  documentId: number;
  tagId: number;
}

export interface VersionRow {
  id: number;
  documentId: number;
  label: string | null;
  content: string;
  authorUuid: string | null;
  words: number;
  createdAt: Date;
}

export interface INoteOrganizationRepository {
  findFoldersByUser(uuid: string): Promise<FolderRow[]>;
  findFolderById(id: number): Promise<FolderRow | null>;
  createFolder(data: {
    uuid: string;
    name: string;
    color: string;
    parentId: number | null;
  }): Promise<{ insertId: number }>;
  /** Owner-scoped. Returns the number of rows the query actually matched. */
  updateFolder(
    id: number,
    ownerUuid: string,
    data: { name?: string; color?: string; parentId?: number | null },
  ): Promise<number>;
  deleteFolder(id: number, ownerUuid: string): Promise<number>;

  findTagsByUser(uuid: string): Promise<TagRow[]>;
  createTag(data: {
    uuid: string;
    label: string;
    color: string;
  }): Promise<{ insertId: number }>;
  updateTag(
    id: number,
    ownerUuid: string,
    data: { label?: string; color?: string },
  ): Promise<number>;
  deleteTag(id: number, ownerUuid: string): Promise<number>;

  findTagIdsByDocumentIds(ids: number[]): Promise<TagLink[]>;
  findTagLink(documentId: number, tagId: number): Promise<TagLink | null>;
  addTagLink(documentId: number, tagId: number): Promise<void>;
  removeTagLink(documentId: number, tagId: number): Promise<void>;

  findVersionsByDocument(documentId: number): Promise<VersionRow[]>;
  findVersionById(id: number): Promise<VersionRow | null>;
  createVersion(data: {
    documentId: number;
    label: string | null;
    content: string;
    authorUuid: string | null;
    words: number;
  }): Promise<{ insertId: number }>;
}
