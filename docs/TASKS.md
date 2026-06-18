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
| A-01 | Supabase 프로젝트 생성 | 사용자 직접 | ✅ 완료 | — |
| A-02 | Supabase Auth URL 설정 (Site URL, Redirect URL) | 사용자 직접 | ✅ 완료 | — |
| A-03 | Google Cloud OAuth 앱 생성 및 Supabase에 등록 | 사용자 직접 | ✅ 완료 | — |
| A-04 | GitHub OAuth 앱 생성 및 Supabase에 등록 | 사용자 직접 | ✅ 완료 | — |
| A-05 | `config.js` 생성 (Supabase URL · anon key) — 사용자가 직접 값 입력 필요 | 코드 | ✅ 완료 | `config.example.js` 제공 |
| A-06 | `config.example.js` 생성 (키 없는 커밋용 템플릿) | 코드 | ✅ 완료 | — |
| A-07 | `auth.js` 생성 (이메일·매직링크·Google·GitHub·로그아웃·세션) | 코드 | ✅ 완료 | — |
| A-08 | `login.html` 생성 (로그인 탭 + 회원가입 탭 + 매직링크 탭 + Google/GitHub 버튼) | 코드 | ✅ 완료 | 탭 3개로 분리 |
| A-09 | `index.html` 수정 (세션 체크, 로딩 화면, 사용자 정보, 로그아웃) | 코드 | ✅ 완료 | — |
| A-10 | `app.js` 수정 (Supabase DB 연동, localStorage 제거) | 코드 | ✅ 완료 | Supabase 전용 |
| A-11 | `style.css` 수정 (로그인 페이지 스타일 + 헤더 유저 정보) | 코드 | ✅ 완료 | — |
| A-12 | `.gitignore`에 `config.js` 추가 | 코드 | ✅ 완료 | — |
| A-13 | 로컬 검증 (이메일/Google/GitHub 로그인 동작 확인) | 사용자 직접 | ✅ 완료 | — |
| A-14 | `kanban-board` 레포에 push 및 Pages 반영 확인 | 코드 + 사용자 | ⬜ 미완료 | — |

---

## Phase DB — Supabase PostgreSQL 연동

> 상세 설정 가이드: `docs/SUPABASE_DB.md`

| # | 태스크 | 주체 | 상태 | 비고 |
|---|--------|------|------|------|
| S-01 | Supabase SQL Editor에서 `boards` + `cards` 테이블 생성 + RLS 설정 | 사용자 직접 | ✅ 완료 | `docs/DatabaseDesign.md` 섹션 6 |
| S-02 | `auth.js` — `getOrCreateDefaultBoard()` / `saveCardsToSupabase()` / `loadCardsFromSupabase()` 추가 | 코드 | ✅ 완료 | `board_id` 기반 |
| S-03 | `app.js` — `saveToStorage()` / `loadFromStorage()` Supabase 전용, localStorage 완전 제거 | 코드 | ✅ 완료 | — |
| S-04 | `index.html` — `showBoard()` async 전환, `window.__boardId` 설정, `await init()` | 코드 | ✅ 완료 | — |
| S-05 | `app.test.js` — Supabase 함수 jest.fn() mock으로 교체 (17개 전체 통과) | 코드 | ✅ 완료 | — |

---

## Phase 3 — 협업 기능: 보드 공유

### Step 0: 문서 업데이트

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-00A | `docs/TASKS.md` Phase 3 상세화 | 코드 | ✅ 완료 |
| P3-00B | `docs/DatabaseDesign.md`에 board_members 스키마 추가 | 코드 | ✅ 완료 |

### Step 1: DB 스키마 (Supabase)

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-01 | `board_members` 테이블 생성 + RLS 설정 | 사용자 직접 | ⬜ 미완료 |
| P3-02 | `boards` RLS 정책 교체 (공유 멤버 읽기 허용) | 사용자 직접 | ⬜ 미완료 |
| P3-03 | `cards` RLS 정책 교체 (공유 멤버 CRUD 허용) | 사용자 직접 | ⬜ 미완료 |

### Step 2: auth.js 함수 추가

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-04 | `inviteMember(boardId, email)` | 코드 | ✅ 완료 |
| P3-05 | `getPendingInvitations()` | 코드 | ✅ 완료 |
| P3-06 | `acceptInvitation(invitationId)` | 코드 | ✅ 완료 |
| P3-07 | `getBoardMembers(boardId)` | 코드 | ✅ 완료 |
| P3-08 | `removeMember(memberId)` | 코드 | ✅ 완료 |
| P3-09 | `subscribeToBoardCards(boardId, callback)` — Supabase Realtime | 코드 | ✅ 완료 |

### Step 3: index.html UI 추가

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-10 | Share 버튼 (헤더) | 코드 | ✅ 완료 |
| P3-11 | 공유 모달 (초대 폼 + 멤버 목록) | 코드 | ✅ 완료 |
| P3-12 | 미수락 초대 알림 배너 | 코드 | ✅ 완료 |

### Step 4: app.js — Realtime + 공유 이벤트

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-13 | `init()` 내 Realtime 구독 및 카드 리로드 로직 | 코드 | ✅ 완료 |
| P3-14 | Share 버튼 이벤트 핸들러 (초대/멤버삭제) | 코드 | ✅ 완료 |

### Step 5: style.css 스타일

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-15 | 모달, 멤버 목록, 초대 배너 CSS | 코드 | ✅ 완료 |

### Step 6: 테스트

| # | 태스크 | 주체 | 상태 |
|---|--------|------|------|
| P3-16 | `app.test.js` 공유 함수 mock + 신규 테스트 케이스 (T-18~T-24) | 코드 | ✅ 완료 |
| P3-17 | 전체 테스트 통과 확인 (24/24) | 코드 | ✅ 완료 |

---

## Phase 3 — 추후 과제

| # | 태스크 | 비고 |
|---|--------|------|
| P4-01 | 멀티 보드 (여러 보드 생성/전환) | — |
| P4-02 | 다크모드 지원 | CSS Variables 기반 |

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
