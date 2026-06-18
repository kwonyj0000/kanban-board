# TASKS
# Kanban Board

---

## Phase 1 — 현재 구현 (완료)

| # | 태스크 | 상태 |
|---|--------|------|
| 1 | HTML 마크업 작성 (3컬럼 구조) | ✅ 완료 |
| 2 | CSS 레이아웃 및 컴포넌트 스타일링 | ✅ 완료 |
| 3 | 카드 생성 기능 (`createCard`, `addCardToColumn`) | ✅ 완료 |
| 4 | 카드 삭제 기능 (× 버튼) | ✅ 완료 |
| 5 | 드래그 앤 드롭 이동 (`dragstart`, `dragover`, `drop`) | ✅ 완료 |
| 6 | localStorage 저장/복원 (`saveToStorage`, `loadFromStorage`) | ✅ 완료 |
| 7 | CLAUDE.md 작성 | ✅ 완료 |
| 8 | plan.md 작성 | ✅ 완료 |

---

## Phase 1 — 잔여 작업

| # | 태스크 | 우선순위 | 상태 | 비고 |
|---|--------|--------|------|------|
| 9 | `package.json` 생성 (Jest 설정) | 높음 | ✅ 완료 | — |
| 10 | `app.test.js` 작성 (12개 단위 테스트) | 높음 | ✅ 완료 | — |
| 11 | 단위 테스트 전체 통과 확인 | 높음 | ✅ 완료 | 12/12 통과 |
| 12 | 반응형 레이아웃 (모바일/태블릿 미디어쿼리) | 높음 | ✅ 완료 | — |
| 13 | 터치 드래그 앤 드롭 (Touch Events API) | 높음 | ✅ 완료 | 고스트 + 임계값 8px |
| 14 | 카드 내용 수정 기능 (더블클릭 인라인 편집) | 중간 | ✅ 완료 | dblclick → textarea, Enter/Escape/blur 처리 |
| 15 | 같은 컬럼 내 카드 순서 드래그 변경 | 중간 | ✅ 완료 | getDragAfterElement + 드롭 인디케이터 |
| 16 | 컬럼 헤더에 카드 수 배지 표시 | 낮음 | ✅ 완료 | updateBadges(), 추가/삭제/이동 시 자동 갱신 |

---

## Phase 배포 — GitHub Pages

| # | 태스크 | 주체 | 상태 | 비고 |
|---|--------|------|------|------|
| D-01 | 배포용 새 레포 생성 (`kwonyj0000/kanban-board`) | 사용자 직접 | ✅ 완료 | — |
| D-02 | `.gitignore` 작성 (node_modules 제외) | 코드 | ✅ 완료 | — |
| D-03 | kanban 코드를 새 레포에 push | 코드 | ✅ 완료 | rsync + git init |
| D-04 | `GITHUB_PAGES.md` 배포 가이드 작성 | 코드 | ✅ 완료 | `docs/GITHUB_PAGES.md` |
| D-05 | GitHub Settings > Pages 활성화 (branch: main, folder: root) | 사용자 직접 | ✅ 완료 | — |
| D-06 | 배포 URL 확인 | 사용자 직접 | ✅ 완료 | `https://kwonyj0000.github.io/kanban-board/` |

---

## Phase 인증 — Supabase Auth

