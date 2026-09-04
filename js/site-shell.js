(() => {
  if (new URLSearchParams(window.location.search).has("construct")) return;
  if (!document.querySelector('link[href="/css/site-theme.css"]')) {
    const theme = document.createElement("link");
    theme.rel = "stylesheet";
    theme.href = "/css/site-theme.css";
    document.head.appendChild(theme);
  }
  if (!document.querySelector(".site-background")) {
    const background = document.createElement("div");
    background.className = "site-background";
    background.setAttribute("aria-hidden", "true");
    background.innerHTML = '<video autoplay muted loop playsinline preload="metadata"><source src="/video/bckg.webm" type="video/webm"><source src="/video/bckg.mp4" type="video/mp4"></video>';
    document.body.prepend(background);
  }
  const shellPath = "/index.html";
  const routes = new Set([
    "home.html",
    "news.html",
    "concerts.html",
    "bands.html",
    "hs.html",
    "About.html",
    "radio.html",
  ]);

  const currentPage = () => {
    const page = window.location.pathname.split("/").pop() || "home.html";
    return page === "index.html" ? "home.html" : page;
  };

  if (window.top === window.self) {
    window.location.replace(`${shellPath}#${encodeURIComponent(currentPage())}`);
    return;
  }

  document.querySelector("nav")?.remove();
  document.body.classList.add("in-shell");
  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.getAttribute("href"), window.location.href);
    if (url.origin !== window.location.origin) return;
    const page = url.pathname.split("/").pop() || "home.html";
    if (!routes.has(page) && page !== "index.html") return;
    link.href = `${shellPath}#${page === "index.html" ? "home" : page}`;
    link.target = "_top";
  });

  const sendPageInfo = () => {
    window.parent.postMessage(
      { type: "shunder:page-title", title: document.title },
      window.location.origin
    );
  };

  window.addEventListener("load", sendPageInfo);
})();
