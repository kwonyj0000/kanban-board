# Kanban Board — 구현 정리

## 프로젝트 개요

순수 HTML/CSS/JS(외부 라이브러리 없음)로 구현한 칸반보드.

---

## 파일 구조

```
kanban/
├── index.html        # 마크업 구조
├── style.css         # 스타일
├── app.js            # 기능 로직
├── app.test.js       # 단위 테스트 (Jest)
├── package.json      # 테스트 실행 환경
└── plan.md           # 구현 정리 문서
```

---

## 구현 기능

### 1. 3컬럼 레이아웃
- **To-do** (파란색), **In-progress** (주황색), **Done** (초록색) 컬럼으로 구성
- flexbox로 수평 배치
- 각 컬럼에 헤더 + 카드 목록 + 추가 버튼(+) 포함

### 2. 카드 추가
- 각 컬럼 헤더의 `+` 버튼 클릭 시 `prompt()`로 텍스트 입력
- 입력값이 있을 때만 카드 생성
- 생성 즉시 로컬스토리지에 저장

### 3. 카드 삭제
- 카드에 마우스 호버 시 우측에 `×` 버튼 노출
- 클릭하면 해당 카드 DOM에서 제거
- 삭제 즉시 로컬스토리지에 반영

### 4. 카드 드래그 & 드롭 (컬럼 간 이동)
- HTML5 Drag and Drop API 사용
- `dragstart`: 카드 ID를 `dataTransfer`에 저장, 드래그 중 투명도 효과 적용
- `dragover`: 기본 동작 방지, 드롭 대상 컬럼 하이라이트
- `dragleave`: 컬럼 하이라이트 제거
- `drop`: 카드를 대상 컬럼 목록으로 이동, 로컬스토리지에 저장
- `dragend`: 드래그 스타일 초기화

### 5. 로컬스토리지 저장/복원
- 카드 추가, 삭제, 이동 시마다 자동 저장 (`kanban-board` 키)
- 저장 구조: `{ todo: [...], inprogress: [...], done: [...] }`
- 페이지 로드 시 로컬스토리지 데이터 우선 복원; 없으면 샘플 카드 5개 초기 표시

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 마크업 | HTML5 |
| 스타일 | CSS3 (flexbox) |
| 로직 | Vanilla JavaScript (ES6+) |
| 드래그 | HTML5 Drag and Drop API |
| 저장소 | Web Storage API (localStorage) |

---

## 단위 테스트 계획

### 테스트 프레임워크
- **Jest** + **jest-environment-jsdom** (DOM 환경 시뮬레이션)

### 테스트 파일
`app.test.js`

### 테스트 케이스

#### `createCard(text)`
| # | 테스트 내용 | 검증 항목 |
|---|------------|---------|
| 1 | 텍스트가 카드에 표시되는지 | `.card-text`의 `textContent` === 입력값 |
| 2 | 카드에 고유 ID가 부여되는지 | `card.id`가 `card-N` 형식인지 |
| 3 | `draggable` 속성이 `true`인지 | `card.draggable === true` |
| 4 | 삭제 버튼(`×`)이 포함되는지 | `.delete-btn` 요소 존재 여부 |

#### `addCardToColumn(columnId, text)`
| # | 테스트 내용 | 검증 항목 |
|---|------------|---------|
| 5 | 카드가 올바른 컬럼 목록에 추가되는지 | `#todo-list` 자식 수 증가 확인 |
| 6 | 빈 문자열 입력 시 카드가 생성되지 않는지 | 빈 값 가드 로직 확인 |

#### `saveToStorage()` / `loadFromStorage()`
| # | 테스트 내용 | 검증 항목 |
|---|------------|---------|
| 7 | 카드 추가 후 localStorage에 저장되는지 | `localStorage.getItem('kanban-board')` 파싱 결과 확인 |
| 8 | 저장된 데이터가 올바른 구조인지 | `{ todo, inprogress, done }` 키 존재 및 값 배열 여부 |
| 9 | `loadFromStorage()`가 저장된 데이터를 반환하는지 | 반환값이 저장 시 입력값과 일치하는지 |
| 10 | localStorage가 비어있을 때 `null`을 반환하는지 | 반환값 === `null` |

#### 카드 삭제
| # | 테스트 내용 | 검증 항목 |
|---|------------|---------|
| 11 | 삭제 버튼 클릭 시 카드가 DOM에서 제거되는지 | 부모 목록의 자식 수 감소 확인 |
| 12 | 삭제 후 localStorage가 갱신되는지 | 삭제된 텍스트가 저장 데이터에 없는지 확인 |

### 테스트 실행 방법

```bash
# 의존성 설치
npm install

# 전체 테스트 실행
npm test

# 감시 모드 (파일 변경 시 자동 재실행)
npm test -- --watch
```

---

## 실행 방법

```bash
# 로컬 서버 실행
python3 -m http.server 8080 --directory ./

# 브라우저에서 접속
http://localhost:8080
```
