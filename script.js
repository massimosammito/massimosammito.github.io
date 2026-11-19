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
  });
  document.getElementById("year").textContent = new Date().getFullYear();

  // The name slides up line by line as the page opens.
  var name = document.querySelector(".name");
  requestAnimationFrame(function () { requestAnimationFrame(function () { name.classList.add("in"); }); });

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

})();

// Commit heatmap: on a narrow screen start at the most recent weeks.
document.querySelectorAll(".activity-scroll").forEach((el) => { el.scrollLeft = el.scrollWidth; });
