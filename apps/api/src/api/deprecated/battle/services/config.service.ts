import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export interface BattleConfig {
  name?: string;
  description?: string;
  difficulty?: string;
  pokemon?: any[];
  rewards?: any[];
  [key: string]: any;
}

@Injectable()
export class ConfigService {
  private readonly configBasePath: string;

  constructor() {
    this.configBasePath = path.join(
      process.cwd(),
      'public/smartrotom/combates/entrenadores',
    );
  }

  async getBattleConfig(npcConfigName: string): Promise<BattleConfig> {
    if (!npcConfigName) {
      throw new Error('NPC config name is required');
    }

    // Sanitize the config name to prevent directory traversal
    const sanitizedName = this.sanitizeConfigName(npcConfigName);
    const configPath = path.join(
      this.configBasePath,
      sanitizedName,
      'config.json',
    );

    try {
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        throw new Error(`Config not found for NPC: ${npcConfigName}`);
      }

      // Read and parse the config file
      const configContent = await fsPromises.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);

      // Validate basic structure
      this.validateConfig(config);

      return config;
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON in config file for NPC: ${npcConfigName}`,
        );
      }
      throw error;
    }
  }

  async getAllAvailableConfigs(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.configBasePath)) {
        return [];
      }

      const directories = await fsPromises.readdir(this.configBasePath, {
        withFileTypes: true,
      });
      const configNames: string[] = [];

      for (const dir of directories) {
        if (dir.isDirectory()) {
          const configPath = path.join(
            this.configBasePath,
            dir.name,
            'config.json',
          );
          if (fs.existsSync(configPath)) {
            configNames.push(dir.name);
          }
        }
      }

      return configNames.sort();
    } catch (error: any) {
      console.error('Error reading config directories:', error);
      return [];
    }
  }

  async validateConfigExists(npcConfigName: string): Promise<boolean> {
    try {
      await this.getBattleConfig(npcConfigName);
      return true;
    } catch {
      return false;
    }
  }

  async createConfig(
    npcConfigName: string,
    config: BattleConfig,
  ): Promise<void> {
    const sanitizedName = this.sanitizeConfigName(npcConfigName);
    const configDir = path.join(this.configBasePath, sanitizedName);
    const configPath = path.join(configDir, 'config.json');

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(configDir)) {
        await fsPromises.mkdir(configDir, { recursive: true });
      }

      // Validate config before saving
      this.validateConfig(config);

      // Write config file
      await fsPromises.writeFile(
        configPath,
        JSON.stringify(config, null, 2),
        'utf8',
      );
    } catch (error: any) {
      throw new Error(
        `Failed to create config for NPC: ${npcConfigName}. ${error.message}`,
      );
    }
  }

  async updateConfig(
    npcConfigName: string,
    config: Partial<BattleConfig>,
  ): Promise<BattleConfig> {
    // Get existing config
    const existingConfig = await this.getBattleConfig(npcConfigName);

    // Merge with updates
    const updatedConfig = { ...existingConfig, ...config };

    // Save updated config
    await this.createConfig(npcConfigName, updatedConfig);

    return updatedConfig;
  }

  async deleteConfig(npcConfigName: string): Promise<void> {
    const sanitizedName = this.sanitizeConfigName(npcConfigName);
    const configDir = path.join(this.configBasePath, sanitizedName);

    try {
      if (fs.existsSync(configDir)) {
        await fsPromises.rm(configDir, { recursive: true, force: true });
      }
    } catch (error: any) {
      throw new Error(
        `Failed to delete config for NPC: ${npcConfigName}. ${error.message}`,
      );
    }
  }

  private sanitizeConfigName(name: string): string {
    // Remove any path traversal attempts and invalid characters
    return name.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  }

  private validateConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Config must be a valid object');
    }

    // Add any specific validation rules here
    // For example:
    // if (config.pokemon && !Array.isArray(config.pokemon)) {
    //   throw new Error('Pokemon field must be an array');
    // }
  }
}
