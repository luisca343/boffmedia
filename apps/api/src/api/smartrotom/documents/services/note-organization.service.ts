import { Injectable, Inject } from '@nestjs/common';
import { NOTE_ORGANIZATION_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';
import {
  INoteOrganizationRepository,
  FolderRow,
  TagRow,
  TagLink,
  VersionRow,
} from '../repositories/interfaces/note-organization.repository.interface';

const DEFAULT_COLOR = 'primary';

export interface CreateFolderRequest {
  uuid: string;
  name: string;
  color?: string;
  parentId?: number | null;
}

export interface CreateTagRequest {
  uuid: string;
  label: string;
  color?: string;
}

export interface CreateVersionRequest {
  documentId: number;
  content: string;
  label?: string | null;
  authorUuid?: string | null;
}

@Injectable()
export class NoteOrganizationService {
  constructor(
    @Inject(NOTE_ORGANIZATION_REPOSITORY_TOKEN)
    private readonly repo: INoteOrganizationRepository,
  ) {}

  // ==================== FOLDERS ====================
  getFolders(uuid: string): Promise<FolderRow[]> {
    if (!uuid) throw new Error('UUID is required');
    return this.repo.findFoldersByUser(uuid);
  }

  async createFolder(req: CreateFolderRequest): Promise<FolderRow> {
    if (!req.uuid) throw new Error('UUID is required');
    if (!req.name?.trim()) throw new Error('Folder name is required');
    const { insertId } = await this.repo.createFolder({
      uuid: req.uuid,
      name: req.name.trim(),
      color: req.color || DEFAULT_COLOR,
      parentId: req.parentId ?? null,
    });
    const folder = await this.repo.findFolderById(insertId);
    if (!folder) throw new Error('Failed to create folder');
    return folder;
  }

  async updateFolder(
    id: number,
    data: { name?: string; color?: string; parentId?: number | null },
  ): Promise<FolderRow> {
    if (id === data.parentId) {
      throw new Error('A folder cannot be its own parent');
    }
    const existing = await this.repo.findFolderById(id);
    if (!existing) throw new Error('Folder not found');
    await this.repo.updateFolder(id, {
      ...data,
      name: data.name?.trim(),
    });
    const folder = await this.repo.findFolderById(id);
    if (!folder) throw new Error('Folder not found');
    return folder;
  }

  async deleteFolder(id: number): Promise<{ success: boolean }> {
    await this.repo.deleteFolder(id);
    return { success: true };
  }

  // ==================== TAGS ====================
  getTags(uuid: string): Promise<TagRow[]> {
    if (!uuid) throw new Error('UUID is required');
    return this.repo.findTagsByUser(uuid);
  }

  async createTag(req: CreateTagRequest): Promise<TagRow> {
    if (!req.uuid) throw new Error('UUID is required');
    if (!req.label?.trim()) throw new Error('Tag label is required');
    const { insertId } = await this.repo.createTag({
      uuid: req.uuid,
      label: req.label.trim(),
      color: req.color || DEFAULT_COLOR,
    });
    return { id: insertId, label: req.label.trim(), color: req.color || DEFAULT_COLOR };
  }

  async updateTag(
    id: number,
    data: { label?: string; color?: string },
  ): Promise<{ success: boolean }> {
    await this.repo.updateTag(id, { ...data, label: data.label?.trim() });
    return { success: true };
  }

  async deleteTag(id: number): Promise<{ success: boolean }> {
    await this.repo.deleteTag(id);
    return { success: true };
  }

  // ==================== TAG LINKS ====================
  async toggleTag(
    documentId: number,
    tagId: number,
  ): Promise<{ success: boolean; applied: boolean }> {
    const existing = await this.repo.findTagLink(documentId, tagId);
    if (existing) {
      await this.repo.removeTagLink(documentId, tagId);
      return { success: true, applied: false };
    }
    await this.repo.addTagLink(documentId, tagId);
    return { success: true, applied: true };
  }

  getTagLinksForDocuments(ids: number[]): Promise<TagLink[]> {
    return this.repo.findTagIdsByDocumentIds(ids);
  }

  // ==================== VERSIONS ====================
  getVersions(documentId: number): Promise<VersionRow[]> {
    if (!documentId || documentId <= 0) {
      throw new Error('Valid document ID is required');
    }
    return this.repo.findVersionsByDocument(documentId);
  }

  getVersion(id: number): Promise<VersionRow | null> {
    return this.repo.findVersionById(id);
  }

  async createVersion(req: CreateVersionRequest): Promise<VersionRow> {
    if (!req.documentId || req.documentId <= 0) {
      throw new Error('Valid document ID is required');
    }
    const { insertId } = await this.repo.createVersion({
      documentId: req.documentId,
      label: req.label ?? null,
      content: req.content,
      authorUuid: req.authorUuid ?? null,
      words: countWords(req.content),
    });
    const version = await this.repo.findVersionById(insertId);
    if (!version) throw new Error('Failed to create version');
    return version;
  }
}

// Strips HTML tags and counts whitespace-delimited words.
function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}
