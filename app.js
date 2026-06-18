let cardIdCounter = 0;

const COLUMNS   = ['todo', 'inprogress', 'done'];
const COL_NAMES = { todo: 'To-do', inprogress: 'In-progress', done: 'Done' };

let dragSourceColumnId = null;

function _log(action) {
  if (typeof logActivity !== 'undefined' && window.__boardId) {
    logActivity(window.__boardId, action).then(_refreshLogIfOpen);
  }
}

function _refreshLogIfOpen() {
  const panel = document.getElementById('activity-log-panel');
  if (panel && !panel.classList.contains('hidden')) renderActivityLog();
}

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
    const cardText = card.querySelector('.card-text')?.textContent || '';
    card.remove();
    updateBadges();
    saveToStorage();
    _log(`카드 삭제: ${cardText}`);
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
      if (save && newText && newText !== original) {
        saveToStorage();
        _log(`카드 수정: ${original} → ${newText}`);
      }
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
  dragSourceColumnId = e.target.closest('.column')?.id || null;
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

    const targetColId = column.id;
    const cardText    = card.querySelector('.card-text')?.textContent || '';
    const list        = column.querySelector('.card-list');
    const afterEl     = getDragAfterElement(list, e.clientY);
    if (afterEl) {
      list.insertBefore(card, afterEl);
    } else {
      list.appendChild(card);
    }

    updateBadges();
    saveToStorage();
    if (dragSourceColumnId && dragSourceColumnId !== targetColId) {
      _log(`카드 이동: ${cardText} (${COL_NAMES[dragSourceColumnId]} → ${COL_NAMES[targetColId]})`);
    }
  });
}

/* ── Touch Drag & Drop ── */

const touch = {
  card: null, ghost: null,
  startX: 0, startY: 0,
  dragging: false,
  sourceColId: null,
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
  touch.sourceColId = e.currentTarget.closest('.column')?.id || null;
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
      const targetColId = col.id;
      const cardText    = touch.card.querySelector('.card-text')?.textContent || '';
      const list        = col.querySelector('.card-list');
      const afterEl     = getDragAfterElement(list, t.clientY);
      if (afterEl) {
        list.insertBefore(touch.card, afterEl);
      } else {
        list.appendChild(touch.card);
      }
      updateBadges();
      saveToStorage();
      if (touch.sourceColId && touch.sourceColId !== targetColId) {
        _log(`카드 이동: ${cardText} (${COL_NAMES[touch.sourceColId]} → ${COL_NAMES[targetColId]})`);
      }
    }
  }

  clearTouchState();
}

/* ── Add Button ── */

function setupAddButton(btn) {
  btn.addEventListener('click', () => {
    const text = prompt('카드 내용을 입력하세요:');
    if (text && text.trim()) {
      const colId = btn.dataset.target;
      addCardToColumn(colId, text.trim());
      updateBadges();
      saveToStorage();
      _log(`카드 추가 (${COL_NAMES[colId]}): ${text.trim()}`);
    }
  });
}

/* ── Render Board ── */

function renderBoard(data) {
  COLUMNS.forEach(colId => {
    document.getElementById(`${colId}-list`).innerHTML = '';
  });
  cardIdCounter = 0;
  COLUMNS.forEach(colId => {
    (data[colId] || []).forEach(text => addCardToColumn(colId, text));
  });
  updateBadges();
}

/* ── Share Modal ── */

async function renderMemberList() {
  const list = document.getElementById('member-list');
  if (!list) return;
  const members = await getBoardMembers(window.__boardId);
  list.innerHTML = '';
  if (members.length === 0) {
    list.innerHTML = '<li class="member-empty">공유된 팀원이 없습니다.</li>';
    return;
  }
  members.forEach(m => {
    const li = document.createElement('li');
    li.className = 'member-item';
    const removeHtml = window.__isOwner
      ? `<button class="remove-member-btn" data-id="${m.id}">삭제</button>` : '';
    li.innerHTML = `
      <span class="member-email">${m.invited_email}</span>
      <span class="member-status ${m.status}">${m.status === 'accepted' ? '수락됨' : '대기중'}</span>
      ${removeHtml}
    `;
    list.appendChild(li);
  });
  list.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.closest('.member-item').querySelector('.member-email').textContent;
      await removeMember(btn.dataset.id);
      await renderMemberList();
      _log(`팀원 제거: ${email}`);
    });
  });
}

