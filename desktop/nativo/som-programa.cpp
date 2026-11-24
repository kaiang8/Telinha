// som-programa.exe — ajudante do Caras E Telas para Windows.
//
// O Electron só sabe capturar o som do computador inteiro. Este ajudante usa o recurso
// do Windows (o mesmo que o Chrome usa) para pegar o som de UM programa só, para que a
// voz do Discord ou de outras chamadas não volte para ninguém.
//
//   som-programa.exe --versao
//   som-programa.exe --listar [--ignorar PID]
//       JSON no stdout: programas que tocam som ou têm janela, e de qual programa é cada janela
//   som-programa.exe --capturar PID --taxa 48000
//       Som do programa (e dos processos filhos dele) em PCM 16 bits estéreo no stdout.
//       A 1ª linha do stderr diz se deu certo: {"ok":true} ou {"erro":"...","hr":"0x..."}.
//       Para quando o stdin fecha (o programa principal fechou) ou quando não consegue escrever.
//
// Não abre rede, não grava arquivos e não precisa de administrador.

#include <windows.h>
#include <tlhelp32.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <audiopolicy.h>
#include <audioclientactivationparams.h>
#include <dwmapi.h>
#include <io.h>
#include <fcntl.h>
#include <cstdio>
#include <cstdint>
#include <cwctype>
#include <cwchar>
#include <iterator>
#include <map>
#include <set>
#include <string>
#include <vector>

static const char* VERSAO = "1";

// ---------------------------------------------------------------- texto e JSON
static std::string utf8(const std::wstring& w) {
  if (w.empty()) return {};
  int n = WideCharToMultiByte(CP_UTF8, 0, w.data(), (int)w.size(), nullptr, 0, nullptr, nullptr);
  std::string s(n, '\0');
  WideCharToMultiByte(CP_UTF8, 0, w.data(), (int)w.size(), &s[0], n, nullptr, nullptr);
  return s;
}

