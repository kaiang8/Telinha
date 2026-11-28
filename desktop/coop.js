'use strict';
// Jogatina: conversa com o controle-programa.exe (desktop/nativo), que aperta as teclas, mexe o
// mouse e usa o controle virtual do jogador 2 no computador de quem transmite.
const { app, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

let proc = null;
let esperando = []; // [{ prefixo, ok, timer }]
let aoAviso = () => {};

function caminho() {
  if (process.platform !== 'win32') return null;
  const p = app.isPackaged
    ? path.join(process.resourcesPath, 'controle-programa.exe')
    : path.join(__dirname, 'nativo', 'bin', 'controle-programa.exe');
  return fs.existsSync(p) ? p : null;
}
function esperar(prefixo, ms) {
  return new Promise((ok) => {
    const e = { prefixo, ok, timer: setTimeout(() => { esperando = esperando.filter((x) => x !== e); ok(null); }, ms) };
    esperando.push(e);
  });
}
function aoLinha(l) {
  const e = esperando.find((x) => l.startsWith(x.prefixo));
  if (e) { clearTimeout(e.timer); esperando = esperando.filter((x) => x !== e); e.ok(l); return; }
  if (l === 'prioridade') aoAviso('prioridade');
}
async function garantir() {
  if (proc) return proc.pronto;
  const exe = caminho();
  if (!exe) return null;
  const p = spawn(exe, [], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  proc = p;
  let resto = '';
  p.stdout.on('data', (b) => {
    resto += b.toString('utf8');
    const linhas = resto.split(/\r?\n/);
    resto = linhas.pop();
    for (const l of linhas) aoLinha(l.trim());
  });
  p.on('exit', () => { if (proc === p) proc = null; });
  p.on('error', () => { if (proc === p) proc = null; });
  p.stdin.on('error', () => {});
  p.pronto = esperar('pronto', 4000);
  return p.pronto;
}
function enviar(linhas) {
  if (!proc || !proc.stdin.writable || !linhas.length) return;
  proc.stdin.write(`${linhas.join('\n')}\n`);
}
// onde está o que é compartilhado: a janela (o ajudante acha a posição) ou a tela (em pixels de verdade)
function linhaDoAlvo(fonte) {
  if (!fonte) return null;
  if (fonte.tipo === 'janela') return `alvo janela ${fonte.hwnd}`;
  const d = screen.getAllDisplays().find((x) => String(x.id) === fonte.displayId) || screen.getPrimaryDisplay();
  const r = process.platform === 'win32' ? screen.dipToScreenRect(null, d.bounds) : d.bounds;
  return `alvo tela ${r.x} ${r.y} ${r.x + r.width} ${r.y + r.height}`;
}
// { ok, vigem, pad, motivo }
async function ligar(fonte, controle) {
  const alvo = linhaDoAlvo(fonte);
  if (!alvo) return { ok: false, motivo: 'Compartilhe a janela do jogo (ou a tela) antes.' };
  const pronto = await garantir();
  if (!pronto) return { ok: false, motivo: 'Falta o ajudante do jogador 2. Atualize ou reinstale o programa.' };
  const vigem = pronto.includes('vigem=1');
  enviar([alvo]);
  let pad = false;
  if (controle && vigem) {
    const r = esperar('pad', 4000);
    enviar(['pad ligar']);
    pad = (await r) === 'pad ok';
  }
  return { ok: true, vigem, pad, alvo: fonte.tipo };
}
async function controleVirtual(ligado) {
  if (!proc) return false;
  if (!ligado) { enviar(['pad tirar']); return false; }
  const r = esperar('pad', 4000);
  enviar(['pad ligar']);
  return (await r) === 'pad ok';
}
function desligar() {
  const p = proc;
  if (!p) return;
  enviar(['solta', 'pad tirar', 'sair']);
  proc = null;
  setTimeout(() => { try { p.kill(); } catch { /* já saiu */ } }, 1500);
}
module.exports = { caminho, ligar, enviar, linhaDoAlvo, controleVirtual, desligar, ativo: () => !!proc, aoAviso: (fn) => { aoAviso = fn; } };
