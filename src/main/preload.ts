// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
// import { getConfig } from '@testing-library/react';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { FileDef, FileInfo } from './providers/base';
// import store from './store';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  startDrag: (file: FileDef) => ipcRenderer.send('ondragstart', file),
  getConfig: (key: string) => {
    return ipcRenderer.invoke('getconfig', key);
  },
  setConfig: (key: string, value: unknown) =>
    ipcRenderer.send('setconfig', key, value),
  getAllFiles: (): Promise<FileDef> => ipcRenderer.invoke('getallfiles'),
  getFileInfo: (file: FileDef): Promise<FileInfo> =>
    ipcRenderer.invoke('getfileinfo', file),
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
