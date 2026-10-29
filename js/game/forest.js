// ============================================================================
// 12. 유령의 나무숲 · 길 연결 퍼즐
// ============================================================================

const ForestGame = (() => {
  const N = 5, U = 1, R = 2, D = 4, L = 8, START = 10, END = 14;
  const DIRS = [[-1, 0, U, D], [0, 1, R, L], [1, 0, D, U], [0, -1, L, R]];
  let root = null, board = [], solution = [], start = null, finish = null, ended = false, turnCount = 0, generation = 0;
  const rotate = m => ((m << 1) & 15) | ((m & 8) ? 1 : 0);
  const rand = n => Math.floor(Math.random() * n);
  const idx = (r, c) => r * N + c;
  const rc = i => [Math.floor(i / N), i % N];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { let j = rand(i + 1);[a[i], a[j]] = [a[j], a[i]] } return a };
  function path() {
    // Randomized DFS: left-middle entrance to right-middle exit.
    const visited = new Set([START]), parents = new Map(), stack = [START];
    while (stack.length) {
      const i = stack[stack.length - 1]; if (i === END) break; const [r, c] = rc(i);
      const choices = shuffle(DIRS.map(([dr, dc, a, b]) => ({ r: r + dr, c: c + dc, a, b })).filter(p => p.r >= 0 && p.r < N && p.c >= 0 && p.c < N && !visited.has(idx(p.r, p.c))));
      if (!choices.length) { stack.pop(); continue } const p = choices[0], j = idx(p.r, p.c); visited.add(j); parents.set(j, { from: i, out: p.a, back: p.b }); stack.push(j);
    }
    const masks = Array(25).fill(0); let cur = END; while (cur !== START) { const p = parents.get(cur); if (!p) throw Error('Path generation failed'); masks[p.from] |= p.out; masks[cur] |= p.back; cur = p.from }
    // Entrance and exit are fixed external ports: left of cell 10, right of cell 14.
    // To guarantee a valid tile set, select a path with compatible first and last turns.
    masks[START] |= L; masks[END] |= R;
    return masks;
  }
  // 문제 생성
  function generate() {
    let masks, tries = 0;
    // Ensure endpoints have exactly 2 ports (not 3) for visual clarity.
    do { masks = path(); tries++ } while ((pop(masks[START]) !== 2 || pop(masks[END]) !== 2) && tries < 300);
    // Add a handful of branching dead ends without touching endpoints.
    const used = masks.map(Boolean);
    for (let t = 0; t < 6; t++) {
      const options = [];
      for (let i = 1; i < 24; i++)if (i !== START && i !== END && used[i] && pop(masks[i]) < 3) { const [r, c] = rc(i); for (const [dr, dc, a, b] of DIRS) { const nr = r + dr, nc = c + dc; if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue; const j = idx(nr, nc); if (!used[j] && j !== START && j !== END) options.push({ i, j, a, b }) } }
      if (!options.length) break; const q = options[rand(options.length)]; masks[q.i] |= q.a; masks[q.j] |= q.b; used[q.j] = true;
    }
    // Fill unused cells with rotatable decorations; these cannot invalidate the guaranteed route.
    for (let i = 0; i < 25; i++)if (!masks[i]) masks[i] = [U | D, U | R, U | R | D][rand(3)];
    solution = masks.slice(); board = masks.map(m => { let spins = rand(4); while (spins--) m = rotate(m); return m });
    if (board.every((m, i) => m === solution[i])) board[12] = rotate(board[12]);
    turnCount = 0; ended = false;
  }
  function pop(n) { let c = 0; while (n) { n &= n - 1; c++ } return c }
  function trace() {
    const reached = new Set(), prev = new Map(), q = [];
    if (!(board[START] & L)) return { reached, route: null };
    reached.add(START); q.push(START);
    for (let h = 0; h < q.length; h++) {
      const i = q[h], [r, c] = rc(i);
      for (const [dr, dc, a, b] of DIRS) {
        if (!(board[i] & a)) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        const j = idx(nr, nc);
        if (!reached.has(j) && (board[j] & b)) { reached.add(j); prev.set(j, i); q.push(j) }
      }
    }
    if (!reached.has(END) || !(board[END] & R)) return { reached, route: null };
    const route = [END]; while (route[0] !== START) route.unshift(prev.get(route[0]));
    return { reached, route };
  }
  // road1: │, road2: ─, road3: └(top/right), road4: left-facing dead end, road5: ㅗ(top/left/right).
  // Every tile uses the same 256x256 canvas and is rotated in 90-degree steps.
  const TILE_ART = [
    { mask: U | D, file: 'road1.png' },
    { mask: L | R, file: 'road2.png' },
    { mask: U | R, file: 'road3.png' },
    { mask: L, file: 'road4.png' },
    { mask: U | L | R, file: 'road5.png' }
  ];
  function artworkFor(mask) {
    for (const art of TILE_ART) {
      let rotated = art.mask;
      for (let quarter = 0; quarter < 4; quarter++) {
        if (rotated === mask) return { file: art.file, degrees: quarter * 90 };
        rotated = rotate(rotated);
      }
    }
    // This stage never creates four-way intersections; retain a safe visual fallback.
    return { file: 'road1.png', degrees: 0 };
  }
  // 화면 렌더링
  function render() {
    if (!root) return;
    const grid = root.querySelector('.forest-grid'); if (!grid) return;
    const { reached } = trace();
    grid.innerHTML = ''; board.forEach((m, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'forest-tile'; if (i === START || i === END) b.classList.add('forest-endpoint'); if (reached.has(i)) b.classList.add('forest-reached'); b.setAttribute('aria-label', `${i + 1}번 길 조각 회전`);
      const art = artworkFor(m);
      // Starting and ending squares display ONLY their dedicated illustration.
      // The hidden connection mask still rotates, preserving the original puzzle rules.
      if (i === START) {
        b.innerHTML = '<img class="forest-marker-art" src="assets/images/forest/start.png" alt="시작" draggable="false">';
      } else if (i === END) {
        b.innerHTML = '<img class="forest-marker-art" src="assets/images/forest/end.png" alt="도착" draggable="false">';
      } else {
        b.innerHTML = `<img class="forest-path-art" src="assets/images/forest/${art.file}" alt="" draggable="false" style="transform:rotate(${art.degrees}deg)">`;
      }
      b.disabled = ended; b.addEventListener('click', () => turn(i)); grid.appendChild(b);
    });
    root.querySelector('.forest-turns').textContent = `회전 ${turnCount}회`;
    root.querySelector('.forest-message').textContent = ended ? '🌙 나무들이 양옆으로 물러나며 달빛 전망대로 향하는 길이 열렸어요!' : '초록빛으로 표시된 타일이 입구와 연결된 길이에요. 오른쪽 출구까지 이어 주세요!';
  }
  function turn(i) { if (ended || !root) return; board[i] = rotate(board[i]); turnCount++; render(); const { route } = trace(); if (route) { ended = true; root.querySelectorAll('.forest-tile').forEach((b, j) => { b.disabled = true; if (route.includes(j)) b.classList.add('forest-cleared') }); root.querySelector('.forest-message').textContent = '🌙 성공! 유령 나무들이 길을 열어 주었어요!'; root.querySelector('.forest-win').hidden = false; const cb = finish; finish = null; if (cb) cb() } }
  function restart() { generate(); render(); if (root) root.querySelector('.forest-win').hidden = true }
  function startGame(container, onComplete) {
    stop(); root = container; finish = onComplete; generation++; root.innerHTML = `
    <div class="forest-game">
      <div class="forest-intro"><div class="forest-intro-icon">🌳👻🌙</div><h3>뒤틀린 유령 숲길</h3>
      <p>유령 나무들이 달빛 전망대로 향하는 길을 뒤틀어 놓았어요!</p>
      <p>“히히! 끊어진 길을 이어 보렴!”</p><p>길 조각을 눌러 돌리고, 입구부터 출구까지 연결해 주세요.</p></div>
      <div class="forest-toolbar"><span class="forest-turns">회전 0회</span><button type="button" class="forest-reset">🔄 다시하기</button></div>
      <div class="forest-board-wrap"><span class="forest-entrance">느요미 ➜</span><div class="forest-grid" role="group" aria-label="5×5 숲길 회전 퍼즐"></div><span class="forest-exit">➜ 🌙</span></div>
      <p class="forest-message" aria-live="polite"></p><p class="forest-win" hidden>✨ 숲길 복구 성공! 달빛 전망대로 향하는 길이 열렸어요!</p>
    </div>`;
    root.querySelector('.forest-reset').addEventListener('click', restart); restart();
  }
  function stop() { if (root) root.innerHTML = ''; root = null; finish = null; ended = false; generation++ }
  return { start: startGame, stop };
})();
