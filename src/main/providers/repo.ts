import { FileDef, FileProvider, FileProviderProps } from './base';
import GithubFileProvider from './github';
import LocalFileProvider from './local';
import store from '../store';

function getProviders(): { name: string; provider: FileProvider }[] {
  const fileProviders = store.get('fileProviders', []) as FileProviderProps[];
  const providers: { name: string; provider: FileProvider }[] = [];
  fileProviders.forEach((provider: any) => {
    if (provider.type === 'github') {
      providers.push({
        name: provider.type,
        provider: new GithubFileProvider(provider.userName, provider.repoName),
      });
    } else if (provider.type === 'local') {
      providers.push({
        name: provider.type,
        provider: new LocalFileProvider(provider.basePath),
      });
    }
  });
  return providers;
}

export async function getAllFiles() {
  const result = await Promise.allSettled(
    getProviders().map(async (provider) => {
      const files = await provider.provider.listFile();
      return files.map((file: FileDef) => ({
        ...file,
        provider: provider.name,
      }));
    }),
  );
  return result
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r1) => r1.value);
}

export function getFile(file: FileDef) {
  const provider = getProviders().find((p) => p.name === file.provider);
  if (!provider) {
    throw new Error(`Provider not found: ${file.provider}`);
  }

  return provider.provider.getFile(file);
}

export function getFileInfo(file: FileDef) {
  const provider = getProviders().find((p) => p.name === file.provider);
  if (!provider) {
    throw new Error(`Provider not found: ${file.provider}`);
  }

  return provider.provider.getFileInfo(file);
}
