/* scripts.js — preserves all features and keeps banner/header behavior consistent */

(() => {
  const CONFIG = {
    FORMSPREE_ENDPOINT: 'https://formspree.io/f/xrekvglz',
    OWNER_EMAIL: 'yadavaryan9661@gmail.com',
    OWNER_PHONE: '8002320860'
  };

  const doc = document;
  const paletteBtns = Array.from(doc.querySelectorAll('.palette-btn'));
  const THEME_KEY = 'sn:theme';
  const PALETTE_KEY = 'sn:palette';
  const themeToggle = doc.getElementById('theme-toggle');
  const navToggle = doc.getElementById('nav-toggle');
  const primaryNav = doc.getElementById('primary-nav');
  const form = doc.getElementById('contactForm');
  const formStatus = doc.getElementById('formStatus');
  const galleryThumbs = Array.from(doc.querySelectorAll('.gallery-item img.thumb'));
  const modal = doc.getElementById('modal');
  const modalImage = doc.getElementById('modal-image');
  const modalCaption = doc.getElementById('modal-caption');
  const modalClose = doc.getElementById('modal-close');
  const yearEl = doc.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Palette switcher
  function applyPalette(name) {
    document.documentElement.setAttribute('data-palette', name);
    paletteBtns.forEach(b => b.setAttribute('aria-checked', b.dataset.palette === name ? 'true' : 'false'));
    localStorage.setItem(PALETTE_KEY, name);
  }
  const savedPalette = localStorage.getItem(PALETTE_KEY) || 'sunset';
  applyPalette(savedPalette);
  paletteBtns.forEach(btn => btn.addEventListener('click', () => applyPalette(btn.dataset.palette)));

  // Theme toggle
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggle) { themeToggle.setAttribute('aria-pressed', 'true'); themeToggle.textContent = '☀️'; }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeToggle) { themeToggle.setAttribute('aria-pressed', 'false'); themeToggle.textContent = '🌙'; }
    }
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  if (themeToggle) themeToggle.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  // Mobile nav
  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      primaryNav.style.display = expanded ? '' : 'block';
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) primaryNav.style.display = ''; });
  }

  // Lazy load & reveal
  const lazyImgs = doc.querySelectorAll('img.lazy, img.thumb, img.responsive');
  const revealTargets = doc.querySelectorAll('.card, .feature, .gallery-item, .hero-content');
  const imgObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const src = img.dataset.src || img.getAttribute('data-src');
      if (src) { img.src = src; img.addEventListener('load', () => img.classList.add('loaded')); } else img.classList.add('loaded');
      obs.unobserve(img);
    });
  }, { root: null, rootMargin: '0px 0px 120px 0px', threshold: 0.05 });
  lazyImgs.forEach(i => imgObserver.observe(i));
  const revealObserver = new IntersectionObserver((entries, obs) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); } }); }, { threshold: 0.12 });
  revealTargets.forEach(t => revealObserver.observe(t));

  // Gallery modal
  function openModal(src, caption) {
    if (!modal) return;
    modalImage.src = src;
    modalImage.alt = caption || '';
    modalCaption.textContent = caption || '';
    modal.setAttribute('aria-hidden', 'false'); modal.style.display = 'flex'; modalClose && modalClose.focus(); document.body.style.overflow = 'hidden';
  }
  function closeModal() { if (!modal) return; modal.setAttribute('aria-hidden', 'true'); modal.style.display = 'none'; modalImage.src = ''; document.body.style.overflow = ''; }
  galleryThumbs.forEach(img => {
    img.tabIndex = 0;
    img.addEventListener('click', () => openModal(img.dataset.large || img.src, img.alt || ''));
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(img.dataset.large || img.src, img.alt || ''); } });
  });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (modal && modal.getAttribute('aria-hidden') === 'false') closeModal(); } });

  // Contact Form -> Formspree
  function showFormStatus(msg, isError = false) { if (!formStatus) return; formStatus.textContent = msg; formStatus.style.color = isError ? 'crimson' : 'green'; }
  function validate(data) { if (!data.name) return 'Please enter your name.'; if (!data.phone) return 'Please enter your phone number.'; if (!data.message) return 'Please enter a message.'; return ''; }
  async function postToFormspree(payload) {
    try {
      const body = new URLSearchParams(); Object.keys(payload).forEach(k => body.append(k, payload[k]));
      const res = await fetch(CONFIG.FORMSPREE_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json' }, body });
      if (res.ok) { showFormStatus('Thank you — your enquiry has been sent.'); form.reset(); } else { const j = await res.json().catch(()=>({})); showFormStatus('Failed to send: ' + (j.error || res.statusText), true); }
    } catch (err) { console.error('Formspree error', err); showFormStatus('Network error while sending — please try again later.', true); }
  }
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); showFormStatus('Processing...');
      const payload = { name: (doc.getElementById('name')||{}).value.trim(), email: (doc.getElementById('email')||{}).value.trim(), phone: (doc.getElementById('phone')||{}).value.trim(), message: (doc.getElementById('message')||{}).value.trim(), owner_email: CONFIG.OWNER_EMAIL, owner_phone: CONFIG.OWNER_PHONE, _subject: 'Website enquiry — Siksha Niketan School' };
      const v = validate(payload); if (v) { showFormStatus(v, true); return; }
      await postToFormspree(payload);
    });
  }

  // Smooth anchors
  doc.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href'); if (!href || href === '#') return; const target = doc.querySelector(href); if (!target) return;
    e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (navToggle && navToggle.getAttribute('aria-expanded') === 'true') navToggle.click();
  }));

})();
