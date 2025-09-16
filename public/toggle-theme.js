/**
 * Theme-only script: no imports here. Manages dark/light class and theme label.
 */

// 1) Core helpers
function getThemePreference() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.setAttribute('data-theme', theme);

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.setAttribute('aria-label', theme);

  // Visible text under the icon (if present)
  const themeBtnText = document.querySelector('.theme-btn-text');
  if (themeBtnText) themeBtnText.textContent = theme === 'dark' ? 'Light' : 'Dark';

  // Alternate id-based label under icon
  const themeLabel = document.getElementById('theme-label');
  if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';

  setTimeout(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      const bgColor = getComputedStyle(document.body).backgroundColor;
      metaThemeColor.setAttribute('content', bgColor);
    }
  }, 1);

  window.dispatchEvent(new CustomEvent('theme-change'));
}

function setupThemeControls() {
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn && !themeBtn.dataset.listenerAttached) {
    themeBtn.addEventListener('click', () => {
      const next = getThemePreference() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch {}
      applyTheme(next);
    });
    themeBtn.dataset.listenerAttached = 'true';
  }
}

// 2) Init
function initializeTheme() {
  applyTheme(getThemePreference());
  setupThemeControls();
}

document.addEventListener('DOMContentLoaded', initializeTheme);
document.addEventListener('astro:after-swap', initializeTheme);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const next = e.matches ? 'dark' : 'light';
  try { localStorage.setItem('theme', next); } catch {}
  applyTheme(next);
});