static std::string jsonTexto(const std::wstring& w) {
  std::string s = utf8(w), o = "\"";
  for (unsigned char c : s) {
    if (c == '"' || c == '\\') { o += '\\'; o += (char)c; }
    else if (c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", c); o += b; }
    else o += (char)c;
  }
  return o + "\"";
}

static std::wstring minusculas(std::wstring s) {
  if (!s.empty()) CharLowerBuffW(&s[0], (DWORD)s.size());
  return s;
}

// ---------------------------------------------------------------- processos
struct Proc { DWORD pai = 0; std::wstring exe; };
using Processos = std::map<DWORD, Proc>;

static Processos listarProcessos() {
  Processos m;
  HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (snap == INVALID_HANDLE_VALUE) return m;
  PROCESSENTRY32W pe = {};
  pe.dwSize = sizeof(pe);
  if (Process32FirstW(snap, &pe)) {
    do { m[pe.th32ProcessID] = Proc{ pe.th32ParentProcessID, pe.szExeFile }; } while (Process32NextW(snap, &pe));
  }
  CloseHandle(snap);
  return m;
}

// Sobe na árvore enquanto o pai for o mesmo programa (o Chrome, por exemplo, tem vários
// processos chrome.exe; capturando o de cima, o som de todos os de baixo vem junto).
static DWORD raiz(DWORD pid, const Processos& ps) {
  auto it = ps.find(pid);
  if (it == ps.end()) return pid;
  const std::wstring exe = minusculas(it->second.exe);
  std::set<DWORD> vistos;
  DWORD atual = pid;
  while (vistos.insert(atual).second) {
    auto a = ps.find(atual);
    if (a == ps.end()) break;
    auto p = ps.find(a->second.pai);
    if (p == ps.end() || p->first == 0 || minusculas(p->second.exe) != exe) break;
    atual = p->first;
  }
  return atual;
}

static bool descendeDe(DWORD pid, DWORD ancestral, const Processos& ps) {
  std::set<DWORD> vistos;
  DWORD atual = pid;
  while (atual && vistos.insert(atual).second) {
    if (atual == ancestral) return true;
    auto a = ps.find(atual);
    if (a == ps.end()) return false;
    atual = a->second.pai;
  }
  return false;
}

static std::wstring caminhoDo(DWORD pid) {
  std::wstring r;
  HANDLE h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
  if (!h) return r;
  wchar_t buf[1024];
  DWORD n = (DWORD)std::size(buf);
  if (QueryFullProcessImageNameW(h, 0, buf, &n)) r.assign(buf, n);
  CloseHandle(h);
  return r;
}

// Nome amigável ("VLC media player" em vez de "vlc.exe"), tirado das informações do arquivo
static std::wstring descricao(const std::wstring& caminho) {
  if (caminho.empty()) return {};
  DWORD lixo = 0;
  DWORD n = GetFileVersionInfoSizeW(caminho.c_str(), &lixo);
  if (!n) return {};
  std::vector<BYTE> dados(n);
  if (!GetFileVersionInfoW(caminho.c_str(), 0, n, dados.data())) return {};
  struct Ling { WORD lingua; WORD pagina; };
  Ling* ling = nullptr;
  UINT tam = 0;
  if (!VerQueryValueW(dados.data(), L"\\VarFileInfo\\Translation", (void**)&ling, &tam) || !ling || tam < sizeof(Ling)) return {};
  wchar_t chave[96];
  swprintf(chave, 96, L"\\StringFileInfo\\%04x%04x\\FileDescription", ling[0].lingua, ling[0].pagina);
  wchar_t* txt = nullptr;
  UINT len = 0;
  if (!VerQueryValueW(dados.data(), chave, (void**)&txt, &len) || !txt || len <= 1) return {};
  std::wstring s(txt);
  while (!s.empty() && iswspace(s.back())) s.pop_back();
  while (!s.empty() && iswspace(s.front())) s.erase(s.begin());
  return s.size() > 80 ? s.substr(0, 80) : s;
}

// ---------------------------------------------------------------- quem está tocando som
// pid -> está tocando agora?
static std::map<DWORD, bool> sessoesDeSom() {
  std::map<DWORD, bool> r;
  IMMDeviceEnumerator* en = nullptr;
  if (FAILED(CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL, IID_PPV_ARGS(&en)))) return r;
  IMMDeviceCollection* col = nullptr;
  if (SUCCEEDED(en->EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE, &col))) {
    UINT n = 0;
    col->GetCount(&n);
    for (UINT i = 0; i < n; i++) {
      IMMDevice* dev = nullptr;
      if (FAILED(col->Item(i, &dev))) continue;
      IAudioSessionManager2* mgr = nullptr;
      if (SUCCEEDED(dev->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, nullptr, (void**)&mgr))) {
        IAudioSessionEnumerator* se = nullptr;
        if (SUCCEEDED(mgr->GetSessionEnumerator(&se))) {
          int c = 0;
          se->GetCount(&c);
          for (int k = 0; k < c; k++) {
            IAudioSessionControl* ctl = nullptr;
            if (FAILED(se->GetSession(k, &ctl))) continue;
            IAudioSessionControl2* ctl2 = nullptr;
            if (SUCCEEDED(ctl->QueryInterface(IID_PPV_ARGS(&ctl2)))) {
              DWORD pid = 0;
              AudioSessionState st = AudioSessionStateInactive;
              if (ctl2->IsSystemSoundsSession() != S_OK && ctl2->GetProcessId(&pid) == S_OK && pid &&
                  SUCCEEDED(ctl2->GetState(&st)) && st != AudioSessionStateExpired) {
                bool& tocando = r[pid];
                tocando = tocando || st == AudioSessionStateActive;
              }
              ctl2->Release();
            }
            ctl->Release();
          }
          se->Release();
        }
        mgr->Release();
      }
      dev->Release();
    }
    col->Release();
  }
  en->Release();
  return r;
}

// ---------------------------------------------------------------- janelas
struct BuscaFilha { DWORD host; DWORD achado; };
static BOOL CALLBACK acharFilha(HWND f, LPARAM lp) {
  auto* b = reinterpret_cast<BuscaFilha*>(lp);
  DWORD p = 0;
  GetWindowThreadProcessId(f, &p);
  if (p && p != b->host) { b->achado = p; return FALSE; }
  return TRUE;
}

// Apps da Microsoft Store abrem a janela por outro processo (ApplicationFrameHost):
// procura o processo de verdade dentro dela.
static DWORD pidDaJanela(HWND h, const Processos& ps) {
  DWORD pid = 0;
  GetWindowThreadProcessId(h, &pid);
  auto it = ps.find(pid);
  if (it != ps.end() && minusculas(it->second.exe) == L"applicationframehost.exe") {
    BuscaFilha b{ pid, 0 };
    EnumChildWindows(h, acharFilha, (LPARAM)&b);
    if (b.achado) pid = b.achado;
  }
  return pid;
}

