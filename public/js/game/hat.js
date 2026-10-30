// ============================================================================
// 10. 마법사의 모자 숲 · 모자 셔플
// ============================================================================

const HatGame = (() => {
  'use strict';
  const LEVELS = [
    { hats: 3, swaps: 3, speed: 800 },
    { hats: 3, swaps: 5, speed: 650 },
    { hats: 4, swaps: 6, speed: 580 },
    { hats: 4, swaps: 8, speed: 450 },
    { hats: 5, swaps: 10, speed: 340 },
  ];
  let root = null,
    onComplete = null,
    level = 0,
    target = 0,
    positions = [],
    phase = 'idle';
  let generation = 0,
    pending = new Set(),
    animations = new Set(),
    completed = false;
  const wait = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(() => {
        pending.delete(id);
        resolve();
      }, ms);
      pending.add(id);
    });
  function cancelAsync() {
    generation++;
    for (const id of pending) clearTimeout(id);
    pending.clear();
    for (const a of animations) a.cancel();
    animations.clear();
  }
  const el = (selector) => root && root.querySelector(selector);
  function setMessage(message) {
    const node = el('.hat-message');
    if (node) node.textContent = message;
  }
  function updateProgress() {
    const p = el('.hat-progress');
    if (p) p.textContent = `라운드 ${level + 1} / ${LEVELS.length}`;
  }
  function slotLeft(slot, count) {
    return `${((slot + 0.5) / count) * 100}%`;
  }
  function makeHats() {
    const area = el('.hat-arena');
    area.replaceChildren();
    const count = LEVELS[level].hats;
    positions = Array.from({ length: count }, (_, i) => i);
    target = Math.floor(Math.random() * count);
    for (let i = 0; i < count; i++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hat-cup';
      button.dataset.hat = String(i);
      button.style.left = slotLeft(i, count);
      button.setAttribute('aria-label', `${i + 1}번 모자`);
      button.innerHTML = `
        <span class="hat-orb" aria-hidden="true"><img src="assets/images/hat/hat_orb.png" alt=""></span>
        <span class="hat-icon" aria-hidden="true"><img src="assets/images/hat/hat_hat.png" alt=""></span>`;
      button.addEventListener('click', () => choose(i));
      area.appendChild(button);
    }
  }
  function setCupState() {
    if (!root) return;
    root.querySelectorAll('.hat-cup').forEach((cup) => {
      const id = Number(cup.dataset.hat);
      cup.classList.toggle('is-revealed', phase === 'reveal' && id === target);
      cup.disabled = phase !== 'choose';
    });
  }
  // 화면 렌더링
  function render() {
    root.innerHTML = `
      <section class="hat-game" aria-label="마법사의 모자 셔플 게임">
        <div class="hat-intro">
          <div class="hat-intro-art">🎩✨🔮</div>
          <h3>반짝이는 구슬을 찾아라!</h3>
          <p>마법사의 모자 숲에 도착한 느요미! 모자들이 둥실둥실 떠올랐어요.</p>
          <p>“호호! 반짝이는 구슬이 어느 모자에 있는지 맞혀 보렴!”</p>
        </div>
        <div class="hat-toolbar">
          <strong class="hat-progress"></strong>
          <button type="button" class="hat-restart">🔄 처음부터 다시하기</button>
        </div>
        <div class="hat-stage" aria-label="움직이는 마법 모자">
          <div class="hat-arena"></div>
          <div class="hat-stage-floor"></div>
        </div>
        <p class="hat-message" role="status" aria-live="polite"></p>
        <div class="hat-controls"><button type="button" class="hat-action" disabled>준비 중...</button></div>
        <p class="hat-guide">구슬의 위치를 기억하고 모자가 섞이는 동안 눈으로 따라가세요. 셔플이 끝나면 모자를 클릭!</p>
      </section>`;
    el('.hat-restart').addEventListener('click', () => begin(0));
    el('.hat-action').addEventListener('click', action);
  }
  function action() {
    if (phase === 'ready') play();
    else if (phase === 'retry') begin(level);
    else if (phase === 'next') begin(level + 1);
  }
  function setAction(label, enabled) {
    const b = el('.hat-action');
    if (b) {
      b.textContent = label;
      b.disabled = !enabled;
    }
  }
  function begin(nextLevel) {
    if (!root || completed) return;
    cancelAsync();
    level = nextLevel;
    phase = 'ready';
    makeHats();
    updateProgress();
    setCupState();
    setMessage(`${LEVELS[level].hats}개의 모자 중 하나에 마법 구슬이 숨어 있어요. 준비되면 시작!`);
    setAction('✨ 구슬 확인하고 시작하기', true);
  }
  async function play() {
    if (!root || phase !== 'ready') return;
    const token = ++generation;
    phase = 'reveal';
    setAction('구슬을 기억하세요!', false);
    setMessage('✨ 반짝이는 구슬의 위치를 잘 기억해 주세요!');
    setCupState();
    await wait(1900);
    if (token !== generation || !root) return;
    phase = 'shuffle';
    setCupState();
    setMessage('🎩 모자들이 움직여요! 구슬을 끝까지 따라가세요.');
    setAction('모자를 섞는 중...', false);
    const { hats, swaps, speed } = LEVELS[level];
    for (let s = 0; s < swaps; s++) {
      if (token !== generation || !root) return;
      const first = Math.floor(Math.random() * hats);
      let second = Math.floor(Math.random() * (hats - 1));
      if (second >= first) second++;
      await swap(first, second, speed, token);
      if (token !== generation || !root) return;
      await wait(Math.max(90, speed * 0.14));
    }
    if (token !== generation || !root) return;
    phase = 'choose';
    setCupState();
    setMessage('어느 모자에 구슬이 있을까요? 모자를 하나 골라 보세요!');
    setAction('모자를 클릭해 정답 선택!', false);
  }
  async function swap(a, b, duration, token) {
    const area = el('.hat-arena');
    if (!area) return;
    const cupA = area.querySelector(`[data-hat="${a}"]`);
    const cupB = area.querySelector(`[data-hat="${b}"]`);
    const xA = positions[a],
      xB = positions[b];
    const step = area.getBoundingClientRect().width / LEVELS[level].hats;
    const dx = (xB - xA) * step;
    const animA = cupA.animate(
      [
        { transform: 'translate(-50%, 0)' },
        { transform: `translate(calc(-50% + ${dx / 2}px), -28px)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${dx}px), 0)` },
      ],
      { duration, easing: 'ease-in-out' },
    );
    const animB = cupB.animate(
      [
        { transform: 'translate(-50%, 0)' },
        { transform: `translate(calc(-50% - ${dx / 2}px), 22px)`, offset: 0.5 },
        { transform: `translate(calc(-50% - ${dx}px), 0)` },
      ],
      { duration, easing: 'ease-in-out' },
    );
    animations.add(animA);
    animations.add(animB);
    await Promise.all([animA.finished.catch(() => {}), animB.finished.catch(() => {})]);
    animations.delete(animA);
    animations.delete(animB);
    if (token !== generation || !root) return;
    [positions[a], positions[b]] = [positions[b], positions[a]];
    cupA.style.left = slotLeft(positions[a], LEVELS[level].hats);
    cupB.style.left = slotLeft(positions[b], LEVELS[level].hats);
    animA.cancel();
    animB.cancel();
  }
  async function choose(id) {
    if (phase !== 'choose' || !root) return;
    phase = 'result';
    setCupState();
    const correct = id === target;
    const selected = el(`.hat-cup[data-hat="${id}"]`);
    const answer = el(`.hat-cup[data-hat="${target}"]`);
    selected.classList.add(correct ? 'is-correct' : 'is-wrong');
    answer.classList.add('is-revealed', 'is-correct');
    if (!correct) {
      setMessage('앗! 구슬은 반짝이는 모자 아래에 있었어요. 같은 라운드를 다시 도전해요!');
      phase = 'retry';
      setAction('🔄 이 라운드 다시 도전', true);
      return;
    }
    if (level < LEVELS.length - 1) {
      setMessage(`정답! 🎉 ${level + 1}라운드 통과! 다음 라운드에 도전해 볼까요?`);
      phase = 'next';
      setAction('다음 라운드 →', true);
      return;
    }
    completed = true;
    phase = 'complete';
    setMessage('🎉 5라운드 모두 성공! “호호호! 느요미, 눈썰미가 아주 좋구나!”');
    setAction('🎩 모자 셔플 완전 정복!', false);
    const callback = onComplete;
    if (typeof callback === 'function') callback();
  }
  // 게임 시작
  function start(container, callback) {
    stop();
    if (!container) return;
    root = container;
    onComplete = callback;
    completed = false;
    render();
    begin(0);
  }
  function stop() {
    cancelAsync();
    root = null;
    onComplete = null;
    phase = 'idle';
    completed = false;
  }
  return { start, stop };
})();
