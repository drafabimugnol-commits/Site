// Configuração editável
const CONFIG = {
  whatsapp: "5551999999999", // número com DDI + DDD, só dígitos
  mensagem: "Olá! Gostaria de agendar uma consulta com a Dra. Fabiana Mugnol.",
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

  // Silhueta do cérebro em vista lateral: hemisfério, cerebelo e tronco
  const inBrain = (x, y) => {
    const th = Math.atan2(y + 0.05, x);
    const wob = 1 + 0.045 * Math.sin(th * 11) + 0.02 * Math.sin(th * 23);
    const e = x ** 2 + ((y + 0.05) / 0.7) ** 2;
    if (e < wob * wob && y < 0.42 - 0.18 * x) return true;
    if (((x - 0.5) / 0.34) ** 2 + ((y - 0.48) / 0.2) ** 2 < 1) return true;
    if (x > 0.12 && x < 0.32 && y > 0.3 && y < 0.95 - (x - 0.12) * 0.6) return true;
    return false;
  };

  const pts = [];
  const mk = (x, y, amb) => ({
    x, y, amb,
    sx: rnd(-1.8, 1.8), sy: rnd(-1.6, 1.6),          // posição inicial dispersa
    delay: rnd(0, 1.4) + (x + 1.1) * 0.35,           // forma-se da frente para trás
    s: amb ? rnd(11, 16) : rnd(13, 23),
    rot: rnd(-0.9, 0.9), sway: rnd(0.15, 0.4), ph: rnd(0, 6.28),
    ci: Math.floor(rnd(0, PAL.length)), oi: Math.floor(rnd(0, OPEN.length)),
    al: amb ? rnd(0.15, 0.32) : rnd(0.45, 0.9),
  });
  while (pts.length < 480) {
    const x = rnd(-1.05, 1.05), y = rnd(-0.85, 1.0);
    if (inBrain(x, y)) pts.push(mk(x, y, false));
  }
  for (let i = 0; i < 45; i++) pts.push(mk(rnd(-1.6, 1.6), rnd(-1.5, 1.5), true));

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
    const sc = Math.min(w, h) * 0.44, cx = w / 2, cy = h * 0.47;
    // onda que percorre o cérebro, como um impulso: as flores se abrem e se destacam
    const wave = ((t * 0.22) % 1.6) * 2.6 - 1.5;
    for (const p of pts) {
      const k = still ? 1 : ease((t - p.delay) / 2.2);
      const drift = p.amb ? 0.05 : 0.012;
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
