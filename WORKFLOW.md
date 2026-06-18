# WORKFLOW.md
# 작업 이력 — Kanban Board

> 사용자 프롬프트는 원문 그대로, 수행 작업은 요약 기록.

---

## Session 1 — Supabase 인증 연동

**1. "그럼 이제 supabase의 기능을 사용해서 google, github, 이메일 로 회원가입하고 인증할 수 있게 수정하려고 한다. 이를 적용하기위한 절차를 알려줘."**
- Supabase 프로젝트 생성 → Auth URL 설정 → Google/GitHub OAuth 앱 등록 → 코드 구현 순서 안내

**2. "정리해준 계획을 OAUTH.md 파일로 정리해주고, 앞서 작업한 github pages 배포 순서까지 모두 TASKS.md 파일에도 순서 반영해줘. 그리고 github pages에 초기 배포까지는 된상태로 TASKS 작업완료 반영해줘."**
- `docs/OAUTH.md` 생성 (Supabase 인증 연동 가이드)
- `docs/TASKS.md` 생성 (Phase 배포 ✅ 완료 반영, Phase 인증 태스크 추가)

**3. "supabase의 이메일magiclink 인증 기능은 계획에 포함이 안된것 같은데? 이것도 넣어줘"**
- `docs/OAUTH.md`에 Magic Link Step 5 추가
- `docs/TASKS.md` Phase 인증에 Magic Link 항목 반영

**4. "우선 내가 해야하는 작업 먼저 알려줘"**
- 사용자 직접 수행 단계 안내: Supabase 프로젝트 생성, Auth URL 설정, Google/GitHub OAuth 앱 등록

**5. "google이랑 github 에 인증발급은 다른 앱에서쓰는게 있는데 추가발급해야하나?"**
- Google: 기존 앱 재사용 가능 (redirect URI만 추가) / GitHub: 새 앱 권장 (callback URL 1개 제한) 안내

**6. "구글은 재사용하더라도 클라이언트 보안 비밀번호는 추가해야하나보네?"**
- 기존 앱의 Client Secret은 그대로 사용 가능, Supabase에 입력하면 됨 확인

**7. "매직링크 관련 설정은 없어?"**
- Email provider 활성화만으로 작동, 별도 토글 없음. 이메일 템플릿 커스텀·SMTP는 선택사항 안내

**8. "좋아 지금까지 계획을 반영하여 OAUTH인증 및 이메일인증 기능 추가해줘."**
- `config.example.js` 생성, `.gitignore`에 `config.js` 추가
- `auth.js` 생성 (이메일·매직링크·Google·GitHub·로그아웃·세션 함수)
- `login.html` 생성 (비밀번호 탭 + 매직링크 탭 + Google/GitHub OAuth 버튼)
- `index.html` 수정 (세션 체크, 로딩 화면, 헤더 사용자 정보·로그아웃 버튼)
- `app.js` 수정 (`__userId` 기반 사용자별 localStorage 키 분리, `__skipAutoInit` 처리)
- `style.css` 수정 (로그인 페이지 스타일 전체 추가)

**9. "모든 작업을 완료했어. 테스트하는 방법 알려줘."**
- `python3 -m http.server 8080` 실행 후 각 인증 방식별 검증 체크리스트 안내

**10. "회원가입버튼을 눌렀는데 이메일과 비밀번호를 입력하라는 메세지가 나오는데 이러면 안되자나? 수정해줘."**
- 원인: `<button>` 기본값 `type="submit"` 동작
- 수정: 모든 버튼에 `type="button"` 명시, `validatePasswordForm()` 분리 (이메일/비밀번호 각각 검증·빨간 테두리·포커스), 입력 시 에러 자동 해제

**11. "방금 진행중이던 작업을 다시해줘"**
- 회원가입 버튼 버그 수정 재수행 (동일 내용)

---

## Session 2 — Supabase DB 연동

**12. "지금까지 만든 kanban 어플리케이션의 백엔드는 supabase로 구성되어있는게 맞아?"**
- 인증만 Supabase, 카드 데이터는 여전히 localStorage 상태임을 설명

