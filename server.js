'use strict';
/*
 * Caras E Telas — servidor estilo Discord para conversar e compartilhar a tela com os amigos.
 * Zero dependências: só precisa do Node.js 18 ou mais novo.
 *
 * O vídeo vai direto de um navegador para o outro (WebRTC). Este servidor só
 * cuida do chat, da lista de quem está online, da moderação (admin) e da
 * "apresentação" entre os navegadores.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const dns = require('dns').promises;
const net = require('net');

// ---------- Configuração (variáveis de ambiente) ----------
const PORT = Number(process.env.PORT) || 3000;
// Tira espaços e aspas que às vezes vêm junto ao colar a senha no painel da hospedagem
const limparEnv = (v) => String(v || '').trim().replace(/^(["'])(.*)\1$/, '$2').trim();
const SENHA_ENV = limparEnv(process.env.SENHA);
const ADMIN_SENHA_ENV = limparEnv(process.env.ADMIN_SENHA);
const NOME_ENV = (process.env.NOME_SERVIDOR || 'Caras E Telas').slice(0, 40);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
const UPSTASH_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const USA_UPSTASH = !!(UPSTASH_URL && UPSTASH_TOKEN);
const CHAVE_UPSTASH = process.env.UPSTASH_CHAVE || 'telinha:dados';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_MSGS_POR_CANAL = 200;
const MAX_CANAIS = 40;
const MAX_BODY = 64 * 1024;

const iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
if (process.env.TURN_URL) {
  iceServers.push({
    urls: process.env.TURN_URL.split(',').map((s) => s.trim()).filter(Boolean),
    username: process.env.TURN_USUARIO || '',
    credential: process.env.TURN_SENHA || '',
  });
}

// ---------- Senhas (guardadas só como hash) ----------
function hashSenha(s) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(String(s), salt, 32).toString('hex')}`;
}
function confereHash(tentativa, guardado) {
  if (!guardado || typeof guardado !== 'string') return false;
  const [salt, h] = guardado.split(':');
  if (!salt || !h) return false;
  const calc = crypto.scryptSync(String(tentativa || ''), salt, 32);
  const esperado = Buffer.from(h, 'hex');
  return esperado.length === calc.length && crypto.timingSafeEqual(calc, esperado);
}
// Aceita a senha digitada como está ou sem espaços nas pontas (teclado de celular adora pôr um espaço no fim)
function confereSenha(tentativa, guardado) {
  const t = String(tentativa || '');
  return confereHash(t, guardado) || (t.trim() !== t && confereHash(t.trim(), guardado));
}
const SENHA_ENV_HASH = SENHA_ENV ? hashSenha(SENHA_ENV) : null;
const ADMIN_ENV_HASH = ADMIN_SENHA_ENV ? hashSenha(ADMIN_SENHA_ENV) : null;

// ---------- Dados persistentes ----------
const CANAIS_PADRAO = [
  { id: 'geral', name: 'geral', type: 'text' },
  { id: 'links', name: 'links', type: 'text' },
  { id: 'memes', name: 'memes', type: 'text' },
  { id: 'sala-1', name: 'Sala 1', type: 'sala' },
  { id: 'jogatina', name: 'Jogatina', type: 'sala' },
];

let data = {
  channels: CANAIS_PADRAO.map((c) => ({ ...c })),
  messages: {},
  settings: { locked: false }, // serverName, senhaHash, adminHash, adminGerada
  bans: [],
  mutes: [],
  lembretes: [], // aparelhos lembrados como admin (só o resumo da chave, nunca a chave)
};
let podeSalvar = true;

function aplicarDados(raw) {
  if (!raw || typeof raw !== 'object') return;
  if (Array.isArray(raw.channels) && raw.channels.length) data.channels = raw.channels;
  if (raw.messages && typeof raw.messages === 'object') data.messages = raw.messages;
  if (raw.settings && typeof raw.settings === 'object') data.settings = { locked: false, ...raw.settings };
  if (Array.isArray(raw.bans)) data.bans = raw.bans;
  if (Array.isArray(raw.mutes)) data.mutes = raw.mutes;
  if (Array.isArray(raw.lembretes)) data.lembretes = raw.lembretes;
}

async function upstash(comando, { semContar = false } = {}) {
  const corpo = JSON.stringify(comando);
  if (!semContar) contarTrafego('banco', Buffer.byteLength(corpo) + 400);
  const r = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: corpo,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
  return j.result;
}

async function carregarDados() {
  if (USA_UPSTASH) {
    for (let tentativa = 1; tentativa <= 5; tentativa++) {
      try {
        const raw = await upstash(['GET', CHAVE_UPSTASH]);
        if (raw) aplicarDados(JSON.parse(raw));
        console.log(raw ? '  Dados carregados do Upstash.' : '  Upstash conectado (ainda sem dados salvos).');
        return;
      } catch (e) {
        console.warn(`  Upstash não respondeu (tentativa ${tentativa}/5): ${e.message}`);
        await new Promise((ok) => setTimeout(ok, 2000));
      }
    }
    // Não sobrescreve os dados de verdade com os padrões
    podeSalvar = false;
    console.error('  ATENÇÃO: não consegui ler o Upstash. Nada será salvo até o servidor reiniciar.');
    return;
  }
  try {
    aplicarDados(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    console.log(`  Dados carregados de ${DATA_FILE}`);
  } catch {
    /* primeira execução: usa os padrões */
  }
}

let saveTimer = null;
let salvando = false;
let sujo = false;
function salvar() {
  sujo = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(gravar, 2000);
}
async function gravar() {
  if (!podeSalvar || !sujo) return;
  if (salvando) { saveTimer = setTimeout(gravar, 1000); return; }
  salvando = true;
  sujo = false;
  const conteudo = JSON.stringify(data);
  try {
    if (USA_UPSTASH) {
      await upstash(['SET', CHAVE_UPSTASH, conteudo]);
    } else {
      const tmp = DATA_FILE + '.tmp';
      await fs.promises.writeFile(tmp, conteudo);
      await fs.promises.rename(tmp, DATA_FILE);
    }
  } catch (e) {
    sujo = true;
    console.warn('Não consegui salvar os dados:', e.message);
    saveTimer = setTimeout(gravar, 10000);
  } finally {
    salvando = false;
  }
}

// ---------- Dados guardados à parte (problemas relatados, tráfego) ----------
// Cada um fica numa chave própria do Upstash (ou num arquivo ao lado do data.json), para não
// pesar a cada mensagem salva.
function guardadoSeparado(sufixo, padrao, { semContar = false } = {}) {
  const chave = `${CHAVE_UPSTASH}:${sufixo}`;
  const arquivo = DATA_FILE.replace(/\.json$/i, '') + `-${sufixo}.json`;
  const g = { dados: padrao(), ok: true, timer: null, sujo: false, gravando: false };
  g.carregar = async () => {
    try {
      const raw = USA_UPSTASH
        ? await upstash(['GET', chave], { semContar })
        : await fs.promises.readFile(arquivo, 'utf8').catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e)));
      const d = raw ? JSON.parse(raw) : null;
      if (d && typeof d === 'object' && !Array.isArray(d)) g.dados = { ...padrao(), ...d };
    } catch (e) {
      g.ok = false; // não sobrescreve o que não conseguiu ler
      console.warn(`  Não consegui ler ${sufixo}:`, e.message);
    }
  };
  // adiar = false: não empurra a gravação para depois a cada mudança (para o que muda o tempo todo)
  g.salvar = (ms = 5000, adiar = true) => {
    g.sujo = true;
    if (g.timer && !adiar) return;
    clearTimeout(g.timer);
    g.timer = setTimeout(g.gravar, ms);
  };
  g.gravar = async () => {
    g.timer = null;
    if (!g.ok || !g.sujo) return;
    if (g.gravando) { g.timer = setTimeout(g.gravar, 1000); return; }
    g.gravando = true;
    g.sujo = false;
    try {
      const conteudo = JSON.stringify(g.dados);
      if (USA_UPSTASH) {
        await upstash(['SET', chave, conteudo], { semContar });
      } else {
        await fs.promises.writeFile(arquivo + '.tmp', conteudo);
        await fs.promises.rename(arquivo + '.tmp', arquivo);
      }
    } catch (e) {
      g.sujo = true;
      console.warn(`Não consegui salvar ${sufixo}:`, e.message);
      g.timer = setTimeout(g.gravar, 15000);
    } finally {
      g.gravando = false;
    }
  };
  g.terminar = async () => {
    clearTimeout(g.timer);
    while (g.gravando) await new Promise((ok) => setTimeout(ok, 50));
    await g.gravar();
  };
  return g;
}

