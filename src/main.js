const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const appshort = "Hexor";

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 550,
		height: 250,
		resizable: false,
		fullscreenable: false,
		frame: false, // Frameless window
		transparent: false,
		icon: path.join(__dirname, 'build', 'icon.png'),
		titleBarStyle: 'hiddenInset', // macOS style
		trafficLightPosition: { x: 10, y: 10 }, // macOS control button position
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	});

	mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
	app.setName("Hexor Utility");

	createWindow();

	const menu = Menu.buildFromTemplate([
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
							buttons: ['OK', 'Visit Repository'],
							defaultId: 0,
							cancelId: 0
						}).then(result => {
							if (result.response === 1) {
								shell.openExternal('https://github.com/problaze20/Hexor-Utility');
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

		{
			label: 'File',
			submenu: [
				{ role: 'close', label: 'Close', accelerator: 'CmdOrCtrl+W' }
			]
		},

		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ type: 'separator' },
				{ role: 'selectAll' }
			]
		},

		{
			label: 'View',
			submenu: [
				{ role: 'reload' }
			]
		},

		{
			label: 'Window',
			submenu: [
				{ role: 'minimize' },
				{ role: 'close' }
			]
		},

		// Help menu added here
		{
			label: 'Help',
			role: 'help',
			submenu: [
				{
					label: 'Toggle Developer Tools',
					click: () => {
						if (mainWindow && mainWindow.webContents) {
							mainWindow.webContents.openDevTools({ mode: 'detach' });
						}
					}
				}
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
