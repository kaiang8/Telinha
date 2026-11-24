'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('seletor', {
  aoReceber: (fn) => {
    if (typeof fn === 'function') ipcRenderer.once('fontes', (_e, dados) => fn(dados));
  },
  escolher: (x) => ipcRenderer.send('seletor-escolha', x && typeof x.id === 'string'
    ? { id: x.id, modo: String(x.modo || ''), pid: Number.isInteger(x.pid) ? x.pid : null }
    : null),
});
