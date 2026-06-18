const {
  createCard, addCardToColumn, saveToStorage, loadFromStorage,
  updateBadges, getDragAfterElement,
} = require('./app');

const COLUMNS = ['todo', 'inprogress', 'done'];

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
  setupDOM();
  localStorage.clear();
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

test('T-07: saveToStorage — 카드 추가 후 localStorage에 저장된다', () => {
  addCardToColumn('todo', '저장 테스트');
  saveToStorage();
  expect(localStorage.getItem('kanban-board')).not.toBeNull();
});

test('T-08: saveToStorage — 저장 구조가 {todo, inprogress, done} 형식이다', () => {
  addCardToColumn('todo', '카드1');
  addCardToColumn('inprogress', '카드2');
  saveToStorage();
  const data = JSON.parse(localStorage.getItem('kanban-board'));
  expect(Array.isArray(data.todo)).toBe(true);
  expect(Array.isArray(data.inprogress)).toBe(true);
  expect(Array.isArray(data.done)).toBe(true);
});

/* ── loadFromStorage ── */

test('T-09: loadFromStorage — 저장된 데이터를 올바르게 반환한다', () => {
  const sample = { todo: ['카드A'], inprogress: [], done: ['카드B'] };
  localStorage.setItem('kanban-board', JSON.stringify(sample));
  expect(loadFromStorage()).toEqual(sample);
});

test('T-10: loadFromStorage — localStorage가 비어있을 때 null을 반환한다', () => {
  expect(loadFromStorage()).toBeNull();
});

/* ── 카드 삭제 ── */

test('T-11: 카드 삭제 — × 버튼 클릭 시 카드가 DOM에서 제거된다', () => {
  addCardToColumn('todo', '삭제될 카드');
  const list = document.getElementById('todo-list');
  list.querySelector('.delete-btn').click();
  expect(list.querySelector('.card')).toBeNull();
});

test('T-12: 카드 삭제 — 삭제 후 localStorage가 갱신된다', () => {
  addCardToColumn('todo', '삭제 전 카드');
  saveToStorage();
  document.getElementById('todo-list').querySelector('.delete-btn').click();
  const data = JSON.parse(localStorage.getItem('kanban-board'));
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
  // y=10 은 cardA 중간(25px)보다 위 → cardA 앞에 삽입
  expect(getDragAfterElement(list, 10)).toBe(cardA);
  // y=200 은 모든 카드 아래 → undefined (맨 뒤에 추가)
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
