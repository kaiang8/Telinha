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

module.exports = {
  validarTema, cssDoTema,
  SITE_PADRAO, origemDe, siteValido, podeNavegar, podeAbrirFora, requisicaoPermitida,
  teclaDoCodigo, aceleradorDe, validarAtalhos,
};
