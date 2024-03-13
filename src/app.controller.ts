import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDBPort(): number {
    return this.appService.getDBPort();
  }

  @Post("jcef/:sha")
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('sha') sha: string) {
    await mkdir(`public/jcef/${sha}`, { recursive: true });
    const writeStream = createWriteStream(`public/jcef/${sha}/${file.originalname}`);
    writeStream.write(file.buffer);
    return this.appService.uploadFile(file);
  }
}
