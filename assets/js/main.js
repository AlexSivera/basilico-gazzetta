/* Basilico · La Gazzetta Italovalenciana
   JS sin dependencias. Todo el contenido existe en el HTML; esto solo añade
   idioma, estado en vivo, buscador de carta, reserva por WhatsApp y detalles. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  root.classList.add('js');
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  };

  /* ---------- Datos de horario (minutos desde 00:00, hora de Madrid) ---------- */
  const t = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const R = (a, b) => [t(a), t(b)];
  const HOURS = {
    tavernetta: {
      0: [R('13:00', '16:00'), R('20:00', '23:30')],
      1: [], 2: [],
      3: [R('12:30', '15:30'), R('20:00', '23:30')],
      4: [R('12:30', '15:30'), R('20:00', '23:30')],
      5: [R('12:30', '15:30'), R('20:00', '23:30')],
      6: [R('13:00', '16:00'), R('20:00', '24:00')],
    },
    // Horario de invierno publicado en Instagram (@basilico_spritz)
    spritz: {
      0: [R('12:00', '16:00')],
      1: [], 2: [], 3: [], 4: [],
      5: [R('19:00', '23:00')],
      6: [R('13:00', '16:00'), R('20:00', '23:00')],
    },
  };
  const VENUE = {
    tavernetta: { phone: '34652823117', tel: '652 823 117', es: 'Basilico Tavernetta (Beniarbeig)', en: 'Basilico Tavernetta (Beniarbeig)' },
    spritz: { phone: '34653888937', tel: '653 888 937', es: 'Basilico&Spritz (piscina de Benimeli)', en: 'Basilico&Spritz (Benimeli pool)' },
  };
  const MENU_DAYS = { semana: [3, 4, 5], finde: [6, 0] };
  const venue = d.body.dataset.venue || 'tavernetta';

  /* ---------- Tiempo en Madrid ---------- */
  function madridNow(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
    }).formatToParts(date);
    const o = {};
    parts.forEach((p) => { o[p.type] = p.value; });
    const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
    return { y: +o.year, m: +o.month, d: +o.day, dow, min: (+o.hour) * 60 + (+o.minute), iso: `${o.year}-${o.month}-${o.day}` };
  }
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const isoToDate = (iso) => { const [y, m, dd] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd, 12)); };
  const dowOf = (iso) => isoToDate(iso).getUTCDay();
  const addDays = (iso, n) => { const x = isoToDate(iso); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  function isoWeek(iso) {
    const x = isoToDate(iso);
    const day = (x.getUTCDay() + 6) % 7;
    x.setUTCDate(x.getUTCDate() - day + 3);
    const first = new Date(Date.UTC(x.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((x - first) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  }

  /* ---------- Idioma ---------- */
  let lang = 'es';
  const L = () => (lang === 'en' ? 'en-GB' : 'es-ES');
  const S = {
    es: {
      openNow: 'Abierto ahora', until: (x) => `hasta las ${x}`, closingAt: (x) => `cerramos a las ${x}`,
      closedNow: 'Cerrado ahora', openToday: (x) => `abrimos hoy a las ${x}`,
      openTomorrow: (x) => `abrimos mañana a las ${x}`, openOn: (dname, x) => `abrimos el ${dname} a las ${x}`,
      closed: 'Cerrado', todayH: 'Hoy', and: 'y', todayClosed: (dname) => `Hoy ${dname} descansamos.`,
      tickerOpen: (r) => `Hoy abrimos ${r}`, tickerClosed: (n) => `Hoy descansamos · ${n}`,
      range: (a, b) => `de ${a} a ${b}`, today: 'Hoy',
      menuToday: 'Hoy a mediodía', menuWeek: 'Esta semana', menuPast: 'Edición anterior', menuNext: 'Próxima edición',
      editionRange: (a, b) => `Del ${a} al ${b}`,
      frontToday: (name) => `Hoy a mediodía: ${name}`,
      frontPast: 'Nueva edición de los menús, en camino',
      frontPastTxt: 'Se publica cada semana en Instagram. Llámanos y te lo cantamos.',
      count: (n, q) => `${n} ${n === 1 ? 'plato' : 'platos'} con «${q}»`,
      none: 'Ese día no abrimos. Abrimos de miércoles a domingo.',
      noneSpritz: 'Ese día no abrimos. Horario de invierno: viernes noche, sábado y domingo a mediodía.',
      noSlotsToday: 'Para hoy ya no quedan horas por aquí: mejor llámanos.',
      big: 'Para grupos grandes, mejor llámanos y lo organizamos.',
      dogTerrace: 'Con perro, os ponemos en la terraza.',
      errName: 'Dinos tu nombre para la reserva.', errDate: 'Elige un día y una hora.',
      sent: 'Hemos abierto WhatsApp con tu mensaje. Si no se abrió, llámanos.',
      waHello: 'Hola Basilico, quería pedir mesa:', waVenue: 'Local', waDay: 'Día', waTime: 'Hora',
      waPeople: 'Personas', waZone: 'Preferencia', waDog: 'Venimos con perro', waName: 'Nombre', waNotes: 'Nota', waThanks: '¡Gracias!',
      zone: { terraza: 'terraza', interior: 'dentro' },
      edition: 'Edición nº',
    },
    en: {
      openNow: 'Open now', until: (x) => `until ${x}`, closingAt: (x) => `closing at ${x}`,
      closedNow: 'Closed now', openToday: (x) => `we open today at ${x}`,
      openTomorrow: (x) => `we open tomorrow at ${x}`, openOn: (dname, x) => `we open on ${dname} at ${x}`,
      closed: 'Closed', todayH: 'Today', and: 'and', todayClosed: (dname) => `We're closed today (${dname}).`,
      tickerOpen: (r) => `Today we're open ${r}`, tickerClosed: (n) => `Closed today · ${n}`,
      range: (a, b) => `${a}–${b}`, today: 'Today',
      menuToday: 'Today at lunch', menuWeek: 'This week', menuPast: 'Previous edition', menuNext: 'Next edition',
      editionRange: (a, b) => `${a} – ${b}`,
      frontToday: (name) => `Today at lunch: ${name}`,
      frontPast: 'A new edition of the set menus is on its way',
      frontPastTxt: 'Published every week on Instagram. Call us and we will tell you.',
      count: (n, q) => `${n} ${n === 1 ? 'dish' : 'dishes'} match «${q}»`,
      none: "We're closed that day. We open Wednesday to Sunday.",
      noneSpritz: "We're closed that day. Winter hours: Friday evening, Saturday and Sunday lunch.",
      noSlotsToday: 'No more online times for today: please call us.',
      big: 'For large groups, give us a call and we will organise it.',
      dogTerrace: "With a dog, we'll seat you on the terrace.",
      errName: 'Tell us your name for the booking.', errDate: 'Choose a day and a time.',
      sent: "WhatsApp is open with your message. If it didn't open, please call us.",
      waHello: 'Hello Basilico, I would like to book a table:', waVenue: 'Venue', waDay: 'Day', waTime: 'Time',
      waPeople: 'People', waZone: 'Preference', waDog: "We're bringing a dog", waName: 'Name', waNotes: 'Note', waThanks: 'Thank you!',
      zone: { terraza: 'terrace', interior: 'inside' },
      edition: 'Edition no.',
    },
  };
  const s = () => S[lang];
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const dayName = (dow) => new Intl.DateTimeFormat(L(), { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + dow, 12)));

  const ATTRS = ['alt', 'placeholder', 'aria-label'];
  function applyLang(next, { save = true } = {}) {
    lang = next === 'en' ? 'en' : 'es';
    root.lang = lang;
    $$('[data-en]').forEach((el) => {
      if (!('es' in el.dataset)) el.dataset.es = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.es;
    });
    ATTRS.forEach((a) => {
      const key = `en${a.replace(/(^|-)(\w)/g, (m, p, c) => c.toUpperCase())}`; // enAlt, enPlaceholder, enAriaLabel
      const keyEs = key.replace(/^en/, 'es');
      $$(`[data-en-${a}]`).forEach((el) => {
        if (!(keyEs in el.dataset)) el.dataset[keyEs] = el.getAttribute(a) || '';
        el.setAttribute(a, lang === 'en' ? el.dataset[key] : el.dataset[keyEs]);
      });
    });
    const tEn = d.querySelector('meta[name="title-en"]');
    if (tEn) { d.documentElement.dataset.titleEs ||= d.title; d.title = lang === 'en' ? tEn.content : d.documentElement.dataset.titleEs; }
    if (save) store.set('basilico-lang', lang);
    renderLive();
    if (typeof runSearch === 'function') runSearch();
  }

  /* ---------- Estado en vivo ---------- */
  function statusOf(v, now = madridNow()) {
    const H = HOURS[v];
    const today = H[now.dow] || [];
    for (const [a, b] of today) if (now.min >= a && now.min < b) return { open: true, until: b, soon: b - now.min <= 45 };
    const later = today.find(([a]) => a > now.min);
    if (later) return { open: false, inDays: 0, at: later[0] };
    for (let i = 1; i <= 7; i++) {
      const dw = (now.dow + i) % 7;
      if (H[dw] && H[dw].length) return { open: false, inDays: i, dow: dw, at: H[dw][0][0] };
    }
    return { open: false };
  }
  function statusText(st) {
    const x = s();
    if (st.open) return { head: x.openNow, tail: st.soon ? x.closingAt(hhmm(st.until)) : x.until(hhmm(st.until)) };
    let tail = '';
    if (st.inDays === 0) tail = x.openToday(hhmm(st.at));
    else if (st.inDays === 1) tail = x.openTomorrow(hhmm(st.at));
    else if (st.inDays > 1) tail = x.openOn(dayName(st.dow), hhmm(st.at));
    return { head: st.inDays === 0 ? x.closedNow : x.closed, tail };
  }
  function rangesText(ranges) {
    const x = s();
    return ranges.map(([a, b]) => x.range(hhmm(a), hhmm(b))).join(` ${x.and} `);
  }

  function renderLive() {
    const now = madridNow();
    const st = statusOf(venue, now);
    const txt = statusText(st);

    // Fecha de portada y número de edición (semana ISO)
    const dl = $('[data-dateline]');
    if (dl) dl.textContent = cap(new Intl.DateTimeFormat(L(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' }).format(new Date()));
    $$('[data-weekno]').forEach((el) => { el.textContent = isoWeek(now.iso); });

    const short = $('[data-status-short]');
    if (short) {
      short.textContent = `● ${txt.head}${txt.tail ? ' · ' + txt.tail : ''}`;
      short.classList.toggle('is-closed', !st.open);
    }
    const long = $('[data-status-long]');
    if (long) {
      long.innerHTML = `<span class="dot" aria-hidden="true"></span>${txt.head}<br><small>${cap(txt.tail || '')}</small>`;
      long.classList.toggle('is-closed', !st.open);
    }
    const todayRanges = HOURS[venue][now.dow] || [];
    const th = $('[data-today-hours]');
    if (th) th.textContent = todayRanges.length ? `${s().todayH}: ${rangesText(todayRanges)}.` : s().todayClosed(dayName(now.dow));
    const tk = $('[data-status-ticker]');
    if (tk) tk.textContent = todayRanges.length ? s().tickerOpen(rangesText(todayRanges)) : s().tickerClosed(cap(txt.tail || ''));
    syncTickerClones();

    // Tabla de horario: día de hoy
    $$('[data-hours] tr').forEach((tr) => {
      const isToday = +tr.dataset.day === now.dow;
      tr.classList.toggle('is-today', isToday);
      if (isToday) tr.querySelector('th').dataset.todayLabel = s().today;
    });

    renderMenus(now);
  }

  /* ---------- Menús de mediodía ---------- */
  const fmtShort = (iso) => new Intl.DateTimeFormat(L(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(isoToDate(iso)).replace('.', '');
  function renderMenus(now) {
    const cards = $$('.menu-card');
    if (!cards.length) return;
    let todayCard = null; let nextCard = null;
    cards.forEach((c) => {
      const { from, to } = c.dataset;
      const id = c.dataset.menu;
      const days = MENU_DAYS[id] || [];
      const state = c.querySelector('[data-state]');
      c.classList.remove('is-past', 'is-today', 'is-upcoming', 'is-current');
      let label = '';
      if (now.iso > to) { c.classList.add('is-past'); label = s().menuPast; }
      else if (now.iso < from) { c.classList.add('is-upcoming'); label = s().menuNext; nextCard ||= c; }
      else {
        const lunchOver = now.min > 16 * 60;
        if (days.includes(now.dow) && !lunchOver) { c.classList.add('is-today'); label = s().menuToday; todayCard = c; }
        else { c.classList.add('is-current'); label = s().menuWeek; nextCard ||= c; }
      }
      if (state) state.textContent = label;
      const ed = c.querySelector('[data-edition]');
      if (ed) ed.textContent = s().editionRange(fmtShort(from), fmtShort(to));
    });

    const fm = $('[data-front-menu]');
    if (!fm) return;
    const title = $('[data-front-menu-title]');
    const price = $('[data-front-menu-price]');
    const text = $('[data-front-menu-text]');
    const pick = todayCard || nextCard;
    const strip = (el) => { if (el) { delete el.dataset.en; delete el.dataset.es; } };
    [title, price, text].forEach(strip);
    if (pick) {
      const name = pick.querySelector('.menu-card__title').textContent.trim();
      const when = pick.querySelector('.menu-card__when').textContent.trim();
      title.textContent = todayCard ? s().frontToday(name) : name;
      price.textContent = pick.querySelector('.menu-card__price span').textContent.trim();
      const firstCourse = [...pick.querySelectorAll('.menu-card__course')].map((cc) => cc.querySelector('li')?.textContent.trim()).filter(Boolean).slice(0, 2).join(' · ');
      text.textContent = `${when}. ${firstCourse}…`;
    } else {
      title.textContent = s().frontPast;
      price.textContent = '16–20 €';
      text.textContent = s().frontPastTxt;
    }
  }

  /* ---------- Ticker ---------- */
  let tickerReady = false;
  function syncTickerClones() {
    const track = $('[data-ticker]');
    if (!track) return;
    $$('[data-clone]', track).forEach((n) => n.remove());
    const originals = [...track.children];
    originals.forEach((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.dataset.clone = '';
      c.querySelectorAll('[data-status-ticker]').forEach((x) => x.removeAttribute('data-status-ticker'));
      track.appendChild(c);
    });
    if (!tickerReady) { track.closest('.ticker').classList.add('is-ready'); tickerReady = true; }
  }

  /* ---------- Carta: buscador + navegación ---------- */
  const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const carta = $('[data-carta]');
  const search = $('[data-carta-search]');
  const countEl = $('[data-carta-count]');
  const emptyEl = $('[data-carta-empty]');
  let runSearch = null;
  if (carta && search) {
    const secs = $$('.carta-sec', carta);
    runSearch = () => {
      const raw = search.value;
      const q = norm(raw);
      const words = q.split(/\s+/).filter(Boolean);
      let total = 0;
      carta.classList.toggle('is-filtering', words.length > 0);
      secs.forEach((sec) => {
        const title = norm(sec.querySelector('.carta-sec__title').textContent + ' ' + (sec.querySelector('.carta-sec__title').dataset.en || '') + ' ' + (sec.querySelector('.carta-sec__title').dataset.es || ''));
        const secHit = words.length && words.every((w) => title.includes(w));
        let n = 0;
        $$('.dish', sec).forEach((li) => {
          const hit = !words.length || secHit || words.every((w) => li.dataset.search.includes(w));
          li.classList.toggle('is-hidden', !hit);
          li.classList.toggle('is-hit', words.length > 0 && hit && !secHit);
          if (hit) n++;
        });
        $$('.carta-sub', sec).forEach((sub) => { sub.hidden = words.length > 0 && !$$('.dish:not(.is-hidden)', sub).length; });
        sec.classList.toggle('is-hidden', words.length > 0 && n === 0);
        const chip = $(`.chip[data-cat="${sec.dataset.cat}"]`, carta);
        if (chip) chip.classList.toggle('is-empty', words.length > 0 && n === 0);
        total += n;
      });
      if (countEl) countEl.textContent = words.length ? s().count(total, raw.trim()) : '';
      if (emptyEl) emptyEl.hidden = !(words.length && total === 0);
    };
    let tmr;
    search.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(runSearch, 110); });
    search.addEventListener('keydown', (e) => { if (e.key === 'Escape') { search.value = ''; runSearch(); } });

    // Chip activo según la sección visible
    const chips = $$('.chip', carta);
    const list = $('.carta-nav__list', carta);
    const setActive = (id) => {
      chips.forEach((c) => c.classList.toggle('is-active', c.dataset.cat === id));
      const a = chips.find((c) => c.dataset.cat === id);
      if (a && list) list.scrollTo({ left: a.offsetLeft - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.dataset.cat); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secs.forEach((sec) => io.observe(sec));
    }
  }

  /* ---------- Reserva por WhatsApp ---------- */
  const dlg = $('[data-reserva]');
  if (dlg && typeof dlg.showModal === 'function') {
    const f = $('[data-reserva-form]', dlg);
    const fVenue = $('[data-r-venue]', dlg);
    const fDate = $('[data-r-date]', dlg);
    const fTime = $('[data-r-time]', dlg);
    const fPeople = $('[data-r-people]', dlg);
    const fZone = $('[data-r-zone]', dlg);
    const fDog = $('[data-r-dog]', dlg);
    const fName = $('[data-r-name]', dlg);
    const fNotes = $('[data-r-notes]', dlg);
    const dayMsg = $('[data-r-daymsg]', dlg);
    const err = $('[data-r-err]', dlg);
    const call = $('[data-r-call]', dlg);
    const phoneTxt = $('[data-r-phone]', dlg);
    let people = 2;

    const slotsFor = (v, iso) => {
      const now = madridNow();
      const ranges = HOURS[v][dowOf(iso)] || [];
      const out = [];
      ranges.forEach(([a, b]) => {
        const last = Math.max(a, b - 60);
        for (let m = a; m <= last; m += 15) out.push(m);
      });
      return iso === now.iso ? out.filter((m) => m >= now.min + 30) : out;
    };
    const firstOpenDay = (v) => {
      const now = madridNow();
      for (let i = 0; i < 14; i++) {
        const iso = addDays(now.iso, i);
        if (slotsFor(v, iso).length) return iso;
      }
      return now.iso;
    };
    const fillTimes = () => {
      const v = fVenue.value;
      const iso = fDate.value;
      fTime.innerHTML = '';
      dayMsg.textContent = '';
      if (!iso) return;
      const slots = slotsFor(v, iso);
      const ranges = HOURS[v][dowOf(iso)] || [];
      if (!slots.length) {
        fTime.disabled = true;
        dayMsg.textContent = ranges.length ? s().noSlotsToday : (v === 'spritz' ? s().noneSpritz : s().none);
        return;
      }
      fTime.disabled = false;
      slots.forEach((m) => {
        const o = d.createElement('option');
        o.value = hhmm(m); o.textContent = hhmm(m);
        fTime.appendChild(o);
      });
      // por defecto, primera hora de cena si existe
      const dinner = slots.find((m) => m >= 20 * 60 + 30) ?? slots[0];
      fTime.value = hhmm(dinner);
    };
    const syncVenue = () => {
      const v = VENUE[fVenue.value];
      call.href = `tel:+${v.phone}`;
      phoneTxt.textContent = v.tel;
    };
    const setPeople = (n) => {
      people = Math.min(40, Math.max(1, n));
      fPeople.textContent = people;
      if (people >= 10) dayMsg.textContent = s().big;
      else if (dayMsg.textContent === s().big) dayMsg.textContent = '';
    };

    const open = () => {
      err.textContent = ''; err.classList.add('field__msg--err');
      fVenue.value = venue;
      const today = madridNow().iso;
      fDate.min = today;
      fDate.max = addDays(today, 90);
      if (!fDate.value || fDate.value < today) fDate.value = firstOpenDay(fVenue.value);
      syncVenue();
      fillTimes();
      dlg.showModal();
    };
    $$('[data-open-reserva]').forEach((b) => b.addEventListener('click', open));
    $('[data-reserva-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    fVenue.addEventListener('change', () => { syncVenue(); if (!slotsFor(fVenue.value, fDate.value).length) fDate.value = firstOpenDay(fVenue.value); fillTimes(); });
    fDate.addEventListener('change', fillTimes);
    $$('[data-step]', dlg).forEach((b) => b.addEventListener('click', () => setPeople(people + Number(b.dataset.step))));
    fDog.addEventListener('change', () => {
      if (fDog.checked) { fZone.value = 'terraza'; dayMsg.textContent = s().dogTerrace; }
      else if (dayMsg.textContent === s().dogTerrace) dayMsg.textContent = '';
    });

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      err.classList.add('field__msg--err');
      if (!fDate.value || !fTime.value || fTime.disabled) { err.textContent = s().errDate; fDate.focus(); return; }
      if (!fName.value.trim()) { err.textContent = s().errName; fName.focus(); return; }
      const x = s();
      const v = VENUE[fVenue.value];
      const day = cap(new Intl.DateTimeFormat(L(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(isoToDate(fDate.value)));
      const lines = [
        x.waHello,
        `• ${x.waVenue}: ${v[lang]}`,
        `• ${x.waDay}: ${day}`,
        `• ${x.waTime}: ${fTime.value}`,
        `• ${x.waPeople}: ${people}`,
      ];
      if (fZone.value) lines.push(`• ${x.waZone}: ${x.zone[fZone.value]}`);
      if (fDog.checked) lines.push(`• ${x.waDog}`);
      lines.push(`• ${x.waName}: ${fName.value.trim()}`);
      if (fNotes.value.trim()) lines.push(`• ${x.waNotes}: ${fNotes.value.trim()}`);
      lines.push(x.waThanks);
      const url = `https://wa.me/${v.phone}?text=${encodeURIComponent(lines.join('\n'))}`;
      window.open(url, '_blank', 'noopener');
      err.classList.remove('field__msg--err');
      err.textContent = x.sent;
    });
  } else {
    // Navegadores sin <dialog>: reservar = llamar
    $$('[data-open-reserva]').forEach((b) => b.addEventListener('click', () => { location.href = `tel:+${VENUE[venue].phone}`; }));
  }

  /* ---------- Mapa bajo demanda (sin cookies de terceros hasta que se pide) ---------- */
  const mapBtn = $('[data-map-load]');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const fig = mapBtn.closest('[data-map]');
      const q = fig.dataset.mapQ || '38.8218426,-0.0023952';
      const ifr = d.createElement('iframe');
      ifr.src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed`;
      ifr.title = lang === 'en' ? 'Map' : 'Mapa';
      ifr.loading = 'lazy';
      ifr.referrerPolicy = 'no-referrer-when-downgrade';
      fig.replaceChildren(ifr);
    });
  }

  /* ---------- Navegación móvil ---------- */
  const burger = $('[data-burger]');
  const mob = $('[data-mobnav]');
  const dock = $('.dock');
  if (burger && mob) {
    const setOpen = (o) => {
      burger.setAttribute('aria-expanded', String(o));
      mob.hidden = !o;
      d.body.style.overflow = o ? 'hidden' : '';
      if (dock) dock.classList.toggle('is-hidden', o);
    };
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    mob.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mob.hidden) { setOpen(false); burger.focus(); } });
    matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Cabecera, enlace activo, revelados ---------- */
  const topbar = $('[data-topbar]');
  const onScroll = () => { if (topbar) topbar.classList.toggle('is-scrolled', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const navLinks = $$('.topnav a[href^="#"]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((sec) => io.observe(sec));

    if (!reduceMotion) {
      const targets = $$('.sec__intro, .menu-card, .letter, .ad, .ph, .suple__in, .visit > *, .casa__text');
      targets.forEach((el) => el.classList.add('reveal'));
      const rv = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); rv.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      targets.forEach((el) => rv.observe(el));
    }
    // Sucesos: la foto pasa de "impresa" (B/N) a color cuando la miras
    const live = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle('is-live', en.intersectionRatio > 0.55));
    }, { threshold: [0, 0.55, 1] });
    $$('.clip').forEach((c) => live.observe(c));
  }

  /* ---------- Arranque ---------- */
  const urlLang = new URLSearchParams(location.search).get('lang');
  const saved = store.get('basilico-lang');
  const nav = (navigator.language || 'es').toLowerCase();
  const initial = urlLang || saved || (/^(es|ca|gl|eu)/.test(nav) ? 'es' : 'en');
  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => applyLang(lang === 'es' ? 'en' : 'es')));
  if (initial === 'en') applyLang('en', { save: false });
  else renderLive();
  setInterval(renderLive, 60 * 1000);
})();
