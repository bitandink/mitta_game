// ============================================================================
// 04. 트릭 오어 트릿 거리 · 매번 달라지는 다섯 집 논리 퍼즐
// ============================================================================
const TreatGame = (() => {
  const COLORS = [
    { id: 'red', name: '빨간 집', color: '#d95865' },
    { id: 'orange', name: '주황 집', color: '#e89136' },
    { id: 'yellow', name: '노란 집', color: '#e2c458' },
    { id: 'green', name: '초록 집', color: '#68ac73' },
    { id: 'blue', name: '파란 집', color: '#528cc4' },
  ];
  const RESIDENTS = [
    { id: 'witch', name: '마녀', emoji: '🧙' },
    { id: 'ghost', name: '유령', emoji: '👻' },
    { id: 'vampire', name: '뱀파이어', emoji: '🧛' },
    { id: 'wolf', name: '늑대인간', emoji: '🐺' },
    { id: 'skeleton', name: '해골', emoji: '💀' },
  ];
  let root = null,
    onComplete = null,
    finished = false,
    answer = null,
    clues = [];
  let lastSignature = '';
  const getColor = (id) => COLORS.find((x) => x.id === id);
  const getResident = (id) => RESIDENTS.find((x) => x.id === id);
  const shuffled = (items) => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const options = (items, placeholder) =>
    `<option value="">${placeholder}</option>` +
    items.map((x) => `<option value="${x.id}">${x.name}</option>`).join('');
  // Six clues uniquely determine 5 house colors, 5 residents and the basket.
  // 1–2: exact color sequence through overlapping 3-house chains.
  // 3–5: color-to-resident pairings (2+2+1), so all five residents are determined.
  // 6: basket position relative to a named resident.
  function generatePuzzle() {
    let colors, residents, basket, signature;
    do {
      colors = shuffled(COLORS.map((x) => x.id));
      residents = shuffled(RESIDENTS.map((x) => x.id));
      basket = Math.floor(Math.random() * 5);
      signature = [...colors, ...residents, basket].join('|');
    } while (signature === lastSignature);
    lastSignature = signature;
    answer = { colors, residents, basket };
    const cn = (i) => getColor(colors[i]).name;
    const rn = (i) => getResident(residents[i]).name;
    const relation = (i) => `${rn(i)}는 ${cn(i)}에 산다`;
    const orderA =
      Math.random() < 0.5
        ? `거리의 왼쪽 세 집은 순서대로 ${cn(0)}, ${cn(1)}, ${cn(2)}이다.`
        : `${cn(0)}의 바로 오른쪽은 ${cn(1)}이고, 그 오른쪽은 ${cn(2)}이다. ${cn(
            0,
          )}은 맨 왼쪽 집이다.`;
    const orderB =
      Math.random() < 0.5
        ? `거리의 오른쪽 세 집은 순서대로 ${cn(2)}, ${cn(3)}, ${cn(4)}이다.`
        : `${cn(4)}은 맨 오른쪽이고, 그 왼쪽에는 ${cn(3)}, 다시 그 왼쪽에는 ${cn(2)}이 있다.`;
    const residentClues = shuffled([0, 1, 2, 3, 4]);
    const pair1 = residentClues.slice(0, 2),
      pair2 = residentClues.slice(2, 4),
      last = residentClues[4];
    const basketClue = `사탕 바구니는 ${rn(basket)}가 사는 집에 숨겨져 있다.`;
    clues = shuffled([
      orderA,
      orderB,
      `${relation(pair1[0])}, ${relation(pair1[1])}.`,
      `${relation(pair2[0])}, ${relation(pair2[1])}.`,
      `${relation(last)}.`,
      basketClue,
    ]);
  }
  function render() {
    if (!root) return;
    root.innerHTML = `<section class="treat-game">
      <div class="treat-story"><p>장난꾸러기 유령이 느요미의 사탕 바구니를 숨겨 버렸어요!</p>
      <p>주민들이 남긴 단서를 조합해 다섯 집의 색깔과 주민을 알아내고, 사탕 바구니를 찾아주세요.</p></div>
      <div class="treat-street" aria-label="다섯 집 추리판">${Array.from(
        { length: 5 },
        (_, i) => `
        <div class="treat-house" data-house="${i}"><span class="treat-house-number">${
          i + 1
        }번</span>
        <img class="treat-house-art is-unknown" src="assets/images/treat/house_red.png" alt="아직 색을 모르는 집" />
        <span class="treat-house-label">색깔 ?</span><span class="treat-house-resident">주민 ?</span></div>`,
      ).join('')}</div>
      <div class="treat-clues"><h3>📜 주민들이 남긴 여섯 개의 단서</h3><ol>${clues
        .map((c) => `<li>${c}</li>`)
        .join('')}</ol></div>
      <div class="treat-board"><h3>🔎 느요미의 추리판</h3><p>왼쪽부터 1~5번 집이에요. 각 위치에 집 색깔과 주민을 지정하세요.</p>
      ${Array.from(
        { length: 5 },
        (_, i) => `<div class="treat-board-row"><span class="treat-row-number">${i + 1}번</span>
        <select class="treat-color-select" data-index="${i}" aria-label="${
          i + 1
        }번 집 색깔">${options(COLORS, '집 색깔')}</select>
        <select class="treat-resident-select" data-index="${i}" aria-label="${
          i + 1
        }번 집 주민">${options(RESIDENTS, '주민')}</select></div>`,
      ).join('')}</div>
      <fieldset class="treat-basket"><legend>🍬 사탕 바구니는 몇 번 집에 있을까?</legend><div class="treat-basket-options">
      ${Array.from(
        { length: 5 },
        (_, i) =>
          `<label><input type="radio" name="treat-basket" value="${i}"><span>${
            i + 1
          }번</span></label>`,
      ).join('')}</div></fieldset>
      <p class="treat-message" role="status" aria-live="polite">여섯 개의 단서를 천천히 살펴보세요!</p>
      <div class="treat-actions"><button type="button" class="treat-check">🔍 정답 확인</button>
      <button type="button" class="treat-reset">↻ 다시 배치</button>
      <button type="button" class="treat-new-puzzle">🎲 새로운 문제</button></div></section>`;
    root.querySelectorAll('select').forEach((el) => el.addEventListener('change', updateHouses));
    root.querySelector('.treat-check').addEventListener('click', checkAnswer);
    root.querySelector('.treat-reset').addEventListener('click', resetBoard);
    root.querySelector('.treat-new-puzzle').addEventListener('click', () => {
      if (!finished) {
        generatePuzzle();
        render();
      }
    });
    updateHouses();
  }
  function updateHouses() {
    if (!root || finished) return;
    const colors = [...root.querySelectorAll('.treat-color-select')];
    const residents = [...root.querySelectorAll('.treat-resident-select')];
    root.querySelectorAll('.treat-house').forEach((house, i) => {
      const color = getColor(colors[i].value),
        resident = getResident(residents[i].value);
      house.style.setProperty('--house-color', color ? color.color : '#777087');
      house.querySelector('.treat-house-label').textContent = color ? color.name : '색깔 ?';
      house.querySelector('.treat-house-resident').textContent = resident
        ? `${resident.emoji} ${resident.name}`
        : '주민 ?';
      const art = house.querySelector('.treat-house-art');
      art.src = `assets/images/treat/house_${color ? color.id : 'red'}.png`;
      art.classList.toggle('is-unknown', !color);
      art.alt = color ? `${color.name} 일러스트` : '아직 색을 모르는 집';
    });
  }
  function showMessage(message, type = '') {
    if (!root) return;
    const el = root.querySelector('.treat-message');
    if (el) {
      el.textContent = message;
      el.className = `treat-message ${type}`.trim();
    }
  }
  function checkAnswer() {
    if (!root || finished) return;
    const colors = [...root.querySelectorAll('.treat-color-select')].map((x) => x.value);
    const residents = [...root.querySelectorAll('.treat-resident-select')].map((x) => x.value);
    const selectedBasket = root.querySelector('input[name="treat-basket"]:checked');
    if (colors.includes('') || residents.includes('') || !selectedBasket) {
      showMessage('🎃 모든 집의 색깔과 주민, 바구니 위치를 선택해 주세요!', 'is-warning');
      return;
    }
    if (new Set(colors).size !== 5 || new Set(residents).size !== 5) {
      showMessage('👻 같은 색깔의 집이나 주민은 두 번 등장할 수 없어요!', 'is-warning');
      return;
    }
    if (
      colors.every((x, i) => x === answer.colors[i]) &&
      residents.every((x, i) => x === answer.residents[i]) &&
      Number(selectedBasket.value) === answer.basket
    ) {
      finishGame();
    } else
      showMessage('👻 아직 단서와 맞지 않는 부분이 있어요. 배치를 다시 살펴보세요!', 'is-error');
  }
  function finishGame() {
    if (finished) return;
    finished = true;
    root.querySelectorAll('select,input,button').forEach((el) => (el.disabled = true));
    const color = getColor(answer.colors[answer.basket]);
    showMessage(
      `🎉 정답! 느요미가 ${answer.basket + 1}번 ${color.name}에서 사탕 바구니를 찾았어요!`,
      'is-success',
    );
    const ending = document.createElement('div');
    ending.className = 'treat-success';
    ending.innerHTML =
      '<div class="treat-success-art">🎃🍬🎉</div><h3>사탕 바구니 발견!</h3><p>모든 단서를 풀고 할로윈 거리의 비밀을 밝혀냈어요!</p>';
    root.append(ending);
    if (typeof onComplete === 'function') onComplete();
  }
  function resetBoard() {
    if (!root || finished) return;
    root.querySelectorAll('select').forEach((el) => (el.value = ''));
    root.querySelectorAll('input[name="treat-basket"]').forEach((el) => (el.checked = false));
    updateHouses();
    showMessage('🔎 추리판을 초기화했어요!');
  }
  function start(container, completeCallback) {
    stop();
    root = container;
    onComplete = completeCallback;
    finished = false;
    generatePuzzle();
    render();
  }
  function stop() {
    root = null;
    onComplete = null;
    finished = false;
    answer = null;
    clues = [];
  }
  return { start, stop };
})();
