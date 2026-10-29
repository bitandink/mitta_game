// ============================================================================
// 01. 달콤한 라운지 · 사탕 짝 맞추기
// ============================================================================

const CandyGame = (() => {
  const candyTypes = [
    {
      id: 'lollipop',
      emoji: '🍭',
      name: '막대사탕',
      image: './assets/images/candy/candy_lollipop.png',
    },
    {
      id: 'wrapped',
      emoji: '🍬',
      name: '포장 사탕',
      image: './assets/images/candy/candy_wrapped.png',
    },
    {
      id: 'chocolate',
      emoji: '🍫',
      name: '초콜릿',
      image: './assets/images/candy/candy_chocolate.png',
    },
  ];
  let cleanup = () => {};

  // 게임 시작
  function start(container, onComplete) {
    cleanup();
    let timer = null;
    let active = true;
    let first = null;
    let locked = false;
    let pairs = 0;
    const deck = [...candyTypes, ...candyTypes].map((item, index) => ({ ...item, uid: index }));
    // 균등한 무작위 섞기 (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    container.innerHTML = `
            <section class="candy-game" aria-label="사탕 짝 맞추기 게임">
                <p class="candy-story">느요미가 라운지에서 사탕 상자를 엎질러 버렸어요!<br>앗, 사탕들이 모두 뒤섞였네요.<br>같은 사탕을 두 개씩 찾아 상자를 정리해 주세요. 🍬</p>
                <div class="candy-status"><span>🍭 뒤섞인 사탕을 찾아라!</span><span id="candyProgress">0 / 3쌍</span></div>
                <div class="candy-grid"></div>
                <p class="candy-message" role="status" aria-live="polite">카드를 두 장씩 뒤집어 보세요!</p>
                <div class="candy-actions"><button type="button" id="candyRestart">다시 시작</button></div>
            </section>`;
    const grid = container.querySelector('.candy-grid');
    const progress = container.querySelector('#candyProgress');
    const message = container.querySelector('.candy-message');
    const restart = container.querySelector('#candyRestart');
    const buttons = deck.map((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'candy-card';
      button.innerHTML = '<span class="candy-card-back" aria-hidden="true">✦</span>';
      button.setAttribute('aria-label', `${index + 1}번 뒤집힌 카드`);
      button.addEventListener('click', () => flip(index));
      grid.appendChild(button);
      return button;
    });
    function show(index) {
      const button = buttons[index];
      button.classList.add('is-open');
      button.innerHTML = `<img class="candy-card-art" src="${deck[index].image}" alt="" draggable="false">`;
      button.setAttribute('aria-label', `${index + 1}번 ${deck[index].name}`);
    }
    function hide(index) {
      const button = buttons[index];
      button.classList.remove('is-open');
      button.innerHTML = '<span class="candy-card-back" aria-hidden="true">✦</span>';
      button.setAttribute('aria-label', `${index + 1}번 뒤집힌 카드`);
    }
    function flip(index) {
      if (
        !active ||
        locked ||
        buttons[index].disabled ||
        index === first ||
        buttons[index].classList.contains('is-open')
      )
        return;
      show(index);
      if (first === null) {
        first = index;
        return;
      }
      const prior = first;
      first = null;
      if (deck[prior].id === deck[index].id) {
        buttons[prior].classList.add('is-matched');
        buttons[index].classList.add('is-matched');
        buttons[prior].disabled = true;
        buttons[index].disabled = true;
        pairs++;
        progress.textContent = `${pairs} / 3쌍`;
        message.textContent = '정답! 같은 사탕을 찾았어요!';
        if (pairs === 3) {
          active = false;
          message.textContent = '🎉 사탕 정리 성공! 첫 번째 별을 획득했어요! ⭐';
          restart.textContent = '다시 플레이';
          onComplete();
        }
      } else {
        locked = true;
        message.textContent = '아쉽지만 다른 사탕이에요. 다시 찾아보세요!';
        timer = setTimeout(() => {
          if (!active) return;
          hide(prior);
          hide(index);
          locked = false;
          timer = null;
        }, 800);
      }
    }
    restart.addEventListener('click', () => start(container, onComplete));
    cleanup = () => {
      active = false;
      if (timer !== null) clearTimeout(timer);
    };
  }
  return { start, stop: () => cleanup() };
})();
