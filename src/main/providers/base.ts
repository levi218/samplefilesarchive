import fs from 'fs/promises';

export interface FileDef {
  id: string;
  name: string;
  url?: string;
  provider?: string;
}

export interface FileInfo {
  size: number;
  name: string;
}

export abstract class FileProvider {
  abstract listFile(): Promise<FileDef[]>;

  abstract getFile(file: FileDef): Promise<string>;

  async getFileInfo(file: FileDef): Promise<FileInfo> {
    return this.getFile(file).then(async (filePath) => {
      const stats = await fs.stat(filePath);
      return {
        name: file.name,
        size: stats.size,
      };
    });
  }
}

export interface FileProviderProps {
  type: 'github' | 'local';
  sourceName: string;
  userName?: string;
  repoName?: string;
  basePath?: string;
}
