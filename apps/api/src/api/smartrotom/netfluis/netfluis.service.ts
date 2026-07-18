import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

// Reads the netfluis series folder from disk — no database access.
@Injectable()
export class NetfluisService {
  async test() {
    const dir = path.join(__dirname, '../../../', 'public/netfluis/series/');
    const files = await this.readFolder(dir);
    return files;
  }

  async readFolder(dir: string) {
    const files = await fsPromises.readdir(dir);
    const fileList: Record<string, any> = {};
    await files.forEach(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fsPromises.stat(filePath);
      if (stats.isFile()) {
        fileList[file] = filePath;
      } else {
        fileList[file] = await this.readFolder(filePath);
      }
    });

    return fileList;
  }
}
