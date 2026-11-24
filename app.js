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
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

  const CORES = ['#5865f2', '#eb459e', '#3ba55c', '#faa61a', '#ed4245', '#f47b67', '#9b59b6', '#1abc9c', '#e67e22', '#607d8b'];

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
    serverName: 'Telinha', channels: [], messages: {}, users: [], iceServers: [],
    view: salvo.view || null, sala: null, live: false, localStream: null,
    quality: QUALIDADES[salvo.quality] ? salvo.quality : '1080p30',
    som: ['janela', 'pc', 'nenhum'].includes(salvo.som) ? salvo.som : 'janela',
    evitarEco: false, // pausa o som das outras transmissões enquanto mando o som do PC inteiro
    out: new Map(), // quem está me assistindo: viewerId -> conexão
    inc: new Map(), // quem eu estou assistindo: sharerId -> conexão
    tries: new Map(), tiles: new Map(), volumes: {},
    unread: new Set(), typing: new Map(), collapsed: {},
    showMembers: salvo.showMembers !== false, showSalaChat: salvo.showSalaChat !== false,
    usarPolling: !!salvo.polling, sseWatch: null,
    isAdmin: false, adminPassword: salvo.adminPassword || '', mutedUntil: 0, locked: false, kicked: null,
    focus: null, es: null, started: false, rejoinTimer: null, lastTypingSent: 0, unseen: 0, stick: true,
  };

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
    $('#loginLogo').innerHTML = icon('screen');
    if (location.protocol === 'file:') {
      // Abriram o index.html direto da pasta: sem o servidor nada funciona
      $('#loginForm').innerHTML = `<div class="login-logo">${icon('screen')}</div>
        <h1>Quase lá!</h1>
        <p class="muted">Você abriu o arquivo direto da pasta. O Telinha precisa ser aberto <b>pelo servidor</b>:</p>
        <ol class="steps">
          <li>Feche esta aba.</li>
          <li>Na pasta do projeto (onde está o <code>server.js</code>), dê dois cliques em <b>iniciar.bat</b>.<br><span class="muted small">No Mac ou no Linux, rode <code>node server.js</code> num terminal dentro da pasta.</span></li>
          <li>Deixe a janela preta aberta. O navegador abre sozinho em <b>http://localhost:3000</b>.</li>
        </ol>`;
      return;
    }
    S.myColor = CORES.includes(salvo.color) ? salvo.color : CORES[Math.floor(Math.random() * CORES.length)];
    renderColorPicker();
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
        $('#loginTitle').textContent = cfg.serverName;
        document.title = cfg.serverName;
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
    document.title = S.serverName;
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
        document.title = `(${S.unseen}) ${S.serverName}`;
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
    return s + imgs.map((u) => `<img class="embed" src="${u}" alt="" loading="lazy">`).join('');
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
    rail.textContent = S.serverName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => initial(w)).join('').toUpperCase();
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
      h += `<div class="channel ${cls}" data-ch="${esc(c.id)}">${icon('screen')}<span class="ch-name">${esc(c.name)}</span>${aoVivo ? '<span class="live-badge">AO VIVO</span>' : ''}${del(c)}</div>`;
      if (membros.length) {
        h += '<div class="sala-members">' + membros.map((u) => `<div class="sala-member">${avatar(u)}<span class="ellipsis">${esc(u.name)}</span>${coroa(u)}${u.live ? '<span class="live-badge">AO VIVO</span>' : ''}</div>`).join('') + '</div>';
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
    $('#members').innerHTML = `<h3>Online — ${us.length}</h3>` + us.map((u) => {
      let st = '';
      if (u.live) st = `<span class="live-badge">AO VIVO</span><span class="ellipsis">${esc(nomeSala(u.sala))}</span>`;
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
    }
  }

  // ================= Palco (salas de tela) =================
  function renderPalco() {
    const c = chan(S.view);
    if (!c || c.type !== 'sala') return;
    const naSala = S.sala === c.id;
    const pessoas = S.users.filter((u) => u.sala === c.id);
    $('#stagePeople').innerHTML = pessoas.map((u) => `<div class="person-chip">${avatar(u)}<span>${esc(u.name)}${u.id === S.myId ? ' (você)' : ''}</span>${coroa(u)}${u.live ? '<span class="live-badge">AO VIVO</span>' : ''}</div>`).join('');

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
        <p>Clique em <b>Compartilhar tela</b> para mostrar uma janela, uma aba ou a tela inteira para quem estiver na sala. Quer que ouçam o som? Escolha em <b>Som</b> aqui embaixo e marque a opção de áudio na janela do navegador.</p></div>`;
    }

    $('#joinBtn').hidden = naSala;
    $('#joinBtn').innerHTML = `${icon('screen')} Entrar na sala`;
    $('#shareBtn').hidden = !naSala;
    $('#leaveBtn').hidden = !naSala;
    $('#leaveBtn').innerHTML = `${icon('logout')} Sair da sala`;
    document.querySelectorAll('.quality').forEach((el) => { el.hidden = !naSala; });
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
      <div class="t-top"><span class="live-badge">AO VIVO</span><span class="t-state"></span></div>
      <button class="unmute-hint" data-act="center" hidden></button>
      <div class="t-bottom">
        <span class="t-name"></span>
        <button class="icon-btn" data-act="mute" title="Ligar/desligar som"></button>
        <input type="range" min="0" max="1" step="0.05" value="1" data-act="vol" title="Volume">
        <button class="icon-btn" data-act="pip" title="Janela flutuante (picture-in-picture)">${icon('pip')}</button>
        <button class="icon-btn" data-act="focus"></button>
        <button class="icon-btn" data-act="full" title="Tela cheia">${icon('full')}</button>
      </div>`;
    const t = { el, uid, video: el.querySelector('video'), userMuted: false, autoMuted: false };
    t.video.volume = S.volumes[uid] ?? 1;
    el.querySelector('[data-act=vol]').value = t.video.volume;
    S.tiles.set(uid, t);
    return t;
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
    if (t.uid === S.myId) {
      v.muted = true;
      v.play().catch(() => {});
      return;
    }
    v.muted = t.userMuted || S.evitarEco;
    v.play().catch(() => {
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
      t.video.muted = S.evitarEco || t.userMuted || t.autoMuted;
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
    if (t.video.srcObject !== stream) {
      t.video.srcObject = stream;
      if (stream) tocarTile(t);
    }

    let estado = '';
    let falhou = false;
    if (self) {
      const n = [...S.out.values()].filter((x) => x.pc.connectionState === 'connected').length;
      estado = n ? `${plural(n, 'pessoa assistindo', 'pessoas assistindo')}` : 'Ninguém assistindo ainda';
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
    } else if (temAudio && t.autoMuted && !S.evitarEco) {
      centro.hidden = false;
      centro.dataset.mode = 'unmute';
      centro.innerHTML = `${icon('mute')} Clique para ouvir`;
    } else {
      centro.hidden = true;
    }
    const mute = t.el.querySelector('[data-act=mute]');
    mute.hidden = !temAudio;
    mute.innerHTML = icon(t.video.muted ? 'mute' : 'vol');
    t.el.querySelector('[data-act=vol]').hidden = !temAudio;
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
        v.muted = S.evitarEco;
        v.play().catch(() => {});
      }
    } else if (act === 'mute' && S.evitarEco) {
      toast('Enquanto você manda o som do PC inteiro, o som das outras transmissões fica pausado. Se não, ele volta para elas.', 6000);
    } else if (act === 'mute') {
      t.userMuted = !v.muted ? true : false;
      t.autoMuted = false;
      v.muted = t.userMuted;
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
    t.video.volume = Number(e.target.value);
    S.volumes[uid] = t.video.volume;
    if (t.video.volume > 0 && t.video.muted && !S.evitarEco) {
      t.video.muted = false;
      t.userMuted = false;
      t.autoMuted = false;
    }
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
  async function compartilharTela() {
    if (!S.sala) return toast('Entre em uma sala primeiro.');
    if (!navigator.mediaDevices?.getDisplayMedia) {
      return toast(window.isSecureContext
        ? 'Este navegador não permite compartilhar a tela. Use Chrome, Edge ou Firefox no computador.'
        : 'Compartilhar a tela só funciona em endereços HTTPS (ou localhost). Veja o LEIA-ME.', 6000);
    }
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
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia(opcoes);
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'AbortError') return; // cancelou
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: S.som !== 'nenhum',
          ...(S.som === 'janela' ? { systemAudio: 'exclude' } : {}),
        });
      } catch (e2) {
        if (e2.name !== 'NotAllowedError') toast('Não foi possível compartilhar: ' + e2.message);
        return;
      }
    }
    if (!S.sala) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const vt = stream.getVideoTracks()[0];
    if (vt) {
      try { vt.contentHint = q.hint; } catch { /* ok */ }
      vt.addEventListener('ended', () => pararTransmissao());
    }
    S.localStream = stream;
    S.live = true;
    // Mandando o som do PC inteiro? Avisa sobre chamadas de voz e evita que as
    // outras transmissões tocando aqui voltem para quem está transmitindo.
    const at = stream.getAudioTracks()[0];
    const superficie = vt?.getSettings?.().displaySurface;
    S.evitarEco = false;
    if (at && superficie === 'monitor') {
      if (at.getSettings?.().restrictOwnAudio !== true) S.evitarEco = true;
      toast('Você está mandando o som do PC inteiro. Se vocês conversam por chamada (Discord, WhatsApp…), os amigos vão ouvir a própria voz. Para evitar, escolha "Som: só da aba ou janela".', 10000);
    } else if (!at && S.som !== 'nenhum') {
      toast('Esta transmissão está sem som. Para mandar som, compartilhe uma aba e marque "Compartilhar áudio da guia".', 7000);
    }
    aplicarMudoEco();
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

  function pararTransmissao(silencioso) {
    if (!S.live && !S.localStream) return;
    S.live = false;
    if (S.localStream) S.localStream.getTracks().forEach((t) => t.stop());
    S.localStream = null;
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
    for (const c of S.out.values()) ajustarEnvio(c.pc);
  }

  async function ajustarEnvio(pc) {
    const q = QUALIDADES[S.quality];
    for (const s of pc.getSenders()) {
      if (!s.track || s.track.kind !== 'video') continue;
      try {
        const p = s.getParameters();
        if (!p.encodings || !p.encodings.length) p.encodings = [{}];
        p.encodings[0].maxBitrate = q.br;
        p.encodings[0].maxFramerate = q.fps;
        await s.setParameters(p);
      } catch (e) {
        console.warn('Não consegui ajustar a qualidade de envio', e);
      }
    }
  }

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
  }

  async function onSignal(from, d) {
    if (!d || typeof d !== 'object') return;
    try {
      if (d.k === 'watch') await pedidoParaAssistir(from);
      else if (d.k === 'offer') await recebeuOferta(from, d);
      else if (d.k === 'answer') await recebeuResposta(from, d);
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
    for (const t of S.localStream.getTracks()) pc.addTrack(t, S.localStream);
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
    ajustarEnvio(c.pc);
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
    $('#menuBtn').innerHTML = icon('menu');
    $('#toggleChatBtn').innerHTML = icon('chat');
    $('#toggleMembersBtn').innerHTML = icon('people');
    $('#logoutBtn').innerHTML = icon('logout');
    $('#vpLeave').innerHTML = icon('logout');
    $('#sendBtn').innerHTML = icon('send');

    const som = $('#somSelect');
    som.value = S.som;
    som.addEventListener('change', () => {
      S.som = som.value;
      salvar({ som: S.som });
      if (S.som === 'pc') toast('Com "PC inteiro", entra todo o som do computador, inclusive chamadas de voz.', 6000);
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
    document.title = S.serverName;
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
        u.live && '<span class="live-badge">AO VIVO</span>',
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
      document.title = S.serverName;
    }
  });

  initLogin();
})();
