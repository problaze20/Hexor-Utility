const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 550,
    height: 250,
    resizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, 'build', 'icon.png'), // Optional for Windows/Linux
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  app.setName("Hexor Utility"); // Set app name for macOS menu bar

  createWindow();

  const menu = Menu.buildFromTemplate([
    // macOS App Menu
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: `About ${app.name}`,
              message: `${app.name} v${app.getVersion()}`,
              detail: 'A simple color picker app for macOS made by problaze20.',
              buttons: ['OK', 'Visit GitHub'],
              defaultId: 0,
              cancelId: 0
            }).then(result => {
              if (result.response === 1) {
                shell.openExternal('https://github.com/problaze20');
              }
            });
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        { role: 'close', label: 'Close', accelerator: 'CmdOrCtrl+W' }
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
