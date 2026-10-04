// A fixed oblique camera and shaded, depth-sorted tubes make each cord's
// motion and its over/under crossings visible without a WebGL dependency.
const TAU = Math.PI * 2;
function rgb(hex) {
  const value = hex.trim().replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}
function mix(color, other, amount) {
  return `rgb(${color.map((v, i) => Math.round(v + (other[i] - v) * amount)).join(',')})`;
}
export function drawCords(canvas, model, mode, progress) {
  const width = canvas.clientWidth, height = 286;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== height * ratio) {
    canvas.width = Math.round(width * ratio);
    canvas.height = height * ratio;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const style = getComputedStyle(document.documentElement);
  const paper = style.getPropertyValue('--paper-current').trim();
  const ink = style.getPropertyValue('--ink-500-current').trim();
  const muted = style.getPropertyValue('--ink-300-current').trim();
  const accent = style.getPropertyValue('--accent-current').trim();
  const colors = [rgb(accent), rgb(ink)];
  // Fixed framing for each motion, including the extension of taut pull tails.
  const worldWidth = mode === 'rotate' ? 458 : mode === 'pull' ? 412 : 330;
  const scale = (width - 54) / worldWidth;
  const tube = Math.max(2.1, 3.2 * scale);
  const project = ({ x, y, z }) => {
    const horizontal = .956 * x + .292 * z;
    const depth = -.292 * x + .956 * z;
    return { x: width / 2 + horizontal * scale, y: 137 - (.985 * y - .174 * depth) * scale, z: .174 * y + .985 * depth };
  };
  const path = (points, stroke, weight = 1) => {
    ctx.beginPath();
    points.forEach((p, i) => { const q = project(p); if (!i) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
    ctx.strokeStyle = stroke;
    ctx.lineWidth = weight;
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const text = (label, x, y, color = muted, align = 'center') => {
    ctx.font = '15px "IM Fell English", Georgia, serif';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(label, x, y, width - 24);
  };

  // Soft reference marks are stationary: extension and local opening can be
  // judged against them without a moving camera making the model look alive.
  ctx.setLineDash([2, 5]);
  ctx.globalAlpha = .25;
  path([{ x: -220, y: 0, z: 0 }, { x: 220, y: 0, z: 0 }], muted);
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  for (const pair of model.pairs) path(pair, muted, .65);

  if (mode === 'rotate') {
    const orbit = Array.from({ length: 97 }, (_, i) => ({ x: model.span / 2 + 2, y: 23 * Math.cos(TAU * i / 96), z: 23 * Math.sin(TAU * i / 96) }));
    ctx.globalAlpha = .55;
    path(orbit, muted, 1);
    ctx.globalAlpha = 1;
    const theta = TAU * model.turns;
    path([{ x: model.span / 2 + 2, y: 0, z: 0 }, { x: model.span / 2 + 2, y: 23 * Math.cos(theta), z: 23 * Math.sin(theta) }], accent, 2);
  }

  const segments = [];
  model.curves.forEach((points, strand) => {
    for (let i = 1; i < points.length; i++) {
      const a = project(points[i - 1]), b = project(points[i]);
      segments.push({ a, b, strand, depth: (a.z + b.z) / 2 });
    }
  });
  segments.sort((a, b) => a.depth - b.depth);
  for (const { a, b, strand } of segments) {
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / length, ny = (b.x - a.x) / length;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const gradient = ctx.createLinearGradient(mx - nx * tube, my - ny * tube, mx + nx * tube, my + ny * tube);
    gradient.addColorStop(0, mix(colors[strand], [0, 0, 0], .32));
    gradient.addColorStop(.35, mix(colors[strand], [255, 248, 232], .40));
    gradient.addColorStop(.65, mix(colors[strand], [255, 248, 232], .10));
    gradient.addColorStop(1, mix(colors[strand], [0, 0, 0], .30));
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineWidth = tube * 2; ctx.lineCap = 'round'; ctx.strokeStyle = gradient; ctx.stroke();
  }

  // One material marker per cord travels with a fixed point along that cord.
  // It is drawn only on the visible side, never through an overlying cord.
  model.material.forEach((points, strand) => {
    const i = strand ? 224 : 96;
    const p = points[i];
    if (p.z < 0) return;
    const q = project(p);
    ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.2, tube * .48), 0, TAU);
    ctx.fillStyle = paper; ctx.fill();
  });

  const grip = (p, color) => {
    const q = project(p);
    ctx.fillStyle = paper; ctx.strokeStyle = color; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(q.x, q.y, tube + 2, 0, TAU); ctx.fill(); ctx.stroke();
  };
  if (mode === 'pull') {
    const left = model.curves[1][0], right = model.curves[0].at(-1);
    grip(left, ink); grip(right, accent);
    const a = project(left), b = project(right);
    const arrow = (x, y, direction) => {
      ctx.strokeStyle = accent; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x - direction * 23, y); ctx.lineTo(x, y);
      ctx.moveTo(x - direction * 5, y - 4); ctx.lineTo(x, y); ctx.lineTo(x - direction * 5, y + 4); ctx.stroke();
    };
    arrow(a.x - 3, a.y - 18, -1); arrow(b.x + 3, b.y + 18, 1);
    text('Pull opposite ends · no end rotation', width / 2, 30);
    text(progress < .02 ? 'Four turns, loosely intertwined' : progress < .9 ? 'The ends open; the middle tightens' : 'Open sections · winding remains in the middle', width / 2, 251, accent);
  } else if (mode === 'rotate') {
    model.curves.forEach((points, index) => grip(points.at(-1), index ? ink : accent));
    const left = project(model.curves[0][0]), right = project(model.curves[0].at(-1));
    text('No rotation', Math.max(44, left.x), 44);
    text('Turning end', Math.min(width - 47, right.x), 44, accent);
    text(`${model.turns.toFixed(1)} turns left · ${(4 - model.turns).toFixed(1)} end rotations`, width / 2, 251, accent);
  } else {
    for (const side of [0, 1]) {
      const x = (side ? 1 : -1) * model.span / 2;
      path([{ x, y: -23, z: 0 }, { x, y: 23, z: 0 }], muted, 2);
      model.curves.forEach((points, index) => grip(side ? points.at(-1) : points[0], index ? ink : accent));
    }
    text('Both ends held against rotation', width / 2, 30);
    text(progress < .02 ? 'Base pairs join the two strands' : 'Opening in the middle · extra twist on either side', width / 2, 251, accent);
  }
}
