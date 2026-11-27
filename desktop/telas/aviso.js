'use strict';
// Janelinha de avisos: empilha até 3 cartões; cada um fica 6 s e some.
const pilha = document.getElementById('pilha');
const MAX = 3;

function tirar(c) {
  if (c.dataset.saindo) return;
  c.dataset.saindo = '1';
  c.classList.add('saindo');
  setTimeout(() => c.remove(), 380);
}

function mostrar(av) {
  const c = document.createElement('div');
  c.className = 'cartao';
  c.style.setProperty('--cor', av.cor);
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = (Array.from(av.nome)[0] || '?').toUpperCase();
  const linhas = document.createElement('div');
  linhas.className = 'linhas';
  const nome = document.createElement('div');
  nome.className = 'nome';
  nome.textContent = av.nome;
  const texto = document.createElement('div');
  texto.className = 'texto';
  texto.textContent = av.texto;
  const marca = document.createElement('div');
  marca.className = 'marca';
  marca.textContent = 'Caras E Telas';
  linhas.append(nome, texto, marca);
  c.append(avatar, linhas);
  pilha.append(c);
  const vivos = [...pilha.children].filter((x) => !x.dataset.saindo);
  for (const velho of vivos.slice(0, Math.max(0, vivos.length - MAX))) tirar(velho);
  setTimeout(() => tirar(c), 6000);
}

window.avisos.aoReceber((av) => {
  if (av && typeof av.nome === 'string') mostrar(av);
});
