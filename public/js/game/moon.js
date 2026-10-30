// Stage 13 — Six rune observatory, persistent randomized solution and cinematic finale.
const MoonGame = (() => {
  const ASSET = 'assets/images/moon/';
  const END = 'assets/images/';
  let root = null,
    finish = null,
    certificate = null,
    puzzle = null,
    selected = [],
    timers = [],
    done = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const image = (id, cls = '') =>
    `<img class="${cls}" src="${ASSET}rune${id}.png" alt="${id}번 룬" draggable="false">`;
  function start(container, onComplete, opts = {}) {
    stop();
    root = container;
    finish = onComplete;
    certificate = opts.onCertificate;
    puzzle = opts.puzzle || {
      answer: [1, 2, 3, 4, 5, 6],
      choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    };
    done = Boolean(opts.completed);
    selected = [];
    if (done) ending();
    else intro();
  }
  function intro() {
    root.innerHTML = `<section class="moon-game moon-puzzle">
      <header class="moon-heading"><h3>🌙 달빛 전망대 · 마지막 마법진</h3><p>탐험일지의 힌트를 따라 여섯 룬을 순서대로 올려주세요.</p></header>
      <div class="moon-altar-wrap"><img class="moon-altar-idle" src="${ASSET}altar_idle.png" alt="여섯 개의 룬 홈이 있는 마법진"><img class="moon-altar-active" src="${ASSET}altar_activated.png" alt="" aria-hidden="true"><div class="moon-sockets" aria-label="여섯 룬 홈"></div></div>
      <p class="moon-status" role="status" aria-live="polite"></p><div class="moon-rune-picker" aria-label="룬 선택"></div>
      <div class="moon-controls"><button type="button" data-act="undo">↶ 하나 지우기</button><button type="button" data-act="reset">초기화</button><button type="button" data-act="journal">📜 탐험일지</button><button type="button" class="moon-primary" data-act="check">✨ 마법진 활성화</button></div></section>`;
    root.querySelector('[data-act="undo"]').onclick = () => {
      selected.pop();
      render();
    };
    root.querySelector('[data-act="reset"]').onclick = () => {
      selected = [];
      render();
    };
    root.querySelector('[data-act="journal"]').onclick = () =>
      document.getElementById('journalButton')?.click();
    root.querySelector('[data-act="check"]').onclick = check;
    render();
  }
  function render() {
    if (!root) return;
    const slots = root.querySelector('.moon-sockets'),
      picker = root.querySelector('.moon-rune-picker');
    if (!slots || !picker) return;
    slots.replaceChildren();
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'moon-socket' + (selected[i] ? ' filled' : '');
      b.style.setProperty('--index', i);
      b.setAttribute('aria-label', `${i + 1}번째 홈 ${selected[i] || '비어 있음'}`);
      if (selected[i]) {
        const im = document.createElement('img');
        im.src = `${ASSET}rune${selected[i]}.png`;
        im.alt = `${selected[i]}번 룬`;
        b.append(im);
      } else b.innerHTML = '<span>✧</span>';
      b.onclick = () => {
        if (selected[i]) {
          selected.splice(i, 1);
          render();
        }
      };
      slots.append(b);
    }
    picker.replaceChildren();
    puzzle.choices.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'moon-rune-choice';
      b.disabled = selected.length === 6 || selected.includes(id);
      b.innerHTML = `${image(id)}<span>${String(id).padStart(2, '0')}</span>`;
      b.setAttribute('aria-label', `${id}번 룬 선택`);
      b.onclick = () => {
        selected.push(id);
        render();
      };
      picker.append(b);
    });
    root.querySelector('.moon-status').textContent =
      selected.length === 6
        ? '여섯 룬을 모두 올렸어요. 마법진을 활성화하세요!'
        : `${selected.length} / 6 · 룬을 선택해 제단에 올려주세요.`;
  }
  function check() {
    const status = root?.querySelector('.moon-status');
    if (!status) return;
    if (selected.length !== 6) {
      status.textContent = '룬 여섯 개를 모두 선택해야 해요.';
      return;
    }
    if (!selected.every((id, i) => id === puzzle.answer[i])) {
      status.textContent = '아직 봉인이 열리지 않아요. 탐험일지의 순서를 다시 확인해 보세요!';
      root.querySelector('.moon-altar-wrap')?.classList.add('moon-error');
      later(() => root?.querySelector('.moon-altar-wrap')?.classList.remove('moon-error'), 550);
      return;
    }
    done = true;
    if (typeof finish === 'function') finish();
    root.querySelector('.moon-altar-wrap')?.classList.add('activated');
    status.textContent = '✨ 여섯 룬이 공명합니다! 달빛의 마법이 완성되었어요!';
    root
      .querySelectorAll('.moon-controls button,.moon-rune-choice,.moon-socket')
      .forEach((b) => (b.disabled = true));
    later(sequence, 2600);
  }
  function stars(container, count = 28) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'moon-particle';
      s.style.left = `${(i * 67 + 11) % 100}%`;
      s.style.animationDelay = `-${((i * 37) % 57) / 10}s`;
      s.style.animationDuration = `${4 + (i % 5)}s`;
      s.style.opacity = String(0.45 + (i % 5) * 0.1);
      container.append(s);
    }
  }
  function sequence() {
    if (!root) return;
    clear();
    root.innerHTML = `<section class="moon-game moon-cinematic"><div class="moon-scene moon-island"><div class="moon-sky-dust"></div><div class="moon-scene-title">✨ 할로윈섬에 별빛가루가 내립니다 ✨</div></div><p class="moon-cinema-caption" role="status" aria-live="polite">달빛이 할로윈섬 전체를 감싸고 있어요…</p><button type="button" class="moon-skip">엔딩 건너뛰기 ›</button></section>`;
    stars(root.querySelector('.moon-sky-dust'), 45);
    root.querySelector('.moon-skip').onclick = () => {
      clear();
      ending();
    };
    later(() => {
      if (!root) return;
      const scene = root.querySelector('.moon-scene');
      if (!scene) return;
      scene.className = 'moon-scene moon-boarding';
      scene.innerHTML = '<div class="moon-sky-dust"></div>';
      stars(scene.querySelector('.moon-sky-dust'), 25);
      root.querySelector('.moon-cinema-caption').textContent =
        '미타에어 항공기가 할로윈섬에서 승객 여러분을 기다리고 있습니다.';
    }, 3800);
    later(() => {
      if (!root) return;
      const scene = root.querySelector('.moon-scene');
      if (!scene) return;
      scene.className = 'moon-scene moon-flight';
      scene.innerHTML =
        '<img class="moon-flight-picture moon-cabin-picture" src="assets/images/mittaair_cabin.png" alt="승객들이 짐을 선반에 올리고 좌석에 앉아 출발을 준비하는 미타에어 기내">';
      root.querySelector('.moon-cinema-caption').textContent =
        '✈️ 우리 비행기는 잠시 후 새로운 모험을 향해 출발합니다.';
    }, 7600);
    later(ending, 11800);
  }
  function ending() {
    if (!root) return;
    clear();
    root.innerHTML = `<section class="moon-game moon-finale">
      <div class="moon-finale-sky"><img class="moon-finale-plane" src="${END}ending_mittaair.png" alt="별빛 구름 사이를 비행하는 미타에어"><div class="moon-finale-cloud"></div></div>
      <div class="moon-announcement"><div class="moon-announcement-label">✈️ MITTA'S AIRLINE · 기내 안내 방송</div><h3>승객 여러분, 편안한 여행 되셨습니까?</h3><p>미타에어와 함께한 할로윈섬에서의 특별한 모험이 이제 막을 내립니다.</p><p>우리 비행기는 잠시 후 할로윈섬을 떠나 새로운 모험을 향해 출발할 예정입니다.</p><p>탑승 후 좌석에 앉아 안전벨트를 착용해 주시기 바랍니다.</p><p>오늘 밤 모은 작은 용기와 반짝이는 추억들이 앞으로의 여행에도 함께하기를 바랍니다.</p><strong>다음 모험에서도 다시 만나 뵙겠습니다. ✨</strong></div>
      <div class="moon-embedded-certificate"><h3>🎫 할로윈섬 탑승인증서</h3><p>HALLOWEEN ISLAND · 13 / 13 COMPLETE</p><p>모든 마법의 룬을 해독하고 여행을 완료했습니다.</p><button type="button" class="moon-primary" data-act="certificate">정식 탑승인증서 보기</button></div>
      <div class="moon-controls"><button type="button" data-act="replay">↻ 엔딩 다시 보기</button></div></section>`;
    root.querySelector('[data-act="certificate"]').onclick = () => {
      if (typeof certificate === 'function') certificate();
      else document.getElementById('certificateButton')?.click();
    };
    root.querySelector('[data-act="replay"]').onclick = sequence;
  }
  function stop() {
    clear();
    root = null;
    finish = null;
    certificate = null;
    selected = [];
    puzzle = null;
  }
  return { start, stop };
})();
