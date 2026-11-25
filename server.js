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
// TURN da Cloudflare (para quem está em rede que bloqueia a conexão direta: 4G/5G, CGNAT...).
// A Cloudflare só aceita senhas temporárias: o servidor gera umas que valem 48 h e renova a cada
// 12 h, então quem entra sempre recebe uma válida por pelo menos 36 h. Sem as duas chaves no
// Render (ou se a Cloudflare não responder), tudo funciona como antes, só sem o TURN.
const CF_TURN = { id: (process.env.CLOUDFLARE_TURN_ID || '').trim(), token: (process.env.CLOUDFLARE_TURN_TOKEN || '').trim(), servidores: [], quando: 0, erro: '' };
const CF_TURN_API = (process.env.CLOUDFLARE_TURN_API || 'https://rtc.live.cloudflare.com/v1').replace(/\/+$/, '');
async function renovarTurnCloudflare() {
  if (!CF_TURN.id || !CF_TURN.token) return;
  let espera = 12 * 3600e3;
  try {
    const r = await fetch(`${CF_TURN_API}/turn/keys/${encodeURIComponent(CF_TURN.id)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_TURN.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: 172800 }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`HTTP ${r.status}${j?.error ? `: ${j.error}` : ''}`);
    // só os de TURN (os de STUN já estão na lista), e sem a porta 53, que alguns navegadores bloqueiam
    const turn = (Array.isArray(j.iceServers) ? j.iceServers : []).filter((x) => x && x.username && x.credential).map((x) => ({
      urls: [].concat(x.urls).filter((u) => typeof u === 'string' && /^turns?:/.test(u) && !/:53(\?|$)/.test(u)),
      username: String(x.username), credential: String(x.credential),
    })).filter((x) => x.urls.length);
    if (!turn.length) throw new Error('a resposta não trouxe servidores TURN');
    CF_TURN.servidores = turn;
    CF_TURN.quando = Date.now();
    CF_TURN.erro = '';
  } catch (e) {
    CF_TURN.erro = e.message;
    console.warn('  TURN da Cloudflare: não consegui gerar as senhas:', e.message);
    espera = 5 * 60e3; // tenta de novo daqui a pouco
  }
  setTimeout(renovarTurnCloudflare, espera).unref();
}
const iceParaEnviar = () => [...iceServers, ...CF_TURN.servidores];

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
  perfis: {}, // cada pessoa: id -> { nome, cor, criado, visto, chaves: [resumos das chaves dos aparelhos] }
  nomesAntigos: {}, // nome (normalizado) das mensagens de antes dos perfis -> id do perfil que ficou com ele
  nomesLegados: [], // nomes (normalizados) que aparecem nas mensagens de antes dos perfis
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
  if (raw.perfis && typeof raw.perfis === 'object' && !Array.isArray(raw.perfis)) data.perfis = raw.perfis;
  if (raw.nomesAntigos && typeof raw.nomesAntigos === 'object') data.nomesAntigos = raw.nomesAntigos;
  if (Array.isArray(raw.nomesLegados)) data.nomesLegados = raw.nomesLegados;
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

// ---------- Registros que duram pelo menos 30 dias ----------
// Um pedaço por dia, cada um numa chave do Upstash que se apaga sozinha depois de 35 dias: só os
// dias que mudaram são regravados (normalmente só o de hoje), e não tem limite de quantidade que
// faça os mais antigos sumirem antes do prazo.
const DIAS_REGISTROS = 31;
const diaDe = (t) => new Date(t - 3 * 3600e3).toISOString().slice(0, 10); // dia em Brasília (UTC-3)
function diario(nome, { maxPorDia = 2000, campo = 't' } = {}) {
  const prefixo = `${CHAVE_UPSTASH}:dias:${nome}:`;
  const arquivo = DATA_FILE.replace(/\.json$/i, '') + `-dias-${nome}.json`;
  const d = { porDia: {}, sujos: new Set(), ok: true, timer: null, gravando: false };
  const diaDoItem = (x) => diaDe(Number(x?.[campo]) || Date.now());
  d.limpar = () => {
    const limite = diaDe(Date.now() - DIAS_REGISTROS * 864e5);
    for (const k of Object.keys(d.porDia)) if (k < limite) delete d.porDia[k];
  };
  d.todos = () => { d.limpar(); return Object.keys(d.porDia).sort().flatMap((k) => d.porDia[k]); };
  d.marcar = (k) => {
    d.sujos.add(k);
    clearTimeout(d.timer);
    d.timer = setTimeout(d.gravar, 5000);
  };
  d.adicionar = (item) => {
    const k = diaDoItem(item);
    const l = (d.porDia[k] ||= []);
    l.push(item);
    if (l.length > maxPorDia) l.splice(0, l.length - maxPorDia);
    d.marcar(k);
    return item;
  };
  // o item mudou (e talvez de dia: um erro que voltou a acontecer hoje vai para o dia de hoje)
  d.mudou = (item, tAntes) => {
    const novo = diaDoItem(item);
    const velho = tAntes ? diaDe(tAntes) : novo;
    if (velho !== novo && d.porDia[velho]) {
      d.porDia[velho] = d.porDia[velho].filter((x) => x !== item);
      d.marcar(velho);
      (d.porDia[novo] ||= []).push(item);
    }
    d.marcar(novo);
  };
  d.achar = (pred) => {
    for (const k of Object.keys(d.porDia).sort().reverse()) {
      const l = d.porDia[k];
      for (let i = l.length - 1; i >= 0; i--) if (pred(l[i])) return l[i];
    }
    return null;
  };
  d.remover = (pred) => {
    for (const [k, l] of Object.entries(d.porDia)) {
      const n = l.filter((x) => !pred(x));
      if (n.length !== l.length) { d.porDia[k] = n; d.marcar(k); }
    }
  };
  d.marcarTudo = () => { for (const k of Object.keys(d.porDia)) d.marcar(k); };
  d.carregar = async () => {
    const dias = [];
    for (let i = 0; i <= DIAS_REGISTROS; i++) dias.push(diaDe(Date.now() - i * 864e5));
    try {
      if (USA_UPSTASH) {
        const vals = await upstash(['MGET', ...dias.map((k) => prefixo + k)]);
        dias.forEach((k, i) => {
          const arr = vals?.[i] ? JSON.parse(vals[i]) : null;
          if (Array.isArray(arr)) d.porDia[k] = arr;
        });
      } else {
        const raw = await fs.promises.readFile(arquivo, 'utf8').catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e)));
        const o = raw ? JSON.parse(raw) : {};
        for (const [k, arr] of Object.entries(o)) if (Array.isArray(arr)) d.porDia[k] = arr;
      }
      d.limpar();
    } catch (e) {
      d.ok = false; // não sobrescreve o que não conseguiu ler
      console.warn(`  Não consegui ler o registro de ${nome}:`, e.message);
    }
  };
  d.gravar = async () => {
    d.timer = null;
    if (!d.ok || !d.sujos.size) return;
    if (d.gravando) { d.timer = setTimeout(d.gravar, 1000); return; }
    d.gravando = true;
    const dias = [...d.sujos];
    d.sujos.clear();
    try {
      d.limpar();
      if (USA_UPSTASH) {
        for (const k of dias) {
          if (d.porDia[k]?.length) await upstash(['SET', prefixo + k, JSON.stringify(d.porDia[k]), 'EX', String((DIAS_REGISTROS + 4) * 86400)]);
          else await upstash(['DEL', prefixo + k]);
        }
      } else {
        await fs.promises.writeFile(arquivo + '.tmp', JSON.stringify(d.porDia));
        await fs.promises.rename(arquivo + '.tmp', arquivo);
      }
    } catch (e) {
      for (const k of dias) d.sujos.add(k);
      console.warn(`Não consegui salvar o registro de ${nome}:`, e.message);
      d.timer = setTimeout(d.gravar, 15000);
    } finally {
      d.gravando = false;
    }
  };
  d.terminar = async () => {
    clearTimeout(d.timer);
    while (d.gravando) await new Promise((ok) => setTimeout(ok, 50));
    await d.gravar();
  };
  return d;
}
// Antes, cada registro ficava numa chave só, com limite de quantidade. Passa tudo para os dias.
async function lerGuardadoAntigo(sufixo) {
  const chave = `${CHAVE_UPSTASH}:${sufixo}`;
  const arquivo = DATA_FILE.replace(/\.json$/i, '') + `-${sufixo}.json`;
  const raw = USA_UPSTASH ? await upstash(['GET', chave]) : await fs.promises.readFile(arquivo, 'utf8').catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e)));
  return {
    dados: raw ? JSON.parse(raw) : null,
    apagar: async () => {
      if (USA_UPSTASH) await upstash(['DEL', chave]);
      else await fs.promises.rename(arquivo, arquivo + '.migrado').catch(() => {});
    },
  };
}
async function migrarParaDias(sufixo, distribuir, diarios) {
  try {
    const antigo = await lerGuardadoAntigo(sufixo);
    if (!antigo.dados) return;
    if (diarios.some((d) => !d.ok)) return;
    distribuir(antigo.dados);
    for (const d of diarios) await d.gravar();
    if (diarios.every((d) => d.ok && !d.sujos.size)) await antigo.apagar();
    console.log(`  Registro antigo de ${sufixo} passado para o formato por dia.`);
  } catch (e) {
    console.warn(`  Não consegui passar o registro antigo de ${sufixo}:`, e.message);
  }
}

// ---------- Mensagens: guardadas para sempre ----------
// Cada canal é uma lista no Upstash e cada mensagem é gravada uma vez só (antes, todas eram
// regravadas a cada mensagem nova, e só as 200 últimas de cada canal ficavam). Na memória ficam
// as mais recentes; as antigas vêm do banco quando alguém sobe o chat.
const MSG_MEMORIA = 300;
const MSG_PAGINA = 100;
const ARQUIVO_MSGS = DATA_FILE.replace(/\.json$/i, '') + '-mensagens.json';
const chaveMsgs = (ch) => `${CHAVE_UPSTASH}:msgs:${ch}`;
const MSGS = {
  recentes: {}, // canal -> as últimas mensagens (cada uma com .pos, a posição dela na lista)
  total: {}, // canal -> quantas posições a lista tem (as apagadas continuam ocupando a delas)
  arquivo: {}, // sem Upstash: todas as mensagens de cada canal (arquivo ao lado do data.json)
  fila: [], // gravações pendentes no Upstash, na ordem
  rodando: false,
  ok: true, // se não deu para ler, não grava por cima
  timerArquivo: null,
};
const semPos = ({ pos, ...m }) => m;
function lerMensagens(itens, ini) {
  const out = [];
  (itens || []).forEach((x, i) => {
    let m = x;
    if (typeof x === 'string') { try { m = JSON.parse(x); } catch { m = null; } }
    if (m && m.id && !m.apagada) out.push({ ...m, pos: ini + i });
  });
  return out;
}
// Mensagens de antes dos perfis não têm dono: acha pelo nome que estava nela
function msgParaEnviar(m) {
  if (m.pid) return m;
  const pid = data.nomesAntigos[nomeNormal(m.name)];
  return pid ? { ...m, pid } : m;
}
async function carregarMensagens() {
  const legado = data.messages && typeof data.messages === 'object' ? data.messages : {};
  const legados = new Set(data.nomesLegados || []);
  for (const l of Object.values(legado)) for (const m of Array.isArray(l) ? l : []) if (m && !m.pid && m.name) legados.add(nomeNormal(m.name));
  data.nomesLegados = [...legados].slice(0, 3000);
  for (const c of data.channels) {
    const velhas = (Array.isArray(legado[c.id]) ? legado[c.id] : []).filter((m) => m && m.id).map(semPos);
    try {
      if (USA_UPSTASH) {
        let total = Number(await upstash(['LLEN', chaveMsgs(c.id)])) || 0;
        if (!total && velhas.length) total = Number(await upstash(['RPUSH', chaveMsgs(c.id), ...velhas.map((m) => JSON.stringify(m))])) || 0;
        let ini = Math.max(0, total - MSG_MEMORIA);
        let rec = total ? lerMensagens(await upstash(['LRANGE', chaveMsgs(c.id), String(ini), String(total - 1)]), ini) : [];
        // na troca de versão, o servidor antigo ainda gravou umas mensagens no formato velho: junta as que faltam
        const ids = new Set(rec.map((m) => m.id));
        const desde = rec.length ? rec[0].ts : 0;
        const faltando = rec.length ? velhas.filter((m) => !ids.has(m.id) && m.ts > desde) : [];
        if (faltando.length) {
          total = Number(await upstash(['RPUSH', chaveMsgs(c.id), ...faltando.map((m) => JSON.stringify(m))])) || total;
          ini = Math.max(0, total - MSG_MEMORIA);
          rec = lerMensagens(await upstash(['LRANGE', chaveMsgs(c.id), String(ini), String(total - 1)]), ini);
        }
        MSGS.total[c.id] = total;
        MSGS.recentes[c.id] = rec;
      } else {
        if (!MSGS.lidoArquivo) {
          MSGS.lidoArquivo = true;
          const raw = await fs.promises.readFile(ARQUIVO_MSGS, 'utf8').catch((e) => (e.code === 'ENOENT' ? null : Promise.reject(e)));
          MSGS.arquivo = raw ? JSON.parse(raw) : {};
        }
        if (!MSGS.arquivo[c.id]?.length && velhas.length) { MSGS.arquivo[c.id] = velhas; salvarArquivoDeMensagens(); }
        const lista = MSGS.arquivo[c.id] || [];
        const ini = Math.max(0, lista.length - MSG_MEMORIA);
        MSGS.total[c.id] = lista.length;
        MSGS.recentes[c.id] = lerMensagens(lista.slice(ini), ini);
      }
    } catch (e) {
      MSGS.ok = false;
      console.warn(`  ATENÇÃO: não consegui ler as mensagens de ${c.name}:`, e.message);
      MSGS.recentes[c.id] = lerMensagens(velhas.slice(-MSG_MEMORIA), 0);
      MSGS.total[c.id] = 0;
    }
  }
  // as mensagens já estão no lugar novo: tira do bloco de dados (que é regravado a cada mudança)
  if (MSGS.ok && Object.keys(legado).length && podeSalvar) {
    data.messages = {};
    salvar();
    console.log('  Mensagens passadas para o armazenamento permanente.');
  }
}
function salvarArquivoDeMensagens() {
  clearTimeout(MSGS.timerArquivo);
  MSGS.timerArquivo = setTimeout(gravarArquivoDeMensagens, 2000);
}
async function gravarArquivoDeMensagens() {
  MSGS.timerArquivo = null;
  if (!MSGS.ok) return;
  try {
    await fs.promises.writeFile(ARQUIVO_MSGS + '.tmp', JSON.stringify(MSGS.arquivo));
    await fs.promises.rename(ARQUIVO_MSGS + '.tmp', ARQUIVO_MSGS);
  } catch (e) {
    console.warn('Não consegui salvar as mensagens:', e.message);
    MSGS.timerArquivo = setTimeout(gravarArquivoDeMensagens, 10000);
  }
}
function filaDeMensagens(op) {
  if (!MSGS.ok) return; // não conseguiu ler: não grava por cima do que está lá
  MSGS.fila.push(op);
  rodarFilaDeMensagens();
}
async function rodarFilaDeMensagens() {
  if (MSGS.rodando) return;
  MSGS.rodando = true;
  try {
    while (MSGS.fila.length) {
      const op = MSGS.fila[0];
      try {
        if (op.tipo === 'push') {
          const n = Number(await upstash(['RPUSH', chaveMsgs(op.ch), JSON.stringify(semPos(op.m))]));
          if (n > 0) op.m.pos = n - 1; // a posição de verdade (se outro servidor gravou junto, corrige)
        } else if (op.tipo === 'trocar') {
          await upstash(['LSET', chaveMsgs(op.ch), String(op.alvo.pos), JSON.stringify(op.valor)]);
        } else if (op.tipo === 'del') {
          await upstash(['DEL', chaveMsgs(op.ch)]);
        }
        MSGS.fila.shift();
      } catch (e) {
        if (/index out of range|no such key/i.test(e.message)) { MSGS.fila.shift(); continue; } // a lista mudou: não insiste
        console.warn('Não consegui gravar mensagem (tento de novo em 5 s):', e.message);
        if (desligando) break;
        await new Promise((ok) => setTimeout(ok, 5000));
      }
    }
  } finally {
    MSGS.rodando = false;
  }
}
function guardarMensagem(m) {
  const pos = MSGS.total[m.ch] || 0;
  MSGS.total[m.ch] = pos + 1;
  const salva = { ...m, pos };
  const rec = (MSGS.recentes[m.ch] ||= []);
  rec.push(salva);
  if (rec.length > MSG_MEMORIA) rec.splice(0, rec.length - MSG_MEMORIA);
  if (USA_UPSTASH) filaDeMensagens({ tipo: 'push', ch: m.ch, m: salva });
  else { (MSGS.arquivo[m.ch] ||= []).push(semPos(m)); salvarArquivoDeMensagens(); }
  return salva;
}
// Acha uma mensagem: na memória pelo id, ou (mais antiga) no banco pela posição, conferindo o id
async function acharMensagem(ch, id, pos) {
  const rec = MSGS.recentes[ch] || [];
  const m = rec.find((x) => x.id === id);
  if (m) return m;
  if (!Number.isInteger(pos) || pos < 0 || pos >= (MSGS.total[ch] || 0)) return null;
  let x = null;
  if (USA_UPSTASH) {
    const bruto = await upstash(['LINDEX', chaveMsgs(ch), String(pos)]);
    try { x = bruto ? { ...JSON.parse(bruto), pos } : null; } catch { x = null; }
  } else {
    const y = MSGS.arquivo[ch]?.[pos];
    x = y ? { ...y, pos } : null;
  }
  return x && x.id === id && !x.apagada ? x : null;
}
// Grava de novo uma mensagem na mesma posição (editada, ou a "lápide" de uma apagada)
function regravarMensagem(ch, alvo, valor) {
  if (USA_UPSTASH) filaDeMensagens({ tipo: 'trocar', ch, alvo, valor });
  else if (MSGS.arquivo[ch]) { MSGS.arquivo[ch][alvo.pos] = valor; salvarArquivoDeMensagens(); }
}
// Quem responde guarda um trechinho da mensagem respondida. Quando ela é editada ou apagada, o
// trechinho guardado nas respostas acompanha (um texto apagado não pode continuar aparecendo citado).
async function atualizarCitacoes(ch, orig, apagada) {
  const mexer = (x) => {
    if (!x || x.apagada || x.resp?.id !== orig.id) return false;
    x.resp = { ...x.resp };
    if (apagada) { x.resp.apagada = true; delete x.resp.texto; } else x.resp.texto = String(orig.text || '').slice(0, 160);
    return true;
  };
  const rec = MSGS.recentes[ch] || [];
  for (const x of rec) if (x.pos > orig.pos && mexer(x)) regravarMensagem(ch, x, semPos(x));
  // respostas que já saíram da memória (só acontece quando a original também é antiga)
  const ate = rec.length ? rec[0].pos : (MSGS.total[ch] || 0);
  for (let ini = orig.pos + 1; ini < ate; ini += 500) {
    const fim = Math.min(ate, ini + 500) - 1;
    const itens = USA_UPSTASH ? await upstash(['LRANGE', chaveMsgs(ch), String(ini), String(fim)]) : (MSGS.arquivo[ch] || []).slice(ini, fim + 1);
    (itens || []).forEach((bruto, i) => {
      let x;
      try { x = typeof bruto === 'string' ? JSON.parse(bruto) : { ...bruto }; } catch { return; }
      if (mexer(x)) regravarMensagem(ch, { pos: ini + i }, x);
    });
  }
}
function citacoesDepois(ch, orig, apagada) {
  atualizarCitacoes(ch, orig, apagada).catch((e) => console.warn('Não consegui atualizar as respostas:', e.message));
}
// Apaga uma mensagem: some da memória, e no banco vira uma "lápide" (a posição continua ocupada,
// para as outras não mudarem de lugar)
async function apagarMensagemGuardada(ch, id, pos, pode) {
  const m = await acharMensagem(ch, id, pos);
  if (!m) return { status: 404 };
  if (!pode(m)) return { status: 403 };
  const rec = MSGS.recentes[ch] || [];
  const i = rec.indexOf(m);
  if (i >= 0) rec.splice(i, 1);
  regravarMensagem(ch, m, { id, ch, apagada: true, ts: m.ts });
  citacoesDepois(ch, m, true);
  return { ok: true };
}
function esvaziarCanal(ch, sumir = false) {
  MSGS.recentes[ch] = [];
  MSGS.total[ch] = 0;
  if (USA_UPSTASH) filaDeMensagens({ tipo: 'del', ch });
  else { MSGS.arquivo[ch] = []; salvarArquivoDeMensagens(); }
  if (sumir) { delete MSGS.recentes[ch]; delete MSGS.total[ch]; delete MSGS.arquivo[ch]; }
}
async function mensagensAntigas(ch, antes) {
  const ini = Math.max(0, antes - MSG_PAGINA);
  const rec = MSGS.recentes[ch] || [];
  // o pedaço ainda está na memória: não precisa ir ao banco
  if (rec.length && ini >= rec[0].pos) return { lista: rec.filter((m) => m.pos >= ini && m.pos < antes), mais: ini > 0, desde: ini };
  const itens = USA_UPSTASH
    ? await upstash(['LRANGE', chaveMsgs(ch), String(ini), String(antes - 1)])
    : (MSGS.arquivo[ch] || []).slice(ini, antes);
  return { lista: lerMensagens(itens, ini), mais: ini > 0, desde: ini };
}

// ---------- Dados guardados à parte (tráfego) ----------
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
// Cada um num registro por dia, por pelo menos 30 dias (veja "diario")
const RELATOS = diario('relatos', { maxPorDia: 300 });
const ERROS = diario('erros', { maxPorDia: 500, campo: 'ultima' }); // erro que volta a acontecer vai para o dia de hoje
const QUALIDADE = diario('qualidade', { maxPorDia: 1000 });
async function carregarProblemas() {
  await Promise.all([RELATOS.carregar(), ERROS.carregar(), QUALIDADE.carregar()]);
  await migrarParaDias('problemas', (d) => {
    const ids = new Set(RELATOS.todos().map((x) => x.id));
    for (const x of Array.isArray(d?.relatos) ? d.relatos : []) if (x && x.t && !ids.has(x.id)) RELATOS.adicionar(x);
    for (const x of Array.isArray(d?.erros) ? d.erros : []) if (x && x.ultima && !ERROS.achar((y) => y.msg === x.msg && y.onde === x.onde)) ERROS.adicionar(x);
    const qs = new Set(QUALIDADE.todos().map((x) => `${x.t}|${x.nome}|${x.papel}`));
    for (const x of Array.isArray(d?.qualidade) ? d.qualidade : []) if (x && x.t && !qs.has(`${x.t}|${x.nome}|${x.papel}`)) QUALIDADE.adicionar(x);
  }, [RELATOS, ERROS, QUALIDADE]);
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
// Quem entrou, de qual IP e com qual navegador, e as tentativas recusadas. Fica num pedaço por
// dia (veja "diario"), por pelo menos 30 dias, sem limite de quantidade.
const CONEXOES = diario('conexoes', { maxPorDia: 3000 });
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

function anotar(entrada) {
  return CONEXOES.adicionar({ id: crypto.randomBytes(5).toString('hex'), t: Date.now(), ...entrada });
}
// Entrou: recarregar a página ou cair e voltar em seguida conta como a mesma visita
function registrarEntrada(u, req) {
  const aparelho = aparelhoDe(req);
  const agora = Date.now();
  const e = CONEXOES.achar((x) => x.tipo === 'entrou' && x.ip === u.ip && x.nome === u.name && x.aparelho === aparelho);
  if (e && (sessoesAtivas.get(e.id) > 0 || agora - (e.fim || 0) < 3 * 60e3)) {
    delete e.fim;
    delete e.saida;
    e.admin = e.admin || u.admin;
    CONEXOES.mudou(e);
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
  CONEXOES.mudou(e);
}
// Recusado (senha errada, banido...): a mesma tentativa repetida vira uma linha só
function registrarRecusa(req, ip, nome, motivo) {
  const agora = Date.now();
  const e = CONEXOES.achar((x) => x.tipo === 'recusado' && x.ip === ip && x.motivo === motivo);
  if (e && agora - (e.ultima || e.t) < 10 * 60e3) {
    e.vezes = (e.vezes || 1) + 1;
    e.ultima = agora;
    if (nome && nome !== e.nome && !e.nomes?.includes(nome) && (e.nomes || []).length < 5) e.nomes = [...(e.nomes || []), nome];
    return CONEXOES.mudou(e);
  }
  anotar({ tipo: 'recusado', motivo, nome: nome || '?', ip, aparelho: aparelhoDe(req) });
}
async function carregarRegistro() {
  await CONEXOES.carregar();
  await migrarParaDias('conexoes', (lista) => {
    const tem = new Set(CONEXOES.todos().map((x) => x.id));
    for (const x of Array.isArray(lista) ? lista : []) if (x && typeof x.t === 'number' && !tem.has(x.id)) CONEXOES.adicionar(x);
  }, [CONEXOES]);
  // quem estava conectado quando o servidor desligou
  for (const x of CONEXOES.todos()) if (x.tipo === 'entrou' && !x.fim) { x.fim = x.ultimaVista || x.t; x.saida = 'reinicio'; CONEXOES.mudou(x); }
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
    ...(u.efeitos ? { efeitos: true } : {}),
    ...(u.pid ? { pid: u.pid } : {}),
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
  const antigas = {};
  for (const c of data.channels) {
    const ult = (MSGS.recentes[c.id] || []).slice(-MSG_PAGINA);
    historico[c.id] = ult.map(msgParaEnviar);
    antigas[c.id] = ult.length ? ult[0].pos : (MSGS.total[c.id] || 0); // de onde começam as mais antigas (0: não tem)
  }
  enviar(u, {
    type: 'init',
    me: publicUser(u),
    muted: silencioDe(u),
    ...configPublica(),
    channels: data.channels,
    messages: historico,
    antigas,
    perfis: perfisPublicos(),
    users: listaUsuarios(),
    iceServers: iceParaEnviar(),
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
    // a lista de offline mostra há quanto tempo a pessoa saiu
    const p = u.pid && data.perfis[u.pid];
    if (p && !desligando) {
      p.visto = Date.now();
      salvar();
      broadcast({ type: 'visto', id: u.pid, visto: p.visto });
    }
    broadcastPresenca();
  }
}

// ---------- Moderação ----------
// a pessoa e as outras sessões dela (o mesmo nome aberto em outro aparelho)
function mesmaPessoa(alvo) {
  return [alvo, ...[...users.values()].filter((x) => x !== alvo && alvo.pid && x.pid === alvo.pid && x.joined && !x.kicked)];
}
function ipCompartilhado(alvo) {
  // Se outra pessoa online usa o mesmo IP (mesma casa, mesmo proxy...), não dá para punir pelo IP.
  return [...users.values()].some((x) => x !== alvo && x.joined && !x.kicked && x.ip === alvo.ip);
}
function banDe(ip, device, pid) {
  return data.bans.find((b) => (b.ip && b.ip === ip) || (b.device && device && b.device === device) || (b.pid && pid && b.pid === pid)
    || (device && Array.isArray(b.aparelhos) && b.aparelhos.includes(device)));
}
function silencioDe(u) {
  const agora = Date.now();
  const m = data.mutes.find((x) => x.until > agora && ((x.ip && x.ip === u.ip) || (x.device && u.device && x.device === u.device) || (x.pid && u.pid && x.pid === u.pid)));
  return m ? m.until : 0;
}

// ---------- Perfis: cada pessoa entra sempre com o mesmo nome ----------
// O aparelho guarda uma chave (o servidor só guarda o resumo dela). Com ela, a pessoa entra
// sempre com o nome que escolheu; dá para trocar de nome lá dentro, e as mensagens antigas
// passam a mostrar o nome novo. Para usar outro aparelho, gera um código de acesso.
const MAX_PERFIS = 500;
const resumoDe = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const nomeNormal = (n) => String(n || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
function donoDoNome(nome) {
  const k = nomeNormal(nome);
  for (const [id, p] of Object.entries(data.perfis)) if (nomeNormal(p.nome) === k) return id;
  return null;
}
// O que todo mundo vê de cada nome: a cor, quando foi visto pela última vez (para a lista de quem
// está offline) e se está fora da lista (banido, ou tirado por um admin). Nada de IP.
function perfilPublico(id) {
  const p = data.perfis[id];
  const fora = p.oculto || data.bans.some((b) => b.pid === id);
  return { nome: p.nome, cor: p.cor, visto: p.visto || p.criado || 0, ...(fora ? { fora: true } : {}) };
}
function perfisPublicos() {
  const o = {};
  for (const id of Object.keys(data.perfis)) o[id] = perfilPublico(id);
  return o;
}
function avisarPerfil(id, extra = {}) {
  if (data.perfis[id]) broadcast({ type: 'perfil', id, ...perfilPublico(id), ...extra });
}
const CODIGOS = new Map(); // código -> { pid, ate }
const LETRAS_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I, que confundem
const codigoNormal = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function novoCodigo(pid) {
  const agora = Date.now();
  for (const [c, x] of CODIGOS) if (x.pid === pid || x.ate < agora) CODIGOS.delete(c);
  let c = '';
  for (const b of crypto.randomBytes(8)) c += LETRAS_CODIGO[b % LETRAS_CODIGO.length];
  const ate = agora + 15 * 60e3;
  CODIGOS.set(c, { pid, ate });
  return { codigo: `${c.slice(0, 4)}-${c.slice(4)}`, ate };
}
// Menções: "@Nome" de alguém registrado vira <@id> (assim a menção acompanha se a pessoa trocar
// de nome). Acha o nome mais comprido que combina, sem ligar para maiúsculas e acentos, e aceita
// nomes com espaço ("@Ana Paula").
const letraOuNumero = /[\p{L}\p{N}_]/u;
function converterMencoes(texto) {
  if (!texto.includes('@')) return texto;
  const nomes = Object.entries(data.perfis).map(([id, p]) => [id, p.nome, nomeNormal(p.nome)]).sort((a, b) => b[1].length - a[1].length);
  let out = '';
  let i = 0;
  while (i < texto.length) {
    const j = texto.indexOf('@', i);
    if (j < 0) { out += texto.slice(i); break; }
    out += texto.slice(i, j);
    let casou = null;
    if (!letraOuNumero.test(texto[j - 1] || ' ')) { // não pega e-mails (fulano@site)
      const resto = texto.slice(j + 1);
      for (const [id, nome, normal] of nomes) {
        const trecho = resto.slice(0, nome.length);
        if (trecho.length === nome.length && nomeNormal(trecho) === normal && !letraOuNumero.test(resto[nome.length] || ' ')) { casou = [id, nome.length]; break; }
      }
    }
    if (casou) { out += `<@${casou[0]}>`; i = j + 1 + casou[1]; } else { out += '@'; i = j + 1; }
  }
  return out;
}

// ---------- Boas-vindas: quem entra pela primeira vez é recebido no #geral ----------
function boasVindas(pid) {
  const c = canal('geral') || data.channels.find((x) => x.type === 'text');
  if (!c || !data.perfis[pid]) return;
  const m = guardarMensagem({
    id: crypto.randomBytes(8).toString('hex'),
    ch: c.id,
    sistema: 'boasvindas',
    alvo: pid,
    frase: crypto.randomInt(3), // qual das 3 frases
    figura: crypto.randomInt(3), // qual dos 3 personagens
    name: nomeServidor(),
    color: '#3db3f0',
    text: `Que bom te ver por aqui, <@${pid}>!`, // para quem ainda está com a página antiga
    ts: Date.now(),
  });
  broadcast({ type: 'msg', msg: m });
}

function mudarPerfil(pid, { nome, cor }, por = '') {
  const p = data.perfis[pid];
  if (!p) return { status: 404, erro: 'Perfil não encontrado' };
  const antes = p.nome;
  let mudou = false;
  if (nome !== undefined) {
    const n = limparNome(nome, 32);
    if (!n) return { status: 400, erro: 'Escolha um nome' };
    const dono = donoDoNome(n);
    if (dono && dono !== pid) return { status: 409, erro: `O nome "${data.perfis[dono].nome}" já é de outra pessoa.` };
    if (n !== p.nome) { p.nome = n; mudou = true; }
  }
  if (cor !== undefined && /^#[0-9a-f]{6}$/i.test(cor) && cor !== p.cor) { p.cor = cor; mudou = true; }
  if (!mudou) return { ok: true };
  for (const x of users.values()) if (x.pid === pid) { x.name = p.nome; x.color = p.cor; }
  salvar();
  avisarPerfil(pid, { antes, ...(por ? { por } : {}) });
  broadcastPresenca();
  return { ok: true };
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
    problemasNovos: RELATOS.todos().filter((r) => !r.lido).length,
    aparelhos: (limparLembretes(), data.lembretes.map((r) => ({ id: r.id, nome: r.nome, aparelho: r.aparelho, criado: r.criado, usado: r.usado }))),
    trafego: trafegoParaAdmin(),
    settings: {
      ...configPublica(),
      adminFromEnv: !!ADMIN_ENV_HASH,
      storage: USA_UPSTASH ? 'upstash' : 'arquivo',
      turn: {
        proprio: !!process.env.TURN_URL,
        cloudflare: CF_TURN.id && CF_TURN.token ? (CF_TURN.servidores.length ? { ok: true, quando: CF_TURN.quando } : { ok: false, erro: CF_TURN.erro || 'gerando as senhas…' }) : null,
      },
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
      return json(res, 200, {
        dias: DIAS_REGISTROS - 1,
        relatos: RELATOS.todos().slice().reverse(),
        erros: ERROS.todos().slice().sort((a, b) => b.ultima - a.ultima),
        qualidade: QUALIDADE.todos().slice().reverse(),
      });

    case 'ler-problemas':
      for (const r of RELATOS.todos()) if (!r.lido) { r.lido = true; RELATOS.mudou(r); }
      return json(res, 200, { ok: true });

    case 'apagar-relato':
      RELATOS.remover((r) => r.id === String(body.id));
      return json(res, 200, { ok: true });

    case 'limpar-erros':
      ERROS.remover(() => true);
      return json(res, 200, { ok: true });

    case 'conexoes':
      return json(res, 200, {
        dias: DIAS_REGISTROS - 1,
        registro: CONEXOES.todos().slice().reverse().map((x) => ({ ...x, online: sessoesAtivas.get(x.id) > 0 })),
      });

    case 'limpar-conexoes':
      CONEXOES.remover((x) => !(sessoesAtivas.get(x.id) > 0)); // quem está online continua
      return json(res, 200, { ok: true });

    // ----- nomes registrados (perfis) -----
    case 'perfis':
      return json(res, 200, {
        perfis: Object.entries(data.perfis).map(([id, p]) => ({
          id, nome: p.nome, cor: p.cor, criado: p.criado, visto: p.visto, aparelhos: p.chaves.length,
          online: [...users.values()].some((x) => x.pid === id && x.joined && !x.kicked),
        })).sort((a, b) => (b.visto || 0) - (a.visto || 0)),
      });

    case 'perfil-renomear': {
      const r = mudarPerfil(String(body.pid), { nome: body.nome }, u.name);
      if (r.erro) return json(res, r.status, { error: r.erro });
      for (const x of users.values()) if (x.pid === String(body.pid) && x !== u) enviar(x, { type: 'renamed', name: data.perfis[x.pid].nome, by: u.name });
      return json(res, 200, { ok: true });
    }

    case 'perfil-codigo':
      if (!data.perfis[String(body.pid)]) return json(res, 404, { error: 'Perfil não encontrado' });
      return json(res, 200, novoCodigo(String(body.pid)));

    case 'perfil-esquecer-aparelhos': {
      const p = data.perfis[String(body.pid)];
      if (!p) return json(res, 404, { error: 'Perfil não encontrado' });
      p.chaves = [];
      p.aparelhos = [];
      salvar();
      return json(res, 200, { ok: true });
    }

    // ---- pelo nome: servem também para quem está offline (lista de membros) ----
    case 'perfil-info': {
      const id = String(body.pid);
      const p = data.perfis[id];
      if (!p) return json(res, 404, { error: 'Esse nome não existe mais' });
      const mute = data.mutes.find((m) => m.pid === id && m.until > Date.now());
      return json(res, 200, {
        id, nome: p.nome, cor: p.cor, criado: p.criado, visto: p.visto, aparelhos: p.chaves.length,
        online: [...users.values()].some((x) => x.pid === id && x.joined && !x.kicked),
        banido: data.bans.find((b) => b.pid === id)?.id || null,
        silenciado: mute ? mute.until : 0,
      });
    }
    case 'perfil-silenciar':
    case 'perfil-banir':
    case 'perfil-tirar-silencio':
    case 'perfil-ocultar': {
      const id = String(body.pid);
      const p = data.perfis[id];
      if (!p) return json(res, 404, { error: 'Esse nome não existe mais' });
      if (id === u.pid && body.action !== 'perfil-tirar-silencio') return json(res, 400, { error: 'Isso não dá para fazer com você mesmo' });
      const sessoes = [...users.values()].filter((x) => x.pid === id && x.joined && !x.kicked);
      if (body.action === 'perfil-silenciar') {
        const minutos = Number(body.minutes);
        const until = minutos > 0 ? Date.now() + Math.min(minutos, 60 * 24 * 365) * 60e3 : Date.now() + 10 * 365 * 864e5;
        data.mutes = data.mutes.filter((m) => m.pid !== id);
        data.mutes.push({ ip: null, device: null, pid: id, name: p.nome, until });
        salvar();
        for (const x of sessoes) enviar(x, { type: 'muted', until, by: u.name });
        broadcastPresenca();
        if (until - Date.now() < 2 ** 31 - 1) setTimeout(broadcastPresenca, until - Date.now() + 500).unref();
        return json(res, 200, { ok: true, until });
      }
      if (body.action === 'perfil-tirar-silencio') {
        data.mutes = data.mutes.filter((m) => !(m.pid === id || sessoes.some((x) => (m.device && m.device === x.device) || (m.ip && m.ip === x.ip))));
        salvar();
        for (const x of sessoes) enviar(x, { type: 'muted', until: 0, by: u.name });
        broadcastPresenca();
        return json(res, 200, { ok: true });
      }
      if (body.action === 'perfil-banir') {
        if (!data.bans.some((b) => b.pid === id)) {
          // offline não tem IP: bloqueia o nome e os aparelhos que ele já usou
          data.bans.push({
            id: crypto.randomBytes(6).toString('hex'), name: p.nome, ip: null, device: null,
            aparelhos: [...(p.aparelhos || [])], pid: id, reason: motivo, by: u.name, ts: Date.now(),
          });
          salvar();
          console.log(`! ${u.name} baniu ${p.nome} (pelo nome)`);
        }
        for (const x of sessoes) expulsar(x, { by: u.name, reason: motivo, banned: true });
        avisarPerfil(id);
        return json(res, 200, { ok: true });
      }
      // perfil-ocultar: tira da lista de offline até a pessoa entrar de novo
      if (sessoes.length) return json(res, 400, { error: 'Essa pessoa está online agora' });
      p.oculto = true;
      salvar();
      avisarPerfil(id);
      return json(res, 200, { ok: true });
    }

    case 'kick':
      if (!precisaAlvo()) return;
      if (alvo === u) return json(res, 400, { error: 'Você não pode expulsar a si mesmo' });
      console.log(`! ${u.name} expulsou ${alvo.name}`);
      for (const x of mesmaPessoa(alvo)) expulsar(x, { by: u.name, reason: motivo, banned: false });
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
        pid: alvo.pid || null,
        reason: motivo,
        by: u.name,
        ts: Date.now(),
      });
      salvar();
      console.log(`! ${u.name} baniu ${alvo.name}`);
      for (const x of mesmaPessoa(alvo)) expulsar(x, { by: u.name, reason: motivo, banned: true });
      if (alvo.pid) avisarPerfil(alvo.pid);
      return json(res, 200, { ok: true, soAparelho });
    }

    case 'unban': {
      const ban = data.bans.find((b) => b.id === body.id);
      if (!ban) return json(res, 404, { error: 'Banimento não encontrado' });
      data.bans = data.bans.filter((b) => b !== ban);
      salvar();
      if (ban.pid) avisarPerfil(ban.pid); // volta para a lista de offline
      return json(res, 200, { ok: true });
    }

    case 'mute': {
      if (!precisaAlvo()) return;
      if (alvo === u) return json(res, 400, { error: 'Você não pode silenciar a si mesmo' });
      const minutos = Number(body.minutes);
      const until = minutos > 0 ? Date.now() + Math.min(minutos, 60 * 24 * 365) * 60e3 : Date.now() + 10 * 365 * 864e5;
      data.mutes = data.mutes.filter((m) => !((m.device && m.device === alvo.device) || (m.ip && m.ip === alvo.ip) || (m.pid && m.pid === alvo.pid)));
      data.mutes.push({ ip: ipCompartilhado(alvo) ? null : alvo.ip, device: alvo.device || null, pid: alvo.pid || null, name: alvo.name, until });
      salvar();
      enviar(alvo, { type: 'muted', until, by: u.name });
      broadcastPresenca(); // os outros param de ouvir a voz de quem foi silenciado
      // quando o silêncio acaba sozinho, avisa todo mundo para voltarem a ouvir
      if (until - Date.now() < 2 ** 31 - 1) setTimeout(broadcastPresenca, until - Date.now() + 500).unref();
      return json(res, 200, { ok: true, until });
    }

    case 'unmute': {
      if (!precisaAlvo()) return;
      data.mutes = data.mutes.filter((m) => !((m.device && m.device === alvo.device) || (m.ip && m.ip === alvo.ip) || (m.pid && m.pid === alvo.pid)));
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
      if (alvo.pid) {
        const r = mudarPerfil(alvo.pid, { nome }, u.name);
        if (r.erro) return json(res, r.status, { error: r.erro });
        for (const x of users.values()) if (x.pid === alvo.pid) enviar(x, { type: 'renamed', name: nome, by: u.name });
        return json(res, 200, { ok: true });
      }
      alvo.name = nome;
      enviar(alvo, { type: 'renamed', name: nome, by: u.name });
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'clear': {
      const c = canal(body.channel);
      if (!c) return json(res, 404, { error: 'Canal não existe' });
      esvaziarCanal(c.id);
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
    // Perfil: o aparelho guarda uma chave; com ela, a pessoa entra sempre com o mesmo nome
    let pid = null;
    let chaveNova = null;
    let chaveUsada = null;
    let nomeNovo = false;
    const pedido = body.perfil && typeof body.perfil === 'object' ? body.perfil : null;
    if (pedido && typeof pedido.id === 'string' && typeof pedido.chave === 'string') {
      const p = data.perfis[pedido.id];
      if (!p || !p.chaves.includes(resumoDe(pedido.chave))) {
        registrarRecusa(req, ip, limparNome(body.name, 32), 'aparelho esquecido');
        return json(res, 403, { error: 'Este aparelho não está mais ligado ao seu nome. Use um código de acesso (peça para um admin, ou gere num aparelho seu que ainda entra) ou escolha um nome novo.', campo: 'perfil' });
      }
      pid = pedido.id;
      chaveUsada = resumoDe(pedido.chave);
    } else if (body.codigo) {
      const k = codigoNormal(body.codigo);
      const c = CODIGOS.get(k);
      if (!c || c.ate < Date.now() || !data.perfis[c.pid]) {
        falhou(ip);
        registrarRecusa(req, ip, '', 'código de acesso errado');
        return json(res, 403, { error: 'Código errado ou vencido. Gere outro (cada código vale 15 minutos).', campo: 'codigo' });
      }
      CODIGOS.delete(k);
      pid = c.pid;
      chaveNova = crypto.randomBytes(24).toString('hex');
    } else {
      const nome = limparNome(body.name, 32);
      if (!nome) return json(res, 400, { error: 'Escolha um apelido' });
      const dono = donoDoNome(nome);
      // o mesmo aparelho que criou o nome (página de antes desta versão, que não guardava a chave)
      if (dono && device && data.perfis[dono].aparelhos?.includes(device)) {
        pid = dono;
        chaveNova = crypto.randomBytes(24).toString('hex');
      } else if (dono) {
        registrarRecusa(req, ip, nome, 'nome de outra pessoa');
        return json(res, 409, { error: `O nome "${data.perfis[dono].nome}" já é de outra pessoa. Se é você entrando de outro aparelho, clique em "Já tenho um nome" e use um código de acesso.`, campo: 'nome' });
      } else if (Object.keys(data.perfis).length >= MAX_PERFIS) {
        return json(res, 507, { error: 'O servidor chegou ao limite de nomes. Peça para um admin.' });
      } else {
        pid = crypto.randomBytes(6).toString('hex');
        chaveNova = crypto.randomBytes(24).toString('hex');
        nomeNovo = true;
        data.perfis[pid] = { nome, cor: CORES[Math.floor(Math.random() * CORES.length)], criado: Date.now(), visto: 0, chaves: [], aparelhos: [] };
        // quem escolhe um nome que já aparecia nas mensagens de antes fica com elas
        const k = nomeNormal(nome);
        if (data.nomesLegados.includes(k) && !data.nomesAntigos[k]) data.nomesAntigos[k] = pid;
      }
    }
    const perfil = data.perfis[pid];
    if (!admin && banDe(null, null, pid)) {
      registrarRecusa(req, ip, perfil.nome, 'banido');
      return json(res, 403, { error: 'Você foi banido deste servidor.', banned: true });
    }
    if (chaveNova) {
      chaveUsada = resumoDe(chaveNova);
      perfil.chaves = [...perfil.chaves, chaveUsada].slice(-10);
    }
    if (device && !(perfil.aparelhos ||= []).includes(device)) perfil.aparelhos = [...perfil.aparelhos, device].slice(-10);
    let mudouCor = false;
    if (/^#[0-9a-f]{6}$/i.test(body.color) && body.color !== perfil.cor) { perfil.cor = body.color; mudouCor = true; }
    perfil.visto = Date.now();
    if (perfil.oculto) { delete perfil.oculto; avisarPerfil(pid); }
    salvar();
    const name = perfil.nome;
    const color = perfil.cor;
    const u = {
      id: crypto.randomBytes(6).toString('hex'),
      token: crypto.randomBytes(24).toString('hex'),
      name,
      color,
      ip,
      device,
      pid,
      chave: chaveUsada,
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
    if (mudouCor) avisarPerfil(pid, { antes: perfil.nome });
    if (nomeNovo) {
      avisarPerfil(pid); // os outros já conhecem o nome novo
      boasVindas(pid);
    }
    return json(res, 200, {
      id: u.id, token: u.token, admin,
      perfil: { id: pid, nome: perfil.nome, cor: perfil.cor, ...(chaveNova ? { chave: chaveNova } : {}) },
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
      // respondendo a uma mensagem: guarda um resuminho dela (quem e o começo do texto)
      let resp = null;
      if (body.resp && typeof body.resp === 'object' && typeof body.resp.id === 'string') {
        const o = await acharMensagem(c.id, body.resp.id, Number(body.resp.pos)).catch(() => null);
        if (o) {
          const x = msgParaEnviar(o);
          resp = { id: x.id, pos: x.pos, ...(x.pid ? { pid: x.pid } : {}), ...(x.sistema ? { sistema: x.sistema, alvo: x.alvo } : {}), nome: x.name, texto: String(x.text || '').slice(0, 160) };
        }
      }
      const m = guardarMensagem({
        id: crypto.randomBytes(8).toString('hex'),
        ch: c.id,
        uid: u.id,
        ...(u.pid ? { pid: u.pid } : {}),
        name: u.name,
        color: u.color,
        admin: !!u.admin,
        text: converterMencoes(text),
        ...(resp ? { resp } : {}),
        ts: Date.now(),
      });
      broadcast({ type: 'msg', msg: m });
      return json(res, 200, { ok: true });
    }

    case 'msg-edit': {
      // editar a própria mensagem: todo mundo vê "(editada)"
      const c = canal(body.channel);
      const id = String(body.id || '');
      const text = String(body.text || '').trim().slice(0, 2000);
      if (!c || !id) return json(res, 404, { error: 'Mensagem não encontrada' });
      if (!text) return json(res, 400, { error: 'A mensagem não pode ficar vazia (para tirar, apague)' });
      if (silencioDe(u)) return json(res, 403, { error: 'Você está silenciado por um admin' });
      if (limiteDe(u, 'limEdit', 10, 10e3)) return json(res, 429, { error: 'Calma com as edições' });
      let m;
      try { m = await acharMensagem(c.id, id, Number(body.pos)); } catch { return json(res, 503, { error: 'Não consegui editar agora. Tente de novo.' }); }
      if (!m || m.sistema) return json(res, 404, { error: 'Mensagem não encontrada' });
      const dono = (u.pid && msgParaEnviar(m).pid === u.pid) || m.uid === u.id;
      if (!dono) return json(res, 403, { error: 'Você só pode editar as suas mensagens' });
      const novo = converterMencoes(text);
      if (novo === m.text) return json(res, 200, { ok: true });
      m.text = novo;
      m.editada = Date.now();
      regravarMensagem(c.id, m, semPos(m));
      citacoesDepois(c.id, m, false);
      broadcast({ type: 'msg-edit', channel: c.id, id, text: m.text, editada: m.editada });
      return json(res, 200, { ok: true });
    }

    case 'historico': {
      // mensagens mais antigas que as que a página já tem (quando a pessoa sobe o chat)
      const c = canal(body.channel);
      const antes = Number(body.antes);
      if (!c || !Number.isInteger(antes) || antes <= 0) return json(res, 400, { error: 'pedido inválido' });
      if (limiteDe(u, 'limHist', 30, 10e3)) return json(res, 429, { error: 'Calma, carregando…' });
      try {
        const r = await mensagensAntigas(c.id, antes);
        return json(res, 200, { mensagens: r.lista.map(msgParaEnviar), mais: r.mais, desde: r.desde });
      } catch (e) {
        return json(res, 503, { error: 'Não consegui buscar as mensagens antigas agora. Tente de novo.' });
      }
    }

    case 'perfil': {
      // trocar o próprio nome ou a cor: as mensagens antigas passam a mostrar o novo
      if (!u.pid) return json(res, 400, { error: 'Entre de novo para ter um nome guardado' });
      if (limiteDe(u, 'limPerfil', 6, 60e3)) return json(res, 429, { error: 'Muitas mudanças seguidas. Espere um minuto.' });
      const r = mudarPerfil(u.pid, { nome: body.nome, cor: body.cor });
      if (r.erro) return json(res, r.status, { error: r.erro });
      const p = data.perfis[u.pid];
      return json(res, 200, { ok: true, nome: p.nome, cor: p.cor });
    }

    case 'perfil-codigo':
      // código para entrar com o mesmo nome em outro aparelho
      if (!u.pid || !data.perfis[u.pid]) return json(res, 400, { error: 'Entre de novo para ter um nome guardado' });
      if (limiteDe(u, 'limCodigo', 5, 10 * 60e3)) return json(res, 429, { error: 'Muitos códigos seguidos. Espere uns minutos.' });
      return json(res, 200, novoCodigo(u.pid));

    case 'perfil-esquecer': {
      // este aparelho deixa de entrar com este nome
      const p = data.perfis[u.pid];
      if (p) {
        p.chaves = p.chaves.filter((c) => c !== u.chave);
        p.aparelhos = (p.aparelhos || []).filter((d) => d !== u.device);
        salvar();
      }
      return json(res, 200, { ok: true });
    }

    case 'msg-delete': {
      const c = canal(body.channel);
      const id = String(body.id || '');
      if (!c || !id) return json(res, 404, { error: 'Mensagem não encontrada' });
      // a própria (pelo perfil, ou pela sessão nas mensagens de antes dos perfis) ou admin
      const pode = (m) => u.admin || (u.pid && msgParaEnviar(m).pid === u.pid) || m.uid === u.id;
      let r;
      try { r = await apagarMensagemGuardada(c.id, id, Number(body.pos), pode); } catch { r = { status: 503 }; }
      if (r.status === 404) return json(res, 404, { error: 'Mensagem não encontrada' });
      if (r.status === 403) return json(res, 403, { error: 'Você só pode apagar as suas mensagens' });
      if (!r.ok) return json(res, 503, { error: 'Não consegui apagar agora. Tente de novo.' });
      broadcast({ type: 'msg-delete', channel: c.id, id });
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
      if (body.efeitos === true) u.efeitos = true; // a página sabe mandar e ouvir os sons pela chamada
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
      let e = ERROS.achar((x) => x.msg === msg && x.onde === onde);
      const antes = e?.ultima;
      if (!e) e = ERROS.adicionar({ msg, onde, vezes: 0, primeira: Date.now(), ultima: Date.now(), quem: [], aparelhos: [], versoes: [] });
      e.vezes++;
      e.ultima = Date.now();
      const juntar = (arr, v) => { if (v && !arr.includes(v) && arr.length < 6) arr.push(v); };
      juntar(e.quem, u.name);
      juntar(e.aparelhos, aparelhoDe(req));
      juntar(e.versoes, versao);
      ERROS.mudou(e, antes);
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
          fpsMeta: num(body.fpsMeta, 240), placa: textoLimpo(body.placa, 120), gpu: textoLimpo(body.gpu, 160),
          fpsCaptura: num(body.fpsCaptura, 240), encoder: textoLimpo(body.encoder, 60), trocouCodec: body.trocouCodec === true,
          fim: ['voce', 'captura', 'pagina', 'sala', 'sala-apagada', 'conexao', 'admin', 'expulso', 'erro'].includes(body.fim) ? body.fim : '',
        });
      } else {
        Object.assign(r, { de: textoLimpo(body.de, 32), perdaPct: num(body.perdaPct, 100), travadas: num(body.travadas, 100000) });
      }
      QUALIDADE.adicionar(r);
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
      RELATOS.adicionar({
        id: crypto.randomBytes(5).toString('hex'), t: Date.now(), nome: u.name, ip: u.ip, aparelho: aparelhoDe(req), texto, info, lido: false,
      });
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

    case 'emote': {
      // reação que sobe flutuando na transmissão de alguém da mesma sala
      const alvo = users.get(String(body.sid));
      if (!alvo || !u.sala || alvo.sala !== u.sala || !alvo.live) return json(res, 409, { error: 'Essa transmissão acabou' });
      if (silencioDe(u) > Date.now()) return json(res, 403, { error: 'Você está silenciado: as reações voltam quando o silêncio acabar.' });
      if (limiteDe(u, 'limEmote', 10, 1000)) return json(res, 429, { error: 'Calma com as reações' });
      const e = Number.isInteger(body.e) && body.e >= 0 && body.e < 5 ? body.e : null;
      const x = Number(body.x);
      if (e === null || !Number.isFinite(x)) return json(res, 400, { error: 'reação inválida' });
      const ev = { type: 'emote', from: u.id, sid: alvo.id, e, x: Math.round(Math.min(0.9, Math.max(0.1, x)) * 1000) / 1000 };
      for (const y of users.values()) if (y !== u && y.sala === u.sala && !y.kicked) enviar(y, ev);
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
      esvaziarCanal(c.id, true);
      salvar();
      for (const x of users.values()) if (x.sala === c.id) { x.sala = null; x.live = false; }
      broadcast({ type: 'channels', channels: data.channels });
      broadcastPresenca();
      return json(res, 200, { ok: true });
    }

    case 'sb': {
      // Soundboard: avisa quem está na mesma sala qual som foi tocado (o som vai pela chamada, direto entre as pessoas)
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
  renovarTurnCloudflare();
  const faltando = ARQUIVOS_DA_PAGINA.filter((n) => !acharArquivoDaPagina(n));
  if (faltando.length) {
    console.warn(`  ATENÇÃO: não encontrei ${faltando.join(', ')} (nem em public/, nem ao lado do server.js).`);
    console.warn('  Envie esses arquivos para o GitHub, senão o site não abre.\n');
  }
  await carregarDados();
  await carregarMensagens();
  await carregarRegistro();
  await TRAFEGO.carregar();
  await carregarProblemas();
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
  // quem está online sai do registro com a hora de agora
  for (const u of users.values()) registrarSaida(u);
  await Promise.race([Promise.all([
    (async () => { while (salvando) await new Promise((ok) => setTimeout(ok, 50)); await gravar(); })(),
    CONEXOES.terminar(),
    RELATOS.terminar(),
    ERROS.terminar(),
    QUALIDADE.terminar(),
    TRAFEGO.terminar(),
    // mensagens que ainda não foram para o banco
    (async () => {
      if (MSGS.timerArquivo) { clearTimeout(MSGS.timerArquivo); await gravarArquivoDeMensagens(); }
      while (MSGS.fila.length && MSGS.ok) { rodarFilaDeMensagens(); await new Promise((ok) => setTimeout(ok, 50)); }
    })(),
  ]), espera]);
  process.exit(0);
}
process.on('SIGINT', desligar);
process.on('SIGTERM', desligar);

iniciar();
