
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable } from '@nestjs/common';
import *  as  path from 'path';
import { promises as fsPromises } from 'fs';

@Injectable()
export class NetfluisService {
    constructor(
        @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
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
