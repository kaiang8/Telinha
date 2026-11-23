'use strict';
/*
 * Telinha — servidor estilo Discord para conversar e compartilhar a tela com os amigos.
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

// ---------- Configuração (variáveis de ambiente) ----------
const PORT = Number(process.env.PORT) || 3000;
const SENHA_ENV = process.env.SENHA || '';
const ADMIN_SENHA_ENV = process.env.ADMIN_SENHA || '';
const NOME_ENV = (process.env.NOME_SERVIDOR || 'Nosso Servidor').slice(0, 40);
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
};
let podeSalvar = true;

function aplicarDados(raw) {
  if (!raw || typeof raw !== 'object') return;
  if (Array.isArray(raw.channels) && raw.channels.length) data.channels = raw.channels;
  if (raw.messages && typeof raw.messages === 'object') data.messages = raw.messages;
  if (raw.settings && typeof raw.settings === 'object') data.settings = { locked: false, ...raw.settings };
  if (Array.isArray(raw.bans)) data.bans = raw.bans;
  if (Array.isArray(raw.mutes)) data.mutes = raw.mutes;
}

async function upstash(comando) {
  const r = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(comando),
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

// ---------- Configurações do servidor ----------
const nomeServidor = () => data.settings.serverName || NOME_ENV;
const hashSite = () => ('senhaHash' in data.settings ? data.settings.senhaHash : SENHA_ENV_HASH);
const precisaSenha = () => !!hashSite();
const senhaSiteConfere = (p) => !hashSite() || confereHash(p, hashSite());
const hashAdmin = () => ADMIN_ENV_HASH || data.settings.adminHash;

function garantirSenhaAdmin() {
  if (ADMIN_ENV_HASH || data.settings.adminHash) return;
  const nova = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  data.settings.adminHash = hashSenha(nova);
  data.settings.adminGerada = nova; // só enquanto ninguém trocar
  salvar();
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

const CORES = ['#5865f2', '#eb459e', '#57f287', '#fee75c', '#ed4245', '#f47b67', '#3ba55c', '#9b59b6', '#1abc9c', '#e67e22'];

function publicUser(u) {
  return { id: u.id, name: u.name, color: u.color, sala: u.sala, live: u.live, admin: !!u.admin };
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
function configPublica() {
  return { serverName: nomeServidor(), needsPassword: precisaSenha(), locked: !!data.settings.locked };
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
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Faltam arquivos</title><body style="font-family:system-ui,sans-serif;background:#313338;color:#dbdee1;max-width:640px;margin:60px auto;padding:0 20px;line-height:1.6">
<h1 style="color:#fff">O servidor está ligado, mas faltam arquivos da página</h1>
<p>Não encontrei: <b>${faltando.join(', ')}</b></p>
<p>No GitHub, clique em <b>Add file → Upload files</b> e envie esses arquivos (eles ficam dentro da pasta <code>public</code> no seu computador).
Podem ficar soltos, junto do <code>server.js</code>, ou dentro de uma pasta <code>public</code>. Depois clique em <b>Commit changes</b>
e espere uns 2 minutos: o Render atualiza sozinho.</p></body></html>`);
}

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
  fs.readFile(arquivo, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    res.end(buf);
  });
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
async function acaoAdmin(u, body, res) {
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
      return json(res, 200, { ok: true, until });
    }

    case 'unmute': {
      if (!precisaAlvo()) return;
      data.mutes = data.mutes.filter((m) => !((m.device && m.device === alvo.device) || (m.ip && m.ip === alvo.ip)));
      salvar();
      enviar(alvo, { type: 'muted', until: 0, by: u.name });
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
        const s = String(body.senha || '');
        data.settings.senhaHash = s ? hashSenha(s.slice(0, 100)) : null;
      }
      if (body.locked !== undefined) data.settings.locked = !!body.locked;
      salvar();
      broadcastConfig();
      return json(res, 200, { ok: true, settings: visaoAdmin().settings });
    }

    case 'admin-password': {
      if (ADMIN_ENV_HASH) return json(res, 400, { error: 'A senha de admin está definida na variável ADMIN_SENHA da hospedagem. Troque por lá.' });
      const s = String(body.senha || '');
      if (s.length < 6) return json(res, 400, { error: 'Use pelo menos 6 caracteres' });
      data.settings.adminHash = hashSenha(s.slice(0, 100));
      delete data.settings.adminGerada;
      salvar();
      return json(res, 200, { ok: true });
    }

    default:
      return json(res, 400, { error: 'ação desconhecida' });
  }
}

// ---------- Rotas da API ----------
async function api(req, res, url) {
  const rota = url.pathname.slice('/api/'.length);

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
    if (body.adminPassword) {
      if (!confereHash(body.adminPassword, hashAdmin())) {
        falhou(ip);
        return json(res, 403, { error: 'Senha de admin incorreta', campo: 'admin' });
      }
      admin = true;
    }
    if (!admin) {
      if (!senhaSiteConfere(body.password)) {
        falhou(ip);
        return json(res, 403, { error: 'Senha incorreta', campo: 'senha' });
      }
      const ban = banDe(ip, device);
      if (ban) return json(res, 403, { error: `Você foi banido deste servidor.${ban.reason ? ` Motivo: ${ban.reason}` : ''}`, banned: true });
      if (data.settings.locked) return json(res, 423, { error: 'O servidor está trancado agora. Peça para um admin destrancar.' });
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
    // Se o navegador nunca abrir os eventos, some sozinho.
    armarRemocao(u, 30000);
    return json(res, 200, { id: u.id, token: u.token, admin });
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
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'signal': {
      const alvo = users.get(String(body.to));
      if (!alvo || alvo === u || alvo.kicked) return json(res, 404, { error: 'usuário não encontrado' });
      enviar(alvo, { type: 'signal', from: u.id, data: body.data });
      return json(res, 200, { ok: true });
    }

    case 'admin-login': {
      const ip = ipDe(req);
      if (bloqueado(ip)) return json(res, 429, { error: 'Muitas tentativas erradas. Espere uns minutos.' });
      if (!confereHash(body.password, hashAdmin())) {
        falhou(ip);
        return json(res, 403, { error: 'Senha de admin incorreta' });
      }
      u.admin = true;
      console.log(`! ${u.name} entrou no modo admin`);
      enviar(u, { type: 'role', admin: true });
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'admin-logout':
      u.admin = false;
      enviar(u, { type: 'role', admin: false });
      broadcastPresenca();
      return json(res, 200, { ok: true });

    case 'admin':
      if (!soAdmin()) return;
      return acaoAdmin(u, body, res);

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

    case 'ping':
      return json(res, 200, { ok: true });

    case 'leave':
      removerUsuario(u);
      return json(res, 200, { ok: true });

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
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch((e) => {
      console.error(e);
      if (!res.headersSent) json(res, 500, { error: 'erro interno' });
    });
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
    console.log(`\n  A porta ${PORT} já está em uso. O Telinha já está aberto em outra janela?`);
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
  await Promise.race([(async () => { while (salvando) await new Promise((ok) => setTimeout(ok, 50)); await gravar(); })(), espera]);
  process.exit(0);
}
process.on('SIGINT', desligar);
process.on('SIGTERM', desligar);

iniciar();