// ---------- Tráfego do servidor (o plano grátis do Render inclui 5 GB de saída por mês) ----------
// Conta o que o servidor manda para fora: páginas, imagens do chat, eventos em tempo real,
// pedidos da página e o que vai para o banco. É uma estimativa: o número oficial está no Render.
const LIMITE_TRAFEGO_GB = Number(process.env.LIMITE_TRAFEGO_GB) > 0 ? Number(process.env.LIMITE_TRAFEGO_GB) : 5;
const mesAtual = () => new Date().toISOString().slice(0, 7);
const inicioDoMes = () => { const d = new Date(); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); };
const TRAFEGO = guardadoSeparado('trafego', () => ({ mes: mesAtual(), desde: Date.now(), bytes: {}, avisos: [] }), { semContar: true });
function contarTrafego(tipo, n) {
  if (!(n > 0)) return;
  let d = TRAFEGO.dados;
  if (d.mes !== mesAtual()) d = TRAFEGO.dados = { mes: mesAtual(), desde: inicioDoMes(), bytes: {}, avisos: [] };
  d.bytes[tipo] = (d.bytes[tipo] || 0) + n;
  TRAFEGO.salvar(5 * 60e3, false);
  // avisa os admins online quando passa de 80% e de 95%
  const total = Object.values(d.bytes).reduce((a, b) => a + b, 0);
  for (const marca of [80, 95]) {
    if (total >= (LIMITE_TRAFEGO_GB * 1e9 * marca) / 100 && !d.avisos.includes(marca)) {
      d.avisos.push(marca);
      avisarAdmins(`O servidor já usou ${marca}% do tráfego grátis do mês (${(total / 1e9).toFixed(2)} GB de ${LIMITE_TRAFEGO_GB} GB). Se passar, o Render suspende o site até o mês que vem. Veja em Painel de admin → Servidor.`);
    }
  }
}
const tamanhoDe = (c) => (typeof c === 'string' ? Buffer.byteLength(c) : c?.length || 0);
function medirResposta(res, tipo) {
  const escrever = res.write;
  const terminar = res.end;
  res.write = function (chunk, ...resto) {
    if (chunk && typeof chunk !== 'function') contarTrafego(tipo, tamanhoDe(chunk));
    return escrever.call(this, chunk, ...resto);
  };
  res.end = function (chunk, ...resto) {
    if (chunk && typeof chunk !== 'function') contarTrafego(tipo, tamanhoDe(chunk));
    contarTrafego(tipo, 300); // cabeçalhos, mais ou menos
    return terminar.call(this, chunk, ...resto);
  };
}
function trafegoParaAdmin() {
  const d = TRAFEGO.dados.mes === mesAtual() ? TRAFEGO.dados : { mes: mesAtual(), desde: inicioDoMes(), bytes: {} };
  return { mes: d.mes, desde: Math.max(d.desde || 0, inicioDoMes()), inicioDoMes: inicioDoMes(), bytes: d.bytes, limiteGB: LIMITE_TRAFEGO_GB };
}

// ---------- Problemas relatados e erros da página (só admins veem) ----------
const PROBLEMAS = guardadoSeparado('problemas', () => ({ relatos: [], erros: [], qualidade: [] }));
const DIAS_PROBLEMAS = 30;
function limparProblemasVelhos() {
  const limite = Date.now() - DIAS_PROBLEMAS * 864e5;
  const d = PROBLEMAS.dados;
  d.relatos = (Array.isArray(d.relatos) ? d.relatos : []).filter((x) => x.t >= limite).slice(-100);
  d.erros = (Array.isArray(d.erros) ? d.erros : []).filter((x) => x.ultima >= limite).slice(-150);
  d.qualidade = (Array.isArray(d.qualidade) ? d.qualidade : []).filter((x) => x.t >= limite).slice(-80);
}
function avisarAdmins(texto) {
  for (const x of users.values()) if (x.admin && x.joined && !x.kicked) enviar(x, { type: 'avisoAdmin', texto });
}
const textoLimpo = (t, max) => (typeof t === 'string' ? t.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '');
function limiteDe(u, campo, max, janela) {
  const agora = Date.now();
  if (!u[campo] || agora - u[campo].desde > janela) u[campo] = { desde: agora, n: 0 };
  return ++u[campo].n > max;
}

// ---------- Registro de conexões (só admins veem) ----------
// Quem entrou, de qual IP e com qual navegador, e as tentativas recusadas. Fica separado dos
// outros dados (não pesa a cada mensagem salva) e guarda só o necessário: no máximo 500
// entradas, por até 30 dias.
const REGISTRO_MAX = 500;
const REGISTRO_DIAS = 30;
const CHAVE_REGISTRO = `${CHAVE_UPSTASH}:conexoes`;
const ARQUIVO_REGISTRO = DATA_FILE.replace(/\.json$/i, '') + '-conexoes.json';
let registro = [];
let registroOk = true; // se não deu para ler o registro guardado, não sobrescreve
let registroTimer = null;
let registroSujo = false;
let gravandoRegistro = false;
const sessoesAtivas = new Map(); // id da entrada -> quantas conexões abertas

function aparelhoDe(req) {
  const ua = String(req.headers['user-agent'] || '').slice(0, 500);
  const sistema = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iPhone/iPad'
    : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : '';
  let app;
  if (/\bElectron\//.test(ua)) {
    const v = ua.match(/\/(\d+\.\d+\.\d+)\s+Chrome\/[\d.]+\s+Electron\//);
    app = `Programa${v ? ` ${v[1]}` : ''}`;
  } else if (/\bEdg(A|iOS)?\//.test(ua)) app = 'Edge';
  else if (/\bOPR\/|\bOpera\b/.test(ua)) app = 'Opera';
  else if (/SamsungBrowser/.test(ua)) app = 'Samsung Internet';
  else if (/Firefox\/|FxiOS/.test(ua)) app = 'Firefox';
  else if (/Chrome\/|CriOS/.test(ua)) app = 'Chrome';
  else if (/Safari\//.test(ua)) app = 'Safari';
  else app = ua ? 'Outro navegador' : 'Desconhecido';
  return sistema ? `${app} no ${sistema}` : app;
}

function limparRegistroVelho() {
  const limite = Date.now() - REGISTRO_DIAS * 864e5;
  if (registro.length && registro[0].t < limite) registro = registro.filter((x) => x.t >= limite);
}
function anotar(entrada) {
  limparRegistroVelho();
  const e = { id: crypto.randomBytes(5).toString('hex'), t: Date.now(), ...entrada };
  registro.push(e);
  if (registro.length > REGISTRO_MAX) registro.splice(0, registro.length - REGISTRO_MAX);
  salvarRegistro();
  return e;
}
// Entrou: recarregar a página ou cair e voltar em seguida conta como a mesma visita
function registrarEntrada(u, req) {
  const aparelho = aparelhoDe(req);
  const agora = Date.now();
  const e = registro.findLast((x) => x.tipo === 'entrou' && x.ip === u.ip && x.nome === u.name && x.aparelho === aparelho);
  if (e && (sessoesAtivas.get(e.id) > 0 || agora - (e.fim || 0) < 3 * 60e3)) {
    delete e.fim;
    delete e.saida;
    e.admin = e.admin || u.admin;
    salvarRegistro();
    u.registro = e;
  } else {
    u.registro = anotar({ tipo: 'entrou', nome: u.name, ip: u.ip, aparelho, admin: u.admin });
  }
  sessoesAtivas.set(u.registro.id, (sessoesAtivas.get(u.registro.id) || 0) + 1);
}
function registrarSaida(u) {
  const e = u.registro;
  if (!e) return;
  u.registro = null;
  const n = (sessoesAtivas.get(e.id) || 1) - 1;
  if (n > 0) return sessoesAtivas.set(e.id, n);
  sessoesAtivas.delete(e.id);
  e.fim = Date.now();
  if (u.kicked) e.saida = u.kicked.banned ? 'banido' : 'expulso';
  salvarRegistro();
}
// Recusado (senha errada, banido...): a mesma tentativa repetida vira uma linha só
function registrarRecusa(req, ip, nome, motivo) {
  const agora = Date.now();
  const e = registro.findLast((x) => x.tipo === 'recusado' && x.ip === ip && x.motivo === motivo);
  if (e && agora - (e.ultima || e.t) < 10 * 60e3) {
    e.vezes = (e.vezes || 1) + 1;
    e.ultima = agora;
    if (nome && nome !== e.nome && !e.nomes?.includes(nome) && (e.nomes || []).length < 5) e.nomes = [...(e.nomes || []), nome];
    return salvarRegistro();
  }
  anotar({ tipo: 'recusado', motivo, nome: nome || '?', ip, aparelho: aparelhoDe(req) });
}

function salvarRegistro() {
  registroSujo = true;
  clearTimeout(registroTimer);
  registroTimer = setTimeout(gravarRegistro, 5000);
}
async function gravarRegistro() {
  if (!registroOk || !registroSujo) return;
  if (gravandoRegistro) { registroTimer = setTimeout(gravarRegistro, 1000); return; }
  gravandoRegistro = true;
  registroSujo = false;
  limparRegistroVelho();
  const conteudo = JSON.stringify(registro);
  try {
    if (USA_UPSTASH) {
      await upstash(['SET', CHAVE_REGISTRO, conteudo]);
    } else {
      const tmp = ARQUIVO_REGISTRO + '.tmp';
      await fs.promises.writeFile(tmp, conteudo);
      await fs.promises.rename(tmp, ARQUIVO_REGISTRO);
    }
  } catch (e) {
    registroSujo = true;
    console.warn('Não consegui salvar o registro de conexões:', e.message);
    registroTimer = setTimeout(gravarRegistro, 15000);
  } finally {
    gravandoRegistro = false;
  }
}
async function carregarRegistro() {
  try {
    const raw = USA_UPSTASH
      ? await upstash(['GET', CHAVE_REGISTRO])
      : await fs.promises.readFile(ARQUIVO_REGISTRO, 'utf8').catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e)));
    const lista = raw ? JSON.parse(raw) : [];
    registro = (Array.isArray(lista) ? lista : []).filter((x) => x && typeof x.t === 'number' && typeof x.ip === 'string').slice(-REGISTRO_MAX);
    // quem estava conectado quando o servidor desligou
    for (const x of registro) if (x.tipo === 'entrou' && !x.fim) { x.fim = x.ultimaVista || x.t; x.saida = 'reinicio'; }
    limparRegistroVelho();
  } catch (e) {
    registroOk = false;
    console.warn('  Não consegui ler o registro de conexões:', e.message);
  }
}

