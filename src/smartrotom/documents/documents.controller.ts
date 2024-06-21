import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('smartrotom/documents')
export class DocumentsController {
    constructor(
        private documentsService: DocumentsService,
    ) {}
    @Get('news')
    async getNews(){
        return await this.documentsService.getNews()
    }

    @Get("all/:uuid")
    async getNotes(@Param('uuid') uuid: string) {
        console.log(await this.documentsService.getNotes(uuid))
        return await this.documentsService.getNotes(uuid)
    }

    @Post("create")
    async createNote(@Body() body: {title: string, content: string, type: number, userUuid: string}) {
        const noteInsert = await this.documentsService.saveNote(0, body.title, body.content, body.type)
        const addNoteToUser = await this.documentsService.addNoteToUser(noteInsert.id, body.userUuid)
        return {id: noteInsert.id, success: true}
    }

    @Post("save/:id")
    async saveNote(@Param('id') id: number, @Body() body: {content: string, title: string, documentType: number}){
        return await this.documentsService.saveNote(id, body.title, body.content, body.documentType)
    }

    @Get(":id")
    async getDocument(@Param('id') id: number){
        return await this.documentsService.getDocument(id)
    }
}
