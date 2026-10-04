import { player } from './dna-illustrations.js';
import { cordGeometry } from './cord-geometry.js';
import { drawCords } from './cord-renderer.js';

const canvas = document.querySelector('#drawing');
const observation = document.querySelector('#observation');
const modes = {
  pull: {
    title: 'Pulling intertwined cords without end rotation',
    explanation: 'Pull opposite ends. Sections near the ends straighten and open, while the remaining winding gathers between them.',
    stages: ['Pull the ends apart', 'Pulling · the end sections open', 'End sections open · middle still intertwined'],
    observations: [
      '<strong>Start with two intertwined cords.</strong> The marked ends are the ones being pulled. Their orientation is restrained.',
      '<strong>Some sections do separate.</strong> Watch the end sections straighten as the remaining winding gathers in the middle.',
      '<strong>Opening is not the same as unlinking.</strong> The end sections are open, but the cords are still wound around each other in the middle.',
    ],
  },
  rotate: {
    title: 'A rotating end unwinds two cords',
    explanation: 'Turn the right-hand end anticlockwise. The released sections straighten and rotate with it as each turn unwinds.',
    stages: ['Turn the right-hand end', 'Turning · straight sections rotate with the end', 'Four rotations · cords separated'],
    observations: [
      '<strong>Allow one end to turn.</strong> The small wheel marks the rotation; the other end keeps its orientation.',
      '<strong>The turns unwind one by one.</strong> The straight sections rotate anticlockwise with the end; no loose winding stays behind.',
      '<strong>Rotation removes the winding.</strong> These four turns need four end rotations. A long DNA molecule has many more.',
    ],
  },
  bubble: {
    title: 'Opening the middle with both ends held',
    explanation: 'Keep both ends in place and prevent rotation. Open a patch in the middle; the connections part there while the twists crowd into the flanks.',
    stages: ['Open the middle · ends held', 'Opening · the flanks take up the extra twist', 'Middle open · surrounding helix overwound'],
    observations: [
      '<strong>The ends cannot turn.</strong> Thin lines represent base pairs joining the two strands.',
      '<strong>Base pairs part in the middle.</strong> The strands bow apart there, while winding shifts into the regions on either side.',
      '<strong>The opening creates stress nearby.</strong> The surrounding helix is more tightly wound. No winding has escaped through the ends.',
    ],
  },
};
let mode = 'pull';
let previousMessage = '';
let currentProgress = 0;
let cachedKey = '', cachedModel;

function render(progress) {
  currentProgress = progress;
  const key = `${mode}:${progress}`;
  if (key !== cachedKey) {
    cachedModel = cordGeometry(mode, progress);
    cachedKey = key;
  }
  drawCords(canvas, cachedModel, mode, progress);
  const stage = progress < .1 ? 0 : progress < .85 ? 1 : 2;
  document.querySelector('#progress-label').textContent = modes[mode].stages[progress === 0 ? 0 : progress < 1 ? 1 : 2];
  const message = modes[mode].observations[stage];
  if (message !== previousMessage) {
    observation.innerHTML = message;
    canvas.setAttribute('aria-label', `${modes[mode].title}. ${observation.textContent}`);
    previousMessage = message;
  }
}

const playback = player(render, 14000);
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#explanation').textContent = modes[mode].explanation;
  playback.seek(0);
}));
// Canvas colours need a redraw when the containing article changes theme.
new MutationObserver(() => render(currentProgress)).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
document.fonts.ready.then(() => render(currentProgress));
