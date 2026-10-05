// Dra. Fabiana Mugnol — comportamento da página
// Rolagem suave (Lenis), revelação de texto, fundo por seção, fio do Caminhar Juntos,
// botão "Agendar" e as partículas (magnólia no topo, monograma FM no contato).

// Ajustes finos das partículas (equivalem aos controles do protótipo)
const MAGNOLIA = { profundidade: 70, giro: 0.5, forca: 0.8, vento: 3, fragmento: 3, intensidade: 0.7, tamanho: 7 };
const MONOGRAMA = { forca: 0, vento: 1, densidade: 0, intensidade: 0.6, tamanho: 4.5 };

const raiz = document.getElementById("raiz");
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Links ainda sem destino definitivo não levam a lugar nenhum
document.querySelectorAll("[data-pendente]").forEach((a) => {
  a.title = "Em breve";
  a.addEventListener("click", (e) => e.preventDefault());
});

// ---------- Revelação: texto que se assenta (leve desfoque + deslocamento) ----------
if (!calmo && "IntersectionObserver" in window) {
  document.documentElement.classList.add("revela-on");
  const io = new IntersectionObserver((entries) => {
    let i = 0;
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.style.transitionDelay = i++ * 90 + "ms";
      el.classList.add("visivel");
      setTimeout(() => { el.style.transitionDelay = ""; }, 1400);
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-revela]").forEach((el) => io.observe(el));
  // a tela de chegada já está à vista: revela tudo nela ao abrir (a faixa inferior
  // fica no rodapé da tela e não chegaria a cruzar a margem do observador)
  document.querySelectorAll(".pin__tela [data-revela]").forEach((el, i) => {
    io.unobserve(el);
    el.style.transitionDelay = i * 90 + "ms";
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("visivel")));
    setTimeout(() => { el.style.transitionDelay = ""; }, 1400);
  });
}

// ---------- Rolagem suave ----------
let lenis = null;
if (window.Lenis && !calmo) {
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, anchors: true });
}

// ---------- Elementos acompanhados a cada quadro ----------
const secs = [...document.querySelectorAll("[data-tom]")].map((el) => ({ el, c: hex(el.dataset.tom) }));
const fio = document.getElementById("fio");
const fioFill = document.getElementById("fio-fill");
const pilula = document.getElementById("pilula");
const pin = document.getElementById("pin");
const slotFlor = document.getElementById("slot-flor");
const slotFM = document.getElementById("slot-fm");
let pilulaOn = null;
let particulas = null; // preenchido quando o three.js carregar

function tick(t) {
  if (lenis) lenis.raf(t);
  const H = window.innerHeight;

  // fundo: interpola para o tom da seção quando o topo dela cruza 60% da tela
  let c = secs[0].c.slice(), ultimo = 0;
  for (let i = 1; i < secs.length; i++) {
    const top = secs[i].el.getBoundingClientRect().top;
    const k = Math.min(1, Math.max(0, (H * 0.6 - top) / (H * 0.16)));
    if (k > 0) {
      c = c.map((v, j) => v + (secs[i].c[j] - v) * k);
      if (i === secs.length - 1) ultimo = k;
    }
  }
  raiz.style.background = `rgb(${c.map(Math.round).join(",")})`;

  // fio do Caminhar Juntos
  const fr = fio.getBoundingClientRect();
  fioFill.style.transform = `scaleY(${Math.min(1, Math.max(0, (H * 0.6 - fr.top) / fr.height)).toFixed(4)})`;

  // botão "Agendar": aparece depois do topo e some no contato
  const on = window.scrollY > pin.offsetHeight - H + H * 0.3 && ultimo < 0.3;
  if (on !== pilulaOn) { pilulaOn = on; pilula.classList.toggle("on", on); }

  if (particulas) particulas.tick();
}

