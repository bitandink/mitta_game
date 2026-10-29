// ============================================================================
// 05. 검은 고양이의 쉼터 · 고양이 쓰다듬기
// ============================================================================

const ShelterGame = (() => {
  const REQUIRED_PETS = 7;
  const DIALOGUES = [
    '흥, 인간 따위가 감히 날 만지려고?',
    '...뭐야? 생각보다 손길이 나쁘지 않네.',
    '딱히 좋아서 가만히 있는 건 아니거든?',
    '거기 말고... 귀 뒤쪽을 긁어봐.',
    '고로롱... 앗! 방금 소리는 못 들은 걸로 해!',
    '흐음... 특별히 조금 더 만져도 허락해 줄게.',
    '가지 마... 아니, 잠깐만 더 쉬었다 가라고!',
    '냐옹~ 좋아! 비밀 하나 알려줄게. 수호의 룬은 선물의 룬 바로 다음에 놓아야 해.'
  ];

  let cleanup = () => { };

  // 게임 시작
  function start(container, onComplete) {
    cleanup();

    let active = true;
    let petCount = 0;
    let effectTimer = null;

    container.innerHTML = `
      <section class="shelter-game" aria-label="검은 고양이의 쉼터">
        <p class="shelter-story">긴 모험에 지친 느요미가 조용한 쉼터를 발견했어요.<br>도도한 검은 고양이가 쉬어 가려면 자기를 쓰다듬어 달래요. 🐈‍⬛</p>
        <div class="shelter-scene">
          <span class="shelter-moon" aria-hidden="true">🌙</span>
          <button type="button" class="shelter-cat" aria-label="검은 고양이 쓰다듬기">
            <img
              class="shelter-cat-art"
              src="assets/images/shelter/cat_cold.png"
              alt="새침한 표정의 검은 고양이"
              draggable="false"
            >
            <span class="shelter-heart" aria-hidden="true">💗</span>
          </button>
          <p class="shelter-dialogue" role="status" aria-live="polite"></p>
        </div>
        <div class="shelter-progress-heading"><strong>💜 고양이의 친밀도</strong><span class="shelter-count">0 / 7</span></div>
        <div class="shelter-progress" role="progressbar" aria-label="고양이 친밀도" aria-valuemin="0" aria-valuemax="7" aria-valuenow="0"><div class="shelter-progress-fill"></div></div>
        <p class="shelter-guide">고양이를 클릭하거나 아래 버튼을 눌러 쓰다듬어 주세요. 실패도 시간제한도 없어요!</p>
        <button type="button" class="shelter-pet-button">🐾 쓰다듬어 주기</button>
        <button type="button" class="shelter-restart" hidden>↻ 고양이와 다시 놀기</button>
      </section>
    `;

    const section = container.querySelector('.shelter-game');
    const cat = section.querySelector('.shelter-cat');
    const catArt = section.querySelector('.shelter-cat-art');
    const petButton = section.querySelector('.shelter-pet-button');
    const restartButton = section.querySelector('.shelter-restart');
    const dialogue = section.querySelector('.shelter-dialogue');
    const count = section.querySelector('.shelter-count');
    const progress = section.querySelector('.shelter-progress');
    const fill = section.querySelector('.shelter-progress-fill');

    // 쓰다듬기 횟수에 따라 대사, 표정, 게이지를 함께 갱신한다.
    function render() {
      dialogue.textContent = DIALOGUES[petCount];
      // 대사 단계에 맞춰 기존 고양이 이모션 이미지를 전환한다.
      const mood = petCount >= 6 ? 'happy'
        : petCount >= 4 ? 'purr'
        : petCount >= 2 ? 'soft'
        : 'cold';
      const moodLabels = {
        cold: '새침한 표정의 검은 고양이',
        soft: '살짝 마음이 풀린 검은 고양이',
        purr: '눈을 감고 고로롱하는 검은 고양이',
        happy: '행복하게 웃는 검은 고양이'
      };
      catArt.src = `assets/images/shelter/cat_${mood}.png`;
      catArt.alt = moodLabels[mood];
      count.textContent = `${petCount} / ${REQUIRED_PETS}`;
      progress.setAttribute('aria-valuenow', String(petCount));
      fill.style.width = `${(petCount / REQUIRED_PETS) * 100}%`;
      section.classList.toggle('is-happy', petCount >= 4);
      section.classList.toggle('is-complete', petCount === REQUIRED_PETS);
    }

    function petCat() {
      if (!active) return;

      petCount += 1;
      render();

      // 연속 클릭에도 쓰다듬기 애니메이션을 다시 실행한다.
      cat.classList.remove('is-petted');
      void cat.offsetWidth;
      cat.classList.add('is-petted');
      if (effectTimer !== null) clearTimeout(effectTimer);
      effectTimer = setTimeout(() => {
        cat.classList.remove('is-petted');
        effectTimer = null;
      }, 650);

      if (petCount === REQUIRED_PETS) {
        active = false;
        cat.disabled = true;
        petButton.hidden = true;
        restartButton.hidden = false;
        // 별과 수첩 단서는 메인 스크립트가 중복 지급 없이 처리한다.
        onComplete();
      }
    }

    cat.addEventListener('click', petCat);
    petButton.addEventListener('click', petCat);
    restartButton.addEventListener('click', () => start(container, onComplete));
    render();

    cleanup = () => {
      active = false;
      if (effectTimer !== null) clearTimeout(effectTimer);
    };
  }

  return { start, stop: () => cleanup() };
})();
