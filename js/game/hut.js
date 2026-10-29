// ============================================================================
// 07. 꼬마 마녀의 오두막 · 마법진 땅따먹기
// ============================================================================

const HutGame = (() => {
  'use strict';
  const W = 32, H = 22, GOAL = 70, STEP = 95;
  let root = null, done = null, grid = [], player = { x: 0, y: 0 }, enemy = { x: 16, y: 11, dx: 1, dy: 1 }, trail = [], drawing = false, lives = 3, won = false, ended = false, timer = null, keys = new Set(), lastMove = 0, raf = null, session = 0;
  const id = (x, y) => y * W + x, inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  // 초기 상태 설정
  function init() { grid = Array(W * H).fill(0); for (let x = 0; x < W; x++) { grid[id(x, 0)] = 1; grid[id(x, H - 1)] = 1; } for (let y = 0; y < H; y++) { grid[id(0, y)] = 1; grid[id(W - 1, y)] = 1; } player = { x: 0, y: 0 }; enemy = { x: 16, y: 11, dx: 1, dy: 1 }; trail = []; drawing = false; lives = 3; won = false; ended = false; keys.clear(); }
  function percentage() { let n = 0; for (let y = 1; y < H - 1; y++)for (let x = 1; x < W - 1; x++)n += grid[id(x, y)] === 1 ? 1 : 0; return Math.round(n / ((W - 2) * (H - 2)) * 100); }
  function message(t) { const e = root?.querySelector('.hut-message'); if (e) e.textContent = t; }
  function status() { if (!root) return; root.querySelector('.hut-percent').textContent = percentage() + '%'; root.querySelector('.hut-lives').textContent = '💜'.repeat(lives) || '0'; }
  function lose() { trail.forEach(p => grid[id(p.x, p.y)] = 0); trail = []; drawing = false; player = { x: 0, y: 0 }; lives--; if (lives <= 0) { ended = true; message('마법 구슬이 힘을 잃었어요! 다시 시작해 보세요.'); } else message('👻 유령이 마법선에 닿았어요! 목숨 -1'); status(); }
  function capture() {
    const seen = new Uint8Array(W * H), q = [id(enemy.x, enemy.y)]; let head = 0; while (head < q.length) { const k = q[head++]; if (k < 0 || k >= grid.length || seen[k] || grid[k] !== 0) continue; seen[k] = 1; const x = k % W, y = Math.floor(k / W); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (inside(nx, ny)) q.push(id(nx, ny)); } }
    for (let y = 1; y < H - 1; y++)for (let x = 1; x < W - 1; x++) { const k = id(x, y); if (!seen[k]) grid[k] = 1; }
    trail = []; drawing = false; status(); if (percentage() >= GOAL) { won = true; ended = true; root.querySelector('.hut-game')?.classList.add('hut-complete'); message('🎉 마법진을 되찾았어요!'); if (typeof done === 'function') { const cb = done; done = null; cb(); } } else message('✨ 마법진 일부를 되찾았어요!');
  }
  // 이동 처리
  function move(dx, dy, cast) {
    if (!root || ended) return; const nx = player.x + dx, ny = player.y + dy; if (!inside(nx, ny)) return; const cell = grid[id(nx, ny)]; if (drawing) { if (cell === 2) { message('이미 그린 마법선은 지나갈 수 없어요!'); return; } if (cell === 1) { if (trail.length) { player = { x: nx, y: ny }; capture(); } else player = { x: nx, y: ny }; return; } grid[id(nx, ny)] = 2; trail.push({ x: nx, y: ny }); player = { x: nx, y: ny }; return; }
    if (cell === 1) { player = { x: nx, y: ny }; return; } if (!cast) { message('✨ Space를 누른 채 방향키로 안개에 진입하세요!'); return; } drawing = true; grid[id(nx, ny)] = 2; trail = [{ x: nx, y: ny }]; player = { x: nx, y: ny }; message('마법선을 안전한 영역에 연결하세요!');
  }
  function ghostStep() { if (ended) return; let nx = enemy.x + enemy.dx, ny = enemy.y + enemy.dy; if (!inside(nx, ny) || grid[id(nx, ny)] === 1) { enemy.dx *= -1; nx = enemy.x + enemy.dx; } if (!inside(nx, ny) || grid[id(nx, ny)] === 1) { enemy.dy *= -1; ny = enemy.y + enemy.dy; nx = enemy.x; } if (!inside(nx, ny) || grid[id(nx, ny)] === 1) return; if (grid[id(nx, ny)] === 2) { lose(); return; } enemy.x = nx; enemy.y = ny; if (drawing && player.x === nx && player.y === ny) lose(); }
  // Stage 07 illustrated sprites (emoji fallback while images load)
  const spritePaths = {
    broomIdle: 'assets/images/hut/broom_idle.png',
    broomMove: 'assets/images/hut/broom_move.png',
    ghost: 'assets/images/hut/ghost_lantern.png'
  };
  const sprites = {};
  for (const [key, src] of Object.entries(spritePaths)) {
    const img = new Image(); img.src = src; sprites[key] = img;
  }
  // 화면 그리기
  function draw() {
    if (!root) return; const canvas = root.querySelector('canvas'), c = canvas.getContext('2d'), s = 18; c.clearRect(0, 0, W * s, H * s); c.fillStyle = '#180e2a'; c.fillRect(0, 0, W * s, H * s); for (let y = 0; y < H; y++)for (let x = 0; x < W; x++) { const v = grid[id(x, y)]; if (v) { c.fillStyle = v === 1 ? '#7350a3' : '#f6ce7b'; c.fillRect(x * s, y * s, s, s); } else { c.strokeStyle = 'rgba(181,151,213,.07)'; c.strokeRect(x * s, y * s, s, s); } }
    c.textAlign = 'center'; c.textBaseline = 'middle'; const ghost = sprites.ghost;
    if (ghost.complete && ghost.naturalWidth) c.drawImage(ghost, enemy.x * s - 5, enemy.y * s - 8, 30, 32);
    else { c.font = '23px sans-serif'; c.fillText('👻', (enemy.x + .5) * s, (enemy.y + .5) * s); }
    const broom = sprites[drawing ? 'broomMove' : 'broomIdle'];
    if (broom.complete && broom.naturalWidth) c.drawImage(broom, player.x * s - 7, player.y * s - 9, 33, 35);
    else { c.font = '20px sans-serif'; c.fillText('✨', (player.x + .5) * s, (player.y + .5) * s); }
  }
  function frame(t) { if (!root) return; if (t - lastMove >= STEP) { const directions = [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]]; for (const [k, dx, dy] of directions) { if (keys.has(k)) { move(dx, dy, keys.has('Space')); break; } } lastMove = t; } draw(); raf = requestAnimationFrame(frame); }
  function onKeyDown(e) { if (!root) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) { e.preventDefault(); keys.add(e.code); } }
  function onKeyUp(e) { keys.delete(e.code); }
  function restart() { root?.querySelector('.hut-game')?.classList.remove('hut-complete'); init(); status(); message('방향키로 이동하고 Space + 방향키로 마법선을 그리세요!'); }
  // 게임 시작
  function start(container, callback) {
    stop(); root = container; done = callback; const current = ++session; root.innerHTML = `<section class="hut-game"><div class="hut-intro"><h3>🧙 마녀의 마법진을 되찾아라!</h3><p>숲속 오두막에 도착한 느요미! 꼬마 마녀가 마법진을 검은 안개로 뒤덮었어요.</p><p>“히히! 안개를 걷어내면 길을 알려줄게!”</p><p>유령을 피해 마법진의 70%를 되찾아 주세요!</p></div><div class="hut-status"><span>확보 <strong class="hut-percent">0%</strong> / 목표 ${GOAL}%</span><span>목숨 <strong class="hut-lives">💜💜💜</strong></span></div><div class="hut-board"><canvas class="hut-canvas" width="${W * 18}" height="${H * 18}" aria-label="마법진 땅따먹기 게임판"></canvas></div><p class="hut-message" role="status" aria-live="polite"></p><div class="hut-controls"><div class="hut-arrows"><button type="button" data-key="ArrowUp">↑</button><div><button type="button" data-key="ArrowLeft">←</button><button type="button" data-key="ArrowDown">↓</button><button type="button" data-key="ArrowRight">→</button></div></div><button type="button" class="hut-cast" data-key="Space">✨ 마법선 (누르고 있기)</button></div><button type="button" class="hut-restart">↻ 다시 시작</button><p class="hut-guide">방향키: 이동 · Space + 방향키: 마법선 · 선을 안전한 영역에 연결하면 확보!</p></section>`;
    root.querySelector('.hut-restart').addEventListener('click', restart); root.querySelectorAll('[data-key]').forEach(b => { const key = b.dataset.key; b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); keys.add(key); }); for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => keys.delete(key)); }); window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', clearKeys); restart(); timer = setInterval(() => { if (session === current && root) ghostStep(); }, 230); raf = requestAnimationFrame(frame);
  }
  function clearKeys() { keys.clear(); }
  function stop() { session++; if (timer !== null) clearInterval(timer); timer = null; if (raf !== null) cancelAnimationFrame(raf); raf = null; window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', clearKeys); keys.clear(); root = null; done = null; }
  return { start, stop };
})();