**13. "supabase 를 DB로 사용할거야. 이에대한 작업계획을 알려줘"**
- S-01~S-05 작업계획 수립 (cards 테이블 생성, auth.js DB 함수 추가, app.js async 전환, index.html, app.test.js 수정)
- `docs/TASKS.md` Phase DB 섹션 추가
- `docs/SUPABASE_DB.md` 신규 생성 (상세 가이드)

**14. "내가 해야하는 작업은 뭐가 있어?"**
- S-01: Supabase SQL Editor에서 `cards` 테이블 + RLS 생성 SQL 안내

**15. "실행완료!" (S-01 SQL 실행 완료)**
- `auth.js` — `saveCardsToSupabase()` / `loadCardsFromSupabase()` 추가
- `app.js` — `saveToStorage()` / `loadFromStorage()` / `init()` async 전환
- `index.html` — `showBoard()` async 전환, `await init()` 추가
- `app.test.js` — T-09, T-10 async 전환 (17개 테스트 통과)

**16. "DataBasedesign.md 파일에 cards 테이블 말고도 만들어야할 테이블이 많은데 이것도 다 만들어야하는거지?"**
- cards 테이블만 필요. users(Supabase Auth 대체), boards/columns(하드코딩)는 불필요 설명

**17. "백엔드 및 게시판 데이터 저장도 supabase에 할거야 그에 맞는 작업계획 세워주고 DatabaseDesign.md 여기에 내용도 수정해줘"**
- `docs/DatabaseDesign.md` Supabase 기반으로 전면 재작성 (auth.users + boards + cards 스키마, RLS 포함)
- S-06~S-10 작업계획 수립 (boards 테이블 추가, cards 재생성, getOrCreateDefaultBoard 구현)

**18. "내가 해야하는 쿼리가 모여있는 파일이 어디야?"**
- `docs/DatabaseDesign.md` 섹션 6 (전체 실행 스크립트) 안내

**19. "rls 설정은 안해도되?"**
- 섹션 6 스크립트에 RLS 포함되어 있음 안내

**20. "SQL 실행완료했어! 코드 작업 실행해줘"**
- `auth.js` — `getOrCreateDefaultBoard()` 추가, `saveCardsToSupabase` / `loadCardsFromSupabase` `board_id` 기반으로 수정
- `index.html` — `showBoard()`에 `window.__boardId` 설정 추가
- `app.js` — `__userId` → `__boardId` 조건으로 교체 (17개 테스트 통과)

**21. "user를 관리하는 기능이 아예 없잖아 로그인만 하면 뭐해. 다 같은 kanban을 쓰게 될텐데. 접속가능한 사람을 관리하는 기능이 있어야 할것 같은데?"**
- 사용자마다 독립된 보드(boards 테이블, RLS)로 데이터 격리됨 설명. 접근 제한 기능은 별도 구현 필요

**22. "지금 로컬에서 접속해서 테스트할때는 google로 로그인할때랑 github로 로그인할때 모두 같은 kanban 내용이 나오는데?"**
- 원인 1: 같은 이메일 → Supabase가 계정 자동 연결 (정상 동작)
- 원인 2: `window.__boardId` 미설정 → localStorage fallback (버그)
- 개발자 도구에서 `window.__boardId` 확인 방법 안내

**23. "localstorage 를 사용하지 말고 supabase로 데이터를 관리하도록 수정해줘."**
- `app.js` — `STORAGE_KEY` 제거, `saveToStorage` / `loadFromStorage`에서 localStorage 완전 제거 → Supabase 직접 호출
- `app.test.js` — localStorage mock 제거, `saveCardsToSupabase` / `loadCardsFromSupabase` jest.fn() mock으로 교체 (17개 테스트 통과)

**24. "수정사항 반영하려면 재기동해야하나요?"**
- 정적 파일이므로 재기동 불필요. 브라우저 새로고침(F5)만으로 반영됨 안내

