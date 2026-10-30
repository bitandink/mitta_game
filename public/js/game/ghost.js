// ============================================================================
// 11. 반짝이는 유령 연못 · 거울 퍼즐
// ============================================================================

(function (global) {
  'use strict';
  const CONFIG = [
    { count: 3, wrong: 1 }, { count: 4, wrong: 1 },
    { count: 4, wrong: 1 }, { count: 5, wrong: 2 },
    { count: 6, wrong: 2 }
  ];
  const ASSET_ROOT = 'assets/images/ghost/';
  let root = null, finishCallback = null, round = 0, state = null, locked = false, completed = false;

  function randomInt(max) { return Math.floor(Math.random() * max); }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Six fixed ghost identities. Only the reflection may use one of two variant PNGs.
  function createGhost(index) {
    return { sprite: index + 1, variant: 0 };
  }
  function changedGhost(ghost) {
    return { ...ghost, variant: randomInt(2) + 1 };
  }
  function ghostArt(ghost, reflected) {
    const suffix = ghost.variant === 0 ? 'original' : `variant_${ghost.variant}`;
    const src = `${ASSET_ROOT}ghost_${ghost.sprite}_${suffix}.png`;
    return `<span class="ghost-art ${reflected ? 'ghost-art-reflected' : ''}">
      <img class="ghost-sprite" src="${src}" alt="${reflected ? '연못에 비친 유령' : '연못 위 유령'}" draggable="false">
    </span>`;
  }

  function prepareRound() {
    const cfg = CONFIG[round];
    const identities = shuffle([0, 1, 2, 3, 4, 5]).slice(0, cfg.count);
    const originals = identities.map(createGhost);
    const wrongIndices = new Set(shuffle([...Array(cfg.count).keys()]).slice(0, cfg.wrong));
    const reflections = originals.map((g, i) => wrongIndices.has(i) ? changedGhost(g) : { ...g });
    state = { originals, reflections, wrongIndices, found: new Set(), mistakes: 0 };
    locked = false;
    render();
  }
  // 화면 렌더링
  function render() {
    if (!root || !state) return;
    const cfg = CONFIG[round];
    root.innerHTML = `<section class="ghost-game">
      <div class="ghost-intro"><div class="ghost-intro-art">👻🌙✨</div><h3>반짝이는 유령 연못</h3><p>달빛 연못에 도착한 느요미! 장난꾸러기 유령들이 가짜 그림자를 숨겨 놓았어요.</p><p>“히히! 진짜 모습과 다른 그림자를 찾아봐!”</p></div>
      <div class="ghost-status"><strong>라운드 ${round + 1} / ${CONFIG.length}</strong><span>찾은 가짜 그림자 <b data-ghost-found>${state.found.size}</b> / ${cfg.wrong}</span></div>
      <p class="ghost-instruction">위쪽 유령과 아래쪽 물속 모습을 비교하고, <strong>다른 그림자</strong>를 눌러 주세요!</p>
      <div class="ghost-pond"><div class="ghost-sky-label">🌙 연못 위의 유령들</div><div class="ghost-grid" style="--ghost-columns:${cfg.count}">${state.originals.map(g => `<div class="ghost-figure">${ghostArt(g, false)}</div>`).join('')}</div><div class="ghost-waterline"></div><div class="ghost-water-label">💧 물속에 비친 모습</div><div class="ghost-grid ghost-reflections" style="--ghost-columns:${cfg.count}">${state.reflections.map((g, i) => `<button type="button" class="ghost-reflection ${state.found.has(i) ? 'is-found' : ''}" data-ghost-index="${i}" aria-label="${i + 1}번째 그림자 확인" ${state.found.has(i) || locked ? 'disabled' : ''}>${ghostArt(g, true)}<span class="ghost-number">${i + 1}</span></button>`).join('')}</div></div>
      <div class="ghost-feedback" aria-live="polite">${state.found.size ? '✨ 잘 찾았어요! 남은 그림자도 찾아봐요.' : '🔍 장식, 표정, 색깔을 자세히 살펴보세요.'}</div>
      <div class="ghost-actions"><button type="button" data-ghost-restart>🔄 처음부터 다시하기</button></div>
    </section>`;
    root.querySelectorAll('[data-ghost-index]').forEach(btn => btn.addEventListener('click', () => choose(Number(btn.dataset.ghostIndex))));
    root.querySelector('[data-ghost-restart]').addEventListener('click', restart);
  }
  function choose(index) {
    if (!root || !state || locked || state.found.has(index)) return;
    const feedback = root.querySelector('.ghost-feedback');
    if (state.wrongIndices.has(index)) {
      state.found.add(index);
      const btn = root.querySelector(`[data-ghost-index="${index}"]`);
      btn.classList.add('is-found'); btn.disabled = true;
      root.querySelector('[data-ghost-found]').textContent = state.found.size;
      feedback.textContent = '✨ 정답! 물결 속의 가짜 그림자를 발견했어요!';
      if (state.found.size === state.wrongIndices.size) {
        locked = true;
        root.querySelectorAll('[data-ghost-index]').forEach(b => b.disabled = true);
        if (round === CONFIG.length - 1) {
          completed = true;
          feedback.textContent = '🎉 모든 가짜 그림자를 찾았어요! 유령들이 길을 열어 주었어요!';
          if (typeof finishCallback === 'function') { const cb = finishCallback; finishCallback = null; cb(); }
        } else {
          feedback.textContent = '🌟 성공! 다음 라운드로 넘어가요.';
          const actions = root.querySelector('.ghost-actions');
          const next = document.createElement('button');
          next.type = 'button'; next.className = 'ghost-next'; next.textContent = '다음 라운드 →';
          next.addEventListener('click', () => { round++; prepareRound(); });
          actions.prepend(next);
        }
      }
    } else {
      state.mistakes++;
      feedback.textContent = '💦 앗, 이 그림자는 진짜예요! 다시 살펴보세요.';
      const btn = root.querySelector(`[data-ghost-index="${index}"]`);
      btn.classList.remove('is-shaking'); void btn.offsetWidth; btn.classList.add('is-shaking');
    }
  }
  function restart() { round = 0; completed = false; prepareRound(); }
  const GhostGame = {
    start(container, onComplete) {
      this.stop();
      root = container; finishCallback = onComplete; round = 0; completed = false;
      if (!root) return;
      prepareRound();
    },
    stop() { if (root) root.innerHTML = ''; root = null; state = null; finishCallback = null; locked = false; completed = false; }
  };
  global.GhostGame = GhostGame;
})(window);
