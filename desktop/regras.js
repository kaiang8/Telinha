'use strict';
// Regras puras (sem Electron), para poderem ser testadas fora do programa.

const SITE_PADRAO = 'https://telas-e-bocas.onrender.com';

// Endereços que o programa pode carregar além do próprio site (só as fontes da página).
const HOSTS_EXTRAS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function origemDe(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// O site precisa ser HTTPS. Só em teste (programa não instalado) aceita http://localhost.
function siteValido(url, emTeste) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.username || u.password) return false;
  if (u.protocol === 'https:') return true;
  return !!emTeste && u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
}

// Navegação dentro da janela: só o próprio site.
function podeNavegar(url, siteOrigem) {
  return origemDe(url) === siteOrigem;
}

// Links de fora (chat etc.) abrem no navegador padrão, mas só http/https.
function podeAbrirFora(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') && !u.username && !u.password;
  } catch {
    return false;
  }
}

// Toda requisição da janela passa por aqui: o que não estiver na lista é bloqueado.
function requisicaoPermitida(url, siteOrigem, pastaTelas) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'devtools:') return true;
  if (u.protocol === 'file:') {
    if (!pastaTelas) return false;
    let caminho;
    try {
      caminho = decodeURIComponent(u.pathname);
    } catch {
      return false;
    }
    if (/^\/[A-Za-z]:\//.test(caminho)) caminho = caminho.slice(1); // Windows: /C:/... -> C:/...
    caminho = caminho.replace(/\\/g, '/');
    if (caminho.split('/').includes('..')) return false;
    const base = pastaTelas.replace(/\\/g, '/').replace(/\/+$/, '') + '/';
    const igual = process.platform === 'win32'
      ? caminho.toLowerCase().startsWith(base.toLowerCase())
      : caminho.startsWith(base);
    return igual;
  }
  if (u.origin === siteOrigem) return true;
  const site = new URL(siteOrigem);
  if ((u.protocol === 'wss:' || u.protocol === 'ws:') && u.host === site.host) return site.protocol === 'https:' ? u.protocol === 'wss:' : true;
  return u.protocol === 'https:' && HOSTS_EXTRAS.has(u.hostname);
}

// ---------- Atalhos globais (funcionam com o programa em segundo plano, até em jogos) ----------
const TECLAS = {
  Space: 'Space', Tab: 'Tab', Enter: 'Enter', Backspace: 'Backspace',
  Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  NumpadAdd: 'numadd', NumpadSubtract: 'numsub', NumpadMultiply: 'nummult', NumpadDivide: 'numdiv', NumpadDecimal: 'numdec',
};

function teclaDoCodigo(code) {
  if (typeof code !== 'string') return null;
  let m;
  if ((m = /^Key([A-Z])$/.exec(code))) return m[1];
  if ((m = /^Digit(\d)$/.exec(code))) return m[1];
  if ((m = /^Numpad(\d)$/.exec(code))) return `num${m[1]}`;
  if ((m = /^F(\d{1,2})$/.exec(code)) && Number(m[1]) >= 1 && Number(m[1]) <= 24) return `F${m[1]}`;
  return TECLAS[code] || null;
}

// Só vira atalho global o que não atrapalha a digitação em outros programas:
// combinações com Ctrl ou Alt, ou as teclas F1 a F24. (Win/Cmd fica de fora: o Windows usa.)
function aceleradorDe(a) {
  if (!a || typeof a !== 'object' || a.meta) return null;
  const tecla = teclaDoCodigo(a.code);
  if (!tecla) return null;
  const teclaF = /^F\d+$/.test(tecla);
  if (!a.ctrl && !a.alt && !teclaF) return null;
  return [a.ctrl && 'Control', a.alt && 'Alt', a.shift && 'Shift', tecla].filter(Boolean).join('+');
}

