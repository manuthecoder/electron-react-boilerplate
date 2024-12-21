import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { exec } from "child_process";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeTheme,
  powerMonitor,
  shell,
  Tray,
} from "electron";
import { join } from "path";

const API_ENDPOINT = "http://192.168.1.44:5000";
const gotTheLock = app.requestSingleInstanceLock();

function checkIfMuted(): any {
  return new Promise((resolve, reject) => {
    exec(
      'powershell -command "Get-AudioDevice -PlaybackMute"',
      // eslint-disable-next-line consistent-return
      (error, stdout) => {
        if (error) {
          console.error("Error getting mute status:", error);
          return reject(error);
        }
        console.log("Muted:", stdout);
        const muted = stdout.trim() === "True";
        resolve(muted);
      }
    );
  });
}

powerMonitor.addListener("lock-screen", async () => {
  fetch(`${API_ENDPOINT}/lock_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: "LOCK" }),
  });

  const isMuted = await checkIfMuted();
  if (!isMuted) {
    const command = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]173)"`;
    require("child_process").exec(command);
  }
});

powerMonitor.addListener("unlock-screen", async () => {
  fetch(`${API_ENDPOINT}/lock_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: "UNLOCK" }),
  });

  const isMuted = await checkIfMuted();
  if (isMuted) {
    const command = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]173)"`;
    require("child_process").exec(command);
  }
});

let mainWindow;
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: 700,
    maxWidth: 500,
    autoHideMenuBar: true,
    center: true,
    titleBarOverlay: {
      color: "rgba(0,0,0,0)",
      symbolColor: "#fff",
    },
    titleBarStyle: "hidden",
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? "hsl(174, 51.2%, 8.0%)"
      : "hsl(164, 88.2%, 96.7%)",
    icon: join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

let tray: any;
if (!gotTheLock) {
  app.quit();
} else {
  app.on(
    "second-instance",
    (_event, _commandLine, _workingDirectory, additionalData) => {
      // Print out data received from the second instance.
      console.log(additionalData);

      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    }
  );

  app.whenReady().then(() => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();

    if (!tray) {
      tray = new Tray(join(__dirname, "../../resources/icon.ico"));
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Open Dysperse",
          click: () => mainWindow && mainWindow.show(),
        },
        {
          label: "Quit",
          click: () => {
            app.quit();
            app.exit();
          },
        },
      ]);

      tray.setToolTip("Dysperse");
      tray.setContextMenu(contextMenu);
      tray.on("click", () => mainWindow && mainWindow.show());
    }
  });
}

