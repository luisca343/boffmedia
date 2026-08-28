import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import pino from 'pino';

const logger = pino({ name: 'base-data' });

@Injectable()
export class BaseDataService {
  constructor() {}

  /**
   * List a directory, treating "does not exist" as "contributes nothing".
   *
   * The custom overlay only carries the folders it actually overrides - it has
   * no `spawning/curry/`, for instance - so a hard readdir would abort the whole
   * load for a folder the overlay simply has no opinion about.
   */
  private async readdirIfPresent(dir: string): Promise<string[]> {
    try {
      return await fsPromises.readdir(dir);
    } catch (error: any) {
      if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return [];
      throw error;
    }
  }

  protected async readJsonFiles(
    defaultDir: string,
    publicDir: string,
  ): Promise<any[]> {
    const defaultFiles = await this.readdirIfPresent(defaultDir);
    const publicFiles = await this.readdirIfPresent(publicDir);
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
      logger.error({ err: error }, `Error reading JSON file at ${filePath}`);
      throw error;
    }
  }
}
