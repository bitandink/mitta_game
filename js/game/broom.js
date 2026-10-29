// ============================================================================
// 08. 마녀의 빗자루 언덕 · 비행 시험
// ============================================================================

const BroomGame = (() => {
  let root = null,
    canvas = null,
    ctx = null,
    raf = 0,
    last = 0;
  let keyUp = false,
    keyDown = false,
    pointerUp = false,
    pointerDown = false;
  let running = false,
    finished = false,
    callback = null,
    world = null;
  const W = 760,
    H = 380,
    PLAYER_X = 172,
    RING_X = 545;
  const RING_COUNT = 7,
    SPEED = 145,
    RING_SPEED = 175;
  const SPRITE_PATH = 'assets/images/broom/';
  const spriteFiles = {
    ring: SPRITE_PATH + 'broom_ring.png',
    bat: SPRITE_PATH + 'broom_bat.png',
    parking: SPRITE_PATH + 'parking.png',
    witch: SPRITE_PATH + 'broom_witch.png',
  };
  const sprites = {};
  Object.entries(spriteFiles).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    sprites[key] = img;
  });
  function sprite(key, x, y, width, height) {
    const img = sprites[key];
    if (!img || !img.complete || !img.naturalWidth) return false;
    ctx.drawImage(img, x, y, width, height);
    return true;
  }
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand = (a, b) => a + Math.random() * (b - a);

  // 게임 월드 생성
  function makeWorld() {
    return {
      y: 190,
      vy: 0,
      lives: 3,
      passed: 0,
      attempts: 0,
      ring: { x: W + 55, y: 190, radius: 58, counted: false },
      obstacles: [],
      particles: [],
      tick: 0,
      phase: 'flying',
      landing: { x: W + 140, y: H - 65, width: 124 },
      invuln: 0,
      message: '첫 번째 마법 고리를 통과해 보세요!',
      messageTime: 3,
      spawnClock: 0,
      flash: 0,
    };
  }
  function setMessage(msg, time = 1.7) {
    world.message = msg;
    world.messageTime = time;
  }
  // 진행 상태 표시
  function setHud() {
    if (!root || !world) return;
    root.querySelector('[data-broom-progress]').textContent = `${world.passed} / ${RING_COUNT}`;
    root.querySelector('[data-broom-lives]').textContent =
      '💜'.repeat(world.lives) + '♡'.repeat(3 - world.lives);
    root.querySelector('[data-broom-status]').textContent =
      world.messageTime > 0
        ? world.message
        : world.phase === 'landing'
        ? '착륙장 높이에 맞춰 천천히 접근하세요!'
        : '↑ ↓ 키로 높이를 맞춰 주세요!';
  }
  function resetRing() {
    world.ring = { x: W + 75, y: rand(100, H - 112), radius: 58, counted: false };
    world.attempts++;
  }
  function hit() {
    if (world.invuln > 0 || world.phase === 'done') return;
    world.lives--;
    world.invuln = 1.7;
    world.flash = 0.25;
    world.obstacles = [];
    if (world.lives <= 0) {
      world.phase = 'lost';
      setMessage('시험 불합격! 다시 도전해 보세요.', 1000);
      running = false;
      root.querySelector('[data-broom-restart]').textContent = '🔄 다시하기';
    } else {
      setMessage('앗! 장애물에 부딪혔어요. 조심하세요!', 2);
    }
  }
  function ringMiss() {
    setMessage('고리를 놓쳤어요! 같은 고리에 다시 도전!', 2);
    resetRing();
  }
  function ringPass() {
    world.passed++;
    world.particles.push(
      ...Array.from({ length: 18 }, () => ({
        x: PLAYER_X + 20,
        y: world.y,
        vx: rand(-90, 90),
        vy: rand(-90, 90),
        t: 0.7,
      })),
    );
    if (world.passed === RING_COUNT) {
      world.phase = 'landing';
      world.obstacles = [];
      setMessage('7개 고리 통과! 이제 착륙장에 내려앉으세요!', 3);
    } else {
      setMessage(`마법 고리 통과! ${world.passed} / ${RING_COUNT} ✨`, 1.5);
      resetRing();
    }
  }
  function succeed() {
    if (finished) return;
    finished = true;
    running = false;
    world.phase = 'done';
    setMessage('🎉 빗자루 면허 합격! 느요미, 축하해!', 1000);
    root.querySelector('[data-broom-result]').hidden = false;
    root.querySelector('[data-broom-result]').textContent = '🧙‍♀️ 빗자루 면허 취득! ✨';
    setHud();
    if (typeof callback === 'function') callback();
  }
  // 상태 갱신
  function update(dt) {
    if (!running || !world) return;
    world.tick += dt;
    world.invuln = Math.max(0, world.invuln - dt);
    world.flash = Math.max(0, world.flash - dt);
    world.messageTime = Math.max(0, world.messageTime - dt);
    const move = (keyUp || pointerUp ? -1 : 0) + (keyDown || pointerDown ? 1 : 0);
    world.y = clamp(world.y + move * SPEED * dt, 34, H - 75);
    world.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.t -= dt;
    });
    world.particles = world.particles.filter((p) => p.t > 0);
    if (world.phase === 'flying') {
      const ring = world.ring;
      const oldX = ring.x;
      ring.x -= RING_SPEED * dt;
      // Crossing occurs when the ring's center passes the player's center.
      if (!ring.counted && oldX >= PLAYER_X && ring.x < PLAYER_X) {
        ring.counted = true;
        if (Math.abs(world.y - ring.y) <= ring.radius - 20) ringPass();
        else ringMiss();
      }
      world.spawnClock += dt;
      if (world.spawnClock >= 2.1 && world.obstacles.length < 2) {
        world.spawnClock = 0;
        const y = rand(70, H - 120);
        // Keep the next ring's approach clear enough to react.
        if (Math.abs(y - world.ring.y) > 75) world.obstacles.push({ x: W + 30, y, kind: 'bat' });
      }
      for (const o of world.obstacles) {
        o.x -= (RING_SPEED + 15) * dt;
        if (Math.hypot(o.x - PLAYER_X, o.y - world.y) < 34) hit();
      }
      world.obstacles = world.obstacles.filter((o) => o.x > -40);
    } else if (world.phase === 'landing') {
      const pad = world.landing;
      pad.x -= 90 * dt;
      // Land when the broom reaches the platform horizontally and is close to its height.
      if (pad.x <= PLAYER_X + 16 && pad.x + pad.width >= PLAYER_X - 16) {
        if (Math.abs(world.y - (pad.y - 25)) <= 30) succeed();
      }
      if (pad.x + pad.width < PLAYER_X - 20) {
        pad.x = W + 80;
        setMessage('착륙장을 지나쳤어요! 다시 접근합니다.', 2);
      }
    }
    setHud();
  }
  // 화면 그리기
  function draw() {
    if (!ctx || !world) return;
    const t = world.tick;
    // The illustrated stage backdrop is on .modal_content; keep canvas clear.
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(24, 16, 46, 0.34)';
    ctx.fillRect(0, 0, W, H);
    if (world.phase === 'flying') {
      const r = world.ring;
      if (!sprite('ring', r.x - 57.5, r.y - 75, 115, 150)) {
        ctx.strokeStyle = '#ffdd8b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 25, r.radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const o of world.obstacles) {
        if (!sprite('bat', o.x - 36, o.y - 32.5, 72, 65)) {
          ctx.font = '32px serif';
          ctx.fillText('🦇', o.x, o.y + 10);
        }
      }
    }
    if (world.phase === 'landing' || world.phase === 'done') {
      const p = world.landing;
      if (!sprite('parking', p.x - 55, p.y - 145, p.width + 110, 159)) {
        ctx.fillStyle = '#b58be4';
        ctx.fillRect(p.x, p.y, p.width, 12);
        ctx.fillStyle = '#fbe5a6';
        ctx.font = '17px sans-serif';
        ctx.fillText('착륙장 ✨', p.x + p.width / 2, p.y - 10);
      }
    }
    if (world.invuln <= 0 || Math.floor(world.invuln * 10) % 2 === 0) {
      ctx.save();
      ctx.translate(PLAYER_X, world.y + Math.sin(t * 6) * 2);
      if (!sprite('witch', -62.5, -62.5, 125, 125)) {
        ctx.font = '42px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧙‍♀️🧹', 0, 12);
      }
      ctx.restore();
    }
    for (const p of world.particles) {
      ctx.globalAlpha = clamp(p.t / 0.7, 0, 1);
      ctx.fillStyle = '#ffe6a5';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (world.phase === 'lost') {
      ctx.fillStyle = 'rgba(19,11,37,.8)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff0c5';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('시험 불합격!', W / 2, H / 2 - 12);
      ctx.font = '18px sans-serif';
      ctx.fillText('다시 도전해 봐요!', W / 2, H / 2 + 23);
    }
  }
  function frame(ts) {
    if (!root) return;
    const dt = Math.min((ts - (last || ts)) / 1000, 0.045);
    last = ts;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }
  function onKeyDown(e) {
    if (!root || !root.isConnected || finished) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.key === 'ArrowUp') keyUp = true;
      else keyDown = true;
    }
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowUp') keyUp = false;
    if (e.key === 'ArrowDown') keyDown = false;
  }
  function bindTouch(button, direction) {
    const set = (value) => {
      if (direction === 'up') pointerUp = value;
      else pointerDown = value;
    };
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      set(true);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
      button.addEventListener(name, () => set(false));
  }
  function restart() {
    finished = false;
    running = true;
    last = 0;
    keyUp = keyDown = pointerUp = pointerDown = false;
    world = makeWorld();
    resetRing();
    root.querySelector('[data-broom-result]').hidden = true;
    setHud();
  }
  // 게임 시작
  function start(container, onComplete) {
    stop();
    root = container;
    callback = onComplete;
    root.innerHTML = `
      <section class="broom-game" aria-label="마녀의 빗자루 면허 시험">
        <div class="broom-intro">
          <div class="broom-intro-art">🧙‍♀️🧹✨</div>
          <h3>느요미의 빗자루 면허 시험!</h3>
          <p>마법진을 되찾아 준 느요미에게 꼬마 마녀가 빗자루를 건넸어요!</p>
          <p>“히히! 빗자루를 타려면 면허 시험부터 통과해야 해!”</p>
          <p>마법 고리 7개를 통과하고 착륙장에 무사히 내려앉으세요!</p>
        </div>
        <div class="broom-hud"><span>✨ 통과한 고리 <strong data-broom-progress>0 / 7</strong></span><span>목숨 <strong data-broom-lives>💜💜💜</strong></span></div>
        <div class="broom-canvas-wrap"><canvas class="broom-canvas" width="${W}" height="${H}" aria-label="빗자루 비행 게임 화면"></canvas></div>
        <p class="broom-status" data-broom-status role="status" aria-live="polite"></p>
        <div class="broom-controls"><button type="button" class="broom-control" data-broom-up aria-label="상승">↑ 상승</button><button type="button" class="broom-control" data-broom-down aria-label="하강">↓ 하강</button></div>
        <p class="broom-help">⌨️ 방향키 ↑ ↓로 고도를 조절해 고리 중앙을 통과하세요. 놓친 고리는 다시 나타나요!</p>
        <p class="broom-result" data-broom-result hidden></p>
        <div class="broom-actions"><button type="button" data-broom-restart class="broom-restart">🔄 다시하기</button></div>
      </section>`;
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    bindTouch(root.querySelector('[data-broom-up]'), 'up');
    bindTouch(root.querySelector('[data-broom-down]'), 'down');
    root.querySelector('[data-broom-restart]').addEventListener('click', restart);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    restart();
    raf = requestAnimationFrame(frame);
  }
  function clearKeys() {
    keyUp = keyDown = pointerUp = pointerDown = false;
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    running = false;
    finished = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', clearKeys);
    clearKeys();
    root = canvas = ctx = world = callback = null;
    last = 0;
  }
  return { start, stop };
})();
