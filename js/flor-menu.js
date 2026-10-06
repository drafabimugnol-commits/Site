// Menu-flor: a magnólia do canto se abre em pétalas que voam, pousam e viram um painel
// sólido com as seções do site; ao fechar, o painel se solta em pétalas e o vento as leva.
// Canvas 2D próprio (acima do conteúdo, sem cliques), ligado só durante as transições.

const canto = document.getElementById("flor-botao");
const topo = document.getElementById("flor-topo");
const menu = document.getElementById("flor-menu");
const cv = document.getElementById("flor-petalas");

if (canto && menu && cv) {
  let btn = canto; // gatilho que abriu o painel (a flor do canto ou a do topo)
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = cv.getContext("2d");
  if (calmo || !ctx) menu.classList.add("simples");

  // ---------- ajustes finos ----------
  const AJUSTE = {
    petalas: 560,          // quantidade no computador (celular: 62%)
    abrirAtraso: 0.42,     // s: espalhamento da saída, da pétala mais próxima à mais distante
    voo: [0.5, 0.72],      // s: duração do voo de cada pétala (mín, máx)
    revelaInicio: 0.58,    // s: quando o painel começa a se tornar sólido
    revelaDuracao: 0.62,   // s: tempo para a superfície cobrir o painel inteiro
    fecharDuracao: 0.6,    // s: tempo para o painel inteiro se soltar em pétalas
    vida: [0.75, 1.15],    // s: quanto cada pétala solta voa até sumir
    vento: { x: 0.55, y: -1 }, // direção do vento ao fechar (para o alto, à direita)
  };

  // ---------- pétalas desenhadas uma vez (sprites), frente e verso ----------
  const CORES = ["#d8a8a2", "#e0b8b2", "#a87776", "#96625f", "#ece2db", "#c99891", "#5f454e"];
  const PESOS = [0.22, 0.18, 0.18, 0.12, 0.12, 0.12, 0.06];
  const S = 64;
  const hexRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const CREME = [246, 237, 231];
  function sprite(hex, frente) {
    const c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d");
    const base = hexRgb(hex);
    g.translate(S / 2, S / 2);
    // obovada: base estreita embaixo, ponta larga e arredondada em cima
    const forma = () => {
      g.beginPath();
      g.moveTo(0, 27);
      g.bezierCurveTo(-13, 19, -21, -2, -12, -21);
      g.quadraticCurveTo(0, -31, 12, -21);
      g.bezierCurveTo(21, -2, 13, 19, 0, 27);
      g.closePath();
    };
    forma();
    const lg = g.createLinearGradient(0, 27, 0, -28);
    const k = frente ? 1 : 0.8;
    lg.addColorStop(0, rgb(mix([0, 0, 0], base, 0.62 * k)));
    lg.addColorStop(0.45, rgb(mix([0, 0, 0], base, 0.98 * k)));
    lg.addColorStop(1, rgb(mix(mix([0, 0, 0], base, k), CREME, frente ? 0.42 : 0.16)));
    g.fillStyle = lg; g.fill();
    // volume: luz do alto à esquerda e sombra na borda oposta
    g.save(); forma(); g.clip();
    const luz = g.createRadialGradient(-7, -10, 1, -7, -10, 26);
    luz.addColorStop(0, `rgba(255,250,246,${frente ? 0.38 : 0.16})`); luz.addColorStop(1, "rgba(255,250,246,0)");
    g.fillStyle = luz; g.fillRect(-S, -S, 2 * S, 2 * S);
    const somb = g.createLinearGradient(-16, 0, 18, 0);
    somb.addColorStop(0, "rgba(40,24,30,0)"); somb.addColorStop(1, "rgba(40,24,30,0.22)");
    g.fillStyle = somb; g.fillRect(-S, -S, 2 * S, 2 * S);
    // nervura central, bem leve
    g.strokeStyle = "rgba(60,36,44,0.16)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, 24); g.quadraticCurveTo(1.5, 0, 0, -19); g.stroke();
    g.restore();
    return c;
  }
  let SPR = null;
  const sprites = () => SPR || (SPR = CORES.map((h) => [sprite(h, true), sprite(h, false)]));
  const sorteiaCor = () => { let r = Math.random(); for (let i = 0; i < PESOS.length; i++) { if ((r -= PESOS[i]) < 0) return i; } return 0; };

  // ---------- utilitários ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const bez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };

  let dpr = 1, W = 0, H = 0;
  function tela() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }

  function desenha(p, x, y, tam, rot, flip, alfa) {
    if (alfa <= 0.003 || tam <= 0.3) return;
    const cf = Math.cos(flip), sx = Math.max(Math.abs(cf), 0.12);
    const k = (tam / S) * dpr, c = Math.cos(rot), s = Math.sin(rot);
    ctx.globalAlpha = Math.min(1, alfa);
    ctx.setTransform(c * sx * k, s * sx * k, -s * k, c * k, x * dpr, y * dpr);
    ctx.drawImage(sprites()[p.cor][cf >= 0 ? 0 : 1], -S / 2, -S / 2);
  }

  // ---------- geometria: de onde saem (a flor) e onde pousam (o painel) ----------
  let geo = null;
  function medir() {
    const b = btn.getBoundingClientRect(), m = menu.getBoundingClientRect();
    const O = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    const cantos = [[m.left, m.top], [m.right, m.top], [m.left, m.bottom], [m.right, m.bottom]];
    const maxR = Math.max(...cantos.map(([x, y]) => Math.hypot(x - O.x, y - O.y)));
    const n = Math.round(AJUSTE.petalas * (W < 760 ? 0.62 : 1));
    const passo = Math.max(9, Math.sqrt((m.width * m.height) / n));
    const raio = 28, pts = [];
    for (let y = m.top + passo / 2; y < m.bottom; y += passo) {
      for (let x = m.left + passo / 2; x < m.right; x += passo) {
        const px = x + rand(-0.45, 0.45) * passo, py = y + rand(-0.45, 0.45) * passo;
        // respeita os cantos arredondados do painel
        const cx = clamp(px, m.left + raio, m.right - raio), cy = clamp(py, m.top + raio, m.bottom - raio);
        if (Math.hypot(px - cx, py - cy) > raio - 2) continue;
        pts.push({ x: px, y: py });
      }
    }
    return { O, m, maxR, pts, ox: O.x - m.left, oy: O.y - m.top };
  }
  // borda esfumada: a superfície parece condensar-se das pétalas, sem arco duro
  const PLUMA = 70;
  const recorte = (r) => {
    const R = Math.max(0, r), m = `radial-gradient(circle at ${geo.ox.toFixed(1)}px ${geo.oy.toFixed(1)}px, #000 ${Math.max(0, R - PLUMA).toFixed(1)}px, transparent ${R.toFixed(1)}px)`;
    menu.style.maskImage = m; menu.style.webkitMaskImage = m;
  };
  const semRecorte = () => { menu.style.maskImage = ""; menu.style.webkitMaskImage = ""; };

  // ---------- estado ----------
  let estado = "fechado", raf = 0, t0 = 0, petalas = [], raioAtual = 0;

  // aberto pelo topo, o painel desce logo abaixo da flor do cabeçalho; pelo canto, sobe do canto
  function posicionar() {
    if (btn === canto) { menu.style.top = ""; menu.style.bottom = ""; menu.style.maxHeight = ""; return; }
    const r = btn.getBoundingClientRect(), y = Math.max(12, r.bottom + 14);
    menu.style.top = `${y}px`; menu.style.bottom = "auto";
    menu.style.maxHeight = `${Math.max(240, window.innerHeight - y - 16)}px`;
  }

  function abrir(viaTeclado, gatilho) {
    cancelAnimationFrame(raf); pararVoo();
    btn = gatilho || canto;
    posicionar();
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Fechar o menu do site");
    menu.inert = false;
    marcarSecao();
    if (menu.classList.contains("simples")) {
      menu.classList.add("aberta", "mostrar"); estado = "aberto";
      if (viaTeclado) focarPrimeiro();
      return;
    }
    tela();
    menu.classList.add("aberta");
    geo = medir();
    recorte(0); raioAtual = 0;
    const { O, maxR } = geo;
    const rumo = Math.atan2(geo.m.top + geo.m.height / 2 - O.y, geo.m.left + geo.m.width / 2 - O.x);
    petalas = geo.pts.map((T) => {
      const d = Math.hypot(T.x - O.x, T.y - O.y);
      // sai da flor num leque para o alto e chega ao ponto de pouso em curva
      // leque voltado para o painel (para cima no canto, para baixo no topo)
      const ang = rumo + rand(-1.25, 1.25), alc = rand(40, 120);
      const perp = { x: -(T.y - O.y) / (d || 1), y: (T.x - O.x) / (d || 1) }, torce = rand(-1, 1) * Math.min(90, d * 0.45);
      return {
        T, d, cor: sorteiaCor(),
        x0: O.x + rand(-6, 6), y0: O.y + rand(-8, 4),
        c1x: O.x + Math.cos(ang) * alc, c1y: O.y + Math.sin(ang) * alc,
        c2x: T.x + perp.x * torce, c2y: T.y + perp.y * torce + rand(10, 40),
        atraso: 0.04 + (d / maxR) * AJUSTE.abrirAtraso + rand(0, 0.08),
        voo: rand(AJUSTE.voo[0], AJUSTE.voo[1]),
        pico: rand(13, 20), fim: rand(6, 9),
        r0: rand(0, Math.PI * 2), giro: rand(2, 5) * Math.PI * (Math.random() < 0.5 ? -1 : 1),
        f0: rand(0, Math.PI * 2), virada: rand(3, 7) * Math.PI,
      };
    });
    estado = "abrindo"; t0 = performance.now();
    let mostrou = false;
    const passo = () => {
      const agora = performance.now();
      const t = (agora - t0) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      // a superfície sólida avança da flor para fora, logo atrás das pétalas que pousam
      raioAtual = clamp((t - AJUSTE.revelaInicio) / AJUSTE.revelaDuracao) * (geo.maxR + PLUMA + 90);
      recorte(raioAtual);
      let vivas = 0;
      for (const p of petalas) {
        const u = clamp((t - p.atraso) / p.voo);
        if (u <= 0) { vivas++; continue; }
        const e = inOut(u);
        const x = bez(p.x0, p.c1x, p.c2x, p.T.x, e), y = bez(p.y0, p.c1y, p.c2y, p.T.y, e);
        const tam = lerp(p.pico, p.fim, outCubic(u)) * Math.min(1, 0.25 + u * 5);
        const rot = p.r0 + p.giro * outCubic(u);
        const flip = p.f0 + p.virada * (1 - outCubic(u)) * 0.5;
        // some quando a superfície a cobre (vira parte do painel)
        const coberta = sstep(p.d - 6, p.d + 30, raioAtual - PLUMA * 0.55);
        const alfa = sstep(0, 0.1, u) * (1 - coberta);
        if (alfa > 0.003) vivas++;
        desenha(p, x, y, tam, rot, flip, alfa);
      }
      if (!mostrou && t > AJUSTE.revelaInicio + AJUSTE.revelaDuracao * 0.55) { mostrou = true; menu.classList.add("mostrar"); }
      if (vivas === 0 && raioAtual >= geo.maxR + PLUMA + 89) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        semRecorte(); estado = "aberto";
        if (viaTeclado) focarPrimeiro();
        return;
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }

  function fechar(devolverFoco) {
    if (estado === "fechado" || estado === "fechando") return;
    cancelAnimationFrame(raf);
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Abrir o menu do site");
    menu.classList.remove("mostrar");
    menu.inert = true;
    if (devolverFoco) btn.focus();
    if (menu.classList.contains("simples")) { menu.classList.remove("aberta"); estado = "fechado"; aposFechar(); return; }
    tela();
    const vindoDeAberto = estado === "aberto";
    geo = medir();
    const R0 = vindoDeAberto ? geo.maxR + PLUMA + 24 : raioAtual;
    const { O } = geo;
    const vento = AJUSTE.vento, vn = Math.hypot(vento.x, vento.y);
    // cada ponto do painel vira uma pétala solta no instante em que a borda passa por ele
    petalas = geo.pts.filter((T) => Math.hypot(T.x - O.x, T.y - O.y) < R0).map((T) => {
      const d = Math.hypot(T.x - O.x, T.y - O.y);
      // sai para fora da flor, cada uma num ângulo próprio (o contorno do painel não se mantém)
      const a = Math.atan2(T.y - O.y, T.x - O.x) + rand(-0.9, 0.9);
      const dir = { x: Math.cos(a), y: Math.sin(a) };
      return {
        T, d, dir, cor: sorteiaCor(),
        solta: AJUSTE.fecharDuracao * (1 - d / R0) + rand(0, 0.1),
        vida: rand(AJUSTE.vida[0], AJUSTE.vida[1]),
        empurra: rand(40, 110), sopro: rand(160, 380),
        vx: vento.x / vn, vy: vento.y / vn, fase: rand(0, 6.28),
        t0: rand(6, 9), t1: rand(12, 19),
        r0: rand(0, Math.PI * 2), giro: rand(1.5, 4) * Math.PI * (Math.random() < 0.5 ? -1 : 1),
        f0: 0, virada: rand(2, 6) * Math.PI,
      };
    });
    recorte(R0);
    estado = "fechando"; t0 = performance.now();
    const passo = () => {
      const agora = performance.now();
      const t = (agora - t0) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      // a superfície recua da borda mais distante para a flor
      raioAtual = R0 * (1 - outCubic(clamp(t / AJUSTE.fecharDuracao)));
      recorte(raioAtual);
      let vivas = 0;
      for (const p of petalas) {
        const u = clamp((t - p.solta) / p.vida);
        // um instante antes de soltar, a pétala já aparece onde a borda vai passar
        const pre = sstep(p.d + PLUMA * 0.6, p.d + PLUMA * 0.1, raioAtual);
        if (pre <= 0 && u <= 0) { vivas++; continue; }
        const e = outCubic(u), w = Math.pow(u, 1.6);
        const turb = Math.sin(t * 3 + p.fase) * 22 * Math.sqrt(u);
        const x = p.T.x + p.dir.x * p.empurra * e + p.vx * p.sopro * w + turb;
        const y = p.T.y + p.dir.y * p.empurra * e + p.vy * p.sopro * w + Math.cos(t * 2.4 + p.fase) * 14 * Math.sqrt(u);
        const tam = lerp(p.t0, p.t1, sstep(0, 0.5, u)) * (1 - 0.35 * sstep(0.6, 1, u));
        const rot = p.r0 + p.giro * e;
        const flip = p.f0 + p.virada * u;
        const alfa = pre * (1 - sstep(0.45, 1, u));
        if (u < 1) vivas++;
        desenha(p, x, y, tam, rot, flip, alfa);
      }
      if (vivas === 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        menu.classList.remove("aberta"); semRecorte(); estado = "fechado"; aposFechar();
        return;
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }

  // ---------- seção atual (pétala ao lado) ----------
  const links = [...menu.querySelectorAll(".flor-menu__lista a")];
  const alvos = links.map((a) => document.querySelector(a.getAttribute("href")));
  function marcarSecao() {
    const lim = window.innerHeight * 0.4;
    let atual = 0;
    alvos.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= lim) atual = i; });
    links.forEach((a, i) => a.setAttribute("aria-current", String(i === atual)));
  }
  window.addEventListener("scroll", () => { if (estado !== "fechado") marcarSecao(); }, { passive: true });

  function focarPrimeiro() { const a = links.find((l) => l.getAttribute("aria-current") === "true") || links[0]; a && a.focus(); }

  // ---------- interação ----------
  [canto, topo].filter(Boolean).forEach((g) => g.addEventListener("click", (e) => {
    if (estado === "fechado" || estado === "fechando") abrir(e.detail === 0, g);
    else fechar(false);
  }));
  links.forEach((a) => a.addEventListener("click", () => fechar(false)));
  menu.querySelector(".flor-menu__paciente")?.addEventListener("click", () => fechar(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && estado !== "fechado") fechar(true); });
  document.addEventListener("pointerdown", (e) => {
    if (estado === "fechado" || estado === "fechando") return;
    if (menu.contains(e.target) || canto.contains(e.target) || (topo && topo.contains(e.target))) return;
    fechar(false);
  });
  // ---------- a flor muda de lugar: do cabeçalho para o canto (e de volta) ----------
  let rafV = 0;
  function pararVoo() { if (rafV) { cancelAnimationFrame(rafV); rafV = 0; ctx && (ctx.setTransform(1, 0, 0, 1, 0, 0), ctx.clearRect(0, 0, cv.width, cv.height)); } }
  function voarFlor(descendo) {
    if (calmo || !ctx || !topo || estado !== "fechado") return;
    pararVoo(); tela();
    const a = topo.querySelector("svg").getBoundingClientRect(), b = canto.getBoundingClientRect();
    const A = { x: a.left + a.width / 2, y: a.top + a.height / 2 }, B = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    const [de, para] = descendo ? [A, B] : [B, A];
    const sinal = descendo ? 1 : -1;
    const voo = Array.from({ length: W < 760 ? 26 : 38 }, () => ({
      cor: sorteiaCor(), atraso: rand(0, 0.28), dur: rand(0.75, 1.05),
      x0: de.x + rand(-8, 8), y0: de.y + rand(-8, 8),
      c1x: de.x + rand(-70, 90), c1y: de.y + sinal * rand(40, 140),
      c2x: para.x + rand(-60, 110), c2y: para.y - sinal * rand(60, 180),
      x1: para.x + rand(-6, 6), y1: para.y + rand(-6, 6),
      pico: rand(9, 15), r0: rand(0, 6.28), giro: rand(2, 5) * Math.PI * (Math.random() < 0.5 ? -1 : 1),
      f0: rand(0, 6.28), virada: rand(3, 6) * Math.PI,
    }));
    const ini = performance.now();
    const passo = () => {
      const t = (performance.now() - ini) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      let vivas = 0;
      for (const p of voo) {
        const u = clamp((t - p.atraso) / p.dur);
        if (u < 1) vivas++;
        if (u <= 0) continue;
        const e = inOut(u);
        const x = bez(p.x0, p.c1x, p.c2x, p.x1, e), y = bez(p.y0, p.c1y, p.c2y, p.y1, e);
        const tam = p.pico * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 4;
        desenha(p, x, y, tam, p.r0 + p.giro * outCubic(u), p.f0 + p.virada * u, sstep(0, 0.12, u) * (1 - sstep(0.82, 1, u)));
      }
      if (vivas === 0) { pararVoo(); return; }
      rafV = requestAnimationFrame(passo);
    };
    rafV = requestAnimationFrame(passo);
    if (!descendo) { topo.classList.remove("chegando"); void topo.offsetWidth; topo.classList.add("chegando"); setTimeout(() => topo.classList.remove("chegando"), 1600); }
  }

  // o cabeçalho está na tela? (no computador largo não há flor no topo: vale o cabeçalho inteiro)
  const nav = document.querySelector(".nav");
  const temFlorNoTopo = () => topo && getComputedStyle(topo).display !== "none";
  let noCanto = null, pendente = null;
  function aplicarLugar(canto_, animar) {
    if (canto_ === noCanto) return;
    if (estado !== "fechado") { pendente = canto_; return; }
    noCanto = canto_;
    document.documentElement.classList.toggle("flor-no-canto", canto_);
    if (animar && temFlorNoTopo()) voarFlor(canto_);
  }
  function aposFechar() {
    menu.style.top = ""; menu.style.bottom = ""; menu.style.maxHeight = "";
    if (pendente !== null) { const p = pendente; pendente = null; aplicarLugar(p, false); }
  }
  if (nav && "IntersectionObserver" in window) {
    let primeira = true;
    new IntersectionObserver(([en]) => {
      // a flor do topo conta como "na tela" só enquanto ela mesma estiver visível
      const alvo = temFlorNoTopo() ? topo.getBoundingClientRect() : en.boundingClientRect;
      const fora = alvo.bottom < 4 || !en.isIntersecting;
      aplicarLugar(fora, !primeira); primeira = false;
    }, { threshold: [0, 0.01, 0.5, 1] }).observe(nav);
    // a flor do topo pode sair antes do cabeçalho inteiro: confere também ao rolar
    window.addEventListener("scroll", () => {
      if (!temFlorNoTopo()) return;
      const r = topo.getBoundingClientRect();
      aplicarLugar(r.bottom < 4 || r.top > window.innerHeight, true);
    }, { passive: true });
  } else {
    aplicarLugar(true, false);
  }

  // ---------- versão 2 do topo: "mesma língua" solta pétalas que vão formar a magnólia ----------
  if (document.documentElement.classList.contains("versao-2") && ctx && !calmo) {
    const palavras = document.querySelector(".hero h1 em"), slot = document.getElementById("slot-flor");
    if (palavras && slot) {
      tela();
      window.addEventListener("resize", tela);
      // pétalas guiadas pela rolagem: saem das palavras e pousam na área da flor (voltam ao rolar para cima)
      const guiadas = Array.from({ length: W < 760 ? 70 : 110 }, () => ({
        cor: sorteiaCor(), sx: Math.random(), sy: rand(0.25, 0.8),
        ex: rand(-0.32, 0.32), ey: rand(-0.42, 0.42), arco: rand(-140, 140),
        atraso: rand(0, 0.3), r0: rand(0, 6.28), giro: rand(2, 5) * Math.PI, f0: rand(0, 6.28), tam: rand(8, 13),
      }));
      // convite: com a página parada no topo, as palavras soltam uma pétala de vez em quando, rumo ao centro
      const soltas = [];
      let ultimaSolta = 0, limpo = true;
      const passoV2 = (agora) => {
        requestAnimationFrame(passoV2);
        if (estado !== "fechado" || rafV) { limpo = false; return; }
        const p = window.__heroP || 0;
        const a = palavras.getBoundingClientRect(), b = slot.getBoundingClientRect();
        const visivel = a.bottom > 0 && b.top < H && p < 0.75;
        if (!visivel && !soltas.length) { if (!limpo) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); limpo = true; } return; }
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); limpo = false;
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const t = agora / 1000;
        if (p < 0.03 && t - ultimaSolta > 0.55 && soltas.length < 10) {
          ultimaSolta = t;
          soltas.push({ cor: sorteiaCor(), t0: t, dur: rand(2.2, 3.2), x0: a.left + Math.random() * a.width, y0: a.top + a.height * rand(0.3, 0.8),
            dx: rand(-0.25, 0.25) * b.width, dy: rand(-0.25, 0.3) * b.height, arco: rand(-90, 90), r0: rand(0, 6.28), giro: rand(1.5, 3) * Math.PI, f0: rand(0, 6.28), tam: rand(9, 13) });
        }
        for (let i = soltas.length - 1; i >= 0; i--) {
          const q = soltas[i], u = (t - q.t0) / q.dur;
          if (u >= 1) { soltas.splice(i, 1); continue; }
          const e = inOut(u), x1 = cx + q.dx, y1 = cy + q.dy;
          const x = lerp(q.x0, x1, e) + Math.sin(Math.PI * e) * q.arco, y = lerp(q.y0, y1, e) - Math.sin(Math.PI * e) * 30;
          desenha(q, x, y, q.tam, q.r0 + q.giro * u, q.f0 + 3 * Math.PI * u, sstep(0, 0.12, u) * (1 - sstep(0.6, 1, u)) * (1 - clamp(p * 20)));
        }
        if (p > 0.005 && p < 0.75) {
          for (const g of guiadas) {
            const u = clamp((p - g.atraso) / 0.3);
            if (u <= 0 || u >= 1) continue;
            const e = inOut(u);
            const x0 = a.left + g.sx * a.width, y0 = a.top + g.sy * a.height;
            const x1 = cx + g.ex * b.width, y1 = cy + g.ey * b.height;
            const x = lerp(x0, x1, e) + Math.sin(Math.PI * e) * g.arco, y = lerp(y0, y1, e) - Math.sin(Math.PI * e) * 50;
            desenha(g, x, y, g.tam * (1 - 0.35 * e), g.r0 + g.giro * e, g.f0 + 4 * Math.PI * e, sstep(0, 0.12, u) * (1 - sstep(0.7, 1, u)));
          }
        }
      };
      requestAnimationFrame(passoV2);
    }
  }

  window.addEventListener("resize", () => {
    if (estado === "aberto") semRecorte();
  });
}
