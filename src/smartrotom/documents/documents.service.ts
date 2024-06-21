import { rotomDocuments, rotomDocumentsUsers } from '@/_db/schema/SmartRotomDocuments';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class DocumentsService {
    constructor(
        private db: MySQL2Service,
    ) {}

    async getNews(){
        return await this.db.getDrizzle().select().from(rotomDocuments).where(eq(rotomDocuments.type, 1)).orderBy(desc(rotomDocuments.updatedAt))
    }

    async getNotes(uuid: string) {
        return (await this.db.getDrizzle().select({id: rotomDocuments.id, title: rotomDocuments.title, type: rotomDocuments.type, public: rotomDocuments.public, createdAt: rotomDocuments.createdAt, updatedAt: rotomDocuments.updatedAt}).from(rotomDocuments)
            .innerJoin(rotomDocumentsUsers, eq(rotomDocuments.id, rotomDocumentsUsers.documentId))
            .where(eq(rotomDocumentsUsers.uuid, uuid))
            .orderBy(desc(rotomDocuments.updatedAt))
        
        )
    }

    async getDocument(id: number) {
        return (await this.db.getDrizzle().select().from(rotomDocuments).where(eq(rotomDocuments.id, id)))[0]
    }

    async saveNote(id: number, title: string, content: string, documentType: number) {
        const exists = await this.db.getDrizzle().select().from(rotomDocuments).where(eq(rotomDocuments.id, id));
        
        let result
        if(exists.length === 0 || id === 0) {
            result = await this.db.getDrizzle().insert(rotomDocuments)
            .values({
                    title, type: documentType, public:0, content, id: id, createdAt: new Date(), updatedAt: new Date()
                })
            .execute();
        } else {
            result = await this.db.getDrizzle().update(rotomDocuments)
            .set({title, content, type: documentType, updatedAt: new Date()})
            .where(eq(rotomDocuments.id, id))
            .execute();
        }

        return {success: true, id: result[0].insertId}
    }

    async addNoteToUser(documentId: number, uuid: string) {
        const exists = await this.db.getDrizzle().select().from(rotomDocumentsUsers)
        .where(and(eq(rotomDocumentsUsers.documentId, documentId),eq(rotomDocumentsUsers.uuid, uuid)))

        if(exists.length === 0) {
            await this.db.getDrizzle().insert(rotomDocumentsUsers).values({documentId, uuid}).execute();
        }
    }
}