static bool janelaDeVerdade(HWND h) {
  if (!IsWindowVisible(h) || GetWindow(h, GW_OWNER) || GetWindowTextLengthW(h) == 0) return false;
  if (GetWindowLongPtrW(h, GWL_EXSTYLE) & WS_EX_TOOLWINDOW) return false;
  DWORD oculta = 0;
  if (SUCCEEDED(DwmGetWindowAttribute(h, DWMWA_CLOAKED, &oculta, sizeof oculta)) && oculta) return false;
  return true;
}

static BOOL CALLBACK juntarJanela(HWND h, LPARAM lp) {
  reinterpret_cast<std::vector<HWND>*>(lp)->push_back(h);
  return TRUE;
}

// ---------------------------------------------------------------- --listar
static int listar(DWORD ignorar) {
  Processos ps = listarProcessos();
  std::map<DWORD, bool> sessoes = sessoesDeSom();
  std::vector<HWND> todas;
  EnumWindows(juntarJanela, (LPARAM)&todas);

  struct Grupo { bool som = false; bool tocando = false; int janelas = 0; };
  std::map<DWORD, Grupo> grupos;
  std::map<uint64_t, DWORD> donoDaJanela;
  for (HWND h : todas) {
    DWORD r = raiz(pidDaJanela(h, ps), ps);
    donoDaJanela[(uint64_t)(uintptr_t)h] = r;
    if (janelaDeVerdade(h)) grupos[r].janelas++;
  }
  for (const auto& s : sessoes) {
    Grupo& g = grupos[raiz(s.first, ps)];
    g.som = true;
    g.tocando = g.tocando || s.second;
  }

  static const wchar_t* DO_SISTEMA[] = {
    L"audiodg.exe", L"explorer.exe", L"textinputhost.exe", L"shellexperiencehost.exe", L"searchhost.exe",
    L"startmenuexperiencehost.exe", L"applicationframehost.exe", L"lockapp.exe", L"svchost.exe", L"dwm.exe",
    L"systemsettings.exe", L"widgets.exe", L"searchapp.exe", L"runtimebroker.exe",
  };
  const DWORD eu = GetCurrentProcessId();
  std::string saida = "{\"versao\":";
  saida += VERSAO;
  saida += ",\"processos\":[";
  bool primeiro = true;
  for (const auto& gr : grupos) {
    const DWORD pid = gr.first;
    const Grupo& g = gr.second;
    if (pid <= 4 || pid == eu || (ignorar && descendeDe(pid, ignorar, ps))) continue;
    if (!g.som && !g.janelas) continue;
    auto it = ps.find(pid);
    if (it == ps.end()) continue;
    const std::wstring exe = it->second.exe;
    const std::wstring baixo = minusculas(exe);
    bool doSistema = false;
    for (const wchar_t* x : DO_SISTEMA) if (baixo == x) doSistema = true;
    if (doSistema) continue;
    std::wstring nome = descricao(caminhoDo(pid));
    if (nome.empty()) {
      nome = exe;
      if (nome.size() > 4 && minusculas(nome.substr(nome.size() - 4)) == L".exe") nome.resize(nome.size() - 4);
    }
    if (!primeiro) saida += ",";
    primeiro = false;
    char num[64];
    snprintf(num, sizeof num, "{\"pid\":%lu,", (unsigned long)pid);
    saida += num;
    saida += "\"nome\":" + jsonTexto(nome) + ",\"exe\":" + jsonTexto(exe);
    snprintf(num, sizeof num, ",\"som\":%s,\"tocando\":%s,\"janelas\":%d}", g.som ? "true" : "false", g.tocando ? "true" : "false", g.janelas);
    saida += num;
  }
  saida += "],\"janelas\":{";
  primeiro = true;
  for (const auto& j : donoDaJanela) {
    if (!primeiro) saida += ",";
    primeiro = false;
    char num[64];
    snprintf(num, sizeof num, "\"%llu\":%lu", (unsigned long long)j.first, (unsigned long)j.second);
    saida += num;
  }
  saida += "}}\n";
  fwrite(saida.data(), 1, saida.size(), stdout);
  fflush(stdout);
  return 0;
}

