// Desenha uma pequena magnólia vista de lado, no estilo das ilustrações da marca.
// Ocupa ~1 x 1 com a base da flor em (0, 0.32). open: 0 = botão, 1 = aberta.
function drawMagnolia(ctx, open) {
  const petal = (ang, len, w) => {
    // a flor deve ser desenhada num canvas próprio e transparente (sprite)
    // pétala estreita na base, mais larga no meio e pontiaguda na ponta
    ctx.save();
    ctx.translate(0, 0.32);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w * 1.1, -len * 0.25, -w, -len * 0.7, 0, -len);
    ctx.bezierCurveTo(w, -len * 0.7, w * 1.1, -len * 0.25, 0, 0);
    // contorno vazado separa uma pétala da outra, como nas ilustrações
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 0.05; ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.fill();
    ctx.restore();
  };
  const o = open;
  const a = ctx.globalAlpha;
  // pétalas de trás, em tom mais suave
  ctx.globalAlpha = a * 0.5;
  petal(-0.42 - 0.5 * o, 0.62, 0.16);
  petal(0.42 + 0.5 * o, 0.62, 0.16);
  ctx.globalAlpha = a;
  // pétalas da frente
  petal(-0.2 - 0.36 * o, 0.72, 0.16);
  petal(0.2 + 0.36 * o, 0.72, 0.16);
  petal(0, 0.8, 0.15);
  // sépala e cabinho
  ctx.beginPath();
  ctx.moveTo(-0.11, 0.25);
  ctx.quadraticCurveTo(-0.02, 0.36, 0, 0.42);
  ctx.quadraticCurveTo(0.02, 0.36, 0.11, 0.25);
  ctx.quadraticCurveTo(0, 0.34, -0.11, 0.25);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0.4);
  ctx.quadraticCurveTo(0.03, 0.5, 0.01, 0.6);
  ctx.lineWidth = 0.035; ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
}
