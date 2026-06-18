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
                          ↑
                    board_members
                    (board_id FK, invited_email, status)
```

- `auth.users`: Supabase가 자동 관리. 직접 생성 불필요.
- `boards`: 사용자당 1개(기본) 또는 여러 개의 보드.
- `cards`: 보드에 속하며 컬럼(`todo` / `inprogress` / `done`)과 순서(`position`) 보유.
- `board_members`: 보드 공유 관계. 이메일 기반 초대, `pending` → `accepted` 전환.

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

### 3.3 board_members (Phase 3 — 보드 공유)

```sql
create table public.board_members (
  id            uuid        primary key default gen_random_uuid(),
  board_id      uuid        not null references public.boards on delete cascade,
  invited_email text        not null,
  user_id       uuid        references auth.users on delete cascade,
  status        text        not null default 'pending'
                            check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  unique(board_id, invited_email)
);

alter table public.board_members enable row level security;

-- 보드 소유자: 멤버 전체 관리
create policy "board_owner_manage_members"
  on public.board_members for all
  using (exists (select 1 from public.boards where id = board_id and user_id = auth.uid()));

-- 초대받은 본인: 자신의 초대 조회
create policy "user_see_own_invitations"
  on public.board_members for select
  using (user_id = auth.uid() or invited_email = auth.jwt()->>'email');

-- 초대받은 본인: 자신의 초대 조회
create policy "user_see_own_invitations"
  on public.board_members for select
  using (user_id = auth.uid() or invited_email = auth.jwt()->>'email');
```

> **초대 수락은 RLS 대신 `accept_board_invitation()` SECURITY DEFINER 함수로 처리한다.**  
> boards ↔ board_members 간 RLS 순환참조로 인해 직접 UPDATE 시 403이 발생하여,  
> 함수 내부에서 email 일치 + pending 상태를 검증 후 UPDATE하는 방식으로 교체함.

### 3.4 보안 함수 (SECURITY DEFINER)

| 함수 | 역할 |
|------|------|
| `is_board_member_accepted(board_id)` | boards/cards RLS에서 순환참조 없이 멤버 여부 확인 |
| `accept_board_invitation(invitation_id)` | 초대 수락 — 이메일 일치·pending 상태 검증 후 UPDATE |

```sql
-- 초대 수락 함수 (403 우회용 — 내부 보안 검증 포함)
create or replace function public.accept_board_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_rows  int;
begin
  select email into v_email from auth.users where id = auth.uid();

  update board_members
  set status = 'accepted', user_id = auth.uid()
  where id = p_invitation_id
    and invited_email = v_email
    and status = 'pending';

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;
```

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

### Phase 3 추가 SQL — board_members 및 RLS 교체 (Supabase SQL Editor)

> **주의**: 아래 3개 블록을 **순서대로 각각 별도 실행**한다. 한 번에 붙여넣으면 파싱 오류 발생.

**① board_members 테이블 생성** (한 번에 실행)

```sql
create table if not exists public.board_members (
  id            uuid        primary key default gen_random_uuid(),
  board_id      uuid        not null references public.boards on delete cascade,
  invited_email text        not null,
  user_id       uuid        references auth.users on delete cascade,
  status        text        not null default 'pending'
                            check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  unique(board_id, invited_email)
);

alter table public.board_members enable row level security;

create policy "board_owner_manage_members"
  on public.board_members for all
  using (exists (select 1 from public.boards where id = board_id and user_id = auth.uid()));

create policy "user_see_own_invitations"
  on public.board_members for select
  using (user_id = auth.uid() or invited_email = auth.jwt()->>'email');

create policy "user_accept_own_invitation"
  on public.board_members for update
  using (invited_email = auth.jwt()->>'email' and status = 'pending');

drop policy if exists "users manage own boards" on public.boards;

create policy "boards_owner_all"
  on public.boards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**② SECURITY DEFINER 함수 생성** — boards ↔ board_members 순환 참조 방지 (별도 실행)

```sql
create or replace function public.is_board_member_accepted(p_board_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from board_members
    where board_id = p_board_id
      and user_id = auth.uid()
      and status = 'accepted'
  );
$$;
```

> **왜 필요한가**: `boards` RLS가 `board_members`를 조회하고, `board_members` RLS가 다시 `boards`를 조회하면 무한 순환이 발생한다. `SECURITY DEFINER` 함수는 RLS를 우회하여 조회하므로 순환이 끊어진다.

**③ boards / cards RLS 교체** (별도 실행)

```sql
drop policy if exists "boards_member_select" on public.boards;
create policy "boards_member_select"
  on public.boards for select
  using (auth.uid() = user_id or is_board_member_accepted(id));

drop policy if exists "users manage cards via board" on public.cards;
drop policy if exists "cards_access" on public.cards;
create policy "cards_access"
  on public.cards for all
  using (
    exists (
      select 1 from public.boards
      where boards.id = cards.board_id
        and (boards.user_id = auth.uid() or is_board_member_accepted(boards.id))
    )
  )
  with check (
    exists (
      select 1 from public.boards
      where boards.id = cards.board_id
        and (boards.user_id = auth.uid() or is_board_member_accepted(boards.id))
    )
  );
```
