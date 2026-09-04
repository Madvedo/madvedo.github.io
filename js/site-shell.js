(() => {
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
