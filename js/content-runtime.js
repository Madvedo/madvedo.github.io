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
      const latest = document.querySelector('#latestNews .latest-news-grid');
      if (latest && Array.isArray(data.news)) {
        const items = data.news.length >= 5 ? data.news : Array.from({length:5},(_,i)=>data.news[i % data.news.length]);
        const loop = [...items,...items,...items];
        latest.innerHTML = loop.map((item,index) => `<a class="latest-news-card" data-carousel-index="${index}" href="${escape(item.link || '/index.html#news.html')}" target="_blank" rel="noopener"><img src="${escape(item.image)}" alt="${escape(item.alt)}"><span class="latest-news-title">${escape(item.alt || 'Новость')}</span></a>`).join('');
        let frame, dragging=false, previous=0;
        const cards = [...latest.querySelectorAll('.latest-news-card')];
        const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(latest).gap);
        const selectCentered = () => {
          const center = latest.getBoundingClientRect().left + latest.clientWidth / 2;
          let active, distance = Infinity;
          cards.forEach(card => {
            const rect=card.getBoundingClientRect(), current=Math.abs(rect.left + rect.width / 2 - center);
            if(current < distance){ distance=current; active=card; }
          });
          cards.forEach(card => card.classList.toggle('is-active',card===active));
        };
        const positionStart = () => { latest.scrollLeft=items.length*step()-(latest.clientWidth-step())/2; };
        const animate = time => {
          if(!previous) previous=time;
          const elapsed=Math.min(40,time-previous); previous=time;
          if(!dragging) latest.scrollLeft += elapsed*.025;
          const sequence=items.length*step();
          if(latest.scrollLeft >= sequence*2) latest.scrollLeft -= sequence;
          selectCentered();
          frame=requestAnimationFrame(animate);
        };
        latest.addEventListener('pointerdown',()=>dragging=true);
        window.addEventListener('pointerup',()=>dragging=false);
        window.addEventListener('resize',()=>{ positionStart(); selectCentered(); });
        requestAnimationFrame(()=>{ positionStart(); selectCentered(); frame=requestAnimationFrame(animate); });
      }
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
