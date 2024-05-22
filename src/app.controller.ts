import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';

import axios from 'axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDBPort(): number {
    return this.appService.getDBPort();
  }

  @Get("togglelogging")
  toggleLogging() {
    return {logging: this.appService.toggleLogging()}
  }
  
  @Post("smartrotom/patata")
  async test(@Body() body: {uuid: string}) {
    try{
      const patata = await axios.post('http://148.251.3.244:34370/quests', body)
      console.log(patata.data)
      return patata.data
    } catch (e) {
      console.error(e)
    }

    return {error: "error"}
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
