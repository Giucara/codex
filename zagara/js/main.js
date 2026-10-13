/* ============================================================
   ZÀGARÀ · Prototipo homepage — script

   Un solo ciclo requestAnimationFrame governa: il fiore che si apre con lo
   scroll (con inerzia, avanti e indietro), il cursore personalizzato, lo
   zoom lento delle foto e lo stato dell'header. Il resto (rivelazione dei
   titoli, tab, lingua, menu, badge) è gestito da eventi.

   Per sostituire il fiore SVG con un timelapse fotografico reale:
     ZAGARA.useFrames(['frames/0001.jpg', 'frames/0002.jpg', ...])
   I fotogrammi vengono precaricati e disegnati su canvas in base allo scroll.
   ============================================================ */
(() => {
  'use strict';

  // TODO: sostituire con il link TheFork del ristorante.
  const THEFORK_URL = 'https://www.thefork.it/';
  const FRAMES = 120; // numero di fotogrammi mostrato nel contatore dell'hero

  const doc = document;
  const root = doc.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobileMQ = matchMedia('(max-width: 860px)');
  const isMobile = () => mobileMQ.matches;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  root.classList.add('js');

  /* ------------------------------------------------------------
     Testi: italiano letto dal DOM, inglese nel dizionario
     ------------------------------------------------------------ */
  const EN = {
    'nav.menu': 'Menu',
    'nav.book': 'Book',
    'nav.home': 'Home',
    'nav.chef': 'The chef',
    'nav.philo': 'Philosophy',
    'nav.menuSection': 'The menu',
    'nav.gallery': 'Gallery',
    'nav.bookSection': 'Book a table',
    'nav.contacts': 'Contacts',
    'hero.eyebrow': 'Fine dining restaurant · Catania',
    'hero.tag': 'Sicily, in bloom.',
    'hero.frame': 'Timelapse · frame',
    'hero.placeholder': 'placeholder sequence',
    'hero.hint': 'Scroll to bloom',
    'trust.fork': 'Guest rating',
    'trust.google': 'Verified reviews',
    'trust.priceLabel': 'Average price',
    'trust.price': 'per person, drinks excluded',
    'trust.legend': '* Placeholder values, to be replaced with real TheFork and Google data.',
    'chef.eyebrow': 'The chef',
    'chef.title': 'Massimiliano Romano',
    'chef.lead': 'Author cuisine born in Catania, looking out to the Mediterranean.',
    'chef.p1': 'Massimiliano Romano works by subtraction: few elements on the plate, ingredients chosen every morning, a clean flavour that stays in memory. Orange blossom, discreet and persistent, is the thread that ties the dishes to the city.',
    'chef.p2': 'In the dining room, attentive and unobtrusive service accompanies the journey from the first bite to coffee.',
    'chef.cta': 'Our story',
    'chef.photo': 'Portrait of the chef in the kitchen, natural light, vertical format',
    'ph.label': 'placeholder photo',
    'philo.eyebrow': 'Philosophy',
    'philo.title': 'The land sets the pace.',
    'philo.lead': 'Nothing enters the kitchen before its season.',
    'philo.p': 'We work with small producers from Etna, the Ionian coast and the Plain of Catania. Fish of the day, vegetables picked a few kilometres away, citrus only when it is at its best. The rest is time, measure and hand.',
    'philo.t1': 'Vineyards, hazelnuts and wild mountain herbs.',
    'philo.t2': "The day's catch from the harbours of Catania and Aci Trezza.",
    'philo.t3h': 'The Plain',
    'philo.t3': 'Citrus groves and gardens of the Catania plain.',
    'menu.eyebrow': 'The menu',
    'menu.title': 'At the table',
    'menu.tabCarta': 'À la carte',
    'menu.tabTours': 'Tasting menus',
    'menu.c1': 'Raw amberjack, orange blossom water, Avola almond',
    'menu.c1d': 'Marinated catch of the day, almond milk, orange blossom oil',
    'menu.c2': 'Violet artichoke, squid ink, tuna bottarga',
    'menu.c2d': 'Grilled over embers, squid jus, bergamot zest',
    'menu.c3': 'Spaghettone, sea urchin, wild fennel',
    'menu.c3d': 'Sicilian wheat, Ionian sea urchin, Etna herbs',
    'menu.c4': 'Orange blossom risotto, Mazara red prawn',
    'menu.c4d': 'Carnaroli rice, orange flowers, raw prawn, pink pepper',
    'menu.c5': 'Nebrodi lamb, chicory, orange honey',
    'menu.c5d': 'Rack cooked pink, wild chicory, orange blossom honey jus',
    'menu.c6': 'Almond milk, orange blossom, Bronte pistachio',
    'menu.c6d': 'Almond milk ice cream, orange blossom meringue, toasted pistachio',
    'menu.note': 'Indicative prices, to be confirmed. Cover and service included.',
    'menu.cta': 'Full menu',
    'menu.t1c': '5 courses',
    'menu.t1d': "A first encounter with Zàgarà's kitchen: the sea, the garden and an orange blossom dessert.",
    'menu.t1pair': 'Wine pairing, 3 glasses',
    'menu.t2c': '8 courses',
    'menu.t2d': 'The complete journey, from the Ionian coast to Etna. Served to the whole table, last seating at 9:30 pm.',
    'menu.t2pair': 'Wine pairing, 5 glasses',
    'menu.perPerson': 'per person',
    'menu.noteTours': 'Tasting menus are served to the whole table. Allergies and intolerances: please let us know when booking.',
    'gallery.eyebrow': 'The room and the dishes',
    'gallery.1': 'Signature dish, natural light, dark background',
    'gallery.2': 'The dining room at sunset, mise en place detail',
    'gallery.3': "The chef's hands while plating",
    'gallery.4': 'Orange blossom dessert, shot from above',
    'mq.1': 'Sicilian cuisine',
    'mq.2': 'Catania',
    'mq.4': 'Citrus blossom',
    'book.eyebrow': 'Reservations',
    'book.title': 'A table at Zàgarà',
    'book.lead': 'Online in seconds, or by phone.',
    'book.p': 'Book on TheFork or call us: we will be happy to arrange your evening, including groups and special occasions.',
    'book.cta': 'Book on TheFork',
    'book.call': 'Call',
    'hours.d1': 'Tuesday – Saturday',
    'hours.d2': 'Sunday',
    'hours.h2': 'lunch only',
    'hours.d3': 'Monday',
    'hours.h3': 'closed',
    'hours.note': 'Placeholder opening hours, to be confirmed.',
    'footer.tag': 'Fine dining restaurant · Chef Massimiliano Romano',
    'footer.where': 'Where we are',
    'footer.map': 'Open the map',
    'footer.contacts': 'Contacts',
    'footer.hours': 'Opening hours',
    'footer.vat': 'VAT no. placeholder',
    'footer.privacy': 'Privacy policy',
    'footer.cookie': 'Cookie policy',
  };
  const CURSOR_LABELS_EN = { Scopri: 'Discover', Chiama: 'Call', Apri: 'Open', TheFork: 'TheFork', '+': '+' };
  const UI = {
    it: { open: 'Apri il menu', close: 'Chiudi il menu', soon: 'Pagina in arrivo nel prototipo' },
    en: { open: 'Open menu', close: 'Close menu', soon: 'Page coming soon in this prototype' },
  };

  const IT = {};
  const i18nEls = Array.from(doc.querySelectorAll('[data-i18n]'));
  i18nEls.forEach((el) => {
    const key = el.dataset.i18n;
    if (!(key in IT)) IT[key] = el.textContent.trim().replace(/\s+/g, ' ');
  });
  let lang = 'it';

  /* ------------------------------------------------------------
     Link TheFork
     ------------------------------------------------------------ */
  doc.querySelectorAll('[data-thefork]').forEach((a) => {
    a.href = THEFORK_URL;
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ------------------------------------------------------------
     Fiore di zagara in SVG, generato e animato in base al progresso 0→1
     ------------------------------------------------------------ */
  function buildFlower(svg, { line = false } = {}) {
    const NS = 'http://www.w3.org/2000/svg';
    const el = (name, attrs, parent) => {
      const n = doc.createElementNS(NS, name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(n);
      return n;
    };
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const uid = 'fl' + Math.floor(Math.random() * 1e6);
    svg.textContent = '';

    if (!line) {
      const defs = el('defs', {});
      const pg = el('radialGradient', { id: uid + '-petal', cx: '50%', cy: '92%', r: '95%' }, defs);
      el('stop', { offset: '0', 'stop-color': '#E4D6BA' }, pg);
      el('stop', { offset: '0.45', 'stop-color': '#F4EEE2' }, pg);
      el('stop', { offset: '1', 'stop-color': '#FBF8F1' }, pg);
      const gg = el('radialGradient', { id: uid + '-glow' }, defs);
      el('stop', { offset: '0', 'stop-color': '#F4EEE2', 'stop-opacity': '0.2' }, gg);
      el('stop', { offset: '0.5', 'stop-color': '#F4EEE2', 'stop-opacity': '0.05' }, gg);
      el('stop', { offset: '1', 'stop-color': '#F4EEE2', 'stop-opacity': '0' }, gg);
      const sg = el('linearGradient', { id: uid + '-sepal', x1: '0', y1: '1', x2: '0', y2: '0' }, defs);
      el('stop', { offset: '0', 'stop-color': '#2E6A48' }, sg);
      el('stop', { offset: '1', 'stop-color': '#55956D' }, sg);
    }

    const glow = line ? null : el('circle', { r: 150, fill: `url(#${uid}-glow)` });

    // Foglie dietro al fiore
    const leaves = el('g', {});
    const leafD = 'M0,0 C 40,-34 96,-42 156,-18 C 124,30 70,58 0,0 Z';
    const leafStyle = line
      ? { fill: 'none', stroke: 'currentColor', 'stroke-width': '1', opacity: '0.55' }
      : { fill: '#224734', opacity: '0.95' };
    el('path', { d: leafD, transform: 'translate(-18,46) rotate(32) scale(1.15)', ...leafStyle }, leaves);
    el('path', { d: leafD, transform: 'translate(12,-26) rotate(-152) scale(0.95)', ...leafStyle }, leaves);
    const veinStyle = { fill: 'none', stroke: line ? 'currentColor' : 'rgba(244,238,226,0.12)', 'stroke-width': '1' };
    el('path', { d: 'M4,-2 C 50,-24 100,-30 152,-18', transform: 'translate(-18,46) rotate(32) scale(1.15)', ...veinStyle }, leaves);
    el('path', { d: 'M4,-2 C 50,-24 100,-30 152,-18', transform: 'translate(12,-26) rotate(-152) scale(0.95)', ...veinStyle }, leaves);

    const flower = el('g', {});

    // Sepali verdi
    const sepalD = 'M0,0 C 16,-22 12,-62 0,-84 C -12,-62 -16,-22 0,0 Z';
    const sepals = [];
    for (let i = 0; i < 5; i++) {
      sepals.push(el('path', {
        d: sepalD,
        fill: line ? 'none' : `url(#${uid}-sepal)`,
        stroke: line ? 'currentColor' : 'none',
        'stroke-width': '1',
      }, flower));
    }

    // Petali avorio (5, oblunghi come quelli dell'arancio)
    const petalD = 'M0,-6 C 26,-16 46,-70 36,-118 C 30,-146 -30,-146 -36,-118 C -46,-70 -26,-16 0,-6 Z';
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const g = el('g', {}, flower);
      el('path', {
        d: petalD,
        fill: line ? 'none' : `url(#${uid}-petal)`,
        stroke: line ? 'currentColor' : 'rgba(255,255,255,0.35)',
        'stroke-width': line ? '1' : '0.6',
      }, g);
      el('path', {
        d: 'M0,-14 C 2,-50 4,-90 0,-132',
        fill: 'none',
        stroke: line ? 'currentColor' : 'rgba(27,58,42,0.08)',
        'stroke-width': line ? '0.6' : '1',
        opacity: line ? '0.5' : '1',
      }, g);
      petals.push({ g, angle: i * 72 + (rnd() - 0.5) * 6 });
    }

    // Stami: filamenti chiari con antere dorate
    const stamens = [];
    const N = 24;
    for (let i = 0; i < N; i++) {
      const g = el('g', {}, flower);
      const len = 50 + rnd() * 28;
      el('path', {
        d: `M0,-8 Q ${((rnd() - 0.5) * 10).toFixed(1)},${(-len * 0.55).toFixed(1)} 0,${-len}`,
        fill: 'none',
        stroke: line ? 'currentColor' : '#EBDCA8',
        'stroke-width': '1.1',
      }, g);
      el('ellipse', { cy: -len, rx: 2.4, ry: 3.4, fill: line ? 'currentColor' : '#D9A441' }, g);
      stamens.push({ g, angle: (360 / N) * i + (rnd() - 0.5) * 10, delay: rnd() });
    }

    const pistil = el('circle', { r: 6, fill: line ? 'none' : '#A3BE80', stroke: line ? 'currentColor' : 'none' }, flower);

    return function update(p) {
      p = clamp(p, 0, 1);
      const e = easeInOut(p);
      flower.setAttribute('transform', `rotate(${((1 - e) * -38).toFixed(2)}) scale(${(0.7 + 0.3 * e).toFixed(3)})`);
      leaves.setAttribute('transform', `translate(0, ${((1 - e) * 26).toFixed(1)}) rotate(${((1 - e) * -6).toFixed(2)})`);
      if (glow) {
        glow.setAttribute('r', (90 + 110 * e).toFixed(1));
        glow.setAttribute('opacity', (0.15 + 0.85 * e).toFixed(3));
      }
      petals.forEach((pt, i) => {
        const pi = clamp((p - i * 0.045) / 0.78, 0, 1);
        const ei = easeInOut(pi);
        // Da bocciolo chiuso (petali stretti, avvolti a spirale) a fiore aperto
        const twist = (1 - ei) * 66;
        pt.g.setAttribute('transform', `rotate(${(pt.angle + twist).toFixed(2)}) scale(${(0.56 + 0.44 * ei).toFixed(3)}, ${(0.22 + 0.78 * ei).toFixed(3)})`);
      });
      sepals.forEach((s, i) => {
        s.setAttribute('transform', `rotate(${36 + i * 72}) scale(${(0.85 + 0.3 * e).toFixed(3)})`);
      });
      stamens.forEach((st) => {
        const ps = clamp((p - 0.42 - st.delay * 0.14) / 0.42, 0, 1);
        const es = easeOut(ps);
        st.g.setAttribute('transform', `rotate(${(st.angle + (1 - es) * 25).toFixed(2)}) scale(${(0.05 + 0.95 * es).toFixed(3)})`);
        st.g.setAttribute('opacity', es.toFixed(3));
      });
      pistil.setAttribute('r', (7 * easeOut(clamp((p - 0.4) / 0.4, 0, 1))).toFixed(2));
    };
  }

  /* ------------------------------------------------------------
     Hero: progresso dello scroll → fiore, variabili CSS, contatore
     ------------------------------------------------------------ */
  const hero = doc.querySelector('.hero');
  const flowerSvg = hero.querySelector('.flower');
  const frameEl = doc.getElementById('frame');
  let renderer = buildFlower(flowerSvg);
  let targetP = 0;
  let curP = 0;
  let lastP = -1;

  function heroTarget() {
    if (reduced) return 1;
    const rect = hero.getBoundingClientRect();
    const total = hero.offsetHeight - innerHeight;
    if (total <= 0) return 1;
    // Il fiore è completamente aperto all'88% della corsa: l'ultimo tratto
    // serve a far scorrere via la scena già sbocciata.
    return clamp(-rect.top / (total * 0.88), 0, 1);
  }

  function renderHero(p) {
    renderer(p);
    hero.style.setProperty('--p', p.toFixed(4));
    hero.style.setProperty('--pe', easeInOut(p).toFixed(4));
    if (frameEl) frameEl.textContent = String(Math.round(p * FRAMES)).padStart(3, '0');
  }

  // Sostituzione futura con un timelapse fotografico: fotogrammi su canvas.
  function useFrames(urls, { fit = 'cover' } = {}) {
    const wrap = hero.querySelector('.hero__flower');
    const canvas = doc.createElement('canvas');
    canvas.className = 'hero__frames';
    const ctx = canvas.getContext('2d');
    const imgs = urls.map((u) => { const im = new Image(); im.decoding = 'async'; im.src = u; return im; });
    let ready = false;

    const size = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    const draw = (p) => {
      if (!ready) return;
      const im = imgs[Math.round(clamp(p, 0, 1) * (imgs.length - 1))];
      if (!im || !im.naturalWidth) return;
      const k = fit === 'contain' ? Math.min : Math.max;
      const s = k(canvas.width / im.naturalWidth, canvas.height / im.naturalHeight);
      const w = im.naturalWidth * s;
      const h = im.naturalHeight * s;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(im, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };

    Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))).then(() => {
      ready = true;
      size();
      flowerSvg.remove();
      wrap.appendChild(canvas);
      renderer = draw;
      addEventListener('resize', () => { size(); draw(curP); });
      lastP = -1; // forza un ridisegno al prossimo frame
    });
    return draw;
  }

  /* ------------------------------------------------------------
     Rivelazione dei titoli: lettere (rotazione X) e parole
     ------------------------------------------------------------ */
  function split(el) {
    if (el.dataset.splitText == null) el.dataset.splitText = el.textContent.trim().replace(/\s+/g, ' ');
    const text = el.dataset.splitText;
    const byChars = el.classList.contains('split-chars');
    el.setAttribute('aria-label', text);
    const frag = doc.createDocumentFragment();
    let ci = 0;
    text.split(' ').forEach((word, wi, arr) => {
      const w = doc.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      if (byChars) {
        for (const ch of Array.from(word)) {
          const c = doc.createElement('span');
          c.className = 'c';
          c.textContent = ch;
          c.style.setProperty('--i', ci++);
          c.style.setProperty('--wi', wi);
          w.appendChild(c);
        }
      } else {
        const inner = doc.createElement('span');
        inner.className = 'wi';
        inner.textContent = word;
        inner.style.setProperty('--i', wi);
        w.appendChild(inner);
      }
      frag.appendChild(w);
      if (wi < arr.length - 1) frag.appendChild(doc.createTextNode(' '));
    });
    el.textContent = '';
    el.appendChild(frag);
  }
  doc.querySelectorAll('.split').forEach(split);

  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  doc.querySelectorAll('.split, .fade, .ph').forEach((el) => io.observe(el));

  /* ------------------------------------------------------------
     Zoom lento delle foto (desktop: per frame; mobile: transizione CSS)
     ------------------------------------------------------------ */
  const photos = Array.from(doc.querySelectorAll('.ph'));
  function updatePhotos() {
    if (isMobile()) return;
    const vh = innerHeight;
    for (const ph of photos) {
      const r = ph.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > vh) continue;
      const p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      const s = 1.15 - 0.15 * easeOut(p);
      ph.querySelector('.ph__media').style.transform = `scale(${s.toFixed(4)})`;
    }
  }
  mobileMQ.addEventListener('change', () => {
    if (isMobile()) photos.forEach((ph) => { ph.querySelector('.ph__media').style.transform = ''; });
  });

  /* ------------------------------------------------------------
     Header: traslucido allo scroll, chiaro/scuro in base alla sezione
     ------------------------------------------------------------ */
  const header = doc.querySelector('.site-header');
  const darkSections = [hero, ...doc.querySelectorAll('[data-dark], .footer')];
  function updateHeader() {
    header.classList.toggle('is-scrolled', scrollY > 24);
    const y = header.offsetHeight / 2;
    let onDark = root.classList.contains('nav-open');
    if (!onDark) {
      for (const s of darkSections) {
        const r = s.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) { onDark = true; break; }
      }
    }
    header.classList.toggle('on-dark', onDark);
  }

  /* ------------------------------------------------------------
     Menu a tutto schermo
     ------------------------------------------------------------ */
  const burger = doc.querySelector('.burger');
  function setNav(open) {
    root.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? UI[lang].close : UI[lang].open);
    updateHeader();
  }
  burger.addEventListener('click', () => setNav(!root.classList.contains('nav-open')));
  doc.querySelectorAll('.nav__list a').forEach((a) => a.addEventListener('click', () => setNav(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('nav-open')) setNav(false); });

  /* ------------------------------------------------------------
     Tab del menù
     ------------------------------------------------------------ */
  const tabs = Array.from(doc.querySelectorAll('.tab'));
  const panels = tabs.map((t) => doc.getElementById(t.getAttribute('aria-controls')));
  const ind = doc.querySelector('.tabs__ind');
  function moveInd() {
    const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    if (!t || !ind) return;
    ind.style.width = t.offsetWidth + 'px';
    ind.style.transform = `translateX(${t.offsetLeft}px)`;
  }
  function selectTab(i, focus) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
    moveInd();
    scrolled = true;
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        selectTab((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
      }
    });
  });

  /* ------------------------------------------------------------
     Percorsi: abbinamento vini opzionale aggiorna il prezzo
     ------------------------------------------------------------ */
  doc.querySelectorAll('.tour').forEach((card) => {
    const base = Number(card.dataset.price);
    const pair = Number(card.dataset.pair);
    const cb = card.querySelector('input');
    const out = card.querySelector('.tour__price b');
    cb.addEventListener('change', () => {
      out.classList.add('is-changing');
      setTimeout(() => {
        out.textContent = '€ ' + (base + (cb.checked ? pair : 0));
        out.classList.remove('is-changing');
      }, 200);
    });
  });

  /* ------------------------------------------------------------
     Lingua IT / EN
     ------------------------------------------------------------ */
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'it';
    root.setAttribute('lang', lang);
    const dict = lang === 'en' ? EN : IT;
    i18nEls.forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v == null) return;
      if (el.classList.contains('split')) {
        el.dataset.splitText = v;
        split(el);
      } else {
        el.textContent = v;
      }
    });
    doc.querySelectorAll('.lang [data-lang]').forEach((s) => s.classList.toggle('is-active', s.dataset.lang === lang));
    burger.setAttribute('aria-label', root.classList.contains('nav-open') ? UI[lang].close : UI[lang].open);
    try { localStorage.setItem('zagara-lang', lang); } catch (e) { /* storage non disponibile */ }
    moveInd();
  }
  doc.querySelector('.lang').addEventListener('click', () => setLang(lang === 'it' ? 'en' : 'it'));
  try {
    if (localStorage.getItem('zagara-lang') === 'en') setLang('en');
  } catch (e) { /* storage non disponibile */ }

  /* ------------------------------------------------------------
     Link segnaposto → avviso
     ------------------------------------------------------------ */
  const toast = doc.querySelector('.toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  }
  doc.querySelectorAll('a[href="#"]:not([data-thefork])').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); showToast(UI[lang].soon); });
  });

  /* ------------------------------------------------------------
     Cursore personalizzato (solo mouse, non su touch né con riduzione del movimento)
     ------------------------------------------------------------ */
  let cursorTick = null;
  if (finePointer && !reduced) {
    const cur = doc.querySelector('.cursor');
    const label = cur.querySelector('.cursor__label');
    root.classList.add('has-cursor');
    let mx = -100, my = -100, cx = -100, cy = -100, shown = false;

    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; cx = mx; cy = my; cur.classList.add('is-visible'); }
    }, { passive: true });
    doc.addEventListener('mouseleave', () => cur.classList.remove('is-visible'));
    doc.addEventListener('mouseenter', () => { if (shown) cur.classList.add('is-visible'); });
    addEventListener('mousedown', () => cur.classList.add('is-down'));
    addEventListener('mouseup', () => cur.classList.remove('is-down'));

    doc.addEventListener('mouseover', (e) => {
      const t = e.target.closest ? e.target.closest('[data-cursor], a, button, label, input') : null;
      if (!t) { cur.dataset.state = ''; return; }
      const state = t.dataset.cursor || 'link';
      cur.dataset.state = state;
      if (state === 'label') {
        const raw = t.dataset.cursorLabel || 'Scopri';
        const txt = lang === 'en' ? (CURSOR_LABELS_EN[raw] || raw) : raw;
        label.textContent = txt;
        label.classList.toggle('is-plus', txt === '+');
      }
    });

    cursorTick = () => {
      cx = lerp(cx, mx, 0.18);
      cy = lerp(cy, my, 0.18);
      cur.style.transform = `translate3d(${(cx - 12).toFixed(2)}px, ${(cy - 12).toFixed(2)}px, 0)`;
    };
  }

  /* ------------------------------------------------------------
     Fiore decorativo nella sezione prenotazione (aperto, a tratto)
     ------------------------------------------------------------ */
  const bookFlower = doc.querySelector('.book__flower');
  if (bookFlower) buildFlower(bookFlower, { line: true })(1);

  /* ------------------------------------------------------------
     Ciclo principale
     ------------------------------------------------------------ */
  let scrolled = true;
  addEventListener('scroll', () => { scrolled = true; }, { passive: true });
  addEventListener('resize', () => { scrolled = true; moveInd(); });

  function loop() {
    targetP = heroTarget();
    const k = reduced ? 1 : 0.1;
    curP = Math.abs(targetP - curP) < 0.0004 ? targetP : lerp(curP, targetP, k);
    if (curP !== lastP) {
      renderHero(curP);
      lastP = curP;
    }
    if (scrolled) {
      updateHeader();
      updatePhotos();
      scrolled = false;
    }
    if (cursorTick) cursorTick();
    requestAnimationFrame(loop);
  }
  renderHero(reduced ? 1 : 0);
  moveInd();
  requestAnimationFrame(loop);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(moveInd);

  /* API minima per la sostituzione del timelapse e i test */
  window.ZAGARA = {
    useFrames,
    setLang,
    getProgress: () => curP,
    THEFORK_URL,
  };
})();
