
const { contextBridge, ipcRenderer } = require('electron');

// Expose a small API to the renderer to listen for pick-from-screen
// requests originating from the main process (menu / accelerator).
contextBridge.exposeInMainWorld('electronAPI', {
	onPick: (callback) => {
		// callback will be invoked when main sends 'pick-from-screen'
		ipcRenderer.on('pick-from-screen', (event, ...args) => callback(...args));
	}
,
	onGenerate: (callback) => {
		// callback invoked when main sends 'generate-random-color'
		ipcRenderer.on('generate-random-color', (event, ...args) => callback(...args));
	}
});

