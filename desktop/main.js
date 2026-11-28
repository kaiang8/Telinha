'use strict';
// Caras E Telas para Windows.
// O programa é só uma janela travada no site: não abre portas no computador, não roda
// servidor, e a página não tem acesso a arquivos nem ao sistema (sandbox).

const {
  app, BrowserWindow, session, desktopCapturer, globalShortcut, ipcMain, shell, dialog, Menu, webContents, screen,
} = require('electron');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const R = require('./regras');
const ajudante = require('./ajudante');
const coop = require('./coop');

const EM_TESTE = !app.isPackaged; // rodando pelo código (não instalado)
const ARG_TESTE = process.argv.find((a) => a.startsWith('--teste-rapido='));
const TESTE_RAPIDO = ARG_TESTE ? ARG_TESTE.slice('--teste-rapido='.length) : null; // usado pelo GitHub ao gerar o instalador
// No teste do GitHub não há microfone nem câmera: aparelhos de mentira, só para conferir as permissões
if (TESTE_RAPIDO) app.commandLine.appendSwitch('use-fake-device-for-media-stream');

const SITE = (() => {
  const pedido = EM_TESTE ? process.env.CARAS_SITE : null; // trocar o site só é possível em teste
  return pedido && R.siteValido(pedido, true) ? pedido.replace(/\/+$/, '') : R.SITE_PADRAO;
})();
const SITE_ORIGEM = new URL(SITE).origin;
const PASTA_TELAS = path.join(__dirname, 'telas');
const PARTICAO = 'persist:caras-e-telas';
const ID_APP = 'com.kaiang8.carasetelas';

let janela = null;
let escolhaDeSom = null; // o que a pessoa escolheu no seletor: { modo, pid, nome, quando }
// Transmissão que caiu: a última tela ou janela escolhida (sobrevive a recarregar a página)
let ultimaEscolha = null; // { id, nome, tela }
let retomada = 0; // até quando o próximo pedido de tela pega a mesma fonte, sem o seletor
let ultimaRetomada = ''; // como achou (para o teste): 'mesma fonte', 'janela com o mesmo nome', 'não achou'...
let escolhaDeTeste = null; // só no teste do GitHub: qual fonte o "seletor" escolhe
let saindoDeVez = false; // atualização, desligar o Windows: fecha sem perguntar
let fechandoJanela = 0; // quando a pessoa clicou no X (para a pergunta dizer "fechar" e não "recarregar")
let perguntasAoSair = 0; // quantas vezes a página pediu para confirmar (para o teste)

// Preferências do seletor (de onde vem o som), guardadas só neste computador
const ARQ_PREFS = () => path.join(app.getPath('userData'), 'preferencias.json');
function lerPrefs() {
  try { return JSON.parse(fs.readFileSync(ARQ_PREFS(), 'utf8')) || {}; } catch { return {}; }
}
function guardarPrefs(p) {
  try { fs.writeFileSync(ARQ_PREFS(), JSON.stringify(p)); } catch { /* ok */ }
}

const corDeFundo = () => (lerPrefs().aparencia?.escuro ? '#0b1626' : '#cfeafb');

// Cores do tema escolhido no site (claro/escuro e paleta), aplicadas nas telas do programa
function aplicarTemaLocal(wc) {
  const css = R.cssDoTema(lerPrefs().aparencia);
  if (css && wc && !wc.isDestroyed()) wc.insertCSS(css).catch(() => {});
}
async function abrirTelaLocal(nome) {
  if (!janela || janela.isDestroyed()) return;
  await janela.loadFile(tela(nome)).catch(() => {});
  aplicarTemaLocal(janela.webContents);
}
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
});
// Downloads: só os arquivos que o próprio site monta na página (o backup do painel de admin).
// O Windows pergunta onde salvar. (O "will-download" é da sessão, não da página.)
const sessoesVigiadas = new WeakSet();
function vigiarDownloads(ses) {
  if (sessoesVigiadas.has(ses)) return;
  sessoesVigiadas.add(ses);
  ses.on('will-download', (ev, item, quem) => {
    const ok = !!janela && !janela.isDestroyed() && quem === janela.webContents && item.getURL().startsWith(`blob:${SITE_ORIGEM}/`);
    if (!ok) ev.preventDefault();
  });
}

// speaker-selection: escolher em qual alto-falante ou fone o som sai
const PERMISSOES = new Set(['display-capture', 'clipboard-sanitized-write', 'fullscreen', 'speaker-selection']);

function daJanelaPrincipal(wc, url) {
  return !!janela && !janela.isDestroyed() && wc === janela.webContents && R.origemDe(url) === SITE_ORIGEM;
}

function configurarSessaoDoSite(ses) {
  ses.setPermissionRequestHandler((wc, permissao, responder, detalhes) => {
    const url = detalhes?.requestingUrl || wc?.getURL?.() || '';
    let ok = daJanelaPrincipal(wc, url) && PERMISSOES.has(permissao);
    // "media": microfone e (a partir da 1.4.5) câmera, só para o site. Até o Electron 44 a
    // captura de tela também chegava como "media", sem câmera nem microfone.
    if (!ok && permissao === 'media' && daJanelaPrincipal(wc, url)) {
      const tipos = detalhes?.mediaTypes || [];
      ok = tipos.every((t) => t === 'audio' || t === 'video');
    }
    responder(ok);
  });
  ses.setPermissionCheckHandler((wc, permissao, origem, detalhes) => (
    (PERMISSOES.has(permissao) || (permissao === 'media' && (detalhes?.mediaType === 'audio' || detalhes?.mediaType === 'video')))
    && R.origemDe(origem) === SITE_ORIGEM && (!wc || wc === janela?.webContents)
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

    const retomando = retomada > Date.now();
    retomada = 0;
    const comSom = !retomando && !!pedido.audioRequested && process.platform === 'win32';
    const [fontes, info] = await Promise.all([
      desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: retomando ? { width: 0, height: 0 } : { width: 320, height: 180 }, fetchWindowIcons: !retomando }),
      comSom ? ajudante.listar() : Promise.resolve(null),
    ]);
    const proprias = new Set();
    for (const w of BrowserWindow.getAllWindows()) {
      try { proprias.add(w.getMediaSourceId()); } catch { /* ok */ }
    }
    const lista = fontes.filter((f) => !proprias.has(f.id)); // não deixa compartilhar a própria janela (efeito espelho)
    if (retomando) {
      // a página pediu a mesma fonte de antes (a captura caiu): nada de seletor, e nunca outra coisa
      const achou = R.acharMesmaFonte(lista, ultimaEscolha);
      ultimaRetomada = achou ? achou.como : 'não achou';
      if (!achou) return responda(null);
      fecharTinta();
      fonteDaTela = R.fonteDaCaneta(achou.fonte);
      ultimaEscolha = { ...ultimaEscolha, id: achou.fonte.id };
      return responda({ video: achou.fonte }); // o som continua o de antes: a página só troca a imagem
    }
    // de qual programa é cada janela (para "só o som desta janela")
    const janelas = {};
    if (info) {
      for (const f of lista) {
        const hwnd = /^window:(\d+):/.exec(f.id)?.[1];
        if (hwnd && info.janelas[hwnd]) janelas[f.id] = info.janelas[hwnd];
      }
    }
    const programas = info ? info.programas : null;
    const escolha = TESTE_RAPIDO
      ? { fonte: (escolhaDeTeste && lista.find(escolhaDeTeste)) || lista.find((f) => f.id.startsWith('screen:')), modo: 'sistema' }
      : await abrirSeletor(lista, { comSom, programas, janelas });
    if (!escolha?.fonte) return responda(null);
    ultimaEscolha = { id: escolha.fonte.id, nome: escolha.fonte.name, tela: String(escolha.fonte.display_id || '') };
    const resposta = { video: escolha.fonte };
    // caneta: a camada por cima da tela acompanha o que foi escolhido agora
    fecharTinta();
    fonteDaTela = R.fonteDaCaneta(escolha.fonte);
    escolhaDeSom = null;
    if (comSom) {
      const modo = validarSom(escolha, { programas, janelas });
      escolhaDeSom = { ...modo, quando: Date.now() };
      // "loopback" = som do computador. Como a página pede restrictOwnAudio, o Electron
      // tira dele tudo o que o próprio programa toca: as outras transmissões não voltam.
      if (modo.modo === 'sistema') resposta.audio = 'loopback';
      // "janela" e "programa": a página pede o som ao ajudante logo depois (somDoPrograma)
    }
    responda(resposta);
  } catch (e) {
    console.error('Erro ao compartilhar a tela:', e);
    responda(null);
  }
}