// ---------------------------------------------------------------- --capturar
static volatile LONG g_parar = 0;

static void status(const std::string& json) {
  fprintf(stderr, "%s\n", json.c_str());
  fflush(stderr);
}

static int falhou(const char* etapa, HRESULT hr) {
  char b[160];
  snprintf(b, sizeof b, "{\"erro\":\"%s\",\"hr\":\"0x%08lx\"}", etapa, (unsigned long)hr);
  status(b);
  return 2;
}

// O Windows avisa por aqui quando a ativação termina. Precisa ser "ágil" (IAgileObject).
class Ativacao : public IActivateAudioInterfaceCompletionHandler, public IAgileObject {
  LONG refs = 1;
 public:
  HANDLE pronto = CreateEventW(nullptr, TRUE, FALSE, nullptr);
  HRESULT resultado = E_FAIL;
  IAudioClient* cliente = nullptr;

  STDMETHODIMP QueryInterface(REFIID riid, void** ppv) override {
    if (!ppv) return E_POINTER;
    if (riid == __uuidof(IUnknown) || riid == __uuidof(IActivateAudioInterfaceCompletionHandler)) {
      *ppv = static_cast<IActivateAudioInterfaceCompletionHandler*>(this);
    } else if (riid == __uuidof(IAgileObject)) {
      *ppv = static_cast<IAgileObject*>(this);
    } else {
      *ppv = nullptr;
      return E_NOINTERFACE;
    }
    AddRef();
    return S_OK;
  }
  STDMETHODIMP_(ULONG) AddRef() override { return (ULONG)InterlockedIncrement(&refs); }
  STDMETHODIMP_(ULONG) Release() override {
    LONG r = InterlockedDecrement(&refs);
    if (!r) delete this;
    return (ULONG)r;
  }
  STDMETHODIMP ActivateCompleted(IActivateAudioInterfaceAsyncOperation* op) override {
    HRESULT hrAtivacao = E_FAIL;
    IUnknown* obj = nullptr;
    HRESULT hr = op->GetActivateResult(&hrAtivacao, &obj);
    if (SUCCEEDED(hr) && SUCCEEDED(hrAtivacao) && obj) {
      resultado = obj->QueryInterface(IID_PPV_ARGS(&cliente));
    } else {
      resultado = FAILED(hr) ? hr : hrAtivacao;
    }
    if (obj) obj->Release();
    SetEvent(pronto);
    return S_OK;
  }
};

// Quando o programa principal fecha, o stdin fecha junto: hora de parar.
static DWORD WINAPI vigiarEntrada(void*) {
  char b[64];
  DWORD n = 0;
  HANDLE in = GetStdHandle(STD_INPUT_HANDLE);
  while (ReadFile(in, b, sizeof b, &n, nullptr) && n > 0) {}
  InterlockedExchange(&g_parar, 1);
  return 0;
}

