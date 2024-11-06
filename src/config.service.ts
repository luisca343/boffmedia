import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import axios from 'axios';

@Injectable()
export class ConfigService extends NestConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor() {
    super();
    this.maxTokens = 5; // Maximum number of tokens (downloads per second)
    this.refillRate = 1000; // Refill rate in milliseconds (1 token per second)
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  get publicPath(): string {
    return path.join(process.cwd(), 'public');
  }

  getDataFilePath(subdir: string, filename: string): string {
    return path.join(this.publicPath, 'data', subdir, filename);
  }

  async writeDataFile(subdir: string, filename: string, data: any): Promise<void> {
    const filePath = this.getDataFilePath(subdir, filename);
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to write file ${filename} in ${subdir}: ${error.message}`);
    }
  }

  async readDataFile(subdir: string, filename: string): Promise<any> {
    const filePath = this.getDataFilePath(subdir, filename);
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to read file ${filename} in ${subdir}: ${error.message}`);
    }
  }

  private async waitForToken(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + timeSinceLastRefill * (this.maxTokens / this.refillRate));
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) * (this.refillRate / this.maxTokens);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForToken();
    }

    this.tokens -= 1;
  }

  async saveImageFromUrl(imageUrl: string, subPath: string): Promise<string> {
    await this.waitForToken();

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      const imageDir = path.join(this.publicPath, path.dirname(subPath));
      await fs.mkdir(imageDir, { recursive: true });

      const filePath = path.join(this.publicPath, subPath);
      await fs.writeFile(filePath, buffer);

      this.logger.log(`Image saved: ${subPath}`);
      return `/${subPath}`;
    } catch (error) {
      this.logger.error(`Failed to save image from URL ${imageUrl}: ${error.message}`);
      throw new Error(`Failed to save image from URL ${imageUrl}: ${error.message}`);
    }
  }

  async imageExists(subPath: string): Promise<boolean> {
    const filePath = path.join(this.publicPath, subPath);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}