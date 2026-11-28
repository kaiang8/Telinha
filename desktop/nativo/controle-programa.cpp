// controle-programa.exe: o "jogador 2" da sala Jogatina.
// Recebe comandos do programa (uma linha por comando, pela entrada padrão) e aperta teclas, mexe o
// mouse e usa um controle de Xbox virtual (se o ViGEmBus estiver instalado), como se fosse alguém
// sentado no computador de quem transmite.
//
// Segurança (o programa já filtra antes, isto é a segunda barreira):
//  - teclado e mouse só valem quando a janela compartilhada está na frente (se for uma janela);
//  - quem transmite tem prioridade: mexeu no mouse de verdade, o mouse do jogador 2 espera;
//  - "solta" (e o fim do programa) solta tudo o que estava apertado.
//
// Comandos:
//   alvo janela <hwnd>            | alvo tela <esq> <topo> <dir> <baixo>   (pixels de verdade)
//   k <scancode> <estendida 0|1> <1 desce|0 sobe>
//   ma <x 0..65535> <y 0..65535>  (posição dentro do alvo)   | mr <dx> <dy>
//   mb <0 esq|1 dir|2 meio|3 x1|4 x2> <1|0>                   | mw <delta> <0 vertical|1 horizontal>
//   pad ligar | pad tirar         | p <botoes> <lt> <rt> <lx> <ly> <rx> <ry>
//   solta | sair
// Respostas: "pronto vigem=0|1", "pad ok", "pad erro", "prioridade", "erro <texto>".
#ifndef WINVER
#define WINVER 0x0A00
#define _WIN32_WINNT 0x0A00
#endif
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <dwmapi.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <set>
#include <cstdint>
#include <atomic>
#include <thread>
#include <mutex>
#ifdef COM_VIGEM
#include <ViGEm/Client.h>
#endif

static std::atomic<ULONGLONG> ultimoMouseDono{0};
static std::mutex trava;
static HWND alvoJanela = nullptr;
static RECT alvoTela{0, 0, 0, 0};
static std::set<unsigned> teclasApertadas; // scancode | (estendida << 8)
static std::set<int> botoesApertados;
static ULONGLONG ultimoAvisoPrioridade = 0;

static void diga(const char* t) {
  std::fputs(t, stdout);
  std::fputc('\n', stdout);
  std::fflush(stdout);
}

// ----- quem transmite mexeu no mouse de verdade? (não conta o que este programa injetou) -----
static LRESULT CALLBACK aoMouse(int n, WPARAM w, LPARAM l) {
  if (n == HC_ACTION) {
    const MSLLHOOKSTRUCT* m = reinterpret_cast<const MSLLHOOKSTRUCT*>(l);
    if (!(m->flags & (LLMHF_INJECTED | LLMHF_LOWER_IL_INJECTED))) ultimoMouseDono = GetTickCount64();
  }
  return CallNextHookEx(nullptr, n, w, l);
}
static void vigiarDono() {
  HHOOK g = SetWindowsHookExW(WH_MOUSE_LL, aoMouse, GetModuleHandleW(nullptr), 0);
  MSG msg;
  while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageW(&msg);
  }
  if (g) UnhookWindowsHookEx(g);
}
static bool donoMexendo() {
  if (GetTickCount64() - ultimoMouseDono.load() >= 700) return false;
  ULONGLONG agora = GetTickCount64();
  if (agora - ultimoAvisoPrioridade > 1500) { ultimoAvisoPrioridade = agora; diga("prioridade"); }
  return true;
}

// ----- onde está o que é compartilhado -----
static bool retanguloDoAlvo(RECT& r) {
  if (alvoJanela) {
    if (!IsWindow(alvoJanela) || IsIconic(alvoJanela)) return false;
    if (FAILED(DwmGetWindowAttribute(alvoJanela, DWMWA_EXTENDED_FRAME_BOUNDS, &r, sizeof r))) GetWindowRect(alvoJanela, &r);
    return r.right > r.left && r.bottom > r.top;
  }
  r = alvoTela;
  return r.right > r.left && r.bottom > r.top;
}
// teclado e mouse só valem com o jogo na frente (quando o compartilhado é uma janela)
static bool jogoNaFrente() {
  if (!alvoJanela) return alvoTela.right > alvoTela.left;
  HWND f = GetForegroundWindow();
  if (!f) return false;
  return f == alvoJanela || GetAncestor(f, GA_ROOTOWNER) == GetAncestor(alvoJanela, GA_ROOTOWNER);
}

// ----- teclado -----
static void tecla(unsigned scan, bool ext, bool desce) {
  INPUT in{};
  in.type = INPUT_KEYBOARD;
  in.ki.wScan = static_cast<WORD>(scan);
  in.ki.dwFlags = KEYEVENTF_SCANCODE | (ext ? KEYEVENTF_EXTENDEDKEY : 0) | (desce ? 0 : KEYEVENTF_KEYUP);
  SendInput(1, &in, sizeof in);
  unsigned id = scan | (ext ? 0x100u : 0u);
  if (desce) teclasApertadas.insert(id);
  else teclasApertadas.erase(id);
}

