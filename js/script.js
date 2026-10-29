// ============================================================================

// 전체 게임 관리 · 진행도 / 단서 / 모달

// ============================================================================

const stages = {
  candy: '달콤한 라운지',

  cave: '불타는 동굴',

  potion: '사랑의 묘약 가게',

  treat: '트릭 오어 트릿 거리',

  shelter: '검은 고양이의 쉼터',

  cake: '할로윈 케이크 하우스',

  hut: '꼬마 마녀의 오두막',

  broom: '마녀의 빗자루 언덕',

  kitchen: '마녀의 요리공방',

  hat: '마법사의 모자 숲',

  ghost: '반짝이는 유령 연못',

  forest: '유령의 나무숲',

  moon: '달빛 전망대',
};

const STORAGE_KEY = 'mittaHalloweenCompletedStages';

// Stage 13: each passenger gets a persistent six-rune secret and twelve coherent clues.

const RUNE_NAMES = [
  '풍요',
  '소',
  '가시',
  '입',
  '여정',
  '횃불',
  '선물',
  '기쁨',
  '우박',
  '필요',
  '얼음',
  '해',
  '주목',
  '놀이',
  '수호',
  '태양',
  '티르',
  '자작나무',
  '말',
  '인간',
  '호수',
  '잉',
  '유산',
  '낮',
  '참나무',
  '물푸레',
  '활',
  '대지',
  '뱀',
  '성배',
  '창',
  '불',
  '돌',
];

const RUNE_COUNT = 33;

const CLUE_TITLES = [
  '사탕 상자의 낡은 각인',
  '용암 바위의 흔적',
  '마녀의 메모',
  '사탕 껍질의 인장',
  '검은 고양이의 속삭임',
  '케이크 장식의 문자',
  '마녀의 해독서',
  '빗자루의 경고',
  '솥 바닥의 문장',
  '모자 속의 쪽지',
  '연못에 비친 글씨',
  '나무에 새겨진 약속',
];

const CLUE_STAGES = [
  'candy',
  'cave',
  'potion',
  'treat',
  'shelter',
  'cake',
  'hut',
  'broom',
  'kitchen',
  'hat',
  'ghost',
  'forest',
];

