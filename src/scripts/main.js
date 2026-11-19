
document.querySelectorAll(".partner .carousel").forEach(carousel => {
  if (carousel.dataset.initialized) return;
  carousel.dataset.initialized = "true";

  const groups = carousel.querySelectorAll(".carousel-group");

  if (groups.length !== 2) return;

  const firstGroup = groups[0];

  let position = 0;
  let loopWidth = 0;
  let speed = 0.5;

  let isHovering = false;
  let isDragging = false;

  let startX = 0;
  let startPosition = 0;
  let lastTime = 0;

  function calculateWidth() {
    loopWidth = firstGroup.getBoundingClientRect().width;
    render();
  }

  function render() {
    carousel.style.transform = `translate3d(${-position}px, 0, 0)`;
  }

  function normalize() {
    if (loopWidth <= 0) return;

    position = ((position % loopWidth) + loopWidth) % loopWidth;
  }

  function animate(time) {
    if (!lastTime) lastTime = time;

    const delta = Math.min(time - lastTime, 50);
    lastTime = time;

    if (!isHovering && !isDragging && loopWidth > 0) {
      position += speed * delta / 16.67;
      normalize();
      render();
    }

    requestAnimationFrame(animate);
  }

  carousel.parentElement.addEventListener("mouseenter", () => {
    isHovering = true;
  });

  carousel.parentElement.addEventListener("mouseleave", () => {
    isHovering = false;
  });

  carousel.parentElement.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isDragging = true;
    startX = e.clientX;
    startPosition = position;

    carousel.parentElement.setPointerCapture(e.pointerId);
  });

  carousel.parentElement.addEventListener("pointermove", e => {
    if (!isDragging || loopWidth <= 0) return;

    position = startPosition - (e.clientX - startX);
    normalize();
    render();
  });

  function release() {
    isDragging = false;
  }

  carousel.parentElement.addEventListener("pointerup", release);
  carousel.parentElement.addEventListener("pointercancel", release);
  carousel.parentElement.addEventListener("lostpointercapture", release);

  new ResizeObserver(calculateWidth).observe(firstGroup);

  Promise.all(
    [...firstGroup.querySelectorAll("img")].map(img => {
      if (img.complete) return Promise.resolve();

      return new Promise(resolve => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })
  ).then(calculateWidth);

  calculateWidth();
  requestAnimationFrame(animate);
});

const homeSection = document.querySelector(".home");
const homeInner = document.querySelector(".home .container-inner");

const homeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        homeInner.classList.remove("animate");

        // Force animation restart
        void homeInner.offsetWidth;

        homeInner.classList.add("animate");
      } else {
        homeInner.classList.remove("animate");
      }
    });
  },
  {
    threshold: 0.2,
  }
);

if (homeSection && homeInner) {
  homeObserver.observe(homeSection);
}
const containers = document.querySelectorAll("section .container");

const containerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
      } else {
        entry.target.classList.remove("animate");
      }
    });
  },
  {
     threshold: 0, rootMargin: "0px 0px -12% 0px" 
  }
);

containers.forEach((container) => {
  containerObserver.observe(container);
});


/* ===== Facts: count-up numbers + scrambled text ===== */
const factHeadings = document.querySelectorAll(".fact h2");
const factSection = factHeadings[0]?.closest("section");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const easeOut = (p) => 1 - Math.pow(1 - p, 4);

function stopFact(el) {
  cancelAnimationFrame(el._raf);
}

function resetFact(el) {
  stopFact(el);
  if (el.dataset.target !== undefined) {
    el.textContent = "0" + (el.dataset.suffix || "");
  } else if (el.dataset.text) {
    el.textContent = randomText(el.dataset.text.length);
  }
}

function randomText(length) {
  return Array.from({ length }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
}

function countUp(el, delay = 0) {
  const target = Number(el.dataset.target);
  const suffix = el.dataset.suffix || "";
  const duration = 1800;

  stopFact(el);
  const begin = performance.now() + delay;

  function tick(now) {
    if (now < begin) {
      el._raf = requestAnimationFrame(tick);
      return;
    }
    const p = Math.min((now - begin) / duration, 1);
    el.textContent = Math.round(target * easeOut(p)) + suffix;
    if (p < 1) el._raf = requestAnimationFrame(tick);
  }
  el._raf = requestAnimationFrame(tick);
}

function scrambleText(el, delay = 0) {
  const finalText = el.dataset.text;
  const duration = 1600;
  let lastShuffle = 0;

  stopFact(el);
  const begin = performance.now() + delay;

  function tick(now) {
    if (now < begin) {
      el._raf = requestAnimationFrame(tick);
      return;
    }
    const p = Math.min((now - begin) / duration, 1);
    const settled = Math.floor(easeOut(p) * finalText.length);

    // Shuffle the unsettled letters about every 50ms so they don't flicker too fast
    if (now - lastShuffle > 50 || p === 1) {
      lastShuffle = now;
      el.textContent = finalText.slice(0, settled) + randomText(finalText.length - settled);
    }

    if (p < 1) el._raf = requestAnimationFrame(tick);
    else el.textContent = finalText;
  }
  el._raf = requestAnimationFrame(tick);
}

if (factSection && factHeadings.length) {
  const factsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          factHeadings.forEach((el, i) => {
            const delay = i * 150; // small stagger between the three facts
            if (reduceMotion) {
              el.textContent =
                el.dataset.target !== undefined
                  ? el.dataset.target + (el.dataset.suffix || "")
                  : el.dataset.text;
            } else if (el.dataset.target !== undefined) {
              countUp(el, delay);
            } else if (el.dataset.text) {
              scrambleText(el, delay);
            }
          });
        } else {
          factHeadings.forEach(resetFact);
        }
      });
    },
    { threshold: 0.3 }
  );

  // Start from the zero / scrambled state, then wait for the section to arrive
  if (!reduceMotion) factHeadings.forEach(resetFact);
  factsObserver.observe(factSection);
}





/* ===== Header height → CSS var (keeps hero offset + mobile menu aligned) ===== */
const headerEl = document.querySelector("header");
if (headerEl) {
  const setHeaderH = () =>
    document.documentElement.style.setProperty("--header-h", headerEl.offsetHeight + "px");
  setHeaderH();
  new ResizeObserver(setHeaderH).observe(headerEl);
}

/* ===== Mobile menu ===== */
(() => {
  const nav = document.querySelector("nav");
  const toggle = nav?.querySelector(".menu-toggle");
  if (!nav || !toggle) return;

  const mobile = window.matchMedia("(max-width: 900px)");
  const items = nav.querySelectorAll(".item.has-drop");

  const closeMenu = () => {
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    items.forEach((i) => i.classList.remove("open"));
  };

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("menu-open");
    nav.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });

  // Tap a parent link to open or close its dropdown (accordion)
  items.forEach((item) => {
    item.querySelector(":scope > a")?.addEventListener("click", (e) => {
      if (!mobile.matches) return;
      e.preventDefault();
      const wasOpen = item.classList.contains("open");
      items.forEach((i) => i.classList.remove("open"));
      item.classList.toggle("open", !wasOpen);
    });
  });

  // Close after choosing a real destination
  nav.querySelectorAll(".dropdown a, .item:not(.has-drop) > a, .mobile-only").forEach((a) =>
    a.addEventListener("click", closeMenu)
  );

  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
  mobile.addEventListener("change", (e) => { if (!e.matches) closeMenu(); });
})();