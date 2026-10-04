// Configuração editável
const CONFIG = {
  whatsapp: "5551999999999", // número com DDI + DDD, só dígitos
  mensagem: "Olá! Gostaria de mais informações sobre o trabalho da Dra. Fabiana Mugnol.",
};

// Links do WhatsApp
const num = CONFIG.whatsapp.replace(/\D/g, "");
document.querySelectorAll("[data-wa]").forEach((a) => {
  const msg = a.dataset.waMsg || CONFIG.mensagem;
  a.href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
});

// Links ainda sem destino definitivo não levam a lugar nenhum
document.querySelectorAll("[data-pendente]").forEach((a) => {
  a.title = "Em breve";
  a.addEventListener("click", (e) => e.preventDefault());
});

// Menu em tela cheia
(() => {
  const btn = document.querySelector(".menu-btn");
  const menu = document.getElementById("menu");
  const label = btn.querySelector(".menu-btn__label");
  const set = (open) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Fechar" : "Menu";
    document.body.classList.toggle("menu-aberto", open);
    if (open) menu.querySelector("a").focus();
  };
  btn.addEventListener("click", () => set(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
})();

// Cérebro de magnólias (abertura)
(() => {
  const c = document.getElementById("constelacao");
  if (!c || typeof drawMagnolia !== "function") return;
  const ctx = c.getContext("2d");
  const PAL = ["#5f454e", "#a87776", "#baa499", "#52594e", "#8f6f6c", "#7a5a62", "#9c8478"];
  const OPEN = [0.1, 0.55, 1];
  const SPRITE = 96;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Cada flor é desenhada uma vez por cor e abertura e depois reaproveitada
  const sprites = PAL.map((col) => OPEN.map((o) => {
    const s = document.createElement("canvas");
    s.width = s.height = SPRITE;
    const x = s.getContext("2d");
    x.fillStyle = col; x.strokeStyle = col;
    x.translate(SPRITE / 2, SPRITE / 2); x.scale(SPRITE * 0.82, SPRITE * 0.82);
    drawMagnolia(x, o);
    return s;
  }));

  // Desenho do cérebro em vista lateral (frontal à esquerda), numa caixa de 1000 x 800
  const BRAIN = {
    cerebro: "M170 470 C110 400 120 250 230 180 C330 110 480 90 600 110 C720 130 820 190 860 290 C900 380 880 460 820 500 C780 525 730 530 690 520 C620 560 520 590 430 580 C360 572 320 540 310 505 C300 480 260 470 230 490 C200 505 185 495 170 470 Z",
    cerebelo: "M650 540 C690 515 800 515 850 555 C885 600 835 662 750 662 C680 662 630 620 650 540 Z",
    tronco: "M590 560 C603 620 610 690 615 760 L668 760 C666 690 664 620 662 562 Z",
    sulcos: [
      "M240 485 C330 440 430 420 560 400 C600 395 630 380 650 360",                       // fissura lateral (Sylvius)
      "M545 108 C520 150 545 190 515 235 C490 280 530 310 505 350 C492 380 485 400 470 420", // sulco central
      "M450 120 C425 160 455 200 430 245 C410 285 440 310 420 345",                       // sulco pré-central
      "M632 124 C610 165 640 205 612 250 C592 290 625 315 605 345",                       // sulco pós-central
      "M205 258 C235 235 265 262 300 240 C335 220 365 245 405 228",                       // sulco frontal superior
      "M185 362 C220 335 255 360 290 335 C325 315 360 340 400 322",                       // sulco frontal inferior
      "M300 150 C325 175 300 198 332 222",                                                // giro frontal
      "M650 258 C680 240 705 275 735 262 C765 250 785 290 815 318",                       // sulco intraparietal
      "M705 158 C690 190 722 210 705 236",                                                // giro parietal
      "M360 522 C400 500 430 520 470 498 C520 474 560 496 610 476 C660 458 700 470 750 432", // sulco temporal superior
      "M420 556 C470 538 520 552 580 536",                                                // sulco temporal inferior
      "M770 205 C795 240 770 275 800 310 C820 340 815 360 845 380",                       // sulco parieto-occipital
      "M675 572 C730 556 795 562 842 585",                                                // folhas do cerebelo
      "M668 608 C725 597 792 602 836 620",
      "M690 640 C740 633 785 636 815 645",
    ],
  };

  // Amostra pontos de uma máscara desenhada num canvas auxiliar
  const MW = 500, MH = 400;
  const sample = (paint, n) => {
    const m = document.createElement("canvas");
    m.width = MW; m.height = MH;
    const x = m.getContext("2d");
    x.scale(MW / 1000, MH / 800);
    x.lineCap = "round"; x.lineJoin = "round";
    paint(x);
    const data = x.getImageData(0, 0, MW, MH).data, on = [];
    for (let i = 3; i < data.length; i += 4) if (data[i] > 128) on.push((i - 3) / 4);
    const out = [];
    for (let k = 0; k < n && on.length; k++) {
      const idx = on[Math.floor(Math.random() * on.length)];
      const px = (idx % MW + Math.random()) * (1000 / MW), py = (Math.floor(idx / MW) + Math.random()) * (800 / MH);
      out.push([(px - 500) / 430, (py - 430) / 430]);
    }
    return out;
  };
  const P = (d) => new Path2D(d);
  const contorno = sample((x) => { x.lineWidth = 18; [BRAIN.cerebro, BRAIN.cerebelo, BRAIN.tronco].forEach((d) => x.stroke(P(d))); }, 380);
  const sulcos = sample((x) => { x.lineWidth = 14; BRAIN.sulcos.forEach((d) => x.stroke(P(d))); }, 340);
  const preenchimento = sample((x) => {
    [BRAIN.cerebro, BRAIN.cerebelo, BRAIN.tronco].forEach((d) => x.fill(P(d)));
    // os sulcos ficam vazios para que os giros se destaquem
    x.globalCompositeOperation = "destination-out"; x.lineWidth = 34;
    BRAIN.sulcos.forEach((d) => x.stroke(P(d)));
  }, 110);

  const pts = [];
  const mk = (x, y, tipo) => {
    const amb = tipo === "amb", fundo = tipo === "fundo";
    return {
      x, y, amb,
      sx: rnd(-1.8, 1.8), sy: rnd(-1.6, 1.6),          // posição inicial dispersa
      delay: rnd(0, 1.2) + (x + 1.1) * 0.35,           // forma-se da frente para trás
      s: amb ? rnd(11, 16) : fundo ? rnd(9, 14) : rnd(13, 19),
      rot: rnd(-0.9, 0.9), sway: rnd(0.15, 0.4), ph: rnd(0, 6.28),
      ci: Math.floor(rnd(0, PAL.length)), oi: Math.floor(rnd(0, OPEN.length)),
      al: amb ? rnd(0.15, 0.3) : fundo ? rnd(0.18, 0.35) : tipo === "contorno" ? rnd(0.7, 1) : rnd(0.55, 0.9),
      drift: amb ? 0.05 : fundo ? 0.012 : 0.005,
    };
  };
  preenchimento.forEach(([x, y]) => pts.push(mk(x, y, "fundo")));
  sulcos.forEach(([x, y]) => pts.push(mk(x, y, "sulco")));
  contorno.forEach(([x, y]) => pts.push(mk(x, y, "contorno")));
  for (let i = 0; i < 40; i++) pts.push(mk(rnd(-1.6, 1.6), rnd(-1.5, 1.5), "amb"));

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mouse = { x: -9999, y: -9999 }, dim = { w: 0, h: 0, d: 1 }, visible = true, raf = 0, t0 = 0;

  const point = (e) => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; };
  c.addEventListener("pointermove", point);
  c.addEventListener("pointerdown", point);
  c.addEventListener("pointerleave", () => { mouse = { x: -9999, y: -9999 }; });

  const resize = () => {
    const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    dim = { w: r.width, h: r.height, d };
  };
  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

  const draw = (t) => {
    const { w, h, d } = dim;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
    const sc = Math.min(w, h) * 0.5, cx = w / 2, cy = h * 0.5;
    // onda que percorre o cérebro, como um impulso: as flores se abrem e se destacam
    const wave = ((t * 0.22) % 1.6) * 2.6 - 1.5;
    for (const p of pts) {
      const k = still ? 1 : ease((t - p.delay) / 2.2);
      const drift = p.drift;
      const bx = p.x + Math.sin(t * 0.35 + p.ph) * drift;
      const by = p.y + Math.cos(t * 0.3 + p.ph) * drift;
      let x = cx + (p.sx + (bx - p.sx) * k) * sc;
      let y = cy + (p.sy + (by - p.sy) * k) * sc;
      const dx = x - mouse.x, dy = y - mouse.y, dd = Math.hypot(dx, dy);
      if (dd < 90) { const f = (90 - dd) / 90 * 20; x += dx / (dd || 1) * f; y += dy / (dd || 1) * f; }
      const pulse = p.amb ? 0 : Math.max(0, 1 - Math.abs(p.x - wave) * 3.2);
      const size = p.s * (Math.min(dim.w, dim.h) / 560) * (1 + pulse * 0.3);
      const oi = Math.min(OPEN.length - 1, p.oi + (pulse > 0.5 ? 1 : 0));
      ctx.globalAlpha = Math.min(1, p.al * (0.8 + 0.2 * Math.sin(t * 0.9 + p.ph)) + pulse * 0.25) * k;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot + Math.sin(t * 0.6 + p.ph) * p.sway);
      ctx.drawImage(sprites[p.ci][oi], -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  const loop = (ms) => {
    if (!t0) t0 = ms;
    draw((ms - t0) / 1000);
    raf = visible && !still ? requestAnimationFrame(loop) : 0;
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

  new ResizeObserver(() => { resize(); if (still) draw(0); }).observe(c);
  // Pausa a animação fora da tela para poupar bateria
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(c);
  resize();
  start();
})();
