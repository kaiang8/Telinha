'use strict';
// Ponte da camada da caneta: só recebe traços do programa (nada sai daqui).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tinta', {
  aoReceber: (fn) => {
    if (typeof fn === 'function') ipcRenderer.on('tinta', (_e, d) => fn(d));
  },
  aoTeste: (fn) => {
    if (typeof fn === 'function') ipcRenderer.on('tinta-teste', (_e, ligar) => fn(ligar === true));
  },
});
