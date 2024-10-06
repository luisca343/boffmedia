import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { RotomNews } from '@/_db/schema/SmartRotomDocuments';

@Controller('smartrotom/documents')
export class DocumentsController {
    constructor(
        private documentsService: DocumentsService,
    ) {}
    @Get('news')
    async getActiveNews(){
        return await this.documentsService.getNews()
    }    
    
    @Post('newsstatus')
    async updateNewsStatus(@Body() news: {published: number[], featured: number}){
        console.log(news)
        return await this.documentsService.updateNewsStatus(news.published, news.featured)
    }


    @Post('news/:newsId')
    async updateActiveNews(@Body() news: RotomNews, @Param('newsId') newsId: number){
        return await this.documentsService.saveNews(news, newsId)
    }


    @Get('news')
    async getNews(){
        return await this.documentsService.getNews()
    }

    @Get('news/:newsId')
    async getNewsById(@Param('newsId') newsId: number){
        return await this.documentsService.getNewsById(newsId)
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
