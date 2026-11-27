'use strict';
// Ponte mínima entre o site e o programa. A página NÃO recebe Node.js nem o ipcRenderer:
// só estas funções, e o programa confere se o pedido veio mesmo do site.
const { contextBridge, ipcRenderer } = require('electron');

let ouvinte = null;
let ouvintePtt = null;

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
  // a partir da 1.4.3: o programa pergunta antes de recarregar ou fechar no meio da transmissão
  confirmaSaida: true,
  info: () => ipcRenderer.invoke('info'),
  // A janela ou tela da transmissão sumiu: o próximo pedido de tela pega a mesma, sem o seletor
  retomarTela: () => ipcRenderer.invoke('retomar-tela'),
  // Falhas do programa (página ou placa de vídeo que caíram), para o registro de erros
  falhas: () => ipcRenderer.invoke('falhas'),
  // Nome da placa de vídeo e se ela pode codificar vídeo (para entender a qualidade da transmissão)
  placa: () => ipcRenderer.invoke('placa'),
  buscarAtualizacao: () => ipcRenderer.invoke('buscar-atualizacao'),
  atalhos: (lista) => ipcRenderer.invoke('atalhos', limparAtalhos(lista)),
  aoAtalho: (fn) => {
    if (typeof fn !== 'function') return;
    if (ouvinte) ipcRenderer.removeListener('atalho', ouvinte);
    ouvinte = (_e, id) => fn(String(id));
    ipcRenderer.on('atalho', ouvinte);
  },
  // Som de um programa só: a página pede depois de escolher a tela
  somDoPrograma: (taxa) => ipcRenderer.invoke('som-do-programa', Number(taxa)),
  pararSomDoPrograma: (id) => ipcRenderer.invoke('parar-som-do-programa', Number(id)),
  // Apertar-para-falar global: o programa avisa quando a tecla é apertada e solta
  ptt: (a) => ipcRenderer.invoke('ptt', a && typeof a === 'object' ? {
    code: String(a.code ?? '').slice(0, 24), ctrl: a.ctrl === true, alt: a.alt === true, shift: a.shift === true,
  } : null),
  aoPtt: (fn) => {
    if (typeof fn !== 'function') return;
    if (ouvintePtt) ipcRenderer.removeListener('ptt', ouvintePtt);
    ouvintePtt = (_e, v) => fn(v === true);
    ipcRenderer.on('ptt', ouvintePtt);
  },
  // Caneta: quem transmite repassa os traços para a camada por cima da tela (null = parou)
  tinta: (d) => ipcRenderer.invoke('tinta', d && typeof d === 'object' ? {
    tr: String(d.tr ?? '').slice(0, 12),
    c: Number.isInteger(d.c) ? d.c : -1,
    p: Array.isArray(d.p) ? d.p.slice(0, 64).map((xy) => (Array.isArray(xy) ? [Number(xy[0]), Number(xy[1])] : [NaN, NaN])) : [],
    fim: d.fim === true,
    nome: String(d.nome ?? '').slice(0, 32),
  } : null),
  tintaEstado: () => ipcRenderer.invoke('tinta-estado'),
  // a partir da 1.4.5: a câmera é liberada para o site (antes, só o microfone)
  camera: true,
  // a partir da 1.4.4: aviso por cima do jogo (alguém entrou na sua sala, alguém te mencionou)
  aviso: (d) => ipcRenderer.invoke('aviso', d && typeof d === 'object' ? {
    tipo: String(d.tipo ?? '').slice(0, 12),
    nome: String(d.nome ?? '').slice(0, 64),
    cor: String(d.cor ?? '').slice(0, 9),
    texto: String(d.texto ?? '').slice(0, 300),
    piscar: d.piscar === true,
  } : null),
  // Tema escolhido no site: o programa usa nas telas dele (carregando, seletor de tela)
  aparencia: (dados) => ipcRenderer.invoke('aparencia', {
    escuro: dados?.escuro === true,
    vars: dados?.vars && typeof dados.vars === 'object' ? Object.fromEntries(Object.entries(dados.vars).slice(0, 60).map(([k, v]) => [String(k), String(v)])) : {},
  }),
});

// O som chega à página por um MessagePort. A página cria o canal e entrega uma ponta
// por window.postMessage; aqui ela segue para o programa.
window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin || e.data?.caras !== 'porta-do-som') return;
  const porta = e.ports?.[0];
  if (porta) ipcRenderer.postMessage('som-porta', null, [porta]);
});
