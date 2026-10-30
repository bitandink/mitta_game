// ============================================================================
// 02. 불타는 동굴 · 용암 탈출
// ============================================================================

const CaveGame = (() => {
  const SIZE = 6;
  const START = [5, 0];
  const EXIT = [0, 5];
  const CYCLE = 5500; // 안전 3초, 경고 1.5초, 위험 1초
  const SAFE = 3000;
  const WARNING = 4500;

  // Stage 2 art assets (relative to index.html)
  const ART = {
    safe: 'assets/images/cave/cave_safe.png',
    warning: 'assets/images/cave/cave_warning.png',
    danger: 'assets/images/cave/cave_lava.png',
    player: 'assets/images/cave/cave_witch.png',
  };
  const FALLBACK = { safe: '🪨', warning: '⚠️', danger: '🔥', player: '🧙' };
  const sprite = (key) =>
    `<span class="cave-sprite"><img src="${ART[key]}" alt="" draggable="false" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="cave-fallback" hidden>${FALLBACK[key]}</span></span>`;

  let cleanup = () => {};

  // 게임 시작
  function start(container, onComplete) {
    cleanup();

    let active = true;
    let won = false;
    let position = [...START];
    let resets = 0;
    let tickId = null;
    let startTime = performance.now();

    const offsets = Array.from(
      { length: SIZE * SIZE },
      (_, i) => (i * 1379 + Math.floor(i / SIZE) * 487) % CYCLE,
    );

    const index = (r, c) => r * SIZE + c;

    const stateAt = (r, c, now) => {
      // 출발점은 항상 안전한 발판
      if (r === START[0] && c === START[1]) {
        return 'safe';
      }

      const elapsed = (now - startTime + offsets[index(r, c)]) % CYCLE;

      return elapsed < SAFE ? 'safe' : elapsed < WARNING ? 'warning' : 'danger';
    };

    container.innerHTML = `
        <section class="cave-game" aria-label="불타는 동굴 게임">
          <p class="cave-story">느요미가 뜨거운 용암이 끓어오르는 동굴에 들어왔어요!<br>발판이 붉게 달아오르기 전에 움직여 출구까지 탈출해 주세요. 🔥</p>
          <p class="cave-guide">□ 안전 · ⚠️ 경고: 이동 가능 / 🔥 위험: 즉시 출발점으로!</p>
          <div class="cave-status"><span class="cave-message" role="status" aria-live="polite">방향키 또는 인접한 발판을 눌러 이동하세요.</span><span class="cave-resets">리셋 0회</span></div>
          <div class="cave-grid" role="group" aria-label="6행 6열 동굴 발판"></div>
          <div class="cave-actions"><button type="button" class="cave-restart">처음부터</button></div>
        </section>`;

    const grid = container.querySelector('.cave-grid');
    const message = container.querySelector('.cave-message');
    const resetText = container.querySelector('.cave-resets');
    const cells = [];

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cave-cell';
        button.addEventListener('click', () => move(r, c));
        grid.append(button);
        cells.push(button);
      }
    }

    function reset() {
      position = [...START];
      resets++;

      resetText.textContent = `리셋 ${resets}회`;
      message.textContent = '앗, 용암이에요! 출발점으로 돌아왔어요.';

      render();
    }

    function render() {
      if (!active) return;
      const now = performance.now();
      if (!won && stateAt(position[0], position[1], now) === 'danger') {
        reset();
        return;
      }
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const button = cells[index(r, c)];
          const state = stateAt(r, c, now);
          const player = position[0] === r && position[1] === c;
          const exit = EXIT[0] === r && EXIT[1] === c;
          button.className = `cave-cell cave-${state}${player ? ' cave-player' : ''}`;
          // Only visual markup changes; state, collision and timing remain intact.
          button.innerHTML = player
            ? sprite('player')
            : exit
            ? '<span class="cave-exit" aria-hidden="true">🚪</span>'
            : sprite(state);
          button.setAttribute(
            'aria-label',
            `${r + 1}행 ${c + 1}열 ${exit ? '출구 ' : ''}${
              state === 'safe' ? '안전' : state === 'warning' ? '경고' : '위험'
            }${player ? ', 느요미 위치' : ''}`,
          );
          button.disabled = won;
        }
      }
    }

    function move(r, c) {
      if (!active || won || r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
      if (Math.abs(position[0] - r) + Math.abs(position[1] - c) !== 1) return;
      if (stateAt(r, c, performance.now()) === 'danger') {
        reset();
        return;
      }
      position = [r, c];
      if (r === EXIT[0] && c === EXIT[1]) {
        won = true;
        message.textContent = '🎉 동굴 탈출 성공! 별을 획득했어요! ⭐';
        onComplete();
        if (tickId !== null) clearInterval(tickId);
      }
      render();
    }

    function onKeyDown(event) {
      if (
        !active ||
        won ||
        !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
      )
        return;
      event.preventDefault();
      const [r, c] = position;
      const next = {
        ArrowUp: [r - 1, c],
        ArrowDown: [r + 1, c],
        ArrowLeft: [r, c - 1],
        ArrowRight: [r, c + 1],
      }[event.key];
      move(...next);
    }

    container
      .querySelector('.cave-restart')
      .addEventListener('click', () => start(container, onComplete));
    document.addEventListener('keydown', onKeyDown);
    tickId = setInterval(render, 100);

    render();

    cleanup = () => {
      active = false;
      if (tickId !== null) clearInterval(tickId);
      document.removeEventListener('keydown', onKeyDown);
    };
  }

  return { start, stop: () => cleanup() };
})();
