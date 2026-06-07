/* ─── DOOR ─── */
  function openDoor() {
    const dp = document.getElementById('door-page');
    if (dp.classList.contains('opening')) return;
    dp.classList.add('opening');
    dp.classList.add('fadeout');
    setTimeout(() => {
      dp.classList.add('gone');
      showSite();
    }, 1700);
  }

  function showSite() {
    document.getElementById('site').style.display = 'block';
    setupFadeIn();
  }

  /* ─── FADE IN on scroll ─── */
  function setupFadeIn() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.btn-section').forEach(el => obs.observe(el));
  }

  /* ─── MENU ─── */
  function openMenu() {
    const overlay = document.getElementById('menu-overlay');
    const hamburger = document.getElementById('hamburger');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    const overlay = document.getElementById('menu-overlay');
    const hamburger = document.getElementById('hamburger');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  window.addEventListener('load', function() {
    const overlay = document.getElementById('menu-overlay');
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target.classList.contains('menu-bg')) {
        closeMenu();
      }
    });
  });

  /* ─── NAVIGATION ─── */
  function goTo(page) {
    closeMenu();
    document.getElementById('top-page').style.display = 'none';
    document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));

    if (page === 'top') {
      document.getElementById('top-page').style.display = 'block';
    } else {
      const target = document.getElementById('page-' + page);
      if (target) target.classList.add('active');
    }
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  /* ─── CAROUSEL ─── */
  const _cars = {};

  function updateArrows(id) {
    const d = _cars[id];
    if (!d) return;
    const body = document.querySelector('[data-carid="' + id + '"]')?.closest('.car-body');
    if (!body) return;
    const prev = body.querySelector('.car-prev');
    const next = body.querySelector('.car-next');
    if (prev) prev.classList.toggle('hidden', d.cur === 0);
    if (next) next.classList.toggle('hidden', d.cur === d.total - 1);
  }

  window.addEventListener('load', function() {
    ['mv','hv','bd','pv','gd'].forEach(id => {
      const track = document.getElementById('track-' + id);
      if (!track) return;
      const slides = track.querySelectorAll('.car-slide');
      _cars[id] = { cur: 0, total: slides.length };
      updateArrows(id);

      const viewport = track.closest('.car-viewport');
      if (!viewport) return;

      // Transparent overlay sits above the iframe to capture swipe gestures.
      // touch-action:pan-y lets vertical scroll pass to the browser natively
      // while horizontal swipes are handled by JS without needing preventDefault.
      const overlay = document.createElement('div');
      overlay.className = 'car-swipe-overlay';
      viewport.appendChild(overlay);

      let sx = 0, sy = 0;

      overlay.addEventListener('touchstart', e => {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      }, { passive: true });

      overlay.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;

        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe → move carousel
          carMove(id, dx < 0 ? 1 : -1);
        } else if (Math.abs(dx) < 28 && Math.abs(dy) < 28) {
          // Tap — hide overlay so the native touch event falls through to the facade/iframe
          overlay.style.pointerEvents = 'none';
          // Find and tap the facade play button directly
          const cur = _cars[id] ? _cars[id].cur : 0;
          const slide = track.querySelectorAll('.car-slide')[cur];
          if (slide) {
            const facade = slide.querySelector('.yt-facade');
            if (facade) ytActivate(facade);
          }
          setTimeout(() => { overlay.style.pointerEvents = ''; }, 600);
        }
      }, { passive: true });
    });
  });

  // iframeをcar-track(transform対象)の外、car-viewport直下に置くことで
  // iOS Safariのtransform内iframe描画バグを回避する
  function ytActivate(facade) {
    const vid = facade.dataset.vid;
    const viewport = facade.closest('.car-viewport');
    if (!viewport) return;

    // 既存のアクティブiframeがあれば消す
    const existing = viewport.querySelector('.yt-active-iframe');
    if (existing) existing.remove();

    // facadeはDOMに残したまま非表示にする（スライド移動時の復元に使う）
    facade.style.visibility = 'hidden';
    facade.dataset.active = '1';

    const iframe = document.createElement('iframe');
    iframe.className = 'yt-active-iframe';
    iframe.dataset.vid = vid;
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('webkit-allowfullscreen', '');
    // car-viewport直下に置く（transformの影響を受けない）
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;background:#000;z-index:3;';
    viewport.appendChild(iframe);
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + vid
      + '?autoplay=1&playsinline=1&controls=1&rel=0&modestbranding=1';

    const overlay = viewport.querySelector('.car-swipe-overlay');
    if (overlay) overlay.style.pointerEvents = 'none';
  }

  // スライド移動時にアクティブiframeを消してfacadeを復元する
  function stopActiveVideo(viewport) {
    if (!viewport) return;
    const iframe = viewport.querySelector('.yt-active-iframe');
    if (iframe) iframe.remove();
    const facade = viewport.querySelector('.yt-facade[data-active="1"]');
    if (facade) {
      facade.style.visibility = '';
      delete facade.dataset.active;
    }
    const overlay = viewport.querySelector('.car-swipe-overlay');
    if (overlay) overlay.style.pointerEvents = '';
  }

  // Desktop click support
  document.addEventListener('click', e => {
    const facade = e.target.closest('.yt-facade');
    if (facade) ytActivate(facade);
  });

  function carMove(id, dir) {
    const d = _cars[id];
    if (!d || d.total <= 1) return;
    const viewport = document.querySelector('[data-carid="' + id + '"]');

    // 再生中の動画を止めてfacadeに戻す
    stopActiveVideo(viewport);

    d.cur = (d.cur + dir + d.total) % d.total;
    const track = document.getElementById('track-' + id);
    if (track) track.style.transform = 'translateX(-' + (d.cur * 100) + '%)';

    const dotsEl = document.getElementById('dots-' + id);
    if (dotsEl) {
      dotsEl.querySelectorAll('.cdot').forEach((dot, i) => {
        dot.classList.toggle('active', i === d.cur);
      });
    }
    updateArrows(id);
  }

  /* ─── PARTICLES ─── */
  (function() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = document.getElementById('buttons-section');
    let particles = [];

    function resize() {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function spawn() {
      return {
        x: rand(0, canvas.width),
        y: canvas.height + rand(0, 20),
        r: rand(0.5, 1.5),
        speed: rand(0.4, 1.2),
        alpha: rand(0.4, 0.75),
        drift: rand(-0.15, 0.15)
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: 40 }, () => {
        const p = spawn();
        p.y = rand(0, canvas.height);
        return p;
      });
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y + p.r < 0) particles[i] = spawn();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }

    function safeInit() {
      // Wait until section has a real height before initialising
      if (section.offsetHeight > 0) {
        init();
        tick();
      } else {
        setTimeout(safeInit, 100);
      }
    }

    window.addEventListener('resize', () => {
      resize();
      // re-clamp particle positions to new canvas size
      particles.forEach(p => {
        if (p.x > canvas.width) p.x = rand(0, canvas.width);
      });
    });

    // Use ResizeObserver for reliable sizing across browsers/devices
    if (window.ResizeObserver) {
      new ResizeObserver(() => { resize(); }).observe(section);
    }

    window.addEventListener('load', safeInit);
  })();

  /* ─── CHECK-IN ─── */
  (function() {
    const APPS = ['fancast','higher','idolchamp','mnetplus','mubeat','muniverse'];
    const KEY_DATE    = 'checkin_date';
    const KEY_DONE    = 'checkin_done';
    const KEY_STREAK  = 'checkin_streak';
    const KEY_LASTDAY = 'checkin_lastday';

    function todayStr() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    function loadState() {
      const saved = localStorage.getItem(KEY_DATE);
      const today = todayStr();
      if (saved !== today) {
        // 新しい日 → リセット。連続日数を計算
        const streak   = parseInt(localStorage.getItem(KEY_STREAK) || '0');
        const lastDay  = localStorage.getItem(KEY_LASTDAY) || '';
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
        const yStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');
        const newStreak = (lastDay === yStr) ? streak : 0;
        localStorage.setItem(KEY_DATE,    today);
        localStorage.setItem(KEY_DONE,    '[]');
        localStorage.setItem(KEY_STREAK,  String(newStreak));
        localStorage.setItem(KEY_LASTDAY, saved || '');
      }
      return JSON.parse(localStorage.getItem(KEY_DONE) || '[]');
    }

    function saveState(done) {
      localStorage.setItem(KEY_DONE, JSON.stringify(done));
    }

    function updateStreak(done) {
      if (done.length === APPS.length) {
        const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0') + 1;
        localStorage.setItem(KEY_STREAK,  String(streak));
        localStorage.setItem(KEY_LASTDAY, todayStr());
      }
    }

    function renderUI(done) {
      // date label
      const dateEl = document.getElementById('checkin-today');
      if (dateEl) {
        const d = new Date();
        const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        dateEl.textContent = days[d.getDay()] + '  ' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0');
      }

      // streak label
      const streakEl = document.getElementById('checkin-streak');
      if (streakEl) {
        const s = parseInt(localStorage.getItem(KEY_STREAK) || '0');
        streakEl.textContent = s > 0 ? s + ' day streak' : '';
      }

      // cards
      APPS.forEach(app => {
        const card = document.querySelector('.checkin-card[data-app="' + app + '"]');
        if (!card) return;
        if (done.includes(app)) {
          card.classList.add('done');
        } else {
          card.classList.remove('done');
        }
      });

      // progress
      const fill  = document.getElementById('checkin-progress-fill');
      const label = document.getElementById('checkin-progress-label');
      const pct   = Math.round((done.length / APPS.length) * 100);
      if (fill)  fill.style.width  = pct + '%';
      if (label) label.textContent = done.length + ' / ' + APPS.length;
    }

    window.toggleCheckin = function(app) {
      const done = loadState();
      const idx  = done.indexOf(app);
      if (idx === -1) {
        done.push(app);
        if (done.length === APPS.length) {
          updateStreak(done);
          setTimeout(launchCelebration, 350);
        }
      } else {
        done.splice(idx, 1);
      }
      saveState(done);
      renderUI(done);

      // pop animation
      const card = document.querySelector('.checkin-card[data-app="' + app + '"]');
      if (card) {
        card.classList.remove('pop');
        void card.offsetWidth; // reflow
        card.classList.add('pop');
        card.addEventListener('animationend', () => card.classList.remove('pop'), { once:true });
      }
    };

    // 0時になったら自動リセット＆再描画
    function scheduleMidnightReset() {
      const now  = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const msUntilMidnight = next - now;
      setTimeout(() => {
        const done = loadState(); // 日付変わったのでloadStateがリセットしてくれる
        renderUI(done);
        scheduleMidnightReset(); // 翌日もセット
      }, msUntilMidnight);
    }

    window.addEventListener('load', () => {
      const done = loadState();
      renderUI(done);
      scheduleMidnightReset();
    });
  })();

  /* ─── CELEBRATE ─── */
  window.launchCelebration = function() {
    const el  = document.getElementById('checkin-celebrate');
    const msg = document.getElementById('celebrate-msg');
    if (!el || !msg) return;

    el.style.display = 'block';
    el.classList.remove('running');
    void el.offsetWidth;

    requestAnimationFrame(() => msg.classList.add('show'));

    el.classList.add('running');
    setTimeout(() => {
      msg.classList.remove('show');
      el.style.display = 'none';
      el.classList.remove('running');
    }, 3200);
  };
