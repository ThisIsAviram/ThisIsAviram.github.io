// Living patterns — the four lens families, animated. Each [data-pattern] element gets a live SVG that
// breathes over time and bends toward the pointer. Static SVG from the build stays as the no-JS fallback.
// Only visible patterns animate; reduced motion keeps them still.
(() => {
  const els = [...document.querySelectorAll("[data-pattern]")];
  if (!els.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = 600, NS = "http://www.w3.org/2000/svg";
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const f1 = (n) => n.toFixed(1);

  const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  // Each family: build(svg, r) returns draw(t, px, py) where px/py are pointer coords in viewBox space (or null).
  const families = {
    technology(svg, r) {
      const cols = 24, rows = 24, ph = [0, 1, 2, 3].map(() => r() * 6.28);
      const path = mk("path", { fill: "none", stroke: "currentColor", "stroke-width": "1.1", "stroke-linejoin": "round" });
      svg.append(path);
      return (t, px, py) => {
        const P = (i, j) => {
          let x = 60 + i * (S - 120) / cols, y = 60 + j * (S - 120) / rows;
          const a = 11 + 4 * Math.sin(t * .4);
          let dx = a * Math.sin(y / 47 + ph[0] + t * .6) + a * .6 * Math.sin((x + y) / 31 + ph[1] - t * .35);
          let dy = a * Math.cos(x / 53 + ph[2] + t * .5) + a * .6 * Math.sin((x - y) / 37 + ph[3] + t * .3);
          if (px != null) { const ddx = x - px, ddy = y - py, d2 = ddx * ddx + ddy * ddy, k = 2600 / (d2 + 1600); dx += ddx * k * .9; dy += ddy * k * .9; }
          return [x + dx, y + dy];
        };
        let d = "";
        for (let j = 0; j <= rows; j++) { d += "M"; for (let i = 0; i <= cols; i++) { const [x, y] = P(i, j); d += (i ? "L" : "") + f1(x) + "," + f1(y); } }
        for (let i = 0; i <= cols; i++) { d += "M"; for (let j = 0; j <= rows; j++) { const [x, y] = P(i, j); d += (j ? "L" : "") + f1(x) + "," + f1(y); } }
        path.setAttribute("d", d);
      };
    },
    "knowledge-learning"(svg, r) {
      const lines = 42, att = [0, 1, 2].map(() => ({ x: 150 + r() * 300, y: 150 + r() * 300, s: (40 + r() * 50) * (r() < .5 ? -1 : 1), ph: r() * 6.28 }));
      const path = mk("path", { fill: "none", stroke: "currentColor", "stroke-width": "1.15" });
      svg.append(path);
      return (t, px, py) => {
        const A = att.map((a, k) => ({ x: a.x + 60 * Math.sin(t * .35 + a.ph), y: a.y + 70 * Math.cos(t * .28 + a.ph * 1.3), s: a.s * (0.8 + .3 * Math.sin(t * .5 + k)) }));
        if (px != null) A.push({ x: px, y: py, s: 70 });
        let d = "";
        for (let k = 0; k < lines; k++) {
          const x0 = 50 + k * (S - 100) / (lines - 1);
          d += "M";
          for (let s = 0; s <= 50; s++) {
            const y = 50 + s * (S - 100) / 50;
            let x = x0;
            for (const a of A) { const d2 = (x0 - a.x) ** 2 + (y - a.y) ** 2; x += a.s * Math.exp(-d2 / 9000) * Math.sign(x0 - a.x || 1); }
            d += (s ? "L" : "") + f1(x) + "," + f1(y);
          }
        }
        path.setAttribute("d", d);
      };
    },
    people(svg, r) {
      const cols = 14, rows = 14, gx = (S - 120) / (cols - 1), gy = (S - 120) / (rows - 1);
      const nodes = [];
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) nodes.push({ i, j, x: 60 + i * gx, y: 60 + j * gy, ph: r() * 6.28, rad: 4.6 * (.75 + r() * .4) });
      const at = (i, j) => nodes[i * rows + j];
      const edges = [];
      nodes.forEach((n) => [[1, 0], [0, 1], [1, 1], [1, -1]].forEach(([di, dj]) => {
        const q = n.i + di < cols && n.j + dj >= 0 && n.j + dj < rows ? at(n.i + di, n.j + dj) : null;
        if (q && r() < .32 * (di && dj ? .45 : 1)) edges.push([n, q, r() * 6.28]);
      }));
      const eg = mk("path", { stroke: "currentColor", "stroke-width": "1.3", opacity: ".7", fill: "none" });
      const g = mk("g", { fill: "currentColor" });
      const circles = nodes.map((n) => { const c = mk("circle", { r: f1(n.rad) }); g.append(c); return c; });
      svg.append(eg, g);
      return (t, px, py) => {
        nodes.forEach((n, k) => {
          let x = n.x + 4 * Math.sin(t * .9 + n.ph), y = n.y + 4 * Math.cos(t * .7 + n.ph * 1.7);
          if (px != null) { const dx = px - x, dy = py - y, d2 = dx * dx + dy * dy; const k2 = 900 / (d2 + 900); x += dx * k2 * .35; y += dy * k2 * .35; }
          n.cx = x; n.cy = y;
          circles[k].setAttribute("cx", f1(x)); circles[k].setAttribute("cy", f1(y));
          circles[k].setAttribute("r", f1(n.rad * (1 + .18 * Math.sin(t * 1.4 + n.ph))));
        });
        let d = "";
        for (const [a, b, ph] of edges) if (Math.sin(t * .6 + ph) > -.55) d += `M${f1(a.cx)},${f1(a.cy)}L${f1(b.cx)},${f1(b.cy)}`;
        eg.setAttribute("d", d);
      };
    },
    "strategy-operations"(svg, r) {
      const cells = new Map(); let x = 0, y = 0, z = 0;
      const steps = [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [0, 1, 0]];
      while (cells.size < 34) {
        cells.set(`${x},${y},${z}`, [x, y, z]);
        const [dx, dy, dz] = steps[Math.floor(r() * steps.length)];
        x = Math.max(-3, Math.min(3, x + dx)); y = Math.max(-3, Math.min(3, y + dy)); z = Math.max(0, Math.min(3, z + dz));
      }
      const list = [...cells.values()].sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2]);
      const raw = (a, b, c) => [(a - b) * .866, (a + b) * .5 - c];
      const pts = list.flatMap(([a, b, c]) => [0, 1].flatMap((u) => [0, 1].flatMap((v) => [0, 1].map((w) => raw(a + u, b + v, c + w)))));
      const mnx = Math.min(...pts.map((p) => p[0])), mxx = Math.max(...pts.map((p) => p[0])), mny = Math.min(...pts.map((p) => p[1])), mxy = Math.max(...pts.map((p) => p[1]));
      const k = Math.min((S - 160) / (mxx - mnx), (S - 160) / (mxy - mny));
      const ox = (S - (mxx - mnx) * k) / 2 - mnx * k, oy = (S - (mxy - mny) * k) / 2 - mny * k + 20;
      const uid = "h" + Math.floor(r() * 1e9);
      const defs = mk("defs", {});
      [["l", 30, 1.5], ["r", -30, 1.5], ["t", 90, .8]].forEach(([n, rot, w]) => {
        const p = mk("pattern", { id: uid + n, width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: `rotate(${rot})` });
        p.append(mk("line", { x1: 0, y1: 0, x2: 0, y2: 5, stroke: "currentColor", "stroke-width": w }));
        defs.append(p);
      });
      svg.append(defs);
      const faces = list.map(() => ["l", "r", "t"].map((h) => { const p = mk("polygon", { fill: `url(#${uid + h})`, stroke: "currentColor", "stroke-width": "1.2", "stroke-linejoin": "round" }); svg.append(p); return p; }));
      const ph = list.map(() => r() * 6.28);
      return (t, px, py) => {
        list.forEach(([a, b, c], n) => {
          let lift = .22 * Math.max(0, Math.sin(t * .8 + ph[n]));
          const iso = (u, v, w) => { const [X, Y] = raw(u, v, w + lift); return `${f1(ox + X * k)},${f1(oy + Y * k)}`; };
          if (px != null) { const [cx, cy] = raw(a + .5, b + .5, c); const dx = ox + cx * k - px, dy = oy + cy * k - py; lift += .5 * Math.exp(-(dx * dx + dy * dy) / 6000); }
          const top = [iso(a, b, c + 1), iso(a + 1, b, c + 1), iso(a + 1, b + 1, c + 1), iso(a, b + 1, c + 1)];
          const left = [iso(a, b + 1, c), iso(a + 1, b + 1, c), iso(a + 1, b + 1, c + 1), iso(a, b + 1, c + 1)];
          const right = [iso(a + 1, b, c), iso(a + 1, b + 1, c), iso(a + 1, b + 1, c + 1), iso(a + 1, b, c + 1)];
          faces[n][0].setAttribute("points", left.join(" ")); faces[n][1].setAttribute("points", right.join(" ")); faces[n][2].setAttribute("points", top.join(" "));
        });
      };
    },
  };

  const live = [];
  els.forEach((el) => {
    const fam = families[el.dataset.pattern];
    if (!fam) return;
    const svg = mk("svg", { viewBox: `0 0 ${S} ${S}`, preserveAspectRatio: "xMidYMid meet", "aria-hidden": "true", focusable: "false" });
    const draw = fam(svg, rng(Number(el.dataset.seed) || 7));
    el.replaceChildren(svg);
    const item = { el, svg, draw, on: false, px: null, py: null, t0: Math.random() * 40 };
    const host = el.closest("a, button") || el;
    host.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect(), sc = S / Math.max(r.width, r.height);
      item.px = (e.clientX - r.left) * (S / r.width); item.py = (e.clientY - r.top) * (S / r.height);
      if (!isFinite(item.px) || !isFinite(sc)) item.px = item.py = null;
    });
    host.addEventListener("pointerleave", () => { item.px = item.py = null; });
    draw(item.t0, null, null);
    live.push(item);
  });
  if (reduce) return;

  const io = new IntersectionObserver((es) => es.forEach((e) => { const it = live.find((x) => x.el === e.target); if (it) it.on = e.isIntersecting; }), { rootMargin: "80px" });
  live.forEach((it) => io.observe(it.el));
  let last = 0;
  const frame = (now) => {
    if (now - last > 33 && !document.hidden) {   // ~30fps is plenty for drifting line work
      last = now;
      const t = now / 1000;
      live.forEach((it) => { if (it.on && it.el.offsetParent !== null) it.draw(it.t0 + t, it.px, it.py); });
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
