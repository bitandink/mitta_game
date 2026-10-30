# ✈️ Mitta's Airline — 할로윈섬

> 할로윈섬에서 길을 잃은 느요미를 도와, 열두 장소의 미니게임을 해결하고 마지막 달빛 전망대의 비밀을 풀어보세요.

**Mitta's Airline**은 Spoon Radio 방송 콘셉트를 바탕으로 제작한 브라우저 기반 인터랙티브 미니게임 프로젝트입니다. 탑승 수속부터 섬 탐험, 단서 수집, 최종 퍼즐과 탑승 인증서까지 하나의 여행 흐름으로 연결했습니다.

- **장르:** 캐주얼 · 퍼즐 · 미니게임 · 웹 인터랙티브
- **구성:** 12개 탐험 스테이지 + 1개 최종 스테이지
- **플랫폼:** 웹 브라우저 (HTML/CSS/JavaScript)
- **개발:** Spoon Radio User **yaon**
- **아트워크:** Spoon Radio DJ **Mitta** (프로젝트 내 표기 기준)

## 🎮 게임 플레이

1. 공용 입장코드를 입력해 게임에 입장합니다.
2. 승객 닉네임과 캐릭터(검은 고양이·꼬마 유령·꼬마 마녀·호박 요정)를 선택합니다.
3. 할로윈섬 지도에서 원하는 장소를 클릭해 미니게임에 도전합니다.
4. 스테이지를 완료할 때마다 별과 단서가 기록됩니다.
5. **12개의 단서**를 모아 달빛 전망대의 최종 퍼즐에 도전합니다.
6. 마지막 스테이지를 완료하면 기념 **탑승 인증서**를 확인할 수 있습니다.

## 🗺️ 스테이지

| 번호 | 장소 | 플레이 콘셉트 | 코드 |
|---|---|---|---|
| 01 | 달콤한 라운지 | 사탕 카드 매칭 | `candy.js` |
| 02 | 불타는 동굴 | 용암 위험을 피하는 이동 게임 | `cave.js` |
| 03 | 사랑의 묘약 가게 | 재료를 넣어 묘약 만들기 | `potion.js` |
| 04 | 트릭 오어 트릿 거리 | 단서로 올바른 집 찾기 | `treat.js` |
| 05 | 검은 고양이의 쉼터 | 고양이와 교감하며 표정 변화시키기 | `shelter.js` |
| 06 | 할로윈 케이크 하우스 | 케이크 조각 맞추기 | `cake.js` |
| 07 | 꼬마 마녀의 오두막 | 유령을 피하며 영역 확보하기 | `hut.js` |
| 08 | 마녀의 빗자루 언덕 | 빗자루 비행과 고리 통과 | `broom.js` |
| 09 | 마녀의 요리공방 | 레시피에 맞춰 재료 조합하기 | `kitchen.js` |
| 10 | 마법사의 모자 숲 | 모자와 구슬을 이용한 추리 게임 | `hat.js` |
| 11 | 반짝이는 유령 연못 | 유령의 차이점 찾기 | `ghost.js` |
| 12 | 유령의 나무숲 | 타일 회전으로 길 연결하기 | `forest.js` |
| 13 | 달빛 전망대 | 수집한 단서를 이용한 최종 룬 퍼즐 | `moon.js` |

## ✨ 주요 기능

### 승객별 게임 진행도
- 닉네임과 캐릭터를 선택하는 탑승 수속 UI
- 동일 브라우저에 여러 승객 프로필 보관 및 전환
- `localStorage`에 스테이지 완료 기록 저장
- 이미 완료한 스테이지를 지도에 표시
- 별 **0~13개**, 단서 **0~12개** 현황 표시

> 진행도는 서버 계정이 아니라 **현재 브라우저의 로컬 저장소**에 저장됩니다. 브라우저 데이터 삭제 또는 다른 기기 이용 시 자동으로 동기화되지 않습니다.

