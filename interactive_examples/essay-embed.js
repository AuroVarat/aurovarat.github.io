// Keep embedded figures aligned with the article theme and content height.
const root = document.documentElement;
const variables = ['--paper-current', '--ink-500-current', '--ink-300-current', '--border-current', '--accent-current', '--font-serif-current'];
try {
  if (window.parent !== window) {
    const parentRoot = window.parent.document.documentElement;
    const syncTheme = () => {
      const theme = getComputedStyle(parentRoot);
      variables.forEach((name) => root.style.setProperty(name, theme.getPropertyValue(name)));
    };
    syncTheme();
    new MutationObserver(syncTheme).observe(parentRoot, { attributes: true, attributeFilter: ['data-paper-tone', 'style'] });
  }
} catch { /* Standalone or cross-origin embeds keep the paper palette. */ }

const reportHeight = () => {
  if (window.parent !== window) window.parent.postMessage({ type: 'essay-illustration:resize', height: document.body.getBoundingClientRect().height }, window.location.origin);
};
new ResizeObserver(reportHeight).observe(document.body);
document.fonts.ready.then(reportHeight);

