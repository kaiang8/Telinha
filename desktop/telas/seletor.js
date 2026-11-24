'use strict';
// Seletor de tela do programa. Os nomes das janelas vêm de outros programas, então
// tudo é montado com textContent (nunca innerHTML).
(() => {
  const $ = (s) => document.querySelector(s);
  let fontes = [];
  let aba = 'janela';
  let escolhido = null;

  function nomeDe(f, i, telas) {
    if (f.tipo !== 'tela') return f.nome || 'Janela sem nome';
    return telas.length === 1 ? 'Tela inteira' : `Tela ${i + 1}`;
  }

  function cartao(f, nome) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fonte';
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
    $('#compartilhar').disabled = !escolhido;
  }

  function escolher(id) {
    escolhido = id;
    for (const b of document.querySelectorAll('.fonte')) b.setAttribute('aria-pressed', 'false');
    render();
    const atual = [...document.querySelectorAll('.fonte')].find((b) => b.getAttribute('aria-pressed') === 'true');
    atual?.focus();
  }

  function compartilhar() {
    if (escolhido) window.seletor.escolher(escolhido);
  }

  $('#abaJanela').addEventListener('click', () => { aba = 'janela'; render(); });
  $('#abaTela').addEventListener('click', () => { aba = 'tela'; render(); });
  $('#cancelar').addEventListener('click', () => window.seletor.escolher(null));
  $('#compartilhar').addEventListener('click', compartilhar);
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

  window.seletor.aoReceber((dados) => {
    fontes = Array.isArray(dados?.fontes) ? dados.fontes : [];
    if (!fontes.some((f) => f.tipo === 'janela')) aba = 'tela';
    $('#somAviso').textContent = dados?.comSom
      ? 'O som do computador vai junto, menos o que toca no Caras E Telas: as outras transmissões não voltam para ninguém.'
      : 'Sem som: para mandar som, escolha "Som do computador" em Ajustes.';
    render();
  });
})();
