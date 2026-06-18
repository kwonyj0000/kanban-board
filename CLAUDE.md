# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

이 디렉토리(`kanban/`) 내부 파일만 읽고 수정한다. 상위 폴더는 탐색하지 않는다.

## Git Rules

- 브랜치 병합은 **항상 merge** 사용. `rebase`는 금지.

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

- `index.html` — 3컬럼 구조 마크업 (`#todo`, `#inprogress`, `#done`). 세션 확인 후 보드 표시.
- `login.html` — 로그인/회원가입 UI (로그인 탭 + 회원가입 탭 + 매직링크 탭 + Google/GitHub OAuth)
- `style.css` — 레이아웃(flexbox) + 컴포넌트 스타일. `.dragging` / `.drag-over` 는 JS가 토글하는 상태 클래스
- `app.js` — 모든 로직 포함. 진입점은 `init()`. 데이터는 Supabase에만 저장.
- `auth.js` — Supabase 클라이언트 초기화, 인증 함수, DB 함수 (`getOrCreateDefaultBoard`, `saveCardsToSupabase`, `loadCardsFromSupabase`)
- `config.js` — Supabase URL·anon key (`.gitignore` 제외, `config.example.js` 제공)

### app.js 핵심 흐름

1. `index.html`에서 세션 확인 → `window.__userId`, `window.__boardId` 설정 → `init()` 호출
2. `init()` 호출 시 `loadFromStorage()` → `loadCardsFromSupabase()` → 없으면 `initialCards` fallback
3. 카드 생성은 `createCard(text)` 로만 수행 (drag 이벤트, delete 버튼을 여기서 바인딩)
4. 카드 추가/삭제/이동 후 반드시 `saveToStorage()` → `saveCardsToSupabase()` 호출
5. 데이터 구조: `{ todo: string[], inprogress: string[], done: string[] }` (Supabase `cards` 테이블)

### Supabase 테이블 구조

- `boards`: `id`, `user_id`, `title` — 사용자별 보드 (RLS: 본인 보드만 접근)
- `cards`: `id`, `board_id`, `column_id`, `text`, `position` — 카드 (RLS: board → user 경로로 소유 확인)
- 상세 스키마: `docs/DatabaseDesign.md`

## Testing

- 프레임워크: **Jest + jest-environment-jsdom** (DOM 시뮬레이션)
- 테스트 파일: `app.test.js`
- Supabase 함수(`saveCardsToSupabase`, `loadCardsFromSupabase`)는 `global` mock으로 대체
- 작업 후 검증은 브라우저 직접 열기 또는 `python3 -m http.server` 사용. **Playwright 사용 금지.**

## Workflow 기록

작업을 수행한 후에는 반드시 `WORKFLOW.md`를 갱신한다.

- 사용자 프롬프트는 **원문 그대로** 기록
- 수행한 작업은 **요약**하여 기록
- 형식: 번호 순 목록, 프롬프트를 굵은 따옴표로, 작업 내용을 하위 항목으로
