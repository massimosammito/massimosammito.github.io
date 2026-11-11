(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Theme --------------------------------------------------------------------------------
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var dark = root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    readColors();
  });
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---- Nav, progress bar, timeline fill -----------------------------------------------------
  var nav = document.getElementById("nav");
  var bar = document.getElementById("progress-bar");
  var tl = document.getElementById("timeline");
  var fill = document.getElementById("tl-fill");
  var links = [].slice.call(document.querySelectorAll(".nav-links a"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("solid", y > 30);
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    var r = tl.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    fill.style.height = p * 100 + "%";
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    links.forEach(function (a, i) { a.classList.toggle("on", i === current); });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // ---- Reveal on scroll, with a small stagger inside each group ----------------------------
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      seen.unobserve(e.target);
      var n = e.target.querySelector("[data-count]");
      if (n) countUp(n);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) {
    var sib = [].slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains("reveal"); });
    el.style.setProperty("--d", Math.min(sib.indexOf(el), 6) * 0.07 + "s");
    seen.observe(el);
  });

  function countUp(el) {
    var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "";
    if (reduced) { el.textContent = to + suf; return; }
    var t0 = performance.now(), dur = 1400;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  // ---- Rotating line in the hero ------------------------------------------------------------
  var phrases = [
    "set the AI product strategy",
    "translate between scientists, engineers and the business",
    "prototype ideas until they are real",
    "lead product teams that ship",
    "bring agentic AI to drug discovery",
  ];
  var rot = document.getElementById("rotate");
  if (!reduced) {
    var pi = 0, ci = phrases[0].length, deleting = true, pause = 2200;
    setTimeout(function tick() {
      var p = phrases[pi];
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      } else {
        ci++;
      }
      rot.textContent = phrases[pi].slice(0, Math.max(0, ci));
      var done = !deleting && ci >= phrases[pi].length;
      if (done) deleting = true;
      setTimeout(tick, done ? pause : deleting ? 22 : 42);
    }, pause);
  }

  // ---- Career phase filter ------------------------------------------------------------------
  document.querySelectorAll(".phase").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".phase").forEach(function (x) { x.classList.toggle("on", x === b); });
      var ph = b.getAttribute("data-phase");
      document.querySelectorAll(".role").forEach(function (r) { r.classList.toggle("dim", ph !== "all" && r.getAttribute("data-phase") !== ph); });
    });
  });

  // ---- Publication filter -------------------------------------------------------------------
  document.querySelectorAll(".filter").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".filter").forEach(function (x) { x.classList.toggle("on", x === b); });
      var f = b.getAttribute("data-f");
      document.querySelectorAll(".pub").forEach(function (p) {
        var show = f === "all" || (" " + p.getAttribute("data-tags") + " ").indexOf(" " + f + " ") >= 0;
        p.classList.toggle("hide", !show);
        if (show) p.classList.add("in");
      });
    });
  });

  // ---- Card tilt and spotlight --------------------------------------------------------------
  if (!reduced && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", x * 100 + "%");
        c.style.setProperty("--my", y * 100 + "%");
        c.style.transform = "perspective(800px) rotateX(" + (0.5 - y) * 6 + "deg) rotateY(" + (x - 0.5) * 8 + "deg) translateY(-3px)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }

  // ---- Hero field: a drifting molecular graph, with signals hopping along its bonds ----------
  var canvas = document.getElementById("field");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1, nodes = [], pulses = [], mouse = { x: -1e4, y: -1e4 }, colA = "109,76,255", colB = "14,165,198", running = true;
  function readColors() {
    var cs = getComputedStyle(root);
    colA = cs.getPropertyValue("--node").trim() || colA;
    colB = cs.getPropertyValue("--node-2").trim() || colB;
  }
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(110, Math.max(36, (W * H) / 14000)));
    nodes = [];
    for (var i = 0; i < n; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: 1.4 + Math.random() * 2.4, b: Math.random() < 0.3 });
    }
  }
  var LINK = 130;
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var dx = a.x - mouse.x, dy = a.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 22000) { a.vx += dx / 9000; a.vy += dy / 9000; }
      a.vx *= 0.99; a.vy *= 0.99;
      a.vx += (Math.random() - 0.5) * 0.012; a.vy += (Math.random() - 0.5) * 0.012;
      a.x += a.vx; a.y += a.vy;
      if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20;
    }
    for (i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var p = nodes[i], q = nodes[j], ex = p.x - q.x, ey = p.y - q.y, d = Math.sqrt(ex * ex + ey * ey);
        if (d < LINK) {
          ctx.strokeStyle = "rgba(" + (p.b || q.b ? colB : colA) + "," + (1 - d / LINK) * 0.32 + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          if (!reduced && pulses.length < 14 && Math.random() < 0.0009) pulses.push({ a: p, b: q, t: 0 });
        }
      }
    }
    for (i = 0; i < nodes.length; i++) {
      var o = nodes[i];
      ctx.fillStyle = "rgba(" + (o.b ? colB : colA) + ",0.85)";
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.283); ctx.fill();
    }
    for (i = pulses.length - 1; i >= 0; i--) {
      var s = pulses[i];
      s.t += 0.018;
      if (s.t >= 1) { pulses.splice(i, 1); continue; }
      var x = s.a.x + (s.b.x - s.a.x) * s.t, y = s.a.y + (s.b.y - s.a.y) * s.t;
      var g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, "rgba(" + colB + ",0.95)"); g.addColorStop(1, "rgba(" + colB + ",0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
    }
    if (!reduced) requestAnimationFrame(frame);
  }
  readColors();
  resize();
  addEventListener("resize", resize);
  canvas.parentElement.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -1e4; });
  // Stop drawing when the hero is off screen or the tab is hidden.
  new IntersectionObserver(function (en) {
    var vis = en[0].isIntersecting && !document.hidden;
    if (vis && !running) { running = true; requestAnimationFrame(frame); } else if (!vis) running = false;
  }).observe(canvas);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && !running) { running = true; requestAnimationFrame(frame); } else if (document.hidden) running = false; });
  requestAnimationFrame(frame);
})();
