// Configuração editável
const CONFIG = {
  whatsapp: "5551999999999", // número com DDI + DDD, só dígitos
  mensagem: "Olá! Gostaria de agendar uma consulta com a Dra. Fabiana Mugnol.",
  particula: "petalas", // "petalas" ou "triangulos"
};

// Links do WhatsApp
const num = CONFIG.whatsapp.replace(/\D/g, "");
document.querySelectorAll("[data-wa]").forEach((a) => {
  const msg = a.dataset.waMsg || CONFIG.mensagem;
  a.href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
});

// Constelação em forma de cérebro (hero)
(() => {
  const c = document.getElementById("constelacao");
  if (!c) return;
  const ctx = c.getContext("2d");
  const PAL = ["#5f454e", "#a87776", "#baa499", "#52594e", "#8f6f6c", "#7a5a62", "#9c8478"];
  const rnd = (a, b) => a + Math.random() * (b - a);
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
  while (pts.length < 1300) {
    const x = rnd(-1.05, 1.05), y = rnd(-0.85, 1.0);
    if (inBrain(x, y)) pts.push({ x, y, s: rnd(1.8, 4.6), a: rnd(0, 6.28), v: rnd(-0.3, 0.3), ph: rnd(0, 6.28), ci: Math.floor(rnd(0, 7)), al: rnd(0.35, 0.8) });
  }
  for (let i = 0; i < 110; i++) pts.push({ x: rnd(-1.6, 1.6), y: rnd(-1.5, 1.5), s: rnd(1.6, 3.4), a: rnd(0, 6.28), v: rnd(-0.2, 0.2), ph: rnd(0, 6.28), ci: Math.floor(rnd(0, 7)), al: rnd(0.12, 0.3), amb: true });

  const petala = CONFIG.particula !== "triangulos";
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mouse = { x: -9999, y: -9999 }, dim = { w: 0, h: 0, d: 1 }, visible = true, raf = 0;

  c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  c.addEventListener("pointerleave", () => { mouse = { x: -9999, y: -9999 }; });

  const resize = () => {
    const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    dim = { w: r.width, h: r.height, d };
  };

  const draw = (ms) => {
    const t = ms / 1000, { w, h, d } = dim;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
    const sc = Math.min(w, h) * 0.44, cx = w / 2, cy = h * 0.47;
    ctx.lineWidth = 0.8;
    for (const p of pts) {
      const drift = p.amb ? 0.05 : 0.01;
      let x = cx + (p.x + Math.sin(t * 0.35 + p.ph) * drift) * sc;
      let y = cy + (p.y + Math.cos(t * 0.3 + p.ph) * drift) * sc;
      const dx = x - mouse.x, dy = y - mouse.y, dd = Math.hypot(dx, dy);
      if (dd < 80) { const f = (80 - dd) / 80 * 16; x += dx / (dd || 1) * f; y += dy / (dd || 1) * f; }
      const a = p.a + t * p.v, s = p.s;
      ctx.globalAlpha = p.al * (0.7 + 0.3 * Math.sin(t * 0.9 + p.ph));
      const col = PAL[p.ci % PAL.length];
      ctx.beginPath();
      if (petala) {
        ctx.fillStyle = col; ctx.ellipse(x, y, s, s * 0.42, a, 0, 6.2832); ctx.fill();
      } else {
        ctx.strokeStyle = col;
        for (let k = 0; k < 3; k++) { const q = a + k * 2.094; const px = x + Math.cos(q) * s, py = y + Math.sin(q) * s; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath(); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const loop = (ms) => { draw(ms); raf = visible && !still ? requestAnimationFrame(loop) : 0; };
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

  new ResizeObserver(() => { resize(); if (still) draw(0); }).observe(c);
  // Pausa a animação fora da tela para poupar bateria
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(c);
  resize();
  start();
})();