// ----- mouse -----
static void mouseAbs(int x, int y) {
  RECT r;
  if (!retanguloDoAlvo(r)) return;
  double nx = x / 65535.0, ny = y / 65535.0;
  int px = r.left + static_cast<int>(nx * (r.right - r.left - 1));
  int py = r.top + static_cast<int>(ny * (r.bottom - r.top - 1));
  int vx = GetSystemMetrics(SM_XVIRTUALSCREEN), vy = GetSystemMetrics(SM_YVIRTUALSCREEN);
  int vw = GetSystemMetrics(SM_CXVIRTUALSCREEN), vh = GetSystemMetrics(SM_CYVIRTUALSCREEN);
  if (vw < 2 || vh < 2) return;
  INPUT in{};
  in.type = INPUT_MOUSE;
  in.mi.dx = static_cast<LONG>(((px - vx) * 65535.0) / (vw - 1) + 0.5);
  in.mi.dy = static_cast<LONG>(((py - vy) * 65535.0) / (vh - 1) + 0.5);
  in.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK;
  SendInput(1, &in, sizeof in);
}
static void mouseRel(int dx, int dy) {
  INPUT in{};
  in.type = INPUT_MOUSE;
  in.mi.dx = dx;
  in.mi.dy = dy;
  in.mi.dwFlags = MOUSEEVENTF_MOVE;
  SendInput(1, &in, sizeof in);
}
static void botao(int b, bool desce) {
  INPUT in{};
  in.type = INPUT_MOUSE;
  switch (b) {
    case 0: in.mi.dwFlags = desce ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP; break;
    case 1: in.mi.dwFlags = desce ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP; break;
    case 2: in.mi.dwFlags = desce ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP; break;
    case 3: case 4:
      in.mi.dwFlags = desce ? MOUSEEVENTF_XDOWN : MOUSEEVENTF_XUP;
      in.mi.mouseData = b == 3 ? XBUTTON1 : XBUTTON2;
      break;
    default: return;
  }
  SendInput(1, &in, sizeof in);
  if (desce) botoesApertados.insert(b);
  else botoesApertados.erase(b);
}
static void roda(int delta, bool horizontal) {
  INPUT in{};
  in.type = INPUT_MOUSE;
  in.mi.dwFlags = horizontal ? MOUSEEVENTF_HWHEEL : MOUSEEVENTF_WHEEL;
  in.mi.mouseData = static_cast<DWORD>(delta);
  SendInput(1, &in, sizeof in);
}

// ----- controle virtual (Xbox 360) -----
#ifdef COM_VIGEM
static PVIGEM_CLIENT cliente = nullptr;
static PVIGEM_TARGET pad = nullptr;
static bool vigemOk = false;
static void ligarVigem() {
  cliente = vigem_alloc();
  if (!cliente) return;
  if (!VIGEM_SUCCESS(vigem_connect(cliente))) { vigem_free(cliente); cliente = nullptr; return; }
  vigemOk = true;
}
static bool padLigar() {
  if (!vigemOk) return false;
  if (pad) return true;
  pad = vigem_target_x360_alloc();
  if (!pad) return false;
  if (!VIGEM_SUCCESS(vigem_target_add(cliente, pad))) { vigem_target_free(pad); pad = nullptr; return false; }
  return true;
}
static void padEstado(unsigned botoes, int lt, int rt, int lx, int ly, int rx, int ry) {
  if (!pad) return;
  XUSB_REPORT r{};
  r.wButtons = static_cast<USHORT>(botoes);
  r.bLeftTrigger = static_cast<BYTE>(lt);
  r.bRightTrigger = static_cast<BYTE>(rt);
  r.sThumbLX = static_cast<SHORT>(lx);
  r.sThumbLY = static_cast<SHORT>(ly);
  r.sThumbRX = static_cast<SHORT>(rx);
  r.sThumbRY = static_cast<SHORT>(ry);
  vigem_target_x360_update(cliente, pad, r);
}
static void padTirar() {
  if (!pad) return;
  vigem_target_remove(cliente, pad);
  vigem_target_free(pad);
  pad = nullptr;
}
#else
static const bool vigemOk = false;
static bool padLigar() { return false; }
static void padEstado(unsigned, int, int, int, int, int, int) {}
static void padTirar() {}
#endif

static void soltarTudo() {
  std::set<unsigned> t = teclasApertadas;
  for (unsigned id : t) tecla(id & 0xffu, (id & 0x100u) != 0, false);
  std::set<int> b = botoesApertados;
  for (int x : b) botao(x, false);
  padEstado(0, 0, 0, 0, 0, 0, 0);
}

