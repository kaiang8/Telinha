'use strict';
// Conversa com o som-programa.exe (desktop/nativo): lista os programas e captura o som de um só.
const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { execFile, spawn } = require('node:child_process');

const VOZ = /discord|whatsapp|teams|zoom|skype|telegram|slack|teamspeak|mumble|signal|guilded/i;

function caminho() {
  if (process.platform !== 'win32') return null;
  const p = app.isPackaged
    ? path.join(process.resourcesPath, 'som-programa.exe')
    : path.join(__dirname, 'nativo', 'bin', 'som-programa.exe');
  return fs.existsSync(p) ? p : null;
}

// { programas: [{ pid, nome, exe, tocando, voz }], janelas: { "hwnd": pid } } ou null
function listar() {
  const exe = caminho();
  if (!exe) return Promise.resolve(null);
  return new Promise((ok) => {
    execFile(exe, ['--listar', '--ignorar', String(process.pid)], { windowsHide: true, timeout: 5000, maxBuffer: 4 * 1024 * 1024 }, (erro, saida) => {
      if (erro) return ok(null);
      try {
        const d = JSON.parse(String(saida));
        const programas = (Array.isArray(d.processos) ? d.processos : [])
          .filter((p) => Number.isInteger(p.pid) && p.pid > 4 && typeof p.nome === 'string' && typeof p.exe === 'string')
          .map((p) => ({
            pid: p.pid,
            nome: p.nome.slice(0, 80),
            exe: p.exe.slice(0, 120),
            tocando: p.tocando === true,
            temSom: p.som === true,
            voz: VOZ.test(p.exe) || VOZ.test(p.nome),
          }))
          .sort((a, b) => (b.tocando - a.tocando) || (b.temSom - a.temSom) || a.nome.localeCompare(b.nome, 'pt-BR'));
        const janelas = {};
        for (const [hwnd, pid] of Object.entries(d.janelas || {})) {
          if (/^\d{1,20}$/.test(hwnd) && Number.isInteger(pid) && pid > 4) janelas[hwnd] = pid;
        }
        ok({ programas, janelas });
      } catch {
        ok(null);
      }
    });
  });
}

const ERROS = {
  'ativar-resultado': 'O Windows não deixou pegar o som só desse programa. Esse recurso precisa do Windows 11 (ou de um Windows 10 bem atualizado).',
  ativar: 'O Windows não deixou pegar o som só desse programa. Esse recurso precisa do Windows 11 (ou de um Windows 10 bem atualizado).',
};

let atual = null; // { id, proc, porta, resto }
let contador = 0;

function parar(id) {
  if (!atual || (id !== undefined && id !== atual.id)) return;
  const c = atual;
  atual = null;
  try { c.proc.stdin.end(); } catch { /* ok */ }
  try { c.proc.kill(); } catch { /* ok */ }
  try { c.porta?.close(); } catch { /* ok */ }
}

// Começa a capturar. Devolve { ok: true, id } ou { ok: false, erro }.
function capturar(pid, taxa) {
  const exe = caminho();
  if (!exe) return Promise.resolve({ ok: false, erro: 'O ajudante de som não está instalado. Reinstale o programa.' });
  parar();
  const proc = spawn(exe, ['--capturar', String(pid), '--taxa', String(taxa)], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const c = { id: ++contador, proc, porta: null, resto: null };
  atual = c;
  proc.on('error', () => { if (atual === c) atual = null; });
  proc.on('exit', () => { if (atual === c) parar(c.id); });
  proc.stdout.on('data', (buf) => enviar(c, buf));
  return new Promise((ok) => {
    let texto = '';
    let fim = false;
    const responder = (r) => {
      if (fim) return;
      fim = true;
      clearTimeout(prazo);
      if (!r.ok && atual === c) parar(c.id);
      ok(r);
    };
    const prazo = setTimeout(() => responder({ ok: false, erro: 'O Windows demorou para liberar o som desse programa.' }), 6000);
    proc.stderr.on('data', (d) => {
      texto += d;
      const quebra = texto.indexOf('\n');
      if (quebra < 0) return;
      let st = {};
      try { st = JSON.parse(texto.slice(0, quebra)); } catch { st = { erro: 'resposta estranha' }; }
      if (st.ok) responder({ ok: true, id: c.id });
      else responder({ ok: false, erro: ERROS[st.erro] || `Não consegui pegar o som desse programa (${st.erro || 'erro'} ${st.hr || ''}).`.replace(/ \)/, ')') });
    });
    proc.on('exit', (codigo) => responder({ ok: false, erro: `O ajudante de som fechou (código ${codigo}).` }));
  });
}

// PCM 16 bits estéreo: manda só quadros inteiros (4 bytes) para a página
function enviar(c, buf) {
  if (atual !== c) return;
  if (c.resto) {
    buf = Buffer.concat([c.resto, buf]);
    c.resto = null;
  }
  const n = buf.length - (buf.length % 4);
  if (n < buf.length) c.resto = Buffer.from(buf.subarray(n));
  if (!n || !c.porta) return;
  try {
    c.porta.postMessage(new Uint8Array(buf.subarray(0, n)));
  } catch {
    parar(c.id);
  }
}

function anexarPorta(porta) {
  if (!atual || atual.porta) {
    try { porta.close(); } catch { /* ok */ }
    return false;
  }
  const c = atual;
  c.porta = porta;
  porta.on('close', () => { if (atual === c) parar(c.id); });
  porta.start();
  return true;
}

// ---- apertar-para-falar: o ajudante vigia uma tecla e avisa "1" (apertou) / "0" (soltou) ----
let tecla = null; // { proc, args }

function soltarTecla() {
  const t = tecla;
  tecla = null;
  if (!t) return;
  try { t.proc.stdin.end(); } catch { /* ok */ }
  try { t.proc.kill(); } catch { /* ok */ }
  t.aoMudar(false);
}

// args vem de regras.argumentosDoPtt (só números e opções conhecidas)
function vigiarTecla(args, aoMudar) {
  const exe = caminho();
  if (!exe) return { ok: false, erro: 'O ajudante de teclas não está instalado. Reinstale o programa.' };
  if (tecla && tecla.chave === args.join(' ')) return { ok: true };
  soltarTecla();
  const proc = spawn(exe, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  const t = { proc, chave: args.join(' '), aoMudar, apertado: false };
  tecla = t;
  const mudar = (v) => {
    if (tecla !== t || t.apertado === v) return;
    t.apertado = v;
    aoMudar(v);
  };
  let texto = '';
  proc.stdout.on('data', (d) => {
    texto = (texto + d).slice(-64);
    const linhas = texto.split('\n');
    texto = linhas.pop();
    const ultima = linhas.filter((l) => l === '1' || l === '0').pop();
    if (ultima) mudar(ultima === '1');
  });
  const fim = () => {
    if (tecla !== t) return;
    mudar(false);
    tecla = null;
  };
  proc.on('error', fim);
  proc.on('exit', fim);
  return { ok: true };
}

module.exports = { caminho, listar, capturar, parar, anexarPorta, vigiarTecla, soltarTecla };
