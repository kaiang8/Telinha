'use strict';
// Camada da caneta: desenha por cima da tela de quem transmite os traços de quem assiste.
// A janela é transparente, não recebe cliques e fica fora da captura da tela.
(() => {
  const CORES = ['#ff3b30', '#ffd60a', '#1e88ff', '#30d158', '#ffffff'];
  const FICA = 3000; // inteiro por 3 s depois de terminar
  const SOME = 900; // e esmaece em menos de 1 s
  const cv = document.getElementById('tinta');
  const ctx = cv.getContext('2d');
  const tracos = new Map();
  let raf = 0;
  let teste = false;

  function receber(d) {
    let s = tracos.get(d.tr);
    if (!s) {
      if (tracos.size >= 80) tracos.delete(tracos.keys().next().value);
      s = { nome: d.nome, c: d.c, pts: [], fim: null, ult: Date.now() };
      tracos.set(d.tr, s);
    }
    for (const p of d.p) if (s.pts.length < 4000) s.pts.push(p);
    s.ult = Date.now();
    if (d.fim && !s.fim) s.fim = Date.now();
    pedir();
  }
  const pedir = () => { if (!raf) raf = requestAnimationFrame(desenhar); };

  function desenhar() {
    raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(innerWidth * dpr);
    const h = Math.round(innerHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (teste) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, w, h);
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const q = { x: 0, y: 0, w: innerWidth, h: innerHeight };
    const agora = Date.now();
    for (const [tr, s] of tracos) {
      const fim = s.fim ?? (agora - s.ult > 1500 ? s.ult : null);
      const a = fim === null ? 1 : Math.min(1, 1 - (agora - fim - FICA) / SOME);
      if (a <= 0) { tracos.delete(tr); continue; }
      tracar(s, q, a);
    }
    if (tracos.size) pedir();
  }

  function tracar(s, q, a) {
    if (!s.pts.length) return;
    const larg = Math.max(3, Math.min(10, q.h * 0.0055));
    const pts = s.pts.map(([x, y]) => [q.x + x * q.w, q.y + y * q.h]);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.01, pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    if (pts.length > 1) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.strokeStyle = 'rgba(0, 0, 0, .45)';
    ctx.lineWidth = larg + 3;
    ctx.stroke();
    ctx.strokeStyle = CORES[s.c] || CORES[0];
    ctx.lineWidth = larg;
    ctx.stroke();
    if (s.nome) {
      ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
      const tw = ctx.measureText(s.nome).width;
      const bx = Math.min(q.w - tw - 26, Math.max(2, pts[0][0] + 10));
      const by = Math.max(2, pts[0][1] - 28);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = 'rgba(6, 24, 39, .78)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, tw + 24, 20, 10);
      else ctx.rect(bx, by, tw + 24, 20);
      ctx.fill();
      ctx.fillStyle = CORES[s.c] || CORES[0];
      ctx.beginPath();
      ctx.arc(bx + 10, by + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(s.nome, bx + 18, by + 14.5);
    }
    ctx.restore();
  }

  window.tinta.aoReceber(receber);
  window.tinta.aoTeste((ligar) => { teste = !!ligar; pedir(); });
  addEventListener('resize', pedir);
})();