let raf = 0;
const loop = (t) => { raf = requestAnimationFrame(loop); tick(t); };
raf = requestAnimationFrame(loop);
// pausa quando a aba não está visível
document.addEventListener("visibilitychange", () => {
  cancelAnimationFrame(raf);
  if (!document.hidden) raf = requestAnimationFrame(loop);
});

// ---------- Partículas ----------
iniciarParticulas().catch((e) => {
  console.warn("Partículas indisponíveis", e);
  document.documentElement.classList.add("sem-webgl");
});

function suportaWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

async function iniciarParticulas() {
  if (!suportaWebGL()) throw new Error("sem WebGL");
  const THREE = await import("./vendor/three.module.min.js");
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const [img, logo] = await Promise.all([load("/assets/img/magnolia.webp"), load("/assets/img/monograma.webp")]);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(dpr);
  document.getElementById("palco").appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const col = (h) => new THREE.Color().setStyle(h, THREE.LinearSRGBColorSpace);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const t0 = performance.now();
  let cur = 0, curL = 0, ss = 1, rt = null, compScene, compCam, points = null, fm = null, larguraAnterior = 0;

  // fragmentos: grade com jitter (um a cada `passo` px) + mapa de espessura para o relevo 3D
  function amostrar(im, cssW, cssH, passo) {
    const pw = Math.max(1, Math.round(cssW)), ph = Math.max(1, Math.round(cssH));
    const c = document.createElement("canvas"); c.width = pw; c.height = ph;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(im, 0, 0, pw, ph);
    const d = ctx.getImageData(0, 0, pw, ph).data;
    const sw = Math.max(4, Math.round(pw / 10)), sh = Math.max(4, Math.round(ph / 10));
    const b = document.createElement("canvas"); b.width = sw; b.height = sh;
    const bx = b.getContext("2d", { willReadFrequently: true });
    bx.filter = "blur(2.5px)"; bx.drawImage(im, 0, 0, sw, sh);
    const bd = bx.getImageData(0, 0, sw, sh).data;
    const out = [];
    for (let y = passo / 2; y < ph; y += passo) for (let x = passo / 2; x < pw; x += passo) {
      const jx = Math.min(pw - 1, Math.max(0, Math.round(x + (Math.random() - 0.5) * passo * 0.9)));
      const jy = Math.min(ph - 1, Math.max(0, Math.round(y + (Math.random() - 0.5) * passo * 0.9)));
      const al = d[(jy * pw + jx) * 4 + 3] / 255;
      if (al < 0.4) continue;
      const th = bd[(Math.min(sh - 1, Math.floor(jy / ph * sh)) * sw + Math.min(sw - 1, Math.floor(jx / pw * sw))) * 4 + 3] / 255;
      out.push(jx - cssW / 2, cssH / 2 - jy, th, al);
    }
    return out;
  }

  // tamanho da tela, render target (supersampling 2×) e quad de composição
  function dimensionar() {
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setSize(W, H);
    Object.assign(camera, { left: -W / 2, right: W / 2, top: H / 2, bottom: -H / 2 });
    camera.updateProjectionMatrix();
    ss = Math.max(1, Math.min(2, 4096 / (W * dpr), 4096 / (H * dpr)));
    const rw = Math.round(W * dpr * ss), rh = Math.round(H * dpr * ss);
    if (!rt) {
      rt = new THREE.WebGLRenderTarget(rw, rh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
      compScene = new THREE.Scene();
      compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { tMap: { value: rt.texture } },
        transparent: true, depthTest: false, depthWrite: false,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
        fragmentShader: "uniform sampler2D tMap; varying vec2 vUv; void main(){ vec4 t = texture2D(tMap, vUv); if (t.a < 0.002) discard; gl_FragColor = vec4(t.rgb / t.a, t.a); }",
      }));
      quad.frustumCulled = false;
      compScene.add(quad);
    } else rt.setSize(rw, rh);
    if (points) points.material.uniforms.uDpr.value = dpr * ss;
    if (fm) { fm.material.uniforms.uDpr.value = dpr * ss; fm.material.uniforms.uView.value.set(W, H); }
  }

  // ----- Magnólia -----
  function build() {
    const r = slotFlor.getBoundingClientRect(), lr = slotFM.getBoundingClientRect();
    if (r.width < 10 || lr.width < 10) { setTimeout(build, 120); return; }
    larguraAnterior = window.innerWidth;
    dimensionar();
    const W = window.innerWidth, H = window.innerHeight;

    const passo = MAGNOLIA.fragmento;
    const cssH = Math.min(r.height * 0.96, r.width * 0.96 * img.height / img.width);
    const cssW = cssH * img.width / img.height;
    const flor = amostrar(img, cssW, cssH, passo);

    const n = flor.length / 4;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4), alpha = new Float32Array(n), cloud = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      pos[k * 3] = flor[k * 4]; pos[k * 3 + 1] = flor[k * 4 + 1]; pos[k * 3 + 2] = flor[k * 4 + 2]; alpha[k] = flor[k * 4 + 3];
      for (let q = 0; q < 4; q++) seed[k * 4 + q] = Math.random();
      // nuvem inicial: espalhada pela tela e em profundidade
      cloud[k * 3] = (Math.random() - 0.5) * W * 1.2;
      cloud[k * 3 + 1] = (Math.random() - 0.5) * H * 1.2;
      cloud[k * 3 + 2] = -700 + Math.random() * 950;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
    g.setAttribute("aCloud", new THREE.BufferAttribute(cloud, 3));

    const prev = points;
    const mat = prev ? prev.material : new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uP: { value: 0 },
        uOrigin: { value: new THREE.Vector2() }, uHalf: { value: new THREE.Vector2() }, uMouse: { value: new THREE.Vector2() },
        uDpr: { value: 1 }, uDepth: { value: MAGNOLIA.profundidade }, uSpin: { value: MAGNOLIA.giro }, uForce: { value: MAGNOLIA.forca },
        uWind: { value: MAGNOLIA.vento }, uVeil: { value: MAGNOLIA.intensidade }, uSize: { value: MAGNOLIA.tamanho },
        c0: { value: col("#5f454e") }, c1: { value: col("#a87776") }, c2: { value: col("#52594e") }, c3: { value: col("#96625f") }, c4: { value: col("#d8a8a2") },
      },
      vertexShader: `
        attribute vec4 aSeed; attribute float aAlpha; attribute vec3 aCloud;
        uniform float uTime, uP, uDpr, uDepth, uSpin, uSize, uForce, uWind, uVeil;
        uniform vec2 uOrigin, uHalf, uMouse;
        uniform vec3 c0, c1, c2, c3, c4;
        varying vec3 vCol; varying float vA, vRot, vFill, vPx;
        mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }
        void main(){
          float h = clamp((position.y + uHalf.y) / (2.*uHalf.y), 0., 1.);
          // relevo: miolo das pétalas avança, bordas recuam
          vec3 p = vec3(position.xy, (position.z - 0.45) * uDepth * 2. + (aSeed.z - 0.5) * uDepth * 0.4);
          p.z += sin(uTime*0.9 + aSeed.w*40.) * 5.;

          // surgimento: da base para o topo, cada fragmento com seu atraso
          float t = clamp(uP * 1.55 - (aSeed.w * 0.4 + h * 0.15), 0., 1.);
          float e = 1. - pow(1. - t, 3.);
          vec3 cl = aCloud - vec3(uOrigin, 0.);
          cl.x += sin(uTime*0.18 + aSeed.x*20.) * 40. * uWind;
          cl.y += cos(uTime*0.15 + aSeed.y*20.) * 40. * uWind;
          vec3 q = mix(cl, p, e);
          q.xz = rot((1. - e) * (aSeed.z - 0.5) * 4. * uForce) * q.xz;

          // giro 3D: uma volta inteira que assenta de frente + mouse
          float gp = clamp(uP, 0., 1.);
          float giro = (1. - gp*gp*(3. - 2.*gp)) * 6.2832 * uSpin;
          float ay = giro + sin(uTime*0.23) * 0.22 + uMouse.x * 0.32;
          float ax = sin(uTime*0.17 + 1.) * 0.07 + uMouse.y * 0.16;
          q.xz = rot(ay) * q.xz;
          q.yz = rot(ax) * q.yz;
          float persp = 1500. / (1500. - q.z);
          vec2 sp = q.xy * persp + uOrigin;

          float px = uSize * (0.7 + aSeed.x * 0.75) * persp;
          vec3 pal = aSeed.y < 0.34 ? c0 : (aSeed.y < 0.56 ? c1 : (aSeed.y < 0.72 ? c3 : (aSeed.y < 0.86 ? c4 : c2)));
          float fog = clamp(0.55 + q.z / (uDepth * 3. + 1.) * 0.45, 0.3, 1.);
          float aOn = aAlpha * (0.7 + aSeed.x * 0.3) * fog;
          float aOff = (0.16 + aSeed.x * 0.22) * uVeil;
          vA = mix(aOff, aOn, e);
          vCol = pal;
          vRot = aSeed.y * 6.2832 + uTime * (aSeed.z - 0.5) * (1.2 - e);
          vFill = aSeed.z;
          vPx = px;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(sp, 0., 1.);
          gl_PointSize = px * uDpr;
        }`,
      // cada fragmento é uma pétala: oval alongado, base estreita, nervura clara
      fragmentShader: `
        varying vec3 vCol; varying float vA, vRot, vFill, vPx;
        void main(){
          vec2 uv = (gl_PointCoord - 0.5) * 2.;
          float c = cos(vRot), s = sin(vRot);
          uv = mat2(c, -s, s, c) * uv;
          uv.y = -uv.y * 1.06;
          float w = 0.44 * (0.55 + 0.45 * smoothstep(-1., 0.55, uv.y)) * (0.85 + vFill * 0.3);
          float f = length(vec2(uv.x / w, uv.y));
          float d = (f - 1.) * w * vPx * 0.5;
          float shape = 1. - smoothstep(-0.55, 0.55, d);
          float veio = 0.82 + 0.18 * smoothstep(0., 0.8, abs(uv.x) / w);
          float a = vA * shape * veio;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vCol, a);
        }`,
    });
    mat.uniforms.uHalf.value.set(cssW / 2, cssH / 2);
    mat.uniforms.uDpr.value = dpr * ss;
    if (prev) { scene.remove(prev); prev.geometry.dispose(); }
    points = new THREE.Points(g, mat);
    points.frustumCulled = false;
    scene.add(points);
    buildFM(lr, W, H);
  }

  // ----- Monograma FM: pétalas chegam de todas as direções e ficam brancas ao assentar -----
  function buildFM(lr, W, H) {
    const lH = Math.min(lr.height * 0.94, lr.width * 0.94 * logo.height / logo.width), lW = lH * logo.width / logo.height;
    const st = 1.15, pw = Math.max(1, Math.round(lW / st)), ph = Math.max(1, Math.round(lH / st));
    const c = document.createElement("canvas"); c.width = pw; c.height = ph;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(logo, 0, 0, pw, ph);
    const d = ctx.getImageData(0, 0, pw, ph).data, pts = [];
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const a = d[(y * pw + x) * 4 + 3] / 255;
      if (a > 0.12) pts.push((x + 0.5 + (Math.random() - 0.5)) * st - lW / 2, lH / 2 - (y + 0.5 + (Math.random() - 0.5)) * st, a);
    }
    const ns = pts.length / 3, nh = Math.round(ns * MONOGRAMA.densidade), n = ns + nh;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4), halo = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const j = (k < ns ? k : Math.floor(Math.random() * ns)) * 3;
      pos[k * 3] = pts[j]; pos[k * 3 + 1] = pts[j + 1]; pos[k * 3 + 2] = pts[j + 2];
      for (let q = 0; q < 4; q++) seed[k * 4 + q] = Math.random();
      halo[k] = k < ns ? 0 : 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    g.setAttribute("aHalo", new THREE.BufferAttribute(halo, 1));
    const prev = fm;
    const mat = prev ? prev.material : new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uL: { value: 0 }, uDpr: { value: 1 },
        uForce: { value: MONOGRAMA.forca }, uWind: { value: MONOGRAMA.vento }, uVeil: { value: MONOGRAMA.intensidade }, uSize: { value: MONOGRAMA.tamanho },
        uOrigin: { value: new THREE.Vector2() }, uView: { value: new THREE.Vector2() }, cNude: { value: col("#e3d3ca") }, cRose: { value: col("#a87776") },
      },
      vertexShader: `
        attribute vec4 aSeed; attribute float aHalo;
        uniform float uTime, uL, uDpr, uForce, uWind, uVeil, uSize;
        uniform vec2 uOrigin, uView;
        uniform vec3 cNude, cRose;
        varying vec3 vCol; varying float vA, vRot, vFill, vPx;
        void main(){
          vec2 home = position.xy;
          // halo: poeira mais densa junto ao traço, rarefeita ao longe
          float ang = aSeed.x * 6.2832, rad = pow(aSeed.y, 2.4) * 240. * (0.6 + uForce * 0.4);
          vec2 hp = home + vec2(cos(ang), sin(ang)) * rad;
          hp += vec2(sin(uTime*0.3 + aSeed.z*20.) * 18., cos(uTime*0.26 + aSeed.w*20.) * 14.) * uWind;
          hp.x += sin(uTime*0.5 + home.y*0.012) * 10. * uWind;
          vec2 dest = mix(home, hp, aHalo);
          // origem: anel amplo em todas as direções, além das bordas da tela
          float ca = fract(aSeed.z * 3.71 + aSeed.w * 1.93) * 6.2832;
          float cr = 0.55 + fract(aSeed.x * 5.17 + aSeed.y * 2.3) * 0.75;
          vec2 cloud = vec2(cos(ca), sin(ca)) * uView * cr;
          cloud += vec2(sin(uTime*0.2 + aSeed.y*20.), cos(uTime*0.17 + aSeed.x*20.)) * 40. * uWind;
          float t = clamp(uL * 1.6 - aSeed.w * 0.6, 0., 1.);
          float e = 1. - pow(1. - t, 3.);
          vec2 dv = dest - cloud;
          // trajeto em espiral larga: ocupa a tela antes de concentrar no traço
          vec2 q = mix(cloud, dest, e) + vec2(-dv.y, dv.x) * e * (1. - e) * uForce * 1.6 * (aSeed.x - 0.5);
          q += vec2(sin(aSeed.w*40. + uTime*0.4), cos(aSeed.z*40. + uTime*0.35)) * uView * 0.18 * e * (1. - e) * (0.5 + uWind * 0.5);
          q += vec2(sin(uTime*1.3 + aSeed.y*30.), cos(uTime*1.1 + aSeed.x*30.)) * 0.6 * uWind * (1. - aHalo);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(q + uOrigin, 0., 1.);
          vPx = uSize * (0.7 + aSeed.x * 0.6) * mix(1., 0.85, aHalo);
          gl_PointSize = vPx * uDpr;
          float aStroke = position.z * 0.95;
          float aHaloA = uVeil * (0.25 + aSeed.z * 0.75) * (1. - pow(aSeed.y, 1.2) * 0.75);
          vA = mix(aStroke, aHaloA, aHalo) * smoothstep(0., 0.2, t) * mix(0.6, 1., e);
          // em voo: cores da página; ao assentar no FM: branco
          float cs = fract(aSeed.z * 7.31 + aSeed.x * 3.17);
          vec3 voo = cs < 0.25 ? cRose : (cs < 0.45 ? vec3(0.588, 0.384, 0.373) : (cs < 0.65 ? vec3(0.847, 0.659, 0.635) : (cs < 0.82 ? vec3(0.373, 0.271, 0.306) : cNude)));
          vCol = mix(voo, vec3(0.984, 0.969, 0.957), smoothstep(0.55, 1., e));
          vRot = aSeed.y * 6.2832 + uTime * (aSeed.z - 0.5) * 0.5;
          vFill = aSeed.z;
        }`,
      fragmentShader: `
        varying vec3 vCol; varying float vA, vRot, vFill, vPx;
        void main(){
          vec2 uv = (gl_PointCoord - 0.5) * 2.;
          float c = cos(vRot), s = sin(vRot);
          uv = mat2(c, -s, s, c) * uv;
          uv.y = -uv.y * 1.06;
          float w = 0.44 * (0.55 + 0.45 * smoothstep(-1., 0.55, uv.y)) * (0.85 + vFill * 0.3);
          float d = (length(vec2(uv.x / w, uv.y)) - 1.) * w * vPx * 0.5;
          float a = vA * (1. - smoothstep(-0.55, 0.55, d));
          if (a < 0.01) discard;
          gl_FragColor = vec4(vCol, a);
        }`,
    });
    mat.uniforms.uView.value.set(W, H);
    mat.uniforms.uDpr.value = dpr * ss;
    if (prev) { scene.remove(prev); prev.geometry.dispose(); }
    fm = new THREE.Points(g, mat);
    fm.frustumCulled = false;
    scene.add(fm);
  }

  build();
  if (document.fonts) document.fonts.ready.then(build);

  // no celular a barra de endereço muda a altura ao rolar: aí só redimensiona, sem refazer a flor
  let rt0;
  window.addEventListener("resize", () => {
    clearTimeout(rt0);
    rt0 = setTimeout(() => (window.innerWidth !== larguraAnterior ? build() : dimensionar()), 150);
  });
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / innerWidth * 2 - 1;
    mouse.ty = e.clientY / innerHeight * 2 - 1;
  }, { passive: true });

  particulas = {
    tick() {
      if (!points) return;
      const W = window.innerWidth, H = window.innerHeight;
      const u = points.material.uniforms;
      const r = slotFlor.getBoundingClientRect(), lr = slotFM.getBoundingClientRect();
      u.uOrigin.value.set(r.left + r.width / 2 - W / 2, H / 2 - (r.top + r.height / 2));

      // progresso do surgimento: enquanto o topo está fixo na tela
      const pr = pin.getBoundingClientRect();
      const tP = Math.min(1, Math.max(0, -pr.top / Math.max(1, (pr.height - H) * 0.85)));
      // monograma: quando o centro do slot passa de 105% para 55% da altura da tela
      const tL = Math.min(1, Math.max(0, (H * 1.05 - (lr.top + lr.height / 2)) / (H * 0.5)));
      const k = calmo ? 1 : 0.06;
      cur += ((calmo ? 1 : tP) - cur) * k;
      curL += (tL - curL) * k * 0.8;
      if (Math.abs(tP - cur) < 0.0005) cur = calmo ? 1 : tP;
      if (Math.abs(tL - curL) < 0.0005) curL = tL;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      u.uMouse.value.set(calmo ? 0 : mouse.x, calmo ? 0 : mouse.y);
      u.uP.value = cur;
      const tempo = calmo ? 0 : (performance.now() - t0) / 1000;
      u.uTime.value = tempo;
      if (fm) {
        const f = fm.material.uniforms;
        f.uOrigin.value.set(lr.left + lr.width / 2 - W / 2, H / 2 - (lr.top + lr.height / 2));
        f.uL.value = curL;
        f.uTime.value = tempo;
      }
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(compScene, compCam);
    },
  };
}
