import { randomString } from '@/_utils/stringUtils';
import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import *  as  path from 'path';
import { SharexService } from './sharex.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ShareX')
@Controller('sharex')
export class SharexController {
    constructor(private readonly sharexService: SharexService) {}
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async post(@UploadedFile() file: Express.Multer.File, @Body() body) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        if (!body.key) {
            throw new BadRequestException('Key is required');
        }

        const fileName = file.originalname;
        const app = fileName.split(".")[0].slice(0, -11);
        const extension = fileName.split('.').pop();
        
        let newName = randomString(10);
        const dir = path.join(process.cwd(), 'public/smartrotom/img/sharex');
        
        while(fs.existsSync(path.join(dir, newName + '.' + extension))) {
            newName = randomString(10);
        }

        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const filePath = path.join(dir, newName + '.' + extension);
            fs.writeFileSync(filePath, file.buffer);

            await this.sharexService.createImage(app, newName, extension, body.key);

            return { 
                file: {
                    url: `${process.env.PUBLIC_DIR}/smartrotom/img/sharex/${newName}.${extension}`,
                    name: newName + '.' + extension,
                    size: file.size,
                    type: file.mimetype
                }
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed to save file');
        }
    }

}
