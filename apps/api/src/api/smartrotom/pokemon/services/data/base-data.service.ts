import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

@Injectable()
export class BaseDataService {
  protected async readJsonFiles(
    defaultDir: string,
    publicDir: string,
  ): Promise<any[]> {
    const defaultFiles = await fsPromises.readdir(defaultDir);
    const publicFiles = await fsPromises.readdir(publicDir);
    const allFiles = [...new Set([...defaultFiles, ...publicFiles])];

    const jsonData = await Promise.all(
      allFiles.map(async (file) => {
        if (!file.endsWith('.json')) return null;
        const filePath = path.join(publicDir, file);
        const defaultFilePath = path.join(defaultDir, file);
        const data = JSON.parse(
          await fsPromises.readFile(
            fs.existsSync(filePath) ? filePath : defaultFilePath,
            'utf8',
          ),
        );
        return data;
      }),
    );

    return jsonData.filter(Boolean);
  }

  protected async readJsonFile(filePath: string): Promise<any> {
    try {
      const data = await fsPromises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      console.error(`Error reading JSON file at ${filePath}:`, error);
      throw error;
    }
  }
}
