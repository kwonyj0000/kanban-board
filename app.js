let cardIdCounter = 0;

const COLUMNS = ['todo', 'inprogress', 'done'];

const initialCards = {
  todo:       ['디자인 시안 검토', '요구사항 분석', 'API 명세 작성'],
  inprogress: ['로그인 기능 개발'],
  done:       ['프로젝트 초기 설정'],
};

/* ── Storage ── */

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
  await saveCardsToSupabase(data);
}

async function loadFromStorage() {
  return await loadCardsFromSupabase();
}

/* ── Badges ── */

function updateBadges() {
  COLUMNS.forEach(columnId => {
    const count = document.getElementById(`${columnId}-list`).querySelectorAll('.card').length;
    const badge = document.getElementById(`${columnId}-badge`);
    if (badge) badge.textContent = count;
  });
}

/* ── Card Reorder Helper ── */

function getDragAfterElement(list, y) {
  const cards = [...list.querySelectorAll('.card:not(.dragging)')];
  return cards.reduce((closest, card) => {
    const box    = card.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: card };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ── Drop Indicator ── */

function showDropIndicator(list, afterEl) {
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  if (afterEl) {
    list.insertBefore(indicator, afterEl);
  } else {
    list.appendChild(indicator);
  }
}

/* ── Card ── */

function createCard(text) {
  const card = document.createElement('div');
  card.className = 'card';
  card.draggable = true;
  card.id = `card-${++cardIdCounter}`;

  const textSpan = document.createElement('span');
  textSpan.className = 'card-text';
  textSpan.textContent = text;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '카드 삭제';
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    card.remove();
    updateBadges();
    saveToStorage();
  });

  card.appendChild(textSpan);
  card.appendChild(deleteBtn);

  /* 더블클릭 인라인 편집 */
  card.addEventListener('dblclick', e => {
    const span = e.target.closest('.card-text');
    if (!span) return;

    const original = span.textContent;
    let committed = false;

    const textarea = document.createElement('textarea');
    textarea.className = 'card-edit-input';
    textarea.value = original;

    span.replaceWith(textarea);
    card.draggable = false;
    textarea.focus();

    const commit = (save) => {
      if (committed) return;
      committed = true;
      const newText = textarea.value.trim();
      const newSpan = document.createElement('span');
      newSpan.className = 'card-text';
      newSpan.textContent = save && newText ? newText : original;
      textarea.replaceWith(newSpan);
      card.draggable = true;
      if (save && newText && newText !== original) saveToStorage();
    };

    textarea.addEventListener('blur', () => commit(true));
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(true); }
      if (e.key === 'Escape') commit(false);
    });
  });

  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragend', onDragEnd);
  card.addEventListener('touchstart', onTouchStart, { passive: true });
  card.addEventListener('touchmove', onTouchMove, { passive: false });
  card.addEventListener('touchend', onTouchEnd);

  return card;
}

function addCardToColumn(columnId, text) {
  if (!text || !text.trim()) return;
  const list = document.getElementById(`${columnId}-list`);
  const card = createCard(text);
  list.appendChild(card);
}

/* ── Mouse Drag & Drop ── */

function onDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.id);
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function onDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

function setupColumnDrop(column) {
  column.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    column.classList.add('drag-over');

    const list    = column.querySelector('.card-list');
    const afterEl = getDragAfterElement(list, e.clientY);
    showDropIndicator(list, afterEl);
  });

  column.addEventListener('dragleave', e => {
    if (!column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    }
  });

  column.addEventListener('drop', e => {
    e.preventDefault();
    column.classList.remove('drag-over');
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    const cardId = e.dataTransfer.getData('text/plain');
    const card   = document.getElementById(cardId);
    if (!card) return;

    const list    = column.querySelector('.card-list');
    const afterEl = getDragAfterElement(list, e.clientY);
    if (afterEl) {
      list.insertBefore(card, afterEl);
    } else {
      list.appendChild(card);
    }

    updateBadges();
    saveToStorage();
  });
}

/* ── Touch Drag & Drop ── */

const touch = {
  card: null, ghost: null,
  startX: 0, startY: 0,
  dragging: false,
};

const DRAG_THRESHOLD = 8;

function clearTouchState() {
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  if (touch.ghost) { touch.ghost.remove(); touch.ghost = null; }
  if (touch.card)  touch.card.classList.remove('dragging');
  document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
  touch.card = null;
  touch.dragging = false;
}

function getColumnAtPoint(x, y) {
  if (touch.ghost) touch.ghost.style.display = 'none';
  const el = document.elementFromPoint(x, y);
  if (touch.ghost) touch.ghost.style.display = '';
  return el ? el.closest('.column') : null;
}

function onTouchStart(e) {
  const t     = e.touches[0];
  touch.card  = e.currentTarget;
  touch.startX = t.clientX;
  touch.startY = t.clientY;
  touch.dragging = false;
}

function onTouchMove(e) {
  if (!touch.card) return;
  const t  = e.touches[0];
  const dx = t.clientX - touch.startX;
  const dy = t.clientY - touch.startY;

  if (!touch.dragging) {
    if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
    touch.dragging = true;

    const rect  = touch.card.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'touch-ghost';
    ghost.textContent = touch.card.querySelector('.card-text').textContent;
    ghost.style.width = `${rect.width}px`;
    ghost.style.left  = `${rect.left}px`;
    ghost.style.top   = `${rect.top}px`;
    document.body.appendChild(ghost);
    touch.ghost = ghost;
    touch.card.classList.add('dragging');
  }

  e.preventDefault();

  const t2 = e.touches[0];
  touch.ghost.style.left = `${t2.clientX - touch.ghost.offsetWidth / 2}px`;
  touch.ghost.style.top  = `${t2.clientY - 30}px`;

  document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
  const col = getColumnAtPoint(t2.clientX, t2.clientY);
  if (col) {
    col.classList.add('drag-over');
    const list    = col.querySelector('.card-list');
    const afterEl = getDragAfterElement(list, t2.clientY);
    showDropIndicator(list, afterEl);
  } else {
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  }
}

function onTouchEnd(e) {
  if (!touch.card) return;

  if (touch.dragging) {
    const t   = e.changedTouches[0];
    const col = getColumnAtPoint(t.clientX, t.clientY);
    if (col) {
      const list    = col.querySelector('.card-list');
      const afterEl = getDragAfterElement(list, t.clientY);
      if (afterEl) {
        list.insertBefore(touch.card, afterEl);
      } else {
        list.appendChild(touch.card);
      }
      updateBadges();
      saveToStorage();
    }
  }

  clearTouchState();
}

/* ── Add Button ── */

function setupAddButton(btn) {
  btn.addEventListener('click', () => {
    const text = prompt('카드 내용을 입력하세요:');
    if (text && text.trim()) {
      addCardToColumn(btn.dataset.target, text.trim());
      updateBadges();
      saveToStorage();
    }
  });
}

/* ── Init ── */

async function init() {
  const source = (await loadFromStorage()) || initialCards;
  COLUMNS.forEach(columnId => {
    (source[columnId] || []).forEach(text => addCardToColumn(columnId, text));
  });
  document.querySelectorAll('.column').forEach(setupColumnDrop);
  document.querySelectorAll('.add-btn').forEach(setupAddButton);
  updateBadges();
}

/* ── Export (테스트) / Auto-init (브라우저) ── */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCard, addCardToColumn, saveToStorage, loadFromStorage,
    updateBadges, getDragAfterElement, init,
  };
} else if (!window.__skipAutoInit) {
  init();
}
