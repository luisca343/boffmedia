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
  updateFolder(
    id: number,
    data: { name?: string; color?: string; parentId?: number | null },
  ): Promise<void>;
  deleteFolder(id: number): Promise<void>;

  findTagsByUser(uuid: string): Promise<TagRow[]>;
  createTag(data: {
    uuid: string;
    label: string;
    color: string;
  }): Promise<{ insertId: number }>;
  updateTag(id: number, data: { label?: string; color?: string }): Promise<void>;
  deleteTag(id: number): Promise<void>;

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
