/* Supabase Auth — 로드 순서: supabase CDN → config.js → auth.js */

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* OAuth / 매직링크 완료 후 돌아올 기본 URL (현재 파일 위치 기준) */
const REDIRECT_BASE = (() => {
  const url = new URL(window.location.href);
  return url.origin + url.pathname.replace(/\/[^/]*$/, '/');
})();

/* ── 이메일 + 비밀번호 ── */

async function signUpWithEmail(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  return { data, error };
}

async function signInWithEmail(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error };
}

/* ── 매직링크 ── */

async function signInWithMagicLink(email) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_BASE },
  });
  return { data, error };
}

/* ── OAuth ── */

async function signInWithGoogle() {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_BASE },
  });
  return { data, error };
}

async function signInWithGitHub() {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: REDIRECT_BASE },
  });
  return { data, error };
}

/* ── 세션 ── */

async function signOut() {
  return await supabaseClient.auth.signOut();
}

async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange(callback);
}

/* ── Kanban DB ── */

async function getOrCreateDefaultBoard(userId) {
  const { data } = await supabaseClient
    .from('boards')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (data) return data.id;

  const { data: newBoard, error } = await supabaseClient
    .from('boards')
    .insert({ user_id: userId, title: 'Kanban Board' })
    .select('id')
    .single();
  if (error) throw new Error('보드 생성 실패: ' + error.message);
  return newBoard.id;
}

async function saveCardsToSupabase(data) {
  const boardId = window.__boardId;
  await supabaseClient.from('cards').delete().eq('board_id', boardId);
  const rows = [];
  ['todo', 'inprogress', 'done'].forEach(col => {
    (data[col] || []).forEach((text, idx) => {
      rows.push({ board_id: boardId, column_id: col, text, position: idx });
    });
  });
  if (rows.length > 0) {
    await supabaseClient.from('cards').insert(rows);
  }
}

async function loadCardsFromSupabase() {
  const { data, error } = await supabaseClient
    .from('cards')
    .select('column_id, text, position')
    .eq('board_id', window.__boardId)
    .order('position');
  if (error) return null;
  if (!data || data.length === 0) return null;
  const result = { todo: [], inprogress: [], done: [] };
  data.forEach(row => {
    if (result[row.column_id] !== undefined) result[row.column_id].push(row.text);
  });
  return result;
}

/* ── Sharing ── */

async function inviteMember(boardId, email) {
  const { error } = await supabaseClient
    .from('board_members')
    .insert({ board_id: boardId, invited_email: email });
  return { error };
}

async function getPendingInvitations() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return [];
  const { data } = await supabaseClient
    .from('board_members')
    .select('id, board_id')
    .eq('invited_email', user.email)
    .eq('status', 'pending');
  return data || [];
}

async function acceptInvitation(invitationId) {
  const { data, error } = await supabaseClient
    .rpc('accept_board_invitation', { p_invitation_id: invitationId });
  if (error) return { error };
  if (!data) return { error: { message: '초대 수락 실패: 이메일이 일치하지 않거나 이미 수락됨' } };
  return { error: null };
}

async function getBoardMembers(boardId) {
  const { data } = await supabaseClient
    .from('board_members')
    .select('id, invited_email, status')
    .eq('board_id', boardId)
    .order('created_at');
  return data || [];
}

async function removeMember(memberId) {
  const { error } = await supabaseClient
    .from('board_members')
    .delete()
    .eq('id', memberId);
  return { error };
}

async function getAcceptedSharedBoards() {
  const { data } = await supabaseClient
    .from('board_members')
    .select('board_id, boards(id, title)')
    .eq('status', 'accepted')
    .not('user_id', 'is', null);
  return (data || []).map(m => ({
    id: m.board_id,
    title: m.boards?.title || '공유 보드',
  }));
}

function subscribeToBoardCards(boardId, onChangeCallback) {
  return supabaseClient
    .channel(`board:${boardId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cards',
      filter: `board_id=eq.${boardId}`,
    }, onChangeCallback)
    .subscribe();
}
