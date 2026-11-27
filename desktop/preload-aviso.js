'use strict';
// Ponte da janelinha de avisos: só recebe os avisos do programa (nada sai daqui).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('avisos', {
  aoReceber: (fn) => {
    if (typeof fn === 'function') ipcRenderer.on('aviso', (_e, d) => fn(d));
  },
});