// ---------- Configurações do servidor ----------
const nomeServidor = () => data.settings.serverName || NOME_ENV;
const hashSite = () => ('senhaHash' in data.settings ? data.settings.senhaHash : SENHA_ENV_HASH);
const precisaSenha = () => !!hashSite();
const senhaSiteConfere = (p) => !hashSite() || confereSenha(p, hashSite());
const hashAdmin = () => ADMIN_ENV_HASH || data.settings.adminHash;

function garantirSenhaAdmin() {
  if (ADMIN_ENV_HASH || data.settings.adminHash) return;
  const nova = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  data.settings.adminHash = hashSenha(nova);
  data.settings.adminGerada = nova; // só enquanto ninguém trocar
  salvar();
}

// ---------- Aparelhos lembrados como admin ----------
// Quem entra com a senha de admin ganha uma chave longa e aleatória, guardada só no aparelho.
// O servidor guarda apenas o resumo (SHA-256) dela. Vale por 180 dias sem uso e deixa de valer
// sozinha quando a senha de admin muda. Dá para esquecer um aparelho pelo painel de admin.
const LEMBRETE_DIAS = 180;
const resumo = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
let versaoMemo = null;
function versaoSenhaAdmin() {
  // marca que muda quando a senha de admin muda (sem guardar nada que revele a senha)
  if (ADMIN_SENHA_ENV) {
    if (!data.settings.saltLembrete) {
      data.settings.saltLembrete = crypto.randomBytes(16).toString('hex');
      salvar();
    }
    if (versaoMemo?.salt !== data.settings.saltLembrete) {
      versaoMemo = { salt: data.settings.saltLembrete, v: 'e' + resumo(crypto.scryptSync(ADMIN_SENHA_ENV, data.settings.saltLembrete, 32)).slice(0, 16) };
    }
    return versaoMemo.v;
  }
  return 'p' + resumo(data.settings.adminHash || '').slice(0, 16);
}
function limparLembretes() {
  const limite = Date.now() - LEMBRETE_DIAS * 864e5;
  const v = versaoSenhaAdmin();
  const antes = data.lembretes.length;
  data.lembretes = data.lembretes.filter((r) => r && r.usado >= limite && r.versao === v).slice(-30);
  if (data.lembretes.length !== antes) salvar();
}
function criarLembrete(u, req) {
  limparLembretes();
  const token = crypto.randomBytes(32).toString('base64url');
  const agora = Date.now();
  const reg = { id: crypto.randomBytes(6).toString('hex'), hash: resumo(token), nome: u.name, aparelho: aparelhoDe(req), criado: agora, usado: agora, versao: versaoSenhaAdmin() };
  data.lembretes.push(reg);
  data.lembretes = data.lembretes.slice(-30);
  salvar();
  return { id: reg.id, token };
}
function lembreteValido(token) {
  if (typeof token !== 'string' || token.length < 30 || token.length > 100) return null;
  limparLembretes();
  const h = resumo(token);
  return data.lembretes.find((r) => r.hash.length === h.length && crypto.timingSafeEqual(Buffer.from(r.hash), Buffer.from(h))) || null;
}

// ---------- Proteção contra chute de senha ----------
const tentativas = new Map(); // ip -> { n, desde }
const JANELA = 10 * 60e3;
function bloqueado(ip) {
  const t = tentativas.get(ip);
  return !!t && t.n >= 8 && Date.now() - t.desde < JANELA;
}
function falhou(ip) {
  const t = tentativas.get(ip);
  if (!t || Date.now() - t.desde > JANELA) tentativas.set(ip, { n: 1, desde: Date.now() });
  else t.n++;
}
setInterval(() => {
  for (const [ip, t] of tentativas) if (Date.now() - t.desde > JANELA) tentativas.delete(ip);
}, JANELA);

function ipDe(req) {
  const h = req.headers;
  const ip = h['cf-connecting-ip'] || h['true-client-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || h['x-real-ip'] || req.socket.remoteAddress || '';
  return String(ip).replace(/^::ffff:/, '').slice(0, 64);
}

// ---------- Usuários conectados (só em memória) ----------
const users = new Map(); // id -> usuário
const tokens = new Map(); // token -> id
const expulsos = new Map(); // token -> motivo (para avisar quem foi expulso)

const CORES = ['#ffb23f', '#ff9a76', '#ff6b81', '#f78fd3', '#c39bff', '#9fa8ff', '#6cc6ff', '#4fe0d0', '#43d9a3', '#c3e86b'];

function publicUser(u) {
  return {
    id: u.id, name: u.name, color: u.color, sala: u.sala, live: u.live, admin: !!u.admin,
    mudo: !!u.mudo, surdo: !!u.surdo, silenciado: silencioDe(u) > Date.now(),
    ...(u.live && u.caneta ? { caneta: u.caneta } : {}),
  };
}

// ---------- Caneta: quem assiste desenha por cima da transmissão ----------
// Quem transmite escolhe o padrão (todos ou ninguém) e as exceções. Cada traço passa por aqui:
// o servidor confere a permissão e só repassa para quem está na mesma sala.
const CANETA_PADRAO = () => ({ padrao: 'ninguem', excecoes: [] });
function podeDesenhar(transmissor, quem) {
  const c = transmissor.caneta || CANETA_PADRAO();
  return (c.padrao === 'todos') !== c.excecoes.includes(quem.id);
}
function pontosDaTinta(p) {
  if (!Array.isArray(p) || !p.length || p.length > 64) return null;
  const r = [];
  for (const xy of p) {
    if (!Array.isArray(xy) || xy.length !== 2) return null;
    const [x, y] = xy.map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    r.push([Math.round(Math.min(1, Math.max(0, x)) * 1e4) / 1e4, Math.round(Math.min(1, Math.max(0, y)) * 1e4) / 1e4]);
  }
  return r;
}
function listaUsuarios() {
  return [...users.values()].filter((u) => u.joined && !u.kicked).map(publicUser);
}
function enviar(u, obj) {
  if (u.res) {
    try {
      u.res.write(`data: ${JSON.stringify(obj)}\n\n`);
    } catch {
      /* conexão caiu; o 'close' cuida do resto */
    }
  } else if (u.mode === 'poll') {
    u.queue.push(obj);
    if (u.queue.length > 500) u.queue.splice(0, u.queue.length - 500);
    if (u.poller) responderPoll(u);
  }
}
function armarRemocao(u, ms) {
  clearTimeout(u.removeTimer);
  u.removeTimer = setTimeout(() => removerUsuario(u), ms);
}
function responderPoll(u) {
  const res = u.poller;
  u.poller = null;
  clearTimeout(u.pollTimer);
  const events = u.queue;
  u.queue = [];
  json(res, 200, { events });
  if (!u.kicked) armarRemocao(u, 20000); // o navegador deve voltar logo com outro pedido
}
// Versão mais nova do programa para Windows (a de desktop/package.json deste mesmo envio):
// o site avisa quem ainda está numa versão antiga.
const VERSAO_PROGRAMA = (() => {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(__dirname, 'desktop', 'package.json'), 'utf8')).version;
    return /^\d+\.\d+\.\d+$/.test(v) ? v : null;
  } catch {
    return null;
  }
})();
// O Render informa qual envio do GitHub está no ar (aparece no detalhe da versão)
const COMMIT = /^[0-9a-f]{7,40}$/i.test(process.env.RENDER_GIT_COMMIT || '') ? process.env.RENDER_GIT_COMMIT.slice(0, 7) : '';
function configPublica() {
  return {
    serverName: nomeServidor(), needsPassword: precisaSenha(), locked: !!data.settings.locked,
    ...(VERSAO_PROGRAMA ? { programa: VERSAO_PROGRAMA } : {}),
    ...(COMMIT ? { build: COMMIT } : {}),
  };
}
function enviarInit(u) {
  const historico = {};
  for (const c of data.channels) historico[c.id] = (data.messages[c.id] || []).slice(-100);
  enviar(u, {
    type: 'init',
    me: publicUser(u),
    muted: silencioDe(u),
    ...configPublica(),
    channels: data.channels,
    messages: historico,
    users: listaUsuarios(),
    iceServers,
  });
}
function broadcast(obj) {
  for (const u of users.values()) enviar(u, obj);
}
function broadcastPresenca() {
  broadcast({ type: 'presence', users: listaUsuarios() });
}
function broadcastConfig() {
  broadcast({ type: 'settings', ...configPublica() });
}
function removerUsuario(u) {
  if (!users.has(u.id)) return;
  clearTimeout(u.removeTimer);
  users.delete(u.id);
  tokens.delete(u.token);
  registrarSaida(u);
  if (u.res) {
    try { u.res.end(); } catch { /* ignore */ }
  }
  if (u.poller) {
    clearTimeout(u.pollTimer);
    try { json(u.poller, 401, { error: 'sessão encerrada', ...(u.kicked ? { kicked: u.kicked } : {}) }); } catch { /* ignore */ }
  }
  if (u.joined) {
    console.log(`- ${u.name} saiu`);
    broadcastPresenca();
  }
}

