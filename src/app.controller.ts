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

  @Get("smartrotom/patata")
  async test2() {
    const result = [];
    for (let i = 1; i <= 75; i++) {
      const prazas = i;
      const prazas_a = Math.floor(Math.random() * (prazas * 0.05) + prazas * 0.7);
      const prazas_a_disc = prazas - prazas_a
      const prazas_deportista = 0;
      result.push(`INSERT INTO prazas_cupo_adultos (COD_ASISTENCIA, PRAZAS, PRAZAS_A, PRAZAS_A_DISC, PRAZAS_DEPORTISTA) VALUES (1, ${prazas}, ${prazas_a}, ${prazas_a_disc}, ${prazas_deportista})`)
      result.push(`INSERT INTO prazas_cupo_adultos (COD_ASISTENCIA, PRAZAS, PRAZAS_A, PRAZAS_A_DISC, PRAZAS_DEPORTISTA) VALUES (2, ${prazas}, ${prazas_a}, ${prazas_a_disc}, ${prazas_deportista})`)
    }
    return result
  }
  
  @Post("jcef/:sha")
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('sha') sha: string) {
    await mkdir(`public/jcef/${sha}`, { recursive: true });
    const writeStream = createWriteStream(`public/jcef/${sha}/${file.originalname}`);
    writeStream.write(file.buffer);
    return this.appService.uploadFile(file);
  }

  @Post("googlemaps")
  async googlemap(@Body() body: {url: string}) {
    const data = await axios.get(body.url);
    console.log(data.data);
    return data.data;
  }

  @Get("blogicons")
  async blogicons() {
    return await this.appService.blogicons();
  }

  @Post("netfluis")
  async netfluis(@Body() body: {url: string}) {
    console.log(body);
    return {url: ""};
  }

  @Get("steamkeys")
  async steamkeys() {
    return await this.appService.steamKeys();
  }

  @Get("steamdata/:steamID")
  async steamData(@Param("steamID") steamID: string) {
    return await this.appService.getSteamData(steamID);
  }
}