### 단서 수집과 최종 엔딩
- 앞선 12개 스테이지 완료 시 각각의 단서 획득
- 승객별로 생성·보관하는 룬 퍼즐 정보
- 단서 수첩에서 수집한 기록 확인
- 12개 스테이지를 완료해야 최종 스테이지 진행 가능
- 최종 완료 후 기념 탑승 인증서 제공

### 다양한 미니게임 엔진
- 스테이지별 독립 JavaScript 파일과 `start()` / `stop()` 생명주기 관리
- 키보드 입력, 애니메이션 프레임, 타이머, DOM 상호작용을 게임 유형에 맞게 사용
- 랜덤 퍼즐 생성 및 스테이지별 성공·실패 처리
- `adaptive.js`에서 실패 횟수에 따라 보조 단계를 계산하는 난이도 완화 유틸리티 제공

### 공용 입장코드 인증
- 관리자가 활성 입장코드를 수동 변경
- 신규 입장자는 현재 활성 코드로만 인증
- 코드 변경 시 기존 인증자에게 최대 **60분 유예** (직전 코드 기준)
- **30초 간격**으로 인증 상태 재확인 및 필요 시 재인증 UI 표시
- 코드 원문 대신 SHA-256 해시를 DB에 저장
- HMAC 서명 세션 쿠키와 서버 측 보호 경로 검사

> 인증 기능은 Vercel 및 Supabase 환경을 전제로 합니다. 로컬 HTML 파일만 여는 방식으로는 전체 입장코드 기능이 작동하지 않습니다.

## 🛠️ 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프런트엔드 | HTML5, CSS3, Vanilla JavaScript |
| UI/상태 관리 | DOM API, `localStorage` |
| 게임 처리 | JavaScript 이벤트, 타이머, `requestAnimationFrame`, Canvas (해당 게임) |
| API | Vercel Functions (`api/*.js`) |
| 접근 제어 | Vercel Edge Middleware, HMAC-SHA256 쿠키 |
| 데이터베이스 | Supabase (PostgreSQL / REST API / SQL RPC) |
| 배포 | Vercel |
| 실행 환경 | Node.js 20 이상 |

별도 프런트엔드 프레임워크나 번들러 없이 정적 게임 코드를 구성했습니다.

## 📁 프로젝트 구조

```text
.
├── api/
│   ├── _lib.mjs             # 공통 인증·DB 유틸리티
│   ├── login.js             # 입장코드 인증
│   ├── status.js            # 현재 인증 상태
│   ├── admin.js             # 관리자 조회·코드 활성화
│   └── import.js            # 코드 해시 목록 등록
├── middleware.js           # 보호 경로 접근 검사
├── public/
│   ├── index.html           # 게임 메인 화면
│   ├── gate.html            # 입장코드 입력
│   ├── admin.html           # 코드 관리자 화면
│   ├── gate-watch.js        # 클라이언트 인증 상태 감시
│   ├── css/
│   │   ├── reset.css
│   │   ├── layout.css
│   │   ├── game.css
│   │   └── minigames.css
│   ├── js/
│   │   ├── script.js        # 승객·지도·진행도·단서·모달
│   │   └── game/            # 13개 스테이지 + adaptive.js
│   └── assets/              # 이미지·사운드 등 게임 리소스
├── scripts/
│   └── generate-codes.mjs   # 배포용 입장코드 생성
├── sql/
│   └── setup.sql            # 테이블 및 활성화 함수
├── .env.example
├── package.json
└── vercel.json
```

> 원본 압축파일에는 `public/backup/`, `.git/` 및 별도 관리 자료도 포함되어 있습니다. 공개 저장소에는 필요한 소스만 선별하는 것을 권장합니다.

## 🚀 설치 및 실행

### 1. 준비
- Node.js **20 이상**
- Vercel 프로젝트 및 개발 환경
- Supabase 프로젝트

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 준비

Supabase SQL Editor에서 `sql/setup.sql`을 실행합니다. `mitta_codes`와 `mitta_gate_state` 테이블 및 코드 활성화 함수를 생성합니다.

