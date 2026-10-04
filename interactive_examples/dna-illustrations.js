// Playback controls for the cord illustration.
import './essay-embed.js';

const clamp = (value) => Math.max(0, Math.min(1, value));

export function player(render, duration = 9000) {
  const slider = document.querySelector('#progress');
  const button = document.querySelector('#play');
  const reset = document.querySelector('#reset');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let progress = 0, playing = false, frame = 0, last = 0;
  const update = () => {
    slider.value = String(Math.round(progress * 1000));
    render(progress);
  };
  const pause = () => {
    playing = false;
    cancelAnimationFrame(frame);
    button.textContent = reducedMotion.matches ? 'Next step' : '▶ Play';
    button.setAttribute('aria-label', reducedMotion.matches ? 'Show next animation step' : 'Play animation');
  };
  const seek = (value) => { pause(); progress = clamp(value); update(); };
  const tick = (time) => {
    if (!playing) return;
    progress = clamp(progress + Math.min(time - last, 60) / duration);
    last = time;
    update();
    if (progress >= 1) pause();
    else frame = requestAnimationFrame(tick);
  };
  button.addEventListener('click', () => {
    if (reducedMotion.matches) { seek(progress < .5 ? .5 : progress < 1 ? 1 : 0); return; }
    if (playing) { pause(); return; }
    if (progress >= 1) progress = 0;
    playing = true;
    button.textContent = 'Ⅱ Pause';
    button.setAttribute('aria-label', 'Pause animation');
    last = performance.now();
    frame = requestAnimationFrame(tick);
  });
  slider.addEventListener('input', () => seek(Number(slider.value) / 1000));
  reset.addEventListener('click', () => seek(0));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); }).observe(document.querySelector('main'));
  reducedMotion.addEventListener('change', pause);
  new ResizeObserver(update).observe(document.querySelector('.drawing'));
  pause();
  update();
  return { seek, update };
}
