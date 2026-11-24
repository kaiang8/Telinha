'use strict';
// Testes das regras de segurança. Rodam no GitHub antes de gerar o instalador: node teste-regras.js
const assert = require('node:assert/strict');
const R = require('./regras');

const SITE = 'https://telas-e-bocas.onrender.com';
const PASTA_WIN = 'C:\\Users\\Ana\\AppData\\Local\\Programs\\caras-e-telas\\resources\\app.asar\\telas';
const PASTA_LINUX = '/opt/caras/resources/app.asar/telas';
let n = 0;
const t = (nome, fn) => { fn(); n++; console.log(`ok  ${nome}`); };

t('site precisa ser https', () => {
  assert.equal(R.siteValido(SITE), true);
  assert.equal(R.siteValido('http://telas-e-bocas.onrender.com'), false);
  assert.equal(R.siteValido('http://localhost:3000'), false);
  assert.equal(R.siteValido('http://localhost:3000', true), true);
  assert.equal(R.siteValido('http://evil.com', true), false);
  assert.equal(R.siteValido('https://user:senha@site.com'), false);
  assert.equal(R.siteValido('javascript:alert(1)'), false);
});

t('navegação só dentro do site', () => {
  assert.equal(R.podeNavegar(`${SITE}/`, SITE), true);
  assert.equal(R.podeNavegar(`${SITE}/?convite=1#x`, SITE), true);
  assert.equal(R.podeNavegar('https://telas-e-bocas.onrender.com.evil.com/', SITE), false);
  assert.equal(R.podeNavegar('https://evil.com/?https://telas-e-bocas.onrender.com', SITE), false);
  assert.equal(R.podeNavegar('http://telas-e-bocas.onrender.com/', SITE), false);
  assert.equal(R.podeNavegar('file:///C:/Windows/system32/', SITE), false);
  assert.equal(R.podeNavegar('lixo', SITE), false);
});

t('links de fora: só http e https', () => {
  assert.equal(R.podeAbrirFora('https://youtube.com/watch?v=1'), true);
  assert.equal(R.podeAbrirFora('http://exemplo.com'), true);
  for (const ruim of ['file:///C:/Windows/System32/calc.exe', 'ms-settings:', 'javascript:alert(1)', 'smb://servidor/x', 'search-ms:query=x', 'C:\\Windows\\calc.exe', 'https://a:b@x.com']) {
    assert.equal(R.podeAbrirFora(ruim), false, ruim);
  }
});

t('lista de endereços liberados', () => {
  const ok = (u, p = PASTA_LINUX) => R.requisicaoPermitida(u, SITE, p);
  assert.equal(ok(`${SITE}/app.js`), true);
  assert.equal(ok(`${SITE}/api/events?token=x`), true);
  assert.equal(ok('wss://telas-e-bocas.onrender.com/x'), true);
  assert.equal(ok('ws://telas-e-bocas.onrender.com/x'), false);
  assert.equal(ok('https://fonts.googleapis.com/css2?family=Figtree'), true);
  assert.equal(ok('https://fonts.gstatic.com/s/figtree/v1/a.woff2'), true);
  assert.equal(ok('http://fonts.gstatic.com/a.woff2'), false);
  assert.equal(ok('https://evil.com/x.js'), false);
  assert.equal(ok('https://fonts.gstatic.com.evil.com/x'), false);
  assert.equal(ok('data:image/png;base64,AAAA'), true);
  assert.equal(ok('blob:https://telas-e-bocas.onrender.com/123'), true);
  assert.equal(ok('file:///opt/caras/resources/app.asar/telas/seletor.html'), true);
  assert.equal(ok('file:///opt/caras/resources/app.asar/telas/../main.js'), false);
  assert.equal(ok('file:///opt/caras/resources/app.asar/telas/%2e%2e/main.js'), false);
  assert.equal(ok('file:///etc/passwd'), false);
  assert.equal(ok('file:///opt/caras/resources/app.asar/telasX/a.html'), false);
  assert.equal(ok('file:///opt/caras/resources/app.asar/telas/a.html', null), false);
  assert.equal(ok('chrome://settings'), false);
});

