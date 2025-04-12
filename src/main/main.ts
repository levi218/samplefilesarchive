/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  Menu,
  Tray,
  nativeImage,
  screen,
  dialog,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import store from './store';
import { getAllFiles, getFile, getFileInfo } from './providers/repo';
import { FileDef } from './providers/base';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const windows: Record<string, BrowserWindow | null> = {};
const createWindow = async (
  page?: string,
  winWidth?: number,
  winHeight?: number,
  winPos: string = 'top-right',
) => {
  // if (isDebug) {
  //   await installExtensions();
  // }

  if (windows[page || '/']) {
    console.log(`Windows with path ${page} already openned`, windows);
    return;
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  const newWindow = new BrowserWindow({
    width: winWidth || 350,
    height: winHeight || 300,
    x:
      winPos === 'center'
        ? Math.round((screenWidth - (winWidth || 350)) / 2)
        : screenWidth - (winWidth || 350), // Center or top-right
    y:
      winPos === 'center'
        ? Math.round((screenHeight - (winHeight || 300)) / 2)
        : 0, // Center or top
    icon: getAssetPath('icon.png'),
    alwaysOnTop: true, // Make the window stay on top of other windows
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  if (page) {
    newWindow.loadURL(`${resolveHtmlPath('index.html')}#${page}`);
  } else {
    newWindow.loadURL(resolveHtmlPath('index.html'));
  }

  newWindow.on('ready-to-show', () => {
    if (!newWindow) {
      throw new Error('"newWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      newWindow.minimize();
    } else {
      newWindow.show();
    }
  });

  newWindow.on('close', () => {
    console.log(`Closed window ${page}`);
    windows[page || '/'] = null;
    console.log(windows);
  });

  const menuBuilder = new MenuBuilder(newWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  newWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  windows[page || '/'] = newWindow;
};

if (!store.get('tempFileLocation')) {
  store.set('tempFileLocation', app.getPath('userData'));
}

ipcMain.on('ondragstart', async (event, file: FileDef) => {
  try {
    const icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABg2lDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TRZEWBzsUccjQOtlFRRxrFYpQIdQKrTqYXPoFTRqSFBdHwbXg4Mdi1cHFWVcHV0EQ/ABxF5wUXaTE/yWFFjEeHPfj3b3H3TtAaNWYZvUlAU23zWw6JeYLq+LAK4KIIowQ4jKzjDlJysB3fN0jwNe7BM/yP/fnCKtFiwEBkTjJDNMm3iCe2bQNzvvEEVaRVeJz4gmTLkj8yHXF4zfOZZcFnhkxc9l54gixWO5hpYdZxdSIp4ljqqZTvpD3WOW8xVmrNVjnnvyFoaK+ssx1mmNIYxFLkCBCQQNV1GAjQatOioUs7ad8/KOuXyKXQq4qGDkWUIcG2fWD/8Hvbq3S1KSXFEoB/S+O8xEHBnaBdtNxvo8dp30CBJ+BK73rr7eA2U/Sm10tdgQMbwMX111N2QMud4DokyGbsisFaQqlEvB+Rt9UAEZugaE1r7fOPk4fgBx1lbkBDg6B8TJlr/u8e7C3t3/PdPr7AX6bcqtVsvBCAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6QMYDRQnrO4UJwAAAoJJREFUOMttk0tIlFEUx3/nmzszjmaKbRplyqTASsWRWhRFBdnGjGpTEOSiVbuIdkFE0E7CRRAtIiJoVQS9NhZkQWlFj52L8tVrelD0MPX75p7TYnTmCzrLw73/8//d/z1y8/7j/SIyKiIIBiIIgpkhQYAImBqGAZTOAGYA0urMbLR364aXzNfAhSuZsfG33elUqn56evrL16/ffiSTCb9p44YXhw/uDYnV7aERnCDlxqn+czUfP3we3tm9pS2VdCUnKBcvX2Vk5Mng6YEL+44fOfS9ImEEccU3Y1O9u3q2t61b10V7Rzud+Q7y+TwtzTn6DuztHh55dvdk//naynUILOYgjMLFLkgARtHrAi09PTt4PfaO9V3tXWPjU7vLAmY4M18WUDMMZWJikqmpdyCCSzgwJd/ZRmfHas6cvZhZOC8ILo5gIF4N7z3eK4igPgQRikWPmUdVYwMVZ1ZBCEQC7z1Ll+VobGpibmaGolcW1S7CqzE5MY6W8itH6SzuwFRVParGx0KBn7+nqU4n+VD4REtLM5HXku+YZWdakQgSiaDolch7Jt++xxdDZmdmqa2rI7c8V8KKTxQILNYRRGfn5giLEdmmLIpQXd9AfcMSwjAkjCIymXS6bEAVR4xpTdvaV0MPhsnU1JJ0jmw2i1fFJRMUCp8ZevCIFStXjcZTcxpDWNa8/GkhU/P82o3Brijy819FEIEgEZDL5Z40NS69908KPhbLwd5t/tL1wc0N9Yu3mgRVURjOmZmkq1K/MFJJl3jYt2uLryCAs39eBfr2dP8B7gAcO9nfokEgZ04cfcN/Ss2QK7fu7QcZFQGR0mqIBEipMT/JQAzBMDOw8nK3/gX75TQw1o4KfAAAAABJRU5ErkJggg==',
    );
    let userDataPath = store.get('tempFileLocation') as string;
    if (!userDataPath) {
      userDataPath = app.getPath('userData');
    }
    console.log(userDataPath);
    const useRandomName = store.get('randomFileName', false);

    const filePath = await getFile(file);

    const originalFileName = path.basename(filePath);
    const fileExtension = path.extname(originalFileName);
    const tempFileName = useRandomName
      ? `${Math.random().toString(36).substring(2, 15)}${fileExtension}`
      : originalFileName;
    const tempFilePath = path.join(userDataPath, tempFileName);
    console.log(originalFileName, fileExtension, tempFileName, tempFilePath);
    fs.copyFileSync(filePath, tempFilePath);
    event.sender.startDrag({
      file: tempFilePath,
      icon,
    });
  } catch (e) {
    console.error(e);
  }
});

ipcMain.on('setconfig', (event, key, value) => {
  console.log('setconfig', key, value);
  store.set(key, value);
  if (key === 'shortcut' && value) {
    globalShortcut.unregister(value);
    globalShortcut.register(value as string, createWindow);
  }
});

ipcMain.handle('getconfig', (event, key) => {
  console.log('getconfig', key);
  return store.get(key);
});

ipcMain.handle('getallfiles', () => {
  return getAllFiles();
});

ipcMain.handle('getfileinfo', (event, file) => {
  return getFileInfo(file);
});

try {
  ipcMain.handle(
    'dialog:openDirectory',
    async (event): Promise<string | null> => {
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      if (!senderWindow) {
        throw new Error('Unable to get the sender window');
      }
      const { canceled, filePaths } = await dialog.showOpenDialog(
        senderWindow,
        {
          properties: ['openDirectory'],
        },
      );
      if (canceled) {
        return null;
      }
      return filePaths[0];
    },
  );
} catch (ex) {
  console.log(ex);
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  // this will always open dev tool on open
  require('electron-debug').default({ showDevTools: false });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});
app.disableHardwareAcceleration();
app
  .whenReady()
  .then(() => {
    const icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABg2lDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TRZEWBzsUccjQOtlFRRxrFYpQIdQKrTqYXPoFTRqSFBdHwbXg4Mdi1cHFWVcHV0EQ/ABxF5wUXaTE/yWFFjEeHPfj3b3H3TtAaNWYZvUlAU23zWw6JeYLq+LAK4KIIowQ4jKzjDlJysB3fN0jwNe7BM/yP/fnCKtFiwEBkTjJDNMm3iCe2bQNzvvEEVaRVeJz4gmTLkj8yHXF4zfOZZcFnhkxc9l54gixWO5hpYdZxdSIp4ljqqZTvpD3WOW8xVmrNVjnnvyFoaK+ssx1mmNIYxFLkCBCQQNV1GAjQatOioUs7ad8/KOuXyKXQq4qGDkWUIcG2fWD/8Hvbq3S1KSXFEoB/S+O8xEHBnaBdtNxvo8dp30CBJ+BK73rr7eA2U/Sm10tdgQMbwMX111N2QMud4DokyGbsisFaQqlEvB+Rt9UAEZugaE1r7fOPk4fgBx1lbkBDg6B8TJlr/u8e7C3t3/PdPr7AX6bcqtVsvBCAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6QMYDRQnrO4UJwAAAoJJREFUOMttk0tIlFEUx3/nmzszjmaKbRplyqTASsWRWhRFBdnGjGpTEOSiVbuIdkFE0E7CRRAtIiJoVQS9NhZkQWlFj52L8tVrelD0MPX75p7TYnTmCzrLw73/8//d/z1y8/7j/SIyKiIIBiIIgpkhQYAImBqGAZTOAGYA0urMbLR364aXzNfAhSuZsfG33elUqn56evrL16/ffiSTCb9p44YXhw/uDYnV7aERnCDlxqn+czUfP3we3tm9pS2VdCUnKBcvX2Vk5Mng6YEL+44fOfS9ImEEccU3Y1O9u3q2t61b10V7Rzud+Q7y+TwtzTn6DuztHh55dvdk//naynUILOYgjMLFLkgARtHrAi09PTt4PfaO9V3tXWPjU7vLAmY4M18WUDMMZWJikqmpdyCCSzgwJd/ZRmfHas6cvZhZOC8ILo5gIF4N7z3eK4igPgQRikWPmUdVYwMVZ1ZBCEQC7z1Ll+VobGpibmaGolcW1S7CqzE5MY6W8itH6SzuwFRVParGx0KBn7+nqU4n+VD4REtLM5HXku+YZWdakQgSiaDolch7Jt++xxdDZmdmqa2rI7c8V8KKTxQILNYRRGfn5giLEdmmLIpQXd9AfcMSwjAkjCIymXS6bEAVR4xpTdvaV0MPhsnU1JJ0jmw2i1fFJRMUCp8ZevCIFStXjcZTcxpDWNa8/GkhU/P82o3Brijy819FEIEgEZDL5Z40NS69908KPhbLwd5t/tL1wc0N9Yu3mgRVURjOmZmkq1K/MFJJl3jYt2uLryCAs39eBfr2dP8B7gAcO9nfokEgZ04cfcN/Ss2QK7fu7QcZFQGR0mqIBEipMT/JQAzBMDOw8nK3/gX75TQw1o4KfAAAAABJRU5ErkJggg==',
    );
    const tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => createWindow() },
      {
        label: 'Settings',
        click: () => createWindow('/settings', 500, 700, 'center'),
      },
      { label: 'Exit', click: () => app.quit() },
    ]);
    tray.setToolTip('Sample Files Archive');
    tray.setContextMenu(contextMenu);

    const shortcut = store.get('shortcut');
    if (shortcut) {
      globalShortcut.register(shortcut as string, createWindow);
    }

    //   app.on('activate', () => {
    //     // On macOS it's common to re-create a window in the app when the
    //     // dock icon is clicked and there are no other windows open.
    //     if (newWindow === null) createWindow();
    //   });
  })
  .catch(console.log);
