const { app, BrowserWindow, Menu, dialog, shell, clipboard } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 550,
		height: 250,
		resizable: false,
		fullscreenable: false,
		frame: false, // Frameless window
		transparent: false,
		titleBarStyle: 'hiddenInset', // macOS style
		trafficLightPosition: { x: 10, y: 10 }, // macOS traffic light buttons
		icon: path.join(__dirname, 'build', 'icon.icns'), // Use .icns for macOS
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		}
	});

	mainWindow.loadFile('index.html');
}

function makeViewSubmenu() {
	const viewSubmenu = [
		{ role: 'reload' },
		{
			label: 'Pick From Screen',
			accelerator: 'CmdOrCtrl+P',
			click: () => {
				if (!mainWindow || !mainWindow.webContents) return;
				mainWindow.webContents.executeJavaScript(`(async () => {
					try {
						if ("EyeDropper" in window) {
							const eye = new EyeDropper();
							const result = await eye.open();
							const rgb = (typeof hexToRgb === 'function') ? hexToRgb(result.sRGBHex) : null;
							if (rgb && typeof setRGBandUpdate === 'function') setRGBandUpdate(rgb.r, rgb.g, rgb.b);
						} else {
							console.log('Error: Failed to use Eyedropper');
						}
					} catch (e) {
						console.log('Error: Failed to use Eyedropper', e);
					}
				})();`, true).catch(err => console.error('executeJavaScript error:', err));
			}
		},
		{ type: 'separator' }
	];

	// Add Generate Random Color menu item (CmdOrCtrl+Alt+R -> Cmd+Option+R on macOS)
	viewSubmenu.push({
		label: 'Generate Random Color',
		accelerator: 'CmdOrCtrl+Alt+R',
		click: () => {
			if (!mainWindow || !mainWindow.webContents) return;
			// generate random RGB in the renderer to ensure UI updates and use existing helper
			mainWindow.webContents.executeJavaScript(`(function(){
				const r = Math.floor(Math.random()*256);
				const g = Math.floor(Math.random()*256);
				const b = Math.floor(Math.random()*256);
				if (typeof setRGBandUpdate === 'function') {
					setRGBandUpdate(r, g, b);
				}
				return {r,g,b};
			})();`, true).then(result => {
				console.log('Generated random color', result);
			}).catch(err => console.error('Generate Random Color error:', err));
		}
	});

	function addFormatItem(label, accelerator, jsExpression) {
		viewSubmenu.push({
			label,
			accelerator,
			click: () => {
				if (!mainWindow || !mainWindow.webContents) return;
				mainWindow.webContents.executeJavaScript(jsExpression, true)
					.then(result => {
						clipboard.writeText(String(result || ''));
						console.log('Copied:', result);
					})
					.catch(err => console.error('Format copy error:', err));
			}
		});
	}

	addFormatItem('Copy Hex', 'Shift+CmdOrCtrl+1', `(function(){ const r=+document.getElementById('red').value; const g=+document.getElementById('green').value; const b=+document.getElementById('blue').value; return (typeof rgbToHex === 'function') ? rgbToHex(r,g,b) : '#000000'; })();`);
	addFormatItem('Copy HSL', 'Shift+CmdOrCtrl+2', `(function(){ const r=+document.getElementById('red').value; const g=+document.getElementById('green').value; const b=+document.getElementById('blue').value; const hsl = (typeof rgbToHsl === 'function') ? rgbToHsl(r,g,b) : null; return hsl ? (hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%') : ''; })();`);
	addFormatItem('Copy HSV', 'Shift+CmdOrCtrl+H', `(function(){ const r = +document.getElementById('red').value; const g = +document.getElementById('green').value; const b = +document.getElementById('blue').value; const hsv = (typeof rgbToHsv === 'function') ? rgbToHsv(r, g, b) : null; return hsv ? (hsv.h + ', ' + hsv.s + '%, ' + hsv.v + '%') : ''; })();`);
	addFormatItem('Copy RGB', 'Shift+CmdOrCtrl+R', `(function(){ const r=+document.getElementById('red').value; const g=+document.getElementById('green').value; const b=+document.getElementById('blue').value; return r + ', ' + g + ', ' + b; })();`);
	addFormatItem('Copy LCH', 'Shift+CmdOrCtrl+L', `(function(){ const r=+document.getElementById('red').value; const g=+document.getElementById('green').value; const b=+document.getElementById('blue').value; const lch = (typeof rgbToLch === 'function') ? rgbToLch(r,g,b) : null; return lch ? (lch.l + '%, ' + lch.c + ', ' + lch.h) : ''; })();`);
	addFormatItem('Copy LAB', 'Shift+CmdOrCtrl+B', `(function(){ const r=+document.getElementById('red').value; const g=+document.getElementById('green').value; const b=+document.getElementById('blue').value; const lab = (typeof rgbToLab === 'function') ? rgbToLab(r,g,b) : null; return lab ? (lab.l + ', ' + lab.a + ', ' + lab.b) : ''; })();`);
	addFormatItem('Copy CMYK', 'Shift+CmdOrCtrl+K', `(function(){ const r=+document.getElementById('red').value; const g=+document.getElementById('green').value; const b=+document.getElementById('blue').value; const cmyk = (typeof rgbToCmyk === 'function') ? rgbToCmyk(r,g,b) : null; return cmyk ? (cmyk.c + '%, ' + cmyk.m + '%, ' + cmyk.y + '%, ' + cmyk.k + '%') : ''; })();`);
	addFormatItem('Copy XYZ', 'Shift+CmdOrCtrl+X', `(function(){ const r = +document.getElementById('red').value; const g = +document.getElementById('green').value; const b = +document.getElementById('blue').value; const xyz = (typeof rgbToXyz === 'function') ? rgbToXyz(r, g, b) : null; return xyz ? (xyz.x + ', ' + xyz.y + ', ' + xyz.z) : ''; })();`);

	return viewSubmenu;
}

app.whenReady().then(() => {
	app.setName('Hexor Utility');

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
							detail: 'The Simple, And Open-Source Color Picker App On Your Mac',
							buttons: ['OK'],
							defaultId: 0,
							cancelId: 0
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

		{ label: 'File', submenu: [{ role: 'close', label: 'Close', accelerator: 'CmdOrCtrl+W' }] },
		{ label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { type: 'separator' }, { role: 'selectAll' }] },
		{ label: 'View', submenu: makeViewSubmenu() },
		{ label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
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