| # | 태스크 | 주체 | 상태 | 비고 |
|---|--------|------|------|------|
| A-01 | Supabase 프로젝트 생성 | 사용자 직접 | ⬜ 미완료 | Project URL · anon key 복사 |
| A-02 | Supabase Auth URL 설정 (Site URL, Redirect URL) | 사용자 직접 | ⬜ 미완료 | `docs/OAUTH.md` Step 2 |
| A-03 | Google Cloud OAuth 앱 생성 및 Supabase에 등록 | 사용자 직접 | ⬜ 미완료 | `docs/OAUTH.md` Step 3 |
| A-04 | GitHub OAuth 앱 생성 및 Supabase에 등록 | 사용자 직접 | ⬜ 미완료 | `docs/OAUTH.md` Step 4 |
| A-05 | `config.js` 생성 (Supabase URL · anon key) | 코드 | ⬜ 미완료 | — |
| A-06 | `config.example.js` 생성 (키 없는 템플릿) | 코드 | ⬜ 미완료 | — |
| A-07 | `auth.js` 생성 (Supabase 클라이언트 + 인증 함수) | 코드 | ⬜ 미완료 | — |
| A-08 | `login.html` 생성 (이메일 폼 + Google/GitHub 버튼) | 코드 | ⬜ 미완료 | — |
| A-09 | `index.html` 수정 (세션 체크, 사용자 정보, 로그아웃) | 코드 | ⬜ 미완료 | — |
| A-10 | `app.js` 수정 (사용자별 localStorage 키 분리) | 코드 | ⬜ 미완료 | `kanban-board-${userId}` |
| A-11 | `style.css` 수정 (로그인 페이지 스타일) | 코드 | ⬜ 미완료 | — |
| A-12 | `.gitignore`에 `config.js` 추가 | 코드 | ⬜ 미완료 | — |
| A-13 | 로컬 검증 (이메일/Google/GitHub 로그인 동작 확인) | 사용자 직접 | ⬜ 미완료 | `docs/OAUTH.md` 체크리스트 |
| A-14 | `kanban-board` 레포에 push 및 Pages 반영 확인 | 코드 + 사용자 | ⬜ 미완료 | — |

---

## Phase 2 — 백엔드 / RDB 연동

| # | 태스크 | 비고 |
|---|--------|------|
| 15 | 백엔드 프레임워크 선택 (Express / FastAPI) | — |
| 16 | MySQL 또는 PostgreSQL 스키마 생성 | `docs/DatabaseDesign.md` 참고 |
| 17 | REST API 구현 (`GET /boards`, `POST /cards`, `PATCH /cards/:id/move`, `DELETE /cards/:id`) | — |
| 18 | `saveToStorage()` → API 호출로 교체 | `fetch()` 래퍼로 교체 |
| 19 | `loadFromStorage()` → `GET /api/boards/:id` 호출로 교체 | — |
| 20 | 카드 ID를 서버 발급 UUID로 전환 | DOM 기반 `card-N` 제거 |
| 21 | JWT 기반 사용자 인증 추가 | 로그인/회원가입 UI 포함 |
| 22 | 백엔드 단위 테스트 작성 (pytest 또는 Jest) | — |
| 23 | CORS 설정 및 Authorization 헤더 처리 | — |

---

## Phase 3 — 협업 기능

| # | 태스크 | 비고 |
|---|--------|------|
| 24 | 멀티 보드 (여러 보드 생성/전환) | — |
| 25 | 팀원 초대 및 보드 공유 | — |
| 26 | 실시간 동기화 (WebSocket) | 동시 편집 충돌 방지 |
| 27 | 다크모드 지원 | CSS Variables 기반 |

---

## 테스트 케이스 목록

| # | 함수 | 테스트 내용 |
|---|------|------------|
| T-01 | `createCard` | 텍스트가 `.card-text`에 표시되는지 |
| T-02 | `createCard` | 고유 ID (`card-N`)가 부여되는지 |
| T-03 | `createCard` | `draggable === true` 인지 |
| T-04 | `createCard` | `.delete-btn` 요소가 포함되는지 |
| T-05 | `addCardToColumn` | 올바른 컬럼 목록에 카드가 추가되는지 |
| T-06 | `addCardToColumn` | 빈 문자열 입력 시 카드 미생성 |
| T-07 | `saveToStorage` | 카드 추가 후 localStorage에 저장되는지 |
| T-08 | `saveToStorage` | 저장 구조가 `{todo, inprogress, done}` 형식인지 |
| T-09 | `loadFromStorage` | 저장된 데이터를 올바르게 반환하는지 |
| T-10 | `loadFromStorage` | localStorage 비어있을 때 `null` 반환 |
| T-11 | 카드 삭제 | × 클릭 시 카드가 DOM에서 제거되는지 |
| T-12 | 카드 삭제 | 삭제 후 localStorage가 갱신되는지 |
| T-13 | 인라인 편집 | 더블클릭 시 textarea로 전환되는지 |
| T-14 | 인라인 편집 | Enter로 텍스트가 업데이트되는지 |
| T-15 | 인라인 편집 | Escape로 원래 텍스트가 복원되는지 |
| T-16 | `getDragAfterElement` | 커서 위치에 따라 삽입 위치 반환 |
| T-17 | `updateBadges` | 컬럼별 카드 수 배지 정확성 |
