'use strict';
// Seletor de tela do programa. Os nomes das janelas e dos programas vêm de fora, então
// tudo é montado com textContent (nunca innerHTML).
(() => {
  const $ = (s) => document.querySelector(s);
  let fontes = [];
  let aba = 'janela';
  let escolhido = null;
  let dados = { comSom: false, programas: null, janelas: {}, preferencia: null };
  let modo = 'sistema'; // de onde vem o som: janela | programa | sistema | nenhum
  let programaPid = null;

  const fonteEscolhida = () => fontes.find((f) => f.id === escolhido) || null;
  const programa = (pid) => dados.programas?.find((p) => p.pid === pid) || null;

  function nomeDe(f, i, telas) {
    if (f.tipo !== 'tela') return f.nome || 'Janela sem nome';
    return telas.length === 1 ? 'Tela inteira' : `Tela ${i + 1}`;
  }

  function cartao(f, nome) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fonte';
    b.dataset.id = f.id;
    b.setAttribute('aria-pressed', String(f.id === escolhido));
    b.title = nome;
    const img = document.createElement('img');
    img.className = 'miniatura';
    img.alt = '';
    if (f.miniatura) img.src = f.miniatura;
    const linha = document.createElement('span');
    linha.className = 'nome';
    if (f.icone) {
      const ic = document.createElement('img');
      ic.alt = '';
      ic.src = f.icone;
      linha.append(ic);
    }
    const txt = document.createElement('span');
    txt.textContent = nome;
    linha.append(txt);
    b.append(img, linha);
    b.addEventListener('click', () => escolher(f.id));
    b.addEventListener('dblclick', () => { escolher(f.id); compartilhar(); });
    return b;
  }

  function render() {
    const telas = fontes.filter((f) => f.tipo === 'tela');
    const janelas = fontes.filter((f) => f.tipo === 'janela');
    $('#abaJanela').textContent = `Janelas (${janelas.length})`;
    $('#abaTela').textContent = telas.length > 1 ? `Telas (${telas.length})` : 'Tela inteira';
    $('#abaJanela').setAttribute('aria-selected', String(aba === 'janela'));
    $('#abaTela').setAttribute('aria-selected', String(aba === 'tela'));
    $('#dicaJogo').hidden = aba !== 'janela';
    const grade = $('#grade');
    grade.replaceChildren();
    const lista = aba === 'tela' ? telas : janelas;
    if (!lista.length) {
      const p = document.createElement('p');
      p.className = 'vazio';
      p.textContent = aba === 'tela' ? 'Nenhuma tela encontrada.' : 'Nenhuma janela aberta para compartilhar.';
      grade.append(p);
    }
    lista.forEach((f, i) => grade.append(cartao(f, nomeDe(f, i, telas))));
    atualizarSom();
  }

  // ---------- som ----------
  function montarProgramas() {
    const sel = $('#programa');
    sel.replaceChildren();
    const vazio = document.createElement('option');
    vazio.value = '';
    vazio.textContent = 'Escolha o programa…';
    sel.append(vazio);
    for (const p of dados.programas || []) {
      const o = document.createElement('option');
      o.value = String(p.pid);
      o.textContent = p.nome + (p.voz ? ' (chamada de voz)' : p.tocando ? ' (tocando agora)' : '');
      sel.append(o);
    }
    sel.value = programaPid ? String(programaPid) : '';
  }

  function aviso(texto, alerta) {
    const el = $('#somAviso');
    el.textContent = texto;
    el.classList.toggle('alerta', !!alerta);
  }

  function atualizarSom() {
    const f = fonteEscolhida();
    const temProgramas = Array.isArray(dados.programas);
    const janelaPid = f && f.tipo === 'janela' ? dados.janelas?.[f.id] || null : null;

    if (dados.comSom && f) {
      if (modo === 'janela' && !janelaPid) modo = temProgramas ? 'programa' : 'sistema';
      if (modo === 'programa' && !temProgramas) modo = 'sistema';
    }
    $('#chipJanela input').disabled = !temProgramas || (!!f && !janelaPid);
    $('#chipPrograma input').disabled = !temProgramas || !dados.programas.length;
    for (const r of document.querySelectorAll('input[name=som]')) r.checked = r.value === modo;
    $('#programa').hidden = modo !== 'programa';

    if (!dados.comSom) {
      aviso('Sem som: para mandar som, escolha outra opção em Ajustes → Som.');
    } else if (modo === 'janela') {
      const p = programa(janelaPid);
      if (!f) aviso('Vai só o som da janela que você escolher. O Discord e outras chamadas ficam de fora.');
      else if (p?.voz) aviso(`Essa janela é do ${p.nome}: quem está na chamada vai ouvir a própria voz.`, true);
      else aviso(`Vai só o som de ${p?.nome || f.nome}. O Discord e outras chamadas ficam de fora.`);
    } else if (modo === 'programa') {
      const p = programa(programaPid);
      if (!p) aviso('Escolha o programa que vai mandar o som, como o jogo ou o player do filme.');
      else if (p.voz) aviso(`${p.nome} é um programa de chamada: quem está na chamada vai ouvir a própria voz.`, true);
      else aviso(`Vai só o som de ${p.nome}. O Discord e outras chamadas ficam de fora.`);
    } else if (modo === 'sistema') {
      aviso('Vai todo o som do computador, menos o do Caras E Telas. Atenção: as vozes do Discord e de outras chamadas vão junto.', true);
    } else {
      aviso('A transmissão vai sem som.');
    }
    $('#compartilhar').disabled = !f || (dados.comSom && modo === 'programa' && !programa(programaPid));
  }

  // ---------- ações ----------
  function escolher(id) {
    escolhido = id;
    render();
    document.querySelector(`.fonte[aria-pressed="true"]`)?.focus();
  }

  function compartilhar() {
    if ($('#compartilhar').disabled || !escolhido) return;
    window.seletor.escolher({
      id: escolhido,
      modo: dados.comSom ? modo : 'nenhum',
      pid: modo === 'programa' ? programaPid : null,
    });
  }

  $('#abaJanela').addEventListener('click', () => { aba = 'janela'; render(); });
  $('#abaTela').addEventListener('click', () => { aba = 'tela'; render(); });
  $('#cancelar').addEventListener('click', () => window.seletor.escolher(null));
  $('#compartilhar').addEventListener('click', compartilhar);
  for (const r of document.querySelectorAll('input[name=som]')) {
    r.addEventListener('change', () => {
      modo = r.value;
      atualizarSom();
      if (modo === 'programa' && !programaPid) $('#programa').focus();
    });
  }
  $('#programa').addEventListener('change', (e) => {
    programaPid = Number(e.target.value) || null;
    atualizarSom();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return window.seletor.escolher(null);
    if (e.key !== 'Enter') return;
    const card = e.target.closest?.('.fonte');
    if (card) { // Enter num cartão: escolhe e já compartilha
      e.preventDefault();
      card.click();
      compartilhar();
    }
  });

  window.seletor.aoReceber((d) => {
    fontes = Array.isArray(d?.fontes) ? d.fontes : [];
    dados = {
      comSom: !!d?.comSom,
      programas: Array.isArray(d?.programas) ? d.programas : null,
      janelas: d?.janelas && typeof d.janelas === 'object' ? d.janelas : {},
      preferencia: d?.preferencia || null,
    };
    if (!fontes.some((f) => f.tipo === 'janela')) aba = 'tela';
    // começa como da última vez
    const pref = dados.preferencia;
    modo = ['janela', 'programa', 'sistema', 'nenhum'].includes(pref?.modo) ? pref.modo : 'janela';
    if (!dados.programas && (modo === 'janela' || modo === 'programa')) modo = 'sistema';
    if (pref?.exe && dados.programas) {
      programaPid = dados.programas.find((p) => p.exe.toLowerCase() === String(pref.exe).toLowerCase())?.pid || null;
    }
    $('#som').hidden = !dados.comSom;
    montarProgramas();
    render();
  });
})();
