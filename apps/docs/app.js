/* ── Theme ──────────────────────────────────────────────────────────────────── */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.dataset.theme === 'dark';
  html.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('axon-theme', html.dataset.theme);
  document.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
}

// Restore saved theme
(function() {
  const saved = localStorage.getItem('axon-theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = saved === 'dark' ? '🌙' : '☀️';
})();

/* ── Sidebar mobile ─────────────────────────────────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ── Copy code ──────────────────────────────────────────────────────────────── */
function copyCode(btn, text) {
  const content = typeof text === 'string' ? text : text;
  navigator.clipboard.writeText(content.trim()).then(() => {
    btn.classList.add('copied');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 1800);
  });
}

/* ── Search ─────────────────────────────────────────────────────────────────── */
const SEARCH_INDEX = [
  { title: 'Introduction', page: 'index.html', desc: 'What is AxonJS?' },
  { title: 'Quick Start', page: 'quick-start.html', desc: 'Set up in 5 minutes' },
  { title: 'Providers', page: 'providers.html', desc: 'Groq, Gemini, OpenAI' },
  { title: 'Agent', page: 'agent.html', desc: 'Core Agent class API' },
  { title: 'Tool Registry', page: 'tool-registry.html', desc: 'register, unregister, list' },
  { title: 'Custom Tools', page: 'custom-tools.html', desc: 'Register your own tools' },
  { title: 'useAgentDOM', page: 'use-agent-dom.html', desc: 'DOM scanning hook' },
  { title: 'useAxonSignals', page: 'use-axon-signals.html', desc: 'Signal handler hook' },
  { title: 'TypeScript Types', page: 'types.html', desc: 'AxonSignal, CoreMessage, etc.' },
  { title: 'FAQ', page: 'faq.html', desc: 'Common questions' },
  { title: 'Changelog', page: 'changelog.html', desc: 'Release history' },
  // Tools
  { title: 'interactWithScreen', page: 'tools/interact-with-screen.html', desc: 'Click or type on elements' },
  { title: 'readScreenText', page: 'tools/read-screen-text.html', desc: 'Read text of element' },
  { title: 'observeState', page: 'tools/observe-state.html', desc: 'Read DOM property' },
  { title: 'fillForm', page: 'tools/fill-form.html', desc: 'Batch-fill form fields' },
  { title: 'navigateTo', page: 'tools/navigate-to.html', desc: 'Navigate to URL' },
  { title: 'showNotification', page: 'tools/show-notification.html', desc: 'Toast notification' },
  { title: 'scrollTo', page: 'tools/scroll-to.html', desc: 'Scroll to element' },
  { title: 'copyToClipboard', page: 'tools/copy-to-clipboard.html', desc: 'Copy text to clipboard' },
  { title: 'toggleElement', page: 'tools/toggle-element.html', desc: 'Show/hide element' },
  { title: 'selectDropdown', page: 'tools/select-dropdown.html', desc: 'Set select value' },
  { title: 'highlightElement', page: 'tools/highlight-element.html', desc: 'Attention ring' },
  { title: 'waitForElement', page: 'tools/wait-for-element.html', desc: 'Poll until element appears' },
  { title: 'getPageUrl', page: 'tools/get-page-url.html', desc: 'Read current URL' },
  { title: 'setPageTitle', page: 'tools/set-page-title.html', desc: 'Update document.title' },
  { title: 'openModal', page: 'tools/open-modal.html', desc: 'Open/close modal' },
  { title: 'downloadFile', page: 'tools/download-file.html', desc: 'Trigger download' },
  { title: 'submitForm', page: 'tools/submit-form.html', desc: 'Submit form element' },
  { title: 'checkboxToggle', page: 'tools/checkbox-toggle.html', desc: 'Check/uncheck checkbox' },
  { title: 'setTheme', page: 'tools/set-theme.html', desc: 'Set data-theme on html' },
  { title: 'interactWith3DScene', page: 'tools/interact-with-3d-scene.html', desc: 'Control Spline 3D' },
];

let searchResults = null;
function handleSearch(query) {
  const wrap = document.querySelector('.search-wrap');
  if (!searchResults) {
    searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    wrap.appendChild(searchResults);
  }
  if (!query.trim()) { searchResults.style.display = 'none'; return; }
  const q = query.toLowerCase();
  const matches = SEARCH_INDEX.filter(i =>
    i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)
  ).slice(0, 8);
  if (!matches.length) { searchResults.style.display = 'none'; return; }
  searchResults.innerHTML = matches.map(m =>
    `<a href="${m.page}" class="search-result-item">
      <strong>${m.title}</strong>
      <span style="float:right;font-size:11px;color:var(--text-3)">${m.desc}</span>
     </a>`
  ).join('');
  searchResults.style.display = 'block';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap') && searchResults) {
    searchResults.style.display = 'none';
  }
});

// Keyboard shortcut ⌘K / Ctrl+K
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search')?.focus();
  }
  if (e.key === 'Escape') closeSidebar();
});

/* ── Active nav link ────────────────────────────────────────────────────────── */
(function() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    const name = href.split('/').pop();
    if (name === path) {
      a.classList.add('active');
      a.scrollIntoView({ block: 'nearest' });
    } else {
      a.classList.remove('active');
    }
  });
})();
