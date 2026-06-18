const {
  createCard, addCardToColumn, saveToStorage, loadFromStorage,
  updateBadges, getDragAfterElement,
} = require('./app');

const COLUMNS = ['todo', 'inprogress', 'done'];

/* ── Supabase 함수 mock ── */
let _mockStore = null;
global.saveCardsToSupabase  = jest.fn(async (data) => { _mockStore = { ...data }; });
global.loadCardsFromSupabase = jest.fn(async () => _mockStore);

function setupDOM() {
  document.body.innerHTML = `
    <section class="column" id="todo">
      <div class="column-header">
        <h2>To-do</h2>
        <span class="badge" id="todo-badge">0</span>
      </div>
      <div class="card-list" id="todo-list"></div>
    </section>
    <section class="column" id="inprogress">
      <div class="column-header">
        <h2>In-progress</h2>
        <span class="badge" id="inprogress-badge">0</span>
      </div>
      <div class="card-list" id="inprogress-list"></div>
    </section>
    <section class="column" id="done">
      <div class="column-header">
        <h2>Done</h2>
        <span class="badge" id="done-badge">0</span>
      </div>
      <div class="card-list" id="done-list"></div>
    </section>
  `;
}

beforeEach(() => {
  _mockStore = null;
  saveCardsToSupabase.mockClear();
  loadCardsFromSupabase.mockClear();
  setupDOM();
});

/* ── createCard ── */

test('T-01: createCard — .card-text에 입력 텍스트가 표시된다', () => {
  const card = createCard('테스트 카드');
  expect(card.querySelector('.card-text').textContent).toBe('테스트 카드');
});

test('T-02: createCard — 고유 ID(card-N 형식)가 부여된다', () => {
  const card = createCard('카드');
  expect(card.id).toMatch(/^card-\d+$/);
});

test('T-03: createCard — draggable 속성이 true다', () => {
  const card = createCard('카드');
  expect(card.draggable).toBe(true);
});

test('T-04: createCard — .delete-btn 요소가 포함된다', () => {
  const card = createCard('카드');
  expect(card.querySelector('.delete-btn')).not.toBeNull();
});

/* ── addCardToColumn ── */

test('T-05: addCardToColumn — 올바른 컬럼 목록(#todo-list)에 카드가 추가된다', () => {
  const list   = document.getElementById('todo-list');
  const before = list.children.length;
  addCardToColumn('todo', '새 카드');
  expect(list.children.length).toBe(before + 1);
});

test('T-06: addCardToColumn — 빈 문자열 입력 시 카드가 추가되지 않는다', () => {
  const list = document.getElementById('todo-list');
  addCardToColumn('todo', '');
  addCardToColumn('todo', '   ');
  expect(list.children.length).toBe(0);
});

/* ── saveToStorage ── */

test('T-07: saveToStorage — 카드 추가 후 saveCardsToSupabase가 호출된다', async () => {
  addCardToColumn('todo', '저장 테스트');
  await saveToStorage();
  expect(saveCardsToSupabase).toHaveBeenCalled();
});

test('T-08: saveToStorage — 저장 구조가 {todo, inprogress, done} 형식이다', async () => {
  addCardToColumn('todo', '카드1');
  addCardToColumn('inprogress', '카드2');
  await saveToStorage();
  const data = saveCardsToSupabase.mock.calls[0][0];
  expect(Array.isArray(data.todo)).toBe(true);
  expect(Array.isArray(data.inprogress)).toBe(true);
  expect(Array.isArray(data.done)).toBe(true);
});

/* ── loadFromStorage ── */

test('T-09: loadFromStorage — 저장된 데이터를 올바르게 반환한다', async () => {
  const sample = { todo: ['카드A'], inprogress: [], done: ['카드B'] };
  loadCardsFromSupabase.mockResolvedValueOnce(sample);
  expect(await loadFromStorage()).toEqual(sample);
});

test('T-10: loadFromStorage — 데이터가 없을 때 null을 반환한다', async () => {
  expect(await loadFromStorage()).toBeNull();
});

/* ── 카드 삭제 ── */

test('T-11: 카드 삭제 — × 버튼 클릭 시 카드가 DOM에서 제거된다', () => {
  addCardToColumn('todo', '삭제될 카드');
  const list = document.getElementById('todo-list');
  list.querySelector('.delete-btn').click();
  expect(list.querySelector('.card')).toBeNull();
});

test('T-12: 카드 삭제 — 삭제 후 saveCardsToSupabase가 호출된다', async () => {
  addCardToColumn('todo', '삭제 전 카드');
  document.getElementById('todo-list').querySelector('.delete-btn').click();
  await Promise.resolve();
  await Promise.resolve();
  expect(saveCardsToSupabase).toHaveBeenCalled();
  const data = saveCardsToSupabase.mock.calls[saveCardsToSupabase.mock.calls.length - 1][0];
  expect(data.todo).not.toContain('삭제 전 카드');
});

/* ── 인라인 편집 ── */

test('T-13: 더블클릭 시 .card-text가 textarea로 전환된다', () => {
  addCardToColumn('todo', '원래 텍스트');
  const card = document.getElementById('todo-list').querySelector('.card');
  card.querySelector('.card-text').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  expect(card.querySelector('.card-edit-input')).not.toBeNull();
  expect(card.querySelector('.card-text')).toBeNull();
});

test('T-14: Enter 키로 편집 완료 시 텍스트가 업데이트된다', () => {
  addCardToColumn('todo', '원래 텍스트');
  const card = document.getElementById('todo-list').querySelector('.card');
  card.querySelector('.card-text').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  const textarea = card.querySelector('.card-edit-input');
  textarea.value = '수정된 텍스트';
  textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(card.querySelector('.card-text').textContent).toBe('수정된 텍스트');
});

test('T-15: Escape 키로 취소 시 원래 텍스트로 복원된다', () => {
  addCardToColumn('todo', '원래 텍스트');
  const card = document.getElementById('todo-list').querySelector('.card');
  card.querySelector('.card-text').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  const textarea = card.querySelector('.card-edit-input');
  textarea.value = '수정 시도';
  textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(card.querySelector('.card-text').textContent).toBe('원래 텍스트');
});

/* ── 카드 순서 (getDragAfterElement) ── */

test('T-16: getDragAfterElement — 커서가 카드 상단 절반에 있으면 해당 카드를 반환한다', () => {
  addCardToColumn('todo', '카드A');
  addCardToColumn('todo', '카드B');
  const list = document.getElementById('todo-list');
  const [cardA, cardB] = list.querySelectorAll('.card');
  cardA.getBoundingClientRect = () => ({ top: 0,  height: 50 });
  cardB.getBoundingClientRect = () => ({ top: 60, height: 50 });
  expect(getDragAfterElement(list, 10)).toBe(cardA);
  expect(getDragAfterElement(list, 200)).toBeUndefined();
});

/* ── 배지 ── */

test('T-17: updateBadges — 컬럼별 카드 수가 배지에 정확히 표시된다', () => {
  addCardToColumn('todo', '카드1');
  addCardToColumn('todo', '카드2');
  addCardToColumn('inprogress', '카드3');
  updateBadges();
  expect(document.getElementById('todo-badge').textContent).toBe('2');
  expect(document.getElementById('inprogress-badge').textContent).toBe('1');
  expect(document.getElementById('done-badge').textContent).toBe('0');
});
