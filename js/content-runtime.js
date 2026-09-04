(() => {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function load() {
    let data;
    try {
      const response = await fetch('/data/pages.json', { cache: 'no-store' });
      if (!response.ok) return;
      data = await response.json();
    } catch { return; }
    const page = location.pathname.split('/').pop();
    if (page === 'home.html' && data.home) {
      document.querySelector('h1').innerHTML = data.home.title;
      document.querySelector('h2').innerHTML = data.home.subtitle;
      document.querySelector('.rounded-img').src = data.home.logo;
      document.querySelector('.lead.my-5').innerHTML = data.home.description;
    }
    if (page === 'About.html' && data.about) {
      const target = [...document.querySelectorAll('body > .container.my-5')][0];
      if (target) target.innerHTML = data.about.html;
    }
    if (page === 'news.html' && Array.isArray(data.news)) {
      const target = document.querySelector('.container.my-5 .container.my-5');
      if (target) target.innerHTML = data.news.map(item => `<div class="news-block"><a href="${escape(item.link)}" target="_blank" rel="noopener"><img src="${escape(item.image)}" alt="${escape(item.alt)}" class="news-img"></a><div class="news-text">${item.html}</div></div>`).join('');
    }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
})();
