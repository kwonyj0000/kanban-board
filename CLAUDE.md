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

순수 HTML/CSS/JS 단일 페이지. 빌드 도구 없음.

- `index.html` — 3컬럼 구조 마크업 (`#todo`, `#inprogress`, `#done`)
- `style.css` — 레이아웃(flexbox) + 컴포넌트 스타일. `.dragging` / `.drag-over` 는 JS가 토글하는 상태 클래스
- `app.js` — 모든 로직 포함. 진입점은 `init()`. 상태는 DOM + localStorage에만 존재 (별도 상태 객체 없음)

### app.js 핵심 흐름

1. `init()` 호출 시 `loadFromStorage()` → 없으면 `initialCards` fallback
2. 카드 생성은 `createCard(text)` 로만 수행 (drag 이벤트, delete 버튼을 여기서 바인딩)
3. 카드 추가/삭제/이동 후 반드시 `saveToStorage()` 호출
4. localStorage 스키마: `{ todo: string[], inprogress: string[], done: string[] }` (키: `'kanban-board'`)

## Testing

- 프레임워크: **Jest + jest-environment-jsdom** (DOM 시뮬레이션)
- 테스트 파일: `app.test.js`
- 작업 후 검증은 브라우저 직접 열기 또는 `python3 -m http.server` 사용. **Playwright 사용 금지.**

## Future: RDB 연동

Phase 2에서 MySQL/PostgreSQL 연동 시 `saveToStorage()` / `loadFromStorage()` 를 API 호출로 교체하면 나머지 로직 변경 최소화 가능. 카드 ID는 DOM 기반 `card-N` → 서버 발급 UUID로 교체 필요. 상세 스키마는 `docs/` 참고.