static int limite(long v, long min, long max) { return static_cast<int>(v < min ? min : v > max ? max : v); }

static bool comando(char* linha) {
  char cmd[16] = {0};
  if (std::sscanf(linha, "%15s", cmd) != 1) return true;
  std::lock_guard<std::mutex> g(trava);
  if (!std::strcmp(cmd, "sair")) return false;
  if (!std::strcmp(cmd, "solta")) { soltarTudo(); return true; }
  if (!std::strcmp(cmd, "alvo")) {
    char tipo[16] = {0};
    unsigned long long h = 0;
    long a = 0, b = 0, c = 0, d = 0;
    if (std::sscanf(linha, "alvo %15s", tipo) == 1 && !std::strcmp(tipo, "janela") && std::sscanf(linha, "alvo janela %llu", &h) == 1) {
      alvoJanela = reinterpret_cast<HWND>(static_cast<uintptr_t>(h));
      alvoTela = RECT{0, 0, 0, 0};
    } else if (!std::strcmp(tipo, "tela") && std::sscanf(linha, "alvo tela %ld %ld %ld %ld", &a, &b, &c, &d) == 4) {
      alvoJanela = nullptr;
      alvoTela = RECT{a, b, c, d};
    }
    return true;
  }
  if (!std::strcmp(cmd, "pad")) {
    if (std::strstr(linha, "ligar")) diga(padLigar() ? "pad ok" : "pad erro");
    else { padEstado(0, 0, 0, 0, 0, 0, 0); padTirar(); }
    return true;
  }
  if (!std::strcmp(cmd, "p")) {
    unsigned bt = 0;
    long lt = 0, rt = 0, lx = 0, ly = 0, rx = 0, ry = 0;
    if (std::sscanf(linha, "p %u %ld %ld %ld %ld %ld %ld", &bt, &lt, &rt, &lx, &ly, &rx, &ry) == 7) {
      padEstado(bt & 0xffffu, limite(lt, 0, 255), limite(rt, 0, 255), limite(lx, -32768, 32767), limite(ly, -32768, 32767), limite(rx, -32768, 32767), limite(ry, -32768, 32767));
    }
    return true;
  }
  if (!std::strcmp(cmd, "k")) {
    unsigned scan = 0, ext = 0, desce = 0;
    if (std::sscanf(linha, "k %u %u %u", &scan, &ext, &desce) != 3 || scan == 0 || scan > 0xff) return true;
    if (desce && !jogoNaFrente()) return true; // soltar sempre vale (para nada ficar preso)
    tecla(scan, ext != 0, desce != 0);
    return true;
  }
  if (!std::strcmp(cmd, "mb")) {
    int b = 0, desce = 0;
    if (std::sscanf(linha, "mb %d %d", &b, &desce) != 2) return true;
    if (desce && (!jogoNaFrente() || donoMexendo())) return true;
    botao(b, desce != 0);
    return true;
  }
  if (!jogoNaFrente()) return true;
  if (!std::strcmp(cmd, "ma")) {
    long x = 0, y = 0;
    if (std::sscanf(linha, "ma %ld %ld", &x, &y) == 2 && !donoMexendo()) mouseAbs(limite(x, 0, 65535), limite(y, 0, 65535));
  } else if (!std::strcmp(cmd, "mr")) {
    long dx = 0, dy = 0;
    if (std::sscanf(linha, "mr %ld %ld", &dx, &dy) == 2 && !donoMexendo()) mouseRel(limite(dx, -2000, 2000), limite(dy, -2000, 2000));
  } else if (!std::strcmp(cmd, "mw")) {
    long d = 0, h = 0;
    if (std::sscanf(linha, "mw %ld %ld", &d, &h) == 2 && !donoMexendo()) roda(limite(d, -1200, 1200), h != 0);
  }
  return true;
}

int main(int argc, char** argv) {
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2); // pixels de verdade
#ifdef COM_VIGEM
  const char* compilado = "1";
#else
  const char* compilado = "0";
#endif
  if (argc > 1 && !std::strcmp(argv[1], "--versao")) {
    std::printf("controle-programa 1 vigem-compilado=%s\n", compilado);
    return 0;
  }
#ifdef COM_VIGEM
  ligarVigem();
#endif
  std::thread(vigiarDono).detach();
  diga(vigemOk ? "pronto vigem=1" : "pronto vigem=0");
  char linha[256];
  while (std::fgets(linha, sizeof linha, stdin)) {
    if (!comando(linha)) break;
  }
  {
    std::lock_guard<std::mutex> g(trava);
    soltarTudo();
    padTirar();
  }
#ifdef COM_VIGEM
  if (cliente) { vigem_disconnect(cliente); vigem_free(cliente); }
#endif
  return 0;
}