**25. "지금까지 내가 전달한 프롬프트와 그에 상응해서 네가 한 작업을 정리해서 WORKFLOW.md로 저장해줘. 프롬프트는 그대로 써야하고 작업은 요약해서 작성해주면 돼. 이 내용을 CLAUDE.md에 반영해서 앞으로는 작업시 항상 WORKFLOW.md를 갱신하게 해줘."**
- `WORKFLOW.md` 생성 (전체 작업 이력 정리)
- `CLAUDE.md` 갱신 규칙 추가

---

## Session 3 — 보드 공유 기능 (Phase 3)

**26. "이제 만들어진 kanban 보드를 팀원과 공유할수 있는 기능을 추가하려고해. 그 계획을 알려줘."**
- 이메일 초대 방식 / 편집자 단일 권한 / Supabase Realtime 실시간 동기화 방향 확정
- `docs/TASKS.md` Phase 3를 17개 태스크(P3-00A ~ P3-17)로 상세화
- `docs/DatabaseDesign.md` ERD·스키마에 `board_members` 테이블 및 Phase 3 RLS SQL 추가

**27. "Phase 3 추가 SQL 섹션의 쿼리를 수행하였습니다. 이후 작업 실행해주세요."**
- `auth.js` — 공유 함수 6개 추가: `inviteMember`, `getPendingInvitations`, `acceptInvitation`, `getBoardMembers`, `removeMember`, `subscribeToBoardCards`
- `app.js` — `renderBoard()` 추출, `renderMemberList()` / `setupShareBtn()` 추가, `init()`에 Realtime 구독 연결
- `index.html` — 초대 알림 배너, Share 버튼(헤더), 공유 모달(초대 폼 + 멤버 목록) 추가; `showBoard()`에 `__isOwner` 판별·배너 체크 추가
- `style.css` — 초대 배너, Share 버튼, 모달, 멤버 목록 CSS 추가
- `app.test.js` — 공유 함수 mock 6개 추가, T-18~T-24 신규 테스트 추가 (24개 전체 통과)

**28. "Failed to load resource: 500 / Cannot read properties of null (reading 'id')"**
- 원인: `boards` RLS가 `board_members`를 조회하고 `board_members` RLS가 다시 `boards`를 조회하는 순환 참조 → PostgreSQL 500 에러
- 수정 SQL ①: `SECURITY DEFINER` 함수 `is_board_member_accepted()` 생성 (순환 차단)
- 수정 SQL ②: `boards_member_select` 정책을 함수 기반으로 교체
- 수정 SQL ③: `cards_access` 정책도 함수 기반으로 단순화
- `auth.js` — `getOrCreateDefaultBoard()`에서 `.single()` → `.maybeSingle()` 교체 (행 없을 때 null 반환, 에러 핸들링 추가)
- `docs/DatabaseDesign.md` — Phase 3 SQL을 3단계 분리 실행 방식 + 함수 설명으로 갱신

**29. "SQL 실행 완료했어. 이후 작업 계속해줘."**
- 24개 전체 테스트 통과 재확인
- `docs/DatabaseDesign.md` 업데이트 완료
- `WORKFLOW.md` 갱신

**30. "수락 버튼 클릭시 403 Forbidden 오류 발생"**
- 원인 1: `user_accept_own_invitation` 정책에 `WITH CHECK` 미지정 → status가 'accepted'로 바뀐 행이 자기 조건 위반
- 원인 2: `auth.users` 직접 조회 불안정, `auth.jwt()->>'email'` 비교 실패
- 해결: `accept_board_invitation(p_invitation_id)` SECURITY DEFINER 함수 생성 (함수 내부에서 email·status 검증 후 UPDATE)
- `auth.js` — `acceptInvitation()`을 `.rpc('accept_board_invitation')` 방식으로 교체

**31. "RLS를 사용해야 보안에 안전한 거 아니야?" / "현재 방식 유지할게"**
- SECURITY DEFINER 함수 방식도 동일한 보안 수준 (email 일치·pending 상태 검증 내부 수행)
- 순환참조 문제로 RLS 정책 단독 적용이 불안정 → 현재 방식 유지 결정

