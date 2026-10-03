// Site behaviour. Every layer is optional: without JS (or with reduced motion) the page is a plain, complete document.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = () => matchMedia("(min-width: 1021px)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", () => print()));

  /* ---------- dialogs: case stories + booking ---------- */
  const openDlg = (d, opener) => { d._opener = opener; d.showModal(); document.body.classList.add("dlg-open"); };
  const wireDlg = (d) => {
    if (d.dataset.bound) return; d.dataset.bound = "1";
    d.addEventListener("close", () => { document.body.classList.remove("dlg-open"); d._opener?.focus(); });
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  };
  document.querySelectorAll("[data-case]").forEach((a) => {
    const d = document.getElementById(a.dataset.case);
    if (!d || typeof d.showModal !== "function") return;
    wireDlg(d);
    a.addEventListener("click", (e) => { if (e.metaKey || e.ctrlKey || a.dataset.dragged) return; e.preventDefault(); openDlg(d, a); });
  });
  const book = document.getElementById("book");
  if (book && typeof book.showModal === "function") {
    wireDlg(book);
    document.querySelectorAll("[data-book]").forEach((a) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      const f = book.querySelector("iframe");
      if (f && !f.src) f.src = f.dataset.src;
      openDlg(book, a);
    }));
  }

  /* ---------- lenses: light the work that lives in each ---------- */
  const tabs = [...document.querySelectorAll(".lens[data-lens]")];
  const track = document.querySelector(".track");
  const say = document.querySelector(".lens-say");
  const pick = (t) => {
    const on = t && t.getAttribute("aria-selected") !== "true" ? t.dataset.lens : null;
    tabs.forEach((x) => { const s = x.dataset.lens === on; x.setAttribute("aria-selected", s); x.tabIndex = s || (!on && x === tabs[0]) ? 0 : -1; });
    say?.classList.toggle("has-lens", !!on);
    say?.querySelectorAll(".lens-text").forEach((p) => (p.hidden = p.dataset.for !== on));
    if (track) {
      track.classList.toggle("is-filtered", !!on);
      let first = null;
      track.querySelectorAll(".sc[data-dims]").forEach((c) => {
        const lit = !!on && c.dataset.dims.split(" ").includes(on);
        c.classList.toggle("is-lit", lit);
        if (lit && !first) first = c;
      });
      if (first) shelfTo(first);
    }
  };
  tabs.forEach((t, k) => {
    t.tabIndex = k ? -1 : 0;
    t.addEventListener("click", () => pick(t));
    t.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return; e.preventDefault();
      const n = tabs[(k + d + tabs.length) % tabs.length]; n.focus();
    });
  });

  /* ---------- shelf: pinned horizontal travel on wide screens, native swipe elsewhere ---------- */
  const scene = document.querySelector(".shelf-scene");
  const shelf = document.querySelector(".shelf");
  let span = 0;
  const pinned = () => scene?.classList.contains("is-pinned");
  const layoutShelf = () => {
    if (!scene || !track) return;
    const usePin = wide() && !reduce;
    scene.classList.toggle("is-pinned", usePin);
    track.style.transform = "";
    span = Math.max(0, track.scrollWidth - innerWidth);
    scene.style.height = usePin ? `calc(100vh + ${span}px)` : "";
  };
  const shelfProgress = () => {
    if (!scene || !track) return 0;
    if (pinned()) {
      const r = scene.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, span));
      track.style.transform = `translateX(${-p * span}px)`;
      return p;
    }
    return shelf ? clamp(shelf.scrollLeft / Math.max(1, shelf.scrollWidth - shelf.clientWidth)) : 0;
  };
  function shelfTo(card) {
    if (!scene || !track) return;
    const x = card.offsetLeft - track.firstElementChild.offsetLeft;
    if (pinned()) {
      const top = scene.getBoundingClientRect().top + scrollY + Math.min(span, x);
      scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    } else shelf?.scrollTo({ left: x, behavior: reduce ? "auto" : "smooth" });
  }
  document.querySelectorAll(".shelf-btn").forEach((b) => b.addEventListener("click", () => {
    const step = Math.min(420, innerWidth * 0.6) * Number(b.dataset.dir);
    if (pinned()) scrollBy({ top: step, behavior: reduce ? "auto" : "smooth" });
    else shelf?.scrollBy({ left: step, behavior: reduce ? "auto" : "smooth" });
  }));
  shelf?.addEventListener("scroll", () => requestAnimationFrame(tick), { passive: true });

  /* ---------- encounter: through the glass ---------- */
  const enc = document.querySelector(".enc-scene");
  const layoutEnc = () => enc?.classList.toggle("is-scene", wide() && !reduce);
  const encProgress = () => {
    if (!enc || !enc.classList.contains("is-scene")) return;
    const r = enc.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    enc.style.setProperty("--p", p.toFixed(4));
  };

  /* ---------- parallax: elements drift at their own speed ---------- */
  const drifters = reduce ? [] : [...document.querySelectorAll("[data-speed]")];
  const drift = () => {
    const mid = innerHeight / 2;
    drifters.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const y = (r.top + r.height / 2 - mid) * Number(el.dataset.speed);
      el.style.translate = `0 ${y.toFixed(1)}px`;
    });
  };

  /* ---------- header: steps aside during the dive, returns compact; hides on scroll-down elsewhere ---------- */
  const top = document.querySelector(".top");
  let lastY = scrollY;
  const header = () => {
    if (!top) return;
    const y = scrollY, down = y > lastY + 2, up = y < lastY - 2; lastY = y;
    if (enc?.classList.contains("is-scene")) {
      const r = enc.getBoundingClientRect(), inside = r.bottom > innerHeight * .6;
      if (inside) {
        const hp = clamp(-r.top / (innerHeight * .35));
        top.classList.add("is-diving"); top.classList.remove("is-compact", "is-hidden");
        top.style.setProperty("--hp", hp.toFixed(3));
        return;
      }
    }
    top.classList.remove("is-diving");
    top.classList.toggle("is-compact", y > 40);
    if (down && y > 300) top.classList.add("is-hidden"); else if (up) top.classList.remove("is-hidden");
  };

  /* ---------- medal: tilts toward the pointer ---------- */
  const medalBox = document.querySelector(".swim-result");
  const medal = document.querySelector(".medal-in");
  if (medalBox && medal && !reduce) medalBox.addEventListener("pointermove", (e) => {
    const r = medal.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    medal.style.setProperty("--ry", `${(x * 24).toFixed(1)}deg`); medal.style.setProperty("--rx", `${(-y * 16).toFixed(1)}deg`);
  });

  const bar = document.querySelector(".shelf-progress");
  function tick() {
    encProgress();
    const p = shelfProgress();
    bar?.style.setProperty("--sp", (0.15 + p * 0.85).toFixed(3));
    drift();
    header();
  }
  const layout = () => { layoutEnc(); layoutShelf(); tick(); };
  layout();
  addEventListener("scroll", () => requestAnimationFrame(tick), { passive: true });
  addEventListener("resize", () => requestAnimationFrame(layout));
  addEventListener("load", layout);
})();
