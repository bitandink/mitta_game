// ============================================================================
// 09. 마녀의 요리공방 · 요리 주문
// ============================================================================

const KitchenGame = (() => {
  const RECIPES = [
    { id: 'pumpkin', name: '호박 수프', icon: '🎃', items: ['pumpkin', 'milk', 'salt'] },
    { id: 'eye', name: '눈알 스튜', icon: '👁️', items: ['eye', 'mushroom', 'carrot'] },
    { id: 'bat', name: '박쥐 파이', icon: '🦇', items: ['bat', 'flour', 'butter'] }
  ];
  const INGREDIENTS = [
    { id: 'pumpkin', icon: '🎃', name: '호박' }, { id: 'milk', icon: '🥛', name: '우유' },
    { id: 'salt', icon: '🧂', name: '소금' }, { id: 'eye', icon: '👁️', name: '눈알' },
    { id: 'mushroom', icon: '🍄', name: '버섯' }, { id: 'carrot', icon: '🥕', name: '당근' },
    { id: 'bat', icon: '🦇', name: '박쥐' }, { id: 'flour', icon: '🌾', name: '밀가루' },
    { id: 'butter', icon: '🧈', name: '버터' }
  ];
  const ASSET_ROOT = 'assets/images/kitchen/';
  const art = (name, alt = '') => `<img class="kitchen-art" src="${ASSET_ROOT}${name}.png" alt="${alt}" draggable="false">`;
  const ingredientArt = id => art(id === 'eye' ? 'eyeball' : id, lookup(id)?.name || id);
  const dishArt = id => art(({pumpkin:'pumpkin_soup',eye:'eyeball_stew',bat:'bat_pie'})[id], recipe(id)?.name || id);
  const potArt = state => art(state === 'empty' ? 'pot_idle' : 'pot_magic', '마법 가마솥');
  const COOK_MS = 4500, BURN_MS = 8500, TARGET = 5;
  let root = null, done = null, interval = null, orders = [], pots = [], selectedOrder = null;
  let prepared = [], served = 0, created = 0, seq = 0, finished = false, notice = '주문서를 골라 재료를 손질해 주세요!';
  const lookup = id => INGREDIENTS.find(x => x.id === id);
  const recipe = id => RECIPES.find(x => x.id === id);
  function newOrder() {
    if (created >= TARGET) return;
    const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    orders.push({ uid: ++seq, recipeId: r.id }); created++;
  }
  // 게임 초기화
  function reset() {
    orders = []; pots = [{ state: 'empty' }, { state: 'empty' }]; selectedOrder = null; prepared = [];
    served = 0; created = 0; seq = 0; finished = false; notice = '주문서를 골라 재료를 손질해 주세요!';
    newOrder(); newOrder(); render();
  }
  function orderLabel(o) { return o ? recipe(o.recipeId).name : '주문 없음'; }
  // 화면 렌더링
  function render() {
    if (!root) return;
    root.innerHTML = `
      <section class="kitchen-game" aria-label="마녀의 지옥 주방">
        <div class="kitchen-intro"><div class="kitchen-intro-art">🧙‍♀️🍲✨</div><h3>느요미의 마녀 지옥 주방!</h3>
          <p>빗자루를 타고 도착한 느요미! 마녀의 요리공방은 주문으로 정신이 없어요.</p>
          <p>“아이고! 느요미, 요리 다섯 개만 도와주렴!”</p></div>
        <div class="kitchen-top"><strong>🍽️ 주문 완료 <span class="kitchen-progress">${served} / ${TARGET}</span></strong><button type="button" class="kitchen-reset">🔄 다시하기</button></div>
        <div class="kitchen-heading">📜 주문서 <small>만들 요리를 먼저 선택하세요</small></div>
        <div class="kitchen-orders">${orders.length ? orders.map(o => { const r = recipe(o.recipeId); return `<button type="button" class="kitchen-order ${selectedOrder === o.uid ? 'is-selected' : ''}" data-order="${o.uid}" aria-pressed="${selectedOrder === o.uid}"><span class="kitchen-order-icon">${dishArt(r.id)}</span><strong>${r.name}</strong><small>${r.items.map(i => ingredientArt(i)).join(' ')}</small></button>` }).join('') : '<p>모든 주문이 조리 중이에요!</p>'}</div>
        <div class="kitchen-heading">🔪 재료 준비대 <small>선택한 주문의 재료를 하나씩 클릭해 손질</small></div>
        <div class="kitchen-ingredients">${INGREDIENTS.map(i => `<button type="button" class="kitchen-ingredient" data-ingredient="${i.id}" ${finished ? 'disabled' : ''}><span>${ingredientArt(i.id)}</span><small>${i.name}</small></button>`).join('')}</div>
        <div class="kitchen-prepared"><strong>손질한 재료</strong><span>${prepared.length ? prepared.map(i => ingredientArt(i)).join(' ') : '아직 없어요'}</span><button type="button" class="kitchen-clear" ${prepared.length ? '' : 'disabled'}>재료 비우기</button></div>
        <div class="kitchen-heading">🍲 가마솥 <small>재료 3개를 손질한 후 빈 솥을 클릭</small></div>
        <div class="kitchen-pots">${pots.map((p, i) => `<button type="button" class="kitchen-pot ${p.state === 'ready' ? 'is-ready' : ''} ${p.state === 'burnt' ? 'is-burnt' : ''}" data-pot="${i}"><span class="kitchen-pot-icon">${potArt(p.state)}</span><strong>가마솥 ${i ? 'B' : 'A'}</strong><small class="kitchen-pot-status" data-status="${i}">${potStatus(p)}</small><span class="kitchen-pot-bar"><span data-bar="${i}" style="width:${potPercent(p)}%"></span></span></button>`).join('')}</div>
        <p class="kitchen-notice" role="status">${notice}</p>
        <p class="kitchen-help">① 주문 선택 → ② 재료 3개 손질 → ③ 빈 가마솥 클릭 → ④ 완성된 솥 클릭해 서빙. 다 익힌 요리는 오래 두면 타요!</p>
      </section>`;
    root.querySelector('.kitchen-reset').addEventListener('click', reset);
    root.querySelectorAll('[data-order]').forEach(b => b.addEventListener('click', () => selectOrder(Number(b.dataset.order))));
    root.querySelectorAll('[data-ingredient]').forEach(b => b.addEventListener('click', () => addIngredient(b.dataset.ingredient)));
    root.querySelectorAll('[data-pot]').forEach(b => b.addEventListener('click', () => clickPot(Number(b.dataset.pot))));
    root.querySelector('.kitchen-clear').addEventListener('click', () => { prepared = []; notice = '손질한 재료를 비웠어요.'; render() });
  }
  function potStatus(p) {
    if (p.state === 'empty') return '비어 있음 · 재료를 넣어 주세요';
    if (p.state === 'cooking') return `${recipe(p.recipeId).name} 조리 중…`;
    if (p.state === 'ready') return `${recipe(p.recipeId).name} 완성! 클릭해서 서빙`;
    return '요리가 탔어요! 클릭해서 비우기';
  }
  function potPercent(p) { if (p.state === 'empty') return 0; if (p.state === 'ready' || p.state === 'burnt') return 100; return Math.min(100, Math.round((Date.now() - p.started) / COOK_MS * 100)) }
  function selectOrder(uid) { if (finished) return; selectedOrder = uid; prepared = []; notice = `${orderLabel(orders.find(o => o.uid === uid))} 재료를 준비해 주세요.`; render() }
  function addIngredient(id) {
    if (finished) return;
    const o = orders.find(o => o.uid === selectedOrder);
    if (!o) { notice = '먼저 주문서를 선택해 주세요!'; render(); return }
    if (prepared.length >= 3) { notice = '재료 3개가 준비됐어요. 빈 가마솥을 클릭하세요!'; render(); return }
    if (!recipe(o.recipeId).items.includes(id) || prepared.includes(id)) {
      prepared = []; notice = '앗! 잘못된 재료예요. 이 요리의 손질부터 다시 해요!'; render(); return;
    }
    prepared.push(id); notice = prepared.length === 3 ? '재료 준비 완료! 빈 가마솥을 클릭하세요.' : `${lookup(id).name} 손질 완료! (${prepared.length}/3)`; render();
  }
  function clickPot(i) {
    if (finished) return;
    const p = pots[i];
    if (p.state === 'ready') {
      const order = orders.find(o => o.uid === p.orderUid);
      if (order) orders = orders.filter(o => o.uid !== order.uid);
      if (selectedOrder === p.orderUid) { selectedOrder = null; prepared = [] }
      pots[i] = { state: 'empty' }; served++;
      if (served >= TARGET) { finished = true; notice = '🎉 면허도 따고 요리도 완벽! 마녀가 느요미에게 감사의 선물을 건넸어요!'; render(); if (done) { const cb = done; done = null; cb() } return }
      newOrder(); notice = `🍽️ ${recipe(p.recipeId).name} 서빙 완료! (${served}/${TARGET})`; render(); return;
    }
    if (p.state === 'burnt') {
      pots[i] = { state: 'empty' }; notice = '탄 요리를 버렸어요. 같은 주문을 다시 만들어 주세요!'; render(); return;
    }
    if (p.state === 'cooking') { notice = '아직 끓는 중이에요! 다른 주문을 준비해 보세요.'; render(); return }
    const o = orders.find(o => o.uid === selectedOrder);
    if (!o) { notice = '먼저 주문서를 선택해 주세요!'; render(); return }
    const r = recipe(o.recipeId);
    if (prepared.length !== 3 || !r.items.every(id => prepared.includes(id))) { notice = '주문에 맞는 재료 3개를 먼저 손질해 주세요!'; render(); return }
    if (pots.some(other => other.orderUid === o.uid)) { notice = '이미 다른 솥에서 이 주문을 조리하고 있어요!'; render(); return }
    pots[i] = { state: 'cooking', orderUid: o.uid, recipeId: r.id, started: Date.now() };
    prepared = []; selectedOrder = null; notice = `${r.name} 조리 시작! 다른 주문도 준비할 수 있어요.`; render();
  }
  function tick() {
    if (!root || finished) return;
    let changed = false; const now = Date.now();
    pots.forEach(p => {
      if (p.state === 'cooking' && now - p.started >= COOK_MS) { p.state = 'ready'; p.readyAt = p.started + COOK_MS; changed = true }
      if (p.state === 'ready' && now - p.readyAt >= BURN_MS) { p.state = 'burnt'; changed = true }
    });
    if (changed) { notice = pots.some(p => p.state === 'burnt') ? '🔥 요리가 타 버렸어요! 솥을 비우고 다시 만들어요.' : '✨ 요리가 완성됐어요! 솥을 클릭해 서빙하세요.'; render(); return }
    pots.forEach((p, i) => { const s = root.querySelector(`[data-status="${i}"]`), bar = root.querySelector(`[data-bar="${i}"]`); if (s) s.textContent = potStatus(p); if (bar) bar.style.width = potPercent(p) + '%' })
  }
  // 게임 시작
  function start(container, onComplete) { stop(); root = container; done = onComplete; reset(); interval = setInterval(tick, 100) }
  function stop() { if (interval !== null) { clearInterval(interval); interval = null } root = null; done = null; orders = []; pots = [] }
  return { start, stop };
})();
