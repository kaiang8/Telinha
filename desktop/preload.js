'use strict';
// Ponte mínima entre o site e o programa. A página NÃO recebe Node.js nem o ipcRenderer:
// só estas três funções, e o programa confere se o pedido veio mesmo do site.
const { contextBridge, ipcRenderer } = require('electron');

let ouvinte = null;

function limparAtalhos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, 60).map((a) => ({
    id: String(a?.id ?? '').slice(0, 40),
    code: String(a?.code ?? '').slice(0, 24),
    ctrl: a?.ctrl === true,
    alt: a?.alt === true,
    shift: a?.shift === true,
    meta: a?.meta === true,
  }));
}

contextBridge.exposeInMainWorld('carasETelas', {
  programa: true,
  info: () => ipcRenderer.invoke('info'),
  atalhos: (lista) => ipcRenderer.invoke('atalhos', limparAtalhos(lista)),
  aoAtalho: (fn) => {
    if (typeof fn !== 'function') return;
    if (ouvinte) ipcRenderer.removeListener('atalho', ouvinte);
    ouvinte = (_e, id) => fn(String(id));
    ipcRenderer.on('atalho', ouvinte);
  },
});
