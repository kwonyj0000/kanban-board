# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

이 디렉토리(`kanban/`) 내부 파일만 읽고 수정한다. 상위 폴더는 탐색하지 않는다.

## Git Rules

- 브랜치 병합은 **항상 merge** 사용. `rebase`는 금지.
- **`git commit` 및 `git push`는 사용자가 명시적으로 요청한 경우에만 수행한다.** 작업 완료 후 자동으로 커밋·푸시하지 않는다.

## Commands

```bash
# 로컬 서버 실행 (브라우저 확인용)
python3 -m http.server 8080

# 단위 테스트 전체 실행
npm test

# 단위 테스트 감시 모드
npm test -- --watch

# 특정 테스트만 실행
npm test -- --testNamePattern="createCard"
```

## Architecture

순수 HTML/CSS/JS 단일 페이지. 빌드 도구 없음. 인증 및 데이터 저장은 Supabase 사용.

- `index.html` — 3컬럼 보드 마크업 (`#todo`, `#inprogress`, `#done`). 인라인 `<script>`에서 세션 확인 → `window.__userId` / `window.__boardId` / `window.__isOwner` / `window.__ownBoardId` 설정 → `init()` 호출. `setupBoardTitle()` / `setupBoardSwitcher()` / `setupInviteBanner()`도 여기서 실행.
- `login.html` — 로그인/회원가입 UI (비밀번호 탭 + 매직링크 탭 + Google/GitHub OAuth)
- `style.css` — flexbox 레이아웃 + 컴포넌트 스타일. `.dragging` / `.drag-over`는 JS가 토글하는 상태 클래스
- `app.js` — 카드 CRUD·드래그앤드롭·인라인 편집 로직. 진입점 `init()`. 공유 관련 UI(`renderBoard`, `renderMemberList`, `setupShareBtn`)도 포함.
- `auth.js` — Supabase 클라이언트 초기화 + 모든 서버 함수. 인증, 보드/카드 CRUD, 공유(초대·수락·멤버 관리), Realtime 구독, 보드 제목 편집.
- `config.js` — Supabase URL · anon key. `.gitignore` 제외 대상. `config.example.js`를 복사해 값 입력.

### 핵심 흐름

**인증 → 보드 초기화:**
`onAuthStateChange` / `getSession` → `showBoard(session)` → `getOrCreateDefaultBoard()` → `init()` → `loadCardsFromSupabase()` → `renderBoard()`

**카드 저장 경로:**
카드 추가/삭제/이동 → `saveToStorage()` → `saveCardsToSupabase(boardId, data)`

**공유 흐름:**
소유자가 `inviteMember()` → 초대받은 사람 로그인 시 `getPendingInvitations()` → 배너 표시 → `acceptInvitation()` (RPC: `accept_board_invitation`) → `loadCardsFromSupabase()` → `renderBoard()`

**보드 전환:**
`setupBoardSwitcher()` → `getAcceptedSharedBoards()` → `<select>` 옵션 구성 → 선택 시 `window.__boardId` 교체 + Realtime 채널 재구독 + `setupBoardTitle()`

**보드 제목 편집:**
`setupBoardTitle()` → `getBoardTitle()` 표시. 소유자만 클릭 시 인라인 `<input>` 전환 → Enter/blur: `updateBoardTitle()` 저장, Escape: 취소.

### Supabase 테이블 구조

- `boards`: `id`, `user_id`, `title`
- `cards`: `id`, `board_id`, `column_id`, `text`, `position`
- `board_members`: `id`, `board_id`, `invited_email`, `user_id`, `status('pending'|'accepted')`
- RLS 상세 및 SECURITY DEFINER 함수(`is_board_member_accepted`, `accept_board_invitation`): `docs/DatabaseDesign.md`

### 전역 변수 (window.__)

| 변수 | 설명 |
|------|------|
| `__userId` | 현재 로그인 사용자 UUID |
| `__boardId` | 현재 표시 중인 보드 UUID (전환 시 변경됨) |
| `__ownBoardId` | 로그인 사용자 본인 보드 UUID (불변) |
| `__isOwner` | 현재 보드가 본인 것인지 여부 |
| `__realtimeChannel` | 현재 Realtime 구독 채널 (보드 전환 시 unsubscribe 후 교체) |
| `__skipAutoInit` | app.js 자동 `init()` 방지 플래그 |

## Testing

- 프레임워크: **Jest + jest-environment-jsdom**
- 테스트 파일: `app.test.js` (24개 테스트)
- Supabase 함수(`saveCardsToSupabase`, `loadCardsFromSupabase`, `inviteMember` 등)는 `global` mock으로 대체
- 작업 후 검증은 브라우저 직접 열기 또는 `python3 -m http.server` 사용. **Playwright 사용 금지.**

## Workflow 기록

작업을 수행한 후에는 반드시 `WORKFLOW.md`를 갱신한다.

- 사용자 프롬프트는 **원문 그대로** 기록
- 수행한 작업은 **요약**하여 기록
- 형식: 번호 순 목록, 프롬프트를 굵은 따옴표로, 작업 내용을 하위 항목으로
