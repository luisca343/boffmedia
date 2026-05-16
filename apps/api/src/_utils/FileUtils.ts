import * as fs from 'fs';
import * as path from 'path';

/**
 * Utility functions for file operations
 */
export class FileUtils {
  /**
   * Read a file from the project root
   * @param fileName Path relative to project root
   * @param encoding File encoding (default: utf-8)
   * @returns File contents as string
   */
  static readFile(
    fileName: string,
    encoding: BufferEncoding = 'utf-8',
  ): string {
    const filePath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return fs.readFileSync(filePath, { encoding });
  }

  /**
   * Read a JSON file and parse its contents
   * @param fileName Path relative to project root
   * @returns Parsed JSON content
   */
  static readJsonFile<T = any>(fileName: string): T {
    const content = this.readFile(fileName);
    try {
      return JSON.parse(content) as T;
    } catch (error: any) {
      throw new Error(
        `Failed to parse JSON file ${fileName}: ${error.message}`,
      );
    }
  }

  /**
   * Write data to a file
   * @param fileName Path relative to project root
   * @param data Data to write
   * @param options File system write options
   */
  static writeFile(
    fileName: string,
    data: string,
    options?: fs.WriteFileOptions,
  ): void {
    const filePath = path.join(process.cwd(), fileName);
    const dirPath = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, data, options);
  }

  /**
   * Write an object as JSON to a file
   * @param fileName Path relative to project root
   * @param data Object to serialize to JSON
   * @param pretty Whether to format the JSON with indentation (default: true)
   */
  static writeJsonFile(
    fileName: string,
    data: any,
    pretty: boolean = true,
  ): void {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

    this.writeFile(fileName, json);
  }

  /**
   * Check if a file exists
   * @param fileName Path relative to project root
   * @returns true if the file exists
   */
  static fileExists(fileName: string): boolean {
    const filePath = path.join(process.cwd(), fileName);
    return fs.existsSync(filePath);
  }

  /**
   * Create a directory if it doesn't exist
   * @param dirPath Path relative to project root
   * @param recursive Create parent directories if they don't exist (default: true)
   */
  static ensureDirectory(dirPath: string, recursive: boolean = true): void {
    const fullPath = path.join(process.cwd(), dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive });
    }
  }

  /**
   * Delete a file if it exists
   * @param fileName Path relative to project root
   * @returns true if the file was deleted, false if it didn't exist
   */
  static deleteFile(fileName: string): boolean {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * Get list of files in a directory
   * @param dirPath Path relative to project root
   * @param options Options for listing (filter by extension, include directories, etc.)
   * @returns Array of file paths
   */
  static listFiles(
    dirPath: string,
    options: {
      extension?: string;
      includeDirs?: boolean;
      recursive?: boolean;
    } = {},
  ): string[] {
    const fullPath = path.join(process.cwd(), dirPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${fullPath}`);
    }

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    let result: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (options.includeDirs) {
          result.push(entryPath);
        }

        if (options.recursive) {
          const subEntries = this.listFiles(entryPath, options);
          result = result.concat(subEntries);
        }
      } else if (!options.extension || entry.name.endsWith(options.extension)) {
        result.push(entryPath);
      }
    }

    return result;
  }
}
