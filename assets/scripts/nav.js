(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.getElementById("page-nav");
    if (!navContainer) return;

    const pages = window.PAGES;
    if (!pages || !pages.length) {
      console.warn("[nav] PAGES missing");
      return;
    }

    // Normalize paths so:
    // /a/b.html
    // /a/b
    // /a/b/
    // all match
    const normalize = path =>
      path
        .split("?")[0]
        .replace(/\/index\.html$/, "")
        .replace(/\.html$/, "")
        .replace(/\/$/, "");

const currentPath = window.location.pathname.replace(/\/$/, "");
const normalizedPath = currentPath.endsWith(".html")
  ? currentPath
  : currentPath + ".html";

const index = window.PAGES.findIndex(p => p.url === normalizedPath);

if (index === -1) {
  console.warn("[nav] Page not found in PAGES:", normalizedPath);
  return;
}

    const prev = pages[index - 1] || null;
    const next = pages[index + 1] || null;

    navContainer.innerHTML = `
      <nav class="page-navigation" aria-label="Page navigation">

        <div class="nav-item">
          ${prev ? `
            <a href="${prev.url}" class="nav-link prev">
              ← Prev
              <span class="nav-title">${prev.title}</span>
            </a>
          ` : `<span class="nav-disabled"></span>`}
        </div>

        <span class="nav-sep">✦</span>

        <div class="nav-item">
          <a href="/fauna/index.html" class="nav-link index">
            Index
            <span class="nav-title">All entries</span>
          </a>
        </div>

        <span class="nav-sep">✦</span>

        <div class="nav-item">
          ${next ? `
            <a href="${next.url}" class="nav-link next">
              Next →
              <span class="nav-title">${next.title}</span>
            </a>
          ` : `<span class="nav-disabled"></span>`}
        </div>

      </nav>
    `;
  });
})();
