# Mitta's Airline — 수동 교체형 공용 입장코드

## 현재 구현 범위
- 관리자 수동 코드 교체, 기존 인증자는 60분 유예, 신규 인증자는 활성 코드만 허용.
- 코드 원문은 엑셀/CSV에만 보관하고 DB에는 SHA-256 해시만 저장.
- 서버 서명 HttpOnly 쿠키, 보호된 정적 게임 경로, 30초마다 인증 상태 확인 및 재인증 화면.
- 최신 업로드 게임 ZIP의 모든 원본 파일을 `public/`에 그대로 포함함. `index.html`에는 gate-watch.js 한 줄만 추가함.
- `public/index.html`에 `<script src="/gate-watch.js" defer></script>` 연결 완료.
- 실제 게임의 미니게임 타이머를 완전히 멈추거나 재개하는 코드는 각 스테이지 구현에 따라 별도 연동 필요. 현재는 화면 차단 후 인증 성공 시 새로고침함. 기존 localStorage에 저장된 스테이지 클리어 기록은 유지됨.

## 설치
1. Supabase 프로젝트 생성 → SQL Editor에서 `sql/setup.sql` 실행.
2. `node scripts/generate-codes.mjs 30` 실행 → `codes.csv`를 엑셀에서 열어 코드 배포 목록 관리. `codes-import.json`은 DB 등록용 해시 목록.
3. Vercel 환경변수에 `.env.example`의 4개 값 설정. SESSION_SECRET과 ADMIN_SECRET은 **서로 다른 32자 이상 랜덤 문자열**.
4. `npm install` 후 Vercel에 프로젝트 배포. Vercel의 프로젝트 Root Directory는 이 폴더로 지정.
5. 최초 등록: 관리자 키로 `/api/import`에 `codes-import.json` POST (예: `curl -X POST https://YOUR-DOMAIN/api/import -H 'Content-Type: application/json' -H 'x-admin-key: YOUR_ADMIN_SECRET' --data-binary @codes-import.json`). 코드 원문을 서버에 업로드하지 않음.
6. `/admin.html`에서 ADMIN_SECRET 입력 → 조회 → 원하는 코드를 활성화. 엑셀에서 해당 라벨에 맞는 코드 원문을 청취자에게 전달.
7. `/gate.html`에서 공용 코드로 인증하면 게임에 입장.

## 유예 규칙
- 코드 A로 로그인한 승객은 관리자 변경 시각 T부터 T+60분까지 이용.
- 코드 변경 즉시 신규 입장은 B코드만 허용.
- 30초 간격으로 상태를 확인하므로 화면 차단은 최대 약 30초 지연 가능. **보호 경로의 새 요청은 서버에서 즉시 검사**.
- 10분 이내 남으면 안내 팝업 표시.
- B코드로 재인증하면 새로운 세션 발급. 기존 브라우저 localStorage 기록은 그대로.
- 관리자가 60분 내에 다시 C코드로 바꾸면 A코드 사용자는 더 이상 유예 대상이 아니며 재인증해야 함 (직전 코드에만 유예).

## 보안·운영 주의
- `codes.csv`, `codes-import.json`, `.env`를 `public/` 또는 공개 Git 저장소에 절대 올리지 마세요.
- 관리자 화면은 키가 있어야 API 호출이 가능하지만, 별도의 로그인·접속 횟수 제한을 구현하면 더 안전합니다.
- 현재는 소규모 비공개 이벤트용 기본 구현. 공개 서비스 전에는 `/api/login`에 IP 기반 rate limiting, 관리자 2FA, 모니터링을 권장합니다.
- 보호되지 않는 별도 도메인/CDN에 게임 파일을 올리면 우회 접근할 수 있습니다.
- Vercel Edge Middleware의 실행 환경/패키지 버전에 따라 배포 조정이 필요할 수 있습니다. **실제 Vercel/Supabase 연동 배포 테스트는 수행하지 않았습니다.**

## 통합본 안내
- 기준 원본: 사용자가 업로드한 `mitta_halloween_game(3).zip`.
- 게임 원본은 `public/index.html`의 인증 상태 스크립트 추가 외에 수정하지 않았습니다.
- 입장코드 엑셀/CSV/해시 등록 JSON은 **별도로 보관**하세요. 이 배포용 ZIP에는 비밀 코드 목록을 포함하지 않았습니다. `/mnt/data/mitta_gate_starter/`에서 제공된 기존 엑셀과 등록 JSON을 사용하거나 `npm run codes -- 30`으로 새로 생성할 수 있습니다.
- 기존 `public/backup/`도 원본 보존 목적으로 포함되어 있습니다. 공개 배포 시 불필요한 백업 파일은 제거하는 편이 안전합니다.
- `gate-watch.js`는 재인증 후 페이지를 다시 불러오므로 현재 플레이 중인 미니게임의 중간 상태까지 복원하지는 않습니다.
