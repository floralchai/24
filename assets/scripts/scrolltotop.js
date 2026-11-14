// Keep scroll-button updates lightweight without replacing other scroll handlers.
const scrollButton = document.getElementById("scrollbtn");
let scrollUpdatePending = false;
let scrollButtonVisible = false;

function updateScrollButton() {
  if (!scrollButton) return;

  const shouldShow =
    window.scrollY > 100 ||
    document.documentElement.scrollTop > 100 ||
    document.body.scrollTop > 100;

  if (shouldShow !== scrollButtonVisible) {
    scrollButton.style.display = shouldShow ? "block" : "none";
    scrollButtonVisible = shouldShow;
  }
}

function handleScroll() {
  if (scrollUpdatePending) return;

  scrollUpdatePending = true;
  window.requestAnimationFrame(() => {
    updateScrollButton();
    scrollUpdatePending = false;
  });
}

// Set the correct initial state and listen passively to avoid blocking scrolling.
updateScrollButton();
window.addEventListener("scroll", handleScroll, { passive: true });

// Keep the existing inline onclick="topFunction()" hook working.
function topFunction() {
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

// Inline event handlers resolve global functions on the window object.
window.topFunction = topFunction;
