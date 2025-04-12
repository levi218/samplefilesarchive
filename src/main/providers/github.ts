import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import store from '../store';
import { FileDef, FileProvider } from './base';

export default class GitHubFileProvider extends FileProvider {
  private userName: string;

  private repoName: string;

  constructor(userName: string, repoName: string) {
    super();
    this.userName = userName;
    this.repoName = repoName;
  }

  async listFile(): Promise<FileDef[]> {
    const response = await fetch(
      `https://api.github.com/repos/${this.userName}/${this.repoName}/contents`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'samplefilesarchive',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }
    // Sample response
    // [
    //     {
    //     "name": "LICENSE",
    //     "path": "LICENSE",
    //     "sha": "c832fbda1380c1b95af939a13255ee8abcc9e28c",
    //     "size": 1073,
    //     "url": "https://api.github.com/repos/levi218/sample-files/contents/LICENSE?ref=main",
    //     "html_url": "https://github.com/levi218/sample-files/blob/main/LICENSE",
    //     "git_url": "https://api.github.com/repos/levi218/sample-files/git/blobs/c832fbda1380c1b95af939a13255ee8abcc9e28c",
    //     "download_url": "https://raw.githubusercontent.com/levi218/sample-files/main/LICENSE",
    //     "type": "file",
    //     "_links": {
    //     "self": "https://api.github.com/repos/levi218/sample-files/contents/LICENSE?ref=main",
    //     "git": "https://api.github.com/repos/levi218/sample-files/git/blobs/c832fbda1380c1b95af939a13255ee8abcc9e28c",
    //     "html": "https://github.com/levi218/sample-files/blob/main/LICENSE"
    //     }
    //     },
    // ]
    const data = await response.json().then((files): FileDef[] => {
      return files
        .filter((file: { type: string }) => file.type === 'file')
        .map((file: any) => ({
          id: file.sha,
          name: file.name,
          url: file.download_url,
        }));
    });
    const cacheKey = `github_${this.userName}_${this.repoName}_files`;
    const cache = store.get(cacheKey) as
      | { timestamp: number; data: any }
      | undefined;

    if (cache && Date.now() - cache.timestamp < 24 * 60 * 60 * 1000) {
      return cache.data;
    }

    store.set(cacheKey, { timestamp: Date.now(), data });
    return data;
  }

  async getFile(file: FileDef): Promise<string> {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(
      userDataPath,
      'github',
      this.userName,
      this.repoName,
      file.id,
      file.name,
    );

    try {
      // Check if the file already exists locally
      await fs.access(filePath);
      return filePath;
    } catch {
      // File does not exist, proceed to download
      if (!file.url) {
        throw new Error(`File URL not found: ${file.name}`);
      }
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const fileData = Buffer.from(await response.arrayBuffer());

      // Ensure the directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write the file to the local path
      await fs.writeFile(filePath, fileData);

      return filePath;
    }
  }
}
