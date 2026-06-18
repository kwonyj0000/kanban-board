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
    .single();
  if (data) return data.id;

  const { data: newBoard } = await supabaseClient
    .from('boards')
    .insert({ user_id: userId, title: 'Kanban Board' })
    .select('id')
    .single();
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