// ---------- Moderação ----------
function ipCompartilhado(alvo) {
  // Se outra pessoa online usa o mesmo IP (mesma casa, mesmo proxy...), não dá para punir pelo IP.
  return [...users.values()].some((x) => x !== alvo && x.joined && !x.kicked && x.ip === alvo.ip);
}
function banDe(ip, device) {
  return data.bans.find((b) => (b.ip && b.ip === ip) || (b.device && device && b.device === device));
}
function silencioDe(u) {
  const agora = Date.now();
  const m = data.mutes.find((x) => x.until > agora && ((x.ip && x.ip === u.ip) || (x.device && u.device && x.device === u.device)));
  return m ? m.until : 0;
}
function limparSilenciosVencidos() {
  const agora = Date.now();
  const antes = data.mutes.length;
  data.mutes = data.mutes.filter((m) => m.until > agora);
  if (data.mutes.length !== antes) salvar();
}
function expulsar(alvo, info) {
  alvo.kicked = info;
  alvo.sala = null;
  alvo.live = false;
  enviar(alvo, { type: 'kicked', ...info });
  expulsos.set(alvo.token, info);
  setTimeout(() => expulsos.delete(alvo.token), 5 * 60e3);
  broadcastPresenca();
  armarRemocao(alvo, 3000); // dá tempo do aviso chegar
}
function visaoAdmin() {
  limparSilenciosVencidos();
  return {
    users: [...users.values()].filter((u) => u.joined && !u.kicked).map((u) => ({ ...publicUser(u), ip: u.ip, muted: silencioDe(u) })),
    bans: data.bans,
    problemasNovos: PROBLEMAS.dados.relatos.filter((r) => !r.lido).length,
    aparelhos: (limparLembretes(), data.lembretes.map((r) => ({ id: r.id, nome: r.nome, aparelho: r.aparelho, criado: r.criado, usado: r.usado }))),
    trafego: trafegoParaAdmin(),
    settings: {
      ...configPublica(),
      adminFromEnv: !!ADMIN_ENV_HASH,
      storage: USA_UPSTASH ? 'upstash' : 'arquivo',
    },
  };
}

