# TRD — Technical Requirements Document
# Kanban Board

---

## 1. 기술 스택

### Phase 1 (현재)

| 레이어 | 기술 |
|--------|------|
| 마크업 | HTML5 |
| 스타일 | CSS3 (Flexbox) |
| 로직 | Vanilla JavaScript (ES6+) |
| 드래그 (데스크탑) | HTML5 Drag and Drop API |
| 드래그 (모바일) | Touch Events API (touchstart / touchmove / touchend) |
| 저장소 | Web Storage API (localStorage) |
| 반응형 | CSS Media Queries (모바일 ≤ 767px, 태블릿 768~1023px) |
| 테스트 | Jest + jest-environment-jsdom |

### Phase 2 (향후 RDB 연동)

| 레이어 | 기술 후보 |
|--------|---------|
| 백엔드 API | Node.js (Express) / Python (FastAPI) |
| 데이터베이스 | MySQL 또는 PostgreSQL |
| ORM | Sequelize (Node) / SQLAlchemy (Python) |
| 인증 | JWT 기반 |

---

## 2. 아키텍처

### Phase 1

```
브라우저
  └── index.html
        ├── style.css     레이아웃 / 컴포넌트 스타일
        └── app.js        상태 관리 / DOM 조작 / localStorage I/O
```

### Phase 2 (목표)

```
브라우저 (Client)
  └── REST API 호출 (fetch)
        └── 백엔드 서버
              └── MySQL / PostgreSQL
```

---

## 3. 모듈 설계 (app.js)

### 전역 상태

| 변수 | 타입 | 설명 |
|------|------|------|
| `cardIdCounter` | `number` | 카드 고유 ID 생성용 카운터 |
| `STORAGE_KEY` | `string` | localStorage 키 (`'kanban-board'`) |
| `COLUMNS` | `string[]` | 컬럼 ID 목록 |

### 함수 목록

| 함수 | 역할 |
|------|------|
| `init()` | 진입점. 데이터 로드 및 이벤트 등록 |
| `createCard(text)` | 카드 DOM 생성 + 이벤트 바인딩 |
| `addCardToColumn(columnId, text)` | 컬럼에 카드 추가 |
| `saveToStorage()` | 보드 상태 → localStorage 직렬화 저장 |
| `loadFromStorage()` | localStorage → 보드 상태 역직렬화 |
| `onDragStart(e)` | dataTransfer에 카드 ID 저장 |
| `onDragEnd(e)` | 드래그 스타일 초기화 |
| `setupColumnDrop(column)` | 컬럼에 drop 이벤트 등록 |
| `setupAddButton(btn)` | + 버튼에 click 이벤트 등록 |
| `onTouchStart(e)` | 터치 시작 좌표 및 대상 카드 기록 |
| `onTouchMove(e)` | 8px 임계값 초과 시 고스트 생성 및 이동, 컬럼 하이라이트 |
| `onTouchEnd(e)` | 손가락 위치의 컬럼으로 카드 이동, 저장 |
| `getColumnAtPoint(x, y)` | 고스트를 일시 숨겨 elementFromPoint로 컬럼 탐지 |
| `clearTouchState()` | 터치 드래그 상태 초기화 |

---

## 4. 이벤트 흐름

### 카드 추가
```
+ 버튼 클릭 → prompt() 입력 → createCard() → appendChild() → saveToStorage()
```

### 카드 삭제
```
× 버튼 클릭 → card.remove() → saveToStorage()
```

### 드래그 앤 드롭 (데스크탑)
```
dragstart  → dataTransfer.setData(cardId) + .dragging 클래스 추가
dragover   → e.preventDefault()           + .drag-over 클래스 추가
dragleave  → .drag-over 클래스 제거
drop       → cardList.appendChild(card)   + saveToStorage()
dragend    → 모든 상태 클래스 제거
```

### 터치 드래그 (모바일)
```
touchstart → 카드 및 시작 좌표 기록
touchmove  → 8px 임계값 초과 시:
               고스트(.touch-ghost) 생성 → 손가락 따라 이동
               getColumnAtPoint()로 대상 컬럼 하이라이트
touchend   → 대상 컬럼에 카드 이동 + saveToStorage()
             고스트 제거, 상태 초기화
```

---

## 5. 테스트 전략

| 구분 | 내용 |
|------|------|
| 단위 테스트 | Jest + jsdom. 파일: `app.test.js`. 총 12개 케이스 |
| 수동 검증 | `python3 -m http.server 8080` 으로 브라우저 직접 확인 |
| 금지 | Playwright 사용 금지 |

---

## 6. Phase 2 전환 시 변경 포인트

- `saveToStorage()` / `loadFromStorage()` 를 `fetch()` API 호출로 교체 → 나머지 로직 변경 최소화
- 카드 ID: DOM 기반 `card-N` → 서버 발급 UUID로 교체
- drop 핸들러에서 `PATCH /api/cards/:id/move` 호출 추가
- CORS 헤더, Authorization 헤더 처리 필요
