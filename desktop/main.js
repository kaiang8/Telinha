'use strict';
// Caras E Telas para Windows.
// O programa é só uma janela travada no site: não abre portas no computador, não roda
// servidor, e a página não tem acesso a arquivos nem ao sistema (sandbox).

const {
  app, BrowserWindow, session, desktopCapturer, globalShortcut, ipcMain, shell, dialog, Menu, webContents,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const R = require('./regras');

const EM_TESTE = !app.isPackaged; // rodando pelo código (não instalado)
const ARG_TESTE = process.argv.find((a) => a.startsWith('--teste-rapido='));
const TESTE_RAPIDO = ARG_TESTE ? ARG_TESTE.slice('--teste-rapido='.length) : null; // usado pelo GitHub ao gerar o instalador

const SITE = (() => {
  const pedido = EM_TESTE ? process.env.CARAS_SITE : null; // trocar o site só é possível em teste
  return pedido && R.siteValido(pedido, true) ? pedido.replace(/\/+$/, '') : R.SITE_PADRAO;
})();
const SITE_ORIGEM = new URL(SITE).origin;
const PASTA_TELAS = path.join(__dirname, 'telas');
const PARTICAO = 'persist:caras-e-telas';
const ID_APP = 'com.kaiang8.carasetelas';

let janela = null;
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const tela = (nome) => path.join(PASTA_TELAS, nome);

// ---------- Endurecimento geral ----------
app.enableSandbox(); // toda página roda isolada, sem Node.js
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required'); // as transmissões tocam ao voltar do jogo
app.setAppUserModelId(ID_APP);

function abrirFora(url) {
  if (TESTE_RAPIDO || !R.podeAbrirFora(url)) return;
  shell.openExternal(url).catch(() => {});
}

app.on('web-contents-created', (_e, wc) => {
  wc.on('will-attach-webview', (ev) => ev.preventDefault());
  wc.setWindowOpenHandler(({ url }) => {
    abrirFora(url); // links do chat abrem no navegador padrão
    return { action: 'deny' };
  });
  wc.on('will-navigate', (ev, url) => {
    if (janela && wc === janela.webContents && R.podeNavegar(url, SITE_ORIGEM)) return;
    ev.preventDefault();
    abrirFora(url);
  });
  wc.on('will-frame-navigate', (ev) => {
    if (!ev.isMainFrame) ev.preventDefault(); // o site não usa iframes
  });
  wc.on('will-redirect', (ev, url) => {
    if (janela && wc === janela.webContents && R.podeNavegar(url, SITE_ORIGEM)) return;
    ev.preventDefault();
  });
  wc.on('will-download', (ev) => ev.preventDefault());
});

const PERMISSOES = new Set(['display-capture', 'clipboard-sanitized-write', 'fullscreen']);

function daJanelaPrincipal(wc, url) {
  return !!janela && !janela.isDestroyed() && wc === janela.webContents && R.origemDe(url) === SITE_ORIGEM;
}

function configurarSessaoDoSite(ses) {
  ses.setPermissionRequestHandler((wc, permissao, responder, detalhes) => {
    const url = detalhes?.requestingUrl || wc?.getURL?.() || '';
    let ok = daJanelaPrincipal(wc, url) && PERMISSOES.has(permissao);
    // Até o Electron 44 a captura de tela chegava como "media" sem câmera nem microfone.
    if (!ok && permissao === 'media' && daJanelaPrincipal(wc, url)) {
      const tipos = detalhes?.mediaTypes || [];
      ok = tipos.length === 0;
    }
    responder(ok);
  });
  ses.setPermissionCheckHandler((wc, permissao, origem) => (
    PERMISSOES.has(permissao) && R.origemDe(origem) === SITE_ORIGEM && (!wc || wc === janela?.webContents)
  ));
  ses.setDevicePermissionHandler(() => false); // USB, HID, serial: nunca
  ses.setDisplayMediaRequestHandler(pedidoDeTela, { useSystemPicker: false });
  ses.webRequest.onBeforeRequest((d, cb) => {
    const ok = R.requisicaoPermitida(d.url, SITE_ORIGEM, PASTA_TELAS);
    if (!ok) console.warn('[bloqueado]', d.url);
    cb({ cancel: !ok });
  });
  ses.setSpellCheckerEnabled(false);
}

function configurarSessaoFechada(ses, bloquearRede) {
  ses.setPermissionRequestHandler((_wc, _p, responder) => responder(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler(() => false);
  if (!bloquearRede) return; // a sessão padrão não abre páginas; a atualização automática usa a própria
  ses.webRequest.onBeforeRequest((d, cb) => {
    const u = d.url;
    cb({ cancel: !(u.startsWith('data:') || u.startsWith('devtools:') || (u.startsWith('file:') && R.requisicaoPermitida(u, 'https://x.invalid', PASTA_TELAS))) });
  });
  ses.setSpellCheckerEnabled(false);
}

// ---------- Compartilhar tela: seletor próprio, dentro do programa ----------
async function pedidoDeTela(pedido, responder) {
  let respondeu = false;
  const responda = (x) => {
    if (respondeu) return;
    respondeu = true;
    try { responder(x); } catch (e) { console.error(e); }
  };
  try {
    const frame = pedido.frame;
    let wc = null;
    try { wc = frame ? webContents.fromFrame(frame) : null; } catch { wc = null; }
    if (!frame || frame.parent || !daJanelaPrincipal(wc, frame.url) || !pedido.videoRequested) return responda(null);

    const fontes = await desktopCapturer.getSources({
      types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: true,
    });
    const proprias = new Set();
    for (const w of BrowserWindow.getAllWindows()) {
      try { proprias.add(w.getMediaSourceId()); } catch { /* ok */ }
    }
    const lista = fontes.filter((f) => !proprias.has(f.id)); // não deixa compartilhar a própria janela (efeito espelho)
    const comSom = !!pedido.audioRequested && process.platform === 'win32';
    const escolha = TESTE_RAPIDO ? lista.find((f) => f.id.startsWith('screen:')) : await abrirSeletor(lista, comSom);
    if (!escolha) return responda(null);
    const resposta = { video: escolha };
    // "loopback" = som do computador. Como a página pede restrictOwnAudio, o Electron
    // tira dele tudo o que o próprio programa toca: as outras transmissões não voltam (sem eco).
    if (comSom) resposta.audio = 'loopback';
    responda(resposta);
  } catch (e) {
    console.error('Erro ao compartilhar a tela:', e);
    responda(null);
  }
}

function abrirSeletor(lista, comSom) {
  return new Promise((resolver) => {
    const seletor = new BrowserWindow({
      parent: janela, modal: true, width: 900, height: 640, minWidth: 560, minHeight: 420,
      show: false, backgroundColor: '#101233', title: 'Escolha o que compartilhar',
      autoHideMenuBar: true, minimizable: false, maximizable: false,
      webPreferences: {
        partition: 'caras-seletor', preload: path.join(__dirname, 'preload-seletor.js'),
        sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false, devTools: EM_TESTE,
      },
    });
    let fim = false;
    const terminar = (fonte) => {
      if (fim) return;
      fim = true;
      ipcMain.removeListener('seletor-escolha', aoEscolher);
      if (!seletor.isDestroyed()) seletor.destroy();
      resolver(fonte || null);
    };
    const aoEscolher = (e, id) => {
      if (e.sender !== seletor.webContents) return;
      terminar(typeof id === 'string' ? lista.find((f) => f.id === id) : null);
    };
    ipcMain.on('seletor-escolha', aoEscolher);
    seletor.on('closed', () => terminar(null));
    seletor.webContents.once('did-finish-load', () => {
      seletor.webContents.send('fontes', {
        comSom,
        fontes: lista.map((f) => ({
          id: f.id,
          nome: f.name,
          tipo: f.id.startsWith('screen:') ? 'tela' : 'janela',
          miniatura: f.thumbnail && !f.thumbnail.isEmpty() ? f.thumbnail.toDataURL() : '',
          icone: f.appIcon && !f.appIcon.isEmpty() ? f.appIcon.resize({ width: 32, height: 32 }).toDataURL() : '',
        })),
      });
      seletor.show();
    });
    seletor.loadFile(tela('seletor.html')).catch(() => terminar(null));
  });
}

// ---------- Atalhos globais da soundboard ----------
function registrarAtalhos(lista) {
  globalShortcut.unregisterAll();
  const ok = [];
  const falhou = [];
  for (const { id, acc } of R.validarAtalhos(lista)) {
    let deu = false;
    try { deu = globalShortcut.register(acc, () => avisarAtalho(id)); } catch { deu = false; }
    (deu ? ok : falhou).push(id);
  }
  return { ok, falhou };
}
function avisarAtalho(id) {
  if (!janela || janela.isDestroyed()) return;
  if (R.origemDe(janela.webContents.getURL()) !== SITE_ORIGEM) return;
  janela.webContents.send('atalho', id);
}

function pedidoConfiavel(e) {
  const f = e.senderFrame;
  return !!f && !f.parent && daJanelaPrincipal(e.sender, f.url);
}
ipcMain.handle('info', (e) => (pedidoConfiavel(e) ? { versao: app.getVersion(), atalhosGlobais: true } : null));
ipcMain.handle('atalhos', (e, lista) => (pedidoConfiavel(e) ? registrarAtalhos(lista) : { ok: [], falhou: [] }));

// ---------- Janela principal ----------
async function siteRespondendo(ses) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await ses.fetch(`${SITE}/api/config`, { cache: 'no-store', signal: ctrl.signal });
    return r.ok && /json/i.test(r.headers.get('content-type') || '');
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

let acordando = false;
// O Render grátis "dorme": espera o servidor acordar mostrando uma tela de carregamento.
async function acordarEAbrir() {
  if (acordando || !janela) return;
  acordando = true;
  try {
    const inicio = Date.now();
    let mostrouErro = false;
    const atual = janela.webContents.getURL();
    if (!atual.startsWith('file:')) await janela.loadFile(tela('carregando.html')).catch(() => {});
    for (;;) {
      if (!janela || janela.isDestroyed()) return;
      if (await siteRespondendo(janela.webContents.session)) {
        try {
          await janela.loadURL(SITE);
          return;
        } catch (e) {
          if (e?.code === 'ERR_ABORTED' && R.origemDe(janela.webContents.getURL()) === SITE_ORIGEM) return;
          if (!janela || janela.isDestroyed()) return;
          await janela.loadFile(tela(mostrouErro ? 'erro.html' : 'carregando.html')).catch(() => {});
        }
      }
      if (!mostrouErro && Date.now() - inicio > 90000) {
        mostrouErro = true;
        await janela.loadFile(tela('erro.html')).catch(() => {});
      }
      await espera(mostrouErro ? 10000 : 2500);
    }
  } finally {
    acordando = false;
  }
}

function criarJanela() {
  const ses = session.fromPartition(PARTICAO);
  configurarSessaoDoSite(ses);
  janela = new BrowserWindow({
    width: 1280, height: 820, minWidth: 880, minHeight: 560,
    backgroundColor: '#101233', title: 'Caras E Telas', show: false, autoHideMenuBar: true,
    icon: tela('icone.png'),
    webPreferences: {
      session: ses,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      safeDialogs: true,
      navigateOnDragDrop: false,
      backgroundThrottling: false, // continua transmitindo liso com o jogo na frente
      devTools: EM_TESTE,
    },
  });
  janela.once('ready-to-show', () => { if (!TESTE_RAPIDO) janela.show(); });
  janela.on('closed', () => { janela = null; });

  const wc = janela.webContents;
  wc.on('did-fail-load', (_e, codigo, _desc, url, principal) => {
    if (!principal || codigo === -3) return;
    if (R.origemDe(url) === SITE_ORIGEM) acordarEAbrir();
  });
  wc.on('did-start-navigation', (d) => {
    if (d.isMainFrame && !d.isSameDocument) globalShortcut.unregisterAll(); // a página nova registra de novo
  });
  wc.on('render-process-gone', () => setTimeout(() => janela && acordarEAbrir(), 1000));

  // Atalhos do próprio programa (sem menu): recarregar, zoom e tela cheia
  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const ctrl = input.control || input.meta;
    const k = String(input.key || '');
    if (k === 'F5' || (ctrl && k.toLowerCase() === 'r')) {
      e.preventDefault();
      if (R.origemDe(wc.getURL()) !== SITE_ORIGEM) acordarEAbrir();
      else if (input.shift) wc.reloadIgnoringCache();
      else wc.reload();
    } else if (k === 'F11') {
      e.preventDefault();
      janela.setFullScreen(!janela.isFullScreen());
    } else if (ctrl && (k === '=' || k === '+')) {
      e.preventDefault();
      wc.setZoomLevel(Math.min(wc.getZoomLevel() + 0.5, 4));
    } else if (ctrl && k === '-') {
      e.preventDefault();
      wc.setZoomLevel(Math.max(wc.getZoomLevel() - 0.5, -3));
    } else if (ctrl && k === '0') {
      e.preventDefault();
      wc.setZoomLevel(0);
    } else if (EM_TESTE && k === 'F12') {
      wc.toggleDevTools();
    }
  });

  acordarEAbrir();
}

// ---------- Atualização automática (pelos lançamentos do GitHub) ----------
function configurarAtualizacao() {
  if (EM_TESTE || TESTE_RAPIDO) return;
  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (e) {
    console.warn('Atualização automática indisponível:', e?.message);
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.on('error', (e) => console.warn('Atualização:', e?.message));
  let avisou = false;
  autoUpdater.on('update-downloaded', async (info) => {
    if (avisou || !janela || janela.isDestroyed()) return;
    avisou = true;
    const { response } = await dialog.showMessageBox(janela, {
      type: 'info',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
      title: 'Caras E Telas',
      message: `A versão ${info?.version || 'nova'} do Caras E Telas está pronta.`,
      detail: 'Reinicie para atualizar. Se escolher "Depois", ela é instalada quando você fechar o programa.',
    });
    if (response === 0) setImmediate(() => autoUpdater.quitAndInstall(true, true));
  });
  const verificar = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(verificar, 15000);
  setInterval(verificar, 6 * 60 * 60 * 1000);
}

// ---------- Teste rápido (o GitHub roda o programa uma vez antes de publicar) ----------
async function testeRapido() {
  const r = { versao: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, site: SITE };
  const gravar = (codigo) => {
    try { fs.writeFileSync(TESTE_RAPIDO, JSON.stringify(r, null, 2)); } catch (e) { console.error(e); }
    app.exit(codigo);
  };
  setTimeout(() => { r.erro = 'tempo esgotado'; gravar(2); }, 240000);
  try {
    for (;;) {
      if (janela && R.origemDe(janela.webContents.getURL()) === SITE_ORIGEM && !janela.webContents.isLoading()) break;
      await espera(500);
    }
    const js = (codigo, gesto = false) => janela.webContents.executeJavaScript(codigo, gesto);
    await espera(1500);
    r.api = await js("typeof window.carasETelas === 'object' && window.carasETelas.programa === true");
    r.info = await js('window.carasETelas.info()');
    r.atalhos = await js("window.carasETelas.atalhos([{ id: 'teste', code: 'F13' }, { id: 'ruim', code: 'KeyA' }])");
    await js('window.carasETelas.atalhos([])');
    r.semNode = await js("typeof require === 'undefined' && typeof process === 'undefined'");
    r.bloqueioExterno = await js("fetch('https://example.com/').then(() => 'NÃO bloqueou', () => 'bloqueado')");
    // A lista de endereços liberados vale até para quem tentar abrir outro site na mesma sessão
    const oculta = new BrowserWindow({ show: false, webPreferences: { session: janela.webContents.session, sandbox: true, contextIsolation: true } });
    r.listaDeEnderecos = await oculta.loadURL('https://example.com/').then(() => 'NÃO bloqueou', (e) => (/BLOCKED_BY_CLIENT/.test(String(e?.code || e)) ? 'bloqueado' : `erro: ${e?.code || e}`));
    oculta.destroy();
    r.janelaNova = await js("window.open('https://example.com/') === null ? 'bloqueada' : 'NÃO bloqueada'");
    await js("setTimeout(() => location.assign('https://example.com/'), 0); 'ok'");
    await espera(1500);
    r.navegacaoExterna = R.origemDe(janela.webContents.getURL()) === SITE_ORIGEM ? 'bloqueada' : 'NÃO bloqueada';
    const capturar = (audio) => js(`navigator.mediaDevices.getDisplayMedia({ video: true, audio: ${audio} })
      .then((s) => { const x = { video: s.getVideoTracks().length, audio: s.getAudioTracks().map((t) => ({ label: t.label, deviceId: t.getSettings().deviceId, restrictOwnAudio: t.getSettings().restrictOwnAudio })) }; s.getTracks().forEach((t) => t.stop()); return x; })
      .catch((e) => 'erro: ' + e.name + ': ' + e.message)`, true);
    r.capturaComSom = await capturar('{ restrictOwnAudio: true, echoCancellation: false }');
    r.capturaSemSom = await capturar('false');
    const ok = r.api === true && r.semNode === true && r.bloqueioExterno === 'bloqueado' && r.listaDeEnderecos === 'bloqueado'
      && r.janelaNova === 'bloqueada' && r.navegacaoExterna === 'bloqueada'
      && Array.isArray(r.atalhos?.ok) && !r.atalhos.ok.includes('ruim');
    r.resultado = ok ? 'passou' : 'falhou';
    gravar(ok ? 0 : 1);
  } catch (e) {
    r.erro = String(e?.stack || e);
    gravar(1);
  }
}

// ---------- Início ----------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!janela) return;
    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    configurarSessaoFechada(session.defaultSession, false);
    configurarSessaoFechada(session.fromPartition('caras-seletor'), true);
    criarJanela();
    configurarAtualizacao();
    if (TESTE_RAPIDO) testeRapido();
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