t('lista de endereços no Windows', () => {
  const plataforma = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { value: 'win32' });
  try {
    const ok = (u) => R.requisicaoPermitida(u, SITE, PASTA_WIN);
    assert.equal(ok('file:///C:/Users/Ana/AppData/Local/Programs/caras-e-telas/resources/app.asar/telas/carregando.html'), true);
    assert.equal(ok('file:///c:/users/ana/appdata/local/programs/caras-e-telas/resources/app.asar/telas/logo.svg'), true);
    assert.equal(ok('file:///C:/Users/Ana/Documents/segredo.txt'), false);
    assert.equal(ok('file:///C:/Users/Ana/AppData/Local/Programs/caras-e-telas/resources/app.asar/telas/..%5C..%5Cmain.js'), false);
  } finally {
    Object.defineProperty(process, 'platform', plataforma);
  }
});

t('atalhos globais: conversão de teclas', () => {
  assert.equal(R.aceleradorDe({ code: 'Digit1', alt: true }), 'Alt+1');
  assert.equal(R.aceleradorDe({ code: 'KeyK', ctrl: true, shift: true }), 'Control+Shift+K');
  assert.equal(R.aceleradorDe({ code: 'Numpad7', ctrl: true, alt: true }), 'Control+Alt+num7');
  assert.equal(R.aceleradorDe({ code: 'F8' }), 'F8');
  assert.equal(R.aceleradorDe({ code: 'F13', shift: true }), 'Shift+F13');
  assert.equal(R.aceleradorDe({ code: 'ArrowUp', alt: true }), 'Alt+Up');
  assert.equal(R.aceleradorDe({ code: 'NumpadAdd', alt: true }), 'Alt+numadd');
});

t('atalhos globais: o que fica só dentro do programa', () => {
  assert.equal(R.aceleradorDe({ code: 'KeyA' }), null); // atrapalharia a digitação em todo o Windows
  assert.equal(R.aceleradorDe({ code: 'KeyA', shift: true }), null);
  assert.equal(R.aceleradorDe({ code: 'Digit1', meta: true }), null);
  assert.equal(R.aceleradorDe({ code: 'Semicolon', alt: true }), null); // muda de lugar conforme o teclado
  assert.equal(R.aceleradorDe({ code: 'F25' }), null);
  assert.equal(R.aceleradorDe({ code: 'Digit1+Alt', alt: true }), null);
  assert.equal(R.aceleradorDe(null), null);
});

t('atalhos globais: lista vinda da página', () => {
  const v = R.validarAtalhos([
    { id: 'p-trombone', code: 'Digit1', alt: true },
    { id: 'p-risada', code: 'Digit1', alt: true }, // repetido
    { id: 'c-123', code: 'KeyQ' }, // sem modificador
    { id: '../x', code: 'Digit2', alt: true }, // id estranho
    { id: 'parar', code: 'Digit0', alt: 'sim' }, // alt não booleano
    { id: 'parar', code: 'Digit0', alt: true },
    'lixo',
  ]);
  assert.deepEqual(v, [{ id: 'p-trombone', acc: 'Alt+1' }, { id: 'parar', acc: 'Alt+0' }]);
  assert.deepEqual(R.validarAtalhos('x'), []);
  assert.equal(R.validarAtalhos(Array.from({ length: 500 }, (_, i) => ({ id: `c-${i}`, code: `F${(i % 24) + 1}` }))).length, 24);
});

