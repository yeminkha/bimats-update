
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