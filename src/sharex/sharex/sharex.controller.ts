import { randomString } from '@/_utils/stringUtils';
import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import *  as  path from 'path';
import { SharexService } from './sharex.service';

@Controller('sharex')
export class SharexController {
    constructor(private readonly sharexService: SharexService) {}
    @Get()
    get() {
        return 'ShareX';
    }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    post(@UploadedFile() file: Express.Multer.File, @Body() body) {
        // Write the file to disk

        const fileName = file.originalname

        const app = fileName.split(".")[0].slice(0, -11);
        const extension = fileName.split('.').pop();
        const newName = randomString(10)

        const key = body.key;

        this.sharexService.createImage(app, newName, extension, key);

        
        const dir = path.join(__dirname, '../../../../', 'public/smartrotom/img/sharex');
        const filePath = path.join(dir, newName + '.' + extension);
        fs.writeFileSync(filePath, file.buffer);

        return { file: {
            url: 'http://localhost:3000/smartrotom/img/sharex/' + newName + '.' + extension,
            name: newName + '.' + extension,
            size: file.size,
            type: file.mimetype
        }}
    }

}
