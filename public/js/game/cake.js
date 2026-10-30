// Halloween Cake House — fixed-placement cake assembly
const CakeGame = (() => {
  'use strict';
  const TYPES = [
    {
      id: 'bat',
      name: '박쥐',
      emoji: '🦇',
      image: './assets/images/cake/cake_bat.png',
      whole: './assets/images/cake/cake_bat_whole.png',
    },
    {
      id: 'ghost',
      name: '유령',
      emoji: '👻',
      image: './assets/images/cake/cake_ghost.png',
      whole: './assets/images/cake/cake_ghost_whole.png',
    },
    {
      id: 'pumpkin',
      name: '호박',
      emoji: '🎃',
      image: './assets/images/cake/cake_pumpkin.png',
      whole: './assets/images/cake/cake_pumpkin_whole.png',
    },
  ];
  const TOTAL = 9,
    VISIBLE = 5,
    SLOT_COUNT = 6,
    MAX_CAKES = 3;
  let root, complete, board, queue, selected, done, moves, completed, message;
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  function newRound() {
    board = Array.from({ length: SLOT_COUNT }, () => []);
    queue = shuffle(TYPES.flatMap((t) => Array(3).fill(t.id)));
    selected = null;
    done = false;
    moves = 0;
    completed = 0;
    message = '';
    render();
  }
  function picture(id) {
    const t = TYPES.find((t) => t.id === id);
    return `<img src="${t.image}" alt="${t.name} 케이크" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="cake-emoji" style="display:none">${t.emoji}</span>`;
  }
  function wholePicture(id) {
    const t = TYPES.find((t) => t.id === id);
    return `<img class="cake-whole-image" src="${t.whole}" alt="완성된 ${t.name} 홀케이크" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="cake-whole-fallback" style="display:none">${t.emoji} 🎂</span>`;
  }
  function choose(i) {
    if (done || i >= Math.min(VISIBLE, queue.length)) return;
    selected = selected === i ? null : i;
    message = '식탁의 빈 원을 누르면 새 접시가 생기고, 같은 접시를 누르면 조각이 추가돼요.';
    render();
  }
  function place(i) {
    if (done || selected === null) return;
    const id = queue[selected],
      plate = board[i];
    const active = board.filter((p) => p.length > 0 && p.length < 3).length;
    const occupied = board.filter((p) => p.length > 0).length;
    if (plate.length >= 3) {
      message = '완성된 케이크는 더 담을 수 없어요.';
      render();
      return;
    }
    if (!plate.length && occupied >= MAX_CAKES) {
      message = '한 번에 케이크 접시 3개만 사용할 수 있어요!';
      render();
      return;
    }
    if (plate.length && plate[0] !== id) {
      message = '다른 종류의 케이크예요! 한 번 놓은 조각은 옮길 수 없으니 같은 종류를 골라 주세요.';
      render();
      return;
    }
    plate.push(id);
    queue.splice(selected, 1);
    moves++;
    selected = null;
    if (plate.length === 3) {
      completed++;
      message = `✨ ${TYPES.find((t) => t.id === id).name} 케이크 한 판 완성!`;
    } else message = '좋아요! 같은 종류의 조각을 더 모아 주세요.';
    if (completed === 3 && queue.length === 0) {
      finish();
      return;
    }
    render();
  }
  function finish() {
    done = true;
    message = '🎉 케이크 세 판 완성! 할로윈 케이크 하우스를 클리어했어요.';
    render();
    if (typeof complete === 'function') complete();
  }
  function render() {
    if (!root) return;
    root.innerHTML = `<section class="cake-house">
      <div class="cake-topline"><span>🎂 HALLOWEEN CAKE HOUSE</span><span>완성 ${completed}/3 · 배치 ${moves}/9</span></div>     
      <div class="cake-story" style="margin:12px 0;padding:12px 16px;border:1px solid rgba(244,195,237,.5);border-radius:13px;background:rgba(29,25,53,.84);color:#f4eaff;font-size:13px;line-height:1.8;text-align:center;">
        오늘은 느요미를 위해 특별한 할로윈 케이크를 준비한 날이에요! 🎂<br>
        그런데 장난꾸러기 유령들이 케이크를 엉망으로 만들어 버렸어요. 👻<br>
        흩어진 케이크 조각을 모아 원래 모습으로 완성해 주세요.<br>
        <strong style="color:#ffe5a7;">느요미가 기다리고 있어요! 🎃💕</strong>
      </div>
      <p class="cake-guide">아래 조각을 선택한 뒤 식탁의 원형 칸을 눌러 케이크를 조립하세요. 놓은 조각은 고정돼요!</p>
      <div class="cake-table" role="group" aria-label="케이크 조립 식탁">
      ${board
        .map(
          (p, i) => `<button type="button" class="cake-slot ${p.length ? 'occupied' : ''} ${
            p.length === 3 ? 'complete' : ''
          }" data-slot="${i}" aria-label="${i + 1}번 자리, ${p.length}조각">
        ${
          p.length === 3
            ? `<span class="cake-whole">${wholePicture(
                p[0],
              )}</span><span class="cake-complete-star" aria-hidden="true">★</span>`
            : p.length
            ? `<span class="cake-partial">${picture(p[0])}<span class="cake-count">${
                p.length
              }/3</span></span>`
            : ''
        }
      </button>`,
        )
        .join('')}
      </div>
      <div class="cake-bottom-title">🍰 대기 접시 · ${queue.length}조각 남음</div>
      <div class="cake-tray">${Array.from({ length: VISIBLE }, (_, i) =>
        queue[i]
          ? `<button type="button" class="cake-offer ${
              selected === i ? 'selected' : ''
            }" data-offer="${i}" aria-pressed="${
              selected === i
            }"><span class="cake-offer-plate">${picture(queue[i])}</span></button>`
          : `<div class="cake-offer empty" aria-hidden="true"></div>`,
      ).join('')}</div>
      <div class="cake-message" aria-live="polite">${
        message || '하단 조각을 먼저 선택하세요.'
      }</div>
      <div class="cake-actions"><button type="button" class="cake-restart">🔄 처음부터 다시</button></div>
      ${
        done
          ? '<div class="cake-end"><strong>🎉 케이크 세 판 완성!</strong><p>별과 새로운 룬 단서를 발견했어요!</p></div>'
          : ''
      }
    </section>`;
    root
      .querySelectorAll('[data-offer]')
      .forEach((b) => b.addEventListener('click', () => choose(Number(b.dataset.offer))));
    root
      .querySelectorAll('[data-slot]')
      .forEach((b) => b.addEventListener('click', () => place(Number(b.dataset.slot))));
    root.querySelector('.cake-restart').addEventListener('click', newRound);
  }
  function start(container, callback) {
    root = container;
    complete = callback;
    newRound();
  }
  function stop() {
    root = null;
    complete = null;
    board = [];
    queue = [];
    selected = null;
    done = false;
  }
  return { start, stop };
})();
