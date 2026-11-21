(function () {
  "use strict";

  const data = window.SHELF || { books: [] };
  const books = data.books.slice();
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const state = { genres: new Set(), q: "", sort: "recent" };

  /* ───────── helpers ───────── */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FORMAT = { print: "Book", ebook: "E-book", audio: "Audiobook" };
  const STATUS_LABEL = { read: "Read", reading: "Reading now", want: "To read" };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seriesLabel = (b) => (b.series ? b.series + (b.seriesNumber ? ` #${b.seriesNumber}` : "") : "");

  const icon = {
    star: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="m10 1.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"/></svg>',
    half: '<svg viewBox="0 0 20 20" aria-hidden="true"><defs><linearGradient id="hs"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="var(--fill)"/></linearGradient></defs><path fill="url(#hs)" d="m10 1.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    book: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3.2c2-.9 4-.9 6 .4 2-1.3 4-1.3 6-.4V13c-2-.9-4-.9-6 .4-2-1.3-4-1.3-6-.4z"/></svg>',
    heart: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 14s-5.5-3.3-5.5-7.4A3 3 0 0 1 8 4.8a3 3 0 0 1 5.5 1.8C13.5 10.7 8 14 8 14z"/></svg>',
    check: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 8.5 3 3 7-7"/></svg>'
  };

  const stars = (n) => {
    if (!n) return "";
    let out = `<span class="stars" role="img" aria-label="${n} out of 5 stars">`;
    for (let i = 1; i <= 5; i++) {
      out += n >= i ? icon.star : n >= i - 0.5 ? icon.half : icon.star.replace('fill="currentColor"', 'fill="currentColor" class="off"');
    }
    return out + "</span>";
  };

  // Placeholder tile colours: warm, muted, picked by title so they stay stable.
  const SWATCH = ["#c8553d", "#2f4858", "#86626e", "#6b8f71", "#c58940", "#3d5a80", "#8d6a9f", "#5f6f52", "#a44a3f", "#33658a"];
  const swatch = (s) => SWATCH[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % SWATCH.length];
  const placeholder = (b) => `
    <div class="ph" style="--ph:${swatch(b.title)}">
      <span class="ph__title">${esc(b.title)}</span>
      <span class="ph__author">${esc(b.author)}</span>
    </div>`;

  // Image aspect ratios learned as covers load; used to balance masonry columns.
  const ratios = new Map();

  /* ───────── hero collage ───────── */
  // Six covers: the hand-picked ones from HERO_BOOKS first (in slot order),
  // topped up with a daily shuffle if fewer than six are set.
  function renderCollage() {
    const chosen = (data.hero || []).map((id) => books.find((b) => b.id === id)).filter((b) => b && b.cover);
    let seed = Math.floor(Date.now() / 864e5);
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const rest = books.filter((b) => b.cover && !chosen.includes(b)).sort(() => rand() - 0.5);
    const picks = [...chosen, ...rest].slice(0, 6);
    $("[data-collage]").innerHTML = picks.map((b, n) => `
      <a class="collage__tile" href="#book/${esc(b.id)}" data-open="${esc(b.id)}" style="--n:${n}" aria-label="${esc(b.title)} by ${esc(b.author)}">
        <img src="${esc(b.cover)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" data-cover>
      </a>`).join("");
  }

  /* ───────── intro ───────── */
  const count = (fn) => books.filter(fn).length;

  function renderIntro() {
    const owner = data.owner;
    $$("[data-owner]").forEach((el) => (el.textContent = owner ? `${owner}'s` : "My"));
    $$("[data-owner-plain]").forEach((el) => (el.textContent = owner || "me"));
    $("[data-tagline]").textContent = data.tagline || "";
    if (owner) document.title = `${owner}'s Shelf · Book recommendations`;

    const stats = {
      total: books.length,
      authors: new Set(books.map((b) => b.author)).size,
      genres: new Set(books.flatMap((b) => b.genres || [])).size,
      series: new Set(books.map((b) => b.series).filter(Boolean)).size
    };
    Object.entries(stats).forEach(([k, v]) => countUp($(`[data-stat="${k}"]`), v));
    const years = books.map((b) => b.readYear).filter(Boolean);
    $("[data-updated]").textContent = years.length ? Math.max(...years) : "";
  }

  function countUp(el, target) {
    if (!el) return;
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    const t0 = performance.now(), dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ───────── filters ───────── */
  const ALL_GENRES = (() => {
    const c = {};
    books.forEach((b) => (b.genres || []).forEach((g) => (c[g] = (c[g] || 0) + 1)));
    return Object.keys(c).sort((a, b) => c[b] - c[a] || a.localeCompare(b));
  })();
  const xIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  const tickIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3 3 7-7"/></svg>';

  // Genre counts show "what you'd get if you picked this" given the current search.
  const matchGenre = (b, set = state.genres) => !set.size || (b.genres || []).some((g) => set.has(g));
  const matchQuery = (b) => {
    const q = state.q.trim().toLowerCase();
    return !q || `${b.title} ${b.author} ${b.series || ""} ${(b.genres || []).join(" ")} ${(b.tags || []).join(" ")}`.toLowerCase().includes(q);
  };

  function renderFilters() {
    // Genre chips: selected first, then by size.
    const pool = books.filter(matchQuery);
    const counts = {};
    pool.forEach((b) => (b.genres || []).forEach((g) => (counts[g] = (counts[g] || 0) + 1)));
    const order = [...ALL_GENRES].sort((a, b) => state.genres.has(b) - state.genres.has(a) || (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b));
    $("[data-genres]").innerHTML = order.map((g) => {
      const on = state.genres.has(g), n = counts[g] || 0;
      return `<button class="genre${!on && !n ? " is-empty" : ""}" type="button" data-genre-chip="${esc(g)}" aria-pressed="${on}">${tickIcon}${esc(g)}<span class="n">${n}</span></button>`;
    }).join("");
    updateArrows();

    // Active filter chips next to the feed title
    const chips = [];
    state.genres.forEach((g) => chips.push(`<button class="active__chip" type="button" data-remove="genre" data-value="${esc(g)}" aria-label="Remove filter: ${esc(g)}">${esc(g)}${xIcon}</button>`));
    if (state.q.trim()) chips.push(`<button class="active__chip" type="button" data-remove="q" aria-label="Clear search">“${esc(state.q.trim())}”${xIcon}</button>`);
    if (chips.length > 1) chips.push('<button class="active__clear" type="button" data-clear>Clear all</button>');
    $("[data-active]").innerHTML = chips.join("");
  }

  function feedTitle() {
    const g = [...state.genres];
    return "Everything on the shelf" + (g.length ? ` · ${g.length > 2 ? `${g.length} genres` : g.join(" + ")}` : "");
  }

  function filtered() {
    const list = books.filter((b) => matchGenre(b) && matchQuery(b));
    const by = {
      recent: (a, b) => (b.readYear || 0) - (a.readYear || 0) || a.title.localeCompare(b.title),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0) || a.title.localeCompare(b.title),
      title: (a, b) => a.title.replace(/^(the|a|an) /i, "").localeCompare(b.title.replace(/^(the|a|an) /i, "")),
      author: (a, b) => a.author.split(",")[0].trim().split(" ").pop().localeCompare(b.author.split(",")[0].trim().split(" ").pop()) || a.title.localeCompare(b.title),
      series: (a, b) => (a.series || "￿").localeCompare(b.series || "￿") || (a.seriesNumber || 0) - (b.seriesNumber || 0) || a.title.localeCompare(b.title)
    };
    return list.sort(by[state.sort]);
  }

  // Filters live in the URL (?genre=Horror|Mystery&q=…&sort=…) so a view can be shared.
  function writeURL() {
    const p = new URLSearchParams();
    if (state.genres.size) p.set("genre", [...state.genres].join("|"));
    if (state.q.trim()) p.set("q", state.q.trim());
    if (state.sort !== "recent") p.set("sort", state.sort);
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }
  function readURL() {
    const p = new URLSearchParams(location.search);
    (p.get("genre") || "").split("|").filter((g) => ALL_GENRES.includes(g)).forEach((g) => state.genres.add(g));
    state.q = p.get("q") || "";
    if (["recent", "rating", "title", "author", "series"].includes(p.get("sort"))) state.sort = p.get("sort");
    $("[data-search]").value = state.q;
    $("[data-sort]").value = state.sort;
  }

  function apply() {
    renderFilters();
    renderFeed();
    writeURL();
  }
  function clearAll() {
    state.genres.clear(); state.q = "";
    $("[data-search]").value = "";
    apply();
  }

  // Scroll an element horizontally with our own easing (native smooth scroll is unreliable in some embeds).
  function glide(el, dx) {
    const from = el.scrollLeft, to = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, from + dx));
    if (reduceMotion) { el.scrollLeft = to; return; }
    const t0 = performance.now(), dur = 380;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.scrollLeft = from + (to - from) * e;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Genre track: arrows and edge fades only when there's more to scroll to.
  const track = () => $("[data-genres]");
  function updateArrows() {
    const t = track(), wrap = t.parentElement;
    const canPrev = t.scrollLeft > 4, canNext = t.scrollLeft + t.clientWidth < t.scrollWidth - 4;
    wrap.classList.toggle("can-prev", canPrev);
    wrap.classList.toggle("can-next", canNext);
    $(".genres__arrow--prev").hidden = !canPrev;
    $(".genres__arrow--next").hidden = !canNext;
  }

  /* ───────── cards ───────── */
  function pinHTML(b, i) {
    const r = ratios.get(b.id);
    const media = b.cover
      ? `<img src="${esc(b.cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-cover style="aspect-ratio:${r ? `1/${r}` : "2/3"}">`
      : placeholder(b);
    return `
      <div class="pin" role="listitem" style="--i:${i % 20}">
        <a class="card" href="#book/${esc(b.id)}" data-open="${esc(b.id)}" data-id="${esc(b.id)}">
          <div class="card__media">${media}</div>
          <div class="card__body">
            <p class="card__title">${esc(b.title)}</p>
            <p class="card__meta"><span class="card__author">${esc(b.author)}</span>${b.year ? `<span class="card__year">${b.year}</span>` : ""}</p>
          </div>
        </a>
      </div>`;
  }

  /* ───────── masonry with incremental loading ───────── */
  // Placement rules:
  //  1. Before a batch goes in, learn each cover's real aspect ratio (time-limited),
  //     so every card has its final height the moment it is placed.
  //  2. Each card goes into the column that is *measured* shortest right now
  //     (covers + wrapped titles), not an estimate.
  //  3. After the last card, if one column overhangs by more than a whole card,
  //     move its last card to the shortest column (before paint, so nothing jumps).
  const COL = 236, GUTTER = 16, BATCH = 30;
  let current = [], shown = 0, cols = [], colW = COL, gen = 0, busy = false;

  function columnsFor() {
    const host = $("[data-masonry]");
    const avail = host.parentElement.clientWidth - 32;
    const n = Math.max(2, Math.floor((avail + GUTTER) / (COL + GUTTER)));
    const w = n === 2 && 2 * COL + GUTTER > avail ? Math.floor((avail - GUTTER) / 2) : COL;
    return { n, w };
  }

  // Resolve a cover's height/width ratio, cached. Missing or broken covers use 3:2 (placeholder tile).
  const probing = new Map();
  function probe(b) {
    if (ratios.has(b.id)) return Promise.resolve();
    if (!b.cover) { ratios.set(b.id, 1.5); return Promise.resolve(); }
    if (!probing.has(b.id)) {
      probing.set(b.id, new Promise((res) => {
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        img.onload = () => { if (img.naturalWidth) ratios.set(b.id, img.naturalHeight / img.naturalWidth); res(); };
        img.onerror = () => { ratios.set(b.id, 1.5); res(); };
        img.src = b.cover;
      }));
    }
    return probing.get(b.id);
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const shortest = () => {
    let c = 0;
    for (let k = 1; k < cols.length; k++) if (cols[k].offsetHeight < cols[c].offsetHeight) c = k;
    return c;
  };

  function renderFeed() {
    gen++;
    busy = false;
    current = filtered();
    shown = 0;
    const host = $("[data-masonry]");
    const { n, w } = columnsFor();
    colW = w;
    host.style.setProperty("--col", w + "px");
    document.documentElement.style.setProperty("--feed-w", n * w + (n - 1) * GUTTER + "px");
    host.innerHTML = Array.from({ length: n }, () => '<div class="masonry__col"></div>').join("");
    cols = $$(".masonry__col", host);
    $("[data-feed-title]").textContent = feedTitle();
    $("[data-feed-count]").textContent = current.length === books.length
      ? `${books.length} books`
      : `${current.length} of ${books.length} books`;
    $("[data-empty]").hidden = current.length > 0;
    $("[data-sentinel]").hidden = current.length === 0;
    return appendBatch();
  }

  async function appendBatch() {
    if (busy || shown >= current.length) return;
    busy = true;
    const myGen = gen;
    const next = current.slice(shown, shown + BATCH);
    // First batch waits less so the page shows quickly; later batches load ahead of the reader.
    await Promise.race([Promise.all(next.map(probe)), wait(shown === 0 ? 1200 : 3000)]);
    if (myGen !== gen) return; // filters changed while we waited

    next.forEach((b, i) => cols[shortest()].insertAdjacentHTML("beforeend", pinHTML(b, shown + i)));
    shown += next.length;
    watchReveal($("[data-masonry]"));
    if (shown >= current.length) settle();
    $("[data-sentinel]").hidden = shown >= current.length;
    busy = false;

    // If the new cards didn't push the sentinel out of range, keep going.
    const s = $("[data-sentinel]").getBoundingClientRect();
    if (shown < current.length && s.top < innerHeight + 1200) appendBatch();
  }

  // Even out the ragged bottom: move last cards from the tallest column while it overhangs by more than a card.
  function settle() {
    for (let guard = 0; guard < 12; guard++) {
      const h = cols.map((c) => c.offsetHeight);
      const t = h.indexOf(Math.max(...h)), sIdx = h.indexOf(Math.min(...h));
      const last = cols[t].lastElementChild;
      if (!last) return;
      const lh = last.offsetHeight + GUTTER;
      if (h[t] - h[sIdx] <= lh) return; // moving it would not shrink the gap
      cols[sIdx].appendChild(last);
    }
  }

  // Load more when the sentinel nears the viewport.
  new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) appendBatch();
  }, { rootMargin: "1200px 0px" }).observe($("[data-sentinel]"));

  // Learn real ratios as covers load; swap broken covers for a placeholder.
  document.addEventListener("load", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.hasAttribute("data-cover")) return;
    const pin = img.closest("[data-id]");
    if (!pin || !img.naturalWidth) return;
    const r = img.naturalHeight / img.naturalWidth;
    ratios.set(pin.dataset.id, r);
    img.style.aspectRatio = `1/${r}`;
  }, true);
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.hasAttribute("data-cover")) return;
    const id = (img.closest("[data-id]") || img.closest("[data-open]") || {}).dataset?.open;
    const b = books.find((x) => x.id === id);
    if (b) { ratios.set(b.id, 1.5); img.outerHTML = placeholder(b); }
  }, true);

  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(async () => {
      const { n, w } = columnsFor();
      if (n !== cols.length || w !== colW) {
        const keep = shown;
        await renderFeed();
        while (shown < keep && shown < current.length) { busy = false; await appendBatch(); }
      }
    }, 150);
  });

  /* ───────── close-up dialog ───────── */
  const sheet = $("[data-sheet]");
  let lastFocus = null;

  function openBook(id) {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    lastFocus = document.activeElement;
    const facts = [
      b.readYear && ["Read in", b.readYear],
      b.year && ["Published", b.year],
      b.pages && ["Pages", b.pages.toLocaleString()],
      b.series && ["Series", esc(seriesLabel(b))],
      b.format && ["Format", FORMAT[b.format]],
      b.isbn && ["ISBN", esc(b.isbn)]
    ].filter(Boolean);
    const sameSeries = b.series && books.some((x) => x.id !== b.id && x.series === b.series);
    const sameAuthor = books.some((x) => x.id !== b.id && x.author === b.author);

    $("[data-sheet-body]").innerHTML = `
      <div class="closeup__media">${b.cover ? `<img src="${esc(b.cover)}" alt="Cover of ${esc(b.title)}" referrerpolicy="no-referrer" data-cover>` : placeholder(b)}</div>
      <div class="closeup__body">
        <button class="icon-btn closeup__close" type="button" data-close aria-label="Close">${icon.close}</button>
        <div class="closeup__tags">${(b.genres || []).map((g) => `<span class="chip">${esc(g)}</span>`).join("")}</div>
        <h3 id="closeup-title">${esc(b.title)}</h3>
        <p class="closeup__author">by ${esc(b.author)}</p>
        ${b.rating ? `<div class="closeup__rating">${stars(b.rating)}<span>${b.rating} / 5</span></div>` : ""}
        ${b.summary ? `<p class="closeup__note">${esc(b.summary)}</p>` : ""}
        ${b.tags && b.tags.length ? `<p class="closeup__hashtags">${b.tags.map((t) => "#" + esc(t)).join(" ")}</p>` : ""}
        <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        <div class="closeup__actions">
          ${sameSeries ? `<button class="btn btn--secondary" type="button" data-more="${esc(b.series)}">More in ${esc(b.series)}</button>` : ""}
          ${sameAuthor ? `<button class="btn btn--secondary" type="button" data-more="${esc(b.author)}">More by ${esc(b.author)}</button>` : ""}
        </div>
      </div>`;
    if (smooth) smooth.stop();
    sheet.showModal();
    history.replaceState(null, "", "#book/" + encodeURIComponent(b.id));
  }

  sheet.addEventListener("close", () => {
    if (location.hash.startsWith("#book/")) history.replaceState(null, "", location.pathname + location.search);
    lastFocus && lastFocus.focus && lastFocus.focus();
  });
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("[data-close]")) return sheet.close();
    const more = e.target.closest("[data-more]");
    if (more) {
      sheet.close();
      state.q = more.dataset.more;
      $("[data-search]").value = state.q;
      state.genres.clear();
      if (state.sort === "recent") { state.sort = "series"; $("[data-sort]").value = "series"; }
      apply();
      toFilters();
    }
  });

  /* ───────── smooth scrolling ───────── */
  // Inertial wheel scrolling: each wheel tick moves a target; the page eases toward it every frame.
  // Off for touch screens (already smooth) and for people who prefer reduced motion.
  // Keyboard, scrollbar drags and the book dialog keep native scrolling.
  const smooth = (() => {
    const fine = matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !fine) return null;
    const root = document.documentElement;
    root.classList.add("has-smooth-scroll");
    let target = scrollY, pos = scrollY, running = false, last = 0;
    const max = () => root.scrollHeight - innerHeight;
    const clamp = (v) => Math.max(0, Math.min(max(), v));
    const STRENGTH = 0.11; // share of the remaining distance covered per 60fps frame

    function frame(now) {
      if (!running) return;
      // Something else moved the page mid-glide (scrollbar drag, keys, a jump): hand control back.
      if (Math.abs(scrollY - pos) > 3) { running = false; pos = target = scrollY; return; }
      const dt = Math.min(64, now - last || 16.7);
      last = now;
      const k = 1 - Math.pow(1 - STRENGTH, dt / 16.7); // frame-rate independent easing
      pos += (target - pos) * k;
      if (Math.abs(target - pos) < 0.4) pos = target;
      window.scrollTo({ top: pos, behavior: "instant" });
      if (pos !== target) requestAnimationFrame(frame);
      else running = false;
    }
    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }

    addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.defaultPrevented) return;                     // pinch-zoom
      if (document.querySelector("dialog[open]")) return;              // dialog scrolls itself
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;             // sideways (genre row)
      if (e.target.closest && e.target.closest("select")) return;
      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 40;            // lines
      else if (e.deltaMode === 2) dy *= innerHeight; // pages
      if (!running) pos = target = scrollY;
      target = clamp(target + dy);
      start();
    }, { passive: false });

    // Anything else that scrolls the page (keys, scrollbar, find-in-page) resets our position.
    addEventListener("scroll", () => {
      if (!running) pos = target = scrollY;
    }, { passive: true });

    return {
      to(y) { pos = scrollY; target = clamp(y); start(); },
      stop() { running = false; pos = target = scrollY; }
    };
  })();

  // Scroll so an element sits just under the sticky top bar.
  function scrollToEl(el, offset = 80) {
    const y = el.getBoundingClientRect().top + scrollY - offset;
    if (smooth) smooth.to(y);
    else window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ───────── card reveal on scroll ───────── */
  // Cards rise and fade in when they enter the viewport, staggered left to right by column.
  const revealer = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          revealer.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 })
    : null;
  function watchReveal(root = document) {
    $$(".pin:not(.is-in):not([data-watched])", root).forEach((pin) => {
      pin.dataset.watched = "";
      const col = pin.parentElement ? [...pin.parentElement.parentElement.children].indexOf(pin.parentElement) : 0;
      pin.style.setProperty("--d", `${col * 70}ms`);
      if (revealer) revealer.observe(pin);
      else pin.classList.add("is-in");
    });
  }

  /* ───────── events ───────── */
  const toFilters = () => scrollToEl($("#filters"));

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) { e.preventDefault(); return openBook(opener.dataset.open); }

    const chip = e.target.closest("[data-genre-chip]");
    if (chip) {
      const g = chip.dataset.genreChip;
      state.genres.has(g) ? state.genres.delete(g) : state.genres.add(g);
      apply();
      track().scrollTo({ left: 0, behavior: "instant" }); // selected chips move to the front
      updateArrows();
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      if (rm.dataset.remove === "genre") state.genres.delete(rm.dataset.value);
      if (rm.dataset.remove === "q") { state.q = ""; $("[data-search]").value = ""; }
      return apply();
    }
    if (e.target.closest("[data-clear]")) return clearAll();
    const arrow = e.target.closest("[data-scroll]");
    if (arrow) return glide(track(), Number(arrow.dataset.scroll) * track().clientWidth * 0.8);
    if (e.target.closest("[data-browse]")) { e.preventDefault(); return toFilters(); }
    if (e.target.closest("[data-surprise]")) {
      const pool = filtered().length ? filtered() : books;
      return openBook(pool[Math.floor(Math.random() * pool.length)].id);
    }
  });

  track().addEventListener("scroll", updateArrows, { passive: true });
  addEventListener("resize", updateArrows);

  let st;
  $("[data-search]").addEventListener("input", (e) => {
    clearTimeout(st);
    st = setTimeout(() => { state.q = e.target.value; apply(); }, 150);
  });
  $("[data-search]").addEventListener("keydown", (e) => { if (e.key === "Enter") toFilters(); });
  $("[data-sort]").addEventListener("change", (e) => { state.sort = e.target.value; apply(); });

  // Hairline under the filter bar once it sticks below the top bar.
  const filtersEl = $(".filters");
  const stuck = () => filtersEl.classList.toggle("is-stuck", filtersEl.getBoundingClientRect().top <= 80.5);
  addEventListener("scroll", stuck, { passive: true });

  $(".theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("shelf-theme", next);
  });

  const bar = $(".topbar");
  const onScroll = () => bar.classList.toggle("is-scrolled", scrollY > 4);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ───────── boot ───────── */
  renderIntro();
  renderCollage();
  readURL();
  renderFilters();
  Promise.resolve(renderFeed()).then(() => watchReveal());
  stuck();
  addEventListener("load", () => { track().scrollTo({ left: 0, behavior: "instant" }); updateArrows(); });
  const m = location.hash.match(/^#book\/(.+)$/);
  if (m) openBook(decodeURIComponent(m[1]));
})();