static int capturar(DWORD pid, DWORD taxa) {
  AUDIOCLIENT_ACTIVATION_PARAMS ap = {};
  ap.ActivationType = AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK;
  ap.ProcessLoopbackParams.TargetProcessId = pid;
  ap.ProcessLoopbackParams.ProcessLoopbackMode = PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE;
  PROPVARIANT pv = {};
  pv.vt = VT_BLOB;
  pv.blob.cbSize = sizeof(ap);
  pv.blob.pBlobData = reinterpret_cast<BYTE*>(&ap);

  Ativacao* at = new Ativacao();
  IActivateAudioInterfaceAsyncOperation* op = nullptr;
  HRESULT hr = ActivateAudioInterfaceAsync(VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK, __uuidof(IAudioClient), &pv, at, &op);
  if (FAILED(hr)) return falhou("ativar", hr);
  if (WaitForSingleObject(at->pronto, 5000) != WAIT_OBJECT_0) return falhou("ativar-demorou", HRESULT_FROM_WIN32(WAIT_TIMEOUT));
  if (op) op->Release();
  IAudioClient* cli = at->cliente;
  if (FAILED(at->resultado) || !cli) return falhou("ativar-resultado", at->resultado);

  WAVEFORMATEX f = {};
  f.wFormatTag = WAVE_FORMAT_PCM;
  f.nChannels = 2;
  f.nSamplesPerSec = taxa;
  f.wBitsPerSample = 16;
  f.nBlockAlign = (WORD)(f.nChannels * f.wBitsPerSample / 8);
  f.nAvgBytesPerSec = f.nSamplesPerSec * f.nBlockAlign;
  const REFERENCE_TIME BUFFER = 500000; // 50 ms
  hr = cli->Initialize(AUDCLNT_SHAREMODE_SHARED,
                       AUDCLNT_STREAMFLAGS_LOOPBACK | AUDCLNT_STREAMFLAGS_EVENTCALLBACK |
                       AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM | AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY,
                       BUFFER, 0, &f, nullptr);
  if (FAILED(hr)) {
    hr = cli->Initialize(AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_LOOPBACK | AUDCLNT_STREAMFLAGS_EVENTCALLBACK,
                         BUFFER, 0, &f, nullptr);
  }
  if (FAILED(hr)) return falhou("iniciar", hr);

  HANDLE evento = CreateEventW(nullptr, FALSE, FALSE, nullptr);
  hr = cli->SetEventHandle(evento);
  if (FAILED(hr)) return falhou("evento", hr);
  IAudioCaptureClient* cap = nullptr;
  hr = cli->GetService(IID_PPV_ARGS(&cap));
  if (FAILED(hr) || !cap) return falhou("servico", hr);
  hr = cli->Start();
  if (FAILED(hr)) return falhou("comecar", hr);

  CreateThread(nullptr, 0, vigiarEntrada, nullptr, 0, nullptr);
  status("{\"ok\":true}");

  HANDLE out = GetStdHandle(STD_OUTPUT_HANDLE);
  std::vector<BYTE> silencio;
  while (!g_parar) {
    WaitForSingleObject(evento, 100);
    UINT32 n = 0;
    while (!g_parar && SUCCEEDED(cap->GetNextPacketSize(&n)) && n > 0) {
      BYTE* dados = nullptr;
      UINT32 quadros = 0;
      DWORD flags = 0;
      if (FAILED(cap->GetBuffer(&dados, &quadros, &flags, nullptr, nullptr))) break;
      DWORD bytes = quadros * f.nBlockAlign;
      const BYTE* origem = dados;
      if (flags & AUDCLNT_BUFFERFLAGS_SILENT) {
        silencio.assign(bytes, 0);
        origem = silencio.data();
      }
      DWORD escritos = 0;
      BOOL ok = bytes ? WriteFile(out, origem, bytes, &escritos, nullptr) : TRUE;
      cap->ReleaseBuffer(quadros);
      if (!ok) InterlockedExchange(&g_parar, 1); // o programa principal fechou
    }
  }
  cli->Stop();
  cap->Release();
  cli->Release();
  return 0;
}

// ---------------------------------------------------------------- início
static bool numero(const wchar_t* s, DWORD& v, bool zeroVale = false) {
  if (!s || !*s) return false;
  wchar_t* fim = nullptr;
  unsigned long x = wcstoul(s, &fim, 10);
  if (!fim || *fim || (x == 0 && !zeroVale) || x > 0xFFFFFFFFul) return false;
  v = (DWORD)x;
  return true;
}

int wmain(int argc, wchar_t** argv) {
  _setmode(_fileno(stdout), _O_BINARY);
  if (FAILED(CoInitializeEx(nullptr, COINIT_MULTITHREADED))) return 3;
  DWORD pid = 0, taxa = 48000, ignorar = 0;
  bool modoListar = false, modoCapturar = false;
  for (int i = 1; i < argc; i++) {
    std::wstring a = argv[i];
    const wchar_t* prox = i + 1 < argc ? argv[i + 1] : nullptr;
    if (a == L"--versao") { printf("%s\n", VERSAO); return 0; }
    else if (a == L"--listar") modoListar = true;
    else if (a == L"--ignorar" && numero(prox, ignorar, true)) i++; // 0 = não ignorar ninguém
    else if (a == L"--capturar" && numero(prox, pid)) { modoCapturar = true; i++; }
    else if (a == L"--taxa" && numero(prox, taxa)) i++;
    else { status("{\"erro\":\"argumento\"}"); return 1; }
  }
  if (taxa < 8000 || taxa > 192000) { status("{\"erro\":\"taxa\"}"); return 1; }
  if (modoListar) return listar(ignorar);
  if (modoCapturar) return capturar(pid, taxa);
  status("{\"erro\":\"use --listar ou --capturar\"}");
  return 1;
}
