// Inextensible cord analogue, not an atomistic DNA simulation. Phase is
// redistributed continuously; only the rotating-end scene removes winding.
export const TURNS = 4;
const TAU = 2 * Math.PI;
const COUNT = 320;
const SPAN = 260;
const RADIUS = 14;
const smooth = (n) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const contourLength = (points) => points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);

function curve(span, phases, radii) {
  return phases.map((phase, i) => ({
    x: span * (i / COUNT - .5),
    y: radii[i] * Math.cos(phase),
    z: radii[i] * Math.sin(phase),
  }));
}
const initialPhases = Array.from({ length: COUNT + 1 }, (_, i) => TAU * TURNS * i / COUNT);
export const CORD_LENGTH = contourLength(curve(SPAN, initialPhases, initialPhases.map(() => RADIUS)));

function solve(low, high, target, measure) {
  for (let i = 0; i < 22; i++) {
    const mid = (low + high) / 2;
    if (measure(mid) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function materialPoints(points) {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distance(points[i], points[i - 1]));
  let segment = 1;
  return points.map((_, i) => {
    const at = cumulative.at(-1) * i / COUNT;
    while (segment < COUNT && cumulative[segment] < at) segment++;
    const t = (at - cumulative[segment - 1]) / (cumulative[segment] - cumulative[segment - 1]);
    const a = points[segment - 1], b = points[segment];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  });
}

function unwindingGeometry(progress) {
  const remaining = 1 - progress;
  // Release winding from the turning end. Beyond the release point the
  // whole straight tail shares the end's phase, so it rotates with the grip
  // instead of retaining a residual helix. Smooth only the joining region.
  const width = Math.min(.08, 2 * progress, 2 * remaining);
  const start = remaining - width / 2;
  const points = [];
  const segmentLength = CORD_LENGTH / COUNT;
  for (let i = 0; i <= COUNT; i++) {
    const u = i / COUNT;
    let winding = Math.min(u, remaining);
    if (width > 0 && u > start && u < start + width) {
      const t = (u - start) / width;
      // Integral of 1 - smooth(t); joins the helix to a straight tail.
      winding = start + width * (t - t ** 3 + .5 * t ** 4);
    }
    const phase = TAU * TURNS * winding;
    const y = RADIUS * Math.cos(phase), z = RADIUS * Math.sin(phase);
    const previous = points.at(-1);
    // Sample fixed material lengths. Lost circumferential length becomes
    // axial extension locally, without stretching the remaining braid.
    const x = previous ? previous.x + Math.sqrt(Math.max(0,
      segmentLength ** 2 - (y - previous.y) ** 2 - (z - previous.z) ** 2)) : 0;
    points.push({ x, y, z });
  }
  const span = points.at(-1).x;
  const a = points.map(({ x, y, z }) => ({ x: x - span / 2, y, z }));
  const b = a.map(({ x, y, z }) => ({ x, y: -y, z: -z }));
  return { curves: [a, b], material: [a, b], span, turns: TURNS * remaining, pairs: [] };
}

export function cordGeometry(mode, progress) {
  if (mode === 'rotate') return unwindingGeometry(progress);
  const p = smooth(progress);
  const density = [], extra = [], radii = [], phases = [0];
  for (let i = 0; i <= COUNT; i++) {
    const u = i / COUNT, centerDistance = Math.abs(u - .5);
    if (mode === 'pull') {
      // Compact support: once a section is pulled clear of the braid, its
      // winding is exactly zero. A decaying envelope leaves phantom curls.
      const tail = .3 * p;
      const edge = .035 * p;
      density.push(p === 0 ? 1 : smooth((u - tail) / edge) * smooth((1 - tail - u) / edge));
      // A free, tensioned tail is a straight line from grip to braid. Round
      // only the small contact region; do not bow the entire exposed tail.
      const fillet = .012 * p;
      const beyondBraid = centerDistance - (.5 - tail);
      const straightTail = p === 0 ? 0 : beyondBraid >= fillet ? beyondBraid
        : beyondBraid <= -fillet ? 0 : (beyondBraid + fillet) ** 2 / (4 * fillet);
      radii.push(RADIUS * (1 - .62 * p) + (25 / .3) * straightTail);
    } else if (mode === 'bubble') {
      const half = .25 * p;
      const unpaired = smooth((half - centerDistance) / .055);
      density.push(1 - unpaired);
      extra.push(32 * p * Math.pow(Math.max(0, 1 - (centerDistance / Math.max(half, .001)) ** 2), 2));
    } else {
      density.push(1);
      radii.push(RADIUS);
    }
  }
  for (let i = 1; i <= COUNT; i++) phases.push(phases[i - 1] + (density[i - 1] + density[i]) / 2);
  const turns = TURNS;
  const total = phases.at(-1);
  phases.forEach((value, i) => { phases[i] = value / total * TAU * turns; });

  let span = SPAN;
  if (mode === 'bubble') {
    // Fixed end positions and fixed contour length. Opening consumes slack;
    // the remaining braided section tightens slightly in radius.
    const radiusProfile = (radius) => extra.map((v, i) => {
      const u = i / COUNT;
      const interior = smooth(u / .1) * smooth((1 - u) / .1);
      return RADIUS + (radius - RADIUS) * interior + v;
    });
    const r = solve(2, RADIUS, CORD_LENGTH, (radius) => contourLength(curve(span, phases, radiusProfile(radius))));
    radii.push(...radiusProfile(r));
  } else {
    span = solve(1, CORD_LENGTH, CORD_LENGTH, (length) => contourLength(curve(length, phases, radii)));
  }
  const a = curve(span, phases, radii);
  const b = a.map(({ x, y, z }) => ({ x, y: -y, z: -z }));
  const pairs = [];
  if (mode === 'bubble') {
    for (let i = 4; i < COUNT; i += 8) if (density[i] > .95) pairs.push([a[i], b[i]]);
  }
  return { curves: [a, b], material: [materialPoints(a), materialPoints(b)], span, turns, pairs };
}
