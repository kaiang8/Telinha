'use strict';
(() => {
  // ================= Utilidades =================
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  const ICONS = {
    hash: '<path d="M10 3 8 21M16 3l-2 18M4.5 8.5h16M3.5 15.5h16"/>',
    screen: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    screenOff: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4M9.5 8l5 5M14.5 8l-5 5"/>',
    vol: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12"/>',
    mute: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    somOff: '<path d="M9 17.5V6.5l10-2v10"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="14.5" r="2.5"/><path d="M3.5 3.5l17 17"/>',
    olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    olhoOff: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    pip: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><rect x="12" y="11.5" width="7" height="5.5" rx="1" fill="currentColor" stroke="none"/>',
    focus: '<path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/>',
    unfocus: '<path d="M20 10h-6V4M4 14h6v6M14 10l6.5-6.5M10 14l-6.5 6.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14a6.5 6.5 0 0 1 3 6"/>',
    chat: '<path d="M4 5h16v11H10l-6 4z"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    send: '<path d="M4 12 20 4l-4 16-4-7z"/><path d="m12 13 8-9"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 17l5-5-5-5M21 12H9"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    micOff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7M4 4l16 16"/>',
    fone: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.5"/>',
    foneOff: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.5"/><path d="M3 3l18 18"/>',
    engrenagem: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8"/><path d="M12 17.2h.01"/>',
    caneta: '<path d="M4 20l4.2-1 10.3-10.3a2.2 2.2 0 0 0-3.2-3.2L5 15.8 4 20z"/><path d="M13.8 7l3.2 3.2"/>',
    paleta: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8h2.1A5.3 5.3 0 0 0 22 9.7C21.6 5.9 17.4 3 12 3z"/><circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15.5" cy="7.5" r="1.2"/>',
    retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    crown: '<path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.8 10H5.3z" fill="currentColor" stroke-width="1.5"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    responder: '<path d="M10 8.5 4.5 13 10 17.5"/><path d="M4.8 13H14a5.5 5.5 0 0 0 5.5-5.5V6"/>',
    megaphone: '<path d="M3 10v4h3l8 4.5v-13L6 10H3z"/><path d="M17.5 9a3.5 3.5 0 0 1 0 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    swap: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  };
  const MARCA = 'Caras E Telas';
  const LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-9 23 24)"><rect x="5" y="10" width="36" height="27" rx="8" fill="#3db3f0"/><path d="M5 18a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v2.5q-18 5-36 0z" fill="#fff" opacity=".55"/><g class="pisca"><circle cx="16.5" cy="21.5" r="2.7" fill="#0b2a43"/><circle cx="29.5" cy="21.5" r="2.7" fill="#0b2a43"/></g><path d="M16 28q7 5 14 0" fill="none" stroke="#0b2a43" stroke-width="2.7" stroke-linecap="round"/></g><g transform="rotate(7 41 38)"><rect x="22.5" y="24.5" width="37" height="28" rx="8.5" fill="#6fcd3e" style="stroke: var(--recorte, #fff)" stroke-width="3.5"/><path d="M22.5 33a8.5 8.5 0 0 1 8.5-8.5h20a8.5 8.5 0 0 1 8.5 8.5v2.5q-18.5 5-37 0z" fill="#fff" opacity=".55"/><circle class="olho-aberto" cx="35.7" cy="35.5" r="2.7" fill="#0b2a43"/><path class="olho-piscado" d="M32.5 36.5q3.2-3 6.4 0" fill="none" stroke="#0b2a43" stroke-width="2.7" stroke-linecap="round"/><circle cx="48" cy="35.5" r="2.7" fill="#0b2a43"/><path d="M34.5 42.5q7.5 6 15 0" fill="none" stroke="#0b2a43" stroke-width="2.7" stroke-linecap="round"/><g class="brilho"><path d="M29 24.2q.9 3.9 4.8 4.8q-3.9.9-4.8 4.8q-.9-3.9-4.8-4.8q3.9-.9 4.8-4.8z" fill="#fff3a6" stroke="#f2b705" stroke-width=".8" stroke-linejoin="round"/><circle cx="29" cy="29" r="1.1" fill="#fff"/></g><path class="brilho mini" d="M23.6 34.4q.45 1.75 2.2 2.2q-1.75.45-2.2 2.2q-.45-1.75-2.2-2.2q1.75-.45 2.2-2.2z" fill="#fff8cc" stroke="#f2b705" stroke-width=".6" stroke-linejoin="round"/></g></svg>';
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

  const CORES = ['#ffb23f', '#ff9a76', '#ff6b81', '#f78fd3', '#c39bff', '#9fa8ff', '#6cc6ff', '#4fe0d0', '#43d9a3', '#c3e86b'];

  const QUALIDADES = {
    '720p30': { label: '720p · 30 fps', w: 1280, h: 720, fps: 30, br: 2500000, hint: 'motion' },
    '1080p30': { label: '1080p · 30 fps', w: 1920, h: 1080, fps: 30, br: 4500000, hint: 'motion' },
    '1080p60': { label: '1080p · 60 fps (jogos)', w: 1920, h: 1080, fps: 60, br: 8000000, hint: 'motion' },
    texto: { label: 'Texto nítido · 15 fps', w: 1920, h: 1080, fps: 15, br: 3000000, hint: 'detail' },
  };

  function lerSalvo() {
    try { return JSON.parse(localStorage.getItem('telinha') || '{}'); } catch { return {}; }
  }
  function salvar(patch) {
    try { localStorage.setItem('telinha', JSON.stringify({ ...lerSalvo(), ...patch })); } catch { /* modo anônimo */ }
  }
  const salvo = lerSalvo();
  // Identificador deste navegador (ajuda o admin a banir/silenciar a pessoa certa)
  if (!/^[a-z0-9]{8,40}$/i.test(salvo.device || '')) {
    salvo.device = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
    salvar({ device: salvo.device });
  }

  // ================= Estado =================
  const S = {
    token: null, myId: null, myName: '', myColor: CORES[0], password: '',
    serverName: MARCA, channels: [], messages: {}, users: [], iceServers: [],
    view: salvo.view || null, sala: null, live: false, localStream: null,
    quality: QUALIDADES[salvo.quality] ? salvo.quality : '1080p30',
    // somV 2: todo mundo volta uma vez para o modo sem eco (o "PC inteiro" ficou salvo em muitos navegadores)
    som: salvo.somV === 2 && ['janela', 'pc', 'nenhum'].includes(salvo.som) ? salvo.som : 'janela',
    upload: ['auto', '5', '10', '20', '50', '100'].includes(String(salvo.upload)) ? String(salvo.upload) : 'auto',
    evitarEco: false, // pausa o som das outras transmissões enquanto mando o som do PC inteiro
    out: new Map(), // quem está me assistindo: viewerId -> conexão
    inc: new Map(), // quem eu estou assistindo: sharerId -> conexão
    tries: new Map(), tiles: new Map(),
    volEnvio: typeof salvo.volEnvio === 'number' ? Math.min(2, Math.max(0, salvo.volEnvio)) : 1,
    envio: null, sendStream: null,
    unread: new Set(), typing: new Map(), collapsed: {},
    mencoes: new Set(), // canais onde mencionaram você (marquinha "@")
    apagadas: new Set(), // mensagens apagadas (quem respondeu a elas mostra "mensagem apagada")
    resposta: null, // { ch, id, pos, rotulo, texto }: respondendo a uma mensagem
    editando: null, // { id, ch, pos, rascunho, original }: editando uma mensagem minha
    showMembers: salvo.showMembers !== false, showSalaChat: salvo.showSalaChat !== false,
    usarPolling: !!salvo.polling, sseWatch: null,
    isAdmin: false, adminPassword: salvo.adminPassword || '', mutedUntil: 0, locked: false, kicked: null,
    focus: null, es: null, started: false, rejoinTimer: null, lastTypingSent: 0, unseen: 0, stick: true,
  };

  if (salvo.somV !== 2) salvar({ som: 'janela', somV: 2 });

  // ================= Programa para Windows =================
  // Dentro do programa, o site ganha atalhos globais e o som do PC sem eco
  // (o programa tira da captura tudo o que ele mesmo toca).
  const PROGRAMA = (() => {
    try {
      const p = window.carasETelas;
      return p && p.programa === true && typeof p.atalhos === 'function' ? p : null;
    } catch {
      return null;
    }
  })();
  const NO_WINDOWS = /Windows/i.test(navigator.userAgent);
  const LINK_PROGRAMA = '/baixar';
  if (PROGRAMA && S.som === 'janela') S.som = 'pc';
  const chan = (id) => S.channels.find((c) => c.id === id);
  const textChannels = () => S.channels.filter((c) => c.type === 'text');
  const salas = () => S.channels.filter((c) => c.type === 'sala');
  const userById = (id) => S.users.find((u) => u.id === id);
  const initial = (name) => (Array.from(String(name || '?').trim())[0] || '?');
  const coroa = (u) => (u.admin ? `<span class="crown" title="Admin">${icon('crown')}</span>` : '');
  const avatar = (u, extra = '') => `<div class="avatar ${extra}" style="background:${esc(u.color)}">${esc(initial(u.name))}${extra.includes('dotted') ? '<span class="dot"></span>' : ''}</div>`;

  function toast(msg, ms = 3500) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), ms);
  }

  // Sons curtinhos (gerados na hora, sem arquivos)
  let actx;
  function blip(kind) {
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const notas = { join: [523, 784], leave: [784, 523], live: [659, 880, 1047], msg: [988, 1319] }[kind];
      const t0 = actx.currentTime + 0.01;
      notas.forEach((f, i) => {
        const o = actx.createOscillator();
        const g = actx.createGain();
        const t = t0 + i * 0.09;
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g).connect(actx.destination);
        o.start(t);
        o.stop(t + 0.2);
      });
    } catch { /* sem áudio, sem problema */ }
  }

  // ================= API =================
  async function api(path, body = {}) {
    const r = await fetch('/api/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, token: S.token }),
    });
    let j = {};
    try { j = await r.json(); } catch { /* vazio */ }
    if (r.status === 401) {
      if (j.kicked) foiExpulso(j.kicked);
      else agendarReentrada();
    }
    if (!r.ok) {
      const err = new Error(j.error || `Erro ${r.status}`);
      err.data = j;
      throw err;
    }
    return j;
  }

  // ================= Login =================
  function initLogin() {
    $('#loginLogo').innerHTML = LOGO;
    if (location.protocol === 'file:') {
      // Abriram o index.html direto da pasta: sem o servidor nada funciona
      $('#loginForm').innerHTML = `<div class="login-logo">${LOGO}</div>
        <h1>Quase lá!</h1>
        <p class="muted">Você abriu o arquivo direto da pasta. O Caras E Telas precisa ser aberto <b>pelo servidor</b>:</p>
        <ol class="steps">
          <li>Feche esta aba.</li>
          <li>Na pasta do projeto (onde está o <code>server.js</code>), dê dois cliques em <b>iniciar.bat</b>.<br><span class="muted small">No Mac ou no Linux, rode <code>node server.js</code> num terminal dentro da pasta.</span></li>
          <li>Deixe a janela preta aberta. O navegador abre sozinho em <b>http://localhost:3000</b>.</li>
        </ol>`;
      return;
    }
    S.myColor = CORES.includes(salvo.color) ? salvo.color : CORES[Math.floor(Math.random() * CORES.length)];
    renderColorPicker();
    $('#loginPrograma').hidden = !!PROGRAMA || !NO_WINDOWS;
    let aviso = '';
    let semAuto = false;
    try {
      aviso = sessionStorage.getItem('telinha-aviso') || '';
      semAuto = !!sessionStorage.getItem('telinha-sem-auto');
      sessionStorage.removeItem('telinha-aviso');
      sessionStorage.removeItem('telinha-sem-auto');
    } catch { /* ok */ }
    if (aviso) $('#loginError').textContent = aviso;
    $('#nameInput').value = salvo.name || '';
    travarNome();
    $('#codigoToggle').addEventListener('click', () => mostrarCodigo($('#codigoField').hidden));
    $('#adminToggle').addEventListener('click', () => {
      $('#adminField').hidden = !$('#adminField').hidden;
      $('#adminToggle').textContent = $('#adminField').hidden ? 'Sou admin' : 'Entrar sem ser admin';
      if (!$('#adminField').hidden) $('#adminInput').focus();
      else $('#adminInput').value = '';
    });

    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        mostrarVersao(cfg.programa, cfg.build);
        S.serverName = cfg.serverName;
        if (cfg.serverName && cfg.serverName !== MARCA) $('#loginSub').textContent = `Entre em ${cfg.serverName} para conversar e assistir junto com a galera.`;
        $('#passField').hidden = !cfg.needsPassword;
        if (cfg.locked) $('#loginSub').textContent = 'O servidor está trancado agora: só admins conseguem entrar.';
        if (!semAuto && salvo.name && (lembreteAdmin() || salvo.adminPassword || !cfg.needsPassword || salvo.password)) {
          entrar(salvo.name, S.myColor, salvo.password || '', true, salvo.adminPassword || '');
        } else {
          $('#nameInput').focus();
        }
      })
      .catch(() => { $('#loginError').textContent = 'Não consegui falar com o servidor. A janela do servidor (iniciar.bat) está aberta?'; });

    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const codigo = $('#codigoField').hidden ? '' : $('#codigoInput').value.trim();
      entrar($('#nameInput').value.trim(), S.myColor, $('#passInput').value, false, $('#adminInput').value, codigo);
    });
  }

  function renderColorPicker() {
    $('#colorPicker').innerHTML = CORES.map((c) => `<button type="button" data-color="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${c === S.myColor}"></button>`).join('');
  }
  $('#colorPicker').addEventListener('click', (e) => {
    const b = e.target.closest('[data-color]');
    if (!b) return;
    S.myColor = b.dataset.color;
    renderColorPicker();
  });

  // Perfil: a chave que faz este aparelho entrar sempre com o mesmo nome (o servidor só guarda o resumo)
  function perfilSalvo() {
    const p = lerSalvo().perfil;
    return p && typeof p.id === 'string' && typeof p.chave === 'string' ? p : null;
  }
  function travarNome() {
    const p = perfilSalvo();
    const comCodigo = !$('#codigoField').hidden;
    $('#nameInput').readOnly = !!p;
    $('#nameInput').required = !comCodigo;
    $('#nomeField').hidden = comCodigo;
    $('#nomeDica').hidden = !p || comCodigo;
    $('#nomeDica').textContent = 'Este é o seu nome neste servidor. Para trocar, entre e clique nele, embaixo à esquerda.';
    $('#codigoToggle').hidden = !!p && !comCodigo;
    $('#codigoToggle').textContent = comCodigo ? 'Entrar com o apelido' : 'Já tenho um nome (entrar com código)';
  }
  function mostrarCodigo(sim) {
    $('#codigoField').hidden = !sim;
    travarNome();
    if (sim) $('#codigoInput').focus();
  }

  // Aparelho lembrado como admin: a chave fica só aqui; o servidor guarda apenas o resumo dela
  function lembreteAdmin() {
    const l = lerSalvo().lembreteAdmin;
    return l && typeof l.token === 'string' && typeof l.id === 'string' ? l : null;
  }
  function esquecerEsteAparelho() {
    const l = lembreteAdmin();
    salvar({ lembreteAdmin: null, adminPassword: '' });
    S.adminPassword = '';
    if (l && S.token) api('esquecer-lembrete', { token: l.token }).catch(() => {});
  }
  let tentativasDeEntrada = 0;
  async function entrar(name, color, password, auto, adminPassword = '', codigo = '') {
    if (!name && !codigo) return;
    const btn = $('#loginBtn');
    btn.disabled = true;
    $('#loginError').textContent = '';
    if (!auto) tentativasDeEntrada = 0;
    try {
      const lembrete = !adminPassword ? lembreteAdmin() : null;
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, color, password, adminPassword, lembrete: lembrete?.token, device: salvo.device,
          ...(codigo ? { codigo } : { perfil: perfilSalvo() || undefined }),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(j.error || 'Erro ao entrar');
        err.status = r.status;
        err.campo = j.campo;
        throw err;
      }
      // o nome e a cor vêm do perfil (é sempre o mesmo nome)
      if (j.perfil?.id) {
        if (j.perfil.chave) salvar({ perfil: { id: j.perfil.id, chave: j.perfil.chave } });
        S.myPid = j.perfil.id;
        name = j.perfil.nome;
        color = j.perfil.cor;
      }
      S.token = j.token;
      S.myId = j.id;
      S.myName = name;
      S.myColor = color;
      S.password = password;
      S.kicked = null;
      tentativasDeEntrada = 0;
      // a senha de admin nunca fica guardada: o aparelho passa a ser lembrado por uma chave
      const patch = { name, color, password, adminPassword: '' };
      if (j.lembrete?.id && j.lembrete?.token) patch.lembreteAdmin = j.lembrete;
      salvar(patch);
      // sem chave (não deu para lembrar), a senha fica só na memória, para reconectar
      S.adminPassword = j.admin && !j.lembrete && !j.lembreteId ? adminPassword : '';
      btn.textContent = 'Conectando…';
      conectar();
    } catch (e) {
      // servidor acordando ou atualizando: tenta de novo sozinho, sem perder nada
      if (auto && (e instanceof TypeError || e.status >= 500) && tentativasDeEntrada < 40) {
        tentativasDeEntrada++;
        $('#loginError').textContent = 'O servidor está acordando. Tentando de novo…';
        setTimeout(() => entrar(name, color, password, true, adminPassword), 3000);
        return;
      }
      if (e.campo === 'perfil') {
        // o aparelho foi esquecido: volta a escolher nome (ou a usar um código)
        salvar({ perfil: null });
        travarNome();
        if (auto && !entrar.semPerfil) { entrar.semPerfil = true; return entrar(name, color, password, true, adminPassword); }
      } else if (e.campo === 'nome' || e.campo === 'codigo') {
        mostrarCodigo(true);
      } else if (e.campo === 'admin' || e.campo === 'lembrete') {
        salvar({ adminPassword: '', ...(e.campo === 'lembrete' ? { lembreteAdmin: null } : {}) });
        $('#adminField').hidden = false;
        $('#adminToggle').textContent = 'Entrar sem ser admin';
      } else if (e.status === 403) salvar({ password: '' });
      $('#nameInput').value = name;
      $('#loginError').textContent = e instanceof TypeError
        ? 'Não consegui falar com o servidor. A janela do servidor (iniciar.bat) está aberta?'
        : e.message;
      if (auto) $('#nameInput').focus();
      btn.disabled = false;
    }
  }

  // ================= Conexão em tempo real =================
  // Tenta SSE (eventos do servidor). Se nada chegar em alguns segundos — alguns túneis
  // e proxies seguram esse tipo de conexão — troca sozinho para long-polling.
  function conectar() {
    if (S.es) { S.es.close(); S.es = null; }
    clearTimeout(S.sseWatch);
    if (S.usarPolling) return iniciarPolling();
    const es = new EventSource('/api/events?token=' + encodeURIComponent(S.token));
    S.es = es;
    let recebeu = false;
    es.onmessage = (e) => {
      recebeu = true;
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      tratar(m);
    };
    es.onopen = () => { $('#connBanner').hidden = true; };
    es.onerror = () => {
      if (S.started) $('#connBanner').hidden = false;
      if (es.readyState === EventSource.CLOSED && S.es === es) agendarReentrada();
    };
    S.sseWatch = setTimeout(() => {
      if (!recebeu && S.es === es) {
        console.info('Eventos em tempo real bloqueados no caminho; usando long-polling.');
        es.close();
        S.es = null;
        S.usarPolling = true;
        salvar({ polling: true });
        iniciarPolling();
      }
    }, 8000);
  }

  async function iniciarPolling() {
    const token = S.token;
    let init = true;
    while (S.token === token) {
      try {
        const r = await fetch(`/api/poll?token=${encodeURIComponent(token)}${init ? '&init=1' : ''}`, { cache: 'no-store' });
        if (S.token !== token) return;
        if (r.status === 401) {
          const j = await r.json().catch(() => ({}));
          return j.kicked ? foiExpulso(j.kicked) : agendarReentrada();
        }
        if (!r.ok) throw new Error(r.status);
        const j = await r.json();
        init = false;
        $('#connBanner').hidden = true;
        for (const ev of j.events || []) tratar(ev);
      } catch {
        if (S.token !== token) return;
        if (S.started) $('#connBanner').hidden = false;
        init = true;
        await new Promise((ok) => setTimeout(ok, 2000));
      }
    }
  }

  // Um sinal de vida a cada 4 minutos (alguns serviços grátis "dormem" sem tráfego)
  setInterval(() => { if (S.token && S.started) api('ping').catch(() => {}); }, 4 * 60e3);

  function agendarReentrada() {
    if (S.rejoinTimer || S.kicked || !S.token) return;
    S.rejoinTimer = setTimeout(reentrar, 1500);
  }
  async function reentrar() {
    try {
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: S.myName, color: S.myColor, password: S.password, adminPassword: S.adminPassword,
          lembrete: !S.adminPassword && S.isAdmin ? lembreteAdmin()?.token : undefined, device: salvo.device,
          perfil: perfilSalvo() || undefined,
        }),
      });
      if (S.kicked) return;
      if (r.status === 409) {
        // o nome é de outra pessoa e este aparelho não é mais reconhecido: volta para a entrada
        const j = await r.json().catch(() => ({}));
        try { sessionStorage.setItem('telinha-aviso', j.error || 'Entre de novo.'); sessionStorage.setItem('telinha-sem-auto', '1'); } catch { /* ok */ }
        S.saindoDeVez = true;
        location.reload();
        return;
      }
      if (r.status === 403) {
        const j = await r.json().catch(() => ({}));
        if (j.banned) return foiExpulso({ banned: true, reason: '' });
        if (j.campo === 'perfil') {
          salvar({ perfil: null });
          S.rejoinTimer = null;
          return reentrar(); // tenta pelo nome (o mesmo aparelho continua reconhecido)
        }
        if (j.campo === 'admin' || j.campo === 'lembrete') {
          S.adminPassword = '';
          S.isAdmin = false;
          salvar({ adminPassword: '', lembreteAdmin: null });
          S.rejoinTimer = null;
          toast('Este aparelho não é mais lembrado como admin. Para voltar, use /admin <senha>.', 8000);
          return reentrar();
        }
        salvar({ password: '' });
        S.saindoDeVez = true;
        location.reload();
        return;
      }
      if (r.status === 423) { S.rejoinTimer = null; return foiExpulso({ locked: true }); }
      if (!r.ok) throw new Error();
      const j = await r.json();
      S.rejoinTimer = null;
      for (const id of [...S.inc.keys()]) fecharInc(id);
      for (const id of [...S.out.keys()]) fecharOut(id);
      S.token = j.token;
      S.myId = j.id;
      if (j.perfil?.id) {
        if (j.perfil.chave) salvar({ perfil: { id: j.perfil.id, chave: j.perfil.chave } });
        S.myPid = j.perfil.id;
      }
      conectar();
    } catch {
      S.rejoinTimer = setTimeout(reentrar, 3000);
    }
  }

  function tratar(m) {
    switch (m.type) {
      case 'init': return onInit(m);
      case 'presence': return onPresence(m.users);
      case 'msg': return onMsg(m.msg);
      case 'perfil': return onPerfil(m);
      case 'ice': return onIce(m.iceServers);
      case 'visto': if (S.perfis?.[m.id]) S.perfis[m.id].visto = m.visto; return;
      case 'typing': return onTyping(m);
      case 'channels': return onChannels(m.channels);
      case 'signal': return onSignal(m.from, m.data);
      case 'msg-delete': return onMsgDelete(m);
      case 'msg-edit': return onMsgEdit(m);
      case 'clear': return onClear(m);
      case 'settings': return onSettings(m);
      case 'announce': return mostrarAviso(m);
      case 'kicked': return foiExpulso(m);
      case 'muted': return onMuted(m);
      case 'force': return onForce(m);
      case 'role': return onRole(m);
      case 'renamed': return onRenamed(m);
      case 'sb': return onSomTocado(m);
      case 'tinta': return onTinta(m);
      case 'emote': return onEmote(m);
      case 'avisoAdmin':
        toast(m.texto, 10000);
        if (P.aberto && P.aba === 'problemas') carregarProblemas();
        return atualizarPainel();
    }
  }

  async function onInit(m) {
    conferirVersaoDoPrograma(m.programa);
    if (m.programa && `v${m.programa}` !== VERSAO.texto && !PROGRAMA) mostrarVersao(m.programa, m.build);
    S.myId = m.me.id;
    S.isAdmin = !!m.me.admin;
    S.mutedUntil = m.muted || 0;
    S.locked = !!m.locked;
    S.serverName = m.serverName;
    S.channels = m.channels;
    S.messages = m.messages || {};
    S.antigas = m.antigas || {}; // canal -> posição de onde começam as mais antigas (0: não tem)
    S.perfis = m.perfis || {};
    if (m.me?.pid) S.myPid = m.me.pid;
    S.iceServers = m.iceServers || [];
    S.users = m.users;
    if (S.sala && !chan(S.sala)) sairDaSalaLocal('sala-apagada');
    patchMe();
    if (!chan(S.view)) S.view = (textChannels()[0] || S.channels[0]).id;

    if (!S.started) {
      S.started = true;
      $('#login').hidden = true;
      $('#app').hidden = false;
      montarBotoes();
      aplicarSaida();
    }
    document.title = MARCA;
    renderTudo();
    renderMensagens();

    if (!S.voltaConferida) {
      S.voltaConferida = true;
      voltarParaASala();
    }

    // Reconectou no meio de uma sala? Avisa o servidor de novo.
    if (S.sala) {
      try {
        await api('state', { sala: S.sala, live: S.live, ...estadoVoz() });
      } catch (e) {
        anotarErro(`Não voltou para a sala depois de reconectar: ${e.message}`, 'reconexão');
        sairDaSalaLocal('conexao');
      }
      sincronizarStreams();
      renderTudo();
    }
  }

  async function voltarParaASala() {
    let volta = null;
    try {
      volta = JSON.parse(sessionStorage.getItem('telinha-volta') || 'null');
      sessionStorage.removeItem('telinha-volta');
    } catch { volta = null; }
    const falhas = await conferirFalhasDoPrograma();
    if (!volta || Date.now() - volta.t > 3 * 60e3 || S.sala || chan(volta.sala)?.type !== 'sala') return;
    await entrarNaSala(volta.sala);
    if (!volta.transmitia) return;
    const caiu = falhas.find((f) => f.onde === 'página' && Date.now() - f.quando < 5 * 60e3);
    toast(caiu
      ? `O programa teve uma falha e recarregou a página, então a sua transmissão parou. Você voltou para a sala: clique em Compartilhar para transmitir de novo.`
      : 'A página recarregou, então a sua transmissão parou. Você voltou para a sala: clique em Compartilhar para transmitir de novo.', 12000);
  }
  // Falhas do programa (página ou placa de vídeo que caíram) vão para o registro de erros do admin
  async function conferirFalhasDoPrograma() {
    if (typeof PROGRAMA?.falhas !== 'function') return [];
    let lista = [];
    try { lista = (await PROGRAMA.falhas()) || []; } catch { return []; }
    for (const f of lista) {
      anotarErro(`O programa teve uma falha: ${f.onde}${f.nome ? ` (${f.nome})` : ''} caiu (${f.motivo || '?'}, código ${f.codigo}) às ${new Date(f.quando).toLocaleTimeString('pt-BR')}`, 'programa');
    }
    return lista;
  }
  setInterval(() => { if (S.started) conferirFalhasDoPrograma(); }, 60e3);

  function patchMe() {
    const me = userById(S.myId);
    if (me) {
      me.sala = S.sala;
      me.live = S.live;
    }
  }

  function vizinhosDeSala() {
    if (!S.sala) return new Set();
    return new Set(S.users.filter((u) => u.id !== S.myId && u.sala === S.sala).map((u) => u.id));
  }

  function onPresence(users) {
    const antes = vizinhosDeSala();
    S.users = users;
    patchMe();
    const me = userById(S.myId);
    if (me && me.admin !== S.isAdmin) S.isAdmin = me.admin;
    const depois = vizinhosDeSala();
    if (S.sala) {
      if ([...depois].some((id) => !antes.has(id))) blip('join');
      else if ([...antes].some((id) => !depois.has(id))) blip('leave');
    }
    sincronizarStreams();
    renderTudo();
    atualizarCaneta();
    atualizarPainel();
  }

  function onChannels(channels) {
    S.channels = channels;
    if (S.sala && !chan(S.sala)) {
      sairDaSalaLocal('sala-apagada');
      toast('A sala em que você estava foi apagada.');
    }
    let mudouView = false;
    if (!chan(S.view)) {
      S.view = textChannels()[0].id;
      mudouView = true;
    }
    for (const c of channels) S.messages[c.id] ||= [];
    renderTudo();
    if (mudouView) renderMensagens();
  }

  // ================= Chat =================
  function onMsg(msg) {
    const lista = (S.messages[msg.ch] ||= []);
    if (lista.some((x) => x.id === msg.id)) return;
    const prev = lista[lista.length - 1];
    lista.push(msg);
    if (lista.length > 3000) { lista.shift(); S.antigas[msg.ch] = lista[0].pos || 0; }

    const tm = S.typing.get(msg.ch);
    if (tm) tm.delete(msg.uid);

    const deOutro = msg.uid !== S.myId;
    const visivel = msg.ch === S.view && !(chan(S.view)?.type === 'sala' && !S.showSalaChat);
    if (visivel) {
      const box = $('#messages');
      const perto = box.scrollHeight - box.scrollTop - box.clientHeight < 150;
      box.insertAdjacentHTML('beforeend', msgHtml(msg, prev));
      if (perto || !deOutro) box.scrollTop = box.scrollHeight;
    } else if (deOutro) {
      S.unread.add(msg.ch);
    }
    if (deOutro && (document.hidden || !visivel)) {
      if (document.hidden) {
        S.unseen++;
        document.title = `(${S.unseen}) ${MARCA}`;
      }
      if (mencionaMe(msg)) {
        blip('msg');
        S.mencoes.add(msg.ch);
      }
    }
    renderTyping();
    renderSidebar();
  }

  function onTyping(m) {
    if (m.uid === S.myId) return;
    if (!S.typing.has(m.channel)) S.typing.set(m.channel, new Map());
    S.typing.get(m.channel).set(m.uid, { name: m.name, until: Date.now() + 4000 });
    renderTyping();
  }

  function renderTyping() {
    const tm = S.typing.get(S.view);
    const agora = Date.now();
    const nomes = [];
    if (tm) for (const [uid, t] of tm) {
      if (t.until < agora) tm.delete(uid);
      else nomes.push(t.name);
    }
    const el = $('#typing');
    if (!nomes.length) { el.innerHTML = ''; return; }
    let txt;
    if (nomes.length === 1) txt = `<b>${esc(nomes[0])}</b> está digitando…`;
    else if (nomes.length === 2) txt = `<b>${esc(nomes[0])}</b> e <b>${esc(nomes[1])}</b> estão digitando…`;
    else txt = 'Várias pessoas estão digitando…';
    el.innerHTML = `<span class="dots"><i></i><i></i><i></i></span><span>${txt}</span>`;
  }
  setInterval(renderTyping, 1000);

  // A mensagem é para mim? @meuNome, @everyone, resposta a uma mensagem minha, ou as minhas boas-vindas
  const TODOS = /(^|[^\p{L}\p{N}_])@(everyone|todos|here|galera)(?![\p{L}\p{N}_])/iu;
  function mencionaMe(m) {
    if (!m) return false;
    if (m.sistema === 'boasvindas') return !!S.myPid && m.alvo === S.myPid;
    if (m.uid === S.myId || (m.pid && m.pid === S.myPid)) return false; // as minhas não
    const t = String(m.text || '');
    if (S.myPid && t.includes(`<@${S.myPid}>`)) return true;
    if (TODOS.test(t)) return true;
    if (m.resp && ((m.resp.pid && m.resp.pid === S.myPid) || (m.resp.sistema === 'boasvindas' && m.resp.alvo === S.myPid))) return true;
    // mensagens de antes das menções (só o texto com o nome)
    const nome = S.myName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^\\p{L}\\p{N}_])@' + nome + '(?![\\p{L}\\p{N}_])', 'iu').test(t);
  }
  const nomeDoPerfil = (pid) => S.perfis?.[pid]?.nome || 'alguém';
  // <@id> vira "@Nome atual" (para editar, ou um resuminho sem formatação)
  const textoComNomes = (t) => String(t || '').replace(/<@([0-9a-f]{12})>/g, (_, id) => `@${nomeDoPerfil(id)}`);
  // "@Nome" escrito à mão (mensagens de antes): acha o nome registrado mais comprido que combina
  const tiraAcento = (x) => x.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  function mencaoSolta(resto) {
    const nomes = Object.entries(S.perfis || {}).map(([id, p]) => [id, esc(p.nome)]).sort((a, b) => b[1].length - a[1].length);
    for (const [id, nome] of nomes) {
      const trecho = resto.slice(0, nome.length);
      if (trecho.length === nome.length && tiraAcento(trecho) === tiraAcento(nome) && !/[\p{L}\p{N}_]/u.test(resto[nome.length] || ' ')) return [id, nome.length];
    }
    return null;
  }

  function formatar(texto) {
    let s = esc(texto);
    // menções: <@id> e @everyone viram etiquetas (as minhas ficam mais fortes)
    const mencoes = [];
    const etiqueta = (html) => { mencoes.push(html); return `\u0001${mencoes.length - 1}\u0001`; };
    s = s.replace(/&lt;@([0-9a-f]{12})&gt;/g, (_, id) => etiqueta(`<span class="ment${id === S.myPid ? ' eu' : ''}">@${esc(nomeDoPerfil(id))}</span>`));
    s = s.replace(/(^|[^\p{L}\p{N}_])@(everyone|todos|here|galera)(?![\p{L}\p{N}_])/giu, (_, a, n) => a + etiqueta(`<span class="ment todos">@${n}</span>`));
    // "@Nome" escrito à mão (mensagens de antes das menções): vira etiqueta se for um nome registrado
    let comEtiquetas = '';
    for (let i = 0; i < s.length;) {
      const j = s.indexOf('@', i);
      if (j < 0) { comEtiquetas += s.slice(i); break; }
      comEtiquetas += s.slice(i, j);
      const achou = /[\p{L}\p{N}_;]/u.test(s[j - 1] || ' ') ? null : mencaoSolta(s.slice(j + 1));
      if (achou) {
        comEtiquetas += etiqueta(`<span class="ment${achou[0] === S.myPid ? ' eu' : ''}">@${esc(nomeDoPerfil(achou[0]))}</span>`);
        i = j + 1 + achou[1];
      } else {
        comEtiquetas += '@';
        i = j + 1;
      }
    }
    s = comEtiquetas;
    const codes = [];
    s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    const imgs = [];
    s = s.replace(/https?:\/\/[^\s<]+[^\s<.,:;!?)\]'"]/g, (url) => {
      if (/\.(png|jpe?g|gif|webp|avif)(\?\S*)?$/i.test(url) && imgs.length < 3) imgs.push(url);
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    s = s
      .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?])/g, '$1<i>$2</i>')
      .replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
    s = s.replace(/\u0001(\d+)\u0001/g, (_, i) => mencoes[i]);
    // a imagem vem pelo servidor: o site de origem não vê o IP de quem está no chat
    const bruto = (u) => u.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);
    return s + imgs.map((u) => `<img class="embed" src="/api/img?u=${encodeURIComponent(bruto(u))}&amp;t=${encodeURIComponent(S.token || '')}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('');
  }

  const mesmoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const hhmm = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  function quando(d) {
    const hoje = new Date();
    const ontem = new Date(Date.now() - 864e5);
    if (d.toDateString() === hoje.toDateString()) return `Hoje às ${hhmm(d)}`;
    if (d.toDateString() === ontem.toDateString()) return `Ontem às ${hhmm(d)}`;
    return `${d.toLocaleDateString('pt-BR')} ${hhmm(d)}`;
  }

  // Nome e cor de quem mandou: os atuais do perfil (trocou de nome, as mensagens antigas acompanham)
  function autorDe(m) {
    const p = m.pid && S.perfis?.[m.pid];
    return p ? { name: p.nome, color: p.cor } : { name: m.name, color: m.color };
  }
  const mesmoAutor = (a, b) => (a.pid && b.pid ? a.pid === b.pid : a.uid === b.uid);
  function msgHtml(m, prev) {
    const d = new Date(m.ts);
    const autor = autorDe(m);
    let h = '';
    if (!prev || !mesmoDia(prev.ts, m.ts)) {
      h += `<div class="day-sep"><span>${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>`;
    }
    const cls = mencionaMe(m) ? ' mention' : '';
    const minha = (m.pid && m.pid === S.myPid) || m.uid === S.myId;
    const botao = (attr, ic, titulo) => `<button class="icon-btn small" ${attr} title="${titulo}" aria-label="${titulo}">${icon(ic)}</button>`;
    const acoes = `<div class="m-actions">${botao(`data-responder="${esc(m.id)}"`, 'responder', 'Responder')}`
      + (minha && !m.sistema ? botao(`data-editar="${esc(m.id)}"`, 'pencil', 'Editar') : '')
      + (minha || S.isAdmin ? botao(`data-delmsg="${esc(m.id)}"`, 'trash', 'Apagar mensagem (Shift+clique apaga sem perguntar)') : '')
      + '</div>';
    const attrs = `data-id="${esc(m.id)}"${Number.isInteger(m.pos) ? ` data-pos="${m.pos}"` : ''}`;
    if (m.sistema === 'boasvindas') {
      const p = S.perfis?.[m.alvo];
      const nome = `<span class="bv-nome" style="--cor:${esc(p?.cor || '#3db3f0')}">${esc(p?.nome || 'alguém')}</span>`;
      return h + `<div class="msg boas-vindas${cls}" ${attrs}>${STICKERS[m.figura] || STICKERS[0]}
        <div class="bv-texto"><div class="bv-frase">${(FRASES_BOAS_VINDAS[m.frase] || FRASES_BOAS_VINDAS[0])(nome)}</div>
          <span class="m-time" title="${esc(d.toLocaleString('pt-BR'))}">${quando(d)}</span></div>${acoes}</div>`;
    }
    // respondendo: a resposta sempre mostra o cabeçalho, com a mensagem respondida em cima
    const agrupada = !m.resp && prev && !prev.sistema && mesmoAutor(prev, m) && m.ts - prev.ts < 5 * 60e3 && mesmoDia(prev.ts, m.ts);
    const editando = S.editando?.id === m.id;
    const texto = editando
      ? `<div class="m-text m-editor"><textarea class="m-edit" rows="1" maxlength="2000" aria-label="Editar mensagem">${esc(S.editando.rascunho)}</textarea>
          <div class="m-edit-dica">Enter salva · Esc cancela · Shift+Enter pula linha</div></div>`
      : `<div class="m-text">${formatar(m.text)}</div>`;
    const editada = m.editada ? `<span class="m-editada" title="Editada ${esc(quando(new Date(m.editada)).toLowerCase())}">(editada)</span>` : '';
    if (agrupada) {
      return h + `<div class="msg${cls}" ${attrs}><span class="m-stamp">${hhmm(d)}</span>${editada ? `<div class="m-editada-linha">${editada}</div>` : ''}${texto}${acoes}</div>`;
    }
    return h + `<div class="msg head${cls}${m.resp ? ' com-resp' : ''}" ${attrs}>${m.resp ? citacaoHtml(m) : ''}${avatar(autor)}<div class="m-head"><span class="m-name" style="color:${esc(autor.color)}">${esc(autor.name)}</span>${coroa(m)}<span class="m-time" title="${esc(d.toLocaleString('pt-BR'))}">${quando(d)}</span>${editada}</div>${texto}${acoes}</div>`;
  }
  // A mensagem respondida, em cima da resposta (clicar leva até ela)
  function citacaoHtml(m) {
    const r = m.resp;
    const original = (S.messages[m.ch] || []).find((x) => x.id === r.id);
    const apagada = !original && (r.apagada || S.apagadas?.has(r.id));
    let quem;
    let resumo;
    if (r.sistema === 'boasvindas') {
      quem = { name: S.perfis?.[r.alvo]?.nome || 'alguém', color: S.perfis?.[r.alvo]?.cor || '#3db3f0' };
      resumo = 'boas-vindas';
    } else {
      quem = r.pid && S.perfis?.[r.pid] ? { name: S.perfis[r.pid].nome, color: S.perfis[r.pid].cor } : { name: r.nome, color: '#8a94a6' };
      resumo = textoComNomes(original ? original.text : r.texto).replace(/\s+/g, ' ').slice(0, 120);
    }
    return `<div class="m-resp${apagada ? ' apagada' : ''}" data-ir="${esc(r.id)}" data-ir-pos="${Number.isInteger(r.pos) ? r.pos : ''}" title="${apagada ? 'A mensagem respondida foi apagada' : 'Ir até a mensagem respondida'}">
      ${icon('responder')}${avatar(quem, 'mini')}<b style="color:${esc(quem.color)}">${esc(quem.name)}</b>
      <span class="mr-texto">${apagada ? '<i>mensagem apagada</i>' : esc(resumo)}</span></div>`;
  }


  function renderMensagens(manterScroll = false) {
    const c = chan(S.view);
    if (!c) return;
    const lista = S.messages[c.id] || [];
    const sala = c.type === 'sala';
    // as mensagens ficam guardadas para sempre: as mais antigas vêm quando sobe o chat
    let h = S.antigas?.[c.id] > 0
      ? `<div class="antigas"><button type="button" class="btn sm ghost" data-antigas>${S.carregandoAntigas ? 'Carregando…' : 'Carregar mensagens anteriores'}</button></div>`
      : `<div class="welcome"><div class="wicon">${icon(sala ? 'screen' : 'hash')}</div>
      <h2>${sala ? 'Chat da ' + esc(c.name) : 'Bem-vindo(a) a #' + esc(c.name) + '!'}</h2>
      <p>${sala ? 'Converse aqui enquanto assistem juntos.' : `Este é o começo do canal #${esc(c.name)}.`}</p></div>`;
    lista.forEach((m, i) => { h += msgHtml(m, lista[i - 1]); });
    const box = $('#messages');
    box.innerHTML = h;
    if (manterScroll) return;
    box.scrollTop = box.scrollHeight;
    S.stick = true;
    atualizarComposer();
    renderTyping();
  }

  function atualizarComposer() {
    const c = chan(S.view);
    if (!c) return;
    const input = $('#msgInput');
    const mudo = S.mutedUntil > Date.now();
    input.disabled = mudo;
    $('#composer').classList.toggle('muted', mudo);
    if (mudo) {
      const ate = new Date(S.mutedUntil);
      input.placeholder = S.mutedUntil - Date.now() > 300 * 864e5
        ? 'Você foi silenciado por um admin'
        : `Você foi silenciado por um admin até ${hhmm(ate)}${mesmoDia(ate, Date.now()) ? '' : ' de ' + ate.toLocaleDateString('pt-BR')}`;
    } else {
      input.placeholder = (c.type === 'sala' ? `Conversar na ${c.name}` : `Conversar em #${c.name}`) + (S.isAdmin ? ' · / para comandos' : '');
    }
  }
  setInterval(() => { if (S.mutedUntil && S.mutedUntil < Date.now()) { S.mutedUntil = 0; atualizarComposer(); } }, 5000);

  $('#messages').addEventListener('scroll', (e) => {
    const b = e.target;
    S.stick = b.scrollHeight - b.scrollTop - b.clientHeight < 150;
    if (b.scrollTop < 60 && S.antigas?.[S.view] > 0) carregarAntigas(S.view); // chegou no topo: busca as anteriores
  });
  async function carregarAntigas(ch, forcar = false) {
    if (forcar) while (S.carregandoAntigas) await esperar(80);
    if (S.carregandoAntigas || !(S.antigas[ch] > 0)) return;
    S.carregandoAntigas = true;
    const botao = $('#messages [data-antigas]');
    if (botao) botao.textContent = 'Carregando…';
    try {
      const r = await api('historico', { channel: ch, antes: S.antigas[ch] });
      const lista = S.messages[ch] || [];
      const tem = new Set(lista.map((m) => m.id));
      S.messages[ch] = [...r.mensagens.filter((m) => !tem.has(m.id)), ...lista];
      S.antigas[ch] = r.mais ? r.desde : 0;
      if (ch === S.view) {
        // continua vendo a mesma mensagem que estava no topo
        const box = $('#messages');
        const antes = box.scrollHeight - box.scrollTop;
        renderMensagens(true);
        box.scrollTop = box.scrollHeight - antes;
      }
    } catch (e) {
      if (botao) botao.textContent = 'Carregar mensagens anteriores';
      toast(e.message);
    } finally {
      if (forcar) S.carregandoAntigas = false;
      else setTimeout(() => { S.carregandoAntigas = false; }, 300);
    }
  }
  // Imagens carregando depois empurram o chat: mantém colado no fim
  $('#messages').addEventListener('load', (e) => {
    if (e.target.tagName === 'IMG' && S.stick) $('#messages').scrollTop = $('#messages').scrollHeight;
  }, true);
  $('#messages').addEventListener('click', (e) => {
    const del = e.target.closest('[data-delmsg]');
    if (del) return apagarMensagem(del.dataset.delmsg, e.shiftKey);
    if (e.target.closest('[data-antigas]')) return carregarAntigas(S.view);
    const resp = e.target.closest('[data-responder]');
    if (resp) return responderMensagem(resp.dataset.responder);
    const ed = e.target.closest('[data-editar]');
    if (ed) return editarMensagem(ed.dataset.editar);
    const ir = e.target.closest('[data-ir]');
    if (ir && !ir.classList.contains('apagada')) return irParaMensagem(ir.dataset.ir, ir.dataset.irPos === '' ? null : Number(ir.dataset.irPos));
    const img = e.target.closest('img.embed');
    if (!img) return;
    const v = document.createElement('div');
    v.className = 'img-viewer';
    v.innerHTML = `<img src="${esc(img.src)}" alt="">`;
    v.onclick = () => v.remove();
    document.body.appendChild(v);
  });

  // ----- Responder a uma mensagem -----
  function responderMensagem(id) {
    const m = (S.messages[S.view] || []).find((x) => x.id === id);
    if (!m) return;
    S.resposta = m.sistema === 'boasvindas'
      ? { ch: S.view, id: m.id, pos: m.pos, rotulo: `Respondendo às boas-vindas de <b>${esc(nomeDoPerfil(m.alvo))}</b>`, texto: '' }
      : { ch: S.view, id: m.id, pos: m.pos, rotulo: `Respondendo a <b>${esc(autorDe(m).name)}</b>`, texto: textoComNomes(m.text).replace(/\s+/g, ' ').slice(0, 90) };
    renderRespBar();
    $('#msgInput').focus();
  }
  function cancelarResposta() {
    S.resposta = null;
    renderRespBar();
  }
  function renderRespBar() {
    const b = $('#respBar');
    const r = S.resposta;
    // a faixa ocupa espaço embaixo: segura a conversa no lugar para ela não cobrir a última mensagem
    const box = $('#messages');
    const doFim = box.scrollHeight - box.scrollTop - box.clientHeight;
    b.hidden = !r;
    if (r) {
      b.innerHTML = `${icon('responder')}<span class="rb-txt">${r.rotulo}${r.texto ? `: <span class="rb-texto">${esc(r.texto)}</span>` : ''}</span>
        <button type="button" class="icon-btn small" data-cancelar-resp title="Cancelar resposta (Esc)" aria-label="Cancelar resposta">${icon('close')}</button>`;
    }
    box.scrollTop = box.scrollHeight - box.clientHeight - doFim;
  }
  $('#respBar').addEventListener('click', (e) => { if (e.target.closest('[data-cancelar-resp]')) { cancelarResposta(); $('#msgInput').focus(); } });

  // Vai até a mensagem respondida (buscando as mais antigas, se precisar) e dá uma piscada nela
  async function irParaMensagem(id, pos) {
    const ch = S.view;
    const achar = () => $(`#messages .msg[data-id="${CSS.escape(id)}"]`);
    let el = achar();
    for (let n = 0; !el && n < 60 && S.antigas[ch] > 0 && (pos === null || pos < S.antigas[ch]); n++) {
      await carregarAntigas(ch, true);
      if (S.view !== ch) return;
      el = achar();
    }
    if (!el) return toast('Essa mensagem foi apagada.');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('piscando');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('piscando');
    setTimeout(() => el.classList.remove('piscando'), 2400);
  }

  // ----- Editar as próprias mensagens (todo mundo vê "(editada)") -----
  const minhaMensagem = (m) => (m.pid && m.pid === S.myPid) || m.uid === S.myId;
  function autoAlturaDe(t) {
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 320) + 'px';
  }
  function editarMensagem(id) {
    const m = (S.messages[S.view] || []).find((x) => x.id === id);
    if (!m || m.sistema || !minhaMensagem(m)) return;
    const texto = textoComNomes(m.text);
    S.editando = { id, ch: S.view, pos: m.pos, rascunho: texto, original: texto };
    rerenderMantendoScroll();
    const t = $('#messages .m-edit');
    if (t) {
      t.focus();
      t.setSelectionRange(t.value.length, t.value.length);
      autoAlturaDe(t);
      t.closest('.msg')?.scrollIntoView({ block: 'nearest' });
    }
  }
  function cancelarEdicao() {
    if (!S.editando) return;
    S.editando = null;
    rerenderMantendoScroll();
    $('#msgInput').focus();
  }
  async function salvarEdicao() {
    const ed = S.editando;
    if (!ed) return;
    const texto = ed.rascunho.trim();
    if (!texto) return toast('A mensagem não pode ficar vazia. Para tirar, apague.');
    if (texto === ed.original.trim()) return cancelarEdicao();
    try {
      await api('msg-edit', { channel: ed.ch, id: ed.id, pos: ed.pos, text: texto });
      S.editando = null;
      rerenderMantendoScroll();
      $('#msgInput').focus();
    } catch (e) {
      toast(e.message);
    }
  }
  $('#messages').addEventListener('keydown', (e) => {
    if (!e.target.classList?.contains('m-edit')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelarEdicao(); }
    else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); salvarEdicao(); }
  });
  $('#messages').addEventListener('input', (e) => {
    if (!e.target.classList?.contains('m-edit') || !S.editando) return;
    S.editando.rascunho = e.target.value;
    autoAlturaDe(e.target);
  });

  async function enviarMensagem() {
    const input = $('#msgInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    autoAltura();
    renderSugestoes();
    S.lastTypingSent = 0;
    if (text.startsWith('/') && !text.startsWith('//')) {
      try {
        await executarComando(text);
      } catch (e) {
        toast(e.message, 5000);
        if (!input.value) input.value = text;
      }
      return;
    }
    const resp = S.resposta && S.resposta.ch === S.view ? { id: S.resposta.id, pos: S.resposta.pos } : null;
    try {
      await api('msg', { channel: S.view, text: text.startsWith('//') ? text.slice(1) : text, ...(resp ? { resp } : {}) });
      if (resp && S.resposta?.id === resp.id) cancelarResposta();
    } catch (e) {
      if (e.data?.muted) { S.mutedUntil = e.data.muted; atualizarComposer(); }
      toast('Não foi possível enviar: ' + e.message);
      if (!input.value) input.value = text;
    }
  }
  function autoAltura() {
    const t = $('#msgInput');
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, window.innerHeight * 0.4) + 'px';
  }
  $('#msgInput').addEventListener('keydown', (e) => {
    const sm = S.sugestaoMencao;
    if (sm && !$('#cmdSuggest').hidden) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sm.sel = (sm.sel + (e.key === 'ArrowDown' ? 1 : -1) + sm.itens.length) % sm.itens.length;
        return desenharMencoes();
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey && !e.isComposing) { e.preventDefault(); return inserirMencao(sm.sel); }
      if (e.key === 'Escape') { e.preventDefault(); $('#cmdSuggest').hidden = true; S.sugestaoMencao = null; return; }
    }
    if (e.key === 'Escape' && S.resposta && $('#cmdSuggest').hidden) { e.preventDefault(); return cancelarResposta(); }
    if (e.key === 'ArrowUp' && !$('#msgInput').value) {
      const minhas = (S.messages[S.view] || []).filter((m) => !m.sistema && minhaMensagem(m));
      if (minhas.length) { e.preventDefault(); return editarMensagem(minhas[minhas.length - 1].id); }
    }
    if (e.key === 'Tab' && !$('#cmdSuggest').hidden) {
      const it = $('#cmdSuggest .cs-item.sel');
      if (it && !/\s/.test($('#msgInput').value)) {
        e.preventDefault();
        $('#msgInput').value = `/${it.dataset.cmd} `;
        renderSugestoes();
      }
      return;
    }
    if (e.key === 'Escape' && !$('#cmdSuggest').hidden) { $('#cmdSuggest').hidden = true; return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      enviarMensagem();
    }
  });
  $('#msgInput').addEventListener('input', () => {
    autoAltura();
    renderSugestoes();
    if ($('#msgInput').value.startsWith('/')) return; // comando não conta como "digitando"
    if ($('#msgInput').value.trim() && Date.now() - S.lastTypingSent > 2500) {
      S.lastTypingSent = Date.now();
      api('typing', { channel: S.view }).catch(() => {});
    }
  });
  $('#composer').addEventListener('submit', (e) => { e.preventDefault(); enviarMensagem(); });

  // ================= Renderização geral =================
  function renderTudo() {
    renderSidebar();
    renderHeader();
    renderMembros();
    renderPaineis();
    renderPalco();
  }

  function renderSidebar() {
    // com o nome de sempre, aparece a logo (brilha ao passar o mouse); com outro nome, o texto
    const sn = $('#serverName');
    if (S.serverName.trim().toLowerCase() === 'caras e telas') {
      if (!sn.querySelector('.logo-ct')) sn.innerHTML = '<span class="logo-ct" role="img" aria-label="Caras E Telas"><img src="logo-ct.png" alt="" draggable="false"><span class="logo-brilho"></span></span>';
    } else sn.textContent = S.serverName;
    const rail = $('#railServer');
    const palavras = S.serverName.split(/\s+/).filter(Boolean);
    rail.textContent = (initial(palavras[0]) + (palavras.length > 1 ? initial(palavras[palavras.length - 1]) : '')).toUpperCase();
    rail.title = S.serverName;

    const cat = (tipo, nome) => `<div class="category ${S.collapsed[tipo] ? 'collapsed' : ''}">
      <span class="cat-name" data-collapse="${tipo}">${icon('chevron')}${nome}</span>
      ${S.isAdmin ? `<button class="icon-btn" data-add="${tipo}" title="Criar ${tipo === 'sala' ? 'sala' : 'canal'}">${icon('plus')}</button>` : ''}</div>`;
    const del = (c) => (S.isAdmin
      ? `<button class="icon-btn ch-del" data-rename="${esc(c.id)}" title="Renomear">${icon('pencil')}</button><button class="icon-btn ch-del" data-del="${esc(c.id)}" title="Apagar">${icon('trash')}</button>`
      : '');

    let h = cat('text', 'Canais de texto');
    for (const c of textChannels()) {
      if (S.collapsed.text && c.id !== S.view && !S.unread.has(c.id)) continue;
      const cls = [c.id === S.view && 'active', S.unread.has(c.id) && 'unread'].filter(Boolean).join(' ');
      const marca = S.mencoes.has(c.id) && c.id !== S.view ? '<span class="ch-mencao" title="Mencionaram você">@</span>' : '';
      h += `<div class="channel ${cls}" data-ch="${esc(c.id)}">${icon('hash')}<span class="ch-name">${esc(c.name)}</span>${marca}${del(c)}</div>`;
    }
    h += cat('sala', 'Salas de tela');
    for (const c of salas()) {
      const membros = S.users.filter((u) => u.sala === c.id);
      if (S.collapsed.sala && c.id !== S.view && c.id !== S.sala && !membros.length) continue;
      const aoVivo = membros.some((u) => u.live);
      const cls = [c.id === S.view && 'active', S.unread.has(c.id) && 'unread'].filter(Boolean).join(' ');
      h += `<div class="channel ${cls}" data-ch="${esc(c.id)}">${icon('screen')}<span class="ch-name">${esc(c.name)}</span>${aoVivo ? '<span class="live-badge">ao vivo</span>' : ''}${del(c)}</div>`;
      if (membros.length) {
        h += '<div class="sala-members">' + membros.map((u) => `<div class="sala-member"${u.id !== S.myId ? ` data-pessoa="${esc(u.id)}" title="Volume da voz de ${esc(u.name)}"` : ''}>${avatarVoz(u)}<span class="ellipsis">${esc(u.name)}</span>${coroa(u)}${vozIcones(u)}${u.live ? '<span class="live-badge">ao vivo</span>' : ''}</div>`).join('') + '</div>';
      }
    }
    $('#channels').innerHTML = h;
    $('#adminBtn').hidden = !S.isAdmin;
    $('#lockBadge').hidden = !S.locked;
  }

  function renderHeader() {
    const c = chan(S.view);
    if (!c) return;
    const sala = c.type === 'sala';
    $('#headerIcon').innerHTML = icon(sala ? 'screen' : 'hash');
    $('#headerTitle').textContent = c.name;
    if (sala) {
      const membros = S.users.filter((u) => u.sala === c.id);
      const vivos = membros.filter((u) => u.live).length;
      $('#headerSub').textContent = membros.length
        ? `${plural(membros.length, 'pessoa', 'pessoas')} na sala${vivos ? ` · ${vivos} ao vivo` : ''}`
        : 'Sala vazia';
    } else {
      $('#headerSub').textContent = '';
    }
    $('#toggleChatBtn').hidden = !sala;
    $('#toggleChatBtn').classList.toggle('active', S.showSalaChat);
    $('#toggleMembersBtn').hidden = sala;
    $('#toggleMembersBtn').classList.toggle('active', S.showMembers);

    const body = $('.main-body');
    body.classList.toggle('sala-view', sala);
    $('#stage').hidden = !sala;
    $('#chat').hidden = sala && !S.showSalaChat;
    $('#members').hidden = sala || !S.showMembers;
  }

  function nomeSala(id) {
    return chan(id)?.name || '';
  }

  // ----- Lista de membros: online em cima; embaixo, quem já entrou alguma vez e está offline,
  // com há quanto tempo saiu. Clicar (ou botão direito) num nome abre o menu da pessoa. -----
  function offlineHa(t) {
    if (!t) return 'offline';
    const min = Math.floor((Date.now() - t) / 60e3);
    if (min < 1) return 'saiu agora há pouco';
    if (min < 60) return `offline há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `offline há ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `offline há ${d} ${d === 1 ? 'dia' : 'dias'}`;
    const ms = Math.floor(d / 30);
    if (ms < 12) return `offline há ${ms} ${ms === 1 ? 'mês' : 'meses'}`;
    return 'offline há mais de um ano';
  }
  function pessoasOffline() {
    const online = new Set(S.users.map((u) => u.pid).filter(Boolean));
    return Object.entries(S.perfis || {})
      .filter(([id, p]) => !online.has(id) && !p.fora)
      .map(([id, p]) => ({ ...p, pid: id }))
      .sort((a, b) => (b.visto || 0) - (a.visto || 0) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  function renderMembros() {
    const box = $('#members');
    const focado = document.activeElement?.closest?.('#members .member')?.dataset.chave;
    const us = [...S.users].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const off = pessoasOffline();
    const linha = (chave, attrs, av, nome, sub, extra = '') => `<div class="member${extra}" role="button" tabindex="0" aria-haspopup="menu" data-chave="${esc(chave)}" ${attrs}>${av}<div class="mn"><div class="ellipsis name-line">${nome}</div>${sub ? `<div class="small muted">${sub}</div>` : ''}</div></div>`;
    box.innerHTML = `<h3>${us.length} online</h3>` + us.map((u) => {
      let st = '';
      if (u.live) st = `<span class="live-badge">ao vivo</span><span class="ellipsis">${esc(nomeSala(u.sala))}</span>`;
      else if (u.sala) st = `<span class="ellipsis">Em ${esc(nomeSala(u.sala))}</span>`;
      const eu = u.id === S.myId ? ' <span class="muted small">(você)</span>' : '';
      return linha(`u${u.id}`, `data-uid="${esc(u.id)}"${u.pid ? ` data-pid="${esc(u.pid)}"` : ''}`, avatar(u, 'dotted'),
        `<span style="color:${esc(u.color)}">${esc(u.name)}</span>${coroa(u)}${eu}`, st);
    }).join('') + (off.length ? `<h3 class="mb-off">${off.length} offline</h3>` + off.map((p) => linha(`p${p.pid}`,
      `data-pid="${esc(p.pid)}"${p.visto ? ` title="Visto por último ${esc(quandoCurto(p.visto))}"` : ''}`, avatar({ name: p.nome, color: p.cor }),
      `<span style="color:${esc(p.cor)}">${esc(p.nome)}</span>`, `<span class="mb-visto">${esc(offlineHa(p.visto))}</span>`, ' offline')).join('') : '');
    if (focado) box.querySelector(`[data-chave="${CSS.escape(focado)}"]`)?.focus({ preventScroll: true });
    if (MM.el && !MM.form) desenharMenuMembro(true); // a pessoa pode ter entrado ou saído com o menu aberto
  }

  // ----- Menu de uma pessoa da lista: mencionar, volume e, para admins, moderar -----
  const MM = { el: null };
  function pessoaDoMenu() {
    const u = MM.pid ? S.users.find((x) => x.pid === MM.pid) : userById(MM.uid);
    const p = MM.pid ? S.perfis?.[MM.pid] : null;
    return { u, p, nome: u?.name || p?.nome || '?', cor: u?.color || p?.cor || '#8a94a6', eu: (u && u.id === S.myId) || (!!MM.pid && MM.pid === S.myPid) };
  }
  function fecharMenuMembro(devolverFoco) {
    if (!MM.el) return;
    MM.el.remove();
    MM.el = null;
    if (devolverFoco) $(`#members [data-chave="${CSS.escape(MM.chave)}"]`)?.focus();
  }
  function abrirMenuMembro(row, ponto) {
    fecharMenuMembro();
    const el = document.createElement('div');
    el.className = 'menu-membro';
    el.id = 'menuMembro';
    el.setAttribute('role', 'menu');
    Object.assign(MM, { el, chave: row.dataset.chave, uid: row.dataset.uid || null, pid: row.dataset.pid || null, ponto, info: null, form: null, codigo: null });
    el.setAttribute('aria-label', `Opções de ${pessoaDoMenu().nome}`);
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('[data-mm]');
      if (b && !b.disabled) acaoDoMenu(b.dataset.mm, b);
    });
    el.addEventListener('keydown', teclaNoMenu);
    desenharMenuMembro();
    el.querySelector('button, input')?.focus();
    const { eu } = pessoaDoMenu();
    if (S.isAdmin && MM.pid && !eu) {
      adm('perfil-info', { pid: MM.pid }).then((x) => { if (MM.el === el) { MM.info = x; if (!MM.form) desenharMenuMembro(true); } }).catch(() => {});
    }
  }
  function posicionarMenuMembro() {
    const el = MM.el;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x;
    let y;
    if (MM.ponto) {
      x = MM.ponto.x;
      y = MM.ponto.y;
    } else {
      const row = $(`#members [data-chave="${CSS.escape(MM.chave)}"]`);
      const r = (row || $('#members')).getBoundingClientRect();
      // ao lado da lista (que fica na direita); se não couber, embaixo do nome
      x = r.left - w - 8;
      y = r.top;
      if (x < 8) { x = r.left; y = r.bottom + 4; }
    }
    el.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, x))}px`;
    el.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, y))}px`;
  }
  function desenharMenuMembro(manterFoco) {
    const el = MM.el;
    if (!el) return;
    const focoAntes = manterFoco ? document.activeElement?.closest?.('#menuMembro [data-mm]')?.dataset.mm : null;
    const { u, p, nome, cor, eu } = pessoaDoMenu();
    if (!u && !p) return fecharMenuMembro();
    const item = (act, txt, cls = '') => `<button type="button" role="menuitem" class="mm-item${cls}" data-mm="${act}">${txt}</button>`;
    const status = u ? (u.live ? `Transmitindo em ${esc(nomeSala(u.sala))}` : u.sala ? `Em ${esc(nomeSala(u.sala))}` : 'Online') : esc(offlineHa(p.visto));
    let corpo;
    if (MM.form) corpo = formDoMenu(MM.form, { u, nome });
    else {
      const itens = [];
      if (eu) itens.push(item('perfil', 'Mudar meu nome ou cor'));
      else itens.push(item('mencionar', 'Mencionar no chat'));
      if (u && !eu && S.sala && u.sala === S.sala) itens.push(item('volume', 'Volume da voz e dos sons'));
      if (S.isAdmin && !eu) {
        const silenciado = u ? u.silenciado : MM.info?.silenciado > Date.now();
        itens.push('<div class="mm-sep" role="separator">Moderar</div>');
        itens.push(silenciado ? item('tirar-silencio', 'Tirar silêncio') : item('form:silenciar', 'Silenciar…'));
        if (u?.live) itens.push(item('parar', 'Parar transmissão'));
        if (u?.sala) itens.push(item('tirar-sala', 'Tirar da sala'));
        itens.push(item('form:renomear', 'Renomear…'));
        if (MM.pid) itens.push(item('codigo', 'Gerar código de acesso'));
        if (u) itens.push(item('admin', u.admin ? 'Tirar admin' : 'Dar admin'));
        if (!u && MM.info?.aparelhos) itens.push(item('form:esquecer', 'Esquecer aparelhos…', ' aviso'));
        if (!u) itens.push(item('form:ocultar', 'Tirar da lista…', ' aviso'));
        if (u) itens.push(item('form:expulsar', 'Expulsar…', ' aviso'));
        itens.push(item('form:banir', 'Banir…', ' perigo'));
      }
      corpo = itens.join('');
    }
    el.innerHTML = `<div class="mm-topo">${avatar({ name: nome, color: cor }, u ? 'dotted' : 'mm-off')}<div class="mm-quem"><strong class="ellipsis" style="color:${esc(cor)}">${esc(nome)}</strong><span class="ellipsis">${status}</span></div></div>${corpo}`;
    posicionarMenuMembro();
    if (focoAntes) (el.querySelector(`[data-mm="${CSS.escape(focoAntes)}"]`) || el.querySelector('button'))?.focus();
  }
  function formDoMenu(tipo, { u, nome }) {
    const n = `<b>${esc(nome)}</b>`;
    const voltar = '<button type="button" class="btn sm ghost" data-mm="voltar">Voltar</button>';
    const motivo = '<input class="mm-input" id="mmMotivo" maxlength="200" placeholder="Motivo (opcional)" aria-label="Motivo">';
    switch (tipo) {
      case 'silenciar':
        return `<div class="mm-form"><p>Silenciar ${n} no chat e na voz${u ? '' : ' (vale quando entrar)'}:</p><div class="mm-tempos">
          ${[[5, '5 min'], [15, '15 min'], [60, '1 hora'], [1440, '1 dia'], [0, 'Até eu tirar']].map(([m, t]) => `<button type="button" class="btn sm" data-mm="silenciar:${m}">${t}</button>`).join('')}
          </div><div class="mm-botoes">${voltar}</div></div>`;
      case 'renomear':
        return `<div class="mm-form"><p>Novo nome para ${n}:</p><input class="mm-input" id="mmNome" maxlength="32" value="${esc(nome)}" aria-label="Novo nome">
          <div class="mm-botoes">${voltar}<button type="button" class="btn sm primary" data-mm="renomear" data-principal>Salvar</button></div></div>`;
      case 'expulsar':
        return `<div class="mm-form"><p>Expulsar ${n}? Sai na hora, mas pode entrar de novo.</p>${motivo}
          <div class="mm-botoes">${voltar}<button type="button" class="btn sm warn" data-mm="expulsar" data-principal>Expulsar</button></div></div>`;
      case 'banir':
        return `<div class="mm-form"><p>Banir ${n}? ${u ? 'Bloqueia o IP e este navegador' : 'Bloqueia o nome e os aparelhos que ele já usou'} até você desbanir (aba Banidos).</p>${motivo}
          <div class="mm-botoes">${voltar}<button type="button" class="btn sm danger" data-mm="banir" data-principal>Banir</button></div></div>`;
      case 'esquecer':
        return `<div class="mm-form"><p>Esquecer os aparelhos de ${n}? Para entrar de novo, vai precisar de um código de acesso.</p>
          <div class="mm-botoes">${voltar}<button type="button" class="btn sm warn" data-mm="esquecer" data-principal>Esquecer</button></div></div>`;
      case 'ocultar':
        return `<div class="mm-form"><p>Tirar ${n} da lista de offline? O nome continua guardado e volta para a lista quando a pessoa entrar de novo.</p>
          <div class="mm-botoes">${voltar}<button type="button" class="btn sm warn" data-mm="ocultar" data-principal>Tirar da lista</button></div></div>`;
      case 'codigo':
        return `<div class="mm-form"><p>Código de acesso de ${n}:</p><div class="mm-codigo">${esc(MM.codigo.codigo)}</div>
          <p class="mm-dica">Vale até ${hhmm(new Date(MM.codigo.ate))}. Na tela de entrada, a pessoa clica em "Já tenho um nome".</p>
          <div class="mm-botoes"><button type="button" class="btn sm ghost" data-mm="fechar">Fechar</button><button type="button" class="btn sm primary" data-mm="copiar" data-principal>Copiar</button></div></div>`;
      default:
        return '';
    }
  }
  function mencionarNoChat(nome) {
    const input = $('#msgInput');
    if (!input || input.disabled || input.closest('[hidden]')) return;
    const v = input.value;
    const pos = input.selectionEnd ?? v.length;
    const antes = v.slice(0, pos);
    const texto = `${antes && !/\s$/.test(antes) ? ' ' : ''}@${nome} `;
    input.value = antes + texto + v.slice(pos);
    input.focus();
    input.setSelectionRange(pos + texto.length, pos + texto.length);
    autoAltura();
  }
  async function acaoDoMenu(act, botao) {
    const { u, nome } = pessoaDoMenu();
    const pid = MM.pid;
    if (act.startsWith('form:')) {
      MM.form = act.slice(5);
      desenharMenuMembro();
      const campo = MM.el.querySelector('.mm-input');
      if (campo) { campo.focus(); campo.select?.(); } else MM.el.querySelector('.mm-form button:not([data-mm="voltar"])')?.focus();
      return;
    }
    if (act === 'voltar') { MM.form = null; desenharMenuMembro(); MM.el.querySelector('button')?.focus(); return; }
    if (act === 'fechar') return fecharMenuMembro(true);
    if (act === 'mencionar') { fecharMenuMembro(); return mencionarNoChat(nome); }
    if (act === 'perfil') { fecharMenuMembro(); return $('#meInfo').click(); }
    if (act === 'volume') {
      const row = $(`#members [data-chave="${CSS.escape(MM.chave)}"]`);
      fecharMenuMembro();
      return u && row && abrirVolumeDaVoz(u.id, row);
    }
    if (act === 'copiar') {
      try { await navigator.clipboard.writeText(MM.codigo.codigo); toast('Código copiado.'); } catch { toast('Não deu para copiar. Selecione o código e copie.'); }
      return;
    }
    const valor = (id) => MM.el.querySelector(`#${id}`)?.value.trim() || '';
    botao.disabled = true;
    try {
      let msg = '';
      if (act.startsWith('silenciar:')) {
        const minutes = Number(act.split(':')[1]);
        if (u) await adm('mute', { uid: u.id, minutes }); else await adm('perfil-silenciar', { pid, minutes });
        msg = `${nome} foi silenciado${minutes ? ` por ${minutes >= 1440 ? '1 dia' : minutes >= 60 ? '1 hora' : `${minutes} min`}` : ''}.`;
      } else if (act === 'tirar-silencio') {
        if (u) await adm('unmute', { uid: u.id }); else await adm('perfil-tirar-silencio', { pid });
        msg = `${nome} não está mais silenciado.`;
      } else if (act === 'parar') {
        await adm('stop-stream', { uid: u.id });
        msg = `A transmissão de ${nome} foi parada.`;
      } else if (act === 'tirar-sala') {
        await adm('remove-sala', { uid: u.id });
        msg = `${nome} saiu da sala.`;
      } else if (act === 'admin') {
        const r = await adm('toggle-admin', { uid: u.id });
        msg = r.admin ? `${nome} agora é admin.` : `${nome} não é mais admin.`;
      } else if (act === 'renomear') {
        const novo = valor('mmNome');
        if (!novo) throw new Error('Escreva o nome novo.');
        if (pid) await adm('perfil-renomear', { pid, nome: novo }); else await adm('rename-user', { uid: u.id, name: novo });
        msg = `Agora é ${novo}.`;
      } else if (act === 'codigo') {
        MM.codigo = await adm('perfil-codigo', { pid });
        MM.form = 'codigo';
        desenharMenuMembro();
        MM.el.querySelector('[data-principal]')?.focus();
        return;
      } else if (act === 'expulsar') {
        await adm('kick', { uid: u.id, reason: valor('mmMotivo') });
        msg = `${nome} foi expulso.`;
      } else if (act === 'banir') {
        if (u) await adm('ban', { uid: u.id, reason: valor('mmMotivo') }); else await adm('perfil-banir', { pid, reason: valor('mmMotivo') });
        msg = `${nome} foi banido.`;
      } else if (act === 'esquecer') {
        await adm('perfil-esquecer-aparelhos', { pid });
        msg = `Os aparelhos de ${nome} foram esquecidos.`;
      } else if (act === 'ocultar') {
        await adm('perfil-ocultar', { pid });
        msg = `${nome} saiu da lista.`;
      }
      fecharMenuMembro(true);
      if (msg) toast(msg);
    } catch (e) {
      toast(e.message);
      if (botao.isConnected) botao.disabled = false;
    }
  }
  function teclaNoMenu(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return fecharMenuMembro(true); }
    if (e.key === 'Enter' && e.target.matches('.mm-input')) { e.preventDefault(); return MM.el.querySelector('[data-principal]')?.click(); }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const itens = [...MM.el.querySelectorAll('button:not(:disabled), .mm-input')];
    if (!itens.length) return;
    e.preventDefault();
    const i = itens.indexOf(document.activeElement);
    itens[(i + (e.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length].focus();
  }

  function renderPaineis() {
    const me = { name: S.myName, color: S.myColor };
    $('#meAvatar').outerHTML = avatar(me, 'dotted').replace('class="avatar', 'id="meAvatar" class="avatar');
    $('#meName').textContent = S.myName;
    $('#meStatus').textContent = S.live ? 'Transmitindo' : S.sala ? `Em ${nomeSala(S.sala)}` : S.isAdmin ? 'Online · Admin' : 'Online';

    // o painel de voz fica sempre à vista: fora de uma sala, só com o microfone e o som
    // (o que for escolhido aqui já vale quando a pessoa entrar)
    const vp = $('#voicePanel');
    vp.hidden = false;
    vp.classList.toggle('fora', !S.sala);
    for (const sel of ['#vpShare', '#vpLeave']) $(sel).hidden = !S.sala;
    $('#vpInfo').title = S.sala ? 'Voltar para a sala' : '';
    const st = $('#vpStatus');
    if (!S.sala) {
      st.classList.remove('live');
      st.textContent = 'Fora da sala';
      $('#vpWhere').textContent = 'vale ao entrar';
      $('#vpSwap').hidden = true;
    }
    if (S.sala) {
      st.classList.toggle('live', S.live);
      st.textContent = S.live ? '● Ao vivo' : 'Conectado à sala';
      $('#vpWhere').textContent = `${nomeSala(S.sala)} / ${S.serverName}`;
      const sb = $('#vpShare');
      sb.innerHTML = icon(S.live ? 'screenOff' : 'screen');
      sb.title = S.live ? 'Parar transmissão' : 'Compartilhar tela';
      sb.classList.toggle('active', S.live);
      $('#vpSwap').hidden = !S.live;
      if ($('#vpRede').hidden) {
        mostrarRede({ nivel: null, ms: null, linhas: ['Medindo…'] });
        setTimeout(() => medirRede().catch(() => {}), 400);
      }
    } else {
      $('#vpRede').hidden = true;
    }
    renderVoz();
  }

  // ================= Palco (salas de tela) =================
  function renderPalco() {
    const c = chan(S.view);
    if (!c || c.type !== 'sala') return;
    const naSala = S.sala === c.id;
    const pessoas = S.users.filter((u) => u.sala === c.id);
    $('#stagePeople').innerHTML = pessoas.map((u) => `<div class="person-chip"${u.id !== S.myId ? ` data-pessoa="${esc(u.id)}" title="Volume da voz de ${esc(u.name)}"` : ''}>${avatarVoz(u)}<span>${esc(u.name)}${u.id === S.myId ? ' (você)' : ''}</span>${coroa(u)}${vozIcones(u)}${u.live ? '<span class="live-badge">ao vivo</span>' : ''}</div>`).join('');

    const vivos = naSala ? pessoas.filter((u) => u.live) : [];
    sincronizarTiles(vivos.map((u) => u.id));
    // Com vídeo na tela, os painéis param de desfocar o fundo: a placa de vídeo refazia o
    // desfoque a cada quadro e o vídeo (e a captura de quem transmite) caía pela metade
    document.body.classList.toggle('com-video', S.tiles.size > 0);
    $('#stageGrid').hidden = vivos.length === 0;

    const vazio = $('#stageEmpty');
    vazio.hidden = vivos.length > 0;
    if (!naSala) {
      const n = pessoas.length;
      const transmitindo = pessoas.filter((u) => u.live).length;
      vazio.innerHTML = `<div><div class="big">${icon('screen')}</div><h2>${esc(c.name)}</h2>
        <p>${n ? `${plural(n, 'pessoa', 'pessoas')} aqui${transmitindo ? `, ${transmitindo} transmitindo` : ''}. ` : 'Ninguém aqui ainda. '}Entre na sala para assistir às transmissões ou mostrar a sua tela.</p></div>`;
    } else {
      vazio.innerHTML = `<div><div class="big">${icon('screen')}</div><h2>Ninguém está transmitindo</h2>
        <p>Clique em <b>Compartilhar tela</b> para mostrar uma janela, uma aba ou a tela inteira para quem estiver na sala. Quer que ouçam o som? Na janela de escolha, ligue a opção de áudio do aplicativo ou da guia.</p></div>`;
    }

    $('#joinBtn').hidden = naSala;
    $('#joinBtn').innerHTML = `${icon('screen')} Entrar na sala`;
    $('#shareBtn').hidden = !naSala;
    $('#leaveBtn').hidden = !naSala;
    $('#leaveBtn').innerHTML = `${icon('logout')} Sair da sala`;
    $('#ajustesBtn').hidden = !naSala;
    $('#sonsBtn').hidden = !naSala;
    $('#micBtn').hidden = !naSala;
    $('#surdoBtn').hidden = !naSala;
    $('#vozOpcoesBtn').hidden = !naSala;
    if (!naSala) { $('#ajustesPanel').hidden = true; $('#sonsPanel').hidden = true; }
    $('#canetaBtn').hidden = !(naSala && S.live);
    if (!S.live) $('#canetaPanel').hidden = true;
    renderCanetaBtn();
    if (!$('#sonsPanel').hidden) avisoSons();
    $('#sendVolWrap').hidden = !(naSala && S.live && S.envio && S.audioCaptado);
    const sw = $('#swapBtn');
    sw.hidden = !(naSala && S.live);
    sw.disabled = !!S.trocando;
    sw.innerHTML = `${icon('swap')} ${S.trocando ? 'Escolhendo…' : 'Trocar tela'}`;
    $('#sendVol').value = String(S.volEnvio);
    $('#sendVolPct').textContent = `${Math.round(S.volEnvio * 100)}%`;
    $('#somSelect').disabled = S.live;
    $('#somSelect').title = S.live ? 'Para mudar o som, pare e comece a transmissão de novo' : '';
    const sb = $('#shareBtn');
    sb.innerHTML = S.live ? `${icon('screenOff')} Parar transmissão` : `${icon('screen')} Compartilhar tela`;
    sb.classList.toggle('primary', !S.live);
  }

  // Os controles de baixo (volume, caneta, tela cheia...) e os emotes ficam escondidos e só
  // aparecem quando o cursor chega perto deles; parado, eles se recolhem em uns segundos.
  // No toque, qualquer toque no vídeo mostra.
  function mexeuNoTile(t, e) {
    t.ponteiro = e.pointerType === 'touch' ? null : { x: e.clientX, y: e.clientY };
    const r = t.el.getBoundingClientRect();
    const zona = Math.min(150, r.height * 0.5);
    if (e.pointerType !== 'touch' && e.clientY < r.bottom - zona) return; // longe deles: deixa recolher
    t.el.classList.add('show-ctrl');
    recolherControles(t, e.pointerType === 'touch' ? 4000 : 2500);
  }
  function recolherControles(t, ms) {
    clearTimeout(t.ctrlTimer);
    t.ctrlTimer = setTimeout(() => {
      // com o cursor em cima de um botão ou emote (ou arrastando o volume), espera mais um pouco
      if (t.focoTeclado || cursorEmCimaDeBotao(t) || t.el.querySelector('input[type=range]:active')) return recolherControles(t, 1200);
      t.el.classList.remove('show-ctrl');
    }, ms);
  }
  // pela posição do cursor (o :hover do navegador às vezes não percebe um botão que acabou de aparecer)
  function cursorEmCimaDeBotao(t) {
    const p = t.ponteiro;
    if (!p) return false;
    for (const b of t.el.querySelectorAll('.t-bottom button, .t-bottom input, .t-reacao, .t-ver-emotes')) {
      const r = b.getBoundingClientRect();
      if (r.width && p.x >= r.left - 3 && p.x <= r.right + 3 && p.y >= r.top - 3 && p.y <= r.bottom + 3) return true;
    }
    return false;
  }

  function criarTile(uid) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.uid = uid;
    el.innerHTML = `<video autoplay playsinline muted></video>
      <canvas class="t-tinta" aria-hidden="true"></canvas>
      <div class="t-emotes" aria-hidden="true"></div>
      <div class="t-cores" hidden></div>
      <div class="t-top"><span class="live-badge">ao vivo</span><span class="t-state"></span><span class="t-qual" hidden></span></div>
      <button class="unmute-hint" data-act="center" hidden></button>
      ${barraDeReacoes()}
      <div class="t-bottom">
        <span class="t-voz" role="group" aria-label="Sua voz na sala">
          <button class="icon-btn" data-act="voz-mic"></button>
          <button class="icon-btn" data-act="voz-surdo"></button>
        </span>
        <span class="t-name"></span>
        <button class="icon-btn" data-act="mute" title="Ligar/desligar som"></button>
        <input type="range" min="0" max="2" step="0.05" value="1" data-act="vol" title="Volume desta transmissão (até 200%)">
        <span class="vol-pct">100%</span>
        <button class="icon-btn t-caneta" data-act="caneta" title="Caneta: desenhar na tela de quem transmite" hidden>${icon('caneta')}</button>
        <button class="icon-btn" data-act="pip" title="Janela flutuante (picture-in-picture)">${icon('pip')}</button>
        <button class="icon-btn" data-act="focus"></button>
        <button class="icon-btn" data-act="full" title="Tela cheia">${icon('full')}</button>
      </div>`;
    const t = { el, uid, video: el.querySelector('video'), tinta: el.querySelector('.t-tinta'), userMuted: false, autoMuted: false, src: null, gain: null, audioId: null };
    S.tiles.set(uid, t);
    definirSaida(t.video);
    vozNoTile(t);
    // barra de baixo e emotes: aparecem com o cursor perto deles e se recolhem sozinhos
    el.addEventListener('pointermove', (e) => mexeuNoTile(t, e));
    el.addEventListener('pointerdown', (e) => mexeuNoTile(t, e));
    el.addEventListener('pointerleave', () => { t.ponteiro = null; recolherControles(t, 600); });
    // pelo teclado: só quando chegou no botão com Tab (um botão clicado com o mouse continua
    // com foco, e qualquer tecla apertada depois, como a de falar, não pode prender a barra)
    el.addEventListener('focusin', (e) => {
      t.focoTeclado = e.target.matches(':focus-visible');
      if (t.focoTeclado) { t.el.classList.add('show-ctrl'); clearTimeout(t.ctrlTimer); }
    });
    el.addEventListener('focusout', () => {
      if (!t.focoTeclado) return;
      t.focoTeclado = false;
      recolherControles(t, 1500);
    });
    t.tinta.addEventListener('pointerdown', (e) => comecarTraco(t, e));
    t.tinta.addEventListener('pointermove', (e) => continuarTraco(t, e));
    for (const fim of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      t.tinta.addEventListener(fim, (e) => { if (CANETA.traco?.sid === t.uid && e.pointerId === CANETA.traco.ponteiro) terminarTraco(); });
    }
    atualizarBotaoCaneta(t);
    return t;
  }

  // ================= Volume =================
  // O som de cada transmissão passa por um "ganho" do Web Audio: dá para ir de 0% a 200%.
  const volumes = salvo.volumes && typeof salvo.volumes === 'object' ? salvo.volumes : {};
  function volumeDe(uid) {
    const u = userById(uid);
    const v = u ? volumes[u.name] : undefined;
    return typeof v === 'number' ? Math.min(2, Math.max(0, v)) : 1;
  }
  function guardarVolume(uid, v) {
    const u = userById(uid);
    if (!u) return;
    volumes[u.name] = v;
    salvar({ volumes });
  }
  function audioCtx() {
    if (!actx) {
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
      try { definirSaidaDoAudio(actx); } catch { /* ainda carregando */ }
    }
    return actx;
  }
  // Os navegadores só liberam o áudio depois de um clique ou tecla na página
  function destravarAudio() {
    const c = audioCtx();
    if (c && c.state === 'suspended') {
      c.resume().then(() => { for (const t of S.tiles.values()) atualizarTile(t.uid); }).catch(() => {});
    }
  }
  document.addEventListener('pointerdown', destravarAudio, true);
  document.addEventListener('keydown', destravarAudio, true);

  function ligarAudio(t, stream) {
    const at = stream ? stream.getAudioTracks()[0] : null;
    const id = at ? at.id : null;
    if (t.audioId === id) return;
    desligarAudio(t);
    t.audioId = id;
    if (!at) return;
    const c = audioCtx();
    if (!c || !c.createMediaStreamSource) return;
    try {
      t.src = c.createMediaStreamSource(new MediaStream([at]));
      t.gain = c.createGain();
      t.src.connect(t.gain).connect(c.destination);
    } catch {
      desligarAudio(t);
      t.audioId = id;
    }
  }
  function desligarAudio(t) {
    try { t.src?.disconnect(); } catch { /* ok */ }
    try { t.gain?.disconnect(); } catch { /* ok */ }
    t.src = null;
    t.gain = null;
    t.audioId = null;
  }
  function aplicarVolume(t) {
    if (t.uid === S.myId) {
      t.video.muted = true;
      return;
    }
    const v = volumeDe(t.uid);
    const mudo = t.userMuted || S.evitarEco || VOZ.surdo;
    if (t.gain) {
      t.video.muted = true; // o som sai pelo Web Audio, não pelo vídeo
      t.gain.gain.setTargetAtTime(mudo ? 0 : v, t.gain.context.currentTime, 0.02);
    } else {
      t.video.volume = Math.min(1, v);
      t.video.muted = mudo || t.autoMuted;
    }
  }
  const audioTravado = (t) => (t.gain ? t.gain.context.state !== 'running' : t.autoMuted);

  // Volume do som que EU mando (quem transmite ajusta para todo mundo)
  async function prepararEnvio(stream) {
    S.envio = null;
    const at = S.som === 'nenhum' ? null : stream.getAudioTracks()[0]; // no "Sem som", a faixa leva só a soundboard
    const c = audioCtx();
    if (!c || !c.createMediaStreamDestination) return stream;
    try {
      if (c.state !== 'running') await Promise.race([c.resume(), new Promise((ok) => setTimeout(ok, 1500))]);
      if (c.state !== 'running') return stream; // áudio ainda travado: manda o som original
      // A faixa de som enviada existe mesmo sem som agora: assim, ao trocar de tela,
      // dá para passar a mandar som sem refazer as conexões.
      const gain = c.createGain();
      gain.gain.value = S.volEnvio;
      const dest = c.createMediaStreamDestination();
      gain.connect(dest);
      let src = null;
      if (at) {
        src = c.createMediaStreamSource(new MediaStream([at]));
        src.connect(gain);
      }
      S.envio = { src, gain, dest };
      return new MediaStream([...stream.getVideoTracks(), dest.stream.getAudioTracks()[0]]);
    } catch {
      S.envio = null;
      return stream;
    }
  }
  function encerrarEnvio() {
    if (!S.envio) return;
    try { S.envio.src?.disconnect(); S.envio.gain.disconnect(); } catch { /* ok */ }
    S.envio.dest.stream.getTracks().forEach((t) => t.stop());
    S.envio = null;
  }


  function sincronizarTiles(ids) {
    const grid = $('#stageGrid');
    let thumbs = grid.querySelector('.thumbs');
    if (!thumbs) {
      thumbs = document.createElement('div');
      thumbs.className = 'thumbs';
      grid.appendChild(thumbs);
    }
    for (const [uid, t] of S.tiles) {
      if (!ids.includes(uid)) {
        if (document.pictureInPictureElement === t.video) document.exitPictureInPicture().catch(() => {});
        if (CANETA.ativa === uid) sairDaCaneta();
        CANETA.tintas.delete(uid);
        desligarAudio(t);
        t.video.srcObject = null;
        clearTimeout(t.ctrlTimer);
        t.el.remove();
        S.tiles.delete(uid);
      }
    }
    if (S.focus && !ids.includes(S.focus)) S.focus = null;
    ids = [...ids].sort((a, b) => (a === S.myId) - (b === S.myId)); // os outros primeiro, você por último
    for (const uid of ids) {
      const t = S.tiles.get(uid) || criarTile(uid);
      const focado = uid === S.focus;
      t.el.classList.toggle('focused', focado);
      if (focado) {
        if (t.el.parentNode !== grid) grid.insertBefore(t.el, thumbs);
      } else if (t.el.parentNode !== thumbs) {
        thumbs.appendChild(t.el);
      }
      atualizarTile(uid);
    }
    const n = ids.length;
    grid.className = 'stage-grid ' + (S.focus ? 'focus' : n <= 1 ? 'n1' : n === 2 ? 'n2' : n <= 4 ? 'n4' : 'nmany');
    for (const t of S.tiles.values()) {
      if (t.video.srcObject && t.video.paused) t.video.play().catch(() => {});
    }
  }

  function tocarTile(t) {
    const v = t.video;
    aplicarVolume(t);
    v.play().catch(() => {
      if (t.uid === S.myId || t.gain) return;
      // O navegador bloqueou o som automático: toca mudo e mostra o botão "clique para ouvir"
      v.muted = true;
      t.autoMuted = true;
      v.play().catch(() => {});
      atualizarTile(t.uid);
    });
  }

  function aplicarMudoEco() {
    for (const t of S.tiles.values()) {
      if (t.uid === S.myId) continue;
      aplicarVolume(t);
      atualizarTile(t.uid);
    }
  }

  function atualizarTile(uid) {
    const t = S.tiles.get(uid);
    if (!t) return;
    const self = uid === S.myId;
    const u = userById(uid);
    t.el.querySelector('.t-name').textContent = self ? 'Você (sua transmissão)' : u ? u.name : '';
    const c = S.inc.get(uid);
    const stream = self ? S.localStream : c?.stream || null;
    if (!self) ligarAudio(t, stream);
    if (t.video.srcObject !== stream) {
      t.video.srcObject = stream;
      if (stream) tocarTile(t);
    } else {
      aplicarVolume(t);
    }

    let estado = '';
    let falhou = false;
    if (self) {
      const n = [...S.out.values()].filter((x) => x.pc.connectionState === 'connected').length;
      const q = QUALIDADES[S.quality];
      const fatia = ORC.porPessoa || fatiaPorPessoa();
      const ql = QTX.sessao?.ultimo;
      estado = S.retomando ? 'A janela capturada sumiu: tentando pegar de novo…' : n
        ? `${plural(n, 'pessoa assistindo', 'pessoas assistindo')}, ${mbps(fatia)} Mbps para cada${fatia < q.br * 0.85 ? ' (qualidade ajustada ao seu upload)' : ''}`
          + (ql ? ` · saindo em ${ql.altura}p ${ql.fps} fps${ql.captura !== null && ql.captura !== undefined ? ` (captura: ${ql.captura} fps)` : ''}${ql.motivo === 'cpu' ? ' · computador pesado' : ql.motivo === 'bandwidth' ? ' · internet apertada' : ''}` : '')
        : 'Ninguém assistindo ainda';
    } else if (!c || c.state === 'new' || c.state === 'connecting') {
      estado = 'Conectando…';
    } else if (c.state === 'failed') {
      estado = c.gaveUp ? 'Não foi possível conectar' : 'Tentando de novo…';
      falhou = !!c.gaveUp;
    } else if (c.state === 'disconnected') {
      estado = 'Reconectando…';
    } else if (!stream) {
      estado = 'Carregando…';
    } else if (S.evitarEco && stream.getAudioTracks().length) {
      estado = 'Som pausado para não dar eco';
    }
    t.el.querySelector('.t-state').textContent = estado;
    atualizarBotaoCaneta(t);

    const temAudio = !self && !!stream && stream.getAudioTracks().length > 0;
    const centro = t.el.querySelector('[data-act=center]');
    if (falhou) {
      centro.hidden = false;
      centro.dataset.mode = 'retry';
      centro.innerHTML = `${icon('retry')} Tentar de novo`;
    } else if (temAudio && audioTravado(t) && !S.evitarEco && !t.userMuted) {
      centro.hidden = false;
      centro.dataset.mode = 'unmute';
      centro.innerHTML = `${icon('mute')} Clique para ouvir`;
    } else {
      centro.hidden = true;
    }
    const vol = volumeDe(uid);
    const semSom = t.userMuted || S.evitarEco || vol === 0 || audioTravado(t);
    const mute = t.el.querySelector('[data-act=mute]');
    mute.hidden = !temAudio;
    mute.innerHTML = icon(semSom ? 'mute' : 'vol');
    const range = t.el.querySelector('[data-act=vol]');
    range.hidden = !temAudio;
    range.max = t.gain ? '2' : '1';
    if (document.activeElement !== range) range.value = String(Math.min(vol, Number(range.max)));
    const pct = t.el.querySelector('.vol-pct');
    pct.hidden = !temAudio;
    pct.textContent = t.userMuted || S.evitarEco ? 'mudo' : `${Math.round(Math.min(vol, Number(range.max)) * 100)}%`;
    t.el.querySelector('[data-act=pip]').hidden = !document.pictureInPictureEnabled;
    const fb = t.el.querySelector('[data-act=focus]');
    fb.innerHTML = icon(S.focus === uid ? 'unfocus' : 'focus');
    fb.title = S.focus === uid ? 'Voltar para a grade' : 'Destacar';
  }

  $('#stageGrid').addEventListener('click', (e) => {
    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;
    const uid = tileEl.dataset.uid;
    const t = S.tiles.get(uid);
    const act = e.target.closest('[data-act]')?.dataset.act;
    const v = t.video;
    if (act === 'vol') return;
    if (act === 'emote') return reagir(uid, Number(e.target.closest('[data-emote]').dataset.emote));
    if (act === 'ver-emotes') return alternarVerEmotes();
    if (act === 'voz-mic') return alternarMudo(); // microfone e mutar a sala, dentro da tela cheia
    if (act === 'voz-surdo') return alternarSurdo();
    if (e.target.closest('.t-reacoes')) return; // clique entre os emotes não muda o destaque
    if (act === 'caneta') return alternarCaneta(uid);
    if (act === 'cor') return escolherCor(Number(e.target.closest('[data-cor]').dataset.cor));
    if (act === 'sair-caneta') return sairDaCaneta();
    if (!act && tileEl.classList.contains('desenhando')) return; // clique de desenho não muda o destaque
    if (act === 'center') {
      if (e.target.closest('[data-act]').dataset.mode === 'retry') {
        S.tries.set(uid, 0);
        assistir(uid);
      } else {
        t.autoMuted = false;
        t.userMuted = false;
        destravarAudio();
        aplicarVolume(t);
        v.play().catch(() => {});
      }
    } else if (act === 'mute' && S.evitarEco) {
      toast('Enquanto você manda o som do PC inteiro, o som das outras transmissões fica pausado. Se não, ele volta para elas.', 6000);
    } else if (act === 'mute') {
      t.userMuted = !t.userMuted;
      t.autoMuted = false;
      if (!t.userMuted && volumeDe(uid) === 0) guardarVolume(uid, 1);
      aplicarVolume(t);
    } else if (act === 'pip') {
      if (document.pictureInPictureElement === v) document.exitPictureInPicture().catch(() => {});
      else v.requestPictureInPicture().catch((err) => toast('Não deu para abrir a janela flutuante: ' + err.message));
    } else if (act === 'full') {
      telaCheia(tileEl);
    } else {
      // focus, ou clique no vídeo
      S.focus = S.focus === uid ? null : uid;
      renderPalco();
      return;
    }
    atualizarTile(uid);
  });
  $('#stageGrid').addEventListener('dblclick', (e) => {
    const tileEl = e.target.closest('.tile');
    if (tileEl && !e.target.closest('[data-act]') && !tileEl.classList.contains('desenhando')) telaCheia(tileEl);
  });
  $('#stageGrid').addEventListener('input', (e) => {
    if (e.target.dataset.act !== 'vol') return;
    const uid = e.target.closest('.tile').dataset.uid;
    const t = S.tiles.get(uid);
    const v = Number(e.target.value);
    guardarVolume(uid, v);
    if (v > 0) {
      t.userMuted = false;
      t.autoMuted = false;
    }
    aplicarVolume(t);
    atualizarTile(uid);
  });
  function telaCheia(el) {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.focus && !document.fullscreenElement && $('#modal').hidden && !P.aberto && !e.defaultPrevented) {
      S.focus = null;
      renderPalco();
    }
  });

  // ================= Entrar / sair de sala =================
  async function entrarNaSala(id) {
    if (S.sala === id) return;
    if (S.live) pararTransmissao(true, 'sala');
    for (const sid of [...S.inc.keys()]) fecharInc(sid);
    S.tries.clear();
    S.sala = id;
    S.focus = null;
    patchMe();
    blip('join');
    renderTudo();
    try {
      await api('state', { sala: id, live: false, ...estadoVoz() });
    } catch (e) {
      toast('Não foi possível entrar na sala: ' + e.message);
      sairDaSalaLocal();
      renderTudo();
      return;
    }
    sincronizarStreams();
    renderTudo();
    if (VOZ.mudo && !VOZ.dicaMudo) {
      VOZ.dicaMudo = true;
      toast('Seu microfone está desligado. Clique no microfone para falar.', 5000);
    }
  }

  function sairDaSalaLocal(motivo = 'sala') {
    if (S.live) pararTransmissao(true, motivo);
    for (const sid of [...S.inc.keys()]) fecharInc(sid);
    S.tries.clear();
    S.sala = null;
    S.focus = null;
    patchMe();
    fecharTodaVoz();
    definirPtt(false);
    atualizarMicrofone();
    sairDaCaneta();
    CANETA.tintas.clear();
  }

  function sairDaSala() {
    if (!S.sala) return;
    sairDaSalaLocal();
    blip('leave');
    api('state', { sala: null, live: false, ...estadoVoz() }).catch(() => {});
    renderTudo();
  }

  // ================= Compartilhar tela =================
  // Abre o seletor do navegador. Devolve o stream, ou null se a pessoa cancelou.
  async function capturarTela() {
    const q = QUALIDADES[S.quality];
    // "janela": só o som da aba/janela escolhida (chamadas de voz e outras transmissões não entram)
    // "pc": o som do computador inteiro (pode levar junto a voz de quem está numa chamada)
    const opcoes = {
      video: { width: { ideal: q.w }, height: { ideal: q.h }, frameRate: { ideal: q.fps, max: q.fps } },
      audio: S.som === 'nenhum' ? false : {
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
        suppressLocalAudioPlayback: false,
        restrictOwnAudio: true, // tira do som do PC o que esta própria página toca (as outras transmissões)
      },
      surfaceSwitching: 'include',
      selfBrowserSurface: 'exclude',
    };
    if (S.som === 'janela') {
      opcoes.systemAudio = 'exclude';
      opcoes.windowAudio = 'window';
    } else if (S.som === 'pc') {
      opcoes.systemAudio = 'include';
      opcoes.windowAudio = 'system';
    }
    // Se o navegador recusar alguma opção, tenta pedidos mais simples, mas SEMPRE
    // mantendo a regra do som escolhido (no modo sem eco, nunca oferecer o som do sistema).
    const regraSom = S.som === 'janela' ? { systemAudio: 'exclude', windowAudio: 'window' }
      : S.som === 'pc' ? { systemAudio: 'include', windowAudio: 'system' } : {};
    // No programa o seletor é dele, então vai um pedido só (sem repetir a janela de escolha)
    const tentativas = PROGRAMA ? [{ video: opcoes.video, audio: opcoes.audio }] : [opcoes];
    if (!PROGRAMA && opcoes.audio) tentativas.push({ ...opcoes, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    if (!PROGRAMA) {
      tentativas.push({ video: true, audio: S.som !== 'nenhum', ...regraSom });
      if (S.som === 'janela') {
        tentativas.push({ video: true, audio: true, systemAudio: 'exclude', windowAudio: 'exclude' }); // som só de aba
        tentativas.push({ video: true, audio: true, systemAudio: 'exclude' });
      } else {
        tentativas.push({ video: true, audio: S.som !== 'nenhum' });
      }
    }
    S.diagCaptura = { tentativa: 0, erros: [] };
    for (const [i, o] of tentativas.entries()) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia(o);
        S.diagCaptura.tentativa = i;
        if (PROGRAMA) await anexarSomDoPrograma(stream);
        return stream;
      } catch (e) {
        if (e.name === 'NotAllowedError' || e.name === 'AbortError') return null; // cancelou
        S.diagCaptura.erros.push(`${e.name}: ${e.message}`);
        console.warn(`O navegador recusou o pedido de captura ${i + 1}:`, e);
      }
    }
    throw new Error(S.diagCaptura.erros[S.diagCaptura.erros.length - 1] || 'o navegador recusou');
  }

  // ----- Programa para Windows: som de uma janela ou de um programa só -----
  // No seletor do programa a pessoa escolhe de onde vem o som. Se for de uma janela ou de um
  // programa, o som chega por um canal à parte e vira uma faixa de áudio normal aqui.
  const SOM_PROGRAMA = new WeakMap(); // faixa -> { nome, voz }
  const SEM_SOM_ESCOLHIDO = new WeakSet(); // streams sem som de propósito, ou cujo motivo já foi avisado
  let moduloSom = null;
  async function anexarSomDoPrograma(stream) {
    if (!PROGRAMA?.somDoPrograma || stream.getAudioTracks().length) return;
    const c = audioCtx();
    if (!c) return;
    let r = null;
    try { r = await PROGRAMA.somDoPrograma(c.sampleRate); } catch { r = null; }
    if (!r) return;
    if (r.modo === 'nenhum') { SEM_SOM_ESCOLHIDO.add(stream); return; }
    if (!r.ok) {
      if (r.erro) {
        toast(r.erro, 10000);
        SEM_SOM_ESCOLHIDO.add(stream); // o aviso certo já apareceu
      }
      return;
    }
    const soltar = () => PROGRAMA.pararSomDoPrograma(r.id).catch(() => {});
    try {
      moduloSom ||= c.audioWorklet.addModule('/som-programa.js');
      await moduloSom;
    } catch {
      moduloSom = null;
      soltar();
      toast('Não consegui preparar o som do programa. Tente de novo.');
      return;
    }
    if (c.state !== 'running') await c.resume().catch(() => {});
    const canal = new MessageChannel();
    const no = new AudioWorkletNode(c, 'som-do-programa', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
    no.port.postMessage({ porta: canal.port1 }, [canal.port1]);
    window.postMessage({ caras: 'porta-do-som' }, location.origin, [canal.port2]);
    const destino = c.createMediaStreamDestination();
    no.connect(destino);
    const faixa = destino.stream.getAudioTracks()[0];
    // Quando a faixa para (parar ou trocar a transmissão), o programa para de capturar
    const pararOriginal = faixa.stop.bind(faixa);
    faixa.stop = () => {
      pararOriginal();
      try { no.disconnect(); } catch { /* ok */ }
      soltar();
    };
    SOM_PROGRAMA.set(faixa, { nome: r.nome, voz: !!r.voz });
    stream.addTrack(faixa);
  }

  // Versão do motor Chromium (Chrome, Edge, Opera...). Só manda o som de UMA janela a partir da 141.
  function versaoChromium() {
    const m = navigator.userAgent.match(/Chrom(?:e|ium)\/(\d+)/);
    return m ? Number(m[1]) : 0;
  }
  const navegadorAntigo = () => { const v = versaoChromium(); return v > 0 && v < 141; };

  function prepararVideo(stream) {
    const vt = stream.getVideoTracks()[0];
    if (!vt) return;
    try { vt.contentHint = QUALIDADES[S.quality].hint; } catch { /* ok */ }
    // A captura acabou: no navegador, quase sempre é "Parar compartilhamento" na barra dele;
    // no programa, a janela ou tela capturada sumiu (o jogo fechou, trocou de modo de tela...)
    vt.addEventListener('ended', () => { if (S.localStream?.getVideoTracks()[0] === vt) capturaAcabou(vt); });
  }

  const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
  async function capturaAcabou(vt) {
    if (!S.live || S.retomando) return;
    const podeRetomar = typeof PROGRAMA?.retomarTela === 'function';
    if (PROGRAMA) anotarErro(`A captura da tela acabou sozinha (${podeRetomar ? 'tentando pegar de novo' : 'programa sem retomada'})`, 'transmissão');
    if (podeRetomar) {
      S.retomando = true;
      renderTudo();
      toast('A janela que você transmitia sumiu. Tentando pegar de novo…', 8000);
      // o jogo pode levar uns segundos para recriar a janela (troca de modo de tela, por exemplo)
      for (let i = 0; i < 8 && S.live && S.retomando; i++) {
        await esperar(i === 0 ? 400 : 1500);
        if (!S.live || !S.retomando) break;
        try {
          const r = await PROGRAMA.retomarTela();
          if (!r?.ok) break;
          const q = QUALIDADES[S.quality];
          const novo = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: q.w }, height: { ideal: q.h }, frameRate: { ideal: q.fps, max: q.fps } }, audio: false,
          });
          const nv = novo.getVideoTracks()[0];
          if (!nv || !S.live || !S.retomando) { novo.getTracks().forEach((t) => t.stop()); break; }
          await trocarSoAImagem(nv);
          S.retomando = false;
          renderTudo();
          toast('Pronto: a transmissão voltou.', 4000);
          return;
        } catch { /* a janela ainda não voltou: tenta de novo */ }
      }
      if (!S.retomando) return; // parou de transmitir enquanto tentava
      S.retomando = false;
    }
    if (!S.live) return;
    pararTransmissao(false, 'captura');
    toast(PROGRAMA
      ? 'A transmissão parou: a janela ou tela capturada deixou de existir. Isso acontece quando o jogo fecha, troca de modo de tela ou reinicia a imagem. Clique em Compartilhar para voltar.'
      : 'A transmissão parou: a janela ou aba capturada foi fechada, ou você clicou em "Parar compartilhamento" do navegador.', 12000);
  }

  // Troca só a imagem (o som continua o mesmo), sem derrubar quem está assistindo
  async function trocarSoAImagem(nv) {
    const velho = S.localStream;
    const audios = velho ? velho.getAudioTracks().filter((t) => t.readyState === 'live') : [];
    const novo = new MediaStream([nv, ...audios]);
    prepararVideo(novo);
    S.sendStream = S.envio ? new MediaStream([nv, S.envio.dest.stream.getAudioTracks()[0]]) : novo;
    for (const [vid, c] of S.out) {
      try {
        for (const tr of c.pc.getTransceivers()) {
          if (tr.currentDirection !== 'stopped' && tr.receiver.track.kind === 'video') await tr.sender.replaceTrack(nv);
        }
      } catch {
        fecharOut(vid);
        sinal(vid, { k: 'restart' });
      }
    }
    S.localStream = novo;
    velho?.getVideoTracks().forEach((t) => t.stop());
    aplicarOrcamento();
  }

  // Mandando o som do PC inteiro? Avisa sobre chamadas de voz e evita que as
  // outras transmissões tocando aqui voltem para quem está transmitindo.
  function avaliarSom(stream, trocou) {
    const vt = stream.getVideoTracks()[0];
    const at = stream.getAudioTracks()[0];
    const superficie = vt?.getSettings?.().displaySurface;
    S.audioCaptado = !!at;
    S.evitarEco = false;
    if (PROGRAMA) {
      const doPrograma = at ? SOM_PROGRAMA.get(at) : null;
      // Som do computador: o programa já tira o próprio som da captura. Se um dia não
      // conseguir, pausa as outras transmissões aqui para não voltarem.
      if (at && !doPrograma && at.getSettings?.().restrictOwnAudio !== true) S.evitarEco = true;
      if (doPrograma) {
        toast(`${trocou ? 'Tela trocada! ' : ''}Mandando só o som de ${doPrograma.nome}.${doPrograma.voz ? ' Atenção: é um programa de chamada, quem está nela vai se ouvir.' : ''}`, doPrograma.voz ? 9000 : 4000);
      } else if (!at && S.som !== 'nenhum' && !SEM_SOM_ESCOLHIDO.has(stream)) {
        toast(`${trocou ? 'Tela trocada, mas sem som' : 'A transmissão começou sem som'}: o Windows não liberou o som.`, 7000);
      } else if (trocou) {
        toast('Tela trocada!');
      }
      return aplicarMudoEco();
    }
    const somDoSistema = !!at && (superficie === 'monitor' || S.som === 'pc' || /system|sistema/i.test(at.label || ''));
    if (somDoSistema) {
      if (at.getSettings?.().restrictOwnAudio !== true) S.evitarEco = true;
      let porque = 'Para evitar, vá em Ajustes → Som → "Só o que estou mostrando".';
      if (S.som === 'janela' && navegadorAntigo()) porque = `Seu navegador (versão ${versaoChromium()}) é antigo e não consegue mandar só o som de uma janela. Atualize o Chrome (Menu → Ajuda → Sobre o Google Chrome) ou compartilhe uma aba.`;
      else if (S.som === 'janela') porque = 'Na janela de escolha, desligue "Compartilhar com áudio do sistema" e ligue o áudio do aplicativo, se aparecer.';
      toast(`${trocou ? 'Tela trocada. ' : ''}Você está mandando o som do computador inteiro: quem está na chamada de voz vai ouvir a própria voz. ${porque}`, 12000);
    } else if (!at && S.som !== 'nenhum') {
      toast(`${trocou ? 'Tela trocada, mas sem som. ' : 'Esta transmissão está sem som. '}Para mandar som, ligue a opção de áudio na janela de escolha: "áudio do aplicativo" para uma janela ou "áudio da guia" para uma aba.`, 8000);
    } else if (trocou) {
      toast('Tela trocada!');
    }
    aplicarMudoEco();
  }

  async function compartilharTela() {
    if (!S.sala) return toast('Entre em uma sala primeiro.');
    if (S.live) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      return toast(window.isSecureContext
        ? 'Este navegador não permite compartilhar a tela. Use Chrome, Edge ou Firefox no computador.'
        : 'Compartilhar a tela só funciona em endereços HTTPS (ou localhost). Veja o LEIA-ME.', 6000);
    }
    // O teste da placa roda ao abrir a página; se ela ainda não estava pronta, o resultado
    // vem "pelo processador". Antes da primeira transmissão, testa de novo uma vez.
    if (!CODEC.refeito && CODEC.promessa) {
      CODEC.refeito = true;
      const antes = await CODEC.promessa;
      if (!antes) { CODEC.promessa = null; CODEC.testes = {}; escolherCodec(); }
    }
    let stream;
    try {
      stream = await capturarTela();
    } catch (e) {
      return toast('Não foi possível compartilhar: ' + e.message);
    }
    if (!stream) return;
    if (!S.sala || S.live) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    prepararVideo(stream);
    S.localStream = stream;
    S.sendStream = await prepararEnvio(stream);
    if (!S.sala || S.localStream !== stream) {
      stream.getTracks().forEach((t) => t.stop());
      encerrarEnvio();
      if (S.localStream === stream) { S.localStream = null; S.sendStream = null; }
      return;
    }
    S.live = true;
    QTX.sessao = null;
    if (S.diagCaptura?.tentativa > 0) console.warn('Captura em modo compatível:', S.diagCaptura);
    ORC.total = 8e6;
    ORC.congest = ORC.folga = ORC.espera = 0;
    avaliarSom(stream, false);
    patchMe();
    blip('live');
    renderTudo();
    try {
      await api('state', { sala: S.sala, live: true, ...estadoVoz() });
    } catch (e) {
      toast('Erro ao começar a transmissão: ' + e.message);
      pararTransmissao(false, 'erro');
    }
  }

  // Troca o que está sendo mostrado sem derrubar ninguém: a imagem (e o som)
  // novos entram no lugar dos antigos nas conexões que já existem.
  async function trocarTela() {
    if (!S.live || !S.localStream || S.trocando) return;
    S.trocando = true;
    renderTudo();
    let novo = null;
    try {
      novo = await capturarTela();
    } catch (e) {
      toast('Não foi possível trocar: ' + e.message);
    } finally {
      S.trocando = false;
    }
    if (!novo || !S.live || !S.localStream) {
      if (novo) novo.getTracks().forEach((t) => t.stop());
      return renderTudo(); // cancelou: continua mostrando a tela de antes
    }
    const velho = S.localStream;
    prepararVideo(novo);
    const nv = novo.getVideoTracks()[0];
    const na = novo.getAudioTracks()[0] || null;

    if (S.envio) {
      // Som passa pelo Web Audio: só troca a origem, a faixa enviada continua a mesma
      try { S.envio.src?.disconnect(); } catch { /* ok */ }
      S.envio.src = null;
      if (na) {
        S.envio.src = S.envio.gain.context.createMediaStreamSource(new MediaStream([na]));
        S.envio.src.connect(S.envio.gain);
      }
      S.sendStream = new MediaStream([nv, S.envio.dest.stream.getAudioTracks()[0]]);
    } else {
      S.sendStream = novo;
    }

    const reconectar = [];
    for (const [vid, c] of S.out) {
      try {
        const trs = c.pc.getTransceivers().filter((tr) => tr.currentDirection !== 'stopped');
        const temAudio = trs.some((tr) => tr.receiver.track.kind === 'audio');
        for (const tr of trs) {
          const tipo = tr.receiver.track.kind;
          if (tipo === 'video') await tr.sender.replaceTrack(nv);
          else if (tipo === 'audio' && !S.envio) await tr.sender.replaceTrack(na);
        }
        // Antes não tinha som e agora tem: essa conexão precisa ser refeita
        if (!S.envio && na && !temAudio) reconectar.push(vid);
      } catch {
        reconectar.push(vid);
      }
    }
    S.localStream = novo;
    velho.getTracks().forEach((t) => t.stop());
    for (const vid of reconectar) {
      fecharOut(vid);
      sinal(vid, { k: 'restart' });
    }
    avaliarSom(novo, true);
    aplicarOrcamento();
    renderTudo();
  }

  // motivo: voce (clicou em parar), captura (a janela/tela sumiu), sala, sala-apagada, conexao, admin, expulso, erro
  function pararTransmissao(silencioso, motivo = 'voce') {
    if (!S.live && !S.localStream) return;
    encerrarSessaoEnvio(false, motivo); // resumo da qualidade para o painel de admin
    S.live = false;
    S.retomando = false;
    if (S.localStream) S.localStream.getTracks().forEach((t) => t.stop());
    pararTodos();
    S.localStream = null;
    S.sendStream = null;
    S.audioCaptado = false;
    encerrarEnvio();
    for (const vid of [...S.out.keys()]) fecharOut(vid);
    if (S.focus === S.myId) S.focus = null;
    S.evitarEco = false;
    aplicarMudoEco();
    encerrarCaneta();
    patchMe();
    if (!silencioso) api('state', { sala: S.sala, live: false, ...estadoVoz() }).catch(() => {});
    renderTudo();
  }

  async function aplicarQualidade() {
    if (!S.live || !S.localStream) return;
    const q = QUALIDADES[S.quality];
    const vt = S.localStream.getVideoTracks()[0];
    if (vt) {
      try {
        vt.contentHint = q.hint;
        await vt.applyConstraints({ width: { ideal: q.w }, height: { ideal: q.h }, frameRate: { ideal: q.fps, max: q.fps } });
      } catch { /* nem todo navegador deixa mudar no meio */ }
    }
    aplicarOrcamento();
  }

  // ================= Upload: divide a internet de quem transmite =================
  // Cada pessoa assistindo recebe uma cópia do vídeo. Aqui o site reparte o upload
  // entre elas e baixa a resolução quando a fatia de cada um fica pequena.
  const UPLOADS = [['auto', 'Automático'], ['5', 'Até 5 Mbps'], ['10', 'Até 10 Mbps'], ['20', 'Até 20 Mbps'], ['50', 'Até 50 Mbps'], ['100', '100 Mbps ou mais']];
  const POR_MIN = 300e3; // nunca abaixo disso por pessoa
  const AUDIO_BPS = 100e3; // o som também ocupa um pouco
  const ORC = { total: 8e6, congest: 0, folga: 0, espera: 0, porPessoa: 0, fila: Promise.resolve() };

  function orcamentoTotal() {
    return S.upload === 'auto' ? ORC.total : Number(S.upload) * 1e6 * 0.85; // deixa uma folga na internet
  }
  function fatiaPorPessoa() {
    const q = QUALIDADES[S.quality];
    const n = Math.max(1, S.out.size);
    return Math.max(POR_MIN, Math.min(q.br, orcamentoTotal() / n - AUDIO_BPS));
  }
  const alturaPara = (bps) => (bps >= 2.5e6 ? 1080 : bps >= 1.2e6 ? 720 : bps >= 0.6e6 ? 540 : 360);
  const mbps = (bps) => (bps / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: bps < 1e6 ? 2 : 1 });

  async function aplicarOrcamentoAgora() {
    if (!S.live || !S.localStream) return;
    const q = QUALIDADES[S.quality];
    const fatia = fatiaPorPessoa();
    ORC.porPessoa = fatia;
    const vt = S.localStream.getVideoTracks()[0];
    const altura = vt?.getSettings?.().height || q.h;
    let escala = 1;
    let fps = q.fps;
    if (q.hint === 'detail') fps = fatia < 0.8e6 ? 5 : fatia < 1.5e6 ? 10 : q.fps; // texto: mantém a nitidez, baixa os quadros
    else escala = Math.max(1, altura / alturaPara(fatia)); // movimento: baixa a resolução
    escala = Math.round(escala * 100) / 100;
    for (const c of S.out.values()) {
      for (const s of c.pc.getSenders()) {
        if (!s.track || s.track.kind !== 'video') continue;
        try {
          const p = s.getParameters();
          if (!p.encodings || !p.encodings.length) continue; // ainda conectando: aplica depois
          const e = p.encodings[0];
          if (e.maxBitrate === Math.round(fatia) && e.maxFramerate === fps && (e.scaleResolutionDownBy || 1) === escala) continue;
          e.maxBitrate = Math.round(fatia);
          e.maxFramerate = fps;
          e.scaleResolutionDownBy = escala;
          await s.setParameters(p);
        } catch (err) {
          console.warn('Não consegui ajustar o envio', err);
        }
      }
    }
    atualizarTile(S.myId);
  }
  // Uma alteração por vez (o navegador não gosta de ajustes simultâneos)
  function aplicarOrcamento() {
    ORC.fila = ORC.fila.then(aplicarOrcamentoAgora).catch(() => {});
    return ORC.fila;
  }

  // Modo automático: olha a cada 2 s se a internet está apertada (estimativa de banda
  // menor que a fatia, ou pacotes se perdendo) e ajusta o total para baixo ou para cima.
  function avaliarRede(sinais, n) {
    const q = QUALIDADES[S.quality];
    if (!sinais.length) return false;
    const fatia = ORC.porPessoa || fatiaPorPessoa();
    const apertado = sinais.some((x) => (x.bwe && x.bwe < fatia * 0.8) || x.perda > 0.08);
    const sobra = sinais.every((x) => (!x.bwe || x.bwe >= fatia * 1.1) && x.perda < 0.02);
    if (apertado) { ORC.congest++; ORC.folga = 0; } else if (sobra) { ORC.folga++; ORC.congest = 0; } else { ORC.congest = 0; ORC.folga = 0; }
    if (ORC.espera > 0) ORC.espera--;
    if (ORC.congest >= 2) {
      ORC.total = Math.max(n * (POR_MIN + AUDIO_BPS), ORC.total * 0.75);
      ORC.congest = 0;
      ORC.espera = 5; // espera ~10 s antes de tentar subir de novo
      return true;
    }
    const teto = n * (q.br + AUDIO_BPS);
    if (ORC.folga >= 5 && ORC.espera === 0 && ORC.total < teto) {
      ORC.total = Math.min(teto, ORC.total * 1.15);
      ORC.folga = 0;
      return true;
    }
    return false;
  }
  async function medirRede() {
    if (!S.live || S.upload !== 'auto' || !S.out.size) return;
    const sinais = [];
    for (const c of S.out.values()) {
      if (c.pc.connectionState !== 'connected') continue;
      let rel;
      try { rel = await c.pc.getStats(); } catch { continue; }
      let bwe = 0;
      let perda = 0;
      rel.forEach((r) => {
        if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded' && r.availableOutgoingBitrate) bwe = r.availableOutgoingBitrate;
        if (r.type === 'remote-inbound-rtp' && r.kind === 'video' && typeof r.fractionLost === 'number') perda = r.fractionLost;
      });
      // nos primeiros 20 s a estimativa de banda ainda está subindo: não confunde isso com
      // internet apertada (só a perda de pacotes conta nesse começo)
      if (Date.now() - (c.desde || 0) < 20000) bwe = 0;
      sinais.push({ bwe, perda });
    }
    if (avaliarRede(sinais, S.out.size)) aplicarOrcamento();
  }
  setInterval(medirRede, 2000);

  // ================= WebRTC =================
  // Quem transmite sempre faz a "oferta"; quem assiste responde.
  // Cada par (transmissor -> espectador) tem a sua própria conexão.
  const filas = new Map();
  function sinal(to, data) {
    const anterior = filas.get(to) || Promise.resolve();
    const proxima = anterior.then(() => api('signal', { to, data })).catch(() => {});
    filas.set(to, proxima);
    return proxima;
  }

  function quemQueroAssistir() {
    if (!S.sala) return new Set();
    return new Set(S.users.filter((u) => u.id !== S.myId && u.sala === S.sala && u.live).map((u) => u.id));
  }

  function sincronizarStreams() {
    const quero = quemQueroAssistir();
    for (const sid of [...S.inc.keys()]) {
      if (!quero.has(sid)) {
        fecharInc(sid);
        S.tries.delete(sid);
      }
    }
    for (const sid of quero) if (!S.inc.has(sid)) assistir(sid);

    if (S.live) {
      const espectadores = vizinhosDeSala();
      for (const vid of [...S.out.keys()]) if (!espectadores.has(vid)) fecharOut(vid);
    }
    sincronizarVoz();
  }

  function novaInc(sid) {
    const antiga = S.inc.get(sid);
    if (antiga) {
      antiga.pc.close();
      clearTimeout(antiga.discTimer);
    }
    const pc = new RTCPeerConnection({ iceServers: S.iceServers });
    const c = { pc, pending: antiga ? antiga.pending : [], stream: null, state: 'connecting', sess: null, gaveUp: false };
    S.inc.set(sid, c);
    pc.ontrack = (e) => {
      if (S.inc.get(sid) !== c) return;
      if (e.streams[0]) c.stream = e.streams[0];
      else {
        c.stream ||= new MediaStream();
        c.stream.addTrack(e.track);
      }
      e.track.onunmute = () => atualizarTile(sid);
      atualizarTile(sid);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && c.sess) sinal(sid, { k: 'ice', to: 'sharer', sess: c.sess, c: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (S.inc.get(sid) !== c) return;
      c.state = pc.connectionState;
      clearTimeout(c.discTimer);
      if (c.state === 'connected') S.tries.set(sid, 0);
      if (c.state === 'failed') tentarDeNovo(sid);
      if (c.state === 'disconnected') c.discTimer = setTimeout(() => { if (S.inc.get(sid) === c && pc.connectionState === 'disconnected') tentarDeNovo(sid); }, 7000);
      atualizarTile(sid);
    };
    return c;
  }

  function assistir(sid) {
    const c = novaInc(sid);
    c.pending = [];
    sinal(sid, { k: 'watch' });
    atualizarTile(sid);
  }

  function tentarDeNovo(sid) {
    const c = S.inc.get(sid);
    const n = (S.tries.get(sid) || 0) + 1;
    S.tries.set(sid, n);
    if (n > 3) {
      if (c) {
        c.state = 'failed';
        c.gaveUp = true;
      }
      atualizarTile(sid);
      return;
    }
    if (c) c.state = 'failed';
    setTimeout(() => { if (quemQueroAssistir().has(sid)) assistir(sid); }, 1200 * n);
  }

  function fecharInc(sid) {
    const c = S.inc.get(sid);
    if (!c) return;
    enviarResumo(resumoRecebimento(c), false); // resumo da qualidade para o painel de admin
    clearTimeout(c.discTimer);
    c.pc.close();
    S.inc.delete(sid);
  }

  function fecharOut(vid) {
    const c = S.out.get(vid);
    if (!c) return;
    c.pc.close();
    S.out.delete(vid);
    atualizarTile(S.myId);
    aplicarOrcamento();
  }

  async function onSignal(from, d) {
    if (!d || typeof d !== 'object') return;
    try {
      if (d.k === 'watch') await pedidoParaAssistir(from);
      else if (d.k === 'offer') await recebeuOferta(from, d);
      else if (d.k === 'answer') await recebeuResposta(from, d);
      else if (d.k === 'restart') { if (quemQueroAssistir().has(from)) { S.tries.set(from, 0); assistir(from); } }
      else if (d.k === 'ice' && d.to === 'viewer') iceComoEspectador(from, d);
      else if (d.k === 'ice' && d.to === 'sharer') iceComoTransmissor(from, d);
      else if (d.k === 'voz-offer') await vozOferta(from, d);
      else if (d.k === 'voz-answer') await vozResposta(from, d);
      else if (d.k === 'voz-ice') vozIce(from, d);
      else if (d.k === 'voz-oi') { if (S.sala && S.myId < from && vizinhosDeSala().has(from)) iniciarVoz(from).catch(() => {}); }
    } catch (e) {
      console.warn('Erro de sinalização', e);
    }
  }

  // --- lado de quem transmite ---
  async function pedidoParaAssistir(vid) {
    if (!S.live || !S.localStream) return;
    fecharOut(vid);
    const pc = new RTCPeerConnection({ iceServers: S.iceServers });
    const c = { pc, pending: [], sess: Math.random().toString(36).slice(2, 10), desde: Date.now() };
    S.out.set(vid, c);
    const fonte = S.sendStream || S.localStream;
    for (const t of fonte.getTracks()) pc.addTrack(t, fonte);
    aplicarCodec(pc, await escolherCodec()); // formato de vídeo pela placa, se tiver
    if (S.out.get(vid) !== c) return;
    pc.onicecandidate = (e) => {
      if (e.candidate) sinal(vid, { k: 'ice', to: 'viewer', sess: c.sess, c: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (S.out.get(vid) !== c) return;
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') fecharOut(vid);
      else atualizarTile(S.myId);
    };
    const oferta = await pc.createOffer();
    await pc.setLocalDescription(oferta);
    sinal(vid, { k: 'offer', sess: c.sess, sdp: pc.localDescription.toJSON() });
  }

  // Partida forte: o navegador começa mandando quase nada (uns 300 kbps) e sobe devagar, então
  // os primeiros segundos (ou minutos, numa internet com oscilação) ficam pixelados. Aqui cada
  // conexão já começa perto da fatia de quem assiste; se a internet não aguentar, ele desce sozinho.
  function partidaForte(sdp, kbps) {
    const linhas = sdp.split('\r\n');
    const pts = new Set();
    let video = false;
    for (const l of linhas) {
      if (l.startsWith('m=')) video = l.startsWith('m=video');
      else if (video) {
        const m = /^a=rtpmap:(\d+) (VP8|VP9|AV1|H264)\//i.exec(l);
        if (m) pts.add(m[1]);
      }
    }
    const comFmtp = new Set();
    video = false;
    const saida = linhas.map((l) => {
      if (l.startsWith('m=')) video = l.startsWith('m=video');
      const m = video && /^a=fmtp:(\d+) /.exec(l);
      if (m && pts.has(m[1])) {
        comFmtp.add(m[1]);
        return /x-google-start-bitrate/.test(l) ? l : `${l};x-google-start-bitrate=${kbps}`;
      }
      return l;
    });
    // codecs sem linha a=fmtp (o VP8 costuma vir assim): cria uma logo depois do rtpmap
    return saida.flatMap((l) => {
      const m = /^a=rtpmap:(\d+) /.exec(l);
      return m && pts.has(m[1]) && !comFmtp.has(m[1]) ? [l, `a=fmtp:${m[1]} x-google-start-bitrate=${kbps}`] : [l];
    }).join('\r\n');
  }

  async function recebeuResposta(vid, d) {
    const c = S.out.get(vid);
    if (!c || d.sess !== c.sess) return;
    const kbps = Math.round(Math.min(ORC.porPessoa || fatiaPorPessoa(), 2.5e6) / 1000);
    try {
      await c.pc.setRemoteDescription({ type: d.sdp.type, sdp: partidaForte(d.sdp.sdp, kbps) });
    } catch {
      await c.pc.setRemoteDescription(d.sdp); // se o navegador recusar o ajuste, segue do jeito normal
    }
    const pend = c.pending;
    c.pending = [];
    for (const p of pend) c.pc.addIceCandidate(p.c).catch(() => {});
    aplicarOrcamento(); // uma pessoa a mais: refaz as fatias
  }

  function iceComoTransmissor(vid, d) {
    const c = S.out.get(vid);
    if (!c || d.sess !== c.sess) return;
    if (c.pc.remoteDescription) c.pc.addIceCandidate(d.c).catch(() => {});
    else c.pending.push(d);
  }

  // --- lado de quem assiste ---
  async function recebeuOferta(sid, d) {
    if (!quemQueroAssistir().has(sid)) return;
    let c = S.inc.get(sid);
    if (!c || c.pc.remoteDescription || c.pc.signalingState !== 'stable') c = novaInc(sid);
    c.sess = d.sess;
    c.gaveUp = false;
    await c.pc.setRemoteDescription(d.sdp);
    const pend = c.pending.filter((p) => p.sess === c.sess);
    c.pending = [];
    for (const p of pend) c.pc.addIceCandidate(p.c).catch(() => {});
    const resposta = await c.pc.createAnswer();
    await c.pc.setLocalDescription(resposta);
    sinal(sid, { k: 'answer', sess: c.sess, sdp: c.pc.localDescription.toJSON() });
  }

  function iceComoEspectador(sid, d) {
    const c = S.inc.get(sid);
    if (!c) return;
    if (d.sess === c.sess && c.pc.remoteDescription) c.pc.addIceCandidate(d.c).catch(() => {});
    else {
      c.pending.push(d);
      if (c.pending.length > 200) c.pending.shift();
    }
  }

  // ================= Reações: emotes que sobem flutuando na transmissão =================
  // Desenhos próprios (SVG), cada um com uma animação curtinha. Cada clique solta um emote que
  // sobe e some em 2 segundos, para todo mundo da sala que está vendo aquela transmissão. Sem som.
  const ROSTO_EMO = '<circle cx="32" cy="33" r="27" fill="url(#emoRosto)" stroke="#c88400" stroke-width="1.4"/><ellipse cx="30" cy="16.5" rx="15" ry="6.5" fill="#fff" opacity=".5"/>';
  const GOTA_EMO = '<path d="M0 -3.5C1.8 -1 2.8 .8 2.8 2.2C2.8 3.9 1.5 5 0 5C-1.5 5 -2.8 3.9 -2.8 2.2C-2.8 .8 -1.8 -1 0 -3.5z" fill="url(#emoAgua)"/><circle cx="-.9" cy="2" r=".8" fill="#fff" opacity=".85"/>';
  const CORACAO_EMO = '<path d="M0 6C-3 3.5 -8 .5 -8 -3C-8 -6 -5.5 -7.5 -3.5 -7.5C-1.8 -7.5 -.6 -6.5 0 -5.3C.6 -6.5 1.8 -7.5 3.5 -7.5C5.5 -7.5 8 -6 8 -3C8 .5 3 3.5 0 6z" fill="url(#emoCoracao)" stroke="#b80d35" stroke-width=".8"/><ellipse cx="-3.6" cy="-4" rx="1.9" ry="1.2" fill="#fff" opacity=".75"/>';
  const svgEmo = (miolo) => `<svg viewBox="0 0 64 64" overflow="visible" aria-hidden="true">${miolo}</svg>`;
  const EMOTES = [
    {
      id: 'chorando', nome: 'Chorando',
      svg: svgEmo(`${ROSTO_EMO}
        <path d="M17 24.5q4.5 -1 9 -4.5M47 24.5q-4.5 -1 -9 -4.5" stroke="#6b3a00" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M17 30q5.5 -5 11 0M47 30q-5.5 -5 -11 0" stroke="#5a3200" stroke-width="3" stroke-linecap="round" fill="none"/>
        <g class="emo-soluco"><ellipse cx="32" cy="46" rx="8" ry="6.5" fill="#6b2b12"/><ellipse cx="32" cy="50" rx="5" ry="2.6" fill="#ff7a8a"/></g>
        <path d="M19.5 31C15 38 17 47 11 58M44.5 31C49 38 47 47 53 58" stroke="#2a9be8" stroke-width="7.5" stroke-linecap="round" fill="none" opacity=".35"/>
        <path d="M19.5 31C15 38 17 47 11 58M44.5 31C49 38 47 47 53 58" stroke="url(#emoAgua)" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <path class="emo-rio" d="M19.5 31C15 38 17 47 11 58M44.5 31C49 38 47 47 53 58" stroke="#f2fdff" stroke-width="2" stroke-linecap="round" fill="none" stroke-dasharray="3 7"/>
        <g class="emo-gota"><g transform="translate(11 59)">${GOTA_EMO}</g></g>
        <g class="emo-gota d2"><g transform="translate(53 59)">${GOTA_EMO}</g></g>`),
    },
    {
      id: 'apaixonado', nome: 'Apaixonado',
      svg: svgEmo(`${ROSTO_EMO}
        <ellipse cx="14.5" cy="40.5" rx="5" ry="3" fill="#ff6f9c" opacity=".5"/><ellipse cx="49.5" cy="40.5" rx="5" ry="3" fill="#ff6f9c" opacity=".5"/>
        <path d="M19 39q13 15 26 0q-13 4 -26 0z" fill="#6b2b12"/>
        <path d="M20.5 39.8q11.5 3.2 23 0l-1.2 2.6q-10.3 2.6 -20.6 0z" fill="#fff"/>
        <g class="emo-coracao"><g transform="translate(21.5 27)">${CORACAO_EMO}</g></g>
        <g class="emo-coracao d2"><g transform="translate(42.5 27)">${CORACAO_EMO}</g></g>`),
    },
    {
      id: 'fogo', nome: 'Fogo',
      svg: svgEmo(`<g class="emo-chama-fora"><path d="M32 3C35 12 47 17 48.5 33C49.5 47 42 60 32 60C21.5 60 15 50 15.5 39C16 30 21 25 23.5 17C26.5 22 27.5 26 30.5 27.5C29.5 19 29 10 32 3z" fill="url(#emoFogoFora)" stroke="#d83a00" stroke-width="1"/></g>
        <g class="emo-chama-meio"><path d="M32.5 24C35.5 31 42 35 42 45C42 53.5 37.5 59 32 59C26.5 59 22 54 22 47C22 41 26 37.5 27.5 32C29.5 36 31 37.5 32.5 38.5C31.5 33 31.5 28 32.5 24z" fill="url(#emoFogoDentro)"/></g>
        <g class="emo-chama-centro"><path d="M32 42C34.5 45.5 37 48 37 52C37 55.5 34.8 58 32 58C29.2 58 27 55.5 27 52C27 48.5 29.5 46 32 42z" fill="#fffbe6"/></g>
        <ellipse cx="25.5" cy="33" rx="2.6" ry="7" fill="#fff" opacity=".28" transform="rotate(18 25.5 33)"/>
        <circle class="emo-faisca" cx="21" cy="24" r="2.4" fill="#ffd54a"/><circle class="emo-faisca d2" cx="44" cy="19" r="2.1" fill="#ffb300"/><circle class="emo-faisca d3" cx="34" cy="8" r="1.7" fill="#ffe57a"/>`),
    },
    {
      id: 'berinjela', nome: 'Berinjela',
      svg: svgEmo(`<path d="M19 19C27 12 39 16 47 28C55 40 57 52 50.5 55.5C44 59 33.5 52.5 25.5 42.5C17.5 32.5 12.5 25.5 19 19z" fill="url(#emoBerinjela)" stroke="#3a1072" stroke-width="1.2"/>
        <path d="M23 20.5C29 17 37 20 43 28" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>
        <path d="M13.5 11.5C11.5 8 9.5 6 6.5 4.5" stroke="#2e7d32" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <path d="M11 12C16 8 24 9 27.5 14.5L22 14.5L24.5 20.5L18.5 17.5L17 23.5L13.5 17.5L8 20L11.5 14.5z" fill="#43a047" stroke="#2e7d32" stroke-width="1" stroke-linejoin="round"/>
        <g class="emo-pingo"><g transform="translate(28 16)">${GOTA_EMO}</g></g>
        <g class="emo-pingo d2"><g transform="translate(28 16)">${GOTA_EMO}</g></g>
        <g class="emo-pingo d3"><g transform="translate(28 16)">${GOTA_EMO}</g></g>`),
    },
    {
      id: 'risada', nome: 'Gargalhando',
      svg: svgEmo(`<g class="emo-gargalha">${ROSTO_EMO}
        <path d="M17 22.5l9.5 5l-9.5 5M47 22.5l-9.5 5l9.5 5" stroke="#5a3200" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <g class="emo-boca"><path d="M15.5 37.5q16.5 2.5 33 0q-1.5 19.5 -16.5 19.5q-15 0 -16.5 -19.5z" fill="#6b2b12"/>
          <path d="M16.6 38.4q15.4 2.3 30.8 0l-.8 4q-14.6 2 -29.2 0z" fill="#fff"/><ellipse cx="32" cy="51.5" rx="7.5" ry="4" fill="#ff6f6f"/></g>
        <g class="emo-alegria-e"><g transform="translate(11 31) rotate(50) scale(1.3)">${GOTA_EMO}</g></g>
        <g class="emo-alegria-d"><g transform="translate(53 31) rotate(-50) scale(1.3)">${GOTA_EMO}</g></g></g>`),
    },
  ];
  // gradientes dos emotes, uma vez só na página
  function montarDefsDosEmotes() {
    if (document.getElementById('emoDefs')) return;
    const d = document.createElement('div');
    d.innerHTML = `<svg id="emoDefs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <radialGradient id="emoRosto" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#fff6b8"/><stop offset=".45" stop-color="#ffd84a"/><stop offset="1" stop-color="#f6a800"/></radialGradient>
      <linearGradient id="emoAgua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f2ff"/><stop offset="1" stop-color="#2fa8f5"/></linearGradient>
      <linearGradient id="emoCoracao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7d98"/><stop offset="1" stop-color="#e3133c"/></linearGradient>
      <linearGradient id="emoFogoFora" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3d00"/><stop offset=".6" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ffb347"/></linearGradient>
      <linearGradient id="emoFogoDentro" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb300"/><stop offset="1" stop-color="#ffe57a"/></linearGradient>
      <radialGradient id="emoBerinjela" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c29bff"/><stop offset=".45" stop-color="#7e3bd6"/><stop offset="1" stop-color="#4a1890"/></radialGradient>
      <linearGradient id="stVerde" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6ec72"/><stop offset=".55" stop-color="#6fcd3e"/><stop offset="1" stop-color="#43a024"/></linearGradient>
  <linearGradient id="stAzul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcff"/><stop offset=".55" stop-color="#3db3f0"/><stop offset="1" stop-color="#1c86cf"/></linearGradient>
  <linearGradient id="stRosa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc0d6"/><stop offset=".5" stop-color="#ff86ac"/><stop offset="1" stop-color="#ef5a8d"/></linearGradient>
  <linearGradient id="stFolha" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b6f07c"/><stop offset="1" stop-color="#3f9a22"/></linearGradient>
  <radialGradient id="stBolha" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#bfeaff" stop-opacity=".5"/><stop offset="1" stop-color="#6cc6f5" stop-opacity=".35"/></radialGradient>
  <radialGradient id="stBola" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff8a1c"/></radialGradient>
    </defs></svg>`;
    document.body.appendChild(d.firstElementChild);
  }
  montarDefsDosEmotes();
  // Cada um escolhe se os emotes dos outros aparecem na sua tela (o olho no fim da barra)
  let VER_EMOTES = salvo.verEmotes !== false;
  const textoVerEmotes = () => (VER_EMOTES ? 'Esconder os emotes dos outros na sua tela' : 'Mostrar os emotes dos outros na sua tela');
  const barraDeReacoes = () => `<div class="t-reacoes" role="group" aria-label="Reações">${EMOTES.map((x, i) =>
    `<button type="button" class="t-reacao" data-act="emote" data-emote="${i}" title="${x.nome}" aria-label="Reagir: ${x.nome}">${x.svg}</button>`).join('')}
    <span class="t-reacoes-sep" aria-hidden="true"></span>
    <button type="button" class="t-ver-emotes${VER_EMOTES ? '' : ' desligado'}" data-act="ver-emotes" title="${textoVerEmotes()}" aria-label="${textoVerEmotes()}" aria-pressed="${!VER_EMOTES}">${icon(VER_EMOTES ? 'olho' : 'olhoOff')}</button></div>`;
  function alternarVerEmotes() {
    VER_EMOTES = !VER_EMOTES;
    salvar({ verEmotes: VER_EMOTES });
    for (const b of document.querySelectorAll('.t-ver-emotes')) {
      b.innerHTML = icon(VER_EMOTES ? 'olho' : 'olhoOff');
      b.classList.toggle('desligado', !VER_EMOTES);
      b.title = textoVerEmotes();
      b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-pressed', String(!VER_EMOTES));
    }
    if (!VER_EMOTES) for (const e of document.querySelectorAll('.t-emotes .emote-voa:not(.meu)')) e.remove();
    toast(VER_EMOTES ? 'Os emotes de todo mundo voltam a aparecer na sua tela.' : 'Os emotes dos outros não aparecem mais na sua tela. Os que você mandar continuam aparecendo para todo mundo.', 6000);
  }

  // ================= Boas-vindas: adesivos das telinhas acenando =================
  // Três personagens no estilo da logo (tela arredondada, brilho de vidro, contorno de adesivo),
  // desenhados aqui mesmo (SVG animado, fundo transparente). Quem entra pela primeira vez ganha
  // uma mensagem no #geral com um deles e uma das três frases.
  const BRACO = (d, cor) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${cor}" stroke-width="7" stroke-linecap="round"/>`;
  const MAO = (x, y, cor) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#fff"/><circle cx="${x}" cy="${y}" r="5.4" fill="${cor}"/><circle cx="${x - 1.6}" cy="${y - 1.8}" r="1.7" fill="#fff" opacity=".7"/>`;
  const PE = (x, cor) => `<ellipse cx="${x}" cy="101" rx="9" ry="6" fill="#fff"/><ellipse cx="${x}" cy="101" rx="6.6" ry="4" fill="${cor}"/>`;
  const SOMBRA = '<ellipse class="st-sombra" cx="60" cy="109" rx="27" ry="4.5" fill="#0b2a43" opacity=".16"/>';
  const BRILHO = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-7q1.2 5.8 7 7q-5.8 1.2-7 7q-1.2-5.8-7-7q5.8-1.2 7-7z" fill="#fff3a6" stroke="#f2b705" stroke-width="1" stroke-linejoin="round"/>`;
  const STICKERS = [
    // 1. Verdinha (a tela verde da logo): pisca o olho e acena, com brilhinhos
    `<svg class="sticker st-verde" viewBox="0 0 120 120" aria-hidden="true">${SOMBRA}
      <g class="st-corpo">
        ${PE(48, '#3f9a22')}${PE(72, '#3f9a22')}
        <g>${BRACO('M30 66q-9 6-8 17', '#4aa82a')}${MAO(22, 84, '#6fcd3e')}</g>
        <rect x="26" y="32" width="68" height="60" rx="16" fill="url(#stVerde)" stroke="#fff" stroke-width="4.5"/>
        <path d="M28.5 46a14 14 0 0 1 14-12h35a14 14 0 0 1 14 12v3q-31.5 9-63 0z" fill="#fff" opacity=".55"/>
        <ellipse cx="38" cy="73" rx="5.5" ry="3.4" fill="#ffc2d6" opacity=".8"/><ellipse cx="82" cy="73" rx="5.5" ry="3.4" fill="#ffc2d6" opacity=".8"/>
        <circle class="st-olho" cx="47" cy="62" r="4" fill="#0b2a43"/>
        <g class="st-pisca"><circle class="st-aberto" cx="73" cy="62" r="4" fill="#0b2a43"/><path class="st-fechado" d="M68.5 63q4.5-4 9 0" fill="none" stroke="#0b2a43" stroke-width="3.6" stroke-linecap="round"/></g>
        <path d="M48 74q12 10 24 0" fill="none" stroke="#0b2a43" stroke-width="3.6" stroke-linecap="round"/>
        <g class="st-aceno" style="transform-origin: 90px 64px">${BRACO('M90 64q12-6 14-20', '#4aa82a')}${MAO(104, 43, '#6fcd3e')}</g>
      </g>
      <g class="st-brilho">${BRILHO(104, 22)}</g><g class="st-brilho d2">${BRILHO(16, 40, .7)}</g>
    </svg>`,
    // 2. Azulzinho com anteninha: sorriso de olhos fechados e bolhas subindo
    `<svg class="sticker st-azul" viewBox="0 0 120 120" aria-hidden="true">${SOMBRA}
      <circle class="st-bolha" cx="16" cy="88" r="5" fill="url(#stBolha)" stroke="#fff" stroke-width="1"/>
      <circle class="st-bolha d2" cx="104" cy="92" r="4" fill="url(#stBolha)" stroke="#fff" stroke-width="1"/>
      <circle class="st-bolha d3" cx="98" cy="70" r="3" fill="url(#stBolha)" stroke="#fff" stroke-width="1"/>
      <g class="st-corpo">
        ${PE(46, '#1a74b5')}${PE(74, '#1a74b5')}
        <g class="st-antena" style="transform-origin: 62px 36px"><path d="M62 36q2-12 8-18" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M62 36q2-12 8-18" fill="none" stroke="#2a85c9" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="71" cy="16" r="7" fill="#fff"/><circle cx="71" cy="16" r="5.2" fill="url(#stBola)"/><circle cx="69.4" cy="14.2" r="1.6" fill="#fff"/></g>
        <g>${BRACO('M92 68q9 5 9 16', '#2a85c9')}${MAO(101, 85, '#3db3f0')}</g>
        <rect x="22" y="36" width="76" height="56" rx="16" fill="url(#stAzul)" stroke="#fff" stroke-width="4.5"/>
        <path d="M24.5 50a14 14 0 0 1 14-12h43a14 14 0 0 1 14 12v3q-35.5 9-71 0z" fill="#fff" opacity=".55"/>
        <ellipse cx="36" cy="76" rx="5.5" ry="3.4" fill="#ffc2d6" opacity=".8"/><ellipse cx="84" cy="76" rx="5.5" ry="3.4" fill="#ffc2d6" opacity=".8"/>
        <path d="M41 66q5-6 10 0M69 66q5-6 10 0" fill="none" stroke="#0b2a43" stroke-width="3.6" stroke-linecap="round"/>
        <path class="st-boca" d="M49 74h22q0 12-11 12t-11-12z" fill="#0b2a43"/><path d="M53.5 82q6.5 4 13 0q-1.5 4-6.5 4t-6.5-4z" fill="#ff7a8a"/>
        <g class="st-aceno" style="transform-origin: 28px 68px">${BRACO('M28 68q-12-5-15-19', '#2a85c9')}${MAO(13, 48, '#3db3f0')}</g>
      </g>
    </svg>`,
    // 3. Rosinha com brotinho: dá pulinhos, acena e solta coraçõezinhos
    `<svg class="sticker st-rosa" viewBox="0 0 120 120" aria-hidden="true">${SOMBRA}
      <g transform="translate(18 64)"><path class="st-coracao" d="M0 4.5C-2.2 2.7 -6 .4 -6 -2.3C-6 -4.5 -4.2 -5.7 -2.6 -5.7C-1.3 -5.7 -.4 -4.9 0 -4C.4 -4.9 1.3 -5.7 2.6 -5.7C4.2 -5.7 6 -4.5 6 -2.3C6 .4 2.2 2.7 0 4.5z" fill="#ff5c8a" stroke="#fff" stroke-width="1.2"/></g>
      <g transform="translate(101 42) scale(.8)"><path class="st-coracao d2" d="M0 4.5C-2.2 2.7 -6 .4 -6 -2.3C-6 -4.5 -4.2 -5.7 -2.6 -5.7C-1.3 -5.7 -.4 -4.9 0 -4C.4 -4.9 1.3 -5.7 2.6 -5.7C4.2 -5.7 6 -4.5 6 -2.3C6 .4 2.2 2.7 0 4.5z" fill="#ff5c8a" stroke="#fff" stroke-width="1.2"/></g>
      <g class="st-pulo">
        ${PE(50, '#e0457c')}${PE(70, '#e0457c')}
        <g class="st-broto" style="transform-origin: 60px 25px"><path d="M60 26q0-8 0-10" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M60 26q0-8 0-10" stroke="#3f9a22" stroke-width="3" stroke-linecap="round"/>
          <path d="M60 17q-4-9-14-8q1 9 14 8z" fill="url(#stFolha)" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M60 15q5-9 14-6q-2 9-14 6z" fill="url(#stFolha)" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></g>
        <g>${BRACO('M34 66q-9 6-9 16', '#e0457c')}${MAO(25, 83, '#ff7fa6')}</g>
        <rect x="32" y="24" width="56" height="70" rx="16" fill="url(#stRosa)" stroke="#fff" stroke-width="4.5"/>
        <path d="M34.5 38a14 14 0 0 1 14-12h23a14 14 0 0 1 14 12v3q-25.5 8-51 0z" fill="#fff" opacity=".55"/>
        <ellipse cx="42" cy="70" rx="5" ry="3.2" fill="#ff3d7f" opacity=".35"/><ellipse cx="78" cy="70" rx="5" ry="3.2" fill="#ff3d7f" opacity=".35"/>
        <g class="st-olhos"><circle cx="49" cy="59" r="5.2" fill="#0b2a43"/><circle cx="71" cy="59" r="5.2" fill="#0b2a43"/><circle cx="50.8" cy="57.2" r="1.8" fill="#fff"/><circle cx="72.8" cy="57.2" r="1.8" fill="#fff"/></g>
        <path d="M53 69q7 7 14 0" fill="none" stroke="#0b2a43" stroke-width="3.6" stroke-linecap="round"/>
        <g class="st-aceno" style="transform-origin: 86px 64px">${BRACO('M86 64q12-4 15-18', '#e0457c')}${MAO(101, 45, '#ff7fa6')}</g>
      </g>
    </svg>`,
  ];
  const FRASES_BOAS_VINDAS = [
    (n) => `Que bom te ver por aqui, ${n}!`,
    (n) => `Olha só quem chegou: ${n}! Fica à vontade.`,
    (n) => `${n} acabou de chegar. Puxa uma cadeira!`,
  ];

  const REACAO = { cliques: [] };
  function soltarEmote(sid, e, x, meu = false) {
    const t = S.tiles.get(sid);
    if (!t || !EMOTES[e]) return;
    const camada = t.el.querySelector('.t-emotes');
    if (camada.childElementCount >= 30) camada.firstElementChild.remove(); // não deixa acumular
    const h = t.el.clientHeight || 300;
    const sorteio = (min, max) => min + Math.random() * (max - min);
    // cada um nasce num ponto diferente da parte de baixo, com tamanho, subida e balanço um pouco diferentes
    const tam = Math.round(Math.max(40, Math.min(92, h * 0.14)) * sorteio(0.8, 1.2));
    const el = document.createElement('div');
    el.className = `emote-voa emo-${EMOTES[e].id}${meu ? ' meu' : ''}`;
    el.style.cssText = `left:${(x * 100).toFixed(1)}%;bottom:${sorteio(2, 22).toFixed(1)}%;--tam:${tam}px`
      + `;--sobe:${Math.round(h * sorteio(0.45, 0.72))}px;--dx:${Math.round(sorteio(-0.9, 0.9) * tam)}px`
      + `;--gira:${sorteio(-14, 14).toFixed(1)}deg`;
    const lado = Math.random() < 0.5 ? -1 : 1;
    el.innerHTML = `<div class="ginga" style="--amp:${(lado * sorteio(6, 14)).toFixed(1)}%;--rot:${(lado * sorteio(5, 11)).toFixed(1)}deg`
      + `;animation-duration:${sorteio(0.55, 0.85).toFixed(2)}s;animation-delay:-${sorteio(0, 0.8).toFixed(2)}s">${EMOTES[e].svg}</div>`;
    camada.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }
  function reagir(sid, e) {
    if (!EMOTES[e]) return;
    const agora = Date.now();
    REACAO.cliques = REACAO.cliques.filter((t) => agora - t < 1000);
    if (REACAO.cliques.length >= 6) return; // no máximo 6 por segundo
    REACAO.cliques.push(agora);
    const x = Math.round((0.1 + Math.random() * 0.8) * 1000) / 1000;
    soltarEmote(sid, e, x, true); // o seu sempre aparece para você (mostra que foi)
    api('emote', { sid, e, x }).catch((err) => {
      if (/silenciad/i.test(err.message) && agora - (REACAO.avisou || 0) > 5000) { REACAO.avisou = agora; toast(err.message); }
    });
  }
  function onEmote(m) {
    if (!VER_EMOTES) return; // escolheu não ver os emotes dos outros
    if (typeof m.sid !== 'string' || !Number.isInteger(m.e) || !EMOTES[m.e]) return;
    soltarEmote(m.sid, m.e, Math.min(0.9, Math.max(0.1, Number(m.x) || 0.5)));
  }

  // ================= Qualidade da transmissão =================
  // 1) Formato do vídeo: o padrão do navegador é o VP8, que pixela bastante em jogo quando a
  //    internet aperta. Se o computador de quem transmite codifica vídeo na placa (AV1, VP9 ou
  //    H.264 "por hardware"), usa esse: imagem melhor com a mesma internet e sem pesar no jogo.
  //    Quem assiste escolhe o primeiro da lista que ele sabe mostrar, então nunca quebra.
  // 2) Medição a cada 3 s: resolução, quadros por segundo e o que está limitando (internet ou
  //    processador). Aparece na tela e vira um resumo no painel de admin quando a transmissão acaba.
  const CODEC = { promessa: null, escolha: null, testes: {} };
  // O H.264 só responde direito com os parâmetros completos (perfil básico e perfil alto)
  const CANDIDATOS_CODEC = [
    ['AV1', 'video/AV1', 'video/AV1'],
    ['VP9', 'video/VP9', 'video/VP9'],
    ['H.264', 'video/H264', 'video/H264;level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'],
    ['H.264', 'video/H264', 'video/H264;level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f'],
    ['H.264', 'video/H264', 'video/H264'],
  ];
  function escolherCodec() {
    if (salvo.codecSemPlaca === true) CODEC.semPlaca = true; // a placa já deu problema neste computador
    if (CODEC.semPlaca) return (CODEC.promessa ||= Promise.resolve(null));
    CODEC.promessa ||= (async () => {
      const caps = typeof RTCRtpSender !== 'undefined' ? RTCRtpSender.getCapabilities?.('video') : null;
      if (!caps?.codecs?.length || !navigator.mediaCapabilities?.encodingInfo) return null;
      const nota = { 'pela placa': 3, 'pelo processador': 2, 'não tem': 1 };
      for (const [nome, base, tipo] of CANDIDATOS_CODEC) {
        if (!caps.codecs.some((c) => c.mimeType.toLowerCase() === base.toLowerCase())) { CODEC.testes[nome] ||= 'não tem'; continue; }
        let r = null;
        try {
          r = await navigator.mediaCapabilities.encodingInfo({ type: 'webrtc', video: { contentType: tipo, width: 1920, height: 1080, bitrate: 4500000, framerate: 30 } });
        } catch { r = null; }
        const v = r?.supported ? (r.powerEfficient ? 'pela placa' : 'pelo processador') : 'não tem';
        if (!CODEC.testes[nome] || nota[v] > nota[CODEC.testes[nome]]) CODEC.testes[nome] = v;
      }
      const melhor = CANDIDATOS_CODEC.find(([nome]) => CODEC.testes[nome] === 'pela placa');
      return melhor ? melhor[1] : null;
    })().then((m) => { CODEC.escolha = m; return m; }).catch(() => null);
    return CODEC.promessa;
  }
  function aplicarCodec(pc, mime) {
    if (!mime) return;
    try {
      const tr = pc.getTransceivers().find((t) => t.sender.track?.kind === 'video');
      const caps = RTCRtpSender.getCapabilities('video');
      if (!tr?.setCodecPreferences || !caps) return;
      const eh = (c) => c.mimeType.toLowerCase() === mime.toLowerCase();
      const preferidos = caps.codecs.filter(eh).sort((a, b) => /profile-id=2/.test(a.sdpFmtpLine || '') - /profile-id=2/.test(b.sdpFmtpLine || ''));
      tr.setCodecPreferences([...preferidos, ...caps.codecs.filter((c) => !eh(c))]);
    } catch { /* fica o padrão do navegador */ }
  }
  if (navigator.mediaDevices?.getDisplayMedia) escolherCodec();

  const nomeCodec = (mime) => String(mime || '').replace(/^video\//i, '').toUpperCase();
  const media = (soma, n) => (n ? soma / n : 0);
  const QTX = { sessao: null, avisou: false, seguidos: 0 };
  function novaSessaoEnvio() {
    return { inicio: Date.now(), n: 0, somaAltura: 0, minAltura: 0, somaFps: 0, cpu: 0, banda: 0, somaBps: 0, nBps: 0, maxPessoas: 0, pessoas: new Set(), codec: '', hardware: null, ultimo: null, alturaFonte: 0, somaCaptura: 0, nCaptura: 0, encoder: '', trocouCodec: false };
  }
  async function medirEnvio() {
    if (!S.live || !S.out.size) return;
    const s = (QTX.sessao ||= novaSessaoEnvio());
    const alturas = [];
    const fpss = [];
    const motivos = [];
    const bpss = [];
    const capturas = [];
    for (const [vid, c] of S.out) {
      if (c.pc.connectionState !== 'connected') continue;
      let st;
      try { st = await c.pc.getStats(); } catch { continue; }
      s.pessoas.add(userById(vid)?.name || '?');
      st.forEach((r) => {
        // quantos quadros a captura (a tela, janela ou aba) está entregando
        if (r.type === 'media-source' && r.kind === 'video' && typeof r.framesPerSecond === 'number') capturas.push(r.framesPerSecond);
        if (r.type !== 'outbound-rtp' || r.kind !== 'video') return;
        if (r.encoderImplementation) s.encoder = String(r.encoderImplementation).slice(0, 60);
        if (r.frameHeight) alturas.push(r.frameHeight);
        if (r.framesPerSecond) fpss.push(r.framesPerSecond);
        motivos.push(r.qualityLimitationReason || 'none');
        const cod = r.codecId ? st.get(r.codecId) : null;
        if (cod?.mimeType) s.codec = nomeCodec(cod.mimeType);
        if (typeof r.powerEfficientEncoder === 'boolean') s.hardware = r.powerEfficientEncoder;
        else if (r.encoderImplementation) s.hardware = /MediaFoundation|External|Accelerat|NVENC|QSV|AMF|VideoToolbox|VAAPI/i.test(r.encoderImplementation);
        if (c.antes && r.timestamp > c.antes.t) bpss.push(((r.bytesSent - c.antes.b) * 8) / ((r.timestamp - c.antes.t) / 1000));
        c.antes = { b: r.bytesSent, t: r.timestamp };
      });
    }
    if (!alturas.length) return;
    const altura = Math.min(...alturas);
    s.alturaFonte = Math.max(s.alturaFonte, S.localStream?.getVideoTracks()[0]?.getSettings?.().height || 0);
    const fps = Math.round(media(fpss.reduce((a, b) => a + b, 0), fpss.length));
    const motivo = motivos.includes('cpu') ? 'cpu' : motivos.includes('bandwidth') ? 'bandwidth' : 'none';
    s.n++;
    s.somaAltura += altura;
    s.minAltura = s.minAltura ? Math.min(s.minAltura, altura) : altura;
    s.somaFps += fps;
    if (motivo === 'cpu') s.cpu++;
    if (motivo === 'bandwidth') s.banda++;
    if (bpss.length) { s.somaBps += media(bpss.reduce((a, b) => a + b, 0), bpss.length); s.nBps++; }
    s.maxPessoas = Math.max(s.maxPessoas, S.out.size);
    const captura = capturas.length ? Math.round(Math.max(...capturas)) : null;
    if (captura !== null) { s.somaCaptura += captura; s.nCaptura++; }
    s.ultimo = { altura, fps, motivo, captura };
    // A placa de vídeo não dá conta: a captura manda bem mais quadros do que ela monta, sem
    // limite de internet. Passa a montar no processador (e lembra disso neste computador).
    QTX.placaLenta = s.hardware === true && captura >= 20 && fps < captura * 0.6 && motivo === 'none' ? (QTX.placaLenta || 0) + 1 : 0;
    if (QTX.placaLenta >= 4 && !CODEC.semPlaca) trocarParaProcessador();
    // aviso uma vez por transmissão, se ficar limitado por ~30 s seguidos
    QTX.seguidos = motivo === 'none' ? 0 : QTX.seguidos + 1;
    if (QTX.seguidos >= 10 && !QTX.avisou) {
      QTX.avisou = true;
      toast(motivo === 'cpu'
        ? 'O computador está pesado (jogo e transmissão juntos), então a imagem foi reduzida. Em Ajustes, tente "1080p · 30 fps" ou "720p".'
        : 'A sua internet não está dando conta de mandar para todo mundo, então a imagem foi reduzida. Em Ajustes, escolha 720p ou informe o seu upload.', 12000);
    }
    atualizarTile(S.myId);
  }
  // O que o programa sabe da placa de vídeo (nome e se o Windows deixa ela codificar vídeo)
  let PLACA = null;
  function placaDeVideo() {
    if (typeof PROGRAMA?.placa !== 'function') return Promise.resolve(null);
    PLACA ||= PROGRAMA.placa().catch(() => null);
    return PLACA;
  }
  function textoDaPlaca(p) {
    if (!p) return '';
    const cod = { enabled: 'liberada', enabled_on: 'liberada', disabled_software: 'desligada', disabled_off: 'desligada', unavailable_software: 'indisponível' }[p.codificacao] || p.codificacao || '?';
    return `${p.nome || 'placa sem nome'}${p.outras > 1 ? ` (${p.outras} placas no PC)` : ''} · codificação de vídeo ${cod}${p.codecs?.length ? `: ${p.codecs.join(', ')}` : ', sem formatos'}`;
  }
  placaDeVideo().then((p) => { QTX.gpu = textoDaPlaca(p); });
  function trocarParaProcessador() {
    CODEC.semPlaca = true;
    CODEC.promessa = Promise.resolve(null);
    CODEC.escolha = null;
    salvar({ codecSemPlaca: true });
    if (QTX.sessao) QTX.sessao.trocouCodec = true;
    for (const vid of [...S.out.keys()]) {
      fecharOut(vid);
      sinal(vid, { k: 'restart' });
    }
    toast('A placa de vídeo não estava dando conta de montar a transmissão, então ela passou para o processador. Quem assiste pisca por um instante.', 10000);
  }
  function resumoEnvio() {
    const s = QTX.sessao;
    if (!s || !s.n || Date.now() - s.inicio < 20000) return null;
    return {
      papel: 'envio', duracao: Math.round((Date.now() - s.inicio) / 1000), pessoas: [...s.pessoas].slice(0, 12), maxPessoas: s.maxPessoas,
      qualidade: S.quality, upload: S.upload, alturaMedia: Math.round(media(s.somaAltura, s.n)), alturaMin: s.minAltura,
      fpsMedio: Math.round(media(s.somaFps, s.n)), cpuPct: Math.round((s.cpu / s.n) * 100), bandaPct: Math.round((s.banda / s.n) * 100), alturaFonte: s.alturaFonte,
      mbpsMedio: Math.round(media(s.somaBps, s.nBps) / 1e5) / 10, codec: s.codec, hardware: s.hardware, programa: !!PROGRAMA,
      fpsMeta: QUALIDADES[S.quality]?.fps || 0,
      fpsCaptura: s.nCaptura ? Math.round(media(s.somaCaptura, s.nCaptura)) : 0, encoder: s.encoder, trocouCodec: s.trocouCodec,
      placa: Object.entries(CODEC.testes).map(([k, v]) => `${k} ${v}`).join(', '),
      gpu: QTX.gpu || '',
    };
  }

  async function medirRecebimento() {
    for (const [sid, c] of S.inc) {
      if (c.pc.connectionState !== 'connected') continue;
      let st;
      try { st = await c.pc.getStats(); } catch { continue; }
      st.forEach((r) => {
        if (r.type !== 'inbound-rtp' || r.kind !== 'video') return;
        const q = (c.qual ||= { inicio: Date.now(), de: userById(sid)?.name || '?', n: 0, somaAltura: 0, minAltura: 0, maxAltura: 0, somaFps: 0, perdidos: 0, recebidos: 0, travadas: 0, codec: '' });
        const ant = c.qualAntes;
        if (ant) {
          q.perdidos += Math.max(0, (r.packetsLost || 0) - ant.perdidos);
          q.recebidos += Math.max(0, (r.packetsReceived || 0) - ant.recebidos);
        }
        const congeladas = Math.max(0, (r.freezeCount || 0) - (ant?.travadas ?? (r.freezeCount || 0)));
        if ((r.framesPerSecond || 0) >= 15) q.travadas += congeladas;
        c.qualAntes = { perdidos: r.packetsLost || 0, recebidos: r.packetsReceived || 0, travadas: r.freezeCount || 0 };
        const cod = r.codecId ? st.get(r.codecId) : null;
        if (cod?.mimeType) q.codec = nomeCodec(cod.mimeType);
        if (r.frameHeight) {
          q.n++;
          q.somaAltura += r.frameHeight;
          q.minAltura = q.minAltura ? Math.min(q.minAltura, r.frameHeight) : r.frameHeight;
          q.maxAltura = Math.max(q.maxAltura, r.frameHeight);
          q.somaFps += r.framesPerSecond || 0;
          c.qualAgora = { altura: r.frameHeight, fps: Math.round(r.framesPerSecond || 0), codec: q.codec };
        }
      });
      const t = S.tiles.get(sid);
      const etiqueta = t?.el.querySelector('.t-qual');
      if (etiqueta && c.qualAgora) {
        etiqueta.textContent = `${c.qualAgora.altura}p · ${c.qualAgora.fps} fps${c.qualAgora.codec ? ` · ${c.qualAgora.codec}` : ''}`;
        etiqueta.hidden = false;
      }
    }
  }
  function resumoRecebimento(c) {
    const q = c?.qual;
    if (!q || !q.n || Date.now() - q.inicio < 20000) return null;
    return {
      papel: 'recebe', de: q.de, duracao: Math.round((Date.now() - q.inicio) / 1000),
      alturaMedia: Math.round(media(q.somaAltura, q.n)), alturaMin: q.minAltura, alturaMax: q.maxAltura, fpsMedio: Math.round(media(q.somaFps, q.n)),
      perdaPct: q.recebidos + q.perdidos > 0 ? Math.round((q.perdidos / (q.recebidos + q.perdidos)) * 1000) / 10 : 0,
      travadas: q.travadas, codec: q.codec, programa: !!PROGRAMA,
    };
  }
  function enviarResumo(r, saindo) {
    if (!r || !S.token) return;
    if (saindo) {
      try { navigator.sendBeacon('/api/qualidade', new Blob([JSON.stringify({ token: S.token, ...r })], { type: 'application/json' })); } catch { /* ok */ }
    } else {
      api('qualidade', r).catch(() => {});
    }
  }
  function encerrarSessaoEnvio(saindo, motivo) {
    const r = resumoEnvio();
    if (r && motivo) r.fim = motivo;
    enviarResumo(r, saindo);
    QTX.sessao = null;
    QTX.avisou = false;
    QTX.seguidos = 0;
  }
  setInterval(() => {
    medirEnvio().catch(() => {});
    medirRecebimento().catch(() => {});
  }, 3000);
  window.addEventListener('pagehide', () => {
    if (S.live) encerrarSessaoEnvio(true, 'pagina');
    for (const c of S.inc.values()) enviarResumo(resumoRecebimento(c), true);
  });

  // ----- painel de admin: resumo de cada transmissão (aba Problemas) -----
  const FIM_DA_TRANSMISSAO = {
    voce: 'clicou em Parar', captura: 'a janela ou tela capturada sumiu', pagina: 'a página recarregou ou o programa fechou',
    sala: 'saiu da sala', 'sala-apagada': 'a sala foi apagada', conexao: 'não voltou depois de uma queda de conexão',
    admin: 'um admin encerrou', expulso: 'foi expulso', erro: 'erro ao começar',
  };
  function linhaDeQualidade(x, _i, lista) {
    const min = Math.max(1, Math.round(x.duracao / 60));
    if (x.papel === 'envio') {
      const causas = [];
      if (x.bandaPct >= 25) causas.push(`internet de quem transmite apertada em ${x.bandaPct}% do tempo`);
      if (x.cpuPct >= 25) causas.push(`computador de quem transmite sobrecarregado em ${x.cpuPct}% do tempo`);
      const ruim = x.alturaMedia && x.alturaMedia < (x.alturaFonte || 1080) * 0.8;
      const poucosQuadros = x.fpsMeta && x.fpsMedio < x.fpsMeta * 0.6;
      const capt = x.fpsCaptura || 0;
      const montagemLenta = capt >= 15 && x.fpsMedio < capt * 0.7; // a captura entregava, mas não saía
      const capturaLenta = capt > 0 && x.fpsMeta && capt < Math.min(24, x.fpsMeta * 0.6);
      return `<div class="ap-qual${causas.length || ruim ? ' ruim' : ''}">
        <div><b>${esc(x.nome)}</b> transmitiu ${min} min para ${esc((x.pessoas || []).join(', ') || '?')}
          <span class="muted small">· ${esc(quandoCurto(x.t))}${FIM_DA_TRANSMISSAO[x.fim] ? ` · terminou: ${x.fim === 'captura' && !x.programa ? 'a captura acabou (janela fechada ou "Parar compartilhamento" do navegador)' : FIM_DA_TRANSMISSAO[x.fim]}` : ''}</span></div>
        <div class="muted small">Enviou em média ${x.alturaMedia}p a ${x.fpsMedio} fps (${capt ? `a captura entregava ${capt} fps; ` : ''}menor: ${x.alturaMin}p${x.alturaFonte ? `; a tela capturada tem ${x.alturaFonte}p` : ''}), ${String(x.mbpsMedio).replace('.', ',')} Mbps por pessoa
          · ${esc(x.codec || '?')} ${x.hardware === true ? 'pela placa de vídeo' : x.hardware === false ? 'pelo processador' : ''}${x.encoder ? ` (${esc(x.encoder)})` : ''}${x.trocouCodec ? ', trocou da placa para o processador no meio' : ''}
          · qualidade escolhida ${esc(x.qualidade || '?')}, upload ${esc(x.upload === 'auto' ? 'automático' : `${x.upload} Mbps`)}${x.programa ? ' · programa' : ' · navegador'}</div>
        ${x.placa ? `<div class="muted small">Formatos que este computador codifica: ${esc(x.placa)}</div>` : ''}
        ${x.gpu ? `<div class="muted small">Placa de vídeo: ${esc(x.gpu)}</div>` : ''}
        <div class="ap-qual-causa">${causas.length ? `O que limitou: ${esc(causas.join('; '))}.`
          : ruim ? 'Imagem abaixo da tela capturada, sem limitação registrada (talvez a qualidade escolhida).'
            : montagemLenta ? `A captura entregava ${capt} fps, mas só ${x.fpsMedio} saíam: ${x.hardware ? 'a placa de vídeo' : 'o processador'} não deu conta de montar o vídeo.`
            : poucosQuadros && capturaLenta ? `A captura entregou só ${capt} fps (de ${x.fpsMeta} pedidos). Com imagem parada isso é normal; com vídeo ou jogo, o computador de quem transmite não deu conta de capturar (placa de vídeo ocupada, notebook na bateria ou em economia de energia).`
            : poucosQuadros ? `Sem limitação de internet ou computador. A captura entregou ${x.fpsMedio} fps (de ${x.fpsMeta} pedidos): isso acontece quando a imagem muda pouco ou quando o próprio jogo roda a menos quadros (muitos jogos antigos ficam presos em 25 a 30 fps). A transmissão não tem como ter mais quadros que o jogo.`
              : 'Sem limitação registrada.'}${x.fim === 'captura' && x.programa ? ' A transmissão parou sozinha porque a janela ou tela capturada sumiu (o jogo fechou, trocou de modo de tela ou reiniciou a imagem).'
              : x.fim === 'pagina' ? ' A transmissão parou porque a página recarregou ou o programa fechou (F5, falha ou atualização).'
                : x.fim === 'conexao' ? ' A transmissão parou porque a conexão com o servidor caiu e não deu para voltar para a sala.' : ''}</div>
      </div>`;
    }
    const travou = x.travadas >= Math.max(3, x.duracao / 30); // mais de uma travada a cada 30 s, com imagem se mexendo
    const baixa = x.alturaMedia && x.alturaMax && x.alturaMedia < x.alturaMax * 0.8;
    const ruim = x.perdaPct >= 2 || travou || baixa;
    // o resumo de quem transmitiu, no mesmo horário
    const env = (lista || []).find((y) => y.papel === 'envio' && y.nome === x.de && Math.abs(y.t - x.t) < 15 * 60e3);
    const envLimitado = env && (env.cpuPct >= 25 || env.bandaPct >= 25);
    const cada = x.travadas ? Math.round(x.duracao / x.travadas) : 0;
    return `<div class="ap-qual${ruim ? ' ruim' : ''}">
      <div><b>${esc(x.nome)}</b> assistiu ${esc(x.de)} por ${min} min <span class="muted small">· ${esc(quandoCurto(x.t))}</span></div>
      <div class="muted small">Recebeu em média ${x.alturaMedia}p a ${x.fpsMedio} fps (menor: ${x.alturaMin}p) · ${esc(x.codec || '?')} · ${String(x.perdaPct).replace('.', ',')}% de perda · ${x.travadas} ${x.travadas === 1 ? 'travada' : 'travadas'}${x.programa ? ' · programa' : ' · navegador'}</div>
      <div class="ap-qual-causa">${x.perdaPct >= 2 ? 'A internet de quem assiste (ou o caminho até ela) perdeu pacotes: a imagem pixela e trava.'
        : travou && envLimitado ? `A imagem travou ${x.travadas} vezes (uma a cada ${cada} s): o computador ou a internet de quem transmitiu ficou no limite (veja o resumo dele).`
        : travou ? `A imagem travou ${x.travadas} vezes (uma a cada ${cada} s), sem perder pacotes${env ? ' e sem o computador ou a internet de quem transmitiu no limite' : ''}. O mais provável é o próprio jogo dar umas engasgadas (a captura só manda imagem nova quando a tela muda) ou o computador de quem assiste estar ocupado na hora.`
          : baixa ? 'Imagem abaixo do normal em parte do tempo: veja o resumo de quem transmitiu no mesmo horário.' : 'Recebeu bem.'}</div>
    </div>`;
  }

  // ================= Voz (microfone) =================
  // Cada pessoa da sala se liga por voz com todas as outras (quem tem o id "menor" faz a
  // oferta, o outro responde). O microfone passa pela porta de voz (voz-portao.js): ela abre
  // quando a pessoa fala, ou só com o apertar-para-falar. No mudo, o microfone é desligado
  // de verdade (o sistema nem mostra o microfone em uso).
  function validarCfgVoz(c) {
    const x = c && typeof c === 'object' ? c : {};
    const sens = x.sensibilidade === 'auto' || (typeof x.sensibilidade === 'number' && x.sensibilidade >= -90 && x.sensibilidade <= 0) ? x.sensibilidade : 'auto';
    const a = x.atalho && typeof x.atalho === 'object' && typeof x.atalho.code === 'string' && /^[A-Za-z0-9]{2,24}$/.test(x.atalho.code)
      ? { code: x.atalho.code, ctrl: !!x.atalho.ctrl, alt: !!x.atalho.alt, shift: !!x.atalho.shift } : null;
    return {
      dispositivo: typeof x.dispositivo === 'string' ? x.dispositivo.slice(0, 300) : '',
      saida: typeof x.saida === 'string' ? x.saida.slice(0, 300) : '',
      modo: x.modo === 'ptt' ? 'ptt' : 'voz',
      atalho: a,
      sensibilidade: sens,
      ruido: x.ruido !== false,
      atalhoMudo: atalhoDeVoz(x.atalhoMudo),
      atalhoSurdo: atalhoDeVoz(x.atalhoSurdo),
    };
  }
  const VOZ = {
    cfg: validarCfgVoz(salvo.voz),
    mudo: salvo.vozMudo !== false, // na primeira vez começa mudo; depois lembra a escolha
    surdo: salvo.vozSurdo === true,
    mudoAntes: null,
    mic: null,
    pcs: new Map(),
    tentativas: new Map(),
    esperando: new Set(),
    teste: false,
    ptt: false,
    pttGlobal: '',
    gravandoPtt: false,
    aberto: false,
    falando: new Set(),
    ultimaFala: new Map(),
    modulo: null,
    versao: 0,
    aoMedir: null,
  };
  const silenciado = () => S.mutedUntil > Date.now();
  function estadoVoz() { return { mudo: VOZ.mudo || silenciado(), surdo: VOZ.surdo, efeitos: true }; }
  function guardarVoz() { salvar({ voz: VOZ.cfg, vozMudo: VOZ.mudo, vozSurdo: VOZ.surdo }); }
  const transmitindoVoz = () => !!S.sala && !VOZ.mudo && !VOZ.surdo && !silenciado();

  function erroMic(e) {
    if (e?.name === 'NotAllowedError') {
      return PROGRAMA
        ? 'O Windows bloqueou o microfone. Libere em Configurações → Privacidade e segurança → Microfone → "Permitir que aplicativos da área de trabalho acessem o microfone".'
        : 'O navegador não deixou usar o microfone. Libere no cadeado ao lado do endereço do site e tente de novo.';
    }
    if (e?.name === 'NotFoundError') return 'Nenhum microfone encontrado. Conecte um e tente de novo.';
    if (e?.name === 'NotReadableError') return 'O microfone está ocupado por outro programa ou com problema.';
    return `Não consegui ligar o microfone${e?.message ? `: ${e.message}` : '.'}`;
  }

  function trocarFaixaVoz(v, faixa) {
    const tr = v.pc.getTransceivers().find((t) => t.receiver.track?.kind === 'audio' && t.currentDirection !== 'stopped');
    if (tr) tr.sender.replaceTrack(faixa).catch(() => {});
  }

  function soltarMicrofone() {
    const m = VOZ.mic;
    if (!m) return;
    VOZ.mic = null;
    m.stream.getTracks().forEach((t) => t.stop());
    try { m.src.disconnect(); } catch { /* ok */ }
    try { m.portao.disconnect(); } catch { /* ok */ }
    m.faixa.stop();
    for (const v of VOZ.pcs.values()) trocarFaixaVoz(v, null);
    VOZ.aberto = false;
  }

  function aplicarPortao() {
    const modo = transmitindoVoz() ? VOZ.cfg.modo : 'mudo';
    VOZ.mic?.portao.port.postMessage({ modo, limiar: VOZ.cfg.sensibilidade === 'auto' ? null : VOZ.cfg.sensibilidade, ptt: VOZ.ptt });
    // No programa, o apertar-para-falar vale até dentro do jogo (o programa vigia a tecla)
    if (PROGRAMA?.ptt && !VOZ.gravandoPtt) {
      const vigiar = (modo === 'ptt' || (VOZ.teste && VOZ.cfg.modo === 'ptt')) && VOZ.cfg.atalho;
      const quer = vigiar ? VOZ.cfg.atalho : null;
      const chave = quer ? JSON.stringify(quer) : '';
      if (chave !== VOZ.pttGlobal) {
        VOZ.pttGlobal = chave;
        if (!quer) definirPtt(false);
        PROGRAMA.ptt(quer).catch(() => { VOZ.pttGlobal = ''; });
      }
    }
  }

  function desligarPorErro() {
    VOZ.teste = false; // o teste da janela de opções para até a pessoa mudar algo nela
    if (transmitindoVoz()) {
      VOZ.mudo = true;
      guardarVoz();
      if (S.sala) api('state', { sala: S.sala, live: S.live, ...estadoVoz() }).catch(() => {});
    }
    aplicarPortao();
    renderTudo();
  }


  async function atualizarMicrofone() {
    const quer = VOZ.teste || transmitindoVoz();
    if (!quer) {
      VOZ.versao++;
      VOZ.pedido = null;
      soltarMicrofone();
      aplicarPortao();
      renderVoz();
      return;
    }
    const m = VOZ.mic;
    if (m && m.dispositivo === VOZ.cfg.dispositivo && m.ruido === VOZ.cfg.ruido) {
      aplicarPortao();
      renderVoz();
      return;
    }
    // já tem um pedido igual em andamento (evita pedir a permissão duas vezes)
    if (VOZ.pedido && VOZ.pedido.dispositivo === VOZ.cfg.dispositivo && VOZ.pedido.ruido === VOZ.cfg.ruido) return;
    const versao = ++VOZ.versao;
    const pedido = { dispositivo: VOZ.cfg.dispositivo, ruido: VOZ.cfg.ruido };
    VOZ.pedido = pedido;
    try {
      await ligarMicrofone(versao);
    } finally {
      if (VOZ.pedido === pedido) VOZ.pedido = null;
    }
  }

  async function ligarMicrofone(versao) {
    soltarMicrofone();
    const c = audioCtx();
    if (!navigator.mediaDevices?.getUserMedia || !c?.audioWorklet) {
      toast('Este navegador não deixa usar o microfone.');
      return desligarPorErro();
    }
    const pedir = (semDispositivo) => navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: VOZ.cfg.ruido,
        autoGainControl: true,
        channelCount: 1,
        ...(VOZ.cfg.dispositivo && !semDispositivo ? { deviceId: { exact: VOZ.cfg.dispositivo } } : {}),
      },
      video: false,
    });
    let stream = null;
    let erro = null;
    try {
      stream = await pedir(false);
    } catch (e) {
      erro = e;
      if (VOZ.cfg.dispositivo && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        try {
          stream = await pedir(true);
          toast('O microfone escolhido não foi encontrado: usando o padrão do sistema.');
        } catch (e2) { erro = e2; }
      }
    }
    if (!stream) {
      if (versao === VOZ.versao) {
        toast(erroMic(erro), 10000);
        desligarPorErro();
      }
      return;
    }
    try {
      VOZ.modulo ||= c.audioWorklet.addModule('/voz-portao.js');
      await VOZ.modulo;
    } catch {
      VOZ.modulo = null;
      stream.getTracks().forEach((t) => t.stop());
      toast('Não consegui preparar o microfone. Recarregue a página.');
      return desligarPorErro();
    }
    if (versao !== VOZ.versao) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    if (c.state !== 'running') c.resume().catch(() => {});
    const src = c.createMediaStreamSource(stream);
    const portao = new AudioWorkletNode(c, 'portao-de-voz', {
      numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit',
    });
    const destino = c.createMediaStreamDestination();
    destino.channelCount = 1;
    src.connect(portao).connect(destino);
    portao.port.onmessage = (e) => medicaoVoz(e.data);
    const faixa = destino.stream.getAudioTracks()[0];
    VOZ.mic = { stream, src, portao, destino, faixa, dispositivo: VOZ.cfg.dispositivo, ruido: VOZ.cfg.ruido };
    stream.getAudioTracks()[0]?.addEventListener('ended', () => {
      if (VOZ.mic?.stream !== stream) return;
      soltarMicrofone();
      toast('O microfone foi desconectado.');
      atualizarMicrofone();
    });
    for (const v of VOZ.pcs.values()) trocarFaixaVoz(v, faixa);
    aplicarPortao();
    renderVoz();
    aplicarSaida();
  }

  function medicaoVoz(d) {
    if (!d || typeof d.nivel !== 'number') return;
    VOZ.aberto = !!d.aberto;
    if (VOZ.aoMedir) VOZ.aoMedir(d);
  }

  // ----- apertar-para-falar -----
  const BOTOES_MOUSE = { 1: 'MouseMiddle', 3: 'MouseBack', 4: 'MouseForward' };
  const ehModificador = (code) => /^(Control|Shift|Alt)(Left|Right)$/.test(code);
  function definirPtt(apertado) {
    if (VOZ.ptt === apertado) return;
    VOZ.ptt = apertado;
    VOZ.mic?.portao.port.postMessage({ ptt: apertado });
  }
  // No navegador (ou programa antigo) a tecla só funciona com a janela em foco
  const pttNaPagina = () => VOZ.cfg.modo === 'ptt' && !!VOZ.cfg.atalho && !PROGRAMA?.ptt && !VOZ.gravandoPtt;
  function combinaPtt(code, e) {
    const a = VOZ.cfg.atalho;
    if (!a || a.code !== code) return false;
    if (ehModificador(code) || code.startsWith('Mouse')) return true;
    // os modificadores escolhidos precisam estar apertados; outros a mais não atrapalham
    return (!a.ctrl || e.ctrlKey) && (!a.alt || e.altKey) && (!a.shift || e.shiftKey);
  }
  window.addEventListener('keydown', (e) => {
    if (!pttNaPagina() || e.repeat || !combinaPtt(e.code, e)) return;
    const digitando = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (digitando && !e.ctrlKey && !e.altKey && e.key.length === 1) return; // escrevendo no chat
    definirPtt(true);
  }, true);
  window.addEventListener('keyup', (e) => {
    const a = VOZ.cfg.atalho;
    if (!VOZ.ptt || PROGRAMA?.ptt || !a) return;
    const soltouModificador = (a.ctrl && /^Control/.test(e.code)) || (a.alt && /^Alt/.test(e.code)) || (a.shift && /^Shift/.test(e.code));
    if (a.code === e.code || soltouModificador) definirPtt(false);
  }, true);
  window.addEventListener('mousedown', (e) => {
    const code = BOTOES_MOUSE[e.button];
    if (code && pttNaPagina() && VOZ.cfg.atalho?.code === code) {
      e.preventDefault();
      definirPtt(true);
    }
  }, true);
  window.addEventListener('mouseup', (e) => {
    const code = BOTOES_MOUSE[e.button];
    if (code && VOZ.cfg.atalho?.code === code && !PROGRAMA?.ptt) {
      e.preventDefault();
      definirPtt(false);
    }
  }, true);
  window.addEventListener('blur', () => { if (!PROGRAMA?.ptt) definirPtt(false); });
  PROGRAMA?.aoPtt?.((apertado) => { if (!VOZ.gravandoPtt) definirPtt(!!apertado); });

  // ----- conexões de voz -----
  function sincronizarVoz() {
    const vizinhos = S.sala ? vizinhosDeSala() : new Set();
    for (const id of [...VOZ.pcs.keys()]) if (!vizinhos.has(id)) fecharVoz(id);
    for (const id of vizinhos) {
      if (VOZ.pcs.has(id)) continue;
      if (S.myId < id) iniciarVoz(id).catch(() => {});
      else if (!VOZ.esperando.has(id)) {
        // quem responde espera a oferta; se ela não vier, pede de novo
        VOZ.esperando.add(id);
        setTimeout(() => {
          VOZ.esperando.delete(id);
          if (!VOZ.pcs.has(id) && vizinhosDeSala().has(id)) sinal(id, { k: 'voz-oi' });
        }, 4000);
      }
    }
    for (const [id, v] of VOZ.pcs) aplicarSomDaVoz(id, v);
    atualizarMicrofone();
  }

  // ----- sons (soundboard) pela chamada -----
  // Vão numa segunda faixa de áudio da conexão de voz, separada da voz: assim cada pessoa
  // controla o volume (ou silencia) os sons de cada um sem mexer na voz dele.
  let EFEITOS = null; // { dest, faixa }
  function faixaDeEfeitos() {
    if (!EFEITOS) {
      const c = audioCtx();
      if (!c) return null;
      const dest = c.createMediaStreamDestination();
      EFEITOS = { dest, faixa: dest.stream.getAudioTracks()[0] };
    }
    return EFEITOS.faixa;
  }
  async function ligarFaixaDeEfeitos(tr) {
    if (!tr) return;
    tr.direction = 'sendrecv';
    const f = faixaDeEfeitos();
    if (f) await tr.sender.replaceTrack(f).catch(() => {});
  }

  function novaVoz(id) {
    fecharVoz(id);
    const pc = new RTCPeerConnection({ iceServers: S.iceServers });
    const v = { pc, sess: null, pending: [], audio: null, src: null, analisador: null, timer: 0 };
    VOZ.pcs.set(id, v);
    pc.onicecandidate = (e) => {
      if (e.candidate && v.sess) sinal(id, { k: 'voz-ice', sess: v.sess, c: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      // a primeira faixa é a voz; a segunda, os sons
      if (pc.getTransceivers().indexOf(e.transceiver) === 1) ouvirEfeitos(id, v, stream);
      else ouvirVoz(id, v, stream);
    };
    pc.onconnectionstatechange = () => {
      if (VOZ.pcs.get(id) !== v) return;
      clearTimeout(v.timer);
      const st = pc.connectionState;
      if (st === 'connected') VOZ.tentativas.set(id, 0);
      else if (st === 'failed') reconectarVoz(id);
      else if (st === 'disconnected') {
        v.timer = setTimeout(() => { if (VOZ.pcs.get(id) === v && pc.connectionState === 'disconnected') reconectarVoz(id); }, 7000);
      }
    };
    return v;
  }

  function fecharVoz(id) {
    const v = VOZ.pcs.get(id);
    if (!v) return;
    VOZ.pcs.delete(id);
    clearTimeout(v.timer);
    try { v.pc.close(); } catch { /* ok */ }
    if (v.audio) {
      v.audio.pause();
      v.audio.srcObject = null;
    }
    try { v.src?.disconnect(); } catch { /* ok */ }
    try { v.ganho?.disconnect(); } catch { /* ok */ }
    if (v.fx) {
      v.fx.audio.pause();
      v.fx.audio.srcObject = null;
      try { v.fx.src?.disconnect(); } catch { /* ok */ }
      try { v.fx.ganho?.disconnect(); } catch { /* ok */ }
    }
    VOZ.ultimaFala.delete(id);
  }
  function fecharTodaVoz() {
    for (const id of [...VOZ.pcs.keys()]) fecharVoz(id);
    VOZ.tentativas.clear();
  }

  async function iniciarVoz(id) {
    const v = novaVoz(id);
    v.sess = Math.random().toString(36).slice(2, 10);
    const tr = v.pc.addTransceiver('audio', { direction: 'sendrecv' });
    if (VOZ.mic) await tr.sender.replaceTrack(VOZ.mic.faixa).catch(() => {});
    // a faixa dos sons só vai para quem sabe recebê-la (página antiga trocaria a voz por ela)
    if (userById(id)?.efeitos) await ligarFaixaDeEfeitos(v.pc.addTransceiver('audio', { direction: 'sendrecv' }));
    const oferta = await v.pc.createOffer();
    if (VOZ.pcs.get(id) !== v) return;
    await v.pc.setLocalDescription(oferta);
    sinal(id, { k: 'voz-offer', sess: v.sess, sdp: v.pc.localDescription.toJSON() });
  }

  async function vozOferta(id, d) {
    if (!S.sala || typeof d.sess !== 'string') return;
    const v = novaVoz(id);
    v.sess = d.sess;
    await v.pc.setRemoteDescription(d.sdp);
    const tr = v.pc.getTransceivers()[0];
    if (tr) {
      tr.direction = 'sendrecv';
      if (VOZ.mic) await tr.sender.replaceTrack(VOZ.mic.faixa).catch(() => {});
    }
    await ligarFaixaDeEfeitos(v.pc.getTransceivers()[1]); // a faixa dos sons, se quem ofereceu mandou
    const resposta = await v.pc.createAnswer();
    if (VOZ.pcs.get(id) !== v) return;
    await v.pc.setLocalDescription(resposta);
    sinal(id, { k: 'voz-answer', sess: v.sess, sdp: v.pc.localDescription.toJSON() });
    const pend = v.pending;
    v.pending = [];
    for (const p of pend) if (p.sess === v.sess) v.pc.addIceCandidate(p.c).catch(() => {});
  }

  async function vozResposta(id, d) {
    const v = VOZ.pcs.get(id);
    if (!v || v.sess !== d.sess || v.pc.signalingState !== 'have-local-offer') return;
    await v.pc.setRemoteDescription(d.sdp);
    const pend = v.pending;
    v.pending = [];
    for (const p of pend) if (p.sess === v.sess) v.pc.addIceCandidate(p.c).catch(() => {});
  }

  function vozIce(id, d) {
    const v = VOZ.pcs.get(id);
    if (!v) return;
    if (d.sess === v.sess && v.pc.remoteDescription) v.pc.addIceCandidate(d.c).catch(() => {});
    else {
      v.pending.push(d);
      if (v.pending.length > 100) v.pending.shift();
    }
  }

  function reconectarVoz(id) {
    const n = (VOZ.tentativas.get(id) || 0) + 1;
    VOZ.tentativas.set(id, n);
    if (n > 4) return;
    setTimeout(() => {
      if (!vizinhosDeSala().has(id)) return;
      if (S.myId < id) iniciarVoz(id).catch(() => {});
      else sinal(id, { k: 'voz-oi' });
    }, 1500 * n);
  }

  // ----- ouvir os outros -----
  function aplicarSomDaVoz(id, v) {
    aplicarSomDosEfeitos(id, v);
    if (!v.audio) return;
    const cfg = volumeDaVoz(id);
    v.calado = VOZ.surdo || !!userById(id)?.silenciado || cfg.mudo;
    const vol = v.calado ? 0 : cfg.v;
    if (vol > 1 && v.src) {
      // acima de 100%: o som passa por um amplificador
      const c = audioCtx();
      if (!v.ganho) {
        v.ganho = c.createGain();
        v.src.connect(v.ganho);
        v.ganho.connect(c.destination);
      }
      v.ganho.gain.value = vol;
      v.audio.muted = true; // continua tocando (o navegador precisa), mas sem som por aqui
    } else {
      if (v.ganho) {
        try { v.ganho.disconnect(); } catch { /* ok */ }
        try { v.src?.disconnect(v.ganho); } catch { /* ok */ }
        v.ganho = null;
      }
      v.audio.muted = v.calado;
      v.audio.volume = Math.min(1, vol);
    }
  }
  function ouvirVoz(id, v, stream) {
    if (!v.audio) {
      v.audio = new Audio();
      v.audio.autoplay = true;
      definirSaida(v.audio);
    }
    v.audio.srcObject = stream;
    v.audio.play().catch(() => { /* destrava no próximo clique */ });
    try {
      const c = audioCtx();
      try { v.src?.disconnect(); } catch { /* ok */ }
      try { v.ganho?.disconnect(); } catch { /* ok */ }
      v.ganho = null;
      v.src = c.createMediaStreamSource(stream);
      v.analisador = c.createAnalyser();
      v.analisador.fftSize = 512;
      v.src.connect(v.analisador);
    } catch { v.analisador = null; }
    aplicarSomDaVoz(id, v);
  }
  function ouvirEfeitos(id, v, stream) {
    if (!v.fx) {
      v.fx = { audio: new Audio(), src: null, ganho: null };
      v.fx.audio.autoplay = true;
      definirSaida(v.fx.audio);
    }
    v.fx.audio.srcObject = stream;
    v.fx.audio.play().catch(() => { /* destrava no próximo clique */ });
    try { v.fx.src?.disconnect(); } catch { /* ok */ }
    try { v.fx.ganho?.disconnect(); } catch { /* ok */ }
    v.fx.ganho = null;
    try { v.fx.src = audioCtx().createMediaStreamSource(stream); } catch { v.fx.src = null; }
    aplicarSomDosEfeitos(id, v);
  }
  function aplicarSomDosEfeitos(id, v) {
    const fx = v.fx;
    if (!fx) return;
    const cfg = volumeDosEfeitos(id);
    const calado = VOZ.surdo || !!userById(id)?.silenciado || cfg.mudo;
    const vol = calado ? 0 : cfg.v;
    if (vol > 1 && fx.src) {
      // acima de 100%: passa por um amplificador
      if (!fx.ganho) {
        fx.ganho = audioCtx().createGain();
        fx.src.connect(fx.ganho);
        fx.ganho.connect(audioCtx().destination);
      }
      fx.ganho.gain.value = vol;
      fx.audio.muted = true;
    } else {
      if (fx.ganho) {
        try { fx.ganho.disconnect(); } catch { /* ok */ }
        try { fx.src?.disconnect(fx.ganho); } catch { /* ok */ }
        fx.ganho = null;
      }
      fx.audio.muted = calado;
      fx.audio.volume = Math.min(1, vol);
    }
  }
  function destravarVozes() {
    for (const v of VOZ.pcs.values()) {
      if (v.audio?.paused && v.audio.srcObject) v.audio.play().catch(() => {});
      if (v.fx?.audio.paused && v.fx.audio.srcObject) v.fx.audio.play().catch(() => {});
    }
  }
  document.addEventListener('pointerdown', destravarVozes, true);
  document.addEventListener('keydown', destravarVozes, true);

  // Quem está falando: contorno verde no avatar
  const bufVoz = new Float32Array(512);
  setInterval(() => {
    const agora = Date.now();
    if (VOZ.aberto && transmitindoVoz()) VOZ.ultimaFala.set(S.myId, agora);
    for (const [id, v] of VOZ.pcs) {
      if (!v.analisador || v.calado) continue;
      v.analisador.getFloatTimeDomainData(bufVoz);
      let soma = 0;
      for (const x of bufVoz) soma += x * x;
      if (10 * Math.log10(soma / bufVoz.length + 1e-12) > -55) VOZ.ultimaFala.set(id, agora);
    }
    const falando = new Set();
    for (const [id, t] of VOZ.ultimaFala) if (agora - t < 300) falando.add(id);
    VOZ.falando = falando;
    for (const el of document.querySelectorAll('[data-voz]')) el.classList.toggle('falando', falando.has(el.dataset.voz));
  }, 100);

  // ----- botões -----
  function mudouVoz() {
    guardarVoz();
    for (const [id, v] of VOZ.pcs) aplicarSomDaVoz(id, v);
    aplicarMudoEco(); // as transmissões também ficam mudas quando a sala está muda
    if (S.sala) api('state', { sala: S.sala, live: S.live, ...estadoVoz() }).catch(() => {});
    atualizarMicrofone();
    renderTudo();
  }
  function alternarMudo() {
    if (VOZ.mudo || VOZ.surdo) {
      if (silenciado()) return toast('Um admin silenciou você: o microfone fica desligado até o silêncio acabar.');
      VOZ.mudo = false;
      if (VOZ.surdo) {
        VOZ.surdo = false;
        VOZ.mudoAntes = null;
      }
      if (VOZ.cfg.modo === 'ptt' && !VOZ.cfg.atalho) toast('Escolha a tecla do apertar-para-falar em Opções de áudio.', 6000);
    } else {
      VOZ.mudo = true;
    }
    mudouVoz();
  }
  function alternarSurdo() {
    if (VOZ.surdo) {
      VOZ.surdo = false;
      if (VOZ.mudoAntes !== null) VOZ.mudo = VOZ.mudoAntes;
      VOZ.mudoAntes = null;
    } else {
      VOZ.surdo = true;
      VOZ.mudoAntes = VOZ.mudo;
      VOZ.mudo = true; // mutar a sala também desliga o microfone
    }
    mudouVoz();
  }

  function pintarBotaoDeMic(b) {
    const mudo = VOZ.mudo || silenciado();
    b.innerHTML = icon(mudo ? 'micOff' : 'mic');
    b.classList.toggle('desligado', mudo);
    b.title = silenciado() ? 'Um admin silenciou você' : mudo ? 'Ligar o microfone' : 'Desligar o microfone (mudo)';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(mudo));
  }
  function pintarBotaoDeSurdo(b) {
    b.innerHTML = icon(VOZ.surdo ? 'foneOff' : 'fone');
    b.classList.toggle('desligado', VOZ.surdo);
    b.title = VOZ.surdo ? 'Ligar o som da sala' : 'Mutar a sala (você para de ouvir e o microfone desliga)';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(VOZ.surdo));
  }
  // os mesmos dois botões na barra de baixo de cada transmissão (aparecem só na tela cheia)
  function vozNoTile(t) {
    pintarBotaoDeMic(t.el.querySelector('[data-act="voz-mic"]'));
    pintarBotaoDeSurdo(t.el.querySelector('[data-act="voz-surdo"]'));
  }
  function renderVoz() {
    for (const sel of ['#micBtn', '#vpMic']) if ($(sel)) pintarBotaoDeMic($(sel));
    for (const sel of ['#surdoBtn', '#vpSurdo']) if ($(sel)) pintarBotaoDeSurdo($(sel));
    for (const t of S.tiles.values()) vozNoTile(t);
  }

  // ícones de mudo / sala muda ao lado do nome de cada pessoa da sala
  function vozIcones(u) {
    if (!u.sala) return '';
    const paraMim = u.id !== S.myId && VOLUMES_VOZ[u.name]?.mudo ? `<span class="voz-icone" title="Voz silenciada para você">${icon('mute')}</span>` : '';
    const somRecente = SOM_RECENTE.get(u.id);
    const tocou = somRecente && somRecente.ate > Date.now() ? `<span class="voz-som" title="Tocou: ${esc(somRecente.nome)}">${esc(somRecente.emoji)}</span>` : '';
    const sonsMudos = u.id !== S.myId && VOLUMES_EFEITOS[u.name]?.mudo ? `<span class="voz-icone" title="Sons silenciados para você">${icon('somOff')}</span>` : '';
    return tocou + paraMim + sonsMudos + vozIconesDoUsuario(u);
  }
  const SOM_RECENTE = new Map(); // id -> { emoji, nome, ate }
  function vozIconesDoUsuario(u) {
    if (u.silenciado) return `<span class="voz-icone vermelho" title="Silenciado por um admin">${icon('micOff')}</span>`;
    if (u.surdo) return `<span class="voz-icone" title="Mutou a sala">${icon('foneOff')}</span>`;
    if (u.mudo) return `<span class="voz-icone" title="Microfone desligado">${icon('micOff')}</span>`;
    return '';
  }
  const avatarVoz = (u) => avatar(u).replace('<div class="avatar', `<div data-voz="${esc(u.id)}" class="avatar`);

  // ----- atalhos para mutar o microfone e mutar a sala -----
  // Valem as mesmas regras dos atalhos globais dos sons: Ctrl ou Alt com uma tecla, ou F1 a F24
  // (assim não atrapalham a digitação em outros programas). No programa funcionam dentro do jogo.
  function atalhoDeVoz(a) {
    const teclas = /^(Key[A-Z]|Digit\d|Numpad\d|F([1-9]|1\d|2[0-4])|Space|Tab|Enter|Backspace|Insert|Delete|Home|End|PageUp|PageDown|Arrow(Up|Down|Left|Right)|Numpad(Add|Subtract|Multiply|Divide|Decimal))$/;
    if (!a || typeof a !== 'object' || a.meta || typeof a.code !== 'string' || !teclas.test(a.code)) return null;
    if (!a.ctrl && !a.alt && !/^F\d/.test(a.code)) return null;
    return { code: a.code, ctrl: !!a.ctrl, alt: !!a.alt, shift: !!a.shift };
  }
  // som curtinho de confirmação (só você ouve): sobe ao ligar, desce ao desligar
  function somDeConfirmacao(sobe, grave) {
    const c = audioCtx();
    if (!c) return;
    if (c.state !== 'running') c.resume().catch(() => {});
    const base = grave ? 392 : 587.3;
    const notas = sobe ? [base, base * 1.335] : [base * 1.335, base];
    const t0 = c.currentTime + 0.02;
    notas.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const t = t0 + i * 0.09;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.18);
    });
  }
  function alternarMudoPorAtalho() {
    if (silenciado()) return toast('Um admin silenciou você: o microfone fica desligado até o silêncio acabar.');
    alternarMudo();
    const ligado = !VOZ.mudo && !VOZ.surdo;
    somDeConfirmacao(ligado, false);
    toast(ligado ? 'Microfone ligado' : 'Microfone desligado', 1800);
  }
  function alternarSurdoPorAtalho() {
    alternarSurdo();
    somDeConfirmacao(!VOZ.surdo, true);
    toast(VOZ.surdo ? 'Sala mutada: você não ouve nada e o microfone desligou' : 'Som da sala de volta', 2200);
  }

  // ----- volume de cada voz (só muda o que você ouve) -----
  // Guardado pelo nome, como o volume das transmissões. Até 100% o som sai pelo caminho normal
  // (o cancelamento de eco funciona melhor assim); acima disso passa por um amplificador.
  const VOLUMES_VOZ = salvo.volVoz && typeof salvo.volVoz === 'object' ? { ...salvo.volVoz } : {};
  function volumeDaVoz(id) {
    const x = VOLUMES_VOZ[userById(id)?.name];
    return {
      v: typeof x?.v === 'number' ? Math.min(2, Math.max(0, x.v)) : 1,
      mudo: x?.mudo === true,
    };
  }
  const VOLUMES_EFEITOS = salvo.volEfeitos && typeof salvo.volEfeitos === 'object' ? { ...salvo.volEfeitos } : {};
  function volumeDosEfeitos(id) {
    const x = VOLUMES_EFEITOS[userById(id)?.name];
    return {
      v: typeof x?.v === 'number' ? Math.min(2, Math.max(0, x.v)) : 1,
      mudo: x?.mudo === true,
    };
  }
  function guardarVolumeDosEfeitos(id, mudanca) {
    const nome = userById(id)?.name;
    if (!nome) return;
    const novo = { ...volumeDosEfeitos(id), ...mudanca };
    if (novo.v === 1 && !novo.mudo) delete VOLUMES_EFEITOS[nome];
    else VOLUMES_EFEITOS[nome] = novo;
    salvar({ volEfeitos: VOLUMES_EFEITOS });
    const v = VOZ.pcs.get(id);
    if (v) aplicarSomDosEfeitos(id, v);
  }
  function guardarVolumeDaVoz(id, mudanca) {
    const nome = userById(id)?.name;
    if (!nome) return;
    const novo = { ...volumeDaVoz(id), ...mudanca };
    if (novo.v === 1 && !novo.mudo) delete VOLUMES_VOZ[nome];
    else VOLUMES_VOZ[nome] = novo;
    salvar({ volVoz: VOLUMES_VOZ });
    const v = VOZ.pcs.get(id);
    if (v) aplicarSomDaVoz(id, v);
  }
  function fecharVolumeDaVoz() {
    const el = $('#volVoz');
    if (!el) return;
    el.remove();
    if (VOZ.volumeMudou) { VOZ.volumeMudou = false; renderTudo(); }
  }
  function abrirVolumeDaVoz(id, ancora) {
    const u = userById(id);
    if (!u || id === S.myId) return;
    const jaAberto = $('#volVoz')?.dataset.uid === id;
    fecharVolumeDaVoz();
    if (jaAberto) return;
    const cfg = volumeDaVoz(id);
    const fx = volumeDosEfeitos(id);
    const el = document.createElement('div');
    el.className = 'vol-voz';
    el.id = 'volVoz';
    el.dataset.uid = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', `Volume da voz de ${u.name}`);
    el.innerHTML = `<div class="vv-topo">${avatar(u)}<strong class="ellipsis">${esc(u.name)}</strong></div>
      <div class="vv-linha"><span>Volume da voz</span><span class="vv-pct">${Math.round(cfg.v * 100)}%</span></div>
      <input type="range" class="vv-voz" min="0" max="2" step="0.05" value="${cfg.v}" aria-label="Volume da voz de ${esc(u.name)}">
      <label class="sons-check"><input type="checkbox" class="vv-mudo"${cfg.mudo ? ' checked' : ''}> Silenciar a voz para mim</label>
      <div class="vv-linha vv-sep"><span>Volume dos sons</span><span class="vv-pct vv-pct-fx">${Math.round(fx.v * 100)}%</span></div>
      <input type="range" class="vv-fx" min="0" max="2" step="0.05" value="${fx.v}" aria-label="Volume dos sons que ${esc(u.name)} toca">
      <label class="sons-check"><input type="checkbox" class="vv-fx-mudo"${fx.mudo ? ' checked' : ''}> Silenciar os sons para mim</label>
      <div class="vv-rodape"><span class="vo-dica">Só muda o que você ouve.</span><button type="button" class="btn sm ghost vv-reset">100%</button></div>`;
    document.body.appendChild(el);
    const r = ancora.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const x = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
    const y = r.bottom + 8 + h < innerHeight ? r.bottom + 8 : Math.max(8, r.top - h - 8);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const faixa = el.querySelector('.vv-voz');
    const pct = el.querySelector('.vv-pct');
    const faixaFx = el.querySelector('.vv-fx');
    const pctFx = el.querySelector('.vv-pct-fx');
    faixaFx.addEventListener('input', () => {
      const v = Number(faixaFx.value);
      pctFx.textContent = `${Math.round(v * 100)}%`;
      guardarVolumeDosEfeitos(id, { v });
    });
    el.querySelector('.vv-fx-mudo').addEventListener('change', (e) => {
      guardarVolumeDosEfeitos(id, { mudo: e.target.checked });
      renderTudo();
    });
    faixa.addEventListener('input', () => {
      const v = Number(faixa.value);
      pct.textContent = `${Math.round(v * 100)}%`;
      guardarVolumeDaVoz(id, { v });
    });
    el.querySelector('.vv-mudo').addEventListener('change', (e) => {
      guardarVolumeDaVoz(id, { mudo: e.target.checked });
      VOZ.volumeMudou = true;
    });
    el.querySelector('.vv-reset').addEventListener('click', () => {
      faixa.value = '1';
      pct.textContent = '100%';
      guardarVolumeDaVoz(id, { v: 1 });
      faixaFx.value = '1';
      pctFx.textContent = '100%';
      guardarVolumeDosEfeitos(id, { v: 1 });
    });
    faixa.focus();
  }
  // clicar em alguém da sala (na lista da esquerda ou em cima da transmissão) abre o volume
  document.addEventListener('click', (e) => {
    const alvo = e.target.closest?.('[data-pessoa]');
    if (alvo) {
      e.preventDefault();
      return abrirVolumeDaVoz(alvo.dataset.pessoa, alvo);
    }
    if ($('#volVoz') && !e.target.closest('#volVoz')) fecharVolumeDaVoz();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#volVoz')) { e.preventDefault(); fecharVolumeDaVoz(); }
  }, true);

  // ----- janela "Opções de áudio" -----
  async function abrirOpcoesAudio() {
    let cfg = { ...VOZ.cfg };
    const pct = (db) => Math.max(0, Math.min(100, ((db + 80) / 80) * 100));
    abrirModal({
      titulo: 'Opções de áudio',
      ok: 'Pronto',
      corpo: `<div class="voz-opcoes" id="vozOpcoes">
        <label class="vo-campo"><span class="ap-rotulo">Microfone</span>
          <select id="voDispositivo"><option value="">Padrão do sistema</option></select></label>
        <div class="vo-campo"><label class="ap-rotulo" for="voSaida">Saída de áudio (alto-falante ou fone)</label>
          <div class="vo-linha"><select id="voSaida"${PODE_ESCOLHER_SAIDA ? '' : ' disabled'}><option value="">Padrão do sistema</option></select>
            <button type="button" class="btn sm" id="voTestarSaida">Testar som</button></div>
          ${PODE_ESCOLHER_SAIDA ? '' : '<p class="vo-dica">Este navegador não deixa escolher a saída: o som sai no padrão do sistema. No Chrome, no Edge e no programa para Windows dá para escolher.</p>'}</div>
        <div><span class="ap-rotulo">Quando o microfone abre</span>
          <div class="segmento" role="radiogroup" aria-label="Modo do microfone">
            <label><input type="radio" name="vmodo" value="voz"${cfg.modo === 'voz' ? ' checked' : ''}><span>Quando eu falo</span></label>
            <label><input type="radio" name="vmodo" value="ptt"${cfg.modo === 'ptt' ? ' checked' : ''}><span>Apertar para falar</span></label>
          </div></div>
        <div id="voPtt">
          <span class="ap-rotulo">Tecla do apertar-para-falar</span>
          <div class="sb-atalho"><kbd id="voAtalho"></kbd><button type="button" class="btn sm" id="voGravar">Gravar tecla</button></div>
          <p class="vo-dica">${PROGRAMA?.ptt
            ? 'Funciona até dentro de jogos. Pode ser uma tecla, uma combinação ou um botão do mouse (meio ou laterais).'
            : 'No navegador, só funciona com esta janela em foco. No programa para Windows, funciona até dentro de jogos.'}</p>
        </div>
        <div>
          <span class="ap-rotulo">Teste do microfone</span>
          <div class="medidor" id="voMedidor" aria-hidden="true"><div class="nivel"></div><div class="marca"></div></div>
          <div id="voSens">
            <label class="sons-check"><input type="checkbox" id="voAuto"${cfg.sensibilidade === 'auto' ? ' checked' : ''}> Sensibilidade automática (recomendado)</label>
            <input type="range" id="voLimiar" min="-80" max="-10" step="1" value="${cfg.sensibilidade === 'auto' ? -50 : cfg.sensibilidade}" aria-label="Sensibilidade do microfone">
          </div>
          <p class="vo-dica" id="voMedDica"></p>
        </div>
        <label class="sons-check"><input type="checkbox" id="voRuido"${cfg.ruido ? ' checked' : ''}> Supressão de ruído (tira barulho de teclado, ventilador e fundo)</label>
        <div class="vo-atalhos"><span class="ap-rotulo">Atalhos</span>
          <div class="vo-atalho"><span>Ligar e desligar o microfone</span><kbd data-ver="atalhoMudo"></kbd>
            <button type="button" class="btn sm" data-gravar="atalhoMudo">Gravar</button><button type="button" class="btn sm ghost" data-limpar="atalhoMudo">Tirar</button></div>
          <div class="vo-atalho"><span>Mutar e desmutar a sala</span><kbd data-ver="atalhoSurdo"></kbd>
            <button type="button" class="btn sm" data-gravar="atalhoSurdo">Gravar</button><button type="button" class="btn sm ghost" data-limpar="atalhoSurdo">Tirar</button></div>
          <p class="vo-dica">Use Ctrl ou Alt com uma tecla (ex.: Ctrl+M) ou uma das teclas F1 a F24. ${PROGRAMA
            ? 'Funcionam até dentro de jogos, com um somzinho de confirmação.'
            : 'No navegador, só com esta janela em foco. No programa para Windows, funcionam até dentro de jogos.'}</p>
        </div>
        <p class="vo-dica">O cancelamento de eco fica sempre ligado. Com fone de ouvido o som fica ainda melhor.</p>
      </div>`,
      aoConfirmar: () => {},
    });
    $('#modalCancel').hidden = true; // tudo vale na hora
    const caixa = $('#vozOpcoes');
    const sel = $('#voDispositivo');
    const nivel = caixa.querySelector('.medidor .nivel');
    const marca = caixa.querySelector('.medidor .marca');
    const limiar = $('#voLimiar');

    const aplicar = () => {
      VOZ.teste = document.body.contains(caixa);
      VOZ.cfg = validarCfgVoz(cfg);
      cfg = { ...VOZ.cfg };
      guardarVoz();
      atualizarMicrofone();
      sincronizarAtalhos();
      mostrar();
    };
    // gravar os atalhos de microfone e de sala (usa a mesma gravação dos sons)
    const gravarAtalho = (campo, btn) => {
      if (SB.gravando) return;
      btn.textContent = 'Aperte as teclas…';
      btn.classList.add('primary');
      SB.gravando = (novo, cancelou) => {
        SB.gravando = null;
        btn.textContent = 'Gravar';
        btn.classList.remove('primary');
        if (!cancelou) {
          const a = atalhoDeVoz(novo);
          const outro = campo === 'atalhoMudo' ? 'atalhoSurdo' : 'atalhoMudo';
          const ptt = cfg.modo === 'ptt' && cfg.atalho;
          if (!a) toast('Use Ctrl ou Alt junto com uma tecla (ex.: Ctrl+M), ou uma das teclas F1 a F24.', 6000);
          else if (mesmoAtalho(a, ATALHO_PARAR)) toast('Alt+0 já é o atalho de "Parar sons".');
          else if (ptt && ptt.code === a.code && !!ptt.ctrl === a.ctrl && !!ptt.alt === a.alt && !!ptt.shift === a.shift) toast('Essa já é a tecla do apertar-para-falar.');
          else {
            if (mesmoAtalho(cfg[outro], a)) cfg[outro] = null;
            const som = SB.slots.find((x) => mesmoAtalho(x.atalho, a));
            if (som) {
              som.atalho = null;
              guardarSB();
              toast(`O atalho ${textoAtalho(a)} saiu do som "${som.nome}".`, 5000);
            }
            cfg[campo] = a;
          }
        }
        aplicar();
      };
      sincronizarAtalhos(); // solta os atalhos globais enquanto grava
    };
    caixa.addEventListener('click', (e) => {
      const g = e.target.closest('[data-gravar]');
      if (g) return gravarAtalho(g.dataset.gravar, g);
      const l = e.target.closest('[data-limpar]');
      if (l) {
        cfg[l.dataset.limpar] = null;
        aplicar();
      }
    });
    const mostrar = () => {
      if (!document.body.contains(caixa)) return;
      const aviso = !S.sala ? 'Você não está numa sala: é só um teste.'
        : VOZ.surdo || VOZ.mudo || silenciado() ? 'Seu microfone está desligado: é só um teste, ninguém está ouvindo.' : '';
      $('#voPtt').hidden = cfg.modo !== 'ptt';
      $('#voSens').hidden = cfg.modo !== 'voz';
      marca.hidden = cfg.modo !== 'voz';
      $('#voAtalho').textContent = cfg.atalho ? textoAtalho(cfg.atalho) : 'nenhuma';
      for (const k of caixa.querySelectorAll('[data-ver]')) k.textContent = cfg[k.dataset.ver] ? textoAtalho(cfg[k.dataset.ver]) : 'nenhum';
      for (const b of caixa.querySelectorAll('[data-limpar]')) b.hidden = !cfg[b.dataset.limpar];
      limiar.disabled = cfg.sensibilidade === 'auto';
      $('#voMedDica').textContent = cfg.modo === 'ptt'
        ? (cfg.atalho ? `Segure ${textoAtalho(cfg.atalho)} e fale: a barra fica verde enquanto você segura.` : 'Escolha uma tecla para poder falar.')
        : cfg.sensibilidade === 'auto'
          ? 'Fale normalmente: a barra fica verde quando o microfone abre. No automático, o limite (a marca) acompanha o barulho do seu ambiente.'
          : 'Arraste para a direita se o microfone abrir com barulho de fundo, ou para a esquerda se cortar a sua voz.';
      if (aviso) $('#voMedDica').textContent += ` ${aviso}`;
    };
    VOZ.aoMedir = (d) => {
      nivel.style.width = `${pct(d.nivel)}%`;
      const abre = cfg.modo === 'ptt' ? VOZ.ptt : !!d.voz;
      nivel.classList.toggle('aberto', abre);
      marca.style.left = `${pct(d.limiar)}%`;
      if (cfg.sensibilidade === 'auto') limiar.value = String(Math.round(d.limiar));
    };

    async function listarMics() {
      let todos = [];
      try { todos = await navigator.mediaDevices.enumerateDevices(); } catch { todos = []; }
      if (!document.body.contains(sel)) return;
      const ok = (d) => d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications';
      const preencher = (el, tipo, rotulo, atual) => {
        const devs = todos.filter((d) => d.kind === tipo && ok(d));
        el.innerHTML = '<option value="">Padrão do sistema</option>'
          + devs.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || `${rotulo} ${i + 1}`)}</option>`).join('');
        el.value = devs.some((d) => d.deviceId === atual) ? atual : '';
      };
      preencher(sel, 'audioinput', 'Microfone', cfg.dispositivo);
      if (PODE_ESCOLHER_SAIDA) preencher($('#voSaida'), 'audiooutput', 'Saída', cfg.saida);
    }

    caixa.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'voDispositivo') cfg.dispositivo = t.value;
      else if (t.id === 'voSaida') {
        cfg.saida = t.value;
        VOZ.cfg = validarCfgVoz(cfg);
        guardarVoz();
        aplicarSaida().then(tocarTesteDeSaida);
        return;
      }
      else if (t.name === 'vmodo') {
        cfg.modo = t.value;
        if (cfg.modo === 'ptt' && !cfg.atalho) setTimeout(() => $('#voGravar')?.click(), 50);
      } else if (t.id === 'voAuto') cfg.sensibilidade = t.checked ? 'auto' : Number(limiar.value);
      else if (t.id === 'voRuido') cfg.ruido = t.checked;
      else return;
      aplicar();
    });
    limiar.addEventListener('input', () => {
      if (cfg.sensibilidade === 'auto') return;
      cfg.sensibilidade = Number(limiar.value);
      aplicar();
    });

    $('#voTestarSaida').addEventListener('click', tocarTesteDeSaida);

    // gravar a tecla do apertar-para-falar
    $('#voGravar').addEventListener('click', () => {
      if (VOZ.gravandoPtt) return;
      const btn = $('#voGravar');
      VOZ.gravandoPtt = true;
      definirPtt(false);
      if (PROGRAMA?.ptt) { VOZ.pttGlobal = ''; PROGRAMA.ptt(null).catch(() => {}); }
      btn.textContent = 'Aperte a tecla…';
      btn.classList.add('primary');
      let modificador = null;
      const fim = (atalho) => {
        VOZ.cancelarGravacao = null;
        window.removeEventListener('keydown', tecla, true);
        window.removeEventListener('keyup', tecla, true);
        window.removeEventListener('mousedown', mouse, true);
        VOZ.gravandoPtt = false;
        btn.textContent = 'Gravar tecla';
        btn.classList.remove('primary');
        if (atalho) cfg.atalho = atalho;
        aplicar();
      };
      const tecla = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.code.startsWith('Meta')) return;
        if (e.type === 'keydown') {
          if (e.key === 'Escape') return fim(null);
          if (ehModificador(e.code)) { modificador = e.code; return; }
          return fim({ code: e.code, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey });
        }
        // soltou um modificador sozinho: a tecla é ele mesmo (Ctrl esquerdo, Alt Gr...)
        if (modificador === e.code) fim({ code: e.code, ctrl: false, alt: false, shift: false });
      };
      const mouse = (e) => {
        const code = BOTOES_MOUSE[e.button];
        if (!code) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        fim({ code, ctrl: false, alt: false, shift: false });
      };
      VOZ.cancelarGravacao = () => fim(null);
      window.addEventListener('keydown', tecla, true);
      window.addEventListener('keyup', tecla, true);
      window.addEventListener('mousedown', mouse, true);
    });

    mostrar();
    // microfone ligado enquanto a janela está aberta (só para o medidor, nada sai se você estiver mudo)
    VOZ.teste = true;
    atualizarMicrofone().then(listarMics);
    const aoMudarDispositivos = () => listarMics();
    navigator.mediaDevices?.addEventListener?.('devicechange', aoMudarDispositivos);
    const obs = new MutationObserver(() => {
      if (!$('#modal').hidden && document.body.contains(caixa)) return;
      obs.disconnect();
      navigator.mediaDevices?.removeEventListener?.('devicechange', aoMudarDispositivos);
      VOZ.aoMedir = null;
      VOZ.teste = false;
      VOZ.cancelarGravacao?.();
      if (SB.gravando) SB.gravando(null, true);
      atualizarMicrofone();
    });
    obs.observe($('#modal'), { attributes: true, attributeFilter: ['hidden'] });
    obs.observe($('#modalBody'), { childList: true });
  }

  // ================= Saída de áudio (alto-falante ou fone) =================
  // Vozes, transmissões e sons saem no aparelho escolhido. Se ele for desconectado, o som
  // volta para o padrão do sistema sozinho, e volta para ele quando reconectar.
  const PODE_ESCOLHER_SAIDA = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
  let saidaAtual = '';
  async function saidasDisponiveis() {
    try {
      return (await navigator.mediaDevices.enumerateDevices())
        .filter((d) => d.kind === 'audiooutput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications');
    } catch {
      return [];
    }
  }
  function definirSaida(el) {
    if (!PODE_ESCOLHER_SAIDA || !el || (el.sinkId || '') === saidaAtual) return;
    el.setSinkId(saidaAtual).catch(() => {});
  }
  function definirSaidaDoAudio(c) {
    if (!c?.setSinkId) return;
    const atual = typeof c.sinkId === 'string' ? c.sinkId : '';
    if (atual !== saidaAtual) c.setSinkId(saidaAtual).catch(() => {});
  }
  async function aplicarSaida() {
    if (!PODE_ESCOLHER_SAIDA) return;
    const quer = VOZ.cfg.saida;
    saidaAtual = quer && (await saidasDisponiveis()).some((d) => d.deviceId === quer) ? quer : '';
    definirSaidaDoAudio(actx);
    for (const v of VOZ.pcs.values()) { definirSaida(v.audio); definirSaida(v.fx?.audio); }
    for (const t of S.tiles.values()) definirSaida(t.video);
  }
  navigator.mediaDevices?.addEventListener?.('devicechange', () => aplicarSaida());

  // "Testar som": dois toquinhos curtos na saída escolhida
  function tocarTesteDeSaida() {
    const c = audioCtx();
    if (!c) return;
    if (c.state !== 'running') c.resume().catch(() => {});
    const t0 = c.currentTime + 0.05;
    for (const [i, freq] of [[0, 784], [1, 1046.5]]) {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = t0 + i * 0.16;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  }

  // ================= Indicador de rede (ao lado de "Conectado à sala") =================
  // Com mais gente na sala: ping e perda de pacotes das conexões diretas com cada pessoa.
  // Sozinho: o tempo de resposta do servidor. Atualiza a cada 2 segundos.
  const REDE = { anterior: new WeakMap(), servidor: null, falhasServidor: 0, contagem: 0, medindo: false };
  async function estatisticasDe(pc) {
    const st = await pc.getStats();
    let par = null;
    let recebidos = 0;
    let perdidos = 0;
    let perdaRemota = null;
    st.forEach((r) => {
      if (r.type === 'transport' && r.selectedCandidatePairId) par = st.get(r.selectedCandidatePairId) || par;
      else if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded' && !par) par = r;
      else if (r.type === 'inbound-rtp') {
        recebidos += r.packetsReceived || 0;
        perdidos += Math.max(0, r.packetsLost || 0);
      } else if (r.type === 'remote-inbound-rtp' && typeof r.fractionLost === 'number') {
        perdaRemota = Math.max(perdaRemota ?? 0, r.fractionLost);
      }
    });
    const antes = REDE.anterior.get(pc);
    REDE.anterior.set(pc, { recebidos, perdidos });
    const dr = antes ? recebidos - antes.recebidos : 0;
    const dp = antes ? perdidos - antes.perdidos : 0;
    const perda = dr + dp > 20 ? dp / (dr + dp) : null; // só conta com pacotes suficientes
    const rtt = typeof par?.currentRoundTripTime === 'number' ? par.currentRoundTripTime * 1000 : null;
    return { rtt, perda: Math.max(perda ?? 0, perdaRemota ?? 0), temPerda: perda !== null || perdaRemota !== null };
  }

  async function medirRede() {
    if (!S.sala || REDE.medindo) return;
    REDE.medindo = true;
    try {
      if (!navigator.onLine || !$('#connBanner').hidden) {
        return mostrarRede({ nivel: 0, ms: null, linhas: ['Sem conexão com o servidor. Tentando de novo…'] });
      }
      const vizinhos = vizinhosDeSala();
      if (!vizinhos.size) return medirServidor();
      // todas as conexões com cada pessoa (voz e transmissões)
      const porPessoa = new Map();
      const juntar = (id, pc) => { if (vizinhos.has(id) && pc) (porPessoa.get(id) || porPessoa.set(id, []).get(id)).push(pc); };
      for (const [id, v] of VOZ.pcs) juntar(id, v.pc);
      for (const [id, c] of S.inc) juntar(id, c.pc);
      for (const [id, c] of S.out) juntar(id, c.pc);
      const pessoas = [];
      let perda = 0;
      for (const id of vizinhos) {
        const pcs = porPessoa.get(id) || [];
        const nome = userById(id)?.name || 'alguém';
        const ligados = pcs.filter((pc) => pc.connectionState === 'connected');
        if (!ligados.length) {
          const caiu = pcs.some((pc) => pc.connectionState === 'failed' || pc.connectionState === 'disconnected');
          pessoas.push({ nome, rtt: null, caiu });
          continue;
        }
        let rtt = null;
        for (const pc of ligados) {
          const e = await estatisticasDe(pc).catch(() => null);
          if (!e) continue;
          if (e.rtt !== null) rtt = rtt === null ? e.rtt : Math.min(rtt, e.rtt);
          perda = Math.max(perda, e.perda);
        }
        pessoas.push({ nome, rtt, caiu: false });
      }
      const rtts = pessoas.map((p) => p.rtt).filter((x) => x !== null).sort((a, b) => a - b);
      const caidos = pessoas.filter((p) => p.caiu);
      if (!rtts.length && !caidos.length) return mostrarRede({ nivel: null, ms: null, linhas: ['Conectando com a sala…'] });
      const ms = rtts.length ? Math.round(rtts[Math.floor((rtts.length - 1) / 2)]) : null;
      let nivel = ms === null ? 1 : ms <= 150 && perda < 0.02 ? 3 : ms <= 300 && perda < 0.08 ? 2 : 1;
      if (caidos.length) nivel = Math.min(nivel, 1);
      const linhas = [
        `Ping com a sala: ${ms === null ? '—' : `${ms} ms`}${perda >= 0.005 ? `, ${Math.round(perda * 100)}% de perda de pacotes` : ', sem perda de pacotes'}`,
        ...pessoas.map((p) => `${p.nome}: ${p.caiu ? 'sem ligação (tentando de novo)' : p.rtt === null ? 'conectando…' : `${Math.round(p.rtt)} ms`}`),
      ];
      mostrarRede({ nivel, ms, linhas });
    } finally {
      REDE.medindo = false;
    }
  }

  async function medirServidor() {
    // sozinho na sala: mede o servidor a cada ~6 s (ele fica nos EUA, então o normal é 150 a 250 ms)
    if (REDE.contagem++ % 3 === 0) {
      const t0 = performance.now();
      try {
        await api('ping');
        const ms = performance.now() - t0;
        REDE.servidor = REDE.servidor === null ? ms : REDE.servidor * 0.6 + ms * 0.4;
        REDE.falhasServidor = 0;
      } catch {
        REDE.falhasServidor++;
      }
    }
    if (REDE.falhasServidor >= 2) return mostrarRede({ nivel: 0, ms: null, linhas: ['O servidor não está respondendo.'] });
    if (REDE.servidor === null) return mostrarRede({ nivel: null, ms: null, linhas: ['Medindo…'] });
    const ms = Math.round(REDE.servidor);
    mostrarRede({
      nivel: ms <= 350 ? 3 : ms <= 700 ? 2 : 1,
      ms,
      linhas: [`Resposta do servidor: ${ms} ms`, 'Quando mais alguém entrar, mostra o ping direto com cada pessoa.'],
    });
  }

  const NOMES_NIVEL = { 0: 'Sem conexão', 1: 'Rede ruim', 2: 'Rede instável', 3: 'Rede boa' };
  function mostrarRede({ nivel, ms, linhas }) {
    const el = $('#vpRede');
    if (!el) return;
    el.hidden = false;
    el.className = `vp-rede ${nivel === null ? 'medindo' : `nivel-${nivel}`}`;
    const barras = [1, 2, 3].map((n) => `<rect x="${(n - 1) * 5}" y="${12 - n * 4}" width="3.4" height="${n * 4}" rx="1"${nivel !== null && n <= nivel ? ' class="on"' : ''}/>`).join('');
    el.innerHTML = `<svg viewBox="0 0 14 12" aria-hidden="true">${barras}</svg>${ms !== null ? `<span>${ms} ms</span>` : nivel === 0 ? '<span>offline</span>' : ''}`;
    const titulo = [nivel === null ? 'Rede: medindo' : NOMES_NIVEL[nivel], ...linhas].join('\n');
    REDE.ultimo = titulo.replace(/\n/g, '; ');
    el.title = titulo;
    el.setAttribute('aria-label', titulo.replace(/\n/g, '. '));
  }
  setInterval(() => {
    if (!S.sala) {
      REDE.servidor = null;
      REDE.contagem = 0;
      REDE.falhasServidor = 0;
      return;
    }
    medirRede().catch(() => {});
  }, 2000);
  window.addEventListener('offline', () => { if (S.sala) medirRede(); });

  // ================= Versão em uso (discreta, num canto) =================
  // No navegador: a versão do site. No programa: a do programa instalado (em laranja se estiver
  // mais antiga que a do site). Passando o mouse aparece o detalhe; clicando, a explicação.
  const VERSAO = { texto: '', detalhe: '', antigo: false };
  async function mostrarVersao(doSite, build) {
    if (!/^\d+\.\d+\.\d+$/.test(String(doSite || '')) && !PROGRAMA) return;
    let doPrograma = null;
    if (PROGRAMA) {
      try { doPrograma = (await PROGRAMA.info())?.versao || null; } catch { doPrograma = null; }
    }
    const site = /^\d+\.\d+\.\d+$/.test(String(doSite || '')) ? doSite : null;
    VERSAO.antigo = !!(doPrograma && site && versaoMaisAntiga(doPrograma, site));
    VERSAO.texto = `v${doPrograma || site}`;
    VERSAO.detalhe = doPrograma
      ? `Programa para Windows, versão ${doPrograma}.${VERSAO.antigo ? ` Já tem a ${site}: feche e abra o programa para atualizar.` : ' Está em dia.'}`
      : `Caras E Telas, versão ${site}${build ? ` (envio ${build})` : ''}.`;
    for (const el of [$('#loginVersao'), $('#railVersao')]) {
      el.textContent = VERSAO.texto;
      el.title = VERSAO.detalhe;
      el.setAttribute('aria-label', VERSAO.detalhe);
      el.classList.toggle('antiga', VERSAO.antigo);
      el.hidden = false;
    }
  }
  for (const id of ['#loginVersao', '#railVersao']) $(id).addEventListener('click', () => { if (VERSAO.detalhe) toast(VERSAO.detalhe, VERSAO.antigo ? 9000 : 4000); });

  // ================= Problemas: erros da página e "Relatar problema" =================
  // Erros que acontecem na página vão sozinhos para o painel de admin (iguais viram uma linha só).
  // O botão "Relatar problema" manda o que a pessoa escreveu e, se ela deixar, um diagnóstico:
  // versões, navegador, rede, voz, caneta e os últimos erros. Só admins veem.
  const ERROS = { recentes: [], enviados: new Set() };
  function anotarErro(msg, onde) {
    msg = String(msg || '').slice(0, 300);
    onde = String(onde || '').slice(0, 200);
    if (!msg || /ResizeObserver loop|Script error\.?$|chrome-extension:|moz-extension:/i.test(msg + onde)) return;
    ERROS.recentes.push({ t: Date.now(), msg, onde });
    if (ERROS.recentes.length > 15) ERROS.recentes.shift();
    const chave = `${msg}|${onde}`;
    if (!S.token || ERROS.enviados.has(chave) || ERROS.enviados.size >= 15) return;
    ERROS.enviados.add(chave);
    api('erro', { msg, onde, versao: VERSAO.texto }).catch(() => {});
  }
  window.addEventListener('error', (e) => {
    const arq = String(e.filename || '').replace(location.origin, '');
    anotarErro(e.message || e.error?.message, arq ? `${arq}:${e.lineno || 0}` : '');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    const linha = String(r?.stack || '').split('\n').find((l) => l.includes(location.origin)) || '';
    anotarErro(`(promessa) ${r?.message || r}`, linha.replace(location.origin, '').trim());
  });

  async function coletarDiagnostico() {
    const pc = (pcx) => pcx?.connectionState || 'nenhuma';
    const nome = (id) => userById(id)?.name || id;
    const sn = (x) => (x ? 'sim' : 'não');
    const d = {
      'Versão do site': VERSAO.texto || null,
      Programa: null,
      Navegador: navigator.userAgent,
      Tela: `${screen.width}x${screen.height} (zoom ${Math.round((window.devicePixelRatio || 1) * 100)}%), janela ${innerWidth}x${innerHeight}`,
      'Conexão com o servidor': `${S.usarPolling ? 'long-polling' : 'tempo real'}${$('#connBanner').hidden ? '' : ', CAIU agora'}${navigator.onLine ? '' : ', sem internet'}`,
      Sala: S.sala ? nomeSala(S.sala) : 'fora de sala',
      Transmitindo: S.live ? `sim (som: ${S.som}, qualidade: ${S.quality}, com som: ${sn(S.audioCaptado)})` : 'não',
      Assistindo: [...S.inc].map(([id, c]) => `${nome(id)}: ${c.state}${c.stream ? '' : ', sem vídeo'}`),
      'Mandando vídeo para': [...S.out].map(([id, c]) => `${nome(id)}: ${pc(c.pc)}`),
      Rede: REDE.ultimo || 'sem medição',
      Voz: {
        Microfone: VOZ.mic ? `ligado (${VOZ.mic.stream.getAudioTracks()[0]?.label || 'sem nome'})` : 'desligado',
        Mudo: sn(VOZ.mudo),
        'Sala muda': sn(VOZ.surdo),
        'Silenciado por admin': sn(silenciado()),
        Modo: VOZ.cfg.modo === 'ptt' ? `apertar para falar (${VOZ.cfg.atalho ? textoAtalho(VOZ.cfg.atalho) : 'sem tecla'})` : 'quando fala',
        Sensibilidade: VOZ.cfg.sensibilidade === 'auto' ? 'automática' : `${VOZ.cfg.sensibilidade} dB`,
        'Supressão de ruído': sn(VOZ.cfg.ruido),
        Saída: VOZ.cfg.saida ? (saidaAtual ? 'escolhida' : 'escolhida, mas não encontrada') : 'padrão do sistema',
        Conexões: [...VOZ.pcs].map(([id, v]) => `${nome(id)}: ${pc(v.pc)}`),
      },
      'Erros recentes': ERROS.recentes.slice(-10).map((x) => `${new Date(x.t).toLocaleTimeString('pt-BR')} ${x.msg}${x.onde ? ` (${x.onde})` : ''}`),
    };
    if (PROGRAMA) {
      try { d.Programa = (await PROGRAMA.info())?.versao || '?'; } catch { d.Programa = '?'; }
      if (PROGRAMA.placa) d['Placa de vídeo'] = textoDaPlaca(await placaDeVideo()) || 'sem resposta';
      if (PROGRAMA.tintaEstado) {
        try {
          const c = await PROGRAMA.tintaEstado();
          d.Caneta = c ? { 'Windows (build)': c.windows, Telas: c.telas, Compartilhando: c.fonte || 'nada', Problema: c.motivo || 'nenhum' } : 'sem resposta';
        } catch { d.Caneta = 'erro ao consultar'; }
      }
    }
    return d;
  }
  // diagnóstico em linhas "chave: valor" (para mostrar antes de enviar e no painel de admin)
  function linhasDoDiagnostico(obj, prefixo = '') {
    const r = [];
    for (const [k, v] of Object.entries(obj || {})) {
      if (v && typeof v === 'object' && !Array.isArray(v)) r.push(...linhasDoDiagnostico(v, `${prefixo}${k} › `));
      else if (Array.isArray(v)) r.push(`${prefixo}${k}: ${v.length ? v.join('; ') : '(nenhum)'}`);
      else r.push(`${prefixo}${k}: ${v === null || v === undefined ? '—' : v}`);
    }
    return r;
  }
  async function abrirRelatarProblema() {
    const diag = await coletarDiagnostico();
    abrirModal({
      titulo: 'Relatar um problema',
      ok: 'Enviar',
      corpo: `<div class="relatar">
        <p class="vo-dica">O relato vai para os admins do servidor, que veem no painel de admin.</p>
        <label class="vo-campo"><span class="ap-rotulo">O que aconteceu?</span>
          <textarea id="rpTexto" name="texto" rows="4" maxlength="1000" required placeholder="Ex.: comecei a transmitir e o Beto não ouvia o som do jogo"></textarea></label>
        <label class="sons-check"><input type="checkbox" id="rpInfo" checked> Mandar junto as informações técnicas (ajudam a descobrir o problema)</label>
        <details class="rp-detalhes"><summary>Ver o que vai junto</summary><pre>${esc(linhasDoDiagnostico(diag).join('\n'))}</pre></details>
      </div>`,
      aoConfirmar: async () => {
        const texto = $('#rpTexto').value.trim();
        if (!texto) throw new Error('Conte em poucas palavras o que aconteceu');
        await api('relatar', { texto, info: $('#rpInfo').checked ? diag : null });
        toast('Problema enviado para os admins. Valeu!');
      },
    });
    setTimeout(() => $('#rpTexto')?.focus(), 50);
  }

  // ----- painel de admin: aba Problemas -----
  async function carregarProblemas() {
    try {
      P.problemas = await adm('problemas');
      if (P.aba === 'problemas' && P.problemas.relatos.some((r) => !r.lido)) adm('ler-problemas').catch(() => {});
    } catch (e) {
      toast(e.message);
    }
    renderPainel();
  }
  function abaProblemas() {
    const r = P.problemas;
    if (!r) {
      if (!P.carregandoProblemas) {
        P.carregandoProblemas = true;
        carregarProblemas().finally(() => { P.carregandoProblemas = false; });
      }
      return '<div class="ap-empty">Carregando…</div>';
    }
    const relatos = r.relatos.map((x) => `<div class="ap-relato${x.lido ? '' : ' novo'}" data-relato="${esc(x.id)}">
        <div class="ap-relato-topo"><strong>${esc(x.nome)}</strong>${x.lido ? '' : '<span class="ap-tag orange">novo</span>'}
          <span class="muted small">${esc(quandoCurto(x.t))} · ${esc(x.aparelho)} · ${esc(x.ip || '')}</span>
          <button class="btn sm ghost" data-act="apagar-relato">Apagar</button></div>
        <p class="ap-relato-texto">${esc(x.texto)}</p>
        ${x.info ? `<details><summary>Informações técnicas</summary><pre>${esc(linhasDoDiagnostico(x.info).join('\n'))}</pre></details>` : '<p class="muted small">Sem informações técnicas.</p>'}
      </div>`).join('');
    const erros = r.erros.map((x) => `<div class="ap-erro">
        <div class="ap-erro-msg">${esc(x.msg)}</div>
        <div class="muted small">${x.onde ? `${esc(x.onde)} · ` : ''}${x.vezes} ${x.vezes === 1 ? 'vez' : 'vezes'} · última ${esc(quandoCurto(x.ultima))}
          · ${esc((x.quem || []).join(', '))}${x.versoes?.length ? ` · ${esc(x.versoes.join(', '))}` : ''}</div>
        ${x.aparelhos?.length ? `<div class="muted small">${esc(x.aparelhos.join('; '))}</div>` : ''}
      </div>`).join('');
    return `<p class="ap-hint">Relatos enviados pelo botão "Relatar problema" (o ponto de interrogação no canto de baixo, à esquerda) e erros que aconteceram na página de alguém. Ficam guardados por ${r.dias} dias.</p>
      <div class="ap-section"><h4>Relatos</h4>${relatos || '<p>Nenhum relato. 🎉</p>'}</div>
      <div class="ap-section"><h4>Qualidade das transmissões</h4>
        <p>Um resumo de cada transmissão, de quem mandou e de quem assistiu: a resolução de verdade e o que limitou a imagem.</p>
        ${(r.qualidade || []).slice(0, P.limiteQual || 40).map(linhaDeQualidade).join('') || '<p>Nenhuma transmissão registrada ainda (aparecem as que duram mais de 20 segundos).</p>'}
        ${(r.qualidade || []).length > (P.limiteQual || 40) ? `<button class="btn sm ghost ap-mais" data-act="mais-qualidade">Mostrar mais (${r.qualidade.length - (P.limiteQual || 40)} mais antigas)</button>` : ''}</div>
      <div class="ap-section"><h4>Erros da página ${r.erros.length ? `<button class="btn sm ghost" data-act="limpar-erros">Limpar</button>` : ''}</h4>
        ${erros || '<p>Nenhum erro registrado.</p>'}</div>`;
  }

  // ----- painel de admin: tráfego (na aba Servidor) -----
  function secaoTrafego(t) {
    if (!t) return '';
    const total = Object.values(t.bytes || {}).reduce((a, b) => a + b, 0);
    const limite = t.limiteGB * 1e9;
    const pct = Math.min(100, (total / limite) * 100);
    const gb = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2).replace('.', ',')} GB`
      : b >= 1e6 ? `${(b / 1e6).toFixed(b >= 1e8 ? 0 : 1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
    const agora = Date.now();
    const fimDoMes = new Date(new Date(t.inicioDoMes).setUTCMonth(new Date(t.inicioDoMes).getUTCMonth() + 1)).getTime();
    const passou = Math.max(agora - t.desde, 3600e3);
    const previsto = total + (total / passou) * Math.max(0, fimDoMes - agora);
    const NOMES = { pagina: 'Abrir o site', imagens: 'Imagens do chat', tempoReal: 'Mensagens e avisos em tempo real', api: 'Pedidos da página', banco: 'Banco de dados (Upstash)' };
    const partes = Object.entries(t.bytes || {}).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `<li><span>${esc(NOMES[k] || k)}</span><span>${gb(v)}</span></li>`).join('');
    const nivel = pct >= 95 ? 'perigo' : pct >= 80 ? 'alerta' : '';
    const contandoDesde = t.desde > t.inicioDoMes + 864e5
      ? ` Contando desde ${new Date(t.desde).toLocaleDateString('pt-BR')} (antes disso não era medido).` : '';
    return `<div class="ap-section"><h4>Tráfego do servidor este mês</h4>
      <div class="trafego-barra ${nivel}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="Tráfego usado"><div style="width:${pct.toFixed(1)}%"></div></div>
      <p><b>${gb(total)}</b> de ${t.limiteGB} GB (${pct < 1 && total > 0 ? 'menos de 1' : Math.round(pct)}%). No ritmo atual, o mês fecha em uns <b>${gb(previsto)}</b>.${contandoDesde}</p>
      ${partes ? `<ul class="trafego-partes">${partes}</ul>` : ''}
      <p>É uma estimativa: o número oficial está no painel do Render, em Billing. Se passar do limite sem cartão cadastrado, o Render suspende o site até o mês seguinte. A voz e as transmissões não contam aqui: vão direto entre vocês.</p></div>`;
  }

  // ================= Programa desatualizado =================
  // O servidor diz qual é a versão mais nova do programa; se a deste for mais antiga, avisa
  // (e, nas versões que sabem, pede para o programa procurar a atualização na hora).
  function versaoMaisAntiga(a, b) {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0);
    return false;
  }
  let programaConferido = false;
  async function conferirVersaoDoPrograma(maisNova) {
    if (!PROGRAMA || programaConferido || !/^\d+\.\d+\.\d+$/.test(String(maisNova || ''))) return;
    programaConferido = true;
    let atual = null;
    try { atual = (await PROGRAMA.info())?.versao; } catch { atual = null; }
    if (!atual || !versaoMaisAntiga(atual, maisNova)) return;
    S.programaAntigo = atual;
    if (PROGRAMA.buscarAtualizacao) {
      PROGRAMA.buscarAtualizacao().catch(() => {});
      toast(`Tem uma versão nova do programa (${maisNova}). Ela está sendo baixada: quando aparecer o aviso, clique em "Reiniciar agora".`, 10000);
    } else {
      toast(`Tem uma versão nova do programa (${maisNova}; a sua é a ${atual}). Feche o programa e abra de novo: ele baixa a atualização e pergunta se pode reiniciar.`, 14000);
    }
  }

  // ================= Caneta: quem assiste desenha por cima da transmissão =================
  // Quem transmite escolhe quem pode desenhar (todos ou ninguém, com exceções). O servidor confere
  // cada traço e repassa para a sala. Os pontos vão de 0 a 1 do quadro do vídeo, então caem no
  // mesmo lugar em qualquer tamanho de tela. Cada traço fica alguns segundos e some esmaecendo.
  const CORES_CANETA = [
    { cor: '#ff3b30', nome: 'Vermelho' },
    { cor: '#ffd60a', nome: 'Amarelo' },
    { cor: '#1e88ff', nome: 'Azul' },
    { cor: '#30d158', nome: 'Verde' },
    { cor: '#ffffff', nome: 'Branco' },
  ];
  const TINTA_FICA = 3000; // quanto tempo o traço fica inteiro depois de terminar
  const TINTA_SOME = 900; // quanto dura o esmaecer
  const CANETA = {
    cfg: { padrao: salvo.canetaPadrao === 'todos' ? 'todos' : 'ninguem', excecoes: new Set() },
    cor: Number.isInteger(salvo.canetaCor) && salvo.canetaCor >= 0 && salvo.canetaCor < CORES_CANETA.length ? salvo.canetaCor : 0,
    ativa: null, // em qual transmissão eu estou desenhando
    traco: null, // { sid, tr, ultimo }
    saida: [], // pedaços de traço esperando para ir ao servidor
    enviando: false,
    tintas: new Map(), // sid -> Map(tr -> { nome, c, pts, fim, ult, meu })
    liberadas: null, // transmissões em que eu posso desenhar (para avisar quando muda)
    enviandoCfg: false,
    raf: 0,
  };
  const idDeTraco = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => (b % 36).toString(36)).join('');

  function possoDesenharEm(sid) {
    if (!sid || sid === S.myId || !S.sala) return false;
    const u = userById(sid);
    if (!u?.live || u.sala !== S.sala || !u.caneta) return false;
    return (u.caneta.padrao === 'todos') !== (u.caneta.excecoes || []).includes(S.myId);
  }
  const podeDesenharNaMinha = (id) => (CANETA.cfg.padrao === 'todos') !== CANETA.cfg.excecoes.has(id);

  // Chamado a cada mudança na lista de pessoas
  function atualizarCaneta() {
    const agora = new Set(S.users.filter((u) => possoDesenharEm(u.id)).map((u) => u.id));
    if (CANETA.liberadas) {
      for (const sid of agora) {
        if (!CANETA.liberadas.has(sid)) toast(`${userById(sid)?.name || 'Alguém'} liberou a caneta: clique no lápis na transmissão para desenhar na tela.`, 6000);
      }
      if (CANETA.ativa && !agora.has(CANETA.ativa)) {
        const quem = userById(CANETA.ativa);
        sairDaCaneta();
        if (quem?.live) toast(`${quem.name} desligou a caneta para você.`);
      }
    }
    CANETA.liberadas = agora;
    for (const sid of [...CANETA.tintas.keys()]) if (!userById(sid)?.live) CANETA.tintas.delete(sid);
    for (const t of S.tiles.values()) atualizarBotaoCaneta(t);
    sincronizarCfgCaneta();
    if (!$('#canetaPanel').hidden) renderCanetaPainel();
    renderCanetaBtn();
  }

  // Quem transmite: manda a escolha para o servidor quando ela muda (e de novo se o servidor esquecer)
  async function sincronizarCfgCaneta() {
    const me = userById(S.myId);
    if (!S.live || !me?.live || CANETA.enviandoCfg) return;
    const ids = new Set(S.users.map((u) => u.id));
    const quer = { padrao: CANETA.cfg.padrao, excecoes: [...CANETA.cfg.excecoes].filter((id) => ids.has(id) && id !== S.myId).sort() };
    const tem = me.caneta ? { padrao: me.caneta.padrao, excecoes: [...(me.caneta.excecoes || [])].sort() } : { padrao: 'ninguem', excecoes: [] };
    if (JSON.stringify(quer) === JSON.stringify(tem)) return;
    CANETA.enviandoCfg = true;
    try {
      await api('caneta', quer);
    } catch { /* tenta de novo na próxima mudança */ } finally {
      CANETA.enviandoCfg = false;
    }
  }

  // ----- quem assiste: botão, cores e desenho -----
  function atualizarBotaoCaneta(t) {
    const pode = possoDesenharEm(t.uid);
    const btn = t.el.querySelector('[data-act=caneta]');
    btn.hidden = !pode;
    const desenhando = pode && CANETA.ativa === t.uid;
    t.el.classList.toggle('desenhando', desenhando);
    const barra = t.el.querySelector('.t-cores');
    barra.hidden = !desenhando;
    if (desenhando) {
      barra.innerHTML = CORES_CANETA.map((x, i) => `<button type="button" class="t-cor${i === CANETA.cor ? ' on' : ''}" data-act="cor" data-cor="${i}"
          style="--cor:${x.cor}" title="${x.nome}" aria-label="${x.nome}" aria-pressed="${i === CANETA.cor}"></button>`).join('')
        + '<span class="t-cores-dica">Desenhe na tela</span><button type="button" class="t-cores-ok" data-act="sair-caneta" title="Sair da caneta (Esc)">Pronto</button>';
    }
  }
  function alternarCaneta(uid) {
    if (CANETA.ativa === uid) return sairDaCaneta();
    if (!possoDesenharEm(uid)) return toast('A caneta não está liberada para você nessa tela.');
    const antiga = CANETA.ativa;
    CANETA.ativa = uid;
    if (antiga && S.tiles.get(antiga)) atualizarBotaoCaneta(S.tiles.get(antiga));
    const t = S.tiles.get(uid);
    if (t) atualizarBotaoCaneta(t);
  }
  function sairDaCaneta() {
    const uid = CANETA.ativa;
    if (!uid) return;
    terminarTraco();
    CANETA.ativa = null;
    const t = S.tiles.get(uid);
    if (t) atualizarBotaoCaneta(t);
  }
  function escolherCor(i) {
    if (!Number.isInteger(i) || i < 0 || i >= CORES_CANETA.length) return;
    CANETA.cor = i;
    salvar({ canetaCor: i });
    const t = S.tiles.get(CANETA.ativa);
    if (t) atualizarBotaoCaneta(t);
  }

  // onde o vídeo aparece de verdade dentro do quadro (sem as faixas pretas)
  function quadroDo(t) {
    const v = t.video;
    const ew = v.clientWidth || 1;
    const eh = v.clientHeight || 1;
    const vw = v.videoWidth || 16;
    const vh = v.videoHeight || 9;
    const k = Math.min(ew / vw, eh / vh);
    const w = vw * k;
    const h = vh * k;
    return { x: v.offsetLeft + (ew - w) / 2, y: v.offsetTop + (eh - h) / 2, w, h };
  }
  function pontoDoEvento(t, e, prender) {
    const r = t.tinta.getBoundingClientRect();
    const q = quadroDo(t);
    let x = (e.clientX - r.left - q.x) / q.w;
    let y = (e.clientY - r.top - q.y) / q.h;
    if (!prender && (x < 0 || x > 1 || y < 0 || y > 1)) return null;
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    return [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4];
  }
  function guardarTinta(sid, tr, dados) {
    let mapa = CANETA.tintas.get(sid);
    if (!mapa) CANETA.tintas.set(sid, (mapa = new Map()));
    let s = mapa.get(tr);
    if (!s) {
      if (mapa.size >= 80) mapa.delete(mapa.keys().next().value); // não deixa acumular
      s = { nome: dados.nome || '', c: dados.c, pts: [], fim: null, ult: Date.now(), meu: !!dados.meu };
      mapa.set(tr, s);
    }
    for (const p of dados.pts || []) if (s.pts.length < 4000) s.pts.push(p);
    s.ult = Date.now();
    if (dados.fim && !s.fim) s.fim = Date.now();
    pedirDesenho();
  }
  function enfileirarPontos(pts, fim) {
    const tr = CANETA.traco;
    if (!tr) return;
    let peca = CANETA.saida[CANETA.saida.length - 1];
    if (!peca || peca.tr !== tr.tr || peca.fim || peca.p.length + pts.length > 64) {
      peca = { sid: tr.sid, tr: tr.tr, c: tr.c, p: [], fim: false };
      CANETA.saida.push(peca);
    }
    peca.p.push(...pts);
    if (!peca.p.length) peca.p.push(tr.ultimo);
    if (fim) peca.fim = true;
    if (CANETA.saida.length > 200) CANETA.saida.splice(0, CANETA.saida.length - 200);
    enviarTinta();
  }
  // um pedido por vez: enquanto um vai, os pontos novos se juntam no próximo
  async function enviarTinta() {
    if (CANETA.enviando) return;
    const peca = CANETA.saida.shift();
    if (!peca) return;
    CANETA.enviando = true;
    try {
      await api('tinta', peca);
    } catch (e) {
      if (e.data?.semCaneta) {
        CANETA.saida = [];
        sairDaCaneta();
        toast(e.message);
      }
    } finally {
      CANETA.enviando = false;
      if (CANETA.saida.length) enviarTinta();
    }
  }
  function comecarTraco(t, e) {
    if (CANETA.ativa !== t.uid || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const pt = pontoDoEvento(t, e, false);
    if (!pt) return;
    e.preventDefault();
    try { t.tinta.setPointerCapture(e.pointerId); } catch { /* ok */ }
    terminarTraco();
    CANETA.traco = { sid: t.uid, tr: idDeTraco(), c: CANETA.cor, ultimo: pt, ponteiro: e.pointerId };
    guardarTinta(t.uid, CANETA.traco.tr, { nome: 'Você', c: CANETA.cor, pts: [pt], meu: true });
    enfileirarPontos([pt], false);
  }
  function continuarTraco(t, e) {
    const tr = CANETA.traco;
    if (!tr || tr.sid !== t.uid || e.pointerId !== tr.ponteiro) return;
    const eventos = e.getCoalescedEvents?.() || [e];
    const novos = [];
    for (const ev of eventos) {
      const pt = pontoDoEvento(t, ev, true);
      if (Math.hypot(pt[0] - tr.ultimo[0], pt[1] - tr.ultimo[1]) < 0.003) continue;
      tr.ultimo = pt;
      novos.push(pt);
    }
    if (!novos.length) return;
    guardarTinta(t.uid, tr.tr, { pts: novos });
    enfileirarPontos(novos, false);
  }
  function terminarTraco() {
    const tr = CANETA.traco;
    if (!tr) return;
    guardarTinta(tr.sid, tr.tr, { fim: true });
    enfileirarPontos([], true);
    CANETA.traco = null;
  }
  function onTinta(m) {
    if (typeof m.sid !== 'string' || typeof m.tr !== 'string' || !Array.isArray(m.p) || !Number.isInteger(m.c) || !CORES_CANETA[m.c]) return;
    guardarTinta(m.sid, m.tr, { nome: String(m.nome || '').slice(0, 32), c: m.c, pts: m.p, fim: m.fim });
    // no programa, quem transmite vê os traços também por cima da tela de verdade
    if (m.sid === S.myId && S.live && PROGRAMA?.tinta) {
      PROGRAMA.tinta({ tr: m.tr, c: m.c, p: m.p, fim: m.fim === true, nome: String(m.nome || '') })
        .then((r) => {
          if ((r === false || r?.ok === false) && !CANETA.avisouCamada) {
            CANETA.avisouCamada = true;
            toast(`Os desenhos não puderam aparecer por cima da sua tela${r?.motivo ? `: ${r.motivo}` : '.'}`, 9000);
          }
        }).catch(() => {});
    }
  }

  // ----- desenhar os traços (todo mundo da sala vê, inclusive quem transmite) -----
  function pedirDesenho() {
    if (!CANETA.raf) CANETA.raf = requestAnimationFrame(desenharTintas);
  }
  function desenharTintas() {
    CANETA.raf = 0;
    const agora = Date.now();
    let vivo = false;
    for (const t of S.tiles.values()) {
      const mapa = CANETA.tintas.get(t.uid);
      if (!mapa?.size && !t.tintaSuja) continue;
      const cv = t.tinta;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      t.tintaSuja = false;
      if (!mapa?.size) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const q = quadroDo(t);
      for (const [tr, s] of mapa) {
        const fim = s.fim ?? (agora - s.ult > 1500 ? s.ult : null); // pedaço final perdido: termina sozinho
        const a = fim === null ? 1 : Math.min(1, 1 - (agora - fim - TINTA_FICA) / TINTA_SOME);
        if (a <= 0) { mapa.delete(tr); continue; }
        desenharTraco(ctx, s, q, a);
        t.tintaSuja = true;
        vivo = true;
      }
      if (!mapa.size) CANETA.tintas.delete(t.uid);
    }
    if (vivo) pedirDesenho();
  }
  function desenharTraco(ctx, s, q, a) {
    if (!s.pts.length) return;
    const larg = Math.max(2.5, Math.min(9, q.h * 0.0055));
    const pts = s.pts.map(([x, y]) => [q.x + x * q.w, q.y + y * q.h]);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.01, pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    if (pts.length > 1) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.strokeStyle = 'rgba(0, 0, 0, .45)'; // contorno: aparece em fundo claro ou escuro
    ctx.lineWidth = larg + 3;
    ctx.stroke();
    ctx.strokeStyle = CORES_CANETA[s.c]?.cor || '#ff3b30';
    ctx.lineWidth = larg;
    ctx.stroke();
    if (!s.meu && s.nome) {
      // nome pequeno de quem desenhou, no começo do traço
      ctx.font = '600 11px "Source Sans 3", system-ui, sans-serif';
      const tw = ctx.measureText(s.nome).width;
      const bx = Math.min(q.x + q.w - tw - 22, Math.max(q.x + 2, pts[0][0] + 8));
      const by = Math.max(q.y + 2, pts[0][1] - 24);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = 'rgba(6, 24, 39, .75)';
      ctx.beginPath();
      ctx.roundRect?.(bx, by, tw + 20, 17, 8.5);
      ctx.fill();
      ctx.fillStyle = CORES_CANETA[s.c]?.cor || '#fff';
      ctx.beginPath();
      ctx.arc(bx + 8.5, by + 8.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(s.nome, bx + 15, by + 12.5);
    }
    ctx.restore();
  }
  window.addEventListener('resize', () => { for (const t of S.tiles.values()) t.tintaSuja = true; pedirDesenho(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && CANETA.ativa) {
      e.preventDefault();
      sairDaCaneta();
    }
  }, true);

  // ----- quem transmite: painel "Caneta na sua tela" -----
  function renderCanetaBtn() {
    const b = $('#canetaBtn');
    if (!b) return;
    const pessoas = [...vizinhosDeSala()];
    const n = pessoas.filter(podeDesenharNaMinha).length;
    b.innerHTML = `${icon('caneta')} Caneta`;
    b.classList.toggle('caneta-on', S.live && n > 0);
    b.title = !pessoas.length ? 'Caneta: quem assistir poderá desenhar na sua tela, se você liberar'
      : n === 0 ? 'Caneta: ninguém pode desenhar na sua tela' : n === pessoas.length ? 'Caneta: todos podem desenhar na sua tela'
        : `Caneta: ${plural(n, 'pessoa pode', 'pessoas podem')} desenhar na sua tela`;
  }
  function renderCanetaPainel() {
    const estadoAntes = $('#cpEstado');
    const guardado = estadoAntes ? { texto: estadoAntes.textContent, classe: estadoAntes.className, teste: estadoAntes.dataset.teste } : null;
    renderCanetaPainelHtml();
    const el = $('#cpEstado');
    if (el && guardado) {
      el.textContent = guardado.texto;
      el.className = guardado.classe;
      if (guardado.teste) el.dataset.teste = guardado.teste;
    }
  }
  function renderCanetaPainelHtml() {
    const pessoas = S.users.filter((u) => vizinhosDeSala().has(u.id)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const cfg = CANETA.cfg;
    $('#canetaPanel').innerHTML = `<strong class="cp-titulo">Caneta na sua tela</strong>
      <p class="ajustes-dica">Quem você liberar pode circular e desenhar por cima da sua transmissão, com o mouse ou o dedo. Os traços somem sozinhos em poucos segundos.</p>
      <div><span class="ap-rotulo">Quem pode desenhar</span>
        <div class="segmento" role="radiogroup" aria-label="Quem pode desenhar">
          <label><input type="radio" name="cpadrao" value="ninguem"${cfg.padrao === 'ninguem' ? ' checked' : ''}><span>Ninguém</span></label>
          <label><input type="radio" name="cpadrao" value="todos"${cfg.padrao === 'todos' ? ' checked' : ''}><span>Todos</span></label>
        </div></div>
      <div class="cp-lista">${pessoas.length ? pessoas.map((u) => {
        const pode = podeDesenharNaMinha(u.id);
        return `<label class="cp-pessoa${pode ? ' pode' : ''}">${avatar(u)}<span class="cp-nome">${esc(u.name)}</span>
          <span class="cp-estado">${pode ? 'pode desenhar' : 'não pode'}</span>
          <input type="checkbox" data-uid="${esc(u.id)}"${pode ? ' checked' : ''} aria-label="${esc(u.name)} pode desenhar"></label>`;
      }).join('') : '<p class="cp-vazio">Ninguém na sala ainda. Quem entrar segue a escolha acima.</p>'}</div>
      ${PROGRAMA?.tinta ? '<div class="cp-programa"><button type="button" class="btn sm" id="cpTestar">Testar na minha tela</button><span id="cpEstado"></span></div>' : ''}
      <p class="ajustes-dica${PROGRAMA && !PROGRAMA.tinta ? ' aviso' : ''}">${PROGRAMA?.tinta
        ? 'Os desenhos aparecem aqui no site e também por cima da sua tela de verdade (sem entrar na transmissão). Em jogo de tela cheia exclusiva o Windows não deixa: use tela cheia sem bordas ou janela.'
        : PROGRAMA
          ? 'Seu programa está numa versão antiga, então os desenhos aparecem só aqui dentro. Feche o programa e abra de novo: ele baixa a versão nova e pergunta se pode reiniciar. Depois disso, os desenhos aparecem por cima da sua tela de verdade.'
          : 'Você vê os desenhos aqui no site. No <a href="/baixar" target="_blank" rel="noopener">programa para Windows</a>, eles aparecem também por cima da sua tela de verdade.'}</p>`;
  }
  // Programa: mostra se a camada por cima da tela está pronta (ou por que não)
  async function estadoDaCamada() {
    const el = $('#cpEstado');
    if (!el || !PROGRAMA?.tintaEstado || el.dataset.teste) return;
    let st = null;
    try { st = await PROGRAMA.tintaEstado(); } catch { st = null; }
    if (!st || !document.body.contains(el) || el.dataset.teste) return;
    el.className = st.motivo ? 'cp-estado-camada aviso' : 'cp-estado-camada';
    el.textContent = st.motivo || (st.telas > 1 ? `Pronto: aparece na tela que você está compartilhando (você tem ${st.telas} telas).` : 'Pronto para aparecer na sua tela.');
  }
  // Desenha um círculo vermelho só na camada do próprio programa (não vai para a sala)
  async function testarCamada() {
    const el = $('#cpEstado');
    if (!el || !PROGRAMA?.tinta) return;
    const tr = idDeTraco();
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push([Math.round((0.5 + 0.07 * Math.cos(a)) * 1e4) / 1e4, Math.round((0.5 + 0.12 * Math.sin(a)) * 1e4) / 1e4]);
    }
    guardarTinta(S.myId, tr, { nome: 'Teste da caneta', c: 0, pts, fim: true });
    let r;
    try {
      r = await PROGRAMA.tinta({ tr, c: 0, p: pts, fim: true, nome: 'Teste da caneta' });
    } catch (e) {
      r = { ok: false, motivo: e.message };
    }
    el.dataset.teste = '1';
    if (r === true || r?.ok) {
      el.className = 'cp-estado-camada';
      el.textContent = `Apareceu um círculo vermelho ${r?.onde || 'no meio da sua tela'}? Ele some em uns 4 segundos. Se não apareceu, veja se tem um jogo em tela cheia por cima ou se está olhando para outro monitor.`;
    } else {
      el.className = 'cp-estado-camada aviso';
      el.textContent = `Não deu para desenhar por cima da tela: ${r?.motivo || 'o programa recusou'}`;
    }
  }
  function montarCaneta() {
    $('#canetaPanel').addEventListener('click', (e) => {
      if (e.target.closest('#cpTestar')) testarCamada();
    });
    $('#canetaBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = $('#canetaPanel').hidden;
      $('#canetaPanel').hidden = !abrir;
      $('#ajustesPanel').hidden = true;
      $('#sonsPanel').hidden = true;
      if (abrir) {
        renderCanetaPainel();
        estadoDaCamada();
      }
    });
    document.addEventListener('click', (e) => {
      if (!$('#canetaPanel').hidden && !e.target.closest('#canetaPanel, #canetaBtn')) $('#canetaPanel').hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#canetaPanel').hidden) { $('#canetaPanel').hidden = true; e.preventDefault(); }
    });
    $('#canetaPanel').addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'cpadrao') {
        CANETA.cfg.padrao = t.value === 'todos' ? 'todos' : 'ninguem';
        CANETA.cfg.excecoes.clear(); // trocar o padrão começa do zero
        salvar({ canetaPadrao: CANETA.cfg.padrao });
      } else if (t.dataset.uid) {
        const id = t.dataset.uid;
        if (CANETA.cfg.excecoes.has(id)) CANETA.cfg.excecoes.delete(id);
        else CANETA.cfg.excecoes.add(id);
      } else return;
      renderCanetaPainel();
      renderCanetaBtn();
      sincronizarCfgCaneta();
    });
    renderCanetaBtn();
  }
  function encerrarCaneta() {
    CANETA.avisouCamada = false;
    CANETA.cfg.excecoes.clear();
    CANETA.tintas.delete(S.myId);
    $('#canetaPanel').hidden = true;
    PROGRAMA?.tinta?.(null).catch(() => {});
  }

  // ================= Aparência: tema claro/escuro e paleta de cores =================
  // As cores são calculadas pelo tema.js (carregado antes da página). A escolha fica
  // guardada neste navegador (ou neste programa) e vale na hora, sem recarregar.
  const TEMA = window.CarasTema || null;
  // cores que o programa para Windows usa nas telas dele (carregando, seletor de tela)
  const VARS_DO_PROGRAMA = ['--ceu-alto', '--ceu', '--ceu-fundo', '--ceu-luz', '--onda', '--texto-forte', '--texto', '--suave', '--linha', '--linha-forte',
    '--p1', '--p2', '--p3', '--p-borda', '--p-sobre', '--p-sobre-sombra', '--p-texto', '--p-anel', '--foco', '--sup-1', '--sup-2', '--pop-1', '--pop-2',
    '--campo-1', '--campo-2', '--borda-vidro', '--realce', '--sombra-cor', '--gel-topo', '--gel-meio', '--alerta', '--cabeca-1', '--cabeca-2', '--rodape-1', '--rodape-2'];
  function temaParaOPrograma(g) {
    if (!PROGRAMA?.aparencia || !g) return;
    const vars = {};
    for (const n of VARS_DO_PROGRAMA) if (g.vars[n]) vars[n] = g.vars[n];
    PROGRAMA.aparencia({ escuro: g.escuro, vars }).catch(() => {});
  }
  if (TEMA) {
    TEMA.aoMudar(temaParaOPrograma);
    temaParaOPrograma(TEMA.gerar(TEMA.atual()));
  }

  function abrirAparencia() {
    if (!TEMA) return toast('Não consegui carregar os temas. Recarregue a página.');
    let cfg = TEMA.atual();
    const orbe = (a, b, id = '') => `<span class="orbe"${id ? ` id="${id}"` : ''} style="--a:${esc(a)};--b:${esc(b)}"></span>`;
    const modos = [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Igual ao sistema']];
    abrirModal({
      titulo: 'Aparência',
      ok: 'Pronto',
      corpo: `<div class="aparencia" id="aparencia">
        <div><span class="ap-rotulo">Tema</span>
          <div class="segmento" role="radiogroup" aria-label="Tema">
            ${modos.map(([v, n]) => `<label><input type="radio" name="modo" value="${v}"${cfg.modo === v ? ' checked' : ''}><span>${n}</span></label>`).join('')}
          </div></div>
        <div><span class="ap-rotulo">Paleta</span>
          <div class="paletas" role="radiogroup" aria-label="Paleta">
            ${TEMA.PALETAS.map((p) => `<label class="paleta"><input type="radio" name="paleta" value="${esc(p.id)}"${cfg.paleta === p.id ? ' checked' : ''}>${orbe(p.principal, p.destaque)}<span class="nome">${esc(p.nome)}</span></label>`).join('')}
            <label class="paleta"><input type="radio" name="paleta" value="propria"${cfg.paleta === 'propria' ? ' checked' : ''}>${orbe(cfg.principal, cfg.destaque, 'orbePropria')}<span class="nome">Sua paleta</span></label>
          </div></div>
        <div class="ap-propria" id="apPropria"${cfg.paleta === 'propria' ? '' : ' hidden'}>
          <label><input type="color" name="principal" value="${esc(cfg.principal)}"> Cor principal</label>
          <label><input type="color" name="destaque" value="${esc(cfg.destaque)}"> Cor do fundo</label>
          <p>A cor principal vai nos botões, na seleção e nos links. A cor do fundo aparece nas ondas atrás dos painéis. O resto (céu, vidro e textos) se ajusta sozinho.</p>
        </div>
        <button type="button" class="btn sm ghost ap-restaurar" id="apRestaurar">Voltar ao padrão</button>
      </div>`,
      aoConfirmar: () => {},
    });
    $('#modalCancel').hidden = true; // as mudanças já valem na hora; é só fechar
    const caixa = $('#aparencia');
    const aplicar = () => {
      cfg = TEMA.validar(cfg);
      TEMA.aplicar(cfg);
      salvar({ aparencia: cfg });
    };
    const mostrarPropria = () => {
      $('#apPropria').hidden = cfg.paleta !== 'propria';
      const o = $('#orbePropria');
      o.style.setProperty('--a', cfg.principal);
      o.style.setProperty('--b', cfg.destaque);
    };
    caixa.addEventListener('change', (e) => {
      const { name, value } = e.target;
      if (name === 'modo') cfg.modo = value;
      else if (name === 'paleta') cfg.paleta = value;
      else return;
      mostrarPropria();
      aplicar();
    });
    caixa.addEventListener('input', (e) => {
      const { name, value } = e.target;
      if (name !== 'principal' && name !== 'destaque') return;
      cfg[name] = value;
      cfg.paleta = 'propria';
      const r = caixa.querySelector('input[name=paleta][value=propria]');
      if (r) r.checked = true;
      mostrarPropria();
      aplicar();
    });
    $('#apRestaurar').addEventListener('click', () => {
      cfg = { ...TEMA.PADRAO };
      for (const r of caixa.querySelectorAll('input[type=radio]')) r.checked = r.value === (r.name === 'modo' ? cfg.modo : cfg.paleta);
      caixa.querySelector('input[name=principal]').value = cfg.principal;
      caixa.querySelector('input[name=destaque]').value = cfg.destaque;
      mostrarPropria();
      aplicar();
    });
  }

  // ================= Canais (criar / apagar) =================
  function abrirModal({ titulo, corpo, ok = 'OK', perigo = false, aoConfirmar }) {
    $('#modalCancel').hidden = false;
    $('#modalTitle').textContent = titulo;
    $('#modalBody').innerHTML = corpo;
    const okBtn = $('#modalOk');
    okBtn.textContent = ok;
    okBtn.className = 'btn ' + (perigo ? 'danger' : 'primary');
    $('#modal').hidden = false;
    const input = $('#modalBody input[type=text]');
    if (input) setTimeout(() => input.focus(), 30);
    const fechar = () => {
      $('#modal').hidden = true;
      $('#modalForm').onsubmit = null;
    };
    $('#modalCancel').onclick = fechar;
    $('#modal').onclick = (e) => { if (e.target.id === 'modal') fechar(); };
    $('#modalForm').onsubmit = async (e) => {
      e.preventDefault();
      okBtn.disabled = true;
      try {
        await aoConfirmar(new FormData($('#modalForm')));
        fechar();
      } catch (err) {
        toast(err.message);
      } finally {
        okBtn.disabled = false;
      }
    };
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modal').hidden) {
      $('#modal').hidden = true;
      e.preventDefault();
    }
  });

  function criarCanal(tipo) {
    abrirModal({
      titulo: 'Criar canal',
      ok: 'Criar',
      corpo: `<div class="radio-row">
          <label><input type="radio" name="type" value="text" ${tipo !== 'sala' ? 'checked' : ''}> ${icon('hash')} Texto</label>
          <label><input type="radio" name="type" value="sala" ${tipo === 'sala' ? 'checked' : ''}> ${icon('screen')} Sala de tela</label>
        </div>
        <label class="field"><span>Nome</span><input type="text" name="name" maxlength="24" required placeholder="${tipo === 'sala' ? 'Cinema' : 'novo-canal'}" autocomplete="off"></label>`,
      aoConfirmar: async (fd) => {
        const r = await api('channel', { name: fd.get('name'), type: fd.get('type') });
        if (r.id) {
          setTimeout(() => {
            if (chan(r.id)) selecionarCanal(r.id);
          }, 150);
        }
      },
    });
  }

  function apagarCanal(id) {
    const c = chan(id);
    if (!c) return;
    abrirModal({
      titulo: c.type === 'sala' ? 'Apagar sala' : 'Apagar canal',
      ok: 'Apagar',
      perigo: true,
      corpo: `<p>Tem certeza que quer apagar <b>${c.type === 'sala' ? '' : '#'}${esc(c.name)}</b>? As mensagens dele também vão sumir, para todo mundo.</p>`,
      aoConfirmar: () => api('channel-delete', { id }),
    });
  }

  function selecionarCanal(id) {
    const c = chan(id);
    if (!c) return;
    S.view = id;
    S.unread.delete(id);
    S.mencoes.delete(id);
    if (S.resposta && S.resposta.ch !== id) cancelarResposta();
    S.editando = null;
    salvar({ view: id });
    $('#sidebar').classList.remove('open');
    if (c.type === 'sala' && S.sala !== id) entrarNaSala(id);
    renderTudo();
    renderMensagens();
    if (window.matchMedia('(min-width: 721px)').matches && (c.type === 'text' || S.showSalaChat)) $('#msgInput').focus();
  }

  // ================= Botões fixos =================
  function montarBotoes() {
    $('#inviteBtn').innerHTML = icon('link');
    $('#railBrand').innerHTML = LOGO;
    $('#menuBtn').innerHTML = icon('menu');
    $('#toggleChatBtn').innerHTML = icon('chat');
    $('#toggleMembersBtn').innerHTML = icon('people');
    $('#logoutBtn').innerHTML = icon('logout');
    $('#aparenciaBtn').innerHTML = icon('paleta');
    $('#audioBtn').innerHTML = icon('engrenagem');
    $('#ajudaBtn').innerHTML = icon('ajuda');
    $('#ajudaBtn').addEventListener('click', () => abrirRelatarProblema().catch((e) => toast(e.message)));
    $('#vozOpcoesBtn').innerHTML = icon('engrenagem');
    for (const sel of ['#micBtn', '#vpMic']) $(sel).addEventListener('click', alternarMudo);
    for (const sel of ['#surdoBtn', '#vpSurdo']) $(sel).addEventListener('click', alternarSurdo);
    for (const sel of ['#audioBtn', '#vozOpcoesBtn']) $(sel).addEventListener('click', abrirOpcoesAudio);
    renderVoz();
    $('#aparenciaBtn').addEventListener('click', abrirAparencia);
    $('#vpLeave').innerHTML = icon('logout');
    $('#sendBtn').innerHTML = icon('send');

    $('#sendVol').addEventListener('input', (e) => {
      S.volEnvio = Number(e.target.value);
      salvar({ volEnvio: S.volEnvio });
      $('#sendVolPct').textContent = `${Math.round(S.volEnvio * 100)}%`;
      if (S.envio) S.envio.gain.gain.setTargetAtTime(S.volEnvio, S.envio.gain.context.currentTime, 0.02);
    });

    montarSons();
    montarCaneta();
    $('#ajustesBtn').innerHTML = `${icon('sliders')} Ajustes`;
    $('#ajustesBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('#ajustesPanel').hidden = !$('#ajustesPanel').hidden;
      $('#sonsPanel').hidden = true;
      $('#canetaPanel').hidden = true;
    });
    document.addEventListener('click', (e) => {
      if (!$('#ajustesPanel').hidden && !e.target.closest('#ajustesPanel, #ajustesBtn')) $('#ajustesPanel').hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#ajustesPanel').hidden) { $('#ajustesPanel').hidden = true; e.preventDefault(); }
    });
    const up = $('#uploadSelect');
    up.innerHTML = UPLOADS.map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    up.value = S.upload;
    up.addEventListener('change', () => {
      S.upload = up.value;
      salvar({ upload: S.upload });
      if (S.upload === 'auto') ORC.total = 8e6;
      aplicarOrcamento();
    });

    const som = $('#somSelect');
    if (PROGRAMA) som.innerHTML = '<option value="pc">Escolher na hora de compartilhar</option><option value="nenhum">Sem som</option>';
    som.value = S.som;
    $('#programaDica').hidden = !!PROGRAMA || !NO_WINDOWS;
    const dicaSom = () => {
      const pc = S.som === 'pc';
      const el = $('#somDica');
      if (PROGRAMA) {
        el.hidden = S.som === 'nenhum';
        el.classList.remove('aviso');
        el.textContent = 'Na janela de compartilhar você escolhe o som: só da janela, só de um programa (bom para jogo em tela cheia) ou o do computador todo. Nos dois primeiros, a voz do Discord não vai junto.';
        return;
      }
      el.classList.toggle('aviso', pc);
      el.hidden = S.som === 'nenhum';
      const antigo = navegadorAntigo();
      el.classList.toggle('aviso', pc || antigo);
      el.textContent = pc
        ? 'Atenção: entra todo o som do computador, inclusive a chamada de voz (Discord, WhatsApp…). Quem estiver na chamada vai ouvir a própria voz.'
        : antigo
          ? `Seu navegador (versão ${versaoChromium()}) é antigo: numa janela, ele só consegue mandar o som do sistema, e isso dá eco. Atualize o Chrome ou o Edge, ou compartilhe uma aba com "Compartilhar áudio da guia".`
          : 'Na janela de escolha, ligue o áudio: "Compartilhar áudio do aplicativo" para uma janela, ou "Compartilhar áudio da guia" para uma aba. A chamada de voz não entra.';
    };
    dicaSom();
    som.addEventListener('change', () => {
      S.som = som.value;
      salvar({ som: S.som, somV: 2 });
      dicaSom();
    });

    const sel = $('#qualitySelect');
    sel.innerHTML = Object.entries(QUALIDADES).map(([k, q]) => `<option value="${k}">${q.label}</option>`).join('');
    sel.value = S.quality;
    sel.addEventListener('change', () => {
      S.quality = sel.value;
      salvar({ quality: S.quality });
      aplicarQualidade();
    });

    $('#adminBtn').innerHTML = icon('shield');
    $('#adminBtn').addEventListener('click', () => abrirPainelAdmin());
    // lista de membros: clique ou botão direito abre o menu da pessoa
    $('#members').addEventListener('click', (e) => {
      const row = e.target.closest('.member[data-chave]');
      if (!row) return;
      e.stopPropagation();
      if (MM.el && MM.chave === row.dataset.chave && !MM.ponto) return fecharMenuMembro();
      abrirMenuMembro(row, null);
    });
    $('#members').addEventListener('contextmenu', (e) => {
      const row = e.target.closest('.member[data-chave]');
      if (!row) return;
      e.preventDefault();
      abrirMenuMembro(row, e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : null);
    });
    $('#members').addEventListener('keydown', (e) => {
      const row = e.target.closest('.member[data-chave]');
      if (!row) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
        e.preventDefault();
        abrirMenuMembro(row, null);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const todas = [...$('#members').querySelectorAll('.member[data-chave]')];
        const i = todas.indexOf(row) + (e.key === 'ArrowDown' ? 1 : -1);
        if (todas[i]) { e.preventDefault(); todas[i].focus(); }
      }
    });
    $('#members').addEventListener('scroll', () => { if (MM.el && !MM.ponto) posicionarMenuMembro(); }, { passive: true });
    document.addEventListener('pointerdown', (e) => {
      if (MM.el && !e.target.closest('#menuMembro, #members .member[data-chave]')) fecharMenuMembro();
    });
    window.addEventListener('resize', () => fecharMenuMembro());
    // "offline há X" vai andando sozinho
    setInterval(() => { if (!$('#members').hidden && $('#members .member.offline')) renderMembros(); }, 60e3);

    $('#channels').addEventListener('click', (e) => {
      const ren = e.target.closest('[data-rename]');
      if (ren) { e.stopPropagation(); return renomearCanal(ren.dataset.rename); }
      const del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); return apagarCanal(del.dataset.del); }
      const add = e.target.closest('[data-add]');
      if (add) return criarCanal(add.dataset.add);
      const col = e.target.closest('[data-collapse]');
      if (col) {
        S.collapsed[col.dataset.collapse] = !S.collapsed[col.dataset.collapse];
        return renderSidebar();
      }
      const ch = e.target.closest('[data-ch]');
      if (ch) selecionarCanal(ch.dataset.ch);
    });

    $('#shareBtn').addEventListener('click', () => (S.live ? pararTransmissao() : compartilharTela()));
    $('#vpShare').addEventListener('click', () => (S.live ? pararTransmissao() : compartilharTela()));
    $('#swapBtn').addEventListener('click', trocarTela);
    $('#vpSwap').innerHTML = icon('swap');
    $('#vpSwap').addEventListener('click', trocarTela);
    $('#joinBtn').addEventListener('click', () => entrarNaSala(S.view));
    $('#leaveBtn').addEventListener('click', sairDaSala);
    $('#vpLeave').addEventListener('click', sairDaSala);
    $('#vpInfo').addEventListener('click', () => S.sala && selecionarCanal(S.sala));

    $('#toggleChatBtn').addEventListener('click', () => {
      S.showSalaChat = !S.showSalaChat;
      salvar({ showSalaChat: S.showSalaChat });
      if (S.showSalaChat) S.unread.delete(S.view);
      renderTudo();
      if (S.showSalaChat) renderMensagens();
    });
    $('#toggleMembersBtn').addEventListener('click', () => {
      if (window.matchMedia('(max-width: 900px)').matches) {
        $('#members').classList.toggle('force');
        return;
      }
      S.showMembers = !S.showMembers;
      salvar({ showMembers: S.showMembers });
      renderHeader();
    });

    $('#inviteBtn').addEventListener('click', async () => {
      const link = location.origin;
      try {
        await navigator.clipboard.writeText(link);
        toast(`Link copiado: ${link}${S.password ? ' — passe a senha também!' : ''}`);
      } catch {
        toast(`Mande este link para os seus amigos: ${link}`, 8000);
      }
    });

    $('#logoutBtn').addEventListener('click', () => {
      abrirModal({
        titulo: 'Sair do servidor',
        ok: 'Sair',
        perigo: true,
        corpo: `<p>Quer sair? O seu nome continua guardado neste aparelho: da próxima vez, é só clicar em Entrar.${lembreteAdmin() ? ' Este aparelho deixa de ser lembrado como admin.' : ''}</p>`,
        aoConfirmar: async () => {
          const l = lembreteAdmin();
          if (l) await api('esquecer-lembrete', { token: l.token }).catch(() => {});
          salvar({ password: '', adminPassword: '', lembreteAdmin: null });
          try { sessionStorage.setItem('telinha-sem-auto', '1'); } catch { /* ok */ }
          S.saindoDeVez = true;
          sairDaPagina();
          location.reload();
        },
      });
    });

    $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#sidebarBackdrop').addEventListener('click', () => $('#sidebar').classList.remove('open'));
  }

  // ================= Moderação: eventos recebidos =================
  const nomeCanal = (id) => { const c = chan(id); return c ? (c.type === 'sala' ? c.name : '#' + c.name) : 'o canal'; };

  function rerenderMantendoScroll() {
    const box = $('#messages');
    const topo = box.scrollTop;
    const colado = S.stick;
    // editando uma mensagem: continua com o cursor no mesmo lugar
    const ed = document.activeElement?.classList?.contains('m-edit') ? document.activeElement : null;
    const cursor = ed ? [ed.selectionStart, ed.selectionEnd] : null;
    renderMensagens(true);
    box.scrollTop = colado ? box.scrollHeight : topo;
    const t = cursor && $('#messages .m-edit');
    if (t) { t.focus(); t.setSelectionRange(cursor[0], cursor[1]); autoAlturaDe(t); }
  }

  function onMsgEdit(m) {
    const lista = S.messages[m.channel] || [];
    const x = lista.find((y) => y.id === m.id);
    if (x) { x.text = m.text; x.editada = m.editada; }
    // as respostas a ela mostram o texto novo, mesmo se a original não estiver carregada
    let citada = false;
    for (const y of lista) if (y.resp?.id === m.id) { y.resp.texto = String(m.text).slice(0, 160); citada = true; }
    if (S.resposta?.id === m.id && S.resposta.texto) { S.resposta.texto = textoComNomes(m.text).replace(/\s+/g, ' ').slice(0, 90); renderRespBar(); }
    if ((x || citada) && m.channel === S.view) rerenderMantendoScroll();
  }

  function onMsgDelete(m) {
    (S.apagadas ||= new Set()).add(m.id); // quem respondeu a ela passa a mostrar "mensagem apagada"
    if (S.editando?.id === m.id) S.editando = null;
    if (S.resposta?.id === m.id) cancelarResposta();
    const lista = S.messages[m.channel];
    if (!lista) return;
    const i = lista.findIndex((x) => x.id === m.id);
    if (i < 0) return;
    lista.splice(i, 1);
    if (m.channel === S.view) rerenderMantendoScroll();
  }

  function onClear(m) {
    S.messages[m.channel] = [];
    if (S.antigas) S.antigas[m.channel] = 0;
    if (m.channel === S.view) renderMensagens();
    toast(`${m.by} limpou as mensagens de ${nomeCanal(m.channel)}.`);
  }

  function onSettings(m) {
    S.serverName = m.serverName;
    S.locked = !!m.locked;
    document.title = MARCA;
    renderTudo();
    atualizarPainel();
  }

  function mostrarAviso(m) {
    const el = $('#announce');
    el.innerHTML = `${icon('megaphone')}<div class="an-text"><b>Aviso de ${esc(m.by)}:</b> ${formatar(m.text)}</div><button class="icon-btn small" data-close-announce title="Fechar">${icon('close')}</button>`;
    el.hidden = false;
    blip('live');
  }
  $('#announce').addEventListener('click', (e) => {
    if (e.target.closest('[data-close-announce]')) $('#announce').hidden = true;
  });

  function foiExpulso(info) {
    if (S.kicked) return;
    S.kicked = info || {};
    S.saindoDeVez = true;
    try { pararTransmissao(true, 'expulso'); } catch { /* ok */ }
    for (const id of [...S.inc.keys()]) fecharInc(id);
    if (S.es) { S.es.close(); S.es = null; }
    clearTimeout(S.sseWatch);
    clearTimeout(S.rejoinTimer);
    S.token = null;
    let msg;
    if (info.locked) msg = 'O servidor foi trancado por um admin e você não conseguiu voltar.';
    else if (info.banned) msg = `Você foi banido deste servidor${info.by ? ` por ${info.by}` : ''}.`;
    else msg = `Você foi expulso${info.by ? ` por ${info.by}` : ''}. Pode entrar de novo se quiser.`;
    if (info.reason) msg += ` Motivo: ${info.reason}`;
    try {
      sessionStorage.setItem('telinha-aviso', msg);
      sessionStorage.setItem('telinha-sem-auto', '1');
    } catch { /* ok */ }
    location.reload();
  }

  function onMuted(m) {
    S.mutedUntil = m.until || 0;
    atualizarComposer();
    if (m.until) {
      // o microfone fica desligado e só volta quando a própria pessoa ligar de novo
      VOZ.mudo = true;
      guardarVoz();
    }
    atualizarMicrofone();
    renderTudo();
    if (m.until) {
      const longo = m.until - Date.now() > 300 * 864e5;
      toast(`${m.by} silenciou você no chat e na voz ${longo ? 'até segunda ordem' : `até ${hhmm(new Date(m.until))}`}.`, 6000);
      setTimeout(renderVoz, Math.min(m.until - Date.now() + 500, 2 ** 31 - 1));
    } else {
      toast(`${m.by} tirou o seu silêncio. Pode falar de novo!`);
    }
  }

  function onForce(m) {
    if (m.what === 'stop') {
      pararTransmissao(true, 'admin');
      toast(`${m.by} encerrou a sua transmissão.`);
    } else {
      sairDaSalaLocal('admin');
      toast(`${m.by} tirou você da sala.`);
    }
    renderTudo();
  }

  function onRole(m) {
    S.isAdmin = !!m.admin;
    if (!m.admin) {
      esquecerEsteAparelho();
      fecharPainelAdmin();
    }
    toast(m.admin
      ? (m.by ? `${m.by} deu admin para você (até você sair).` : 'Modo admin ativado. Digite / no chat para ver os comandos.')
      : (m.by ? `${m.by} tirou o seu admin.` : 'Você saiu do modo admin.'), 5000);
    renderTudo();
    rerenderMantendoScroll();
  }

  // senhas novas do TURN (renovadas a cada ~20 min, ou cortadas): as conexões abertas passam a usar
  // as novas sem cair (a Cloudflare aceita a troca pelo setConfiguration)
  function onIce(lista) {
    if (!Array.isArray(lista)) return;
    S.iceServers = lista;
    for (const c of [...S.inc.values(), ...S.out.values(), ...VOZ.pcs.values()]) {
      try {
        if (c?.pc && c.pc.signalingState !== 'closed') c.pc.setConfiguration({ ...c.pc.getConfiguration(), iceServers: lista });
      } catch { /* fica com as anteriores */ }
    }
  }
  function onPerfil(m) {
    if (typeof m.id !== 'string' || typeof m.nome !== 'string') return;
    (S.perfis ||= {})[m.id] = { ...S.perfis[m.id], nome: m.nome, cor: m.cor, ...(m.visto !== undefined ? { visto: m.visto } : {}), fora: !!m.fora };
    // o volume da voz e dos sons de cada pessoa fica guardado pelo nome: acompanha a troca
    if (m.antes && m.antes !== m.nome) {
      for (const [obj, chave] of [[VOLUMES_VOZ, 'volVoz'], [VOLUMES_EFEITOS, 'volEfeitos']]) {
        if (obj[m.antes] && !obj[m.nome]) { obj[m.nome] = obj[m.antes]; delete obj[m.antes]; salvar({ [chave]: obj }); }
      }
    }
    if (m.id === S.myPid) {
      S.myName = m.nome;
      S.myColor = m.cor;
      salvar({ name: m.nome, color: m.cor });
    }
    rerenderMantendoScroll();
    renderTudo();
  }

  // ----- Seu nome: trocar o nome e a cor, e entrar em outro aparelho -----
  function abrirPerfil() {
    if (!S.myPid) return toast('Entre de novo para ter um nome guardado.');
    abrirModal({
      titulo: 'Seu nome',
      ok: 'Salvar',
      corpo: `<label class="field"><span>Apelido</span><input type="text" name="nome" maxlength="32" required value="${esc(S.myName)}" autocomplete="off"></label>
        <p class="muted small">É o nome que todo mundo vê. Trocando, as suas mensagens antigas passam a mostrar o nome novo.</p>
        <div class="field"><span>Sua cor</span><div class="color-picker pf-cores">${CORES.map((c) => `<label class="pf-cor"><input type="radio" name="cor" value="${c}"${c === S.myColor ? ' checked' : ''}><span style="background:${c}" aria-label="Cor ${c}"></span></label>`).join('')}</div></div>
        <div class="pf-secao"><b>Entrar em outro aparelho</b>
          <p class="muted small">Gere um código e, no outro aparelho, clique em "Já tenho um nome" na tela de entrada. O código vale 15 minutos.</p>
          <button type="button" class="btn sm" id="pfCodigo">Gerar código</button><div class="pf-codigo" id="pfCodigoVer" hidden></div></div>
        <div class="pf-secao"><button type="button" class="link-btn perigo" id="pfEsquecer">Esquecer este aparelho</button>
          <p class="muted small">Ele deixa de entrar com o seu nome. Para voltar, só com um código.</p></div>`,
      aoConfirmar: async (fd) => {
        const r = await api('perfil', { nome: fd.get('nome'), cor: fd.get('cor') || undefined });
        toast(r.nome !== S.myName ? `Pronto: agora você é "${r.nome}".` : 'Salvo.');
      },
    });
    $('#pfCodigo').onclick = async () => {
      try {
        const r = await api('perfil-codigo');
        const ver = $('#pfCodigoVer');
        ver.hidden = false;
        ver.innerHTML = `<span class="pf-codigo-txt">${esc(r.codigo)}</span><span class="muted small">vale até ${hhmm(new Date(r.ate))}</span>`;
      } catch (e) { toast(e.message); }
    };
    $('#pfEsquecer').onclick = () => {
      abrirModal({
        titulo: 'Esquecer este aparelho',
        ok: 'Esquecer e sair',
        perigo: true,
        corpo: `<p>Este aparelho deixa de entrar como <b>${esc(S.myName)}</b> e você sai agora. Para voltar com o mesmo nome, vai precisar de um código de acesso (gerado num aparelho seu ou por um admin).</p>`,
        aoConfirmar: async () => {
          await api('perfil-esquecer').catch(() => {});
          salvar({ perfil: null, name: '', password: '', adminPassword: '' });
          S.saindoDeVez = true;
          sairDaPagina();
          location.reload();
        },
      });
    };
  }
  $('#meInfo')?.addEventListener('click', abrirPerfil);
  $('#meInfo')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirPerfil(); } });

  function onRenamed(m) {
    S.myName = m.name;
    salvar({ name: m.name });
    renderPaineis();
    toast(`${m.by} mudou o seu apelido para "${m.name}".`);
  }

  // ================= Ações sobre mensagens e canais =================
  function apagarMensagem(id, direto) {
    const m = (S.messages[S.view] || []).find((x) => x.id === id);
    if (!m) return;
    const apagar = () => api('msg-delete', { channel: S.view, id, pos: m.pos });
    if (direto) return apagar().catch((e) => toast(e.message));
    abrirModal({
      titulo: 'Apagar mensagem',
      ok: 'Apagar',
      perigo: true,
      corpo: `<p>Apagar esta mensagem de <b>${esc(autorDe(m).name)}</b>? Ela some para todo mundo.</p><div class="msg-preview">${formatar(m.text)}</div>`,
      aoConfirmar: apagar,
    });
  }

  function renomearCanal(id) {
    const c = chan(id);
    if (!c) return;
    abrirModal({
      titulo: c.type === 'sala' ? 'Renomear sala' : 'Renomear canal',
      ok: 'Salvar',
      corpo: `<label class="field"><span>Novo nome</span><input type="text" name="name" maxlength="24" required value="${esc(c.name)}" autocomplete="off"></label>`,
      aoConfirmar: (fd) => api('channel-rename', { id, name: fd.get('name') }),
    });
  }

  // ================= Comandos no chat =================
  const COMANDOS = [
    { nome: 'admin', args: '<senha>', desc: 'Entrar no modo admin', todos: true },
    { nome: 'ajuda', args: '', desc: 'Ver todos os comandos', todos: true },
    { nome: 'painel', args: '', desc: 'Abrir o painel de admin' },
    { nome: 'kick', args: '<nome> [motivo]', desc: 'Expulsar (a pessoa pode voltar)' },
    { nome: 'ban', args: '<nome> [motivo]', desc: 'Banir do servidor' },
    { nome: 'unban', args: '<nome>', desc: 'Tirar o banimento' },
    { nome: 'mute', args: '<nome> [minutos]', desc: 'Silenciar no chat e na voz (sem minutos = até tirar)' },
    { nome: 'unmute', args: '<nome>', desc: 'Tirar o silêncio' },
    { nome: 'parar', args: '<nome>', desc: 'Encerrar a transmissão de alguém' },
    { nome: 'tirar', args: '<nome>', desc: 'Tirar alguém da sala de tela' },
    { nome: 'daradmin', args: '<nome>', desc: 'Dar admin (até a pessoa sair)' },
    { nome: 'tiraradmin', args: '<nome>', desc: 'Tirar o admin de alguém' },
    { nome: 'limpar', args: '', desc: 'Apagar todas as mensagens deste canal' },
    { nome: 'aviso', args: '<texto>', desc: 'Mostrar um aviso no topo para todo mundo' },
    { nome: 'nome', args: '<nome do servidor>', desc: 'Mudar o nome do servidor' },
    { nome: 'senha', args: '<nova senha>', desc: 'Mudar a senha de entrada' },
    { nome: 'semsenha', args: '', desc: 'Tirar a senha de entrada' },
    { nome: 'trancar', args: '', desc: 'Ninguém novo entra (admins entram)' },
    { nome: 'destrancar', args: '', desc: 'Liberar a entrada de novo' },
    { nome: 'sairadmin', args: '', desc: 'Sair do modo admin' },
  ];
  const comandosVisiveis = () => COMANDOS.filter((c) => c.todos || S.isAdmin);

  function acharPessoa(resto) {
    const txt = resto.replace(/^@/, '').trim();
    if (!txt) return { erro: 'Diga o nome da pessoa.' };
    const low = txt.toLowerCase();
    const outros = S.users.filter((u) => u.id !== S.myId);
    for (const u of [...outros].sort((a, b) => b.name.length - a.name.length)) {
      const n = u.name.toLowerCase();
      if (low === n || low.startsWith(n + ' ')) return { u, resto: txt.slice(u.name.length).trim() };
    }
    const palavra = low.split(/\s+/)[0];
    const cands = outros.filter((u) => u.name.toLowerCase().startsWith(palavra));
    if (cands.length === 1) return { u: cands[0], resto: txt.split(/\s+/).slice(1).join(' ') };
    if (cands.length > 1) return { erro: `Mais de uma pessoa começa com "${palavra}": ${cands.map((u) => u.name).join(', ')}.` };
    return { erro: `Ninguém online com o nome "${txt.split(/\s+/)[0]}".` };
  }

  const adm = (action, extra = {}) => api('admin', { action, ...extra });

  async function executarComando(texto) {
    const m = texto.match(/^\/(\S+)\s*([\s\S]*)$/);
    const nome = (m ? m[1] : '').toLowerCase();
    const resto = m ? m[2].trim() : '';
    const cmd = COMANDOS.find((c) => c.nome === nome);
    if (!cmd) throw new Error(`Comando desconhecido: /${nome}. Digite /ajuda para ver a lista.`);
    if (!cmd.todos && !S.isAdmin) throw new Error('Só admins podem usar esse comando. Entre no modo admin com /admin <senha>.');
    const comAlvo = (fn) => {
      const r = acharPessoa(resto);
      if (r.erro) throw new Error(r.erro);
      return fn(r.u, r.resto);
    };
    switch (nome) {
      case 'admin':
        if (!resto) throw new Error('Use: /admin <senha>');
        {
          const r = await api('admin-login', { password: resto });
          if (r.lembrete?.token) salvar({ lembreteAdmin: r.lembrete, adminPassword: '' });
          else S.adminPassword = resto;
        }
        return;
      case 'sairadmin':
        await api('admin-logout');
        return;
      case 'ajuda':
        if (S.isAdmin) return abrirPainelAdmin('comandos');
        return toast('Para virar admin: /admin <senha>', 6000);
      case 'painel':
        return abrirPainelAdmin();
      case 'kick':
        return comAlvo(async (u, motivo) => { await adm('kick', { uid: u.id, reason: motivo }); toast(`${u.name} foi expulso.`); });
      case 'ban':
        return comAlvo(async (u, motivo) => {
          const r = await adm('ban', { uid: u.id, reason: motivo });
          toast(`${u.name} foi banido.${r.soAparelho ? ' (Só este navegador: o IP é o mesmo de outra pessoa online.)' : ''}`, 6000);
        });
      case 'unban': {
        const alvo = resto.replace(/^@/, '').toLowerCase();
        if (!alvo) throw new Error('Use: /unban <nome>');
        const { bans } = await adm('list');
        let achados = bans.filter((b) => b.name.toLowerCase() === alvo);
        if (!achados.length) achados = bans.filter((b) => b.name.toLowerCase().startsWith(alvo));
        if (!achados.length) throw new Error(`Ninguém banido com o nome "${resto}".`);
        for (const b of achados) await adm('unban', { id: b.id });
        return toast(`Banimento removido: ${achados.map((b) => b.name).join(', ')}.`);
      }
      case 'mute':
        return comAlvo(async (u, r) => {
          const min = parseInt(r, 10);
          await adm('mute', { uid: u.id, minutes: min > 0 ? min : 0 });
          toast(`${u.name} foi silenciado ${min > 0 ? `por ${min} min` : 'até você tirar'}.`);
        });
      case 'unmute':
        return comAlvo(async (u) => { await adm('unmute', { uid: u.id }); toast(`${u.name} pode falar de novo.`); });
      case 'parar':
        return comAlvo(async (u) => {
          if (!u.live) throw new Error(`${u.name} não está transmitindo.`);
          await adm('stop-stream', { uid: u.id });
          toast(`Transmissão de ${u.name} encerrada.`);
        });
      case 'tirar':
        return comAlvo(async (u) => {
          if (!u.sala) throw new Error(`${u.name} não está em nenhuma sala.`);
          await adm('remove-sala', { uid: u.id });
          toast(`${u.name} saiu da sala.`);
        });
      case 'daradmin':
      case 'tiraradmin':
        return comAlvo(async (u) => {
          if (nome === 'daradmin' && u.admin) throw new Error(`${u.name} já é admin.`);
          if (nome === 'tiraradmin' && !u.admin) throw new Error(`${u.name} não é admin.`);
          await adm('toggle-admin', { uid: u.id });
          toast(nome === 'daradmin' ? `${u.name} agora é admin.` : `${u.name} não é mais admin.`);
        });
      case 'limpar':
        return abrirModal({
          titulo: 'Limpar canal',
          ok: 'Apagar tudo',
          perigo: true,
          corpo: `<p>Apagar <b>todas</b> as mensagens de <b>${esc(nomeCanal(S.view))}</b>? Não dá para desfazer.</p>`,
          aoConfirmar: () => adm('clear', { channel: S.view }),
        });
      case 'aviso':
        if (!resto) throw new Error('Use: /aviso <texto>');
        return adm('announce', { text: resto });
      case 'nome':
        if (!resto) throw new Error('Use: /nome <nome do servidor>');
        await adm('settings', { serverName: resto });
        return toast('Nome do servidor alterado.');
      case 'senha':
        if (!resto) throw new Error('Use: /senha <nova senha>  (ou /semsenha para tirar a senha)');
        await adm('settings', { senha: resto });
        return toast('Senha de entrada trocada. Quem já está aqui continua conectado.', 5000);
      case 'semsenha':
        await adm('settings', { senha: '' });
        return toast('Agora qualquer pessoa com o link consegue entrar.', 5000);
      case 'trancar':
      case 'destrancar':
        await adm('settings', { locked: nome === 'trancar' });
        return toast(nome === 'trancar' ? 'Servidor trancado: ninguém novo entra.' : 'Servidor destrancado.');
    }
  }

  // Sugestões ao digitar "/"
  function renderSugestoes() {
    const box = $('#cmdSuggest');
    const v = $('#msgInput').value;
    let itens = [];
    let m;
    if ((m = v.match(/^\/(\S*)$/))) {
      itens = comandosVisiveis().filter((c) => c.nome.startsWith(m[1].toLowerCase()));
    } else if ((m = v.match(/^\/(\S+)\s/))) {
      const c = comandosVisiveis().find((x) => x.nome === m[1].toLowerCase());
      if (c && c.args) itens = [c];
    }
    S.sugestaoMencao = null;
    if (!itens.length) {
      // "@" antes do cursor: lista de nomes para mencionar
      const q = consultaDeMencao();
      const nomes = q ? itensDeMencao(q.q) : [];
      if (nomes.length) {
        S.sugestaoMencao = { ...q, itens: nomes, sel: 0 };
        return desenharMencoes();
      }
      box.hidden = true;
      return;
    }
    box.innerHTML = `<div class="cs-title">Comandos</div>` + itens.map((c, i) =>
      `<div class="cs-item${i === 0 ? ' sel' : ''}" data-cmd="${c.nome}"><b>/${c.nome}</b><span class="args">${esc(c.args)}</span><span class="desc">${esc(c.desc)}</span></div>`).join('');
    box.hidden = false;
  }
  // ----- Menções: a lista de nomes ao digitar "@" -----
  function consultaDeMencao() {
    const input = $('#msgInput');
    const ate = input.selectionStart ?? input.value.length;
    const m = input.value.slice(0, ate).match(/(^|[^\p{L}\p{N}_])@([^@\n]{0,32})$/u);
    return m ? { q: m[2], ini: ate - m[2].length - 1, fim: ate } : null;
  }
  function itensDeMencao(q) {
    const nq = tiraAcento(q);
    const online = new Set(S.users.map((u) => u.pid).filter(Boolean));
    const lista = Object.entries(S.perfis || {})
      .filter(([id, p]) => id !== S.myPid && (tiraAcento(p.nome).startsWith(nq) || tiraAcento(p.nome).split(' ').some((w) => w.startsWith(nq))))
      .sort((a, b) => (online.has(b[0]) - online.has(a[0])) || a[1].nome.localeCompare(b[1].nome, 'pt-BR'))
      .slice(0, 7)
      .map(([id, p]) => ({ id, nome: p.nome, cor: p.cor, online: online.has(id) }));
    if (['everyone', 'todos'].some((x) => x.startsWith(nq))) lista.push({ id: 'everyone', nome: 'everyone' });
    return lista;
  }
  function desenharMencoes() {
    const sm = S.sugestaoMencao;
    const box = $('#cmdSuggest');
    box.innerHTML = '<div class="cs-title">Mencionar</div>' + sm.itens.map((x, i) => (x.id === 'everyone'
      ? `<div class="cs-item cs-mencao${i === sm.sel ? ' sel' : ''}" data-mencao="${i}"><span class="cs-todos">@</span><b>@everyone</b><span class="desc">avisa todo mundo</span></div>`
      : `<div class="cs-item cs-mencao${i === sm.sel ? ' sel' : ''}" data-mencao="${i}">${avatar({ name: x.nome, color: x.cor }, 'mini')}<b>${esc(x.nome)}</b><span class="desc">${x.online ? 'online' : ''}</span></div>`)).join('');
    box.hidden = false;
  }
  function inserirMencao(i) {
    const sm = S.sugestaoMencao;
    const x = sm?.itens[i];
    if (!x) return;
    const input = $('#msgInput');
    const v = input.value;
    const texto = `@${x.nome} `;
    input.value = v.slice(0, sm.ini) + texto + v.slice(sm.fim);
    const cursor = sm.ini + texto.length;
    input.focus();
    input.setSelectionRange(cursor, cursor);
    S.sugestaoMencao = null;
    $('#cmdSuggest').hidden = true;
    autoAltura();
  }

  $('#cmdSuggest').addEventListener('mousedown', (e) => {
    const mc = e.target.closest('[data-mencao]');
    if (mc) { e.preventDefault(); return inserirMencao(Number(mc.dataset.mencao)); }
    const it = e.target.closest('[data-cmd]');
    if (!it) return;
    e.preventDefault();
    const input = $('#msgInput');
    input.value = `/${it.dataset.cmd} `;
    input.focus();
    renderSugestoes();
  });

  // ================= Painel de admin =================
  const P = { aberto: false, aba: 'pessoas', dados: null, foco: null, form: null, timer: null, conexoes: null, filtroCon: '' };

  function abrirPainelAdmin(aba = 'pessoas', foco = null) {
    if (!S.isAdmin) return;
    P.aberto = true;
    P.aba = aba;
    P.foco = foco;
    P.form = null;
    $('#adminPanel').hidden = false;
    renderPainel();
    carregarPainel();
  }
  function fecharPainelAdmin() {
    P.aberto = false;
    $('#adminPanel').hidden = true;
  }
  async function carregarPainel() {
    try {
      const [dados, conexoes] = await Promise.all([adm('list'), P.aba === 'conexoes' ? adm('conexoes') : null]);
      P.dados = dados;
      if (conexoes) P.conexoes = conexoes;
      renderPainel();
    } catch (e) {
      toast(e.message);
    }
  }
  function atualizarPainel() {
    if (!P.aberto) return;
    clearTimeout(P.timer);
    P.timer = setTimeout(carregarPainel, 250);
  }

  function renderPainel() {
    if (!P.aberto) return;
    const d = P.dados;
    const abas = [
      ['pessoas', 'Pessoas', d ? d.users.length : ''],
      ['nomes', 'Nomes', ''],
      ['conexoes', 'Conexões', ''],
      ['problemas', 'Problemas', d?.problemasNovos ? d.problemasNovos : ''],
      ['banidos', 'Banidos', d ? d.bans.length : ''],
      ['servidor', 'Servidor', ''],
      ['comandos', 'Comandos', ''],
    ];
    let corpo = '<div class="ap-empty">Carregando…</div>';
    if (d) corpo = { pessoas: abaPessoas, nomes: abaNomes, conexoes: abaConexoes, problemas: abaProblemas, banidos: abaBanidos, servidor: abaServidor, comandos: abaComandos }[P.aba](d);
    // preserva o que estava sendo digitado
    const digitando = {};
    $('#adminPanel').querySelectorAll('input[id], select[id]').forEach((el) => { digitando[el.id] = el.value; });
    const foco = document.activeElement?.id;
    const cursor = foco && typeof document.activeElement.selectionStart === 'number'
      ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    $('#adminPanel').innerHTML = `<div class="admin-card" role="dialog" aria-label="Painel de admin">
      <header class="admin-head"><div class="admin-title">${icon('shield')} Painel de admin</div>
        <button class="icon-btn" data-act="fechar" title="Fechar (Esc)">${icon('close')}</button></header>
      <nav class="admin-tabs">${abas.map(([id, nome, n]) => `<button data-tab="${id}" class="${P.aba === id ? 'on' : ''}">${nome}${n !== '' ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</nav>
      <div class="admin-body">${corpo}</div></div>`;
    for (const [id, v] of Object.entries(digitando)) {
      const el = document.getElementById(id);
      if (el && el.dataset.keep !== undefined) el.value = v;
    }
    if (foco && document.getElementById(foco)) {
      const el = document.getElementById(foco);
      el.focus();
      if (cursor) try { el.setSelectionRange(cursor[0], cursor[1]); } catch { /* campo sem cursor */ }
    }
    if (P.foco) {
      const el = $(`#adminPanel .ap-user[data-uid="${CSS.escape(P.foco)}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }

  // Nomes registrados: cada pessoa entra sempre com o mesmo nome (o aparelho guarda uma chave)
  function abaNomes() {
    const r = P.perfis;
    if (!r) {
      if (!P.carregandoPerfis) {
        P.carregandoPerfis = true;
        adm('perfis').then((x) => { P.perfis = x; }).catch((e) => toast(e.message)).finally(() => { P.carregandoPerfis = false; renderPainel(); });
      }
      return '<div class="ap-empty">Carregando…</div>';
    }
    const linhas = r.perfis.map((p) => {
      let form = '';
      if (P.form?.pid === p.id && P.form.tipo === 'renomear') {
        form = `<div class="ap-form"><input id="apNomePerfil" data-keep maxlength="32" value="${esc(p.nome)}" placeholder="Novo nome">
          <button class="btn sm primary" data-act="perfil-renomear">Salvar</button><button class="btn sm ghost" data-act="cancelar">Cancelar</button></div>`;
      } else if (P.form?.pid === p.id && P.form.tipo === 'codigo') {
        form = `<div class="ap-form"><span>Código de acesso para <b>${esc(p.nome)}</b>: <b class="pf-codigo-txt">${esc(P.form.codigo)}</b> (vale até ${hhmm(new Date(P.form.ate))}). Na tela de entrada, a pessoa clica em "Já tenho um nome".</span>
          <button class="btn sm ghost" data-act="cancelar">Fechar</button></div>`;
      }
      return `<div class="ap-user" data-pid="${esc(p.id)}">
        <div class="ap-u-main">${avatar({ name: p.nome, color: p.cor })}<div><div class="ap-name"><span style="color:${esc(p.cor)}">${esc(p.nome)}</span>${p.online ? '<span class="ap-tag verde">online</span>' : ''}${p.id === S.myPid ? '<span class="muted small">(você)</span>' : ''}</div>
          <div class="muted small">desde ${esc(quandoCurto(p.criado))} · visto ${esc(quandoCurto(p.visto || p.criado))} · ${p.aparelhos ? `${p.aparelhos} ${p.aparelhos > 1 ? 'aparelhos' : 'aparelho'}` : 'nenhum aparelho (só entra com código)'}</div></div></div>
        <div class="ap-actions">
          <button class="btn sm" data-act="form-perfil" data-form="renomear">Renomear</button>
          <button class="btn sm" data-act="perfil-codigo">Código de acesso</button>
          ${p.aparelhos ? '<button class="btn sm warn" data-act="perfil-esquecer">Esquecer aparelhos</button>' : ''}
        </div>${form}</div>`;
    }).join('');
    return `<p class="ap-hint">Cada pessoa entra sempre com o mesmo nome: o aparelho dela fica ligado ao nome. Quem trocar de aparelho ou limpar o navegador entra de novo com um <b>código de acesso</b> (ela mesma gera num aparelho que ainda entra, ou você gera aqui). Renomear muda o nome em todas as mensagens antigas também.</p>
      ${linhas || '<div class="ap-empty">Ninguém entrou ainda.</div>'}`;
  }

  function abaPessoas(d) {
    const us = [...d.users].sort((a, b) => (a.id === S.myId ? -1 : b.id === S.myId ? 1 : a.name.localeCompare(b.name, 'pt-BR')));
    return `<p class="ap-hint">Dica: clique (ou clique com o botão direito) em alguém na lista de membros, online ou offline, para moderar direto de lá. No chat, digite <b>/</b> para ver os comandos rápidos.</p>` + us.map((u) => {
      const eu = u.id === S.myId;
      const tags = [
        u.admin && '<span class="ap-tag gold">admin</span>',
        u.live && '<span class="live-badge">ao vivo</span>',
        u.muted && `<span class="ap-tag orange">silenciado${u.muted - Date.now() < 300 * 864e5 ? ` até ${hhmm(new Date(u.muted))}` : ''}</span>`,
      ].filter(Boolean).join('');
      const onde = u.sala ? `Em ${esc(nomeSala(u.sala))}` : 'Online';
      let acoes = '';
      if (!eu) {
        acoes = `<div class="ap-actions">
          ${u.muted ? `<button class="btn sm" data-act="unmute">Tirar silêncio</button>` : `<button class="btn sm" data-act="form" data-form="mute">Silenciar</button>`}
          ${u.live ? `<button class="btn sm" data-act="stop-stream">Parar transmissão</button>` : ''}
          ${u.sala ? `<button class="btn sm" data-act="remove-sala">Tirar da sala</button>` : ''}
          <button class="btn sm" data-act="form" data-form="rename">Renomear</button>
          <button class="btn sm" data-act="toggle-admin">${u.admin ? 'Tirar admin' : 'Dar admin'}</button>
          <button class="btn sm warn" data-act="form" data-form="kick">Expulsar</button>
          <button class="btn sm danger" data-act="form" data-form="ban">Banir</button>
        </div>`;
      }
      let form = '';
      if (P.form && P.form.uid === u.id) {
        if (P.form.tipo === 'mute') {
          form = `<div class="ap-form"><span>Silenciar ${esc(u.name)} no chat e na voz (ainda pode assistir e transmitir):</span>
            <select id="apMuteMin"><option value="5">5 minutos</option><option value="15">15 minutos</option><option value="60" selected>1 hora</option><option value="1440">1 dia</option><option value="0">Até eu tirar</option></select>
            <button class="btn sm primary" data-act="mute">Silenciar</button><button class="btn sm ghost" data-act="cancelar">Cancelar</button></div>`;
        } else if (P.form.tipo === 'rename') {
          form = `<div class="ap-form"><input id="apRename" data-keep maxlength="32" value="${esc(u.name)}" placeholder="Novo apelido">
            <button class="btn sm primary" data-act="rename-user">Salvar</button><button class="btn sm ghost" data-act="cancelar">Cancelar</button></div>`;
        } else if (P.form.tipo === 'kick') {
          form = `<div class="ap-form"><span>Expulsar ${esc(u.name)}? A pessoa sai na hora, mas pode entrar de novo.</span>
            <input id="apMotivo" data-keep maxlength="200" placeholder="Motivo (opcional)">
            <button class="btn sm warn" data-act="kick">Expulsar</button><button class="btn sm ghost" data-act="cancelar">Cancelar</button></div>`;
        } else if (P.form.tipo === 'ban') {
          form = `<div class="ap-form"><span>Banir ${esc(u.name)}? Bloqueia o IP e este navegador até você desbanir.</span>
            <input id="apMotivo" data-keep maxlength="200" placeholder="Motivo (opcional)">
            <button class="btn sm danger" data-act="ban">Banir</button><button class="btn sm ghost" data-act="cancelar">Cancelar</button></div>`;
        }
      }
      return `<div class="ap-user${P.foco === u.id ? ' foco' : ''}" data-uid="${esc(u.id)}">
        <div class="ap-u-main">${avatar(u)}<div><div class="ap-name"><span style="color:${esc(u.color)}">${esc(u.name)}</span>${eu ? '<span class="muted small">(você)</span>' : ''}${tags}</div>
        <div class="small muted">${onde} · IP ${esc(u.ip || '?')}</div></div></div>${acoes}${form}</div>`;
    }).join('');
  }

  function abaBanidos(d) {
    if (!d.bans.length) return '<div class="ap-empty">Ninguém banido. 🎉</div>';
    return `<p class="ap-hint">O banimento bloqueia o IP e o navegador da pessoa. Quem troca de rede (4G, VPN) e limpa o navegador consegue voltar: nesse caso, troque a senha de entrada.</p>` +
      [...d.bans].reverse().map((b) => `<div class="ap-user" data-ban="${esc(b.id)}"><div class="ap-u-main"><div>
        <div class="ap-name">${esc(b.name)}</div>
        <div class="small muted">Banido por ${esc(b.by || '?')} em ${esc(new Date(b.ts).toLocaleString('pt-BR'))} · ${b.ip ? `IP ${esc(b.ip)}` : 'só o navegador'}${b.reason ? ` · Motivo: ${esc(b.reason)}` : ''}</div>
        </div></div><div class="ap-actions"><button class="btn sm" data-act="unban">Desbanir</button></div></div>`).join('');
  }

  function abaServidor(d) {
    const st = d.settings;
    const canais = S.channels.map((c) => `<option value="${esc(c.id)}"${c.id === S.view ? ' selected' : ''}>${esc(nomeCanal(c.id))}</option>`).join('');
    return `${secaoTrafego(d.trafego)}
      <div class="ap-section"><h4>Nome do servidor</h4>
        <div class="ap-row"><input id="apNome" data-keep maxlength="40" value="${esc(st.serverName)}"><button class="btn sm primary" data-act="salvar-nome">Salvar</button></div></div>
      <div class="ap-section"><h4>Senha de entrada ${st.needsPassword ? '<span class="ap-tag gold">ativa</span>' : '<span class="ap-tag">sem senha</span>'}</h4>
        <p>${st.needsPassword ? 'Quem tiver o link precisa da senha para entrar.' : 'Qualquer pessoa com o link consegue entrar.'} Trocar a senha não derruba quem já está conectado.</p>
        <div class="ap-row"><input id="apSenha" data-keep maxlength="100" placeholder="Nova senha" autocomplete="off"><button class="btn sm primary" data-act="salvar-senha">Salvar senha</button>
        ${st.needsPassword ? '<button class="btn sm" data-act="tirar-senha">Tirar senha</button>' : ''}</div></div>
      <div class="ap-section"><h4>Entrada ${st.locked ? '<span class="ap-tag gold">trancada</span>' : '<span class="ap-tag">aberta</span>'}</h4>
        <p>Com a entrada trancada, ninguém novo consegue entrar (só admins). Quem já está continua.</p>
        <button class="btn sm ${st.locked ? 'primary' : 'warn'}" data-act="${st.locked ? 'destrancar' : 'trancar'}">${st.locked ? 'Destrancar' : 'Trancar entrada'}</button></div>
      <div class="ap-section"><h4>${icon('megaphone')} Aviso para todo mundo</h4>
        <p>Aparece numa faixa no topo da tela de quem está online.</p>
        <div class="ap-row"><input id="apAviso" data-keep maxlength="500" placeholder="Ex.: o filme começa às 21h!"><button class="btn sm primary" data-act="aviso">Enviar aviso</button></div></div>
      <div class="ap-section"><h4>Limpar mensagens</h4>
        <p>Apaga todas as mensagens do canal escolhido, para todo mundo.</p>
        <div class="ap-row"><select id="apCanal" data-keep>${canais}</select><button class="btn sm danger" data-act="limpar">Limpar canal</button></div></div>
      <div class="ap-section"><h4>Senha de admin</h4>
        ${st.adminFromEnv
          ? '<p>Ela está definida na variável <b>ADMIN_SENHA</b> da hospedagem. Para trocar, mude lá e reinicie o serviço.</p>'
          : `<p>Mínimo de 6 caracteres. Você vai precisar dela para entrar como admin de novo.</p>
        <div class="ap-row"><input id="apAdminSenha" data-keep type="password" maxlength="100" placeholder="Nova senha de admin" autocomplete="new-password"><button class="btn sm primary" data-act="admin-senha">Trocar</button></div>`}</div>
      ${secaoTurn(st.turn)}
      <div class="ap-section"><h4>Onde ficam os dados</h4>
        <p>${st.storage === 'upstash' ? 'No Upstash (banco na nuvem): canais, mensagens, banimentos e configurações sobrevivem a reinícios.' : 'No arquivo <b>data.json</b>, na pasta do servidor. Numa hospedagem grátis, esse arquivo some quando o serviço reinicia: configure o Upstash (veja o LEIA-ME).'}</p></div>
      ${secaoAparelhos(d)}
      <div class="ap-section"><h4>Modo admin</h4>
        <p>Sair do modo admin neste aparelho (ele também deixa de ser lembrado). Para voltar, use a senha de admin.</p>
        <button class="btn sm" data-act="sairadmin">Sair do modo admin</button></div>`;
  }

  // Registro de conexões: quem entrou, de qual IP e aparelho, e as tentativas recusadas
  function secaoTurn(t) {
    const cf = t?.cloudflare;
    let corpo;
    if (!cf) {
      corpo = t?.proprio ? '<p>Usando o servidor da variável TURN_URL.</p>'
        : '<p>Desligado. Quem estiver em rede que bloqueia a conexão direta (alguns 4G/5G) pode não conseguir ver as telas. Veja "Alguém não consegue ver a tela?" no LEIA-ME.</p>';
    } else {
      const pct = Math.min(100, (cf.usadoGB / cf.limiteGB) * 100);
      const gb = (x) => (x < 10 ? x.toFixed(2) : Math.round(x)).toString().replace('.', ',');
      corpo = `<p>${cf.ligado ? '<b>Ligado.</b> Quem está em rede que bloqueia a conexão direta consegue ver as telas.' : `<b>Parado:</b> ${esc(cf.motivo)}.`}</p>
        <div class="trafego-barra${pct >= 90 ? ' perigo' : pct >= 70 ? ' alerta' : ''}"><div style="width:${pct}%"></div></div>
        <p class="muted small">Últimos 31 dias: ${gb(cf.usadoGB)} GB de ${cf.limiteGB} GB (a trava; o grátis da Cloudflare é 1.000 GB por mês).${cf.conferido ? ` Conferido ${esc(quandoCurto(cf.conferido))}.` : ''}</p>
        ${cf.porPessoa.length ? `<p class="muted small">Quem mais usou: ${cf.porPessoa.map((x) => `${esc(x.nome)} (${gb(x.gb)} GB)`).join(', ')}.</p>` : ''}
        <div class="ap-row">${cf.desligadoPeloAdmin
          ? '<button class="btn sm primary" data-act="turn-ligar">Ligar o TURN</button>'
          : '<button class="btn sm danger" data-act="turn-desligar">Desligar o TURN agora</button>'}</div>`;
    }
    return `<div class="ap-section"><h4>Servidor TURN</h4>${corpo}</div>`;
  }
  function quandoCurto(t) {
    const d = new Date(t);
    const hoje = new Date();
    const ontem = new Date(Date.now() - 864e5);
    const dia = d.toDateString() === hoje.toDateString() ? 'hoje'
      : d.toDateString() === ontem.toDateString() ? 'ontem'
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${dia} ${hhmm(d)}`;
  }
  function duracao(ms) {
    const min = Math.round(ms / 60e3);
    if (min < 1) return 'menos de 1 min';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}`;
    return `${Math.round(h / 24)} dias`;
  }
  function abaConexoes() {
    const r = P.conexoes;
    if (!r) {
      if (!P.carregandoCon) {
        P.carregandoCon = true;
        adm('conexoes').then((x) => { P.conexoes = x; }).catch((e) => toast(e.message)).finally(() => { P.carregandoCon = false; renderPainel(); });
      }
      return '<div class="ap-empty">Carregando…</div>';
    }
    const f = P.filtroCon.trim().toLowerCase();
    const lista = r.registro.filter((x) => !f || x.ip.toLowerCase().includes(f) || x.nome.toLowerCase().includes(f)
      || (x.nomes || []).some((n) => n.toLowerCase().includes(f)) || x.aparelho.toLowerCase().includes(f));
    const SAIDA = { expulso: 'expulso', banido: 'banido', reinicio: 'o servidor reiniciou' };
    const mostrar = P.limiteCon || 300;
    const linhas = lista.slice(0, mostrar).map((x) => {
      const recusa = x.tipo === 'recusado';
      let estado;
      if (recusa) estado = `<span class="ap-tag orange">recusado: ${esc(x.motivo)}${x.vezes > 1 ? ` (${x.vezes} vezes)` : ''}</span>`;
      else if (x.online) estado = '<span class="ap-tag verde">online agora</span>';
      else if (x.saida === 'reinicio') estado = `<span class="ap-con-dur">saiu quando ${SAIDA.reinicio}</span>`;
      else estado = `<span class="ap-con-dur">ficou ${duracao((x.fim || x.t) - x.t)}${x.saida ? `, ${SAIDA[x.saida] || esc(x.saida)}` : ''}</span>`;
      const nomes = recusa && x.nomes?.length ? `<span class="muted small">também como ${x.nomes.map(esc).join(', ')}</span>` : '';
      return `<div class="ap-con${recusa ? ' recusa' : ''}">
        <div class="ap-con-quando" title="${esc(new Date(x.t).toLocaleString('pt-BR'))}">${esc(quandoCurto(x.t))}</div>
        <div class="ap-con-main">
          <div class="ap-name">${esc(x.nome)}${x.admin ? '<span class="ap-tag gold">admin</span>' : ''}${nomes}</div>
          <div class="ap-con-info"><button class="ap-ip" data-act="filtrar-ip" data-ip="${esc(x.ip)}" title="Ver tudo deste IP">${esc(x.ip || 'sem IP')}</button><span>${esc(x.aparelho)}</span></div>
        </div>
        <div class="ap-con-estado">${estado}</div>
      </div>`;
    }).join('');
    return `<p class="ap-hint">Quem entrou no servidor, de qual IP e aparelho, e as tentativas recusadas. Só admins veem.
        Fica guardado por ${r.dias} dias. Recarregar a página ou cair e voltar logo em seguida conta como a mesma visita.</p>
      <div class="ap-row ap-con-barra"><input id="apFiltroCon" data-keep maxlength="60" placeholder="Procurar por nome, IP ou aparelho" value="${esc(P.filtroCon)}" autocomplete="off">
        <button class="btn sm" data-act="limpar-conexoes"${r.registro.length ? '' : ' disabled'}>Limpar registro</button></div>
      ${linhas || `<div class="ap-empty">${f ? 'Nada encontrado.' : 'Ninguém entrou ainda.'}</div>`}
      ${lista.length > mostrar ? `<button class="btn sm ghost ap-mais" data-act="mais-conexoes">Mostrar mais (${lista.length - mostrar} mais antigas)</button>` : ''}`;
  }

  // Aparelhos lembrados como admin (não precisam digitar a senha)
  function secaoAparelhos(d) {
    const meu = lembreteAdmin()?.id;
    const lista = (d.aparelhos || []).slice().sort((a, b) => b.usado - a.usado);
    return `<div class="ap-section"><h4>Aparelhos lembrados como admin</h4>
      <p>Quem entra com a senha de admin fica lembrado naquele navegador ou programa e não precisa digitar de novo. A senha não fica guardada no aparelho, só uma chave. Esquecer um aparelho faz ele pedir a senha na próxima vez. Trocar a senha de admin esquece todos; sem uso por 180 dias, também.</p>
      ${lista.length ? `<div class="ap-aparelhos">${lista.map((a) => `<div class="ap-aparelho">
          <div><b>${esc(a.nome)}</b>${a.id === meu ? ' <span class="ap-tag">este aparelho</span>' : ''}
            <div class="muted small">${esc(a.aparelho)} · lembrado ${esc(quandoCurto(a.criado))} · último uso ${esc(quandoCurto(a.usado))}</div></div>
          <button class="btn sm ghost" data-act="esquecer-aparelho" data-id="${esc(a.id)}">Esquecer</button></div>`).join('')}</div>` : '<p>Nenhum aparelho lembrado.</p>'}
      ${lista.filter((a) => a.id !== meu).length > 0 && lista.length > 1 ? '<button class="btn sm" data-act="esquecer-outros">Esquecer todos, menos este</button>' : ''}
    </div>`;
  }

  function abaComandos() {
    return `<p class="ap-hint">Digite no chat. Os nomes podem ter espaços e não precisam estar completos: <b>/kick jo</b> funciona se só houver um "Jo…" online.</p>
      <table class="ap-cmds">${COMANDOS.map((c) => `<tr><td>/${c.nome} <span class="args">${esc(c.args)}</span></td><td>${esc(c.desc)}</td></tr>`).join('')}</table>`;
  }

  $('#adminPanel').addEventListener('input', (e) => {
    if (e.target.id !== 'apFiltroCon') return;
    P.filtroCon = e.target.value;
    renderPainel();
  });

  $('#adminPanel').addEventListener('click', async (e) => {
    if (e.target.id === 'adminPanel') return fecharPainelAdmin();
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      P.aba = tab.dataset.tab;
      P.form = null;
      if (P.aba === 'conexoes' && P.conexoes) carregarPainel(); // atualiza sem piscar a lista
      if (P.aba === 'nomes') P.perfis = null; // busca de novo
      if (P.aba === 'problemas') carregarProblemas();
      return renderPainel();
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const uid = b.closest('[data-uid]')?.dataset.uid;
    const nomeDe = (id) => P.dados?.users.find((u) => u.id === id)?.name || 'a pessoa';
    const val = (id) => (document.getElementById(id)?.value || '').trim();
    const feito = (msg) => { if (msg) toast(msg); P.form = null; carregarPainel(); };
    try {
      switch (act) {
        case 'fechar': return fecharPainelAdmin();
        case 'form': P.form = { uid, tipo: b.dataset.form }; P.foco = uid; renderPainel(); document.querySelector('#apMotivo, #apRename, #apMuteMin')?.focus(); return;
        case 'cancelar': P.form = null; return renderPainel();
        case 'form-perfil': P.form = { pid: b.closest('[data-pid]').dataset.pid, tipo: b.dataset.form }; renderPainel(); document.querySelector('#apNomePerfil')?.focus(); return;
        case 'perfil-renomear': {
          const pid = b.closest('[data-pid]').dataset.pid;
          await adm('perfil-renomear', { pid, nome: val('apNomePerfil') });
          P.form = null;
          P.perfis = await adm('perfis');
          toast('Nome trocado (as mensagens antigas também).');
          return renderPainel();
        }
        case 'perfil-codigo': {
          const pid = b.closest('[data-pid]').dataset.pid;
          const r = await adm('perfil-codigo', { pid });
          P.form = { pid, tipo: 'codigo', codigo: r.codigo, ate: r.ate };
          return renderPainel();
        }
        case 'perfil-esquecer': {
          const pid = b.closest('[data-pid]').dataset.pid;
          const nome = P.perfis?.perfis.find((x) => x.id === pid)?.nome || 'a pessoa';
          return abrirModal({
            titulo: 'Esquecer aparelhos', ok: 'Esquecer', perigo: true,
            corpo: `<p>Os aparelhos de <b>${esc(nome)}</b> deixam de entrar com esse nome. Quem estiver online continua até sair; para voltar, vai precisar de um código de acesso.</p>`,
            aoConfirmar: async () => { await adm('perfil-esquecer-aparelhos', { pid }); P.perfis = await adm('perfis'); renderPainel(); toast('Aparelhos esquecidos.'); },
          });
        }
        case 'mute': {
          const min = Number(val('apMuteMin'));
          await adm('mute', { uid, minutes: min });
          return feito(`${nomeDe(uid)} foi silenciado${min ? ` por ${min >= 60 ? min / 60 + ' h' : min + ' min'}` : ' até você tirar'}.`);
        }
        case 'unmute': await adm('unmute', { uid }); return feito(`${nomeDe(uid)} pode falar de novo.`);
        case 'stop-stream': await adm('stop-stream', { uid }); return feito(`Transmissão de ${nomeDe(uid)} encerrada.`);
        case 'remove-sala': await adm('remove-sala', { uid }); return feito(`${nomeDe(uid)} saiu da sala.`);
        case 'toggle-admin': { const r = await adm('toggle-admin', { uid }); return feito(r.admin ? `${nomeDe(uid)} agora é admin.` : `${nomeDe(uid)} não é mais admin.`); }
        case 'rename-user': await adm('rename-user', { uid, name: val('apRename') }); return feito('Apelido alterado.');
        case 'kick': { const n = nomeDe(uid); await adm('kick', { uid, reason: val('apMotivo') }); return feito(`${n} foi expulso.`); }
        case 'ban': {
          const n = nomeDe(uid);
          const r = await adm('ban', { uid, reason: val('apMotivo') });
          return feito(`${n} foi banido.${r.soAparelho ? ' (Só o navegador: o IP é o mesmo de outra pessoa online.)' : ''}`);
        }
        case 'unban': await adm('unban', { id: b.closest('[data-ban]').dataset.ban }); return feito('Banimento removido.');
        case 'turn-desligar': await adm('turn-desligar'); return feito('TURN desligado: as senhas foram canceladas.');
        case 'turn-ligar': {
          const r = await adm('turn-ligar');
          return feito(r.ligado ? 'TURN ligado.' : `TURN liberado pelo admin, mas ainda parado: ${r.motivo}.`);
        }
        case 'esquecer-aparelho': {
          const id = b.dataset.id;
          const este = id === lembreteAdmin()?.id;
          await adm('esquecer-aparelho', { id });
          if (este) salvar({ lembreteAdmin: null });
          return feito(este ? 'Este aparelho foi esquecido: na próxima vez, ele pede a senha de admin.' : 'Aparelho esquecido: na próxima vez, ele pede a senha de admin.');
        }
        case 'esquecer-outros':
          await adm('esquecer-aparelhos', { manter: lembreteAdmin()?.id || '' });
          return feito('Os outros aparelhos foram esquecidos.');
        case 'apagar-relato':
          await adm('apagar-relato', { id: b.closest('[data-relato]').dataset.relato });
          return carregarProblemas();
        case 'limpar-erros':
          await adm('limpar-erros');
          toast('Erros apagados.');
          return carregarProblemas();
        case 'mais-conexoes': P.limiteCon = (P.limiteCon || 300) + 300; return renderPainel();
        case 'mais-qualidade': P.limiteQual = (P.limiteQual || 40) + 40; return renderPainel();
        case 'filtrar-ip': {
          P.filtroCon = b.dataset.ip;
          const campo = document.getElementById('apFiltroCon');
          if (campo) campo.value = P.filtroCon;
          return renderPainel();
        }
        case 'limpar-conexoes':
          return abrirModal({
            titulo: 'Limpar registro de conexões', ok: 'Limpar', perigo: true,
            corpo: '<p>Apagar o registro de conexões? Quem está online agora continua na lista. Não dá para desfazer.</p>',
            aoConfirmar: async () => { await adm('limpar-conexoes'); P.conexoes = null; renderPainel(); toast('Registro de conexões limpo.'); },
          });
        case 'salvar-nome': await adm('settings', { serverName: val('apNome') }); return feito('Nome do servidor salvo.');
        case 'salvar-senha':
          if (!val('apSenha')) throw new Error('Digite a nova senha');
          await adm('settings', { senha: val('apSenha') });
          document.getElementById('apSenha').value = '';
          return feito('Senha de entrada trocada.');
        case 'tirar-senha': await adm('settings', { senha: '' }); return feito('Senha de entrada removida.');
        case 'trancar': await adm('settings', { locked: true }); return feito('Entrada trancada.');
        case 'destrancar': await adm('settings', { locked: false }); return feito('Entrada liberada.');
        case 'aviso':
          if (!val('apAviso')) throw new Error('Escreva o aviso');
          await adm('announce', { text: val('apAviso') });
          document.getElementById('apAviso').value = '';
          return feito('Aviso enviado.');
        case 'limpar': {
          const ch = val('apCanal');
          return abrirModal({
            titulo: 'Limpar canal', ok: 'Apagar tudo', perigo: true,
            corpo: `<p>Apagar <b>todas</b> as mensagens de <b>${esc(nomeCanal(ch))}</b>? Não dá para desfazer.</p>`,
            aoConfirmar: () => adm('clear', { channel: ch }),
          });
        }
        case 'admin-senha': {
          const nova = val('apAdminSenha');
          const r = await adm('admin-password', { senha: nova });
          if (r.lembrete?.token) salvar({ lembreteAdmin: r.lembrete, adminPassword: '' });
          S.adminPassword = r.lembrete ? '' : nova;
          document.getElementById('apAdminSenha').value = '';
          return feito('Senha de admin trocada.');
        }
        case 'sairadmin': await api('admin-logout'); return;
      }
    } catch (err) {
      toast(err.message, 5000);
    }
  });
  $('#adminPanel').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    const btn = e.target.closest('.ap-row, .ap-form')?.querySelector('.btn.primary, .btn.warn, .btn.danger');
    if (btn) btn.click();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && P.aberto && !e.defaultPrevented) fecharPainelAdmin();
  });

  // ================= Soundboard =================
  // Os sons entram no áudio da transmissão (quem assiste ouve). Os personalizados
  // ficam guardados neste navegador (IndexedDB); os padrão vêm da pasta /sons.
  const SONS_PADRAO = [
    { id: 'p-trombone', nome: 'Trombone triste', emoji: '🎺', arquivo: 'sons/trombone-triste.mp3', tecla: 'Digit1' },
    { id: 'p-risada', nome: 'Risada de plateia', emoji: '😂', arquivo: 'sons/risada.mp3', tecla: 'Digit2' },
    { id: 'p-aplausos', nome: 'Aplausos', emoji: '👏', arquivo: 'sons/aplausos.mp3', tecla: 'Digit3' },
    { id: 'p-badumtss', nome: 'Ba dum tss', emoji: '🥁', arquivo: 'sons/ba-dum-tss.mp3', tecla: 'Digit4' },
    { id: 'p-buzina', nome: 'Buzina', emoji: '📯', arquivo: 'sons/buzina.mp3', tecla: 'Digit5' },
    { id: 'p-grilos', nome: 'Grilos', emoji: '🦗', arquivo: 'sons/grilos.mp3', tecla: 'Digit6' },
    { id: 'p-assobio', nome: 'Fiu-fiu', emoji: '😏', arquivo: 'sons/assobio.mp3', tecla: 'Digit7' },
    { id: 'p-rufar', nome: 'Rufar de tambores', emoji: '📣', arquivo: 'sons/rufar.mp3', tecla: 'Digit8' },
    { id: 'p-sino', nome: 'Sino de luta', emoji: '🔔', arquivo: 'sons/sino-luta.mp3', tecla: 'Digit9' },
    { id: 'p-pum', nome: 'Pum', emoji: '💨', arquivo: 'sons/pum.mp3', tecla: null },
  ];
  const MAX_PERSONALIZADOS = 30;
  const MAX_BYTES = 8 * 1024 * 1024;
  const MAX_SEGUNDOS = 60;
  const ATALHO_PARAR = { code: 'Digit0', alt: true };

  const SB = (() => {
    const g = salvo.sb && typeof salvo.sb === 'object' ? salvo.sb : {};
    const salvos = Array.isArray(g.slots) ? g.slots : [];
    const slots = SONS_PADRAO.map((p) => {
      const s = salvos.find((x) => x.id === p.id) || {};
      return {
        id: p.id, padrao: true, arquivo: p.arquivo,
        nome: s.nome || p.nome, emoji: s.emoji || p.emoji,
        atalho: s.atalho !== undefined ? s.atalho : p.tecla ? { code: p.tecla, alt: true } : null,
        volume: typeof s.volume === 'number' ? s.volume : 1, proprio: !!s.proprio,
      };
    });
    for (const s of salvos) {
      if (!s.padrao && typeof s.id === 'string' && s.id.startsWith('c-')) {
        slots.push({ id: s.id, padrao: false, nome: s.nome || 'Som', emoji: s.emoji || '🔊', atalho: s.atalho || null, volume: typeof s.volume === 'number' ? s.volume : 1, proprio: true });
      }
    }
    // um som padrão novo não pega um atalho que a pessoa já usa em outro som
    const mesmo = (a, b) => a && b && a.code === b.code && !!a.alt === !!b.alt && !!a.ctrl === !!b.ctrl && !!a.shift === !!b.shift;
    for (const sl of slots) {
      if (sl.padrao && sl.atalho && !salvos.some((x) => x.id === sl.id) && slots.some((o) => o !== sl && mesmo(o.atalho, sl.atalho))) sl.atalho = null;
    }
    return { volume: typeof g.volume === 'number' ? g.volume : 0.8, ouvir: g.ouvir !== false, slots, editando: false, gravando: null };
  })();
  // No programa: atalhos que funcionam com o jogo na frente (o Windows avisa o programa)
  const GLOBAIS = new Set(); // ids com atalho global ativo
  let atalhosRecusados = []; // ids cujo atalho outro programa já usa
  let sincronia = 0;
  let enviados = ''; // o que o programa já tem registrado (evita repetir a cada mexida no volume)
  function guardarSB() {
    salvar({ sb: { volume: SB.volume, ouvir: SB.ouvir, slots: SB.slots.map(({ id, padrao, nome, emoji, atalho, volume, proprio }) => ({ id, padrao, nome, emoji, atalho, volume, proprio })) } });
    sincronizarAtalhos();
  }
  function sincronizarAtalhos() {
    if (!PROGRAMA) return;
    clearTimeout(sincronia);
    // gravando um atalho novo: solta todos, senão o Windows "engole" a tecla antes da página
    sincronia = setTimeout(async () => {
      const lista = SB.gravando ? [] : [
        ...(VOZ.cfg.atalhoMudo ? [{ id: 'voz-mudo', ...VOZ.cfg.atalhoMudo }] : []),
        ...(VOZ.cfg.atalhoSurdo ? [{ id: 'voz-surdo', ...VOZ.cfg.atalhoSurdo }] : []),
        { id: 'parar', ...ATALHO_PARAR },
        ...SB.slots.filter((s) => s.atalho).map((s) => ({ id: s.id, ...s.atalho })),
      ];
      const assinatura = JSON.stringify(lista);
      if (assinatura === enviados) return;
      enviados = assinatura;
      let r = null;
      try { r = await PROGRAMA.atalhos(lista); } catch { r = null; enviados = ''; }
      GLOBAIS.clear();
      for (const id of r?.ok || []) GLOBAIS.add(id);
      atalhosRecusados = r?.falhou || [];
      dicaSons();
    }, SB.gravando ? 0 : 120);
  }
  if (PROGRAMA) {
    PROGRAMA.aoAtalho((id) => {
      if (SB.gravando || !S.started) return;
      if (id === 'voz-mudo') return alternarMudoPorAtalho();
      if (id === 'voz-surdo') return alternarSurdoPorAtalho();
      if (id === 'parar') return pararTodos();
      if (SB.slots.some((s) => s.id === id)) tocarSom(id, 'atalho');
    });
  }

  // IndexedDB: guarda os arquivos de áudio enviados por você
  const DB = (() => {
    let aberto;
    const abrir = () => (aberto ||= new Promise((ok, erro) => {
      const r = indexedDB.open('caras-e-telas', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('sons');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    }));
    const op = async (modo, fn) => {
      const db = await abrir();
      return new Promise((ok, erro) => {
        const tx = db.transaction('sons', modo);
        const req = fn(tx.objectStore('sons'));
        tx.oncomplete = () => ok(req ? req.result : undefined);
        tx.onerror = () => erro(tx.error);
        tx.onabort = () => erro(tx.error);
      });
    };
    return {
      pegar: (id) => op('readonly', (st) => st.get(id)),
      guardar: (id, blob) => op('readwrite', (st) => st.put(blob, id)),
      apagar: (id) => op('readwrite', (st) => st.delete(id)),
    };
  })();

  const buffers = new Map(); // id -> AudioBuffer
  async function carregarBuffer(slot) {
    if (buffers.has(slot.id)) return buffers.get(slot.id);
    const c = audioCtx();
    let dados;
    if (slot.proprio) {
      const blob = await DB.pegar(slot.id);
      if (!blob) throw new Error('arquivo não encontrado neste navegador');
      dados = await blob.arrayBuffer();
    } else {
      const r = await fetch(slot.arquivo);
      if (!r.ok) throw new Error(`não encontrei ${slot.arquivo}`);
      dados = await r.arrayBuffer();
    }
    const buf = await c.decodeAudioData(dados);
    buffers.set(slot.id, buf);
    return buf;
  }

  const tocando = new Map(); // id -> { fonte, ganho }
  function marcarTocando(id, dur) {
    const el = document.querySelector(`#sbGrade [data-som="${CSS.escape(id)}"]`);
    if (!el) return;
    el.classList.remove('tocando');
    if (dur) {
      void el.offsetWidth; // reinicia a animação
      el.style.setProperty('--dur', `${dur}s`);
      el.classList.add('tocando');
    }
  }
  function pararSom(id) {
    const t = tocando.get(id);
    if (!t) return;
    tocando.delete(id);
    try { t.fonte.stop(); } catch { /* já parou */ }
    try { t.ganho.disconnect(); } catch { /* ok */ }
    marcarTocando(id, 0);
  }
  function pararTodos() {
    for (const id of [...tocando.keys()]) pararSom(id);
  }
  async function tocarSom(id, origem) {
    const slot = SB.slots.find((s) => s.id === id);
    const c = audioCtx();
    if (!slot || !c) return;
    if (S.sala && silenciado()) return toast('Um admin silenciou você: os sons ficam bloqueados até o silêncio acabar.');
    if (c.state !== 'running') await c.resume().catch(() => {});
    let buf;
    try {
      buf = await carregarBuffer(slot);
    } catch (e) {
      return toast(`Não consegui tocar "${slot.nome}": ${e.message}`);
    }
    pararSom(id); // apertar de novo recomeça
    const fonte = c.createBufferSource();
    fonte.buffer = buf;
    const ganho = c.createGain();
    ganho.gain.value = slot.volume * SB.volume;
    fonte.connect(ganho);
    // numa sala, o som vai pela chamada para todo mundo (cada um controla o volume dos seus sons)
    const naChamada = !!S.sala && !!faixaDeEfeitos();
    if (naChamada) ganho.connect(EFEITOS.dest);
    // ouvir aqui: fora de uma sala, sempre (é a prévia). Na sala, se "Ouvir aqui" estiver ligado; mas
    // não com o som do PC inteiro indo na transmissão (ele seria capturado e iria em dobro)
    if (!VOZ.surdo && (!naChamada || (SB.ouvir && !(S.live && S.evitarEco)))) ganho.connect(c.destination);
    fonte.onended = () => {
      if (tocando.get(id)?.fonte !== fonte) return;
      tocando.delete(id);
      try { ganho.disconnect(); } catch { /* ok */ }
      marcarTocando(id, 0);
    };
    fonte.start();
    tocando.set(id, { fonte, ganho });
    marcarTocando(id, buf.duration);
    if (naChamada) api('sb', { nome: slot.nome, emoji: slot.emoji }).catch(() => {});
    else if (origem === 'atalho') toast('Você não está numa sala: o som tocou só aqui.');
  }

  // ----- atalhos -----
  const NOMES_TECLAS = {
    ControlLeft: 'Ctrl esquerdo', ControlRight: 'Ctrl direito', ShiftLeft: 'Shift esquerdo', ShiftRight: 'Shift direito',
    AltLeft: 'Alt', AltRight: 'Alt Gr', CapsLock: 'Caps Lock', Backspace: 'Backspace', Escape: 'Esc',
    MouseMiddle: 'Botão do meio do mouse', MouseBack: 'Mouse 4 (lateral)', MouseForward: 'Mouse 5 (lateral)',
    Space: 'Espaço', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Minus: '-', Equal: '=', Backquote: "'", BracketLeft: '´', BracketRight: '[', Backslash: ']', Semicolon: 'Ç', Quote: '~', Comma: ',', Period: '.', Slash: ';', IntlRo: '/', Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', Enter: 'Enter', Tab: 'Tab' };
  function nomeTecla(code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad\d$/.test(code)) return `Num ${code.slice(6)}`;
    if (/^Numpad/.test(code)) return `Num ${{ NumpadAdd: '+', NumpadSubtract: '-', NumpadMultiply: '*', NumpadDivide: '/', NumpadDecimal: ',', NumpadEnter: 'Enter' }[code] || code.slice(6)}`;
    if (/^F\d{1,2}$/.test(code)) return code;
    return NOMES_TECLAS[code] || code;
  }
  function textoAtalho(a) {
    if (!a) return '';
    return [a.ctrl && 'Ctrl', a.alt && 'Alt', a.shift && 'Shift', a.meta && 'Cmd', nomeTecla(a.code)].filter(Boolean).join('+');
  }
  const mesmoAtalho = (a, b) => !!a && !!b && a.code === b.code && !!a.ctrl === !!b.ctrl && !!a.alt === !!b.alt && !!a.shift === !!b.shift && !!a.meta === !!b.meta;
  const atalhoDoEvento = (e) => ({ code: e.code, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey });

  // Gravação de atalho (no editor): pega a próxima combinação de teclas
  window.addEventListener('keydown', (e) => {
    if (!SB.gravando) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key === 'Escape') return SB.gravando(null, true);
    if (['Shift', 'Control', 'Alt', 'Meta', 'AltGraph'].includes(e.key)) return; // espera a tecla de verdade
    SB.gravando(atalhoDoEvento(e), false);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (SB.gravando || e.repeat || !S.started) return;
    if (!$('#modal').hidden || P.aberto) return;
    const comModificador = e.ctrlKey || e.altKey || e.metaKey;
    const digitando = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (digitando && !comModificador) return; // escrevendo no chat: teclas simples não disparam sons
    const ev = atalhoDoEvento(e);
    for (const [campo, id, fazer] of [['atalhoMudo', 'voz-mudo', alternarMudoPorAtalho], ['atalhoSurdo', 'voz-surdo', alternarSurdoPorAtalho]]) {
      if (mesmoAtalho(VOZ.cfg[campo], ev)) {
        e.preventDefault();
        if (!GLOBAIS.has(id)) fazer(); // no programa, o atalho global já cuidou
        return;
      }
    }
    if (mesmoAtalho(ATALHO_PARAR, ev)) {
      e.preventDefault();
      if (GLOBAIS.has('parar')) return; // o programa já cuidou pelo atalho global
      return pararTodos();
    }
    const slot = SB.slots.find((s) => mesmoAtalho(s.atalho, ev));
    if (!slot) return;
    e.preventDefault();
    if (GLOBAIS.has(slot.id)) return;
    tocarSom(slot.id, 'atalho');
  });

  // ----- painel -----
  function renderSons() {
    const personalizados = SB.slots.filter((s) => !s.padrao).length;
    $('#sbVolume').value = String(SB.volume);
    $('#sbVolumePct').textContent = `${Math.round(SB.volume * 100)}%`;
    $('#sbOuvir').checked = SB.ouvir;
    $('#sbEditar').textContent = SB.editando ? 'Pronto' : 'Editar';
    $('#sbEditar').classList.toggle('primary', SB.editando);
    avisoSons();
    let h = SB.slots.map((s) => `<button type="button" class="som${SB.editando ? ' editando' : ''}${tocando.has(s.id) ? ' tocando' : ''}" data-som="${esc(s.id)}" title="${esc(s.nome)}${s.atalho ? ` (${esc(textoAtalho(s.atalho))})` : ''}">
        <span class="som-emoji">${esc(s.emoji)}</span><span class="som-nome">${esc(s.nome)}</span>
        ${s.atalho ? `<kbd>${esc(textoAtalho(s.atalho))}</kbd>` : `<span class="som-sem">${SB.editando ? 'sem atalho' : ''}</span>`}
        ${SB.editando ? `<span class="som-lapis">${icon('pencil')}</span>` : ''}
      </button>`).join('');
    if (personalizados < MAX_PERSONALIZADOS) {
      h += `<button type="button" class="som som-novo" data-novo="1">${icon('plus')}<span class="som-nome">Adicionar som</span><span class="som-sem">${MAX_PERSONALIZADOS - personalizados} espaços livres</span></button>`;
    }
    $('#sbGrade').innerHTML = h;
  }

  function dicaSons() {
    const el = $('#sonsDica');
    if (!el) return;
    const fim = ' Com Alt+0, todos os sons param.';
    if (PROGRAMA) {
      const recusados = SB.slots.filter((s) => atalhosRecusados.includes(s.id) && s.atalho).map((s) => textoAtalho(s.atalho));
      el.textContent = 'Clique num som ou use o atalho. No programa, os atalhos com Ctrl ou Alt (e as teclas F1 a F12) funcionam até com você dentro de um jogo.'
        + fim + (recusados.length ? ` Outro programa já usa ${recusados.join(', ')}: ${recusados.length > 1 ? 'esses só funcionam' : 'esse só funciona'} com esta janela em foco.` : '');
    } else if (NO_WINDOWS) {
      el.innerHTML = `Clique num som ou use o atalho. No navegador, os atalhos só funcionam com esta janela em foco. Para usar dentro de jogos, <a href="${LINK_PROGRAMA}" target="_blank" rel="noopener">baixe o programa para Windows</a>.${fim}`;
    } else {
      el.textContent = 'Clique num som ou use o atalho. Os atalhos só funcionam com esta janela do navegador em foco (dentro de um jogo, o navegador não recebe as teclas).' + fim;
    }
  }

  function avisoSons() {
    const antigos = S.sala ? [...vizinhosDeSala()].map(userById).filter((u) => u && !u.efeitos).map((u) => u.name) : [];
    $('#sbAviso').textContent = !S.sala
      ? 'Fora de uma sala, só você ouve.'
      : silenciado()
        ? 'Um admin silenciou você: os sons ficam bloqueados até o silêncio acabar.'
        : 'Todo mundo na chamada ouve os sons que você tocar. Cada um pode baixar o volume ou silenciar os seus sons clicando no seu nome.'
          + (antigos.length ? ` ${antigos.join(', ')} ${antigos.length > 1 ? 'estão' : 'está'} com a página desatualizada e só vai ouvir depois de recarregar.` : '');
    $('#sbAviso').classList.toggle('ao-vivo', !!S.sala && !silenciado());
  }

  async function lerArquivoDeSom(file) {
    if (!file) return null;
    if (file.size > MAX_BYTES) throw new Error('Arquivo grande demais (máximo 8 MB).');
    const c = audioCtx();
    let buf;
    try {
      buf = await c.decodeAudioData(await file.arrayBuffer());
    } catch {
      throw new Error('Não consegui ler esse arquivo. Use MP3, WAV, OGG ou M4A.');
    }
    if (buf.duration > MAX_SEGUNDOS) throw new Error(`Som longo demais (máximo ${MAX_SEGUNDOS} segundos).`);
    return buf;
  }
  function escolherArquivo() {
    return new Promise((ok) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a';
      input.onchange = () => ok(input.files[0] || null);
      input.click();
    });
  }

  async function adicionarSom() {
    if (SB.slots.filter((s) => !s.padrao).length >= MAX_PERSONALIZADOS) return toast('Todos os espaços estão ocupados. Apague algum som para liberar.');
    const file = await escolherArquivo();
    if (!file) return;
    let buf;
    try {
      buf = await lerArquivoDeSom(file);
    } catch (e) {
      return toast(e.message, 6000);
    }
    const id = `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    try {
      await DB.guardar(id, file);
    } catch {
      return toast('O navegador não deixou guardar o arquivo (falta de espaço?).', 6000);
    }
    const nome = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 24) || 'Meu som';
    const slot = { id, padrao: false, nome, emoji: '🔊', atalho: null, volume: 1, proprio: true };
    SB.slots.push(slot);
    buffers.set(id, buf);
    guardarSB();
    renderSons();
    editarSom(id, true);
  }

  function editarSom(id, novo = false) {
    const slot = SB.slots.find((s) => s.id === id);
    if (!slot) return;
    let atalho = slot.atalho;
    let arquivoNovo = null;
    let restaurar = false;
    abrirModal({
      titulo: novo ? 'Novo som' : 'Editar som',
      ok: 'Salvar',
      corpo: `<div class="sb-editor">
          <div class="sb-linha">
            <label class="field sb-emoji"><span>Emoji</span><input type="text" name="emoji" maxlength="8" value="${esc(slot.emoji)}" autocomplete="off"></label>
            <label class="field"><span>Nome</span><input type="text" name="nome" maxlength="24" required value="${esc(slot.nome)}" autocomplete="off"></label>
          </div>
          <div class="field"><span>Atalho de teclado</span>
            <div class="sb-atalho"><kbd id="sbAtalhoTxt"></kbd>
              <button type="button" class="btn sm" id="sbGravar">Gravar atalho</button>
              <button type="button" class="btn sm ghost" id="sbSemAtalho">Sem atalho</button></div>
            <p class="small muted sb-ajuda">Dica: use Alt ou Ctrl junto (ex.: Alt+Q) para o atalho funcionar até enquanto você digita no chat.</p>
          </div>
          <label class="field"><span>Volume deste som: <b id="sbVolTxt">${Math.round(slot.volume * 100)}%</b></span>
            <input type="range" name="volume" min="0" max="1.5" step="0.05" value="${slot.volume}" class="sb-range"></label>
          <div class="field"><span>Áudio</span>
            <div class="sb-atalho">
              <button type="button" class="btn sm" id="sbTestar">${icon('vol')} Ouvir</button>
              <button type="button" class="btn sm" id="sbTrocar">Trocar áudio</button>
              ${slot.padrao && slot.proprio ? '<button type="button" class="btn sm ghost" id="sbRestaurar">Voltar ao original</button>' : ''}
            </div>
            <p class="small muted sb-ajuda" id="sbArqTxt">${slot.padrao && !slot.proprio ? 'Som padrão do Caras E Telas.' : 'Arquivo guardado neste navegador.'}</p>
          </div>
          ${slot.padrao ? '' : '<button type="button" class="btn sm danger" id="sbApagar">Apagar este som</button>'}
        </div>`,
      aoConfirmar: async (fd) => {
        const nome = String(fd.get('nome') || '').trim().slice(0, 24);
        if (!nome) throw new Error('Dê um nome para o som');
        if (atalho && mesmoAtalho(atalho, ATALHO_PARAR)) throw new Error('Alt+0 já é o atalho de "Parar sons".');
        for (const [campo, nomeDoAtalho] of [['atalhoMudo', 'ligar/desligar o microfone'], ['atalhoSurdo', 'mutar a sala']]) {
          if (atalho && mesmoAtalho(atalho, VOZ.cfg[campo])) {
            VOZ.cfg = validarCfgVoz({ ...VOZ.cfg, [campo]: null });
            guardarVoz();
            toast(`O atalho ${textoAtalho(atalho)} deixou de ${nomeDoAtalho}.`, 5000);
          }
        }
        const outro = atalho && SB.slots.find((s) => s.id !== slot.id && mesmoAtalho(s.atalho, atalho));
        if (outro) {
          outro.atalho = null;
          toast(`O atalho ${textoAtalho(atalho)} saiu de "${outro.nome}".`, 5000);
        }
        if (arquivoNovo) {
          await DB.guardar(slot.id, arquivoNovo.file);
          buffers.set(slot.id, arquivoNovo.buf);
          slot.proprio = true;
        } else if (restaurar) {
          await DB.apagar(slot.id).catch(() => {});
          buffers.delete(slot.id);
          slot.proprio = false;
        }
        slot.nome = nome;
        slot.emoji = String(fd.get('emoji') || '').trim().slice(0, 8) || '🔊';
        slot.volume = Number(fd.get('volume'));
        slot.atalho = atalho;
        guardarSB();
        renderSons();
      },
    });
    const mostrarAtalho = () => { $('#sbAtalhoTxt').textContent = atalho ? textoAtalho(atalho) : 'nenhum'; };
    mostrarAtalho();
    $('#sbGravar').onclick = () => {
      $('#sbGravar').textContent = 'Aperte as teclas…';
      $('#sbGravar').classList.add('primary');
      SB.gravando = (novoAtalho, cancelou) => {
        SB.gravando = null;
        sincronizarAtalhos();
        $('#sbGravar').textContent = 'Gravar atalho';
        $('#sbGravar').classList.remove('primary');
        if (!cancelou) atalho = novoAtalho;
        mostrarAtalho();
      };
      sincronizarAtalhos();
    };
    $('#sbSemAtalho').onclick = () => { atalho = null; mostrarAtalho(); };
    $('#modalBody input[name=volume]').oninput = (e) => { $('#sbVolTxt').textContent = `${Math.round(Number(e.target.value) * 100)}%`; };
    $('#sbTestar').onclick = async () => {
      const c = audioCtx();
      try {
        const buf = arquivoNovo ? arquivoNovo.buf : restaurar ? await (await fetch(slot.arquivo)).arrayBuffer().then((d) => c.decodeAudioData(d)) : await carregarBuffer(slot);
        const f = c.createBufferSource();
        const g = c.createGain();
        g.gain.value = Number($('#modalBody input[name=volume]').value) * SB.volume;
        f.buffer = buf;
        f.connect(g).connect(c.destination);
        f.start();
      } catch (e) {
        toast(e.message);
      }
    };
    $('#sbTrocar').onclick = async () => {
      const file = await escolherArquivo();
      if (!file) return;
      try {
        arquivoNovo = { file, buf: await lerArquivoDeSom(file) };
        restaurar = false;
        $('#sbArqTxt').textContent = `Novo arquivo: ${file.name} (${arquivoNovo.buf.duration.toFixed(1)} s). Clique em Salvar.`;
      } catch (e) {
        toast(e.message, 6000);
      }
    };
    if ($('#sbRestaurar')) $('#sbRestaurar').onclick = () => { restaurar = true; arquivoNovo = null; $('#sbArqTxt').textContent = 'Vai voltar ao som original. Clique em Salvar.'; };
    if ($('#sbApagar')) $('#sbApagar').onclick = async () => {
      pararSom(slot.id);
      SB.slots = SB.slots.filter((s) => s.id !== slot.id);
      buffers.delete(slot.id);
      await DB.apagar(slot.id).catch(() => {});
      guardarSB();
      renderSons();
      $('#modal').hidden = true;
      toast(`"${slot.nome}" foi apagado.`);
    };
  }

  // Na tela de quem assiste: mostra qual som foi tocado
  function onSomTocado(m) {
    if (volumeDosEfeitos(m.uid).mudo || VOZ.surdo) return; // silenciou os sons dessa pessoa
    SOM_RECENTE.set(m.uid, { emoji: m.emoji || '🔊', nome: m.nome || 'som', ate: Date.now() + 2600 });
    renderTudo();
    setTimeout(() => { if ((SOM_RECENTE.get(m.uid)?.ate || 0) <= Date.now()) { SOM_RECENTE.delete(m.uid); renderTudo(); } }, 2700);
    const t = S.tiles.get(m.uid);
    if (!t) return;
    const chip = document.createElement('div');
    chip.className = 'sb-chip';
    chip.textContent = `${m.emoji} ${m.nome}`;
    t.el.appendChild(chip);
    setTimeout(() => chip.remove(), 2600);
  }

  function montarSons() {
    dicaSons();
    sincronizarAtalhos();
    $('#sonsBtn').innerHTML = `${icon('vol')} Sons`;
    $('#sonsBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = $('#sonsPanel').hidden;
      $('#sonsPanel').hidden = !abrir;
      $('#ajustesPanel').hidden = true;
      $('#canetaPanel').hidden = true;
      if (abrir) {
        renderSons();
        for (const s of SB.slots) carregarBuffer(s).catch(() => {}); // deixa pronto para tocar sem atraso
      }
    });
    document.addEventListener('click', (e) => {
      if (!$('#sonsPanel').hidden && !e.target.closest('#sonsPanel, #sonsBtn, #modal')) $('#sonsPanel').hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#sonsPanel').hidden && $('#modal').hidden) { $('#sonsPanel').hidden = true; e.preventDefault(); }
    });
    $('#sbGrade').addEventListener('click', (e) => {
      if (e.target.closest('[data-novo]')) return adicionarSom();
      const b = e.target.closest('[data-som]');
      if (!b) return;
      if (SB.editando) editarSom(b.dataset.som);
      else tocarSom(b.dataset.som, 'clique');
    });
    $('#sbVolume').addEventListener('input', (e) => {
      SB.volume = Number(e.target.value);
      $('#sbVolumePct').textContent = `${Math.round(SB.volume * 100)}%`;
      guardarSB();
    });
    $('#sbOuvir').addEventListener('change', (e) => { SB.ouvir = e.target.checked; guardarSB(); });
    $('#sbParar').addEventListener('click', pararTodos);
    $('#sbEditar').addEventListener('click', () => { SB.editando = !SB.editando; renderSons(); });
  }

  // ================= Ciclo de vida da página =================
  function sairDaPagina() {
    if (!S.token) return;
    try {
      navigator.sendBeacon('/api/leave', new Blob([JSON.stringify({ token: S.token })], { type: 'application/json' }));
    } catch { /* ok */ }
    S.token = null;
  }
  window.addEventListener('pagehide', sairDaPagina);
  // Recarregar ou fechar no meio da transmissão para tudo: pergunta antes. O programa só sabe
  // perguntar a partir da 1.4.3 (nas versões antigas isso travaria o botão de fechar).
  window.addEventListener('beforeunload', (e) => {
    if (!S.live || S.saindoDeVez) return;
    if (PROGRAMA && PROGRAMA.confirmaSaida !== true) return;
    e.preventDefault();
    e.returnValue = '';
  });
  // Recarregou (F5, falha do programa...) estando numa sala: volta para ela sozinho
  window.addEventListener('pagehide', () => {
    if (S.saindoDeVez || S.kicked || !S.sala) return;
    try { sessionStorage.setItem('telinha-volta', JSON.stringify({ sala: S.sala, transmitia: !!S.live, t: Date.now() })); } catch { /* ok */ }
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      S.unseen = 0;
      document.title = MARCA;
    }
  });

  initLogin();
})();
