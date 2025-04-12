import path from 'path';
import fs from 'fs/promises';
import { FileDef, FileProvider } from './base';

export default class LocalFileProvider extends FileProvider {
  private basePath: string;

  constructor(basePath: string) {
    super();
    this.basePath = basePath;
  }

  async listFile(): Promise<FileDef[]> {
    const walk = async (dir: string): Promise<FileDef[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            return walk(fullPath);
          }
          if (entry.isFile()) {
            return {
              id: fullPath.replace(this.basePath, ''),
              name: entry.name,
            };
          }
          return [];
        }),
      );
      return files.flat();
    };

    return walk(this.basePath);
  }

  async getFile(file: FileDef): Promise<string> {
    const filePath = path.join(this.basePath, file.id);

    try {
      // Check if the file exists locally
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }
  }
}
