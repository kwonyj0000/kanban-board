# Database Design
# Kanban Board — Supabase PostgreSQL

---

## 1. 아키텍처 개요

| 역할 | 담당 |
|------|------|
| 사용자 인증 / 계정 관리 | Supabase Auth (`auth.users`) — 별도 테이블 불필요 |
| 보드 데이터 저장 | Supabase PostgreSQL (`public.boards`, `public.cards`) |
| 보안 (행 수준 접근 제어) | Row Level Security (RLS) |

---

## 2. ERD

```
auth.users ──────────< boards >──────────< cards
   (Supabase 관리)    user_id FK           board_id FK
```

- `auth.users`: Supabase가 자동 관리. 직접 생성 불필요.
- `boards`: 사용자당 1개(기본) 또는 여러 개의 보드.
- `cards`: 보드에 속하며 컬럼(`todo` / `inprogress` / `done`)과 순서(`position`) 보유.

---

## 3. 테이블 스키마

### 3.1 boards

```sql
create table public.boards (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  title      text        not null default 'Kanban Board',
  created_at timestamptz not null default now()
);

alter table public.boards enable row level security;

create policy "users manage own boards"
  on public.boards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 3.2 cards

```sql
create table public.cards (
  id         uuid        primary key default gen_random_uuid(),
  board_id   uuid        not null references public.boards on delete cascade,
  column_id  text        not null check (column_id in ('todo', 'inprogress', 'done')),
  text       text        not null,
  position   integer     not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "users manage cards via board"
  on public.cards for all
  using  (exists (
    select 1 from public.boards
    where boards.id = cards.board_id
      and boards.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.boards
    where boards.id = cards.board_id
      and boards.user_id = auth.uid()
  ));
```

> **`cards` RLS 방식**: `board_id → boards.user_id = auth.uid()` 경로로 소유자 확인.  
> cards 테이블에 user_id를 중복 저장하지 않고 boards를 통해 소유권을 검증한다.

---

## 4. 주요 쿼리

### 기본 보드 가져오기 (없으면 생성)

```js
// auth.js — getOrCreateDefaultBoard()
const { data } = await supabaseClient
  .from('boards')
  .select('id')
  .eq('user_id', userId)
  .limit(1)
  .single();

if (!data) {
  const { data: newBoard } = await supabaseClient
    .from('boards')
    .insert({ user_id: userId, title: 'Kanban Board' })
    .select('id')
    .single();
  return newBoard.id;
}
return data.id;
```

### 카드 전체 저장 (board 기준)

```js
await supabaseClient.from('cards').delete().eq('board_id', boardId);
await supabaseClient.from('cards').insert(rows); // rows: [{ board_id, column_id, text, position }]
```

### 카드 전체 로드

```js
const { data } = await supabaseClient
  .from('cards')
  .select('column_id, text, position')
  .eq('board_id', boardId)
  .order('position');
```

---

## 5. 로컬스토리지 → Supabase 마이그레이션 전략

| 항목 | Phase 1 (localStorage) | Phase DB (Supabase) |
|------|----------------------|---------------------|
| 사용자 | 없음 (단일 사용자) | `auth.users` |
| 보드 | 없음 (하드코딩) | `boards` 테이블 |
| 컬럼 | 하드코딩 ('todo' / 'inprogress' / 'done') | `cards.column_id` 텍스트로 유지 |
| 카드 저장 | `saveToStorage()` → localStorage | `saveCardsToSupabase()` → Supabase |
| 카드 로드 | `loadFromStorage()` → localStorage | `loadCardsFromSupabase()` → Supabase |
| 카드 식별자 | DOM 기반 `card-N` | Supabase 발급 UUID |

---

## 6. SQL 전체 실행 스크립트 (Supabase SQL Editor)

기존 `cards` 테이블이 있다면 먼저 삭제 후 재생성:

```sql
-- 기존 테이블 삭제 (이미 생성했다면)
drop table if exists public.cards;

-- boards 테이블 생성
create table public.boards (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  title      text        not null default 'Kanban Board',
  created_at timestamptz not null default now()
);

alter table public.boards enable row level security;

create policy "users manage own boards"
  on public.boards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- cards 테이블 재생성 (board_id 기반)
create table public.cards (
  id         uuid        primary key default gen_random_uuid(),
  board_id   uuid        not null references public.boards on delete cascade,
  column_id  text        not null check (column_id in ('todo', 'inprogress', 'done')),
  text       text        not null,
  position   integer     not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "users manage cards via board"
  on public.cards for all
  using  (exists (
    select 1 from public.boards
    where boards.id = cards.board_id
      and boards.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.boards
    where boards.id = cards.board_id
      and boards.user_id = auth.uid()
  ));
```
