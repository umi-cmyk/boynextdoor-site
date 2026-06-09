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

    // Scroll to top BEFORE DOM changes — prevents iOS Safari from restoring scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document.getElementById('top-page').style.display = 'none';
    document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));

    if (page === 'top') {
      document.getElementById('top-page').style.display = 'block';
    } else {
      const target = document.getElementById('page-' + page);
      if (target) target.classList.add('active');
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
    const APPS = ['idolchamp','mnetplus','fancast','mubeat','muniverse','higher'];
    const KEY_DATE      = 'checkin_date';
    const KEY_DONE      = 'checkin_done';
    const KEY_STREAK    = 'checkin_streak';
    const KEY_LASTDAY   = 'checkin_lastday';
    const KEY_COUNTED   = 'checkin_counted';
    const KEY_COMPLETED = 'checkin_completed_dates';
    const KEY_SCHEMA    = 'checkin_schema';
    const SCHEMA_VER    = '3'; // 上げると全ユーザのチェック状態を強制リセット

    function todayStr() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    function loadState() {
      // スキーマバージョンが変わっていたら当日チェック状態をリセット
      if (localStorage.getItem(KEY_SCHEMA) !== SCHEMA_VER) {
        [KEY_DATE, KEY_DONE, KEY_COUNTED, KEY_STREAK, KEY_LASTDAY].forEach(k => localStorage.removeItem(k));
        localStorage.setItem(KEY_SCHEMA, SCHEMA_VER);
      }

      const saved = localStorage.getItem(KEY_DATE);
      const today = todayStr();
      if (saved !== today) {
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
      // 現在のAPPSに含まれないアプリをフィルタして返す
      const done = JSON.parse(localStorage.getItem(KEY_DONE) || '[]');
      return done.filter(app => APPS.includes(app));
    }

    function saveState(done) {
      localStorage.setItem(KEY_DONE, JSON.stringify(done));
    }

    function updateStreak(done) {
      if (done.length === APPS.length) {
        const today = todayStr();
        if (localStorage.getItem(KEY_COUNTED) === today) return;
        const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0') + 1;
        localStorage.setItem(KEY_STREAK,  String(streak));
        localStorage.setItem(KEY_LASTDAY, today);
        localStorage.setItem(KEY_COUNTED, today);
        // スタンプのロックは深夜0時に行う（チェックを外したら消えるようにするため）
      }
    }

    function renderWeek(done) {
      const container = document.getElementById('checkin-week');
      if (!container) return;
      const completed = JSON.parse(localStorage.getItem(KEY_COMPLETED) || '[]');
      const today = new Date();
      const dow = today.getDay();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dow);
      const labels = ['S','M','T','W','T','F','S'];
      container.innerHTML = '';
      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const dStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        // 今日：現在のチェック状態がすべて揃っているか（ライブ）
        // 過去：深夜0時にロックされた記録
        const isDone = (i === dow)
          ? done.length === APPS.length
          : completed.includes(dStr);
        const col = document.createElement('div');
        col.className = 'cw-col' + (i === dow ? ' cw-today' : '');
        const daySpan = document.createElement('span');
        daySpan.className = 'cw-day';
        daySpan.textContent = labels[i];
        const img = document.createElement('img');
        img.src = 'homelogo2.png';
        img.alt = '';
        img.className = 'cw-icon' + (isDone ? ' done' : '');
        col.appendChild(daySpan);
        col.appendChild(img);
        container.appendChild(col);
      }
    }

    function renderUI(done) {
      // weekly calendar
      renderWeek(done);

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
        // 深夜0時時点で全チェック済みならスタンプをロック
        const currentDone = JSON.parse(localStorage.getItem(KEY_DONE) || '[]')
          .filter(app => APPS.includes(app));
        if (currentDone.length === APPS.length) {
          const todayDate = todayStr();
          const completed = JSON.parse(localStorage.getItem(KEY_COMPLETED) || '[]');
          if (!completed.includes(todayDate)) {
            completed.push(todayDate);
            localStorage.setItem(KEY_COMPLETED, JSON.stringify(completed));
          }
        }
        const done = loadState();
        renderUI(done);
        scheduleMidnightReset();
      }, msUntilMidnight);
    }

    function renderSchedule() {
      const outer = document.getElementById('schedule-outer');
      if (!outer) return;

      const START  = 8, END = 25;
      const DAYS   = END - START + 1; // 18
      const DAY_W  = 34;  // px per day column
      const ROW_H  = 56;  // px per show row
      const HDR_H  = 46;  // date header height
      const LABEL_W = 76; // left column width

      const SHOWS = [
        { img:'innga.webp',                color:'rgba(80,150,240,0.75)',  rounds:[[8,12],[15,19]]  },
        { img:'showchampion.png',          color:'rgba(155,105,230,0.75)', rounds:[[12,15],[19,22]] },
        { img:'showmusiccore.png',         color:'rgba(65,190,120,0.75)',  rounds:[[16,18],[23,25]] },
        { img:'M_Countdown_2024_Logo.png', color:'rgba(235,145,55,0.75)',  rounds:[[13,16],[20,23]] },
        { img:'musicbank.webp',            color:'rgba(220,85,85,0.75)',   rounds:[[14,17],[21,24]] },
      ];

      const now    = new Date();
      const isJune = now.getMonth() === 5;
      const todayD = now.getDate();
      const hasToday = isJune && todayD >= START && todayD <= END;
      const todayX   = hasToday ? ((todayD - START) + 0.5) * DAY_W : null;
      const timelineW = DAYS * DAY_W;
      const todaySeg = todayX !== null
        ? `<div class="sch-today-seg" style="left:${todayX}px;"></div>` : '';

      // ── Labels column (fixed, does not scroll)
      let lblHtml = `<div class="sch-lbl-hdr" style="height:${HDR_H}px;">JUN</div>`;
      SHOWS.forEach((show, si) => {
        lblHtml += `<div class="sch-lbl-row" style="height:${ROW_H}px;">
          <img class="sch-lbl-img" src="${show.img}" alt="">
        </div>`;
        if (si < SHOWS.length - 1) lblHtml += `<div class="sch-sep-line" style="height:1px;"></div>`;
      });

      // ── Chart column (scrolls horizontally)
      let dateCells = '';
      for (let d = START; d <= END; d++) {
        const cls = (hasToday && d === todayD) ? ' sch-today-date' : '';
        dateCells += `<div class="sch-date-cell${cls}" style="width:${DAY_W}px;">${d}</div>`;
      }
      let chartHtml = `<div class="sch-chart-hdr" style="height:${HDR_H}px;min-width:${timelineW}px;">
        <div class="sch-date-row">${dateCells}</div>${todaySeg}
      </div>`;

      SHOWS.forEach((show, si) => {
        let bars = '';
        show.rounds.forEach(round => {
          const left  = (round[0] - START) * DAY_W;
          const width = (round[1] - round[0] + 1) * DAY_W;
          const isActive = hasToday && todayD >= round[0] && todayD <= round[1];
          bars += `<div class="sch-bar${isActive ? ' sch-bar-active' : ''}" style="left:${left}px;width:${width}px;background:${show.color};"></div>`;
        });
        chartHtml += `<div class="sch-chart-row" style="height:${ROW_H}px;min-width:${timelineW}px;">${todaySeg}${bars}</div>`;
        if (si < SHOWS.length - 1) chartHtml += `<div class="sch-sep-line sch-chart-sep" style="height:1px;min-width:${timelineW}px;"></div>`;
      });

      outer.innerHTML = `<div class="sch-wrapper">
        <div class="sch-labels-col" style="width:${LABEL_W}px;">${lblHtml}</div>
        <div class="sch-chart-col">${chartHtml}</div>
      </div>`;
    }

    window.addEventListener('load', () => {
      const done = loadState();
      saveState(done); // フィルタ済みデータを書き戻す
      renderUI(done);
      renderSchedule();
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
