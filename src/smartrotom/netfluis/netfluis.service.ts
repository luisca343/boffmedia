import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import { promises as fsPromises } from 'fs';

@Injectable()
export class NetfluisService {
    constructor(
        private db: MySQL2Service,
    ) {}

    async test(){
        const dir = path.join(__dirname, '../../../', 'public/netfluis/series/');
        const files = await this.readFolder(dir);
        return files;
    }

    async readFolder(dir: string){
        const files = await fsPromises.readdir(dir);
        const fileList = {}
        await files.forEach(async file => {
            const filePath = path.join(dir, file);
            const stats = await fsPromises.stat(filePath);
            if(stats.isFile()){
                fileList[file] = filePath;
            } else {
                fileList[file] = await this.readFolder(filePath);
            }
        });

        return fileList;
    }

   
}