**32. "내가 해야하는 것 알려줘" / "드디어 성공!"**
- Supabase SQL Editor에서 `accept_board_invitation()` 함수 실행 → 수락 버튼 정상 동작 확인

**33. "일단 현재까지 수정한 사항에 대해서 수정이 필요한 md파일에 업데이트 해주고 각 repo에 commit & push 해줘."**
- `docs/DatabaseDesign.md` — `accept_board_invitation()` SECURITY DEFINER 함수 코드 및 3.4 보안 함수 섹션 추가
- `kosa-vibecoding-2026-3rd` 레포: kanban Phase 3 변경사항 commit & push
- `kwonyj0000/kanban-board` 레포: 동기화 후 commit & push

**34. "보드 전환 기능 구현해줘"**
- `auth.js` — `getAcceptedSharedBoards()` 추가 (수락된 공유 보드 목록 조회)
- `index.html` — 헤더에 `<select id="board-switcher">` 추가; `setupBoardSwitcher()` 함수 구현 (공유 보드 셀렉터, 전환 시 Realtime 재구독); `showBoard()`에 `window.__ownBoardId` 추가, `setupBoardSwitcher()` 호출; 초대 수락 후 셀렉터 자동 갱신
- `style.css` — `.board-switcher` / `.board-switcher option` 스타일 추가 (헤더 반투명 배경)

**37. "kanban boadr의 활동 로그를 기록하는 기능을 남겨줘."**
- `auth.js` — `logActivity(boardId, action)` / `getActivityLogs(boardId, limit)` 추가 (Supabase `activity_logs` 테이블)
- `app.js` — `COL_NAMES`, `dragSourceColumnId` 추가; 카드 추가/삭제/이동(드래그·터치)/편집, 팀원 초대/제거 시 `_log()` 호출; `renderActivityLog()` / `formatLogTime()` / `setupActivityLog()` 추가; `init()`에 연결; Realtime 콜백에서 패널 자동 갱신
- `index.html` — 헤더 "로그" 버튼 추가; 오른쪽 슬라이딩 패널(`#activity-log-panel`) 추가; 보드 제목 변경·초대 수락 시 `logActivity` 호출
- `style.css` — `.activity-log-btn`, `.activity-log-panel` 및 로그 항목 스타일 추가
- `app.test.js` — `logActivity`/`getActivityLogs` mock 추가, T-25~T-27 신규 테스트 (27개 전체 통과)
- **사용자 실행 필요 SQL**: `activity_logs` 테이블 + RLS 2개 정책

**36. "보드 전환 기능관련해서 내 보드랑 공유보드가 나오기는하는데, 내가 공유한 보드는 안나와야하는게 맞는것 같아. 이것 수정해줘."**
- 원인: `board_owner_manage_members` RLS 정책이 소유자에게 자기 보드의 모든 `board_members` 행을 노출 → `getAcceptedSharedBoards()`가 소유자 보드도 "공유 보드"로 포함
- 수정: `.not('user_id', 'is', null)` → `.eq('user_id', user.id)` 로 교체 — 현재 로그인 사용자가 멤버인 행만 반환

**35. "kanban 보드 title 수정하는 기능 추가해줘."**
- `auth.js` — `getBoardTitle(boardId)` / `updateBoardTitle(boardId, title)` 추가 (boards 테이블 조회·업데이트)
- `index.html` — `<h1>`에 `id="board-title"` 추가; `setupBoardTitle()` 구현 (소유자: 클릭 시 인라인 input 편집 → Enter/blur 저장, Escape 취소; 멤버: 읽기 전용); 보드 전환·초대 수락 후 제목 자동 갱신; 저장 성공 시 board-switcher 옵션 텍스트도 동기화
- `style.css` — `#board-title.editable` hover 하이라이트, `.title-edit-input` 인라인 편집 스타일
