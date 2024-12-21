/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { exec } from 'child_process';
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeTheme,
  powerMonitor,
  shell,
  Tray,
} from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const API_ENDPOINT = 'http://192.168.1.44:5000';

const gotTheLock = app.requestSingleInstanceLock();

function checkIfMuted(): any {
  return new Promise((resolve, reject) => {
    exec(
      'powershell -command "Get-AudioDevice -PlaybackMute"',
      // eslint-disable-next-line consistent-return
      (error, stdout) => {
        if (error) {
          console.error('Error getting mute status:', error);
          return reject(error);
        }
        console.log('Muted:', stdout);
        const muted = stdout.trim() === 'True';
        resolve(muted);
      },
    );
  });
}

powerMonitor.addListener('lock-screen', async () => {
  fetch(`${API_ENDPOINT}/lock_event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'LOCK' }),
  });

  const isMuted = await checkIfMuted();
  if (!isMuted) {
    const command = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]173)"`;
    require('child_process').exec(command);
  }
});

powerMonitor.addListener('unlock-screen', async () => {
  fetch(`${API_ENDPOINT}/lock_event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'UNLOCK' }),
  });

  const isMuted = await checkIfMuted();
  if (isMuted) {
    const command = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]173)"`;
    require('child_process').exec(command);
  }
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

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

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: 700,
    maxWidth: 500,
    autoHideMenuBar: true,
    center: true,
    titleBarOverlay: {
      color: 'rgba(0,0,0,0)',
      symbolColor: '#fff',
    },
    titleBarStyle: 'hidden',
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? 'hsl(174, 51.2%, 8.0%)'
      : 'hsl(164, 88.2%, 96.7%)',

    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

let tray: any;
if (!gotTheLock) {
  app.quit();
} else {
  app.on(
    'second-instance',
    (event, commandLine, workingDirectory, additionalData) => {
      // Print out data received from the second instance.
      console.log(additionalData);

      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    },
  );

  app
    .whenReady()
    .then(() => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();

      if (!tray) {
        tray = new Tray(getAssetPath('icon.ico'));
        const contextMenu = Menu.buildFromTemplate([
          {
            label: "Open Manu's Setup",
            click: () => mainWindow && mainWindow.show(),
          },
          {
            label: 'Quit',
            click: () => {
              app.quit();
              app.exit();
            },
          },
        ]);

        tray.setToolTip('Dysperse');
        tray.setContextMenu(contextMenu);
        tray.on('click', () => mainWindow && mainWindow.show());
      }
    })
    .catch(console.log);

  app.on('browser-window-created', (e, window) => {
    window.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  });
}