### 4. 환경변수

`.env.example`을 참고해 다음 값을 Vercel 환경변수에 등록합니다.

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SESSION_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARS
ADMIN_SECRET=YOUR_DIFFERENT_RANDOM_SECRET_AT_LEAST_32_CHARS
```

`SESSION_SECRET`과 `ADMIN_SECRET`은 **서로 다른 32자 이상 무작위 값**으로 설정합니다. 서비스 역할 키와 관리자 비밀값은 브라우저 코드나 공개 저장소에 노출하지 마세요.

### 5. 코드 생성 및 등록

```bash
npm run codes -- 30
```

생성된 `codes.csv`는 코드 원문 배포용으로 별도 보관하고, `codes-import.json`은 관리자 API에 등록합니다.

```bash
curl -X POST https://YOUR-DOMAIN/api/import \
  -H 'Content-Type: application/json' \
  -H 'x-admin-key: YOUR_ADMIN_SECRET' \
  --data-binary @codes-import.json
```

### 6. 로컬 개발 / 배포

```bash
npm run dev
```

Vercel 프로젝트에 배포한 뒤 `/admin.html`에서 사용할 코드를 활성화합니다. 플레이어는 `/gate.html`에서 코드를 입력해 입장합니다.

> `npm run dev`는 `vercel dev`를 실행합니다. Vercel CLI 설치·로그인 및 프로젝트 연결이 필요할 수 있습니다. 실제 외부 서비스 연동 배포 검증은 별도로 수행해야 합니다.

## 🔐 인증 동작 요약

```text
승객 → /gate.html → POST /api/login
                       ↓
                 활성 코드 해시 확인
                       ↓
                 서명된 세션 쿠키
                       ↓
            Middleware가 게임 경로 보호
                       ↓
          /api/status로 주기적 상태 확인
                       ↓
             만료 시 새 코드 재인증
```

인증 후 게임 진행도는 브라우저 로컬 저장소에 남지만, 재인증 시 페이지가 새로고침되므로 **플레이 중이던 미니게임의 중간 상태까지 복원되지는 않습니다.**

## 🧩 구현 시 고려한 점

- **경량화:** 외부 프런트엔드 프레임워크 없이 구현하여 정적 파일 기반으로 실행
- **기능 분리:** 미니게임별 파일을 분리하고 공통 제어 스크립트에서 통합
- **연속 플레이:** 별·단서·엔딩을 연결해 단순 미니게임 모음 이상의 진행 구조 구성
- **재도전 경험:** 일부 게임의 랜덤 요소와 실패 횟수 기반 난이도 보조
- **이벤트 운영:** 공용 입장코드를 교체하면서 기존 참여자에게 유예시간 제공

## ⚠️ 현재 구현의 제약 및 향후 개선

- 서버 측 계정 및 클라우드 저장 기능이 없어 기기 간 진행도 동기화 불가
- 인증 상태 변경 시 게임 전체가 새로고침되어 미니게임 중간 상태가 유지되지 않음
- 로그인 API에 별도 요청 횟수 제한(rate limiting) 구현 필요
- 관리자 기능에 2단계 인증, 접근 감사 및 추가 보호 도입 권장
- 스테이지별 접근성·모바일 조작 및 다양한 화면 크기에서 추가 검증 필요
- Vercel/Supabase 실제 배포 환경에서 인증·유예·재인증 통합 테스트 필요
- 공개 배포 전 `public/backup/`, 민감 자료, Git 이력 및 라이선스 검토 필요

## 👥 크레딧

- **Game Development:** Spoon Radio User **yaon**
- **Artwork:** Spoon Radio DJ **Mitta**
- **Concept:** Mitta's Airline / Spoon Radio 방송 테마

## 📄 라이선스

현재 저장소에서 명시적인 오픈소스 라이선스 파일은 확인되지 않았습니다. 소스 및 아트워크의 이용·재배포 조건은 별도 고지 전까지 임의로 추정하지 마세요.
