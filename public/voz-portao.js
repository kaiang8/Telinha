// Porta de voz do Caras E Telas. Roda no processador de áudio do navegador (não atrasa
// nem com a janela em segundo plano) e decide quando o microfone "abre":
//   voz:  abre quando o nível passa do limiar (automático ou o que a pessoa escolheu)
//   ptt:  abre só enquanto o atalho de apertar-para-falar está apertado
//   mudo: sempre fechada
// No automático, o limiar acompanha o barulho de fundo de cada microfone.
class PortaoDeVoz extends AudioWorkletProcessor {
  constructor() {
    super();
    this.modo = 'mudo';
    this.manual = null; // limiar em dB escolhido pela pessoa (null = automático)
    this.ptt = false;
    this.nivel = -100;
    this.piso = -70;
    this.segura = 0;
    this.ganho = 0;
    this.conta = 0;
    this.aberto = false;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (typeof d.modo === 'string') this.modo = d.modo;
      if ('limiar' in d) this.manual = typeof d.limiar === 'number' ? d.limiar : null;
      if ('ptt' in d) this.ptt = !!d.ptt;
    };
  }

  process(entradas, saidas) {
    const ent = entradas[0] && entradas[0][0];
    const sai = saidas[0][0];
    const n = sai.length;
    const passo = n / sampleRate;

    let soma = 0;
    if (ent) for (let i = 0; i < ent.length; i++) soma += ent[i] * ent[i];
    const db = soma > 0 ? 10 * Math.log10(soma / ent.length) : -100;
    // nível: sobe na hora, desce devagar (o medidor não fica nervoso)
    this.nivel = db > this.nivel ? db : this.nivel + (db - this.nivel) * 0.08;
    // barulho de fundo: desce rápido até o silêncio, sobe devagar (uns 3 dB por segundo)
    if (db < this.piso) this.piso += (db - this.piso) * 0.3;
    else this.piso = Math.min(this.piso + 3 * passo, -20);
    const limiar = this.manual ?? Math.min(-30, Math.max(-58, this.piso + 15));

    // detecção de voz (calculada sempre, para o teste do microfone funcionar até no mudo)
    let voz = false;
    if (this.nivel > limiar) {
      voz = true;
      this.segura = 0.35; // segura aberto um pouco depois da última sílaba
    } else if (this.segura > 0) {
      this.segura -= passo;
      voz = true;
    }
    const abrir = this.modo === 'voz' ? voz : this.modo === 'ptt' ? this.ptt : false;
    this.aberto = abrir;

    // abre em ~1 ms e fecha suave em ~15 ms (sem estalos)
    const alvo = abrir ? 1 : 0;
    const coef = abrir ? 0.02 : 0.0015;
    let g = this.ganho;
    for (let i = 0; i < n; i++) {
      g += (alvo - g) * coef;
      sai[i] = ent ? ent[i] * g : 0;
    }
    this.ganho = g;

    if (++this.conta >= 16) { // ~20 vezes por segundo
      this.conta = 0;
      this.port.postMessage({ nivel: this.nivel, limiar, aberto: abrir, voz });
    }
    return true;
  }
}

registerProcessor('portao-de-voz', PortaoDeVoz);