// ---------- Utilidades HTTP ----------
function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('corpo grande demais'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}
function slug(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}
const limparNome = (s, max) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
function canal(id) {
  return data.channels.find((c) => c.id === id);
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};
// Arquivos da página. O normal é estarem na pasta public/, mas se foram enviados
// soltos (sem a pasta), o servidor procura também ao lado do server.js.
const ARQUIVOS_DA_PAGINA = ['index.html', 'app.js', 'style.css'];
function acharArquivoDaPagina(nome) {
  for (const dir of [PUBLIC_DIR, __dirname]) {
    const f = path.join(dir, nome);
    if (fs.existsSync(f)) return f;
  }
  return null;
}
function paginaDeAjuda(res) {
  const faltando = ARQUIVOS_DA_PAGINA.filter((n) => !acharArquivoDaPagina(n));
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...CABECALHOS_SEGURANCA });
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Faltam arquivos</title><body style="font-family:system-ui,sans-serif;background:#313338;color:#dbdee1;max-width:640px;margin:60px auto;padding:0 20px;line-height:1.6">
<h1 style="color:#fff">O servidor está ligado, mas faltam arquivos da página</h1>
<p>Não encontrei: <b>${faltando.join(', ')}</b></p>
<p>No GitHub, clique em <b>Add file → Upload files</b> e envie esses arquivos (eles ficam dentro da pasta <code>public</code> no seu computador).
Podem ficar soltos, junto do <code>server.js</code>, ou dentro de uma pasta <code>public</code>. Depois clique em <b>Commit changes</b>
e espere uns 2 minutos: o Render atualiza sozinho.</p></body></html>`);
}

// Proteções do navegador: a página só roda o próprio código e só conversa com este servidor
// (mesmo que alguém consiga colar algo malicioso no chat, o navegador não executa).
const CABECALHOS_SEGURANCA = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob: data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'Permissions-Policy': 'camera=(), geolocation=(), payment=(), usb=()',
};

// Link fixo para o instalador do programa (sempre a última versão publicada no GitHub)
const LINK_PROGRAMA = limparEnv(process.env.LINK_PROGRAMA)
  || 'https://github.com/kaiang8/Telinha/releases/latest/download/Caras-E-Telas-Instalador.exe';

function servirEstatico(req, res) {
  let p;
  try {
    p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return json(res, 400, { error: 'endereço inválido' });
  }
  if (p === '/') p = '/index.html';
  let arquivo = path.normalize(path.join(PUBLIC_DIR, p));
  if (!arquivo.startsWith(PUBLIC_DIR + path.sep)) return json(res, 403, { error: 'proibido' });
  const nome = p.slice(1);
  if (ARQUIVOS_DA_PAGINA.includes(nome)) {
    arquivo = acharArquivoDaPagina(nome);
    if (!arquivo) {
      if (nome === 'index.html') return paginaDeAjuda(res);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
  }
  lerParaServir(arquivo).then((f) => {
    const base = {
      'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
      'Cache-Control': 'no-cache', // sempre confere se mudou (sem baixar de novo se não mudou)
      ETag: f.etag,
      Vary: 'Accept-Encoding',
      ...CABECALHOS_SEGURANCA,
    };
    if (req.headers['if-none-match'] === f.etag) {
      res.writeHead(304, base);
      return res.end();
    }
    const comprimir = f.gz && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
    res.writeHead(200, comprimir ? { ...base, 'Content-Encoding': 'gzip' } : base);
    res.end(req.method === 'HEAD' ? undefined : comprimir ? f.gz : f.buf);
  }, () => {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  });
}

// Arquivos da página guardados na memória, já comprimidos, com uma "impressão digital" (ETag):
// quem já tem a versão atual não baixa de novo. Economiza o tráfego do plano grátis.
const ARQUIVOS_PRONTOS = new Map(); // caminho -> { mtime, etag, buf, gz }
const COMPRIMIVEIS = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.webmanifest']);
async function lerParaServir(arquivo) {
  const st = await fs.promises.stat(arquivo);
  const pronto = ARQUIVOS_PRONTOS.get(arquivo);
  if (pronto && pronto.mtime === st.mtimeMs && pronto.tamanho === st.size) return pronto;
  const buf = await fs.promises.readFile(arquivo);
  const f = {
    mtime: st.mtimeMs,
    tamanho: st.size,
    etag: `"${crypto.createHash('sha1').update(buf).digest('base64url').slice(0, 20)}"`,
    buf,
    gz: COMPRIMIVEIS.has(path.extname(arquivo)) && buf.length > 1024 ? zlib.gzipSync(buf, { level: 9 }) : null,
  };
  ARQUIVOS_PRONTOS.set(arquivo, f);
  return f;
}

// ---------- Eventos em tempo real (Server-Sent Events) ----------
function usuarioDoToken(token) {
  return users.get(tokens.get(String(token || '')));
}
function negar401(res, token) {
  const k = expulsos.get(String(token || ''));
  return json(res, 401, { error: 'sessão expirada', ...(k ? { kicked: k } : {}) });
}

function abrirEventos(req, res, url) {
  const token = url.searchParams.get('token');
  const u = usuarioDoToken(token);
  if (!u || u.kicked) return negar401(res, token);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  res.write('retry: 2000\n\n');

  if (u.res && u.res !== res) {
    try { u.res.end(); } catch { /* ignore */ }
  }
  if (u.poller) responderPoll(u);
  u.mode = 'sse';
  u.res = res;
  clearTimeout(u.removeTimer);
  const novo = !u.joined;
  u.joined = true;
  if (novo) console.log(`+ ${u.name} entrou${u.admin ? ' (admin)' : ''}`);

  // Estado completo a cada (re)conexão: o navegador se sincroniza sozinho.
  enviarInit(u);
  broadcastPresenca();

  res.on('close', () => {
    if (u.res !== res) return;
    u.res = null;
    if (u.kicked) return;
    // Dá um tempinho para reconectar (Wi-Fi oscilando, notebook acordando...)
    armarRemocao(u, 15000);
  });
}

// ---------- Plano B: long-polling ----------
// Alguns túneis e proxies seguram (bufferizam) o SSE. Nesse caso o navegador
// troca sozinho para pedidos normais que ficam esperando até ter novidade.
function abrirPoll(req, res, url) {
  const token = url.searchParams.get('token');
  const u = usuarioDoToken(token);
  if (!u) return negar401(res, token);
  if (u.kicked) {
    // entrega o que ainda estiver na fila (o aviso de expulsão)
    const events = u.queue;
    u.queue = [];
    return events.length ? json(res, 200, { events }) : negar401(res, token);
  }
  if (u.res) {
    const velho = u.res;
    u.res = null;
    try { velho.end(); } catch { /* ignore */ }
  }
  u.mode = 'poll';
  clearTimeout(u.removeTimer);
  if (u.poller) responderPoll(u);
  if (url.searchParams.has('init')) {
    u.queue = [];
    if (!u.joined) console.log(`+ ${u.name} entrou (long-polling)${u.admin ? ' (admin)' : ''}`);
    u.joined = true;
    enviarInit(u);
    broadcastPresenca();
  }
  u.poller = res;
  if (u.queue.length) return responderPoll(u);
  u.pollTimer = setTimeout(() => { if (u.poller === res) responderPoll(u); }, 25000);
  res.on('close', () => {
    if (u.poller !== res) return;
    u.poller = null;
    clearTimeout(u.pollTimer);
    armarRemocao(u, 20000);
  });
}

// ---------- Ações de admin ----------
async function acaoAdmin(u, body, res, req) {
  const alvo = body.uid ? users.get(String(body.uid)) : null;
  const precisaAlvo = () => {
    if (!alvo || !alvo.joined || alvo.kicked) {
      json(res, 404, { error: 'Essa pessoa não está mais online' });
      return false;
    }
    return true;
  };
  const motivo = limparNome(body.reason, 200);

  switch (body.action) {
    case 'list':
      return json(res, 200, visaoAdmin());

    case 'esquecer-aparelho':
      data.lembretes = data.lembretes.filter((r) => r.id !== String(body.id));
      salvar();
      return json(res, 200, { ok: true });

    case 'esquecer-aparelhos':
      data.lembretes = body.manter ? data.lembretes.filter((r) => r.id === String(body.manter)) : [];
      salvar();
      return json(res, 200, { ok: true });

    case 'problemas':
      limparProblemasVelhos();
      return json(res, 200, {
        dias: DIAS_PROBLEMAS,
        relatos: PROBLEMAS.dados.relatos.slice().reverse(),
        erros: PROBLEMAS.dados.erros.slice().sort((a, b) => b.ultima - a.ultima),
        qualidade: PROBLEMAS.dados.qualidade.slice().reverse(),
      });

    case 'ler-problemas':
      for (const r of PROBLEMAS.dados.relatos) r.lido = true;
      PROBLEMAS.salvar();
      return json(res, 200, { ok: true });

    case 'apagar-relato':
      PROBLEMAS.dados.relatos = PROBLEMAS.dados.relatos.filter((r) => r.id !== String(body.id));
      PROBLEMAS.salvar();
      return json(res, 200, { ok: true });

    case 'limpar-erros':
      PROBLEMAS.dados.erros = [];
      PROBLEMAS.salvar();
      return json(res, 200, { ok: true });

    case 'conexoes':
      limparRegistroVelho();
      return json(res, 200, {
        dias: REGISTRO_DIAS,
        max: REGISTRO_MAX,
        registro: registro.slice().reverse().map((x) => ({ ...x, online: sessoesAtivas.get(x.id) > 0 })),
      });

    case 'limpar-conexoes':
      registro = registro.filter((x) => sessoesAtivas.get(x.id) > 0); // quem está online continua
      salvarRegistro();
      return json(res, 200, { ok: true });

    case 'kick':
      if (!precisaAlvo()) return;
      if (alvo === u) return json(res, 400, { error: 'Você não pode expulsar a si mesmo' });
      console.log(`! ${u.name} expulsou ${alvo.name}`);
      expulsar(alvo, { by: u.name, reason: motivo, banned: false });
      return json(res, 200, { ok: true });

    case 'ban': {
      if (!precisaAlvo()) return;
      if (alvo === u) return json(res, 400, { error: 'Você não pode banir a si mesmo' });
      const soAparelho = !alvo.ip || ipCompartilhado(alvo);
      data.bans.push({
        id: crypto.randomBytes(6).toString('hex'),
        name: alvo.name,
        ip: soAparelho ? null : alvo.ip,
        device: alvo.device || null,
        reason: motivo,
        by: u.name,
        ts: Date.now(),
      });
      salvar();
      console.log(`! ${u.name} baniu ${alvo.name}`);
      expulsar(alvo, { by: u.name, reason: motivo, banned: true });
      return json(res, 200, { ok: true, soAparelho });
    }

    case 'unban': {
      const antes = data.bans.length;
      data.bans = data.bans.filter((b) => b.id !== body.id);
      if (data.bans.length === antes) return json(res, 404, { error: 'Banimento não encontrado' });
      salvar();
      return json(res, 200, { ok: true });
    }

    case 'mute': {
      if (!precisaAlvo()) return;
      if (alvo === u) return json(res, 400, { error: 'Você não pode silenciar a si mesmo' });
      const minutos = Number(body.minutes);
      const until = minutos > 0 ? Date.now() + Math.min(minutos, 60 * 24 * 365) * 60e3 : Date.now() + 10 * 365 * 864e5;
      data.mutes = data.mutes.filter((m) => !((m.device && m.device === alvo.device) || (m.ip && m.ip === alvo.ip)));
      data.mutes.push({ ip: ipCompartilhado(alvo) ? null : alvo.ip, device: alvo.device || null, name: alvo.name, until });
      salvar();
      enviar(alvo, { type: 'muted', until, by: u.name });
      broadcastPresenca(); // os outros param de ouvir a voz de quem foi silenciado
      // quando o silêncio acaba sozinho, avisa todo mundo para voltarem a ouvir
      if (until - Date.now() < 2 ** 31 - 1) setTimeout(broadcastPresenca, until - Date.now() + 500).unref();
      return json(res, 200, { ok: true, until });
    }

    case 'unmute': {
      if (!precisaAlvo()) return;
      data.mutes = data.mutes.filter((m) => !((m.device && m.device === alvo.device) || (m.ip && m.ip === alvo.ip)));
      salvar();
      enviar(alvo, { type: 'muted', until: 0, by: u.name });
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'stop-stream':
    case 'remove-sala':
      if (!precisaAlvo()) return;
      alvo.live = false;
      if (body.action === 'remove-sala') alvo.sala = null;
      enviar(alvo, { type: 'force', what: body.action === 'remove-sala' ? 'leave' : 'stop', by: u.name });
      broadcastPresenca();
      return json(res, 200, { ok: true });

    case 'toggle-admin':
      if (!precisaAlvo()) return;
      if (alvo === u) return json(res, 400, { error: 'Para deixar de ser admin, use "Sair do modo admin"' });
      alvo.admin = !alvo.admin;
      enviar(alvo, { type: 'role', admin: alvo.admin, by: u.name });
      broadcastPresenca();
      return json(res, 200, { ok: true, admin: alvo.admin });

    case 'rename-user': {
      if (!precisaAlvo()) return;
      const nome = limparNome(body.name, 32);
      if (!nome) return json(res, 400, { error: 'Nome inválido' });
      alvo.name = nome;
      enviar(alvo, { type: 'renamed', name: nome, by: u.name });
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'clear': {
      const c = canal(body.channel);
      if (!c) return json(res, 404, { error: 'Canal não existe' });
      data.messages[c.id] = [];
      salvar();
      broadcast({ type: 'clear', channel: c.id, by: u.name });
      return json(res, 200, { ok: true });
    }

    case 'announce': {
      const text = String(body.text || '').trim().slice(0, 500);
      if (!text) return json(res, 400, { error: 'Escreva o aviso' });
      broadcast({ type: 'announce', text, by: u.name, ts: Date.now() });
      return json(res, 200, { ok: true });
    }

    case 'settings': {
      if (body.serverName !== undefined) {
        const nome = limparNome(body.serverName, 40);
        if (!nome) return json(res, 400, { error: 'Nome inválido' });
        data.settings.serverName = nome;
      }
      if (body.senha !== undefined) {
        const s = String(body.senha || '').trim();
        data.settings.senhaHash = s ? hashSenha(s.slice(0, 100)) : null;
      }
      if (body.locked !== undefined) data.settings.locked = !!body.locked;
      salvar();
      broadcastConfig();
      return json(res, 200, { ok: true, settings: visaoAdmin().settings });
    }

    case 'admin-password': {
      if (ADMIN_ENV_HASH) return json(res, 400, { error: 'A senha de admin está definida na variável ADMIN_SENHA da hospedagem. Troque por lá.' });
      const s = String(body.senha || '').trim();
      if (s.length < 6) return json(res, 400, { error: 'Use pelo menos 6 caracteres' });
      data.settings.adminHash = hashSenha(s.slice(0, 100));
      delete data.settings.adminGerada;
      data.lembretes = []; // senha nova: os aparelhos lembrados com a antiga deixam de valer
      salvar();
      return json(res, 200, { ok: true, lembrete: criarLembrete(u, req) });
    }

    default:
      return json(res, 400, { error: 'ação desconhecida' });
  }
}

// ---------- Rotas da API ----------
// ---------- Imagens do chat passam pelo servidor ----------
// Assim o site de onde a imagem vem nunca vê o IP de quem está no chat
// (um link de "capturador de IP" postado no chat não pega ninguém).
const IMG_MAX_BYTES = 8 * 1024 * 1024;
const IMG_TIPOS = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);
let imgEmAndamento = 0;

function ipPrivado(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19));
  }
  const x = ip.toLowerCase();
  const v4 = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) return ipPrivado(v4[1]);
  return x === '::' || x === '::1' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith('ff');
}

// Só https, porta padrão e endereços públicos (o servidor não vira ponte para a rede interna)
async function enderecoPublico(u) {
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) return !ipPrivado(host);
  if (!host.includes('.') || /(^|\.)(localhost|local|internal|lan|home)$/i.test(host)) return false;
  try {
    const ips = await dns.lookup(host, { all: true, verbatim: true });
    return ips.length > 0 && ips.every((e) => !ipPrivado(e.address));
  } catch {
    return false;
  }
}

async function proxyImagem(req, res, url) {
  const u = usuarioDoToken(url.searchParams.get('t'));
  if (!u || u.kicked) return json(res, 401, { error: 'sessão expirada' });
  const agora = Date.now();
  if (!u.img || agora - u.img.inicio > 60000) u.img = { inicio: agora, n: 0 };
  if (++u.img.n > 120 || imgEmAndamento >= 12) return json(res, 429, { error: 'muitas imagens, tente já já' });
  let alvo;
  try {
    alvo = new URL(String(url.searchParams.get('u') || ''));
  } catch {
    return json(res, 400, { error: 'endereço inválido' });
  }
  imgEmAndamento++;
  const ctrl = new AbortController();
  const prazo = setTimeout(() => ctrl.abort(), 10000);
  res.on('close', () => ctrl.abort());
  try {
    let r = null;
    for (let saltos = 0; saltos < 4; saltos++) {
      if (!(await enderecoPublico(alvo))) return json(res, 403, { error: 'endereço não permitido' });
      r = await fetch(alvo, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'User-Agent': 'CarasETelas/1.0 (imagens do chat)', Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9' },
      });
      if (![301, 302, 303, 307, 308].includes(r.status)) break;
      const prox = r.headers.get('location');
      if (!prox) break;
      alvo = new URL(prox, alvo);
      r = null;
    }
    if (!r || !r.ok) return json(res, 404, { error: 'imagem não encontrada' });
    const tipo = String(r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!IMG_TIPOS.has(tipo)) return json(res, 415, { error: 'não é uma imagem' });
    if (Number(r.headers.get('content-length') || 0) > IMG_MAX_BYTES) return json(res, 413, { error: 'imagem grande demais' });
    res.writeHead(200, {
      'Content-Type': tipo,
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': 'inline',
      'Referrer-Policy': 'no-referrer',
    });
    let total = 0;
    for await (const pedaco of r.body) {
      total += pedaco.length;
      if (total > IMG_MAX_BYTES) {
        ctrl.abort();
        return res.destroy();
      }
      if (!res.write(pedaco)) await new Promise((ok) => res.once('drain', ok));
    }
    res.end();
  } catch {
    if (!res.headersSent) json(res, 502, { error: 'não consegui buscar a imagem' });
    else res.destroy();
  } finally {
    clearTimeout(prazo);
    imgEmAndamento--;
  }
}

async function api(req, res, url) {
  const rota = url.pathname.slice('/api/'.length);
  if ((req.method === 'GET' || req.method === 'HEAD') && rota === 'img') return proxyImagem(req, res, url);

  if (req.method === 'GET' && rota === 'config') return json(res, 200, configPublica());
  if (req.method === 'GET' && rota === 'events') return abrirEventos(req, res, url);
  if (req.method === 'GET' && rota === 'poll') return abrirPoll(req, res, url);
  if (req.method !== 'POST') return json(res, 405, { error: 'método não permitido' });

  let body;
  try {
    body = await lerCorpo(req);
  } catch (e) {
    return json(res, 400, { error: e.message });
  }

  if (rota === 'join') {
    const ip = ipDe(req);
    if (bloqueado(ip)) return json(res, 429, { error: 'Muitas tentativas erradas. Espere uns minutos e tente de novo.' });
    const device = /^[a-z0-9]{8,40}$/i.test(body.device) ? body.device : '';
    let admin = false;
    let lembrar = false;
    let lembreteUsado = null;
    if (body.adminPassword) {
      if (!confereSenha(body.adminPassword, hashAdmin())) {
        falhou(ip);
        registrarRecusa(req, ip, limparNome(body.name, 32), 'senha de admin errada');
        return json(res, 403, { error: 'Senha de admin incorreta', campo: 'admin' });
      }
      admin = true;
      lembrar = body.lembrar !== false;
    } else if (body.lembrete) {
      // aparelho lembrado: entra como admin sem digitar a senha
      lembreteUsado = lembreteValido(body.lembrete);
      if (!lembreteUsado) {
        falhou(ip);
        registrarRecusa(req, ip, limparNome(body.name, 32), 'aparelho de admin esquecido');
        return json(res, 403, { error: 'Este aparelho não está mais lembrado como admin (a senha mudou ou ele foi esquecido). Digite a senha de admin, ou entre sem ser admin.', campo: 'lembrete' });
      }
      admin = true;
    }
    if (!admin) {
      if (!senhaSiteConfere(body.password)) {
        falhou(ip);
        registrarRecusa(req, ip, limparNome(body.name, 32), 'senha errada');
        return json(res, 403, { error: 'Senha incorreta', campo: 'senha' });
      }
      const ban = banDe(ip, device);
      if (ban) {
        registrarRecusa(req, ip, limparNome(body.name, 32), 'banido');
        return json(res, 403, { error: `Você foi banido deste servidor.${ban.reason ? ` Motivo: ${ban.reason}` : ''}`, banned: true });
      }
      if (data.settings.locked) {
        registrarRecusa(req, ip, limparNome(body.name, 32), 'servidor trancado');
        return json(res, 423, { error: 'O servidor está trancado agora. Peça para um admin destrancar.' });
      }
    }
    const name = limparNome(body.name, 32);
    if (!name) return json(res, 400, { error: 'Escolha um apelido' });
    const color = /^#[0-9a-f]{6}$/i.test(body.color) ? body.color : CORES[Math.floor(Math.random() * CORES.length)];
    const u = {
      id: crypto.randomBytes(6).toString('hex'),
      token: crypto.randomBytes(24).toString('hex'),
      name,
      color,
      ip,
      device,
      admin,
      kicked: null,
      sala: null,
      live: false,
      res: null,
      mode: 'sse',
      queue: [],
      poller: null,
      pollTimer: null,
      joined: false,
      removeTimer: null,
      lastTyping: 0,
    };
    users.set(u.id, u);
    tokens.set(u.token, u.id);
    registrarEntrada(u, req);
    // Se o navegador nunca abrir os eventos, some sozinho.
    armarRemocao(u, 30000);
    if (lembreteUsado) {
      lembreteUsado.usado = Date.now();
      lembreteUsado.nome = name;
      lembreteUsado.aparelho = aparelhoDe(req);
      salvar();
    }
    return json(res, 200, {
      id: u.id, token: u.token, admin,
      ...(lembrar ? { lembrete: criarLembrete(u, req) } : {}),
      ...(lembreteUsado ? { lembreteId: lembreteUsado.id } : {}),
    });
  }

  // Daqui pra baixo precisa estar logado
  const u = usuarioDoToken(body.token);
  if (!u || u.kicked) return negar401(res, body.token);

  const soAdmin = () => {
    if (u.admin) return true;
    json(res, 403, { error: 'Só admins podem fazer isso' });
    return false;
  };

  switch (rota) {
    case 'msg': {
      const c = canal(body.channel);
      const text = String(body.text || '').trim().slice(0, 2000);
      if (!c || !text) return json(res, 400, { error: 'mensagem inválida' });
      const ate = silencioDe(u);
      if (ate) return json(res, 403, { error: 'Você está silenciado por um admin', muted: ate });
      const m = {
        id: crypto.randomBytes(8).toString('hex'),
        ch: c.id,
        uid: u.id,
        name: u.name,
        color: u.color,
        admin: !!u.admin,
        text,
        ts: Date.now(),
      };
      const lista = (data.messages[c.id] ||= []);
      lista.push(m);
      if (lista.length > MAX_MSGS_POR_CANAL) lista.splice(0, lista.length - MAX_MSGS_POR_CANAL);
      salvar();
      broadcast({ type: 'msg', msg: m });
      return json(res, 200, { ok: true });
    }

    case 'msg-delete': {
      const lista = data.messages[body.channel] || [];
      const i = lista.findIndex((m) => m.id === body.id);
      if (i < 0) return json(res, 404, { error: 'Mensagem não encontrada' });
      if (lista[i].uid !== u.id && !u.admin) return json(res, 403, { error: 'Você só pode apagar as suas mensagens' });
      lista.splice(i, 1);
      salvar();
      broadcast({ type: 'msg-delete', channel: body.channel, id: body.id });
      return json(res, 200, { ok: true });
    }

    case 'typing': {
      const agora = Date.now();
      if (canal(body.channel) && agora - u.lastTyping > 1500 && !silencioDe(u)) {
        u.lastTyping = agora;
        broadcast({ type: 'typing', channel: body.channel, uid: u.id, name: u.name });
      }
      return json(res, 200, { ok: true });
    }

    case 'state': {
      const sala = body.sala == null ? null : canal(body.sala);
      if (body.sala != null && (!sala || sala.type !== 'sala')) return json(res, 400, { error: 'sala inválida' });
      u.sala = sala ? sala.id : null;
      u.live = !!(u.sala && body.live);
      if (!u.live) u.caneta = null; // parou de transmitir: a caneta volta para "ninguém"
      if (typeof body.mudo === 'boolean') u.mudo = body.mudo; // microfone desligado
      if (typeof body.surdo === 'boolean') u.surdo = body.surdo; // som da sala desligado
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'erro': {
      // erro que aconteceu na página de alguém: junta os iguais e conta quantas vezes
      if (limiteDe(u, 'limErro', 20, 10 * 60e3)) return json(res, 200, { ok: true });
      const msg = textoLimpo(body.msg, 300);
      if (!msg) return json(res, 400, { error: 'erro vazio' });
      const onde = textoLimpo(body.onde, 200);
      const versao = textoLimpo(body.versao, 30);
      limparProblemasVelhos();
      const lista = PROBLEMAS.dados.erros;
      let e = lista.find((x) => x.msg === msg && x.onde === onde);
      if (!e) {
        e = { msg, onde, vezes: 0, primeira: Date.now(), ultima: 0, quem: [], aparelhos: [], versoes: [] };
        lista.push(e);
      }
      e.vezes++;
      e.ultima = Date.now();
      const juntar = (arr, v) => { if (v && !arr.includes(v) && arr.length < 6) arr.push(v); };
      juntar(e.quem, u.name);
      juntar(e.aparelhos, aparelhoDe(req));
      juntar(e.versoes, versao);
      PROBLEMAS.salvar(10000);
      return json(res, 200, { ok: true });
    }

    case 'qualidade': {
      // resumo da qualidade de uma transmissão (de quem mandou ou de quem assistiu)
      if (limiteDe(u, 'limQualidade', 15, 10 * 60e3)) return json(res, 200, { ok: true });
      const num = (v, max) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(0, Math.round(Number(v) * 10) / 10)) : 0);
      const papel = body.papel === 'envio' ? 'envio' : 'recebe';
      const r = {
        t: Date.now(), nome: u.name, papel, aparelho: aparelhoDe(req),
        duracao: num(body.duracao, 86400), alturaMedia: num(body.alturaMedia, 4320), alturaMin: num(body.alturaMin, 4320),
        fpsMedio: num(body.fpsMedio, 240), codec: textoLimpo(body.codec, 12), programa: body.programa === true,
        alturaFonte: num(body.alturaFonte, 4320), alturaMax: num(body.alturaMax, 4320),
      };
      if (papel === 'envio') {
        Object.assign(r, {
          pessoas: Array.isArray(body.pessoas) ? body.pessoas.slice(0, 12).map((x) => textoLimpo(x, 32)) : [],
          maxPessoas: num(body.maxPessoas, 50), qualidade: textoLimpo(body.qualidade, 12), upload: textoLimpo(body.upload, 6),
          cpuPct: num(body.cpuPct, 100), bandaPct: num(body.bandaPct, 100), mbpsMedio: num(body.mbpsMedio, 1000),
          hardware: typeof body.hardware === 'boolean' ? body.hardware : null,
          fpsMeta: num(body.fpsMeta, 240), placa: textoLimpo(body.placa, 120),
        });
      } else {
        Object.assign(r, { de: textoLimpo(body.de, 32), perdaPct: num(body.perdaPct, 100), travadas: num(body.travadas, 100000) });
      }
      limparProblemasVelhos();
      PROBLEMAS.dados.qualidade.push(r);
      PROBLEMAS.salvar(10000);
      return json(res, 200, { ok: true });
    }

    case 'relatar': {
      if (limiteDe(u, 'limRelato', 5, 10 * 60e3)) return json(res, 429, { error: 'Muitos relatos seguidos. Espere uns minutos.' });
      const texto = textoLimpo(body.texto, 1000);
      if (!texto) return json(res, 400, { error: 'Conte o que aconteceu' });
      let info = null;
      if (body.info && typeof body.info === 'object') {
        const j = JSON.stringify(body.info);
        info = j.length <= 12000 ? JSON.parse(j) : { aviso: 'informações grandes demais, cortadas' };
      }
      limparProblemasVelhos();
      PROBLEMAS.dados.relatos.push({
        id: crypto.randomBytes(5).toString('hex'), t: Date.now(), nome: u.name, ip: u.ip, aparelho: aparelhoDe(req), texto, info, lido: false,
      });
      PROBLEMAS.salvar(2000);
      avisarAdmins(`${u.name} relatou um problema. Veja no Painel de admin, em Problemas.`);
      return json(res, 200, { ok: true });
    }

    case 'caneta': {
      // quem transmite escolhe quem pode desenhar na tela dele
      if (!u.live) return json(res, 409, { error: 'Você não está transmitindo' });
      const padrao = body.padrao === 'todos' ? 'todos' : 'ninguem';
      const excecoes = Array.isArray(body.excecoes)
        ? [...new Set(body.excecoes.map(String).filter((id) => users.has(id) && id !== u.id))].slice(0, 50) : [];
      u.caneta = { padrao, excecoes };
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'tinta': {
      // um pedaço de traço: no máximo 64 pontos, coordenadas de 0 a 1 do quadro do vídeo
      const alvo = users.get(String(body.sid));
      if (!alvo || alvo === u || !u.sala || alvo.sala !== u.sala || !alvo.live) return json(res, 409, { error: 'Essa transmissão acabou' });
      if (!podeDesenhar(alvo, u)) return json(res, 403, { error: 'A caneta não está liberada para você nessa tela', semCaneta: true });
      const agora = Date.now();
      if (!u.tinta || agora - u.tinta.desde > 1000) u.tinta = { desde: agora, n: 0 };
      if (++u.tinta.n > 40) return json(res, 429, { error: 'Calma com a caneta' });
      const tr = typeof body.tr === 'string' && /^[a-z0-9]{4,12}$/.test(body.tr) ? body.tr : null;
      const c = Number.isInteger(body.c) && body.c >= 0 && body.c < 5 ? body.c : null;
      const p = pontosDaTinta(body.p);
      if (!tr || c === null || !p) return json(res, 400, { error: 'traço inválido' });
      const traco = { type: 'tinta', from: u.id, nome: u.name, sid: alvo.id, tr, c, p, fim: body.fim === true };
      for (const x of users.values()) if (x !== u && x.sala === u.sala && !x.kicked) enviar(x, traco);
      return json(res, 200, { ok: true });
    }

    case 'signal': {
      const alvo = users.get(String(body.to));
      if (!alvo || alvo === u || alvo.kicked) return json(res, 404, { error: 'usuário não encontrado' });
      // Conexões (vídeo e voz) só entre quem está na mesma sala: ninguém de fora consegue nem tentar
      if (!u.sala || alvo.sala !== u.sala) return json(res, 409, { error: 'vocês não estão na mesma sala' });
      enviar(alvo, { type: 'signal', from: u.id, data: body.data });
      return json(res, 200, { ok: true });
    }

    case 'admin-login': {
      const ip = ipDe(req);
      if (bloqueado(ip)) return json(res, 429, { error: 'Muitas tentativas erradas. Espere uns minutos.' });
      if (!confereSenha(body.password, hashAdmin())) {
        falhou(ip);
        return json(res, 403, { error: 'Senha de admin incorreta' });
      }
      u.admin = true;
      console.log(`! ${u.name} entrou no modo admin`);
      enviar(u, { type: 'role', admin: true });
      broadcastPresenca();
      return json(res, 200, { ok: true, ...(body.lembrar !== false ? { lembrete: criarLembrete(u, req) } : {}) });
    }

    case 'admin-logout':
      u.admin = false;
      enviar(u, { type: 'role', admin: false });
      broadcastPresenca();
      return json(res, 200, { ok: true });

    case 'admin':
      if (!soAdmin()) return;
      return acaoAdmin(u, body, res, req);

    case 'channel': {
      if (!soAdmin()) return;
      const tipo = body.type === 'sala' ? 'sala' : 'text';
      let nome = limparNome(body.name, 24);
      if (tipo === 'text') nome = slug(nome);
      if (!nome) return json(res, 400, { error: 'Nome inválido' });
      if (data.channels.length >= MAX_CANAIS) return json(res, 400, { error: 'Canais demais' });
      const base = slug(nome) || 'canal';
      let id = base;
      for (let i = 2; canal(id); i++) id = `${base}-${i}`;
      data.channels.push({ id, name: nome, type: tipo });
      salvar();
      broadcast({ type: 'channels', channels: data.channels });
      return json(res, 200, { id });
    }

    case 'channel-rename': {
      if (!soAdmin()) return;
      const c = canal(body.id);
      if (!c) return json(res, 404, { error: 'Canal não existe' });
      let nome = limparNome(body.name, 24);
      if (c.type === 'text') nome = slug(nome);
      if (!nome) return json(res, 400, { error: 'Nome inválido' });
      c.name = nome;
      salvar();
      broadcast({ type: 'channels', channels: data.channels });
      return json(res, 200, { ok: true });
    }

    case 'channel-delete': {
      if (!soAdmin()) return;
      const c = canal(body.id);
      if (!c) return json(res, 404, { error: 'Canal não existe' });
      if (data.channels.filter((x) => x.type === c.type).length <= 1) {
        return json(res, 400, { error: c.type === 'sala' ? 'Precisa sobrar pelo menos uma sala' : 'Precisa sobrar pelo menos um canal de texto' });
      }
      data.channels = data.channels.filter((x) => x.id !== c.id);
      delete data.messages[c.id];
      salvar();
      for (const x of users.values()) if (x.sala === c.id) { x.sala = null; x.live = false; }
      broadcast({ type: 'channels', channels: data.channels });
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'sb': {
      // Soundboard: avisa quem está na mesma sala qual som foi tocado (o som vai pela transmissão)
      const agora = Date.now();
      if (!u.sala || agora - (u.lastSb || 0) < 250) return json(res, 200, { ok: true });
      u.lastSb = agora;
      const aviso = { type: 'sb', uid: u.id, nome: limparNome(body.nome, 24), emoji: String(body.emoji || '').slice(0, 8) };
      for (const x of users.values()) if (x !== u && x.sala === u.sala) enviar(x, aviso);
      return json(res, 200, { ok: true });
    }

    case 'ping':
      return json(res, 200, { ok: true });

    case 'leave':
      removerUsuario(u);
      return json(res, 200, { ok: true });

    case 'esquecer-lembrete': {
      // o próprio aparelho pede para ser esquecido (precisa mostrar a chave)
      const h = typeof body.token === 'string' ? resumo(body.token) : '';
      const antes = data.lembretes.length;
      data.lembretes = data.lembretes.filter((r) => r.hash !== h);
      if (data.lembretes.length !== antes) salvar();
      return json(res, 200, { ok: true });
    }

    default:
      return json(res, 404, { error: 'rota desconhecida' });
  }
}

// ---------- Servidor ----------
const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://x');
  } catch {
    return json(res, 400, { error: 'endereço inválido' });
  }
  const p = url.pathname;
  medirResposta(res, p === '/api/img' ? 'imagens' : p === '/api/events' || p === '/api/poll' ? 'tempoReal' : p.startsWith('/api/') ? 'api' : 'pagina');
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch((e) => {
      console.error(e);
      if (!res.headersSent) json(res, 500, { error: 'erro interno' });
    });
  } else if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/baixar') {
    res.writeHead(302, { Location: LINK_PROGRAMA, 'Cache-Control': 'no-store' });
    res.end();
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    servirEstatico(req, res);
  } else {
    json(res, 405, { error: 'método não permitido' });
  }
});

// Mantém as conexões de eventos vivas atrás de proxies
setInterval(() => {
  for (const u of users.values()) {
    if (u.res) {
      try { u.res.write(': ping\n\n'); } catch { /* ignore */ }
    }
  }
}, 20000);

function abrirNavegador() {
  if (!process.env.ABRIR_NAVEGADOR) return;
  const url = `http://localhost:${PORT}`;
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  require('child_process').exec(cmd, () => {});
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n  A porta ${PORT} já está em uso. O Caras E Telas já está aberto em outra janela?`);
    console.log(`  Se estiver, é só acessar http://localhost:${PORT}\n`);
    abrirNavegador();
    setTimeout(() => process.exit(1), 500);
  } else {
    throw err;
  }
});