function setupShareBtn() {
  const shareBtn = document.getElementById('share-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const modal = document.getElementById('share-modal');
    modal.classList.remove('hidden');
    document.getElementById('invite-msg').textContent = '';
    await renderMemberList();
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('share-modal').classList.add('hidden');
  });

  document.getElementById('share-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      document.getElementById('share-modal').classList.add('hidden');
    }
  });

  document.getElementById('invite-btn').addEventListener('click', async () => {
    const emailInput = document.getElementById('invite-email');
    const email = emailInput.value.trim();
    const msg = document.getElementById('invite-msg');
    if (!email) {
      msg.textContent = '이메일을 입력하세요.';
      msg.className = 'invite-msg error';
      return;
    }
    msg.textContent = '초대 중...';
    msg.className = 'invite-msg';
    const { error } = await inviteMember(window.__boardId, email);
    if (error) {
      msg.textContent = error.code === '23505' ? '이미 초대된 팀원입니다.' : '초대 실패: ' + error.message;
      msg.className = 'invite-msg error';
    } else {
      msg.textContent = `${email}에게 초대를 보냈습니다.`;
      msg.className = 'invite-msg success';
      emailInput.value = '';
      await renderMemberList();
      _log(`팀원 초대: ${email}`);
    }
  });
}

/* ── Activity Log ── */

function formatLogTime(dateStr) {
  const d    = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

async function renderActivityLog() {
  const logList = document.getElementById('activity-log-list');
  if (!logList || !window.__boardId) return;
  logList.innerHTML = '<li class="log-empty">불러오는 중...</li>';
  const logs = await getActivityLogs(window.__boardId);
  if (!logs.length) {
    logList.innerHTML = '<li class="log-empty">아직 활동 내역이 없습니다.</li>';
    return;
  }
  logList.innerHTML = logs.map(log => `
    <li class="log-item">
      <div class="log-action">${log.action}</div>
      <div class="log-meta">
        <span class="log-email">${log.user_email || '알 수 없음'}</span>
        <span class="log-time">${formatLogTime(log.created_at)}</span>
      </div>
    </li>
  `).join('');
}

function setupActivityLog() {
  const btn   = document.getElementById('activity-log-btn');
  const panel = document.getElementById('activity-log-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    const isHidden = panel.classList.toggle('hidden');
    if (!isHidden) renderActivityLog();
  });
  const closeBtn = document.getElementById('close-activity-log');
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
}

/* ── Init ── */

async function init() {
  const source = (await loadFromStorage()) || initialCards;
  renderBoard(source);
  document.querySelectorAll('.column').forEach(setupColumnDrop);
  document.querySelectorAll('.add-btn').forEach(setupAddButton);

  if (typeof subscribeToBoardCards !== 'undefined' && window.__boardId) {
    window.__realtimeChannel = subscribeToBoardCards(window.__boardId, async () => {
      const data = await loadCardsFromSupabase();
      if (data) renderBoard(data);
      _refreshLogIfOpen();
    });
  }

  setupShareBtn();
  setupActivityLog();
}

/* ── Export (테스트) / Auto-init (브라우저) ── */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCard, addCardToColumn, saveToStorage, loadFromStorage,
    updateBadges, getDragAfterElement, init, renderBoard,
    renderMemberList, setupShareBtn,
    renderActivityLog, setupActivityLog, formatLogTime,
  };
} else if (!window.__skipAutoInit) {
  init();
}