const MAX_ATALHOS = 60;
// Recebe a lista enviada pela página e devolve só o que é válido: [{ id, acc }]
function validarAtalhos(lista) {
  if (!Array.isArray(lista)) return [];
  const saida = [];
  const usados = new Set();
  for (const item of lista.slice(0, MAX_ATALHOS)) {
    if (!item || typeof item !== 'object') continue;
    const id = typeof item.id === 'string' && /^[\w-]{1,40}$/.test(item.id) ? item.id : null;
    if (!id) continue;
    const acc = aceleradorDe({
      code: item.code, ctrl: item.ctrl === true, alt: item.alt === true, shift: item.shift === true, meta: item.meta === true,
    });
    if (!acc || usados.has(acc)) continue;
    usados.add(acc);
    saida.push({ id, acc });
  }
  return saida;
}

// ---------- Tema das telas do programa ----------
// O site manda as cores do tema; só passam nomes conhecidos e valores que são cor pura
// (nada de url(), expressões ou texto solto), e o programa monta o CSS.
const VARS_DO_TEMA = new Set(['--ceu-alto', '--ceu', '--ceu-fundo', '--ceu-luz', '--onda', '--texto-forte', '--texto', '--suave', '--linha', '--linha-forte',
  '--p1', '--p2', '--p3', '--p-borda', '--p-sobre', '--p-sobre-sombra', '--p-texto', '--p-anel', '--foco', '--sup-1', '--sup-2', '--pop-1', '--pop-2',
  '--campo-1', '--campo-2', '--borda-vidro', '--realce', '--sombra-cor', '--gel-topo', '--gel-meio', '--alerta', '--cabeca-1', '--cabeca-2', '--rodape-1', '--rodape-2']);