// Confere a escolha de som que veio do seletor: só vale o que o próprio programa listou
function validarSom(escolha, { programas, janelas }) {
  const modo = escolha.modo;
  const acharPrograma = (pid) => programas?.find((p) => p.pid === pid);
  if (modo === 'janela' && programas) {
    const pid = janelas[escolha.fonte.id];
    const prog = acharPrograma(pid);
    if (pid) return { modo, pid, nome: prog?.nome || escolha.fonte.name, exe: prog?.exe || '' };
  }
  if (modo === 'programa' && programas) {
    const prog = acharPrograma(escolha.pid);
    if (prog) return { modo, pid: prog.pid, nome: prog.nome, exe: prog.exe };
  }
  if (modo === 'nenhum') return { modo };
  return { modo: 'sistema' };
}

function abrirSeletor(lista, { comSom, programas, janelas }) {
  return new Promise((resolver) => {
    const seletor = new BrowserWindow({
      parent: janela, modal: true, width: 960, height: 720, minWidth: 600, minHeight: 480,
      show: false, backgroundColor: corDeFundo(), title: 'Escolha o que compartilhar',
      autoHideMenuBar: true, minimizable: false, maximizable: false,
      webPreferences: {
        partition: 'caras-seletor', preload: path.join(__dirname, 'preload-seletor.js'),
        sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false, devTools: EM_TESTE,
      },
    });
    let fim = false;
    const terminar = (escolha) => {
      if (fim) return;
      fim = true;
      ipcMain.removeListener('seletor-escolha', aoEscolher);
      if (!seletor.isDestroyed()) seletor.destroy();
      resolver(escolha || null);
    };
    const aoEscolher = (e, x) => {
      if (e.sender !== seletor.webContents) return;
      const fonte = x && typeof x.id === 'string' ? lista.find((f) => f.id === x.id) : null;
      if (!fonte) return terminar(null);
      const modo = ['janela', 'programa', 'sistema', 'nenhum'].includes(x.modo) ? x.modo : 'sistema';
      const pid = Number.isInteger(x.pid) ? x.pid : null;
      if (comSom) {
        const exe = modo === 'programa' ? programas?.find((p) => p.pid === pid)?.exe : undefined;
        const prefs = lerPrefs();
        guardarPrefs({ ...prefs, som: { modo, exe: exe || prefs.som?.exe || '' } });
      }
      terminar({ fonte, modo, pid });
    };
    ipcMain.on('seletor-escolha', aoEscolher);
    seletor.on('closed', () => terminar(null));
    seletor.webContents.once('did-finish-load', () => {
      aplicarTemaLocal(seletor.webContents);
      seletor.webContents.send('fontes', {
        comSom,
        programas,
        janelas,
        preferencia: lerPrefs().som || null,
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

// A captura caiu: o próximo pedido de tela (nos próximos 8 s) pega a mesma tela ou janela
ipcMain.handle('retomar-tela', (e) => {
  if (!pedidoConfiavel(e) || !ultimaEscolha) return { ok: false };
  retomada = Date.now() + 8000;
  return { ok: true };
});

// Falhas do programa: a página manda para o registro de erros do admin
const FALHAS = [];
function registrarFalha(onde, d) {
  if (!d || d.reason === 'clean-exit') return;
  FALHAS.push({ onde, nome: String(d.serviceName || d.name || '').slice(0, 60), motivo: String(d.reason || '').slice(0, 40), codigo: Number(d.exitCode) || 0, quando: Date.now() });
  if (FALHAS.length > 10) FALHAS.shift();
  console.warn('[falha]', onde, d.reason, d.exitCode);
}
app.on('child-process-gone', (_e, d) => {
  const onde = d.type === 'GPU' ? 'placa de vídeo' : d.type === 'Utility' ? 'serviço' : String(d.type || 'processo');
  registrarFalha(onde, d);
});
ipcMain.handle('falhas', (e) => (pedidoConfiavel(e) ? FALHAS.splice(0) : []));

// Placa de vídeo: nome e se ela pode codificar vídeo (a transmissão fica muito mais leve quando pode)
let placaGuardada = null;
ipcMain.handle('placa', (e) => {
  if (!pedidoConfiavel(e)) return null;
  placaGuardada ||= (async () => {
    const estado = app.getGPUFeatureStatus?.() || {};
    let info = null;
    try { info = await Promise.race([app.getGPUInfo('complete'), espera(10000).then(() => null)]); } catch { info = null; }
    const placas = Array.isArray(info?.gpuDevice) ? info.gpuDevice : [];
    const ativa = placas.find((d) => d.active) || placas[0] || {};
    const fabricante = { 4318: 'NVIDIA', 4098: 'AMD', 32902: 'Intel', 5140: 'Microsoft' }[ativa.vendorId] || '';
    const nome = String(ativa.deviceString || '').trim() || (fabricante ? `${fabricante} (modelo ${Number(ativa.deviceId || 0).toString(16)})` : '');
    return {
      nome: nome.slice(0, 80),
      driver: String(ativa.driverVersion || '').slice(0, 30),
      codificacao: String(estado.video_encode || ''),
      codecs: R.formatosDosPerfis(info?.videoEncodeAcceleratorSupportedProfile),
      outras: placas.length,
    };
  })().catch(() => null);
  return placaGuardada;
});
ipcMain.handle('atalhos', (e, lista) => (pedidoConfiavel(e) ? registrarAtalhos(lista) : { ok: [], falhou: [] }));

ipcMain.handle('aparencia', (e, dados) => {
  if (!pedidoConfiavel(e)) return false;
  const tema = R.validarTema(dados);
  if (!tema) return false;
  const prefs = lerPrefs();
  if (JSON.stringify(prefs.aparencia) !== JSON.stringify(tema)) guardarPrefs({ ...prefs, aparencia: tema });
  return true;
});

// ---------- Som de um programa só (pelo ajudante som-programa.exe) ----------
// A página chama logo depois do seletor. O som chega por um canal (MessagePort) direto na página.
ipcMain.handle('som-do-programa', async (e, taxa) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  const esc = escolhaDeSom;
  escolhaDeSom = null;
  if (!esc || Date.now() - esc.quando > 60000) return { ok: false };
  if (esc.modo !== 'janela' && esc.modo !== 'programa') return { ok: false, modo: esc.modo };
  const t = Number(taxa);
  if (!Number.isInteger(t) || t < 8000 || t > 192000) return { ok: false, erro: 'Taxa de som inválida.' };
  const r = await ajudante.capturar(esc.pid, t);
  return r.ok ? { ok: true, id: r.id, nome: esc.nome, modo: esc.modo, voz: /discord|whatsapp|teams|zoom|skype|telegram/i.test(esc.exe || '') } : { ok: false, erro: r.erro };
});
ipcMain.handle('parar-som-do-programa', (e, id) => {
  if (pedidoConfiavel(e) && Number.isInteger(id)) ajudante.parar(id);
  return true;
});
ipcMain.on('som-porta', (e) => {
  const porta = e.ports?.[0];
  if (!porta) return;
  if (!pedidoConfiavel(e)) {
    porta.close();
    return;
  }
  ajudante.anexarPorta(porta);
});

// ---------- Apertar-para-falar que funciona até dentro do jogo ----------
// O ajudante vigia só a tecla escolhida e avisa quando ela é apertada e solta.
ipcMain.handle('ptt', (e, atalho) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  if (atalho === null) {
    ajudante.soltarTecla();
    return { ok: true };
  }
  const t = R.teclaDoPtt(atalho);
  if (!t) return { ok: false, erro: 'Essa tecla não pode ser usada.' };
  return ajudante.vigiarTecla(R.argumentosDoPtt(t), (apertado) => {
    if (janela && !janela.isDestroyed()) janela.webContents.send('ptt', apertado === true);
  });
});

// ---------- Caneta: desenhos de quem assiste por cima da tela de verdade ----------
// Uma janela transparente, que não recebe cliques, fica sempre no topo e FORA da captura da tela
// (assim quem assiste não vê o desenho em dobro). Precisa do Windows 10 versão 2004 ou mais novo:
// nos antigos a janela apareceria preta na transmissão, então lá os desenhos ficam só no site.
let fonteDaTela = null; // { tipo: 'tela', displayId } ou { tipo: 'janela', hwnd }
let tinta = null; // { win, pronta, vigia, timer, querVer, posicionada }
const BUILD_WINDOWS = process.platform === 'win32' ? Number(os.release().split('.')[2]) || 0 : 0;
const CANETA_POR_CIMA = BUILD_WINDOWS >= 19041;

function mostrarOuEsconderTinta(t) {
  if (t.win.isDestroyed()) return;
  if (t.querVer && t.posicionada) {
    if (!t.win.isVisible()) {
      t.win.setContentProtection(t.protegida); // reforça a cada vez que aparece
      t.win.showInactive();
      t.win.setAlwaysOnTop(true, 'screen-saver');
      t.win.moveTop();
    }
  } else if (t.win.isVisible()) {
    t.win.hide();
  }
}
// Por que a camada não pode aparecer (ou null se pode)
function motivoSemCamada() {
  if (process.platform !== 'win32') return 'Só funciona no Windows.';
  if (!CANETA_POR_CIMA) return `Precisa do Windows 10 versão 2004 ou mais novo (o seu é o build ${BUILD_WINDOWS}). Os desenhos aparecem só no site.`;
  if (!fonteDaTela) return 'O programa não sabe o que você está compartilhando. Pare a transmissão e compartilhe de novo.';
  if (fonteDaTela.tipo === 'janela' && !ajudante.caminho()) return 'Falta o ajudante do programa para acompanhar a janela. Reinstale o programa.';
  return null;
}
function garantirTinta() {
  if (tinta && !tinta.win.isDestroyed()) return tinta;
  if (motivoSemCamada() || !janela || janela.isDestroyed()) return null;
  const win = new BrowserWindow({
    show: false, frame: false, transparent: true, backgroundColor: '#00000000', title: 'Caneta',
    resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
    focusable: false, skipTaskbar: true, hasShadow: false, alwaysOnTop: true, thickFrame: false,
    webPreferences: {
      partition: 'caras-seletor', preload: path.join(__dirname, 'preload-tinta.js'),
      sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false, devTools: false, backgroundThrottling: false,
    },
  });
  win.setIgnoreMouseEvents(true); // os cliques passam direto para o jogo ou programa embaixo
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setContentProtection(true); // fora da captura da tela
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  const t = { win, pronta: win.loadFile(tela('tinta.html')).catch(() => {}), vigia: null, timer: null, querVer: false, posicionada: false, protegida: true, onde: '' };
  tinta = t;
  win.on('closed', () => {
    t.vigia?.parar();
    clearTimeout(t.timer);
    if (tinta === t) tinta = null;
  });
  const f = fonteDaTela;
  if (f.tipo === 'tela') {
    const telas = screen.getAllDisplays();
    const d = telas.find((x) => String(x.id) === f.displayId) || screen.getPrimaryDisplay();
    win.setBounds(d.bounds);
    t.posicionada = true;
    t.onde = telas.length > 1 ? `no meio da tela ${telas.indexOf(d) + 1} (de ${telas.length}), a que você está compartilhando` : 'no meio da sua tela';
  } else {
    // janela: o ajudante avisa onde ela está (e se foi minimizada ou fechada)
    t.vigia = ajudante.vigiarJanela(f.hwnd, (r) => {
      if (tinta !== t || win.isDestroyed()) return;
      if (r.fechada || r.min || !r.vis || r.w < 80 || r.h < 60) {
        t.posicionada = false;
        t.onde = r.fechada ? 'a janela compartilhada foi fechada' : 'a janela compartilhada está minimizada ou escondida';
      } else {
        t.onde = 'no meio da janela que você está compartilhando';
        const fisico = { x: r.x, y: r.y, width: r.w, height: r.h };
        win.setBounds(process.platform === 'win32' ? screen.screenToDipRect(null, fisico) : fisico);
        t.posicionada = true;
      }
      mostrarOuEsconderTinta(t);
    });
    if (!t.vigia) {
      win.destroy();
      return null;
    }
  }
  return t;
}
function fecharTinta() {
  const t = tinta;
  tinta = null;
  if (!t) return;
  t.vigia?.parar();
  clearTimeout(t.timer);
  if (!t.win.isDestroyed()) t.win.destroy();
}
ipcMain.handle('tinta', async (e, d) => {
  if (!pedidoConfiavel(e)) return { ok: false, motivo: 'pedido recusado' };
  if (d === null) { // parou de transmitir
    fecharTinta();
    fonteDaTela = null;
    return { ok: true };
  }
  const traco = R.validarTraco(d);
  if (!traco) return { ok: false, motivo: 'traço inválido' };
  const t = garantirTinta();
  if (!t) return { ok: false, motivo: motivoSemCamada() || 'a camada não abriu' };
  await t.pronta;
  if (t.win.isDestroyed()) return { ok: false, motivo: 'a camada fechou' };
  t.win.webContents.send('tinta', traco);
  t.querVer = true;
  mostrarOuEsconderTinta(t);
  // some da tela um tempo depois do último traço (3 s inteiro + esmaecer + folga):
  // assim a camada não fica por cima do jogo à toa
  clearTimeout(t.timer);
  t.timer = setTimeout(() => { t.querVer = false; mostrarOuEsconderTinta(t); }, 6000);
  return { ok: true, onde: t.onde, visivel: t.win.isVisible() };
});
// Estado da camada, para o painel da caneta mostrar (e ajudar a descobrir problemas)
ipcMain.handle('tinta-estado', (e) => {
  if (!pedidoConfiavel(e)) return null;
  return {
    versao: app.getVersion(),
    windows: BUILD_WINDOWS,
    telas: screen.getAllDisplays().length,
    fonte: fonteDaTela ? fonteDaTela.tipo : null,
    motivo: motivoSemCamada(),
    onde: tinta && !tinta.win.isDestroyed() ? tinta.onde : '',
  };
});

// ---------- Avisos por cima do jogo ----------
// Uma janelinha no canto de baixo da tela onde está o mouse (a do jogo), que não recebe cliques
// nem foco e fica fora da transmissão. Aparece só quando o programa não está na frente, e some
// sozinha. Num jogo em "tela cheia exclusiva" o Windows não deixa nada por cima: lá só pisca
// o ícone na barra de tarefas (nas menções). Em "janela sem bordas" aparece normalmente.
const AVISO_L = 360;
const AVISO_A = 300;
let aviso = null; // { win, pronta, timer }
function garantirAviso() {
  if (aviso && !aviso.win.isDestroyed()) return aviso;
  const win = new BrowserWindow({
    show: false, frame: false, transparent: true, backgroundColor: '#00000000', title: 'Avisos',
    width: AVISO_L, height: AVISO_A,
    resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
    focusable: false, skipTaskbar: true, hasShadow: false, alwaysOnTop: true, thickFrame: false,
    webPreferences: {
      partition: 'caras-seletor', preload: path.join(__dirname, 'preload-aviso.js'),
      sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false, devTools: false, backgroundThrottling: false,
    },
  });
  win.setIgnoreMouseEvents(true); // os cliques passam direto para o jogo
  win.setAlwaysOnTop(true, 'screen-saver');
  if (CANETA_POR_CIMA) win.setContentProtection(true); // quem assiste a sua tela não vê o aviso
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  const a = { win, pronta: win.loadFile(tela('aviso.html')).catch(() => {}), timer: null };
  aviso = a;
  win.on('closed', () => {
    clearTimeout(a.timer);
    if (aviso === a) aviso = null;
  });
  return a;
}
function fecharAviso() {
  const a = aviso;
  aviso = null;
  if (a && !a.win.isDestroyed()) a.win.destroy();
}
ipcMain.handle('aviso', async (e, d) => {
  if (!pedidoConfiavel(e)) return { ok: false, motivo: 'pedido recusado' };
  const av = R.validarAviso(d);
  if (!av) return { ok: false, motivo: 'aviso inválido' };
  if (!janela || janela.isDestroyed()) return { ok: false, motivo: 'sem janela' };
  const naFrente = janela.isVisible() && !janela.isMinimized() && janela.isFocused();
  if (av.piscar && !naFrente) janela.flashFrame(true); // para quando a pessoa abre o programa
  if (naFrente && av.tipo !== 'teste') return { ok: true, mostrado: false };
  const a = garantirAviso();
  await a.pronta;
  if (a.win.isDestroyed()) return { ok: false, motivo: 'a janelinha fechou' };
  if (!a.win.isVisible()) {
    const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
    a.win.setBounds({ x: area.x + area.width - AVISO_L - 8, y: area.y + area.height - AVISO_A - 8, width: AVISO_L, height: AVISO_A });
  }
  a.win.webContents.send('aviso', av);
  if (!a.win.isVisible()) a.win.showInactive();
  a.win.setAlwaysOnTop(true, 'screen-saver');
  a.win.moveTop();
  // cada aviso fica 6 s; a janelinha some um pouco depois do último
  clearTimeout(a.timer);
  a.timer = setTimeout(() => { if (!a.win.isDestroyed()) a.win.hide(); }, 7000);
  return { ok: true, mostrado: true };
});

// ---------- Jogando agora ----------
// Só roda se a pessoa deixou (opção no site). A cada 20 s o ajudante lista os programas com janela;
// o nome do jogo (ou nada) vai para a página, que avisa o servidor quando muda.
const JOGO = { ligado: false, timer: null, atual: null };
async function conferirJogo() {
  if (!JOGO.ligado || !janela || janela.isDestroyed()) return;
  const lista = await ajudante.jogos();
  const nome = lista ? R.jogoAtual(lista) : null;
  if (nome !== JOGO.atual && janela && !janela.isDestroyed()) {
    JOGO.atual = nome;
    janela.webContents.send('jogo', nome);
  }
}
// ---------- Lances: os últimos 30 s de uma transmissão, salvos numa pasta do computador ----------
// Nada disso vai para o servidor: o vídeo sai da página direto para a pasta (Vídeos\Caras E Telas).
let ultimoLance = null;
const arqDaPastaDosLances = () => path.join(app.getPath('userData'), 'pasta-dos-lances.json');
function pastaDosLances() {
  if (TESTE_RAPIDO) return path.join(os.tmpdir(), 'caras-e-telas-teste-lances');
  try {
    const p = JSON.parse(fs.readFileSync(arqDaPastaDosLances(), 'utf8')).pasta;
    if (typeof p === 'string' && path.isAbsolute(p)) return p;
  } catch { /* ainda não escolheu: usa a padrão */ }
  return path.join(app.getPath('videos'), 'Caras E Telas');
}
// "Vídeos\Caras E Telas" em vez do caminho inteiro (que tem o nome do usuário do Windows)
function rotuloDaPasta(p) {
  const videos = app.getPath('videos');
  return p.toLowerCase().startsWith(videos.toLowerCase()) ? `Vídeos${p.slice(videos.length)}` : p;
}
ipcMain.handle('salvar-lance', async (e, d) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  const l = R.validarLance(d);
  if (!l) return { ok: false, motivo: 'O vídeo veio estragado.' };
  const pasta = pastaDosLances();
  try {
    await fs.promises.mkdir(pasta, { recursive: true });
    let arq = path.join(pasta, `${l.base}.${l.ext}`);
    for (let n = 2; fs.existsSync(arq) && n < 100; n++) arq = path.join(pasta, `${l.base} (${n}).${l.ext}`);
    await fs.promises.writeFile(arq, l.dados, { flag: 'wx' });
    ultimoLance = arq;
    return { ok: true, arquivo: path.basename(arq), pasta: rotuloDaPasta(pasta) };
  } catch {
    return { ok: false, motivo: `Não consegui salvar em ${rotuloDaPasta(pasta)}. Escolha outra pasta.` };
  }
});
ipcMain.handle('abrir-pasta-dos-lances', async (e) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  if (TESTE_RAPIDO) return { ok: true };
  if (ultimoLance && fs.existsSync(ultimoLance)) { shell.showItemInFolder(ultimoLance); return { ok: true }; }
  const pasta = pastaDosLances();
  await fs.promises.mkdir(pasta, { recursive: true }).catch(() => {});
  return { ok: !(await shell.openPath(pasta)) };
});
ipcMain.handle('escolher-pasta-dos-lances', async (e) => {
  if (!pedidoConfiavel(e) || TESTE_RAPIDO) return { ok: false };
  const r = await dialog.showOpenDialog(janela, { title: 'Onde salvar os lances', defaultPath: pastaDosLances(), properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  try { fs.writeFileSync(arqDaPastaDosLances(), JSON.stringify({ pasta: r.filePaths[0] })); } catch { return { ok: false }; }
  ultimoLance = null;
  return { ok: true, pasta: rotuloDaPasta(r.filePaths[0]) };
});
ipcMain.handle('pasta-dos-lances', (e) => (pedidoConfiavel(e) ? { pasta: rotuloDaPasta(pastaDosLances()) } : null));

// ---------- Jogatina: o jogador 2 joga no computador de quem transmite ----------
// A página (de quem transmite) recebe os comandos do jogador 2 pelo canal direto e manda para cá.
// Aqui passam de novo pelas regras (só o que foi permitido, sem tecla Windows nem Alt+Tab) e vão
// para o controle-programa.exe. Quem transmite pode cortar tudo a qualquer hora.
let coopPerm = null;
let coopEstado = R.novoEstadoCoop();
let coopFonte = null;
coop.aoAviso((t) => { if (janela && !janela.isDestroyed()) janela.webContents.send('coop-aviso', t); });
ipcMain.handle('coop-ligar', async (e, p) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  if (process.platform !== 'win32') return { ok: false, motivo: 'O jogador 2 só funciona no Windows.' };
  if (!fonteDaTela) return { ok: false, motivo: 'Compartilhe a janela do jogo (ou a tela) antes.' };
  coopPerm = R.permissoesCoop(p);
  coopEstado = R.novoEstadoCoop();
  coopFonte = fonteDaTela;
  return coop.ligar(fonteDaTela, coopPerm.controle);
});
ipcMain.handle('coop-permissoes', async (e, p) => {
  if (!pedidoConfiavel(e) || !coopPerm) return { ok: false };
  const antes = coopPerm;
  coopPerm = R.permissoesCoop(p);
  coop.enviar(['solta']); // o que estava apertado com a permissão antiga é solto
  coopEstado = R.novoEstadoCoop();
  let pad = antes.controle;
  if (antes.controle !== coopPerm.controle) pad = await coop.controleVirtual(coopPerm.controle);
  return { ok: true, pad };
});
ipcMain.on('coop-entrada', (e, lista) => {
  if (!coopPerm || !Array.isArray(lista) || !pedidoConfiavel(e)) return;
  const linhas = [];
  if (fonteDaTela !== coopFonte) {
    // trocou o que está sendo compartilhado: o jogador 2 acompanha (e nada fica apertado)
    coopFonte = fonteDaTela;
    linhas.push('solta');
    const alvo = coop.linhaDoAlvo(fonteDaTela);
    if (!alvo) { coop.enviar(linhas); return; }
    linhas.push(alvo);
  }
  for (const ev of lista.slice(0, 200)) {
    const l = R.linhaDeCoop(ev, coopPerm, coopEstado);
    if (l) linhas.push(l);
  }
  coop.enviar(linhas);
});
ipcMain.handle('coop-desligar', (e) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  coopPerm = null;
  coop.desligar();
  return { ok: true };
});
app.on('will-quit', () => coop.desligar());

ipcMain.handle('jogos', (e, ligar) => {
  if (!pedidoConfiavel(e)) return { ok: false };
  JOGO.ligado = ligar === true;
  clearInterval(JOGO.timer);
  JOGO.timer = null;
  JOGO.atual = null;
  if (JOGO.ligado) {
    if (!ajudante.caminho()) return { ok: false, motivo: 'Falta o ajudante do programa. Reinstale o programa.' };
    JOGO.timer = setInterval(() => conferirJogo().catch(() => {}), 20000);
    conferirJogo().catch(() => {});
  }
  return { ok: true };
});

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
    if (!atual.startsWith('file:')) await abrirTelaLocal('carregando.html');
    for (;;) {
      if (!janela || janela.isDestroyed()) return;
      if (await siteRespondendo(janela.webContents.session)) {
        try {
          await janela.loadURL(SITE);
          return;
        } catch (e) {
          if (e?.code === 'ERR_ABORTED' && R.origemDe(janela.webContents.getURL()) === SITE_ORIGEM) return;
          if (!janela || janela.isDestroyed()) return;
          await abrirTelaLocal(mostrouErro ? 'erro.html' : 'carregando.html');
        }
      }
      if (!mostrouErro && Date.now() - inicio > 90000) {
        mostrouErro = true;
        await abrirTelaLocal('erro.html');
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
    backgroundColor: corDeFundo(), title: 'Caras E Telas', show: false, autoHideMenuBar: true,
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
  janela.on('close', () => { fechandoJanela = Date.now(); });
  janela.on('query-session-end', () => { saindoDeVez = true; }); // Windows desligando: não segura
  janela.on('session-end', () => { saindoDeVez = true; });
  janela.on('focus', () => { if (janela && !janela.isDestroyed()) janela.flashFrame(false); });
  janela.on('closed', () => {
    janela = null;
    ajudante.parar();
    ajudante.soltarTecla();
    fecharTinta();
    fecharAviso();
    clearInterval(JOGO.timer); JOGO.timer = null; JOGO.ligado = false;
  });

  const wc = janela.webContents;
  vigiarDownloads(wc.session);
  wc.on('did-fail-load', (_e, codigo, _desc, url, principal) => {
    if (!principal || codigo === -3) return;
    if (R.origemDe(url) === SITE_ORIGEM) acordarEAbrir();
  });
  wc.on('did-start-navigation', (d) => {
    if (!d.isMainFrame || d.isSameDocument) return;
    globalShortcut.unregisterAll(); // a página nova registra de novo
    ajudante.parar(); // e o som de programa que estava indo para a página antiga
    ajudante.soltarTecla(); // e a tecla do apertar-para-falar
    fecharTinta(); // e a camada da caneta
    fonteDaTela = null;
  });
  wc.on('render-process-gone', (_e, d) => {
    registrarFalha('página', d);
    setTimeout(() => janela && acordarEAbrir(), 1000);
  });
  // A página pede confirmação (está transmitindo): pergunta aqui, porque o Electron não pergunta sozinho
  wc.on('will-prevent-unload', (e) => {
    perguntasAoSair++;
    if (saindoDeVez || TESTE_RAPIDO) { e.preventDefault(); return; }
    const fechar = Date.now() - fechandoJanela < 3000;
    const r = dialog.showMessageBoxSync(janela, {
      type: 'warning',
      buttons: [fechar ? 'Fechar mesmo assim' : 'Recarregar mesmo assim', 'Continuar transmitindo'],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
      title: 'Caras E Telas',
      message: 'Você está transmitindo a sua tela.',
      detail: fechar ? 'Fechar o programa agora para a transmissão para todo mundo.' : 'Recarregar agora para a transmissão para todo mundo.',
    });
    fechandoJanela = 0;
    if (r === 0) e.preventDefault(); // deixa sair
  });

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
  let avisou = '';
  autoUpdater.on('update-downloaded', async (info) => {
    const versao = String(info?.version || '');
    if (avisou === versao || !janela || janela.isDestroyed()) return;
    avisou = versao; // avisa de novo se chegar outra versão mais nova depois
    const { response } = await dialog.showMessageBox(janela, {
      type: 'info',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
      title: 'Caras E Telas',
      message: `A versão ${info?.version || 'nova'} do Caras E Telas está pronta.`,
      detail: 'Reinicie para atualizar. Se escolher "Depois", ela é instalada quando você fechar o programa.',
    });
    if (response === 0) setImmediate(() => { saindoDeVez = true; autoUpdater.quitAndInstall(true, true); });
  });
  const verificar = () => autoUpdater.checkForUpdates().catch(() => {});
  verificarAtualizacao = verificar;
  setTimeout(verificar, 15000);
  setInterval(verificar, 30 * 60 * 1000); // a cada 30 minutos
}
// O site avisa quando sabe que tem versão nova: aí o programa procura na hora (no máximo a cada 5 min)
let verificarAtualizacao = null;
let ultimaBusca = 0;
ipcMain.handle('buscar-atualizacao', (e) => {
  if (!pedidoConfiavel(e) || !verificarAtualizacao || Date.now() - ultimaBusca < 5 * 60e3) return false;
  ultimaBusca = Date.now();
  verificarAtualizacao();
  return true;
});

// Caneta no teste do GitHub:
//  1) uma janela vermelha comum aparece na captura (prova que o teste enxerga a tela);
//  2) a camada pintada de vermelho, SEM a proteção, aparece (prova que ela é desenhada no monitor);
//  3) COM a proteção, some da captura, inclusive depois de esconder e mostrar de novo;
//  4) no modo janela, a camada fica exatamente em cima da janela compartilhada.
async function testarCaneta() {
  if (!CANETA_POR_CIMA) return { windows: BUILD_WINDOWS, resultado: 'Windows antigo: desenhos só no site' };
  const d = screen.getPrimaryDisplay();
  const corEm = async (fx, fy) => {
    const fontes = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 320, height: 180 } });
    const f = fontes.find((x) => String(x.display_id) === String(d.id)) || fontes[0];
    if (!f || f.thumbnail.isEmpty()) return null;
    const { width, height } = f.thumbnail.getSize();
    const bmp = f.thumbnail.toBitmap(); // BGRA
    const i = (Math.floor(height * fy) * width + Math.floor(width * fx)) * 4;
    return [bmp[i + 2], bmp[i + 1], bmp[i]];
  };
  const vermelho = (c) => !!c && c[0] > 180 && c[1] < 80 && c[2] < 80;
  const r = { windows: BUILD_WINDOWS };
  const pintar = async (t, ligar) => { t.win.webContents.send('tinta-teste', ligar); await espera(1200); };

  // 1) controle
  const controle = new BrowserWindow({ show: false, frame: false, backgroundColor: '#ff0000', focusable: false, skipTaskbar: true, ...d.bounds });
  controle.setAlwaysOnTop(true, 'screen-saver');
  controle.showInactive();
  await espera(1500);
  r.controle = vermelho(await corEm(0.5, 0.5)) ? 'aparece na captura' : 'não apareceu (teste inconclusivo)';
  controle.destroy();
  await espera(600);

  // 2) e 3) a camada da tela inteira
  fonteDaTela = { tipo: 'tela', displayId: String(d.id) };
  let t = garantirTinta();
  if (!t) return { ...r, resultado: 'a camada não abriu' };
  await t.pronta;
  t.protegida = false;
  t.win.setContentProtection(false);
  t.querVer = true;
  mostrarOuEsconderTinta(t);
  await pintar(t, true);
  r.camadaNoMonitor = vermelho(await corEm(0.5, 0.5)) ? 'desenhada no monitor' : 'NÃO aparece no monitor';
  t.protegida = true;
  t.win.setContentProtection(true);
  await espera(1200);
  r.camada = vermelho(await corEm(0.5, 0.5)) ? 'APARECE na captura' : 'fora da captura';
  t.querVer = false;
  mostrarOuEsconderTinta(t);
  await espera(500);
  t.querVer = true;
  mostrarOuEsconderTinta(t);
  await espera(1200);
  r.camadaDepoisDeReaparecer = vermelho(await corEm(0.5, 0.5)) ? 'APARECE na captura' : 'fora da captura';
  r.camadaVisivel = t.win.isVisible();
  await pintar(t, false);
  t.win.webContents.send('tinta', R.validarTraco({ tr: 'teste1', c: 0, p: [[0.4, 0.5], [0.6, 0.5]], fim: true, nome: 'Teste' }));
  await espera(400);
  r.tracoPintou = await t.win.webContents.executeJavaScript(`(() => { const c = document.getElementById('tinta');
    const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i]) n++; return n; })()`);
  fecharTinta();

  // 4) modo janela: uma janela azul de teste fazendo o papel do jogo
  const b = d.workArea;
  const alvo = new BrowserWindow({ show: false, frame: false, backgroundColor: '#0050ff', focusable: false, skipTaskbar: true,
    x: b.x + Math.round(b.width * 0.1), y: b.y + Math.round(b.height * 0.15), width: Math.round(b.width * 0.5), height: Math.round(b.height * 0.5) });
  alvo.showInactive();
  await espera(600);
  fonteDaTela = { tipo: 'janela', hwnd: alvo.getNativeWindowHandle().readUInt32LE(0) };
  t = garantirTinta();
  if (t) {
    await t.pronta;
    t.protegida = false;
    t.win.setContentProtection(false);
    t.querVer = true;
    await espera(1000); // o ajudante avisa onde a janela está
    mostrarOuEsconderTinta(t);
    await pintar(t, true);
    const ba = alvo.getBounds();
    const bt = t.win.getBounds();
    r.janelaPosicao = Math.abs(ba.x - bt.x) <= 2 && Math.abs(ba.y - bt.y) <= 2 && Math.abs(ba.width - bt.width) <= 4 && Math.abs(ba.height - bt.height) <= 4
      ? 'em cima da janela' : `fora do lugar (janela ${JSON.stringify(ba)}, camada ${JSON.stringify(bt)})`;
    const cx = (ba.x - d.bounds.x + ba.width / 2) / d.bounds.width;
    const cy = (ba.y - d.bounds.y + ba.height / 2) / d.bounds.height;
    r.janelaNoMonitor = vermelho(await corEm(cx, cy)) ? 'desenhada no monitor' : 'NÃO aparece no monitor';
    fecharTinta();
  } else {
    r.janelaPosicao = 'a camada não abriu';
  }
  alvo.destroy();
  fonteDaTela = null;
  return r;
}

// ---------- Teste rápido (o GitHub roda o programa uma vez antes de publicar) ----------
// Janela recriada (como um jogo que troca de modo de tela): fecha o Bloco de Notas no meio da
// captura e abre outro com o mesmo nome; a retomada tem que achar o novo e, sem ele, recusar.
async function testarRetomadaDeJanela(js) {
  const { spawn, execFileSync } = require('node:child_process');
  const matar = () => { try { execFileSync('taskkill', ['/IM', 'notepad.exe', '/F'], { stdio: 'ignore' }); } catch { /* ok */ } };
  const abrir = () => { try { spawn('notepad.exe', [], { detached: true, stdio: 'ignore' }).unref(); } catch { /* ok */ } };
  const acharBloco = async () => {
    for (let i = 0; i < 20; i++) {
      const fs = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 } });
      const f = fs.find((x) => /notepad|bloco de notas/i.test(x.name));
      if (f) return f;
      await espera(500);
    }
    return null;
  };
  matar();
  abrir();
  const primeira = await acharBloco();
  if (!primeira) { matar(); return { disponivel: false }; }
  const r = { disponivel: true, nome: primeira.name };
  escolhaDeTeste = (f) => f.id === primeira.id;
  r.captura = await js("navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then((s) => { window.__teste = s; return 'ok'; }, (e) => 'erro: ' + e.name)", true);
  escolhaDeTeste = null;
  await espera(1500);
  matar();
  r.depoisDeFechar = await js(`new Promise((ok) => { const t = window.__teste && window.__teste.getVideoTracks()[0]; if (!t) return ok('sem captura');
    if (t.readyState === 'ended') return ok('acabou'); t.addEventListener('ended', () => ok('acabou')); setTimeout(() => ok('continuou (' + t.readyState + ')'), 8000); })`);
  abrir();
  const segunda = await acharBloco();
  r.reabriu = segunda ? (segunda.id === primeira.id ? 'mesmo id' : 'outro id') : 'não reabriu';
  r.pedido = await js('window.carasETelas.retomarTela()');
  r.retomada = await js("navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then((s) => { const x = s.getVideoTracks()[0]?.readyState; s.getTracks().forEach((t) => t.stop()); return x; }, (e) => 'erro: ' + e.name)", true);
  r.como = ultimaRetomada;
  matar();
  await espera(1500);
  await js('window.carasETelas.retomarTela()');
  r.semJanela = await js("navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then((s) => { s.getTracks().forEach((t) => t.stop()); return 'pegou outra coisa'; }, (e) => 'recusou: ' + e.name)", true);
  r.comoSemJanela = ultimaRetomada;
  await js('window.__teste && window.__teste.getTracks().forEach((t) => t.stop()); 1');
  return r;
}