t('tema das telas do programa: só cores puras', () => {
  const v = R.validarTema({
    escuro: true,
    vars: {
      '--p2': 'hsl(205.1, 77%, 49.4%)',
      '--ceu': '#0b1626',
      '--realce': 'rgba(255, 255, 255, .14)',
      '--pop-1': 'hsla(205, 40%, 16%, 0.97)',
      '--p1': 'red; } body { background: url(https://evil.com/x) } :root {',
      '--p3': 'url(https://evil.com)',
      '--texto': 'expression(alert(1))',
      '--nao-existe': '#fff',
      'color': '#000',
      '--suave': 'hsl(1, 2%, 3%) !important',
    },
  });
  assert.deepEqual(v, { escuro: true, vars: { '--p2': 'hsl(205.1, 77%, 49.4%)', '--ceu': '#0b1626', '--realce': 'rgba(255, 255, 255, .14)', '--pop-1': 'hsla(205, 40%, 16%, 0.97)' } });
  const css = R.cssDoTema({ escuro: false, vars: { '--p2': '#1d93df', '--p1': '#fff;}*{display:none' } });
  assert.equal(css, 'html:root { --p2: #1d93df; color-scheme: light; }');
  assert.equal(R.cssDoTema(null), '');
  assert.equal(R.validarTema('x'), null);
});

t('apertar-para-falar: só uma tecla conhecida, com argumentos seguros', () => {
  assert.deepEqual(R.teclaDoPtt({ code: 'KeyV' }), { scan: 0x2f, ctrl: false, alt: false, shift: false });
  assert.deepEqual(R.argumentosDoPtt(R.teclaDoPtt({ code: 'KeyV', ctrl: true })), ['--segurar', '--scan', '47', '--ctrl']);
  assert.deepEqual(R.argumentosDoPtt(R.teclaDoPtt({ code: 'F13' })), ['--segurar', '--vk', '124']);
  assert.deepEqual(R.argumentosDoPtt(R.teclaDoPtt({ code: 'MouseForward', shift: true })), ['--segurar', '--vk', '6']);
  assert.deepEqual(R.argumentosDoPtt(R.teclaDoPtt({ code: 'ControlLeft', ctrl: true, alt: 1 })), ['--segurar', '--vk', '162']);
  assert.deepEqual(R.teclaDoPtt({ code: 'Numpad0' }), { vk: 0x60, ctrl: false, alt: false, shift: false });
  assert.deepEqual(R.teclaDoPtt({ code: 'IntlRo', alt: true }), { scan: 0x73, ctrl: false, alt: true, shift: false });
  for (const ruim of [null, 'KeyV', {}, { code: 'MetaLeft' }, { code: 'Escape' }, { code: '__proto__' }, { code: 'toString' }, { code: 'KeyV --capturar 4' }, { code: 7 }]) {
    assert.equal(R.teclaDoPtt(ruim), null, JSON.stringify(ruim));
  }
});

t('caneta: só traços bem formados chegam à camada por cima da tela', () => {
  const ok = R.validarTraco({ tr: 'ab12cd', c: 2, p: [[0.1, 0.2], [1.4, -3]], fim: true, nome: 'Beto\u0007<b>', extra: 1 });
  assert.deepEqual(ok, { tr: 'ab12cd', c: 2, p: [[0.1, 0.2], [1, 0]], fim: true, nome: 'Beto<b>' });
  for (const ruim of [null, 'x', { tr: 'AB12', c: 0, p: [[0, 0]] }, { tr: 'ab12', c: 5, p: [[0, 0]] }, { tr: 'ab12', c: 0, p: [] },
    { tr: 'ab12', c: 0, p: Array.from({ length: 65 }, () => [0, 0]) }, { tr: 'ab12', c: 0, p: [[0, NaN]] }, { tr: 'ab12', c: 0, p: [['1', 0]] },
    { tr: 'ab12', c: 1.5, p: [[0, 0]] }, { tr: '../x', c: 0, p: [[0, 0]] }]) {
    assert.equal(R.validarTraco(ruim), null, JSON.stringify(ruim));
  }
  assert.deepEqual(R.fonteDaCaneta({ id: 'screen:1:0', display_id: '2528732444' }), { tipo: 'tela', displayId: '2528732444' });
  assert.deepEqual(R.fonteDaCaneta({ id: 'window:132456:0' }), { tipo: 'janela', hwnd: 132456 });
  assert.equal(R.fonteDaCaneta({ id: 'window:0:0' }), null);
  assert.equal(R.fonteDaCaneta({ id: 'window:99999999999:0' }), null);
  assert.equal(R.fonteDaCaneta({ id: 'web-contents-media-stream:1' }), null);
});

console.log(`\n${n} grupos de testes passaram.`);
