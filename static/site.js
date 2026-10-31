// Site behaviour. Every layer is optional: without JS the page is complete and every link works.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: a hairline once the page has moved (observer, not a scroll listener). */
  const top = document.querySelector(".top");
  const sentinel = document.querySelector(".top-sentinel");
  if (top && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => top.classList.toggle("is-scrolled", !e.isIntersecting)).observe(sentinel);
  }

  /* Dialogs: case plates and booking. Esc, backdrop click and the close button all close; focus returns. */
  const openDlg = (d, opener) => { d._opener = opener; d.showModal(); document.body.classList.add("dlg-open"); };
  const wire = (d) => {
    if (d.dataset.bound) return; d.dataset.bound = "1";
    d.addEventListener("close", () => { document.body.classList.remove("dlg-open"); d._opener?.focus(); });
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  };
  document.querySelectorAll("[data-case]").forEach((a) => {
    const d = document.getElementById(a.dataset.case);
    if (!d || typeof d.showModal !== "function") return;
    wire(d);
    a.addEventListener("click", (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); openDlg(d, a); });
  });
  const book = document.getElementById("book");
  if (book && typeof book.showModal === "function") {
    wire(book);
    document.querySelectorAll("[data-book]").forEach((a) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      const f = book.querySelector("iframe");
      if (f && !f.src) f.src = f.dataset.src;
      openDlg(book, a);
    }));
  }

  /* Lens filter: one control group per page (home index or the Work spine). */
  document.querySelectorAll(".filters, .toc").forEach((group) => {
    const buttons = [...group.querySelectorAll("button[data-lens]")];
    const scope = group.closest("main") || document;
    const items = [...scope.querySelectorAll(".ix-row[data-dims], .plates .plate[data-dims]")];
    const status = scope.querySelector("[data-filter-status]");
    buttons.forEach((b) => b.addEventListener("click", () => {
      const lens = b.dataset.lens;
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      let shown = 0;
      items.forEach((it) => { const on = !lens || it.dataset.dims.split(" ").includes(lens); it.hidden = !on; if (on) shown++; });
      if (status) status.textContent = `${shown} ${shown === 1 ? "case" : "cases"} shown`;
      if (group.classList.contains("toc") && innerWidth > 980) {
        const first = items.find((it) => !it.hidden);
        if (first && first.getBoundingClientRect().top < 0) first.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    }));
  });

  /* The way in: a pinned scene on wide screens. Progress is written to --p only while the scene is on screen. */
  const dive = document.querySelector("[data-dive]");
  if (dive) {
    const frame = dive.querySelector(".hero-frame"), pin = dive.querySelector(".dive-pin");
    let active = false, ticking = false;
    const want = () => !reduce && matchMedia("(min-width: 1024px) and (min-height: 620px)").matches;
    const measure = () => {
      dive.classList.toggle("is-scene", want());
      if (!dive.classList.contains("is-scene")) { dive.style.removeProperty("--p"); top?.classList.remove("is-diving"); return; }
      const f = frame.getBoundingClientRect(), r = pin.getBoundingClientRect();
      dive.style.setProperty("--fx", `${f.left - r.left}px`); dive.style.setProperty("--fy", `${f.top - r.top}px`);
      dive.style.setProperty("--fr", `${r.right - f.right}px`); dive.style.setProperty("--fb", `${r.bottom - f.bottom}px`);
      tick();
    };
    function tick() {
      ticking = false;
      if (!dive.classList.contains("is-scene")) return;
      const r = dive.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      dive.style.setProperty("--p", p.toFixed(4));
      top?.classList.toggle("is-diving", p > 0.02 && r.bottom > innerHeight * 0.5);
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !active) { active = true; addEventListener("scroll", onScroll, { passive: true }); tick(); }
      else if (!e.isIntersecting && active) { active = false; removeEventListener("scroll", onScroll); top?.classList.remove("is-diving"); }
    }).observe(dive);
    addEventListener("resize", () => requestAnimationFrame(measure));
    if (frame.querySelector("img").complete) measure(); else frame.querySelector("img").addEventListener("load", measure);
    measure();
  }

  /* Medal: a small tilt toward the pointer. */
  const box = document.querySelector(".swim-result"), medal = document.querySelector(".medal-in");
  if (box && medal && !reduce) box.addEventListener("pointermove", (e) => {
    const r = medal.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    medal.style.setProperty("--ry", `${(x * 24).toFixed(1)}deg`); medal.style.setProperty("--rx", `${(-y * 16).toFixed(1)}deg`);
  });
})();
