'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('seletor', {
  aoReceber: (fn) => {
    if (typeof fn === 'function') ipcRenderer.once('fontes', (_e, dados) => fn(dados));
  },
  escolher: (id) => ipcRenderer.send('seletor-escolha', typeof id === 'string' ? id : null),
});
