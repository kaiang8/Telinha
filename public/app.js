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
    retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    crown: '<path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.8 10H5.3z" fill="currentColor" stroke-width="1.5"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    megaphone: '<path d="M3 10v4h3l8 4.5v-13L6 10H3z"/><path d="M17.5 9a3.5 3.5 0 0 1 0 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    swap: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  };
  const MARCA = 'Caras E Telas';
  const LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-9 23 24)"><rect x="5" y="10" width="36" height="27" rx="8" fill="#a9b0ff"/><g class="pisca"><circle cx="16.5" cy="21.5" r="2.7" fill="#1b1440"/><circle cx="29.5" cy="21.5" r="2.7" fill="#1b1440"/></g><path d="M16 28q7 5 14 0" fill="none" stroke="#1b1440" stroke-width="2.7" stroke-linecap="round"/></g><g transform="rotate(7 41 38)"><rect x="22.5" y="24.5" width="37" height="28" rx="8.5" fill="#ffb23f" style="stroke: var(--recorte, #101233)" stroke-width="3.5"/><path d="M32.5 36.5q3.2-3 6.4 0" fill="none" stroke="#1b1440" stroke-width="2.7" stroke-linecap="round"/><circle cx="48" cy="35.5" r="2.7" fill="#1b1440"/><path d="M34.5 42.5q7.5 6 15 0" fill="none" stroke="#1b1440" stroke-width="2.7" stroke-linecap="round"/></g></svg>';
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
    $('#adminToggle').addEventListener('click', () => {
      $('#adminField').hidden = !$('#adminField').hidden;
      $('#adminToggle').textContent = $('#adminField').hidden ? 'Sou admin' : 'Entrar sem ser admin';
      if (!$('#adminField').hidden) $('#adminInput').focus();
      else $('#adminInput').value = '';
    });

    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        S.serverName = cfg.serverName;
        if (cfg.serverName && cfg.serverName !== MARCA) $('#loginSub').textContent = `Entre em ${cfg.serverName} para conversar e assistir junto com a galera.`;
        $('#passField').hidden = !cfg.needsPassword;
        if (cfg.locked) $('#loginSub').textContent = 'O servidor está trancado agora: só admins conseguem entrar.';
        if (!semAuto && salvo.name && (salvo.adminPassword || !cfg.needsPassword || salvo.password)) {
          entrar(salvo.name, S.myColor, salvo.password || '', true, salvo.adminPassword || '');
        } else {
          $('#nameInput').focus();
        }
      })
      .catch(() => { $('#loginError').textContent = 'Não consegui falar com o servidor. A janela do servidor (iniciar.bat) está aberta?'; });

    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      entrar($('#nameInput').value.trim(), S.myColor, $('#passInput').value, false, $('#adminInput').value);
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

  async function entrar(name, color, password, auto, adminPassword = '') {
    if (!name) return;
    const btn = $('#loginBtn');
    btn.disabled = true;
    $('#loginError').textContent = '';
    try {
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, password, adminPassword, device: salvo.device }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(j.error || 'Erro ao entrar');
        err.status = r.status;
        err.campo = j.campo;
        throw err;
      }
      S.token = j.token;
      S.myId = j.id;
      S.myName = name;
      S.myColor = color;
      S.password = password;
      S.adminPassword = j.admin ? adminPassword : '';
      S.kicked = null;
      salvar({ name, color, password, adminPassword: S.adminPassword });
      btn.textContent = 'Conectando…';
      conectar();
    } catch (e) {
      if (e.campo === 'admin') {
        salvar({ adminPassword: '' });
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
        body: JSON.stringify({ name: S.myName, color: S.myColor, password: S.password, adminPassword: S.adminPassword, device: salvo.device }),
      });
      if (S.kicked) return;
      if (r.status === 403) {
        const j = await r.json().catch(() => ({}));
        if (j.banned) return foiExpulso({ banned: true, reason: '' });
        if (j.campo === 'admin') { S.adminPassword = ''; salvar({ adminPassword: '' }); S.rejoinTimer = null; return reentrar(); }
        salvar({ password: '' });
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
      case 'typing': return onTyping(m);
      case 'channels': return onChannels(m.channels);
      case 'signal': return onSignal(m.from, m.data);
      case 'msg-delete': return onMsgDelete(m);
      case 'clear': return onClear(m);
      case 'settings': return onSettings(m);
      case 'announce': return mostrarAviso(m);
      case 'kicked': return foiExpulso(m);
      case 'muted': return onMuted(m);
      case 'force': return onForce(m);
      case 'role': return onRole(m);
      case 'renamed': return onRenamed(m);
      case 'sb': return onSomTocado(m);
    }
  }

  async function onInit(m) {
    S.myId = m.me.id;
    S.isAdmin = !!m.me.admin;
    S.mutedUntil = m.muted || 0;
    S.locked = !!m.locked;
    S.serverName = m.serverName;
    S.channels = m.channels;
    S.messages = m.messages || {};
    S.iceServers = m.iceServers || [];
    S.users = m.users;
    if (S.sala && !chan(S.sala)) sairDaSalaLocal();
    patchMe();
    if (!chan(S.view)) S.view = (textChannels()[0] || S.channels[0]).id;

    if (!S.started) {
      S.started = true;
      $('#login').hidden = true;
      $('#app').hidden = false;
      montarBotoes();
    }
    document.title = MARCA;
    renderTudo();
    renderMensagens();

    // Reconectou no meio de uma sala? Avisa o servidor de novo.
    if (S.sala) {
      try {
        await api('state', { sala: S.sala, live: S.live });
      } catch {
        sairDaSalaLocal();
      }
      sincronizarStreams();
      renderTudo();
    }
  }

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
    atualizarPainel();
  }

  function onChannels(channels) {
    S.channels = channels;
    if (S.sala && !chan(S.sala)) {
      sairDaSalaLocal();
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
    if (lista.length > 200) lista.shift();

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
      if (mencionaMe(msg.text)) blip('msg');
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

  function mencionaMe(text) {
    if (/@(todos|everyone|here|galera)\b/i.test(text)) return true;
    const nome = S.myName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('@' + nome + '(?![\\p{L}\\p{N}_])', 'iu').test(text);
  }

  function formatar(texto) {
    let s = esc(texto);
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
      .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
      .replace(/(^|\s)(@[\p{L}\p{N}_.-]{1,32})/gu, '$1<span class="ment">$2</span>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
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

  function msgHtml(m, prev) {
    const d = new Date(m.ts);
    let h = '';
    if (!prev || !mesmoDia(prev.ts, m.ts)) {
      h += `<div class="day-sep"><span>${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>`;
    }
    const agrupada = prev && prev.uid === m.uid && m.ts - prev.ts < 5 * 60e3 && mesmoDia(prev.ts, m.ts);
    const cls = mencionaMe(m.text) ? ' mention' : '';
    const podeApagar = m.uid === S.myId || S.isAdmin;
    const acoes = podeApagar ? `<div class="m-actions"><button class="icon-btn small" data-delmsg="${esc(m.id)}" title="Apagar mensagem (Shift+clique apaga sem perguntar)">${icon('trash')}</button></div>` : '';
    const attrs = `data-id="${esc(m.id)}"`;
    if (agrupada) {
      return h + `<div class="msg${cls}" ${attrs}><span class="m-stamp">${hhmm(d)}</span><div class="m-text">${formatar(m.text)}</div>${acoes}</div>`;
    }
    return h + `<div class="msg head${cls}" ${attrs}>${avatar(m)}<div class="m-head"><span class="m-name" style="color:${esc(m.color)}">${esc(m.name)}</span>${coroa(m)}<span class="m-time" title="${esc(d.toLocaleString('pt-BR'))}">${quando(d)}</span></div><div class="m-text">${formatar(m.text)}</div>${acoes}</div>`;
  }

  function renderMensagens() {
    const c = chan(S.view);
    if (!c) return;
    const lista = S.messages[c.id] || [];
    const sala = c.type === 'sala';
    let h = `<div class="welcome"><div class="wicon">${icon(sala ? 'screen' : 'hash')}</div>
      <h2>${sala ? 'Chat da ' + esc(c.name) : 'Bem-vindo(a) a #' + esc(c.name) + '!'}</h2>
      <p>${sala ? 'Converse aqui enquanto assistem juntos.' : `Este é o começo do canal #${esc(c.name)}.`}</p></div>`;
    lista.forEach((m, i) => { h += msgHtml(m, lista[i - 1]); });
    const box = $('#messages');
    box.innerHTML = h;
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
  });
  // Imagens carregando depois empurram o chat: mantém colado no fim
  $('#messages').addEventListener('load', (e) => {
    if (e.target.tagName === 'IMG' && S.stick) $('#messages').scrollTop = $('#messages').scrollHeight;
  }, true);
  $('#messages').addEventListener('click', (e) => {
    const del = e.target.closest('[data-delmsg]');
    if (del) return apagarMensagem(del.dataset.delmsg, e.shiftKey);
    const img = e.target.closest('img.embed');
    if (!img) return;
    const v = document.createElement('div');
    v.className = 'img-viewer';
    v.innerHTML = `<img src="${esc(img.src)}" alt="">`;
    v.onclick = () => v.remove();
    document.body.appendChild(v);
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
    try {
      await api('msg', { channel: S.view, text: text.startsWith('//') ? text.slice(1) : text });
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
    $('#serverName').textContent = S.serverName;
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
      h += `<div class="channel ${cls}" data-ch="${esc(c.id)}">${icon('hash')}<span class="ch-name">${esc(c.name)}</span>${del(c)}</div>`;
    }
    h += cat('sala', 'Salas de tela');
    for (const c of salas()) {
      const membros = S.users.filter((u) => u.sala === c.id);
      if (S.collapsed.sala && c.id !== S.view && c.id !== S.sala && !membros.length) continue;
      const aoVivo = membros.some((u) => u.live);
      const cls = [c.id === S.view && 'active', S.unread.has(c.id) && 'unread'].filter(Boolean).join(' ');
      h += `<div class="channel ${cls}" data-ch="${esc(c.id)}">${icon('screen')}<span class="ch-name">${esc(c.name)}</span>${aoVivo ? '<span class="live-badge">ao vivo</span>' : ''}${del(c)}</div>`;
      if (membros.length) {
        h += '<div class="sala-members">' + membros.map((u) => `<div class="sala-member">${avatar(u)}<span class="ellipsis">${esc(u.name)}</span>${coroa(u)}${u.live ? '<span class="live-badge">ao vivo</span>' : ''}</div>`).join('') + '</div>';
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

  function renderMembros() {
    const us = [...S.users].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    $('#members').innerHTML = `<h3>${us.length} online</h3>` + us.map((u) => {
      let st = '';
      if (u.live) st = `<span class="live-badge">ao vivo</span><span class="ellipsis">${esc(nomeSala(u.sala))}</span>`;
      else if (u.sala) st = `<span class="ellipsis">Em ${esc(nomeSala(u.sala))}</span>`;
      const clic = S.isAdmin && u.id !== S.myId ? ` clickable" data-uid="${esc(u.id)}" title="Moderar ${esc(u.name)}` : '';
      return `<div class="member${clic}">${avatar(u, 'dotted')}<div class="mn"><div class="ellipsis name-line"><span style="color:${esc(u.color)}">${esc(u.name)}</span>${coroa(u)}${u.id === S.myId ? ' <span class="muted small">(você)</span>' : ''}</div>${st ? `<div class="small muted">${st}</div>` : ''}</div></div>`;
    }).join('');
  }

  function renderPaineis() {
    const me = { name: S.myName, color: S.myColor };
    $('#meAvatar').outerHTML = avatar(me, 'dotted').replace('class="avatar', 'id="meAvatar" class="avatar');
    $('#meName').textContent = S.myName;
    $('#meStatus').textContent = S.live ? 'Transmitindo' : S.sala ? `Em ${nomeSala(S.sala)}` : S.isAdmin ? 'Online · Admin' : 'Online';

    const vp = $('#voicePanel');
    vp.hidden = !S.sala;
    if (S.sala) {
      const st = $('#vpStatus');
      st.classList.toggle('live', S.live);
      st.textContent = S.live ? '● Ao vivo' : 'Conectado à sala';
      $('#vpWhere').textContent = `${nomeSala(S.sala)} / ${S.serverName}`;
      const sb = $('#vpShare');
      sb.innerHTML = icon(S.live ? 'screenOff' : 'screen');
      sb.title = S.live ? 'Parar transmissão' : 'Compartilhar tela';
      sb.classList.toggle('active', S.live);
      $('#vpSwap').hidden = !S.live;
    }
  }

  // ================= Palco (salas de tela) =================
  function renderPalco() {
    const c = chan(S.view);
    if (!c || c.type !== 'sala') return;
    const naSala = S.sala === c.id;
    const pessoas = S.users.filter((u) => u.sala === c.id);
    $('#stagePeople').innerHTML = pessoas.map((u) => `<div class="person-chip">${avatar(u)}<span>${esc(u.name)}${u.id === S.myId ? ' (você)' : ''}</span>${coroa(u)}${u.live ? '<span class="live-badge">ao vivo</span>' : ''}</div>`).join('');

    const vivos = naSala ? pessoas.filter((u) => u.live) : [];
    sincronizarTiles(vivos.map((u) => u.id));
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
    if (!naSala) { $('#ajustesPanel').hidden = true; $('#sonsPanel').hidden = true; }
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

  function criarTile(uid) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.uid = uid;
    el.innerHTML = `<video autoplay playsinline muted></video>
      <div class="t-top"><span class="live-badge">ao vivo</span><span class="t-state"></span></div>
      <button class="unmute-hint" data-act="center" hidden></button>
      <div class="t-bottom">
        <span class="t-name"></span>
        <button class="icon-btn" data-act="mute" title="Ligar/desligar som"></button>
        <input type="range" min="0" max="2" step="0.05" value="1" data-act="vol" title="Volume desta transmissão (até 200%)">
        <span class="vol-pct">100%</span>
        <button class="icon-btn" data-act="pip" title="Janela flutuante (picture-in-picture)">${icon('pip')}</button>
        <button class="icon-btn" data-act="focus"></button>
        <button class="icon-btn" data-act="full" title="Tela cheia">${icon('full')}</button>
      </div>`;
    const t = { el, uid, video: el.querySelector('video'), userMuted: false, autoMuted: false, src: null, gain: null, audioId: null };
    S.tiles.set(uid, t);
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
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
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
    const mudo = t.userMuted || S.evitarEco;
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
        desligarAudio(t);
        t.video.srcObject = null;
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
      estado = n
        ? `${plural(n, 'pessoa assistindo', 'pessoas assistindo')}, ${mbps(fatia)} Mbps para cada${fatia < q.br * 0.85 ? ' (qualidade ajustada ao seu upload)' : ''}`
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
    if (tileEl && !e.target.closest('[data-act]')) telaCheia(tileEl);
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
    if (S.live) pararTransmissao(true);
    for (const sid of [...S.inc.keys()]) fecharInc(sid);
    S.tries.clear();
    S.sala = id;
    S.focus = null;
    patchMe();
    blip('join');
    renderTudo();
    try {
      await api('state', { sala: id, live: false });
    } catch (e) {
      toast('Não foi possível entrar na sala: ' + e.message);
      sairDaSalaLocal();
      renderTudo();
      return;
    }
    sincronizarStreams();
    renderTudo();
  }

  function sairDaSalaLocal() {
    if (S.live) pararTransmissao(true);
    for (const sid of [...S.inc.keys()]) fecharInc(sid);
    S.tries.clear();
    S.sala = null;
    S.focus = null;
    patchMe();
  }

  function sairDaSala() {
    if (!S.sala) return;
    sairDaSalaLocal();
    blip('leave');
    api('state', { sala: null, live: false }).catch(() => {});
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
    // Clicou em "Parar compartilhamento" na barra do navegador
    vt.addEventListener('ended', () => { if (S.localStream === stream) pararTransmissao(); });
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
    if (S.diagCaptura?.tentativa > 0) console.warn('Captura em modo compatível:', S.diagCaptura);
    ORC.total = 8e6;
    ORC.congest = ORC.folga = ORC.espera = 0;
    avaliarSom(stream, false);
    patchMe();
    blip('live');
    renderTudo();
    try {
      await api('state', { sala: S.sala, live: true });
    } catch (e) {
      toast('Erro ao começar a transmissão: ' + e.message);
      pararTransmissao();
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

  function pararTransmissao(silencioso) {
    if (!S.live && !S.localStream) return;
    S.live = false;
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
    patchMe();
    if (!silencioso) api('state', { sala: S.sala, live: false }).catch(() => {});
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
    } catch (e) {
      console.warn('Erro de sinalização', e);
    }
  }

  // --- lado de quem transmite ---
  async function pedidoParaAssistir(vid) {
    if (!S.live || !S.localStream) return;
    fecharOut(vid);
    const pc = new RTCPeerConnection({ iceServers: S.iceServers });
    const c = { pc, pending: [], sess: Math.random().toString(36).slice(2, 10) };
    S.out.set(vid, c);
    const fonte = S.sendStream || S.localStream;
    for (const t of fonte.getTracks()) pc.addTrack(t, fonte);
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

  async function recebeuResposta(vid, d) {
    const c = S.out.get(vid);
    if (!c || d.sess !== c.sess) return;
    await c.pc.setRemoteDescription(d.sdp);
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

  // ================= Canais (criar / apagar) =================
  function abrirModal({ titulo, corpo, ok = 'OK', perigo = false, aoConfirmar }) {
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
    $('#vpLeave').innerHTML = icon('logout');
    $('#sendBtn').innerHTML = icon('send');

    $('#sendVol').addEventListener('input', (e) => {
      S.volEnvio = Number(e.target.value);
      salvar({ volEnvio: S.volEnvio });
      $('#sendVolPct').textContent = `${Math.round(S.volEnvio * 100)}%`;
      if (S.envio) S.envio.gain.gain.setTargetAtTime(S.volEnvio, S.envio.gain.context.currentTime, 0.02);
    });

    montarSons();
    $('#ajustesBtn').innerHTML = `${icon('sliders')} Ajustes`;
    $('#ajustesBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('#ajustesPanel').hidden = !$('#ajustesPanel').hidden;
      $('#sonsPanel').hidden = true;
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
    $('#members').addEventListener('click', (e) => {
      const m = e.target.closest('.member[data-uid]');
      if (m && S.isAdmin) abrirPainelAdmin('pessoas', m.dataset.uid);
    });

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
        corpo: '<p>Quer sair? Da próxima vez você vai precisar digitar o apelido de novo.</p>',
        aoConfirmar: async () => {
          salvar({ name: '', password: '', adminPassword: '' });
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
    renderMensagens();
    if (!colado) box.scrollTop = topo;
  }

  function onMsgDelete(m) {
    const lista = S.messages[m.channel];
    if (!lista) return;
    const i = lista.findIndex((x) => x.id === m.id);
    if (i < 0) return;
    lista.splice(i, 1);
    if (m.channel === S.view) rerenderMantendoScroll();
  }

  function onClear(m) {
    S.messages[m.channel] = [];
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
    try { pararTransmissao(true); } catch { /* ok */ }
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
      const longo = m.until - Date.now() > 300 * 864e5;
      toast(`${m.by} silenciou você no chat ${longo ? 'até segunda ordem' : `até ${hhmm(new Date(m.until))}`}.`, 6000);
    } else {
      toast(`${m.by} tirou o seu silêncio. Pode falar de novo!`);
    }
  }

  function onForce(m) {
    if (m.what === 'stop') {
      pararTransmissao(true);
      toast(`${m.by} encerrou a sua transmissão.`);
    } else {
      sairDaSalaLocal();
      toast(`${m.by} tirou você da sala.`);
    }
    renderTudo();
  }

  function onRole(m) {
    S.isAdmin = !!m.admin;
    if (!m.admin) {
      S.adminPassword = '';
      salvar({ adminPassword: '' });
      fecharPainelAdmin();
    }
    toast(m.admin
      ? (m.by ? `${m.by} deu admin para você (até você sair).` : 'Modo admin ativado. Digite / no chat para ver os comandos.')
      : (m.by ? `${m.by} tirou o seu admin.` : 'Você saiu do modo admin.'), 5000);
    renderTudo();
    rerenderMantendoScroll();
  }

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
    const apagar = () => api('msg-delete', { channel: S.view, id });
    if (direto) return apagar().catch((e) => toast(e.message));
    abrirModal({
      titulo: 'Apagar mensagem',
      ok: 'Apagar',
      perigo: true,
      corpo: `<p>Apagar esta mensagem de <b>${esc(m.name)}</b>? Ela some para todo mundo.</p><div class="msg-preview">${formatar(m.text)}</div>`,
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
    { nome: 'mute', args: '<nome> [minutos]', desc: 'Silenciar no chat (sem minutos = até tirar)' },
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
        await api('admin-login', { password: resto });
        S.adminPassword = resto;
        salvar({ adminPassword: resto });
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
    if (!itens.length) { box.hidden = true; return; }
    box.innerHTML = `<div class="cs-title">Comandos</div>` + itens.map((c, i) =>
      `<div class="cs-item${i === 0 ? ' sel' : ''}" data-cmd="${c.nome}"><b>/${c.nome}</b><span class="args">${esc(c.args)}</span><span class="desc">${esc(c.desc)}</span></div>`).join('');
    box.hidden = false;
  }
  $('#cmdSuggest').addEventListener('mousedown', (e) => {
    const it = e.target.closest('[data-cmd]');
    if (!it) return;
    e.preventDefault();
    const input = $('#msgInput');
    input.value = `/${it.dataset.cmd} `;
    input.focus();
    renderSugestoes();
  });

  // ================= Painel de admin =================
  const P = { aberto: false, aba: 'pessoas', dados: null, foco: null, form: null, timer: null };

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
      P.dados = await adm('list');
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
      ['banidos', 'Banidos', d ? d.bans.length : ''],
      ['servidor', 'Servidor', ''],
      ['comandos', 'Comandos', ''],
    ];
    let corpo = '<div class="ap-empty">Carregando…</div>';
    if (d) corpo = { pessoas: abaPessoas, banidos: abaBanidos, servidor: abaServidor, comandos: abaComandos }[P.aba](d);
    // preserva o que estava sendo digitado
    const digitando = {};
    $('#adminPanel').querySelectorAll('input[id], select[id]').forEach((el) => { digitando[el.id] = el.value; });
    const foco = document.activeElement?.id;
    $('#adminPanel').innerHTML = `<div class="admin-card" role="dialog" aria-label="Painel de admin">
      <header class="admin-head"><div class="admin-title">${icon('shield')} Painel de admin</div>
        <button class="icon-btn" data-act="fechar" title="Fechar (Esc)">${icon('close')}</button></header>
      <nav class="admin-tabs">${abas.map(([id, nome, n]) => `<button data-tab="${id}" class="${P.aba === id ? 'on' : ''}">${nome}${n !== '' ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</nav>
      <div class="admin-body">${corpo}</div></div>`;
    for (const [id, v] of Object.entries(digitando)) {
      const el = document.getElementById(id);
      if (el && el.dataset.keep !== undefined) el.value = v;
    }
    if (foco && document.getElementById(foco)) document.getElementById(foco).focus();
    if (P.foco) {
      const el = $(`#adminPanel .ap-user[data-uid="${CSS.escape(P.foco)}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }

  function abaPessoas(d) {
    const us = [...d.users].sort((a, b) => (a.id === S.myId ? -1 : b.id === S.myId ? 1 : a.name.localeCompare(b.name, 'pt-BR')));
    return `<p class="ap-hint">Dica: clicar em alguém na lista de membros abre direto aqui. No chat, digite <b>/</b> para ver os comandos rápidos.</p>` + us.map((u) => {
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
          form = `<div class="ap-form"><span>Silenciar ${esc(u.name)} no chat (ainda pode assistir e transmitir):</span>
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
    return `
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
      <div class="ap-section"><h4>Onde ficam os dados</h4>
        <p>${st.storage === 'upstash' ? 'No Upstash (banco na nuvem): canais, mensagens, banimentos e configurações sobrevivem a reinícios.' : 'No arquivo <b>data.json</b>, na pasta do servidor. Numa hospedagem grátis, esse arquivo some quando o serviço reinicia: configure o Upstash (veja o LEIA-ME).'}</p></div>
      <div class="ap-section"><h4>Modo admin</h4>
        <p>Sair do modo admin neste navegador. Para voltar, use a senha de admin.</p>
        <button class="btn sm" data-act="sairadmin">Sair do modo admin</button></div>`;
  }

  function abaComandos() {
    return `<p class="ap-hint">Digite no chat. Os nomes podem ter espaços e não precisam estar completos: <b>/kick jo</b> funciona se só houver um "Jo…" online.</p>
      <table class="ap-cmds">${COMANDOS.map((c) => `<tr><td>/${c.nome} <span class="args">${esc(c.args)}</span></td><td>${esc(c.desc)}</td></tr>`).join('')}</table>`;
  }

  $('#adminPanel').addEventListener('click', async (e) => {
    if (e.target.id === 'adminPanel') return fecharPainelAdmin();
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      P.aba = tab.dataset.tab;
      P.form = null;
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
          await adm('admin-password', { senha: nova });
          S.adminPassword = nova;
          salvar({ adminPassword: nova });
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
        atalho: s.atalho !== undefined ? s.atalho : { code: p.tecla, alt: true },
        volume: typeof s.volume === 'number' ? s.volume : 1, proprio: !!s.proprio,
      };
    });
    for (const s of salvos) {
      if (!s.padrao && typeof s.id === 'string' && s.id.startsWith('c-')) {
        slots.push({ id: s.id, padrao: false, nome: s.nome || 'Som', emoji: s.emoji || '🔊', atalho: s.atalho || null, volume: typeof s.volume === 'number' ? s.volume : 1, proprio: true });
      }
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
    const naTransmissao = S.live && !!S.envio;
    if (naTransmissao) ganho.connect(S.envio.dest);
    // ouvir aqui (se o som do PC estiver sendo capturado sem filtro, não toca aqui para não ir em dobro)
    if (!naTransmissao || (SB.ouvir && !S.evitarEco)) ganho.connect(c.destination);
    fonte.onended = () => {
      if (tocando.get(id)?.fonte !== fonte) return;
      tocando.delete(id);
      try { ganho.disconnect(); } catch { /* ok */ }
      marcarTocando(id, 0);
    };
    fonte.start();
    tocando.set(id, { fonte, ganho });
    marcarTocando(id, buf.duration);
    if (naTransmissao) api('sb', { nome: slot.nome, emoji: slot.emoji }).catch(() => {});
    else if (origem === 'atalho') toast(S.live ? 'O áudio da transmissão não está disponível: o som tocou só aqui.' : 'Você não está transmitindo: o som tocou só aqui.');
  }

  // ----- atalhos -----
  const NOMES_TECLAS = { Space: 'Espaço', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Minus: '-', Equal: '=', Backquote: "'", BracketLeft: '´', BracketRight: '[', Backslash: ']', Semicolon: 'Ç', Quote: '~', Comma: ',', Period: '.', Slash: ';', IntlRo: '/', Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', Enter: 'Enter', Tab: 'Tab' };
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
    $('#sbAviso').textContent = S.live && S.envio
      ? 'Ao vivo: quem está assistindo ouve os sons junto com a sua transmissão.'
      : S.live
        ? 'O navegador não liberou o áudio da transmissão, então os sons tocam só aqui.'
        : 'Prévia: só você ouve. Comece a transmitir para a sala ouvir.';
    $('#sbAviso').classList.toggle('ao-vivo', !!(S.live && S.envio));
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
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      S.unseen = 0;
      document.title = MARCA;
    }
  });

  initLogin();
})();
