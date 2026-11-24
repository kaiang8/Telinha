// Som de um programa só (programa para Windows). Recebe PCM 16 bits estéreo por um
// MessagePort e toca dentro do Web Audio, com um estoque pequeno para não picotar.
class SomDoPrograma extends AudioWorkletProcessor {
  constructor() {
    super();
    this.fila = [];
    this.lidos = 0;
    this.total = 0;
    this.tocando = false;
    this.port.onmessage = (e) => {
      const porta = e.data && e.data.porta;
      if (porta) porta.onmessage = (m) => this.receber(m.data);
    };
  }

  receber(d) {
    let bytes = null;
    if (d instanceof Uint8Array) bytes = d;
    else if (d instanceof ArrayBuffer) bytes = new Uint8Array(d);
    if (!bytes) return;
    const n = bytes.byteLength >> 2;
    if (!n) return;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, n * 4);
    const esq = new Float32Array(n);
    const dir = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      esq[i] = dv.getInt16(i * 4, true) / 32768;
      dir[i] = dv.getInt16(i * 4 + 2, true) / 32768;
    }
    this.fila.push([esq, dir]);
    this.total += n;
    // no máximo ~150 ms de atraso: se acumular, joga fora o mais antigo
    const max = sampleRate * 0.15;
    while (this.total > max && this.fila.length > 1) {
      this.total -= this.fila[0][0].length - this.lidos;
      this.fila.shift();
      this.lidos = 0;
    }
    if (!this.tocando && this.total >= sampleRate * 0.04) this.tocando = true;
  }

  process(_entradas, saidas) {
    const saida = saidas[0];
    const esq = saida[0];
    const dir = saida[1];
    if (!esq) return true;
    let i = 0;
    if (this.tocando) {
      while (i < esq.length && this.fila.length) {
        const [a, b] = this.fila[0];
        const k = Math.min(esq.length - i, a.length - this.lidos);
        esq.set(a.subarray(this.lidos, this.lidos + k), i);
        if (dir) dir.set(b.subarray(this.lidos, this.lidos + k), i);
        i += k;
        this.lidos += k;
        this.total -= k;
        if (this.lidos >= a.length) {
          this.fila.shift();
          this.lidos = 0;
        }
      }
      if (i < esq.length) this.tocando = false; // acabou o estoque: espera juntar de novo
    }
    for (; i < esq.length; i++) {
      esq[i] = 0;
      if (dir) dir[i] = 0;
    }
    return true;
  }
}

registerProcessor('som-do-programa', SomDoPrograma);
