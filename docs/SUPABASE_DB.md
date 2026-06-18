# Supabase DB 연동 가이드
# Kanban Board — 카드 데이터 PostgreSQL 이전

---

## 개요

카드 데이터를 브라우저 localStorage에서 Supabase PostgreSQL로 이전한다.  
Supabase Auth는 이미 연동되어 있으므로 동일한 `supabaseClient`를 재사용한다.

**핵심 전략**: `saveToStorage()` / `loadFromStorage()` 구현만 교체. UI·드래그 로직은 변경 없음.

| 인증 시 | 테스트(Jest) 시 |
|---------|----------------|
| `window.__userId` 설정됨 → Supabase DB 사용 | `window.__userId` 미설정 → localStorage 사용 (기존 테스트 그대로 통과) |

---

## Step 1 — Supabase 테이블 생성 (사용자 직접)

**Supabase 대시보드 > SQL Editor** 에서 아래 SQL 실행:

```sql
create table public.cards (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  column_id  text        not null check (column_id in ('todo', 'inprogress', 'done')),
  text       text        not null,
  position   integer     not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "users manage own cards"
  on public.cards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

> **RLS(Row Level Security)**: 각 사용자는 자신의 카드만 읽기/쓰기/삭제 가능. 다른 사용자 카드에는 접근 불가.

---

## Step 2 — auth.js: DB 함수 추가 (코드)

기존 `supabaseClient`를 재사용해 파일 끝에 두 함수를 추가한다.

### saveCardsToSupabase(data)

```js
async function saveCardsToSupabase(data) {
  const userId = window.__userId;
  await supabaseClient.from('cards').delete().eq('user_id', userId);
  const rows = [];
  ['todo', 'inprogress', 'done'].forEach(col => {
    (data[col] || []).forEach((text, idx) => {
      rows.push({ user_id: userId, column_id: col, text, position: idx });
    });
  });
  if (rows.length > 0) {
    await supabaseClient.from('cards').insert(rows);
  }
}
```

### loadCardsFromSupabase()

```js
async function loadCardsFromSupabase() {
  const { data, error } = await supabaseClient
    .from('cards')
    .select('column_id, text, position')
    .eq('user_id', window.__userId)
    .order('position');
  if (error) return null;
  const result = { todo: [], inprogress: [], done: [] };
  (data || []).forEach(row => {
    if (result[row.column_id] !== undefined) result[row.column_id].push(row.text);
  });
  // 행이 없으면 null 반환 → init()에서 initialCards fallback
  if (!data || data.length === 0) return null;
  return result;
}
```

---

## Step 3 — app.js: async 전환 (코드)

### saveToStorage() 변경

```js
async function saveToStorage() {
  const data = {};
  COLUMNS.forEach(columnId => {
    const list = document.getElementById(`${columnId}-list`);
    data[columnId] = [...list.querySelectorAll('.card')].map(card => {
      const text  = card.querySelector('.card-text');
      const input = card.querySelector('.card-edit-input');
      return text ? text.textContent : (input ? input.value.trim() : '');
    }).filter(t => t);
  });
  if (typeof window !== 'undefined' && window.__userId) {
    await saveCardsToSupabase(data);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
```

### loadFromStorage() 변경

```js
async function loadFromStorage() {
  if (typeof window !== 'undefined' && window.__userId) {
    return await loadCardsFromSupabase();
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
```

### init() 변경

```js
async function init() {
  if (typeof window !== 'undefined' && window.__userId) {
    STORAGE_KEY = `kanban-board-${window.__userId}`;
  }
  const source = (await loadFromStorage()) || initialCards;
  // ... 이하 기존과 동일
}
```

---

## Step 4 — index.html: await init() (코드)

```js
// 현재
function showBoard(session) {
  ...
  init();
}

// 변경
async function showBoard(session) {
  ...
  await init();
}
```

---

## Step 5 — app.test.js: T-09, T-10 수정 (코드)

`loadFromStorage()`가 async가 되어 직접 반환값을 사용하는 테스트 2개만 수정:

```js
// T-09
test('T-09: loadFromStorage — 저장된 데이터를 올바르게 반환한다', async () => {
  const sample = { todo: ['카드A'], inprogress: [], done: ['카드B'] };
  localStorage.setItem('kanban-board', JSON.stringify(sample));
  expect(await loadFromStorage()).toEqual(sample);
});

// T-10
test('T-10: loadFromStorage — localStorage가 비어있을 때 null을 반환한다', async () => {
  expect(await loadFromStorage()).toBeNull();
});
```

나머지 15개 테스트는 변경 없음.

---

## 검증 체크리스트

- [ ] `npm test` — 17개 테스트 전체 통과
- [ ] `python3 -m http.server 8080` 실행 후 로그인
- [ ] 카드 추가 → Supabase 대시보드 **Table Editor > cards** 에서 행 확인
- [ ] 브라우저 새로고침 → 카드 유지 (Supabase에서 복원)
- [ ] 다른 브라우저(시크릿 창)에서 동일 계정 로그인 → 카드 동기화
- [ ] RLS 확인: 다른 계정 카드는 보이지 않음