async function testeRapido() {
  const r = { versao: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, site: SITE };
  const gravar = (codigo) => {
    r.passo = 'fim';
    try { fs.writeFileSync(TESTE_RAPIDO, JSON.stringify(r, null, 2)); } catch (e) { console.error(e); }
    coop.desligar();
    app.exit(codigo);
  };
  setTimeout(() => { r.erro = 'tempo esgotado'; gravar(2); }, 240000);
  try {
    for (;;) {
      if (janela && R.origemDe(janela.webContents.getURL()) === SITE_ORIGEM && !janela.webContents.isLoading()) break;
      await espera(500);
    }
    // anota o passo atual no arquivo do resultado: se algo travar, o teste mostra onde parou
    const marcar = (passo) => { r.passo = passo; try { fs.writeFileSync(TESTE_RAPIDO, JSON.stringify(r, null, 2)); } catch { /* segue */ } };
    const js = (codigo, gesto = false) => { marcar(codigo.slice(0, 90)); return janela.webContents.executeJavaScript(codigo, gesto); };
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
    // a captura caiu: a página pede a mesma fonte e o programa entrega sem abrir o seletor
    r.retomarTela = await js('window.carasETelas.retomarTela()');
    r.retomadaTela = await capturar('false').then((x) => (x && typeof x === 'object' && x.video === 1 ? ultimaRetomada : `erro: ${JSON.stringify(x)}`));
    r.retomadaJanela = await testarRetomadaDeJanela(js).catch((e) => ({ erro: String(e?.message || e) }));
    await capturar('false'); // volta a escolher a tela inteira (a caneta, abaixo, usa a última escolha)
    r.falhas = await js('window.carasETelas.falhas()');
    r.placa = await js('window.carasETelas.placa()');
    // microfone e câmera liberados para o site (com aparelhos de mentira)
    const midia = (c) => js(`navigator.mediaDevices.getUserMedia(${c}).then((s) => { const n = s.getTracks().map((t) => t.kind).join(','); s.getTracks().forEach((t) => t.stop()); return 'ok: ' + n; }, (e) => e.name)`, true);
    r.microfone = await midia('{ audio: true }');
    r.camera = await midia('{ video: true }');
    // aviso por cima do jogo: a janelinha abre (o teste aparece mesmo com o programa na frente)
    r.aviso = await js(`window.carasETelas.aviso({ tipo: 'teste', nome: 'Teste', cor: '#3db3f0', texto: 'entrou na Sala 1' })`, true).catch((e) => ({ erro: String(e?.message || e) }));
    r.jogos = await js(`window.carasETelas.jogos(true)`, true).catch((e) => ({ erro: String(e?.message || e) }));
    await js(`window.carasETelas.jogos(false)`, true).catch(() => {});
    r.avisoRuim = await js(`window.carasETelas.aviso({ tipo: 'qualquer', nome: 'x' })`, true).catch((e) => ({ erro: String(e?.message || e) }));
    // lance: grava na pasta (no teste, uma pasta temporária) e recusa o que não é vídeo
    r.lance = await js(`(() => { const b = new Uint8Array(64); b.set([0, 0, 0, 32, 102, 116, 121, 112]); return window.carasETelas.salvarLance({ dados: b, quem: 'Teste <1>', tipo: 'video/mp4' }); })()`, true).catch((e) => ({ erro: String(e?.message || e) }));
    r.lanceRuim = await js(`window.carasETelas.salvarLance({ dados: new Uint8Array(64), quem: 'x', tipo: 'video/mp4' })`, true).catch((e) => ({ erro: String(e?.message || e) }));
    r.coop = await js(`window.carasETelas.coop.ligar({ controle: true, teclado: true, mouse: false })`, true).catch((e) => ({ erro: String(e?.message || e) }));
    await js(`window.carasETelas.coop.desligar()`, true).catch(() => {});
    r.lanceNoDisco = r.lance?.ok && fs.existsSync(path.join(pastaDosLances(), r.lance.arquivo)) ? fs.statSync(path.join(pastaDosLances(), r.lance.arquivo)).size : 0;
    fs.rmSync(pastaDosLances(), { recursive: true, force: true });
    // saídas de áudio: a lista aparece e dá para trocar
    r.saidas = await js(`navigator.mediaDevices.enumerateDevices().then(async (ds) => {
      const saidas = ds.filter((d) => d.kind === 'audiooutput');
      const outra = saidas.find((d) => d.deviceId && d.deviceId !== 'default');
      const trocar = (alvo, id) => alvo.setSinkId(id).then(() => 'ok', (e) => e.name);
      return {
        quantas: saidas.length,
        comNome: saidas.filter((d) => d.label).length,
        elemento: await trocar(new Audio(), outra ? outra.deviceId : ''),
        contexto: typeof AudioContext.prototype.setSinkId === 'function' ? await trocar(new AudioContext(), outra ? outra.deviceId : '') : 'sem setSinkId',
      };
    })`, true);
    // a página repassa um traço (a tela já foi escolhida acima, na captura) e depois encerra
    r.canetaPagina = await js("window.carasETelas.tinta({ tr: 'abc123', c: 1, p: [[0.5, 0.5]], fim: true, nome: 'x' })");
    r.canetaRuim = await js("window.carasETelas.tinta({ tr: '../x', c: 9, p: [[0, 0]] })");
    await js('window.carasETelas.tinta(null)');
    r.caneta = await testarCaneta().catch((e) => ({ erro: String(e?.message || e) }));
    // o ajudante acompanha uma janela (aqui, a do próprio programa) e avisa quando ela fecha
    r.canetaJanela = await new Promise((ok) => {
      const hwnd = janela.getNativeWindowHandle().readUInt32LE(0);
      const avisos = [];
      const v = ajudante.vigiarJanela(hwnd, (x) => avisos.push(x));
      if (!v) return ok('indisponível');
      setTimeout(() => { v.parar(); ok(avisos.length ? avisos[0] : 'sem resposta'); }, 2500);
    });
    r.canetaJanelaFechada = await new Promise((ok) => {
      const v = ajudante.vigiarJanela(4294967290, (x) => { v?.parar(); ok(x); });
      if (!v) ok('indisponível');
      setTimeout(() => ok('sem resposta'), 2500);
    });
    r.ptt = await js("window.carasETelas.ptt({ code: 'F13' })");
    r.pttRuim = await js("window.carasETelas.ptt({ code: 'Escape' })");
    await js('window.carasETelas.ptt(null)');
    const vigia = (args) => new Promise((ok) => {
      const exe = ajudante.caminho();
      if (!exe) return ok('indisponível');
      const p = require('node:child_process').spawn(exe, args, { windowsHide: true });
      let saida = '';
      const prazo = setTimeout(() => { p.kill(); ok(`sem resposta (${JSON.stringify(saida)})`); }, 5000);
      p.stdout.on('data', (d) => { saida += d; if (saida.includes('\n')) p.stdin.end(); });
      p.on('exit', (c) => { clearTimeout(prazo); ok(saida.trim() === '0' ? `ok (fechou com ${c})` : `saída ${JSON.stringify(saida)}, código ${c}`); });
    });
    r.ajudanteTecla = await vigia(R.argumentosDoPtt(R.teclaDoPtt({ code: 'F13' })));
    r.ajudanteTeclaLayout = await vigia(R.argumentosDoPtt(R.teclaDoPtt({ code: 'KeyV', ctrl: true })));
    // tema nas telas do programa (o CSS entra mesmo com a proteção da página)
    const telaTeste = new BrowserWindow({ show: false, webPreferences: { partition: 'caras-seletor', sandbox: true, contextIsolation: true } });
    await telaTeste.loadFile(tela('carregando.html'));
    await telaTeste.webContents.insertCSS(R.cssDoTema({ escuro: true, vars: { '--p2': '#123456' } }));
    await telaTeste.webContents.insertCSS('html { --teste-injecao: 7; }');
    const lerVar = (n) => telaTeste.webContents.executeJavaScript(`getComputedStyle(document.documentElement).getPropertyValue('${n}').trim()`);
    r.temaLocal = (await lerVar('--p2')) === '#123456' ? 'aplicado' : 'não aplicou';
    r.cssInjetado = (await lerVar('--teste-injecao')) === '7' ? 'entra' : 'bloqueado';
    telaTeste.destroy();
    // ajudante de som de um programa só (informativo: a máquina do GitHub não tem placa de som)
    const lista = await ajudante.listar();
    r.ajudante = lista ? { programas: lista.programas.length, janelas: Object.keys(lista.janelas).length, exemplos: lista.programas.slice(0, 5).map((p) => p.nome) } : 'indisponível';
    if (lista?.programas.length) {
      const c = await ajudante.capturar(lista.programas[0].pid, 48000);
      r.ajudanteCaptura = c.ok ? 'ok' : c.erro;
      ajudante.parar();
    }
    // a página pede confirmação antes de recarregar no meio da transmissão: o programa recebe o pedido
    await js("window.addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = ''; }); 'ok'", true);
    const perguntasAntes = perguntasAoSair;
    janela.webContents.reload();
    await espera(5000);
    r.perguntaAoSair = perguntasAoSair > perguntasAntes ? 'perguntou' : 'não perguntou';
    const ok = r.api === true && r.semNode === true
      && r.retomarTela?.ok === true && r.retomadaTela === 'mesma fonte'
      && (!r.retomadaJanela?.disponivel || String(r.retomadaJanela.semJanela).startsWith('recusou'))
      && Array.isArray(r.falhas) && r.perguntaAoSair === 'perguntou' && r.bloqueioExterno === 'bloqueado' && r.listaDeEnderecos === 'bloqueado'
      && r.janelaNova === 'bloqueada' && r.navegacaoExterna === 'bloqueada'
      && Array.isArray(r.atalhos?.ok) && !r.atalhos.ok.includes('ruim')
      && r.microfone === 'ok: audio' && r.camera === 'ok: video' && r.pttRuim?.ok === false
      && r.aviso?.mostrado === true && r.avisoRuim?.ok === false && r.jogos?.ok === true
      && r.lance?.ok === true && r.lanceNoDisco === 64 && r.lanceRuim?.ok === false
      && (r.coop?.ok === true || typeof r.coop?.motivo === 'string')
      // a caneta nunca pode entrar na transmissão (se o teste enxerga a tela, a camada tem que estar fora)
      // a caneta tem que aparecer no monitor e nunca entrar na transmissão
      && (r.caneta?.controle !== 'aparece na captura' || (r.caneta.camadaNoMonitor === 'desenhada no monitor'
        && r.caneta.camada === 'fora da captura' && r.caneta.camadaDepoisDeReaparecer === 'fora da captura'
        && r.caneta.janelaPosicao === 'em cima da janela' && r.caneta.janelaNoMonitor === 'desenhada no monitor'))
      && (!r.caneta?.camada || r.caneta.tracoPintou > 0) && r.canetaRuim?.ok === false;
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
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    ajudante.parar();
    ajudante.soltarTecla();
    fecharTinta();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => { saindoDeVez = true; });
}
