// Caras E Telas — tema (claro/escuro) e paleta de cores.
// Carrega no <head>, antes de a página aparecer, para não piscar o tema errado.
// Todas as cores do visual saem daqui, calculadas a partir de duas cores:
//   principal: botões de gel, seleção, links e foco
//   destaque:  as ondas atrás dos painéis
(() => {
  'use strict';

  const PALETAS = [
    { id: 'ceu', nome: 'Céu', principal: '#1d93df', destaque: '#46b62b' },
    { id: 'oceano', nome: 'Oceano', principal: '#0b9fb0', destaque: '#2f6fe0', ceu: 196 },
    { id: 'aurora', nome: 'Aurora', principal: '#7559ee', destaque: '#22c9b6' },
    { id: 'floresta', nome: 'Floresta', principal: '#2c9b43', destaque: '#1d93df', ceu: 178 },
    { id: 'por-do-sol', nome: 'Pôr do sol', principal: '#ea7024', destaque: '#ffbf2e' },
    { id: 'sakura', nome: 'Sakura', principal: '#d9488b', destaque: '#62bff0' },
    { id: 'rubi', nome: 'Rubi', principal: '#cf2638', destaque: '#98a6b5' },
  ];
  const PADRAO = { modo: 'claro', paleta: 'ceu', principal: '#1d93df', destaque: '#46b62b' };
  const HEX = /^#[0-9a-f]{6}$/i;

  // ---------- cores ----------
  const lim = (x, a, b) => Math.min(b, Math.max(a, x));
  const r1 = (x) => Math.round(x * 10) / 10;
  const hsl = (h, s, l) => `hsl(${r1(h)}, ${r1(lim(s, 0, 100))}%, ${r1(lim(l, 0, 100))}%)`;
  const hsla = (h, s, l, a) => `hsla(${r1(h)}, ${r1(lim(s, 0, 100))}%, ${r1(lim(l, 0, 100))}%, ${a})`;

  function paraHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  // brilho percebido (0 a 1): cores muito claras pedem texto escuro em cima
  function luminancia(hex) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  // ---------- configuração ----------
  function validar(cfg) {
    const c = cfg && typeof cfg === 'object' ? cfg : {};
    const paleta = c.paleta === 'propria' || PALETAS.some((p) => p.id === c.paleta) ? c.paleta : PADRAO.paleta;
    return {
      modo: ['claro', 'escuro', 'auto'].includes(c.modo) ? c.modo : PADRAO.modo,
      paleta,
      principal: HEX.test(c.principal || '') ? c.principal.toLowerCase() : PADRAO.principal,
      destaque: HEX.test(c.destaque || '') ? c.destaque.toLowerCase() : PADRAO.destaque,
    };
  }

  const midiaEscura = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const ehEscuro = (cfg) => cfg.modo === 'escuro' || (cfg.modo === 'auto' && !!midiaEscura?.matches);

  // ---------- todas as cores do visual ----------
  function gerar(entrada) {
    const cfg = validar(entrada);
    const pal = cfg.paleta === 'propria'
      ? { principal: cfg.principal, destaque: cfg.destaque }
      : PALETAS.find((p) => p.id === cfg.paleta);
    const P = paraHsl(pal.principal);
    const D = paraHsl(pal.destaque);
    const esc = ehEscuro(cfg);
    const hc = pal.ceu ?? P.h; // tom do céu
    const k = P.s < 15 ? 0.15 : 1; // cor principal cinza: céu quase neutro
    const claroDemais = luminancia(pal.principal) > 0.45;

    const v = {
      // gel da cor principal
      '--p1': hsl(P.h, P.s + 4, lim(P.l + 20, 0, 84)),
      '--p2': hsl(P.h, P.s, P.l),
      '--p3': hsl(P.h, P.s, lim(P.l - 10, 12, 100)),
      '--p-borda': hsl(P.h, P.s, lim(P.l - 18, 9, 100)),
      '--p-sobre': claroDemais ? '#13212e' : '#ffffff',
      '--p-sobre-sombra': claroDemais ? 'rgba(255, 255, 255, .5)' : 'rgba(0, 25, 50, .45)',
      '--p-texto': esc ? hsl(P.h, Math.min(P.s, 90), lim(Math.max(P.l, 70), 0, 82)) : hsl(P.h, Math.min(P.s, 85), lim(Math.min(P.l, 34), 22, 34)),
      '--p-suave': hsla(P.h, P.s, P.l, esc ? 0.22 : 0.13),
      '--p-anel': hsla(P.h, 90, 65, 0.35),
      '--p-brilho': hsla(P.h, P.s, P.l, esc ? 0.55 : 0.6),
      '--foco': hsl(P.h, Math.min(P.s, 90), esc ? 62 : 52),
      '--rolagem': hsla(P.h, P.s, P.l, esc ? 0.4 : 0.32),
      '--gel-topo': esc ? 'rgba(255, 255, 255, .45)' : 'rgba(255, 255, 255, .7)',
      '--gel-meio': esc ? 'rgba(255, 255, 255, .12)' : 'rgba(255, 255, 255, .2)',
      // céu
      '--ceu-alto': esc ? hsl(hc, 45 * k, 17) : hsl(hc, 85 * k, 97),
      '--ceu': esc ? hsl(hc, 52 * k, 10) : hsl(hc, 75 * k, 87),
      '--ceu-fundo': esc ? hsl(hc, 60 * k, 6) : hsl(hc, 68 * k, 71),
      '--ceu-luz': esc ? hsla(P.h, 90, 60, 0.22) : 'rgba(255, 255, 255, .95)',
      '--onda': hsla(D.h, D.s, lim(D.l, 35, 62), esc ? 0.38 : 0.6),
      '--onda-forte': hsla(D.h, D.s, lim(D.l - 8, 25, 55), esc ? 0.5 : 0.75),
      '--fita': esc ? hsla(P.h, 90, 78, 0.22) : 'rgba(255, 255, 255, .75)',
      '--bolha': esc ? 'rgba(255, 255, 255, .14)' : 'rgba(255, 255, 255, .55)',
      // vidro
      '--lateral-1': esc ? hsla(hc, 45 * k, 14, 0.8) : hsla(hc, 90 * k, 98, 0.86),
      '--lateral-2': esc ? hsla(hc, 50 * k, 9, 0.72) : hsla(hc, 85 * k, 93, 0.66),
      '--vidro-1': esc ? hsla(hc, 40 * k, 13, 0.82) : 'rgba(255, 255, 255, .82)',
      '--vidro-2': esc ? hsla(hc, 45 * k, 9, 0.76) : 'rgba(255, 255, 255, .68)',
      '--pop-1': esc ? hsla(hc, 40 * k, 16, 0.97) : 'rgba(255, 255, 255, .96)',
      '--pop-2': esc ? hsla(hc, 45 * k, 11, 0.95) : hsla(hc, 80 * k, 96, 0.92),
      '--sup-1': esc ? hsl(hc, 28 * k, 30) : '#ffffff',
      '--sup-2': esc ? hsl(hc, 34 * k, 19) : hsl(hc, 70 * k, 91),
      '--campo-1': esc ? hsla(hc, 45 * k, 5, 0.75) : hsl(hc, 70 * k, 98),
      '--campo-2': esc ? hsla(hc, 40 * k, 10, 0.75) : '#ffffff',
      '--hover': esc ? 'rgba(255, 255, 255, .07)' : 'rgba(255, 255, 255, .66)',
      '--faixa': esc ? hsla(hc, 50 * k, 6, 0.3) : hsla(hc, 80 * k, 94, 0.5),
      '--faixa-chat': esc ? hsla(hc, 45 * k, 7, 0.35) : 'rgba(255, 255, 255, .45)',
      '--palco-1': esc ? hsla(hc, 50 * k, 5, 0.25) : hsla(hc, 80 * k, 94, 0.35),
      '--palco-2': esc ? hsla(hc, 50 * k, 4, 0.45) : hsla(hc, 80 * k, 90, 0.5),
      '--cabeca-1': esc ? 'rgba(255, 255, 255, .07)' : 'rgba(255, 255, 255, .85)',
      '--cabeca-2': esc ? 'rgba(255, 255, 255, .01)' : hsla(hc, 75 * k, 94, 0.45),
      '--rodape-1': esc ? 'rgba(0, 0, 0, .12)' : hsla(hc, 75 * k, 93, 0.7),
      '--rodape-2': esc ? 'rgba(0, 0, 0, .24)' : hsla(hc, 75 * k, 89, 0.85),
      '--borda-vidro': esc ? 'rgba(255, 255, 255, .13)' : 'rgba(255, 255, 255, .95)',
      '--realce': esc ? 'rgba(255, 255, 255, .14)' : '#ffffff',
      '--linha': esc ? 'rgba(255, 255, 255, .09)' : hsla(hc, 70 * k, 33, 0.15),
      '--linha-forte': esc ? 'rgba(255, 255, 255, .17)' : hsla(hc, 70 * k, 33, 0.27),
      '--sombra-cor': esc ? 'rgba(0, 0, 0, .6)' : hsla(hc, 85 * k, 25, 0.5),
      '--sombra-campo': esc ? 'rgba(0, 0, 0, .35)' : hsla(hc, 85 * k, 25, 0.12),
      '--veu': esc ? 'rgba(0, 4, 12, .55)' : hsla(hc, 65 * k, 70, 0.35),
      '--codigo': esc ? 'rgba(255, 255, 255, .08)' : hsla(hc, 70 * k, 15, 0.06),
      '--moldura-1': esc ? 'rgba(255, 255, 255, .22)' : 'rgba(255, 255, 255, .95)',
      '--moldura-2': esc ? hsla(P.h, 90, 60, 0.22) : 'rgba(255, 255, 255, .45)',
      '--moldura-avatar': esc ? 'rgba(255, 255, 255, .85)' : '#ffffff',
      // texto
      '--texto-forte': esc ? '#ffffff' : hsl(hc, 65 * k, 14),
      '--texto': esc ? hsl(hc, 35 * k, 90) : hsl(hc, 50 * k, 20),
      '--suave': esc ? hsl(hc, 22 * k, 72) : hsl(hc, 26 * k, 40),
      '--fraco': esc ? hsl(hc, 16 * k, 58) : hsl(hc, 18 * k, 52),
      '--titulo-sombra': esc ? hsla(P.h, 90, 60, 0.35) : '#ffffff',
      // avisos (mesmo significado em toda paleta)
      '--erro': esc ? '#ff8b93' : '#c0202b',
      '--alerta': esc ? '#ffb066' : '#b0490a',
      '--ouro': esc ? '#ffcf4d' : '#b37a00',
      '--verde-texto': esc ? '#86e061' : '#2a8513',
      '--verde-faixa-1': esc ? 'rgba(120, 220, 90, .14)' : 'rgba(167, 232, 132, .32)',
      '--verde-faixa-2': esc ? 'rgba(120, 220, 90, .05)' : 'rgba(167, 232, 132, .14)',
    };
    return { escuro: esc, cfg, vars: v };
  }

  // ---------- aplicar ----------
  let atual = PADRAO;
  const ouvintes = [];
  function aplicar(entrada) {
    const g = gerar(entrada);
    const raiz = document.documentElement;
    for (const [nome, valor] of Object.entries(g.vars)) raiz.style.setProperty(nome, valor);
    raiz.dataset.tema = g.escuro ? 'escuro' : 'claro';
    raiz.style.colorScheme = g.escuro ? 'dark' : 'light';
    atual = g.cfg;
    for (const fn of ouvintes) {
      try { fn(g); } catch { /* ok */ }
    }
    return g;
  }

  function salvo() {
    try { return JSON.parse(localStorage.getItem('telinha') || '{}').aparencia; } catch { return null; }
  }

  aplicar(salvo());
  // "Igual ao sistema": acompanha quando o Windows troca entre claro e escuro
  midiaEscura?.addEventListener?.('change', () => { if (atual.modo === 'auto') aplicar(atual); });

  window.CarasTema = Object.freeze({
    PALETAS: Object.freeze(PALETAS.map((p) => Object.freeze({ ...p }))),
    PADRAO: Object.freeze({ ...PADRAO }),
    validar,
    gerar,
    aplicar,
    atual: () => ({ ...atual }),
    aoMudar: (fn) => { if (typeof fn === 'function') ouvintes.push(fn); },
  });
})();
