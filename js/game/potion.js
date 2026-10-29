// ============================================================================
// 03. 사랑의 묘약 가게 · 비밀 레시피
// ============================================================================

const PotionGame = (() => {
  const ingredients = [
    { id: 'rose', emoji: '🌹', name: '장미꽃잎' },
    { id: 'moon', emoji: '🌙', name: '달빛 가루' },
    { id: 'honey', emoji: '🍯', name: '꿀' },
    { id: 'crystal', emoji: '💎', name: '수정 조각' },
  ];

  let cleanup = () => {};

  // 게임 시작
  function start(container, onComplete) {
    cleanup();

    let active = true;
    let step = 0;
    let failures = 0;
    let selected = [];
    let effectTimer = null;

    // 게임 시작 시 정답 순서를 한 번만 섞기
    const recipe = ingredients.map((item) => item.id);

    for (let i = recipe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recipe[i], recipe[j]] = [recipe[j], recipe[i]];
    }

    container.innerHTML = `
            <section class="potion-game" aria-label="사랑의 묘약 만들기">
                <p class="potion-story">
                    느요미가 사랑의 묘약 가게를 구경하다가<br>
                    그만 귀한 묘약을 깨뜨리고 말았어요!<br>
                    그런데 마녀는 제조법을 어디에 뒀는지
                    기억하지 못한대요.<br>
                    재료를 하나씩 섞어 비밀의 레시피를 찾아주세요! 💕
                </p>

                <div class="potion-cauldron" aria-hidden="true">
                    <img class="potion-cauldron-art" src="assets/images/potion/potion_cauldron_idle.png" alt="보글보글 끓는 묘약 항아리">
                </div>

                <div class="potion-status">
                    <span class="potion-progress">제조 진행 0 / 4</span>
                    <span class="potion-failures">실패 0회</span>
                </div>

                <div class="potion-slots" aria-label="제조 진행 단계">
                    <span class="potion-slot">?</span>
                    <span class="potion-slot">?</span>
                    <span class="potion-slot">?</span>
                    <span class="potion-slot">?</span>
                </div>

                <p class="potion-message" role="status" aria-live="polite">
                    첫 번째 재료를 골라 주세요!
                </p>

                <div class="potion-ingredients"></div>

                <button type="button" class="potion-restart">
                    새로운 레시피로 다시 시작
                </button>
            </section>
        `;

    const cauldron = container.querySelector('.potion-cauldron');
    const cauldronArt = container.querySelector('.potion-cauldron-art');
    const setCauldronArt = (activePotion) => {
      cauldronArt.src = `assets/images/potion/potion_cauldron_${
        activePotion ? 'active' : 'idle'
      }.png`;
      cauldronArt.alt = activePotion
        ? '마법 연기가 피어오르는 묘약 항아리'
        : '보글보글 끓는 묘약 항아리';
    };
    const progress = container.querySelector('.potion-progress');
    const failureText = container.querySelector('.potion-failures');
    const message = container.querySelector('.potion-message');
    const slots = [...container.querySelectorAll('.potion-slot')];
    const ingredientArea = container.querySelector('.potion-ingredients');
    const restartButton = container.querySelector('.potion-restart');

    const buttons = new Map();

    ingredients.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'potion-ingredient';
      button.innerHTML = `
                <span class="potion-ingredient-icon">${item.emoji}</span>
                <span class="potion-ingredient-name">${item.name}</span>
            `;

      button.addEventListener('click', () => addIngredient(item.id));

      ingredientArea.appendChild(button);
      buttons.set(item.id, button);
    });

    function updateUI() {
      progress.textContent = `제조 진행 ${step} / 4`;
      failureText.textContent = `실패 ${failures}회`;

      slots.forEach((slot, index) => {
        const id = selected[index];
        const ingredient = ingredients.find((item) => item.id === id);

        slot.textContent = ingredient ? ingredient.emoji : '?';
        slot.classList.toggle('is-filled', Boolean(ingredient));
      });

      buttons.forEach((button, id) => {
        button.disabled = !active || selected.includes(id);
      });
    }

    function showEffect(className) {
      cauldron.classList.remove('is-success', 'is-exploding', 'is-complete');

      // 같은 애니메이션을 연속 실행할 수 있도록 초기화
      void cauldron.offsetWidth;
      cauldron.classList.add(className);

      if (effectTimer !== null) {
        clearTimeout(effectTimer);
      }

      if (className !== 'is-complete') {
        effectTimer = setTimeout(() => {
          cauldron.classList.remove(className);
          effectTimer = null;
        }, 650);
      }
    }

    function addIngredient(id) {
      if (!active || selected.includes(id)) return;

      // 정답 순서는 공개하지 않고 현재 단계만 확인
      if (recipe[step] !== id) {
        failures++;

        // 틀리면 진행 과정만 초기화
        // 정답 recipe는 그대로 유지
        step = 0;
        selected = [];

        setCauldronArt(false);
        message.textContent = '펑! 잘못된 재료예요. 처음부터 다시 만들어 주세요!';

        showEffect('is-exploding');
        updateUI();

        if (effectTimer !== null) {
          clearTimeout(effectTimer);
        }

        effectTimer = setTimeout(() => {
          if (!active) return;
          setCauldronArt(false);
          cauldron.classList.remove('is-exploding');
          effectTimer = null;
        }, 650);

        return;
      }

      selected.push(id);
      step++;

      setCauldronArt(true);
      showEffect('is-success');

      if (step === recipe.length) {
        active = false;
        setCauldronArt(true);
        showEffect('is-complete');

        message.textContent = '🎉 사랑의 묘약 완성! 별을 획득했어요! ⭐';

        updateUI();
        onComplete();
        return;
      }

      message.textContent = `정답! ${step}번째 재료까지 성공했어요. 다음 재료를 골라 주세요!`;

      updateUI();
    }

    restartButton.addEventListener('click', () => {
      start(container, onComplete);
    });

    updateUI();

    cleanup = () => {
      active = false;

      if (effectTimer !== null) {
        clearTimeout(effectTimer);
      }
    };
  }

  return {
    start,
    stop: () => cleanup(),
  };
})();
