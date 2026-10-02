(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme toggle ── */
  const themeBtn = document.getElementById('themeBtn');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const syncThemeMeta = () => {
    if (themeMeta) themeMeta.content = root.dataset.theme === 'dark' ? '#0A0D1A' : '#EEF0F7';
  };
  syncThemeMeta();
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeMeta();
  });

  /* ── Mobile menu ── */
  const menuBtn = document.getElementById('menuBtn');
  const setMenu = (open) => {
    header.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('nav-open')));
  document.querySelectorAll('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ── Header state on scroll ── */
  const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 12);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ── Count-up numbers ── */
  const counters = document.querySelectorAll('.count');
  const format = (el, v) => {
    const dec = +(el.dataset.dec || 0);
    const locale = el.dataset.locale;
    const n = locale
      ? Math.round(v).toLocaleString(locale)
      : v.toFixed(dec);
    return (el.dataset.pre || '') + n + (el.dataset.suf || '');
  };
  const runCount = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = +el.dataset.to;
    if (reduceMotion) { el.textContent = format(el, to); return; }
    const dur = 1500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(el, to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!reduceMotion) counters.forEach((el) => { el.textContent = format(el, 0); });

  /* ── CSAT ring value ── */
  document.querySelectorAll('.ring').forEach((r) => {
    const pct = (+r.dataset.value / +r.dataset.max) * 100;
    r.style.setProperty('--pct', pct.toFixed(1));
  });

  /* ── Scroll reveal ── */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in');
        el.querySelectorAll('.count').forEach(runCount);
        if (el.classList.contains('count')) runCount(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
    counters.forEach(runCount);
  }

  /* ── Active nav link ── */
  const links = [...document.querySelectorAll('.nav a')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const setActive = (id) => links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  // The short contact section may never reach the observer's centre band.
  const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).pop();
      if (hit) setActive(atBottom() ? 'contact' : hit.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }
  window.addEventListener('scroll', () => { if (atBottom()) setActive('contact'); }, { passive: true });

  /* ── Timeline progress line ── */
  const timeline = document.getElementById('timeline');
  let ticking = false;
  const updateTimeline = () => {
    ticking = false;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = (vh * 0.6 - r.top) / r.height;
    timeline.style.setProperty('--progress', Math.max(0, Math.min(1, p)).toFixed(3));
  };
  updateTimeline();
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); }
  }, { passive: true });
  window.addEventListener('resize', updateTimeline);

  /* ── Tile spotlight follows cursor ── */
  document.querySelectorAll('.tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── Copy email ── */
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  document.getElementById('copyBtn').addEventListener('click', async (e) => {
    const text = e.currentTarget.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Email copied to clipboard');
    } catch (err) {
      showToast(text);
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