function shuffleRunes(array) {
  const a = [...array];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function newRunePuzzle() {
  const answer = shuffleRunes(Array.from({ length: RUNE_COUNT }, (_, i) => i + 1)).slice(0, 6);

  // The answer and decoys are both randomized. The same puzzle is retained for the whole trip.

  const choices = shuffleRunes([
    ...answer,
    ...shuffleRunes(
      Array.from({ length: RUNE_COUNT }, (_, i) => i + 1).filter((id) => !answer.includes(id)),
    ).slice(0, 6),
  ]);

  return { answer, choices };
}

function passengerRunePuzzle() {
  if (!currentPassenger) return newRunePuzzle();

  const p = currentPassenger.runePuzzle;

  const valid =
    p &&
    Array.isArray(p.answer) &&
    p.answer.length === 6 &&
    new Set(p.answer).size === 6 &&
    p.answer.every((x) => Number.isInteger(x) && x >= 1 && x <= 33) &&
    Array.isArray(p.choices) &&
    p.choices.length === 12 &&
    p.answer.every((x) => p.choices.includes(x));

  if (!valid) {
    currentPassenger.runePuzzle = newRunePuzzle();
    persistPassengers();
  }

  return currentPassenger.runePuzzle;
}

function runeClues() {
  const { answer } = passengerRunePuzzle();
  const clues = {};
  const rune = (position) => {
    const number = answer[position];
    return `${String(number).padStart(2, '0')}번 ${RUNE_NAMES[number - 1]} 룬`;
  };

  // 정답을 기준으로 단서를 생성하므로 승객마다 달라도 모순이 없습니다.
  // 첫 홈 힌트 1개 + 인접 관계 4개 + 순서 관계 2개 + 간격 2개 + 제외 3개.
  // 인접 관계는 두 묶음(1~3, 4~6)을 만들고, 첫 홈과 두 묶음의 순서로
  // 여섯 룬의 배치가 유일하게 정해집니다. 개별 홈의 정답을 나열하지 않습니다.
  const texts = [
    `${rune(0)}은 첫 번째 홈에 놓인다.`,
    `${rune(3)}은 ${rune(4)} 바로 앞에 놓인다.`,
    `${rune(1)}은 ${rune(2)} 바로 앞에 놓인다.`,
    `${rune(5)}은 ${rune(0)}보다 뒤에 놓인다.`,
    `${rune(0)}과 ${rune(2)} 사이에는 룬이 하나 있다.`,
    `${rune(4)}은 첫 번째 홈에 놓이지 않는다.`,
    `${rune(0)}은 ${rune(1)} 바로 앞에 놓인다.`,
    `${rune(3)}은 ${rune(5)}보다 앞에 놓인다.`,
    `${rune(3)}과 ${rune(5)} 사이에는 룬이 하나 있다.`,
    `${rune(2)}은 마지막 홈에 놓이지 않는다.`,
    `${rune(4)}은 ${rune(5)} 바로 앞에 놓인다.`,
    `${rune(1)}은 네 번째 홈에 놓이지 않는다.`,
  ];

  CLUE_STAGES.forEach((id, i) => {
    clues[id] = { symbol: '✦', title: CLUE_TITLES[i], text: texts[i] };
  });
  return clues;
}

const modal = document.getElementById('gameModal');

const modalTitle = document.getElementById('modalTitle');

const modalBody = document.getElementById('modalBody');

const closeButton = document.getElementById('modalClose');

const starCount = document.getElementById('starCount');

const main = document.querySelector('main');

const journalButton = document.getElementById('journalButton');

const certificateButton = document.getElementById('certificateButton');

const journalCount = document.getElementById('journalCount');

// ============================================================================

// 승객별 탑승 수속 · 로컬 저장

// ============================================================================

const PASSENGER_STORAGE_KEY = 'mittaHalloweenPassengersV1';

const CHARACTER_EMOJI = { cat: '🐈‍⬛', ghost: '👻', witch: '🧙', pumpkin: '🎃' };

const CHARACTER_IMAGE = {
  cat: 'assets/images/character/cat.png',

  ghost: 'assets/images/character/ghost.png',

  witch: 'assets/images/character/witch.png',

  pumpkin: 'assets/images/character/pumpkin.png',
};

function makePassengerAvatar(character) {
  const img = document.createElement('img');

  img.className = 'passenger-avatar';

  img.src = CHARACTER_IMAGE[character] || CHARACTER_IMAGE.cat;

  img.alt = CHARACTER_EMOJI[character] || '';

  return img;
}

const checkinOverlay = document.getElementById('checkinOverlay');

const checkinForm = document.getElementById('checkinForm');

const checkinNickname = document.getElementById('passengerNickname');

const checkinMessage = document.getElementById('checkinMessage');

const passengerList = document.getElementById('passengerList');

const existingPassengers = document.getElementById('existingPassengers');

const passengerName = document.getElementById('passengerName');

const changePassengerButton = document.getElementById('changePassengerButton');

let previousFocus = null;

let currentStage = null;

let completedStages = [];

let currentPassenger = null;

let passengers = [];

function sanitizeProgress(value) {
  return Array.isArray(value) ? [...new Set(value.filter((id) => Object.hasOwn(stages, id)))] : [];
}

function loadPassengers() {
  try {
    const saved = JSON.parse(localStorage.getItem(PASSENGER_STORAGE_KEY) || '[]');

    if (Array.isArray(saved))
      passengers = saved

        .filter(
          (p) =>
            p &&
            typeof p.id === 'string' &&
            typeof p.nickname === 'string' &&
            Object.hasOwn(CHARACTER_EMOJI, p.character),
        )

        .map((p) => ({ ...p, completedStages: sanitizeProgress(p.completedStages) }));
  } catch (error) {
    console.warn('승객 정보를 불러오지 못했습니다.', error);
  }
}

function persistPassengers() {
  try {
    localStorage.setItem(PASSENGER_STORAGE_KEY, JSON.stringify(passengers));
  } catch (error) {
    console.warn('승객 기록을 저장하지 못했습니다.', error);
  }
}

function legacyProgress() {
  try {
    return sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

function setPassenger(passenger) {
  if (!passenger) return;

  currentPassenger = passenger;

  passengerRunePuzzle();

  completedStages = sanitizeProgress(passenger.completedStages);

  passengerName.replaceChildren(
    makePassengerAvatar(passenger.character),

    document.createTextNode(` ${passenger.nickname} 승객님`),
  );

  checkinOverlay.hidden = true;

  document.body.classList.remove('checkin-active');

  main.inert = false;

  updateProgress();

  changePassengerButton.focus();
}

function renderPassengerList() {
  passengerList.replaceChildren();

  existingPassengers.hidden = passengers.length === 0;

  passengers.forEach((p) => {
    const button = document.createElement('button');

    button.type = 'button';

    button.className = 'checkin-passenger';

    const icon = document.createElement('span');

    icon.className = 'checkin-passenger-icon';

    icon.append(makePassengerAvatar(p.character));

    const details = document.createElement('span');

    const name = document.createElement('strong');

    name.textContent = p.nickname;

    const progress = document.createElement('small');

    progress.textContent = `⭐ ${
      sanitizeProgress(p.completedStages).length
    } / 13 · 이어서 여행하기`;

    details.append(name, progress);

    button.append(icon, details);

    button.addEventListener('click', () => setPassenger(p));

    passengerList.append(button);
  });
}

function openCheckin() {
  if (!modal.hidden) closeModal();

  currentPassenger = null;

  completedStages = [];

  main.inert = true;

  document.body.classList.add('checkin-active');

  checkinOverlay.hidden = false;

  checkinForm.reset();

  checkinMessage.textContent = '';

  renderPassengerList();

  checkinNickname.focus();
}

checkinForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nickname = checkinNickname.value.trim();

  if (!nickname || nickname.length > 12) {
    checkinMessage.textContent = '닉네임을 1~12글자로 입력해 주세요.';

    return;
  }

  if (passengers.some((p) => p.nickname.toLocaleLowerCase() === nickname.toLocaleLowerCase())) {
    checkinMessage.textContent = '이미 등록된 닉네임이에요. 위에서 기존 승객을 선택해 주세요.';

    return;
  }

  const character = checkinForm.elements.passengerCharacter.value;

  if (!Object.hasOwn(CHARACTER_EMOJI, character)) return;

  // 기존 단일 저장 기록은 처음 등록하는 승객에게만 복사합니다.

  const inherited = passengers.length === 0 ? legacyProgress() : [];

  const passenger = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`,

    nickname,

    character,

    completedStages: inherited,

    runePuzzle: newRunePuzzle(),
  };

  passengers.push(passenger);

  persistPassengers();

  setPassenger(passenger);
});

changePassengerButton.addEventListener('click', openCheckin);

loadPassengers();

function isMoonUnlocked() {
  return CLUE_STAGES.every((id) => completedStages.includes(id));
}

function updateProgress() {
  starCount.textContent = `⭐ ${completedStages.length} / 13`;

  journalCount.textContent = `${
    CLUE_STAGES.filter((id) => completedStages.includes(id)).length
  } / 12`;

  certificateButton.disabled = !completedStages.includes('moon');

  document.querySelectorAll('.map_point').forEach((button) => {
    button.classList.toggle('is-cleared', completedStages.includes(button.dataset.stage));
  });
}

function completeStage(id) {
  if (!Object.hasOwn(stages, id) || completedStages.includes(id)) return;

  completedStages.push(id);

  if (currentPassenger) {
    currentPassenger.completedStages = [...completedStages];

    persistPassengers();
  }

  updateProgress();

  if (id !== 'moon' && runeClues()[id] && currentStage === id) {
    showClueReward(id);
  }
}

function stopGames() {
  if (typeof CandyGame !== 'undefined') CandyGame.stop();

  if (typeof CaveGame !== 'undefined') CaveGame.stop();

  if (typeof PotionGame !== 'undefined') PotionGame.stop();

  if (typeof TreatGame !== 'undefined') TreatGame.stop();

  if (typeof ShelterGame !== 'undefined') ShelterGame.stop();

  if (typeof CakeGame !== 'undefined') CakeGame.stop();

  if (typeof BroomGame !== 'undefined') BroomGame.stop();

  if (typeof KitchenGame !== 'undefined') KitchenGame.stop();

  if (typeof HatGame !== 'undefined') HatGame.stop();

  if (typeof GhostGame !== 'undefined') GhostGame.stop();

  if (typeof ForestGame !== 'undefined') ForestGame.stop();

  if (typeof MoonGame !== 'undefined') MoonGame.stop();
}

function showClueReward(id) {
  if (modal.hidden) return;

  const clue = runeClues()[id];

  const existing = modalBody.querySelector('.rune-reward');

  if (existing) existing.remove();

  const reward = document.createElement('aside');

  reward.className = 'rune-reward';

  reward.innerHTML = `<h3>⭐ 별 1개 + 📜 비밀 단서 발견!</h3><div class="rune-reward-symbol"></div><strong></strong><p></p><button type="button">탐험 수첩에서 확인하기</button>`;

  reward.querySelector('.rune-reward-symbol').textContent = clue.symbol;

  reward.querySelector('strong').textContent = clue.title;

  reward.querySelector('p').textContent = clue.text;

  reward.querySelector('button').addEventListener('click', openJournal);

  modalBody.append(reward);

  reward.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function showDialog(title) {
  if (!currentPassenger) return;

  stopGames();

  previousFocus = modal.hidden ? document.activeElement : previousFocus;

  currentStage = null;

  modalTitle.textContent = title;

  modalBody.replaceChildren();

  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  main.inert = true;

  closeButton.focus();
}

function openJournal() {
  showDialog('📜 느요미의 룬 탐험 수첩');

  const wrap = document.createElement('section');

  wrap.className = 'rune-journal';

  const intro = document.createElement('p');

  intro.textContent =
    '12개 장소의 힌트로 여섯 룬의 순서를 해독하세요. 룬 번호는 그림 파일의 번호와 같습니다.';

  wrap.append(intro);

  CLUE_STAGES.forEach((id, index) => {
    const found = completedStages.includes(id);

    const entry = document.createElement('article');

    entry.className = `rune-entry${found ? ' is-found' : ''}`;

    const heading = document.createElement('h3');

    heading.textContent = `${index + 1}. ${stages[id]} ${found ? '📜' : '🔒'}`;

    const content = document.createElement('p');

    content.textContent = found ? runeClues()[id].text : '아직 발견하지 못한 단서';

    entry.append(heading, content);

    wrap.append(entry);
  });

  modalBody.append(wrap);
}

function openCertificate() {
  if (!currentPassenger || !completedStages.includes('moon')) return;

  showDialog("✈️ Mitta's Airline 탑승 인증서");

  const passengerName = `${currentPassenger.nickname} 승객님`;

  modalBody.innerHTML = `

    <section class="mitta-pass-area">

      <div class="mitta-boarding-pass" id="mittaBoardingPass" role="img" aria-label="미타에어 할로윈섬 여행 완료 기념 탑승권">

        <div class="mitta-pass-main">

          <div class="mitta-pass-header"><div><b>✈ Mitta's Airline</b><small>MAGICAL HALLOWEEN FLIGHT</small></div><span aria-hidden="true">☾ ✦</span></div>

          <div class="mitta-pass-route"><div><small>FROM</small><strong>HWI</strong><span>HALLOWEEN ISLAND</span></div><div class="mitta-pass-route-line" aria-hidden="true">✈</div><div><small>TO</small><strong>???</strong><span>NEXT ADVENTURE</span></div></div>

          <div class="mitta-pass-fields"><div><small>PASSENGER</small><b class="mitta-pass-name"></b></div><div><small>FLIGHT</small><b>MITTA-013</b></div><div><small>ADVENTURE</small><b>13 / 13 COMPLETE</b></div><div><small>CLASS</small><b>MAGICAL EXPLORER</b></div></div>

          <div class="mitta-pass-thanks">🌙 모든 마법의 룬을 완성했습니다. <span>THANK YOU FOR FLYING WITH MITTA'S AIRLINE</span></div>

        </div>

        <div class="mitta-pass-stub"><span class="mitta-stub-title">BOARDING PASS</span><strong>HWI <span>✈</span> ???</strong><small>MITTA-013</small><div class="mitta-pass-barcode" aria-hidden="true"></div><small>ADVENTURE COMPLETE</small><span class="mitta-pass-stamp">✓</span></div>

      </div>

      <div class="mitta-pass-actions"><button type="button" class="mitta-pass-print">🖨️ 인증서 인쇄하기</button><button type="button" class="mitta-pass-save">📥 PNG로 저장하기</button></div>

    </section>`;

  modalBody.querySelector('.mitta-pass-name').textContent = passengerName;

  modalBody.querySelector('.mitta-pass-print').addEventListener('click', () => window.print());

  modalBody
    .querySelector('.mitta-pass-save')
    .addEventListener('click', () => saveBoardingPassPNG(passengerName));
}

// Standalone, high-resolution Canvas rendering: no external CDN or third-party dependencies.

function saveBoardingPassPNG(passengerName) {
  const canvas = document.createElement('canvas');

  canvas.width = 1500;
  canvas.height = 600;

  const ctx = canvas.getContext('2d');

  const W = canvas.width,
    H = canvas.height,
    stub = 360;

  const round = (x, y, w, h, r, fill) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  round(0, 0, W, H, 30, '#fbf4ff');

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 30);
  ctx.clip();

  ctx.fillStyle = '#39265d';
  ctx.fillRect(0, 0, W, 118);

  ctx.fillStyle = '#fff0ce';
  ctx.font = 'bold 47px Georgia, serif';
  ctx.fillText("✈ Mitta's Airline", 52, 70);

  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#d7b8ff';
  ctx.fillText('MAGICAL HALLOWEEN FLIGHT', 55, 101);

  ctx.font = '45px serif';
  ctx.fillStyle = '#f9d78c';
  ctx.fillText('☾ ✦', 1010, 72);

  ctx.fillStyle = '#503475';
  ctx.font = '18px sans-serif';
  ctx.fillText('FROM', 58, 172);
  ctx.fillText('TO', 805, 172);

  ctx.font = 'bold 78px sans-serif';
  ctx.fillText('HWI', 54, 260);
  ctx.fillText('???', 800, 260);

  ctx.font = '19px sans-serif';
  ctx.fillText('HALLOWEEN ISLAND', 58, 293);
  ctx.fillText('NEXT ADVENTURE', 805, 293);

  ctx.font = '48px sans-serif';
  ctx.fillText('✈', 555, 251);

  ctx.strokeStyle = '#d7c2e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(55, 326);
  ctx.lineTo(1070, 326);
  ctx.stroke();

  const field = (x, y, label, value) => {
    ctx.fillStyle = '#9477ab';
    ctx.font = '18px sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#503475';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText(value, x, y + 35);
  };

  field(58, 365, 'PASSENGER', passengerName);
  field(580, 365, 'FLIGHT', 'MITTA-013');
  field(58, 450, 'ADVENTURE', '13 / 13 COMPLETE');
  field(580, 450, 'CLASS', 'MAGICAL EXPLORER');

  ctx.fillStyle = '#6c4992';
  ctx.font = 'bold 23px sans-serif';
  ctx.fillText('☾  모든 마법의 룬을 완성했습니다.', 58, 545);

  ctx.fillStyle = '#ede0f8';
  ctx.fillRect(W - stub, 118, stub, H - 118);

  ctx.strokeStyle = '#ad87ca';
  ctx.setLineDash([11, 10]);
  ctx.beginPath();
  ctx.moveTo(W - stub, 122);
  ctx.lineTo(W - stub, H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#6c4992';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('BOARDING PASS', W - stub + 35, 168);

  ctx.font = 'bold 43px sans-serif';
  ctx.fillText('HWI → ???', W - stub + 35, 245);

  ctx.font = '22px sans-serif';
  ctx.fillText('MITTA-013', W - stub + 35, 292);

  ctx.fillStyle = '#493361';
  for (let i = 0; i < 74; i++) {
    const x = W - stub + 34 + i * 3.8;
    const w = i % 5 === 0 ? 3 : 1.6;
    ctx.fillRect(x, 330, w, 95);
  }

  ctx.fillStyle = '#80609b';
  ctx.font = '17px sans-serif';
  ctx.fillText('ADVENTURE COMPLETE', W - stub + 35, 461);

  ctx.font = 'bold 62px sans-serif';
  ctx.fillText('✓', W - stub + 145, 540);

  ctx.restore();

  const download = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mitta_Air_Boarding_Pass.png';
    document.body.append(a);
    a.click();
    a.remove();
  };

  if (canvas.toBlob) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      download(url);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, 'image/png');
  } else download(canvas.toDataURL('image/png'));
}

function startStageGame(stage) {
  const games = {
    candy: typeof CandyGame !== 'undefined' ? CandyGame : null,

    cave: typeof CaveGame !== 'undefined' ? CaveGame : null,

    potion: typeof PotionGame !== 'undefined' ? PotionGame : null,

    treat: typeof TreatGame !== 'undefined' ? TreatGame : null,

    shelter: typeof ShelterGame !== 'undefined' ? ShelterGame : null,

    cake: typeof CakeGame !== 'undefined' ? CakeGame : null,

    hut: typeof HutGame !== 'undefined' ? HutGame : null,

    broom: typeof BroomGame !== 'undefined' ? BroomGame : null,

    kitchen: typeof KitchenGame !== 'undefined' ? KitchenGame : null,

    hat: typeof HatGame !== 'undefined' ? HatGame : null,

    ghost: typeof GhostGame !== 'undefined' ? GhostGame : null,

    forest: typeof ForestGame !== 'undefined' ? ForestGame : null,

    moon: typeof MoonGame !== 'undefined' ? MoonGame : null,
  };

  if (stage === 'moon') {
    MoonGame.start(modalBody, () => completeStage('moon'), {
      completed: completedStages.includes('moon'),

      puzzle: passengerRunePuzzle(),

      onCertificate: openCertificate,
    });

    return;
  }

  if (games[stage]) games[stage].start(modalBody, () => completeStage(stage));
  else modalBody.textContent = '🎃 이곳의 미니게임은 준비 중입니다!';
}

function openStage(button) {
  if (!currentPassenger) return;

  const stage = button.dataset.stage;

  if (!Object.hasOwn(stages, stage)) return;

  if (stage === 'moon' && !isMoonUnlocked()) {
    alert(
      '🔒 달빛 전망대는 아직 열리지 않았습니다.\n\n다른 12개 스테이지를 모두 완료해야 입장할 수 있습니다.',
    );

    return;
  }

  showDialog(stages[stage]);

  currentStage = stage;

  startStageGame(stage);
}

function closeModal() {
  stopGames();

  modal.hidden = true;
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';

  main.inert = false;

  currentStage = null;

  modalBody.replaceChildren();

  previousFocus?.focus();
}

document

  .querySelectorAll('.map_point')

  .forEach((button) => button.addEventListener('click', () => openStage(button)));

journalButton.addEventListener('click', openJournal);

certificateButton.addEventListener('click', openCertificate);

closeButton.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) closeModal();
});

modal.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || modal.hidden) return;

  const focusable = [
    ...modal.querySelectorAll(
      'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => el.getClientRects().length > 0);

  if (!focusable.length) {
    event.preventDefault();

    closeButton.focus();

    return;
  }

  if (event.shiftKey && document.activeElement === focusable[0]) {
    event.preventDefault();

    focusable.at(-1).focus();
  } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
    event.preventDefault();

    focusable[0].focus();
  }
});

openCheckin();
