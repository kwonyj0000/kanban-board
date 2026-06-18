# Database Design
# Kanban Board

---

## 1. Phase 1 — localStorage 스키마 (현재)

### 저장 키
```
kanban-board
```

### 데이터 구조 (JSON)
```json
{
  "todo":       ["카드 텍스트1", "카드 텍스트2"],
  "inprogress": ["카드 텍스트3"],
  "done":       ["카드 텍스트4", "카드 텍스트5"]
}
```

### 특징
- 카드 순서는 배열 인덱스로 유지
- 카드 내용(텍스트)만 저장, ID/타임스탬프 없음
- 단일 사용자, 단일 보드만 지원

### 한계
- 다중 사용자 불가
- 카드 생성일, 수정일 추적 불가
- 브라우저가 다르면 데이터 공유 불가

---

## 2. Phase 2 — RDB 스키마 (MySQL / PostgreSQL 공통)

### ERD

```
users ──────────< boards >──────────< columns >──────────< cards
  1               N    1              N    1               N
```

### 2.1 users 테이블

```sql
CREATE TABLE users (
  id         BIGINT       PRIMARY KEY AUTO_INCREMENT,  -- PostgreSQL: BIGSERIAL
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,                    -- bcrypt 해시
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 boards 테이블

```sql
CREATE TABLE boards (
  id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT       NOT NULL,
  title      VARCHAR(255) NOT NULL DEFAULT 'Kanban Board',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2.3 columns 테이블

```sql
CREATE TABLE columns (
  id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
  board_id   BIGINT       NOT NULL,
  name       VARCHAR(100) NOT NULL,       -- 'To-do', 'In-progress', 'Done'
  slug       VARCHAR(50)  NOT NULL,       -- 'todo', 'inprogress', 'done'
  position   INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);
```

### 2.4 cards 테이블

```sql
CREATE TABLE cards (
  id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
  column_id  BIGINT       NOT NULL,
  content    TEXT         NOT NULL,
  position   INT          NOT NULL DEFAULT 0,  -- 같은 컬럼 내 카드 순서
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);
```

---

## 3. 인덱스 설계

```sql
-- 사용자별 보드 조회
CREATE INDEX idx_boards_user_id ON boards(user_id);

-- 보드별 컬럼 조회 (순서 포함)
CREATE INDEX idx_columns_board_position ON columns(board_id, position);

-- 컬럼별 카드 조회 (순서 포함)
CREATE INDEX idx_cards_column_position ON cards(column_id, position);
```

---

## 4. 주요 API 쿼리 예시

### 보드 전체 로드
```sql
SELECT c.id, c.content, c.position, col.slug
FROM   cards c
JOIN   columns col ON c.column_id = col.id
WHERE  col.board_id = :board_id
ORDER  BY col.position, c.position;
```

### 카드 이동 (컬럼 변경)
```sql
UPDATE cards
SET    column_id = :new_column_id,
       position  = :new_position,
       updated_at = NOW()
WHERE  id = :card_id;
```

---

## 5. Phase 1 → Phase 2 마이그레이션 전략

| 항목 | Phase 1 (localStorage) | Phase 2 (RDB) |
|------|----------------------|--------------|
| 카드 식별자 | DOM ID (`card-N`) | DB `cards.id` (BIGINT) |
| 데이터 저장 | `saveToStorage()` | `POST/PATCH /api/cards` |
| 데이터 로드 | `loadFromStorage()` | `GET /api/boards/:id` |
| 카드 순서 | 배열 인덱스 | `cards.position` 컬럼 |
| 다중 사용자 | 불가 | `users` 테이블로 분리 |

> **전환 방법**: `saveToStorage()` / `loadFromStorage()` 두 함수를 API 호출 래퍼로 교체하면 나머지 UI 로직 변경 없음.

---

## 6. MySQL vs PostgreSQL 차이점

| 항목 | MySQL | PostgreSQL |
|------|-------|-----------|
| AUTO_INCREMENT | `AUTO_INCREMENT` | `SERIAL` / `BIGSERIAL` |
| ON UPDATE | `ON UPDATE CURRENT_TIMESTAMP` | 트리거로 구현 |
| JSON 저장 | `JSON` 타입 지원 | `JSONB` (인덱싱 가능) |
| 전문 검색 | `FULLTEXT INDEX` | `tsvector` / `GIN` 인덱스 |