async function iniciar() {
  console.log('');
  const faltando = ARQUIVOS_DA_PAGINA.filter((n) => !acharArquivoDaPagina(n));
  if (faltando.length) {
    console.warn(`  ATENÇÃO: não encontrei ${faltando.join(', ')} (nem em public/, nem ao lado do server.js).`);
    console.warn('  Envie esses arquivos para o GitHub, senão o site não abre.\n');
  }
  await carregarDados();
  await carregarRegistro();
  await TRAFEGO.carregar();
  await PROBLEMAS.carregar();
  garantirSenhaAdmin();
  server.listen(PORT, () => {
    console.log(`\n  ${nomeServidor()} rodando em http://localhost:${PORT}`);
    console.log(precisaSenha() ? '  Entrada protegida por senha.' : '  Entrada sem senha (dá para colocar uma no painel de admin).');
    console.log(`  Dados salvos em: ${USA_UPSTASH ? 'Upstash (nuvem)' : DATA_FILE}`);
    if (ADMIN_ENV_HASH) console.log('  Senha de admin: a definida em ADMIN_SENHA.');
    else if (data.settings.adminGerada) console.log(`  Senha de admin (gerada automaticamente): ${data.settings.adminGerada}  <- troque no painel de admin`);
    else console.log('  Senha de admin: a que você escolheu no painel de admin.');
    if (process.env.TURN_URL) console.log('  Servidor TURN configurado.');
    console.log('\n  Deixe esta janela aberta enquanto estiverem usando. Para desligar: Ctrl+C.\n');
    abrirNavegador();
  });
}

let desligando = false;
async function desligar() {
  if (desligando) return;
  desligando = true;
  clearTimeout(saveTimer);
  // Garante que a última alteração foi salva (no máximo 5 s)
  const espera = new Promise((ok) => setTimeout(ok, 5000));
  clearTimeout(registroTimer);
  // quem está online sai do registro com a hora de agora
  for (const u of users.values()) registrarSaida(u);
  await Promise.race([Promise.all([
    (async () => { while (salvando) await new Promise((ok) => setTimeout(ok, 50)); await gravar(); })(),
    (async () => { while (gravandoRegistro) await new Promise((ok) => setTimeout(ok, 50)); clearTimeout(registroTimer); await gravarRegistro(); })(),
    TRAFEGO.terminar(),
    PROBLEMAS.terminar(),
  ]), espera]);
  process.exit(0);
}
process.on('SIGINT', desligar);
process.on('SIGTERM', desligar);

iniciar();