const COR = /^(#[0-9a-f]{3,8}|(?:rgba?|hsla?)\(\s*-?[\d.]+(?:deg)?\s*(?:,\s*[\d.]+%?\s*){2,3}\))$/i;

function validarTema(dados) {
  if (!dados || typeof dados !== 'object') return null;
  const vars = {};
  const entrada = dados.vars && typeof dados.vars === 'object' ? dados.vars : {};
  for (const [nome, valor] of Object.entries(entrada)) {
    if (VARS_DO_TEMA.has(nome) && typeof valor === 'string' && valor.length <= 60 && COR.test(valor.trim())) vars[nome] = valor.trim();
  }
  return { escuro: dados.escuro === true, vars };
}

function cssDoTema(tema) {
  const t = validarTema(tema);
  if (!t) return '';
  const linhas = Object.entries(t.vars).map(([k, v]) => `${k}: ${v};`);
  linhas.push(`color-scheme: ${t.escuro ? 'dark' : 'light'};`);
  // html:root ganha do :root da própria tela (o CSS injetado entra antes do da página)
  return `html:root { ${linhas.join(' ')} }`;
}

// ---- apertar-para-falar: qual tecla o ajudante vigia ----
// Teclas de digitar vão pela posição física (scan code), que o ajudante traduz com o layout
// do teclado da pessoa. As outras vão direto pelo código de tecla do Windows (VK).
const SCAN = {
  Digit1: 0x02, Digit2: 0x03, Digit3: 0x04, Digit4: 0x05, Digit5: 0x06, Digit6: 0x07, Digit7: 0x08, Digit8: 0x09, Digit9: 0x0a, Digit0: 0x0b,
  Minus: 0x0c, Equal: 0x0d,
  KeyQ: 0x10, KeyW: 0x11, KeyE: 0x12, KeyR: 0x13, KeyT: 0x14, KeyY: 0x15, KeyU: 0x16, KeyI: 0x17, KeyO: 0x18, KeyP: 0x19,
  BracketLeft: 0x1a, BracketRight: 0x1b,
  KeyA: 0x1e, KeyS: 0x1f, KeyD: 0x20, KeyF: 0x21, KeyG: 0x22, KeyH: 0x23, KeyJ: 0x24, KeyK: 0x25, KeyL: 0x26,
  Semicolon: 0x27, Quote: 0x28, Backquote: 0x29, Backslash: 0x2b,
  KeyZ: 0x2c, KeyX: 0x2d, KeyC: 0x2e, KeyV: 0x2f, KeyB: 0x30, KeyN: 0x31, KeyM: 0x32, Comma: 0x33, Period: 0x34, Slash: 0x35,
  IntlBackslash: 0x56, IntlRo: 0x73,
};
const VK = {
  MouseMiddle: 0x04, MouseBack: 0x05, MouseForward: 0x06,
  Backspace: 0x08, Tab: 0x09, Enter: 0x0d, CapsLock: 0x14, Space: 0x20,
  PageUp: 0x21, PageDown: 0x22, End: 0x23, Home: 0x24, ArrowLeft: 0x25, ArrowUp: 0x26, ArrowRight: 0x27, ArrowDown: 0x28,
  Insert: 0x2d, Delete: 0x2e,
  NumpadMultiply: 0x6a, NumpadAdd: 0x6b, NumpadSubtract: 0x6d, NumpadDecimal: 0x6e, NumpadDivide: 0x6f, NumpadEnter: 0x0d,
  ShiftLeft: 0xa0, ShiftRight: 0xa1, ControlLeft: 0xa2, ControlRight: 0xa3, AltLeft: 0xa4, AltRight: 0xa5,
};
for (let i = 0; i <= 9; i++) VK[`Numpad${i}`] = 0x60 + i;
for (let i = 1; i <= 24; i++) VK[`F${i}`] = 0x6f + i;

// { code, ctrl, alt, shift } → { vk } ou { scan }, mais os modificadores; null se não der
function teclaDoPtt(a) {
  if (!a || typeof a !== 'object' || typeof a.code !== 'string') return null;
  const code = a.code;
  const t = Object.hasOwn(VK, code) ? { vk: VK[code] } : Object.hasOwn(SCAN, code) ? { scan: SCAN[code] } : null;
  if (!t) return null;
  // modificador sozinho ou botão do mouse: vale do jeito que for apertado
  const solto = /^(Control|Shift|Alt)(Left|Right)$|^Mouse/.test(code);
  return { ...t, ctrl: !solto && a.ctrl === true, alt: !solto && a.alt === true, shift: !solto && a.shift === true };
}
function argumentosDoPtt(t) {
  const args = ['--segurar', t.vk ? '--vk' : '--scan', String(t.vk || t.scan)];
  if (t.ctrl) args.push('--ctrl');
  if (t.alt) args.push('--alt');
  if (t.shift) args.push('--shift');
  return args;
}

// ---- caneta: um pedaço de traço vindo da página (vai para a camada por cima da tela) ----
function validarTraco(d) {
  if (!d || typeof d !== 'object') return null;
  if (typeof d.tr !== 'string' || !/^[a-z0-9]{4,12}$/.test(d.tr)) return null;
  if (!Number.isInteger(d.c) || d.c < 0 || d.c > 4) return null;
  if (!Array.isArray(d.p) || !d.p.length || d.p.length > 64) return null;
  const p = [];
  for (const xy of d.p) {
    if (!Array.isArray(xy) || xy.length !== 2) return null;
    const [x, y] = xy;
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    p.push([Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))]);
  }
  const nome = typeof d.nome === 'string' ? d.nome.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 32) : '';
  return { tr: d.tr, c: d.c, p, fim: d.fim === true, nome };
}
// fonte escolhida no seletor: a tela inteira (monitor) ou uma janela (pelo número dela)
function fonteDaCaneta(fonte) {
  if (!fonte || typeof fonte.id !== 'string') return null;
  if (fonte.id.startsWith('screen:')) return { tipo: 'tela', displayId: String(fonte.display_id || '') };
  const hwnd = /^window:(\d{1,10}):/.exec(fonte.id)?.[1];
  return hwnd && Number(hwnd) > 0 && Number(hwnd) <= 0xffffffff ? { tipo: 'janela', hwnd: Number(hwnd) } : null;
}

module.exports = {
  validarTraco, fonteDaCaneta,
  teclaDoPtt, argumentosDoPtt,
  validarTema, cssDoTema,
  SITE_PADRAO, origemDe, siteValido, podeNavegar, podeAbrirFora, requisicaoPermitida,
  teclaDoCodigo, aceleradorDe, validarAtalhos,
};
