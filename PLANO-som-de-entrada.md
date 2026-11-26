# Som de entrada personalizado (plano para continuar)

Pedido do Allan (26/11): cada pessoa pode escolher o som que toca quando **ela entra numa sala**.
É opcional: sem som escolhido, toca o padrão (`entradaSaida(true)` em `public/app.js`).
O som de **sair** continua o padrão para todos. Duração máxima de **5 s**; o arquivo pode ser
**.mp3**; se tiver mais de 5 s, a pessoa escolhe qual trecho de 5 s usar.

Estado: **nada implementado ainda**. Este ramo (`som-de-entrada`) só tem este plano.
Publicar só depois de testar (o ramo `main` é o que o Render publica).

## Decisões

- **Recorte no navegador.** `decodeAudioData` lê o mp3. Um controle deslizante escolhe o começo do
  trecho (0 até duração − 5 s), com botão "Ouvir trecho". O trecho é regravado em
  **Opus** com `MediaRecorder`: toca o AudioBuffer numa `MediaStreamDestination` e grava
  `audio/webm;codecs=opus` a 64 kbps. Isso dá uns 40 KB e leva 5 s ("Preparando o som…").
  Assim não se guarda o mp3 inteiro, que pode ter MBs. Electron/Chrome suportam isso.
- **Guardar fora do bloco principal.** No Upstash, uma chave por pessoa:
  `${CHAVE_UPSTASH}:som:<pid>`, com o valor `{tipo, b64, v}`. Em modo arquivo, um JSON separado
  ao lado do DATA_FILE (como os `-mensagens.json`). Limite de 120 KB por som (depois do base64),
  e aceitar só `audio/webm` ou `audio/ogg`.
- **Versão no perfil público.** `perfilPublico(id)` (server.js) ganha `som: v` (timestamp) quando a
  pessoa tem som. O cliente toca `/som-entrada/<pid>?v=<v>`, e o servidor responde com
  `Cache-Control: public, max-age=31536000, immutable`. Trocar o som muda o `v`, e quem usa a
  versão nova não pega a antiga do cache. Mudar o som faz `avisarPerfil(pid)`.
- **Tocar.** Em `public/app.js` há dois `blip('join')`: ~linha 630, quando alguém entra na sua sala,
  e ~linha 1973, quando você entra. Trocar por `somDeEntrada(pid)`: se `S.perfis[pid]?.som`, criar
  `new Audio('/som-entrada/'+pid+'?v='+som)`, com volume do soundboard (`SB.volume`, respeitando
  "ouvir sons"), cortar com `setTimeout(pause, 5000)` e, se der erro ao tocar, cair no
  `blip('join')`. Se várias pessoas entrarem juntas, tocar só um som.
- **Moderação.** Admin pode tirar o som de alguém: no menu da lista de membros
  (`desenharMenuMembro` em app.js), item "Tirar som de entrada", com a ação de admin
  `perfil-tirar-som`. Limite de troca: 5 por 10 min por pessoa (`limiteDe`).

## Passos

1. **server.js**
   - Funções `lerSomEntrada(pid)` e `gravarSomEntrada(pid, valor|null)`, nos modos Upstash
     (`upstash(['GET'|'SET'|'DEL', chave])`) e arquivo. Cache em memória de `pid → {tipo, buf, v}`.
   - Na rota `/api/` (~linha 2484): `som-entrada` com `{audio: dataURL}` para salvar, ou
     `{remover: true}` para tirar. Validar tipo e tamanho, gravar
     `data.perfis[pid].som = Date.now()`, chamar `salvar()` e `avisarPerfil(pid)`.
   - GET `/som-entrada/<pid>` (antes dos arquivos estáticos): devolve os bytes, com o
     Content-Type certo e cache longo.
   - `perfilPublico`: incluir `som` quando houver.
   - Admin: `perfil-tirar-som`.
2. **public/app.js**
   - Em `abrirPerfil()` (~linha 5577, o modal "Seu nome e cor"), uma seção "Som ao entrar na sala":
     escolher arquivo (`accept="audio/mpeg,.mp3"`), o controle de trecho quando passar de 5 s,
     "Ouvir trecho", "Usar este som", "Voltar ao padrão".
   - `somDeEntrada(pid)` nos dois lugares do `blip('join')`.
   - `onPerfil` já junta os campos; conferir que `som` chega.
3. **style.css**: estilo da seção (reaproveitar `.mm-input` e `.btn`).
4. **Teste** (Playwright, como os `tests/e2e_*.py`): um arquivo de 12 s gerado com ffmpeg ou
   OfflineAudioContext. Escolher o trecho, salvar e conferir que o outro usuário toca
   `/som-entrada/...` ao entrar. Testar também um som com mais de 120 KB (recusado), "voltar ao
   padrão" e admin tirando o som. Fazer nos modos Upstash (fake-upstash.js) e arquivo.
5. **LEIA-ME**: uma dica em "DICAS".
6. Juntar na `main` e publicar. A conferência "Site no ar" confirma que entrou no ar.
