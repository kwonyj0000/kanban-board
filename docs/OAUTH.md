# Supabase 인증 연동 가이드
# Kanban Board — Email / Google / GitHub OAuth

---

## 개요

GitHub Pages(정적 사이트)에서 백엔드 없이 Supabase JS SDK(CDN)만으로 인증을 구현한다.

| 인증 방식 | 방법 |
|----------|------|
| 이메일 | 이메일 + 비밀번호 회원가입/로그인 |
| Google | OAuth 2.0 (Google Cloud Console 앱 등록 필요) |
| GitHub | OAuth 2.0 (GitHub OAuth App 등록 필요) |

---

## 전체 절차

| 단계 | 주체 | 내용 |
|------|------|------|
| 1 | 사용자 직접 | Supabase 프로젝트 생성 |
| 2 | 사용자 직접 | Supabase Auth URL 설정 |
| 3 | 사용자 직접 | Google Cloud OAuth 앱 생성 |
| 4 | 사용자 직접 | GitHub OAuth 앱 생성 |
| 5 | 사용자 직접 | Supabase에 OAuth 키 입력 |
| 6 | 코드 작업 | config.js, auth.js, login.html 생성 및 기존 파일 수정 |
| 7 | 사용자 직접 | config.js에 Supabase 키 입력 후 push |

---

## Step 1 — Supabase 프로젝트 생성

1. [https://app.supabase.com](https://app.supabase.com) 접속 → 로그인
2. **New project** 클릭
3. 이름 입력 (예: `kanban-board`), 리전: `Northeast Asia (Seoul)`, DB 비밀번호 설정
4. 프로젝트 생성 완료 후 **Settings > API** 이동
5. 아래 두 값 복사해 두기 (Step 6에서 `config.js`에 입력)

| 항목 | 위치 |
|------|------|
| Project URL | Settings > API > Project URL |
| anon public key | Settings > API > Project API Keys > anon public |

---

## Step 2 — Supabase Auth URL 설정

**Authentication > URL Configuration** 에서 설정:

| 항목 | 값 |
|------|-----|
| Site URL | `https://kwonyj0000.github.io/kanban-board` |
| Redirect URLs | `https://kwonyj0000.github.io/kanban-board/**` |

> OAuth 로그인 완료 후 이 URL로 리다이렉트된다.

**Authentication > Providers** 에서:
- **Email** → Enable (기본값 ON 확인)
- **Google** → Enable 후 Client ID / Secret 입력 (Step 3에서 발급)
- **GitHub** → Enable 후 Client ID / Secret 입력 (Step 4에서 발급)

---

## Step 3 — Google OAuth 앱 생성

1. [https://console.cloud.google.com](https://console.cloud.google.com) 접속
2. 상단에서 프로젝트 선택 또는 새 프로젝트 생성
3. 좌측 메뉴 **APIs & Services > Credentials**
4. **Create Credentials > OAuth 2.0 Client ID** 클릭
5. Application type: **Web application**
6. **Authorized redirect URIs** 에 추가:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
   > `<project-ref>` = Supabase Project URL의 서브도메인  
   > 예: `https://abcdefgh.supabase.co` → `abcdefgh`
7. **Create** 후 **Client ID**, **Client Secret** 복사
8. Supabase **Authentication > Providers > Google** 에 붙여넣기 후 Save

---

## Step 4 — GitHub OAuth 앱 생성

1. GitHub 로그인 → **Settings > Developer settings > OAuth Apps**
2. **New OAuth App** 클릭
3. 아래와 같이 입력:

| 항목 | 값 |
|------|-----|
| Application name | `Kanban Board` |
| Homepage URL | `https://kwonyj0000.github.io/kanban-board/` |
| Authorization callback URL | `https://<project-ref>.supabase.co/auth/v1/callback` |

4. **Register application** 클릭
5. **Client ID** 복사
6. **Generate a new client secret** 클릭 후 **Client Secret** 복사
7. Supabase **Authentication > Providers > GitHub** 에 붙여넣기 후 Save

---

## Step 5 — Magic Link 설정 (추가 설정 없음)

Magic Link는 **Email provider가 활성화되어 있으면 별도 설정 없이 사용 가능**합니다.

| 항목 | 필요 여부 |
|------|----------|
| Email provider Enable | 필수 (Step 2에서 이미 설정) |
| Magic Link 별도 토글 | 없음 (signInWithOtp 호출로 자동 작동) |
| 이메일 템플릿 수정 | 선택 — **Authentication > Email Templates > Magic Link** 에서 한국어로 변경 가능 |
| SMTP 설정 | 테스트엔 불필요 (무료 플랜 시간당 2건 제한), 프로덕션엔 권장 |

> **Magic Link 작동 방식**  
> 1. 사용자가 이메일 입력 후 "링크 전송" 클릭  
> 2. Supabase가 1회용 로그인 링크 이메일 발송  
> 3. 링크 클릭 → `index.html?code=...` 로 리다이렉트  
> 4. Supabase JS 클라이언트가 코드를 자동 교환하여 세션 수립  
> 5. `onAuthStateChange('SIGNED_IN')` 이벤트 → 보드 표시  
> 비밀번호 불필요, 이메일 인증과 로그인이 한 번에 완료됨

---

## Step 6 — 코드 구현

### 생성 파일

| 파일 | 역할 |
|------|------|
| `config.js` | Supabase Project URL · anon key 보관 |
| `auth.js` | Supabase 클라이언트 초기화, 인증 함수 모음 |
| `login.html` | 로그인/회원가입 UI (이메일 폼 + OAuth 버튼) |

### 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `index.html` | config.js·auth.js 로드, 세션 체크, 헤더에 사용자 정보·로그아웃 버튼 추가 |
| `app.js` | `STORAGE_KEY`를 `kanban-board-${userId}`로 변경 (사용자별 데이터 분리) |
| `style.css` | 로그인 페이지 스타일 추가 |
| `.gitignore` | `config.js` 추가 |

### config.js 구조

```js
// Supabase 프로젝트 생성 후 아래 값을 채워넣으세요
const SUPABASE_URL  = 'https://<project-ref>.supabase.co';
const SUPABASE_ANON = '<anon-public-key>';
```

> `anon public key`는 클라이언트에 노출해도 안전하도록 설계된 키입니다.  
> 단, `config.js`는 `.gitignore`에 추가해 실수로 커밋되지 않도록 합니다.  
> 대신 `config.example.js`를 레포에 포함해 사용법을 안내합니다.

### auth.js 주요 함수

```js
// 이메일 + 비밀번호 회원가입
async function signUpWithEmail(email, password)

// 이메일 + 비밀번호 로그인
async function signInWithEmail(email, password)

// 매직링크 발송 (비밀번호 없는 로그인)
async function signInWithMagicLink(email)

// Google OAuth 로그인
async function signInWithGoogle()

// GitHub OAuth 로그인
async function signInWithGitHub()

// 로그아웃
async function signOut()

// 현재 세션 반환
async function getSession()

// 세션 변경 감지 (매직링크/OAuth 콜백 자동 처리에 활용)
function onAuthStateChange(callback)
```

### 인증 흐름

```
[index.html 접속]
    │
    ▼
세션 확인 (getSession)
    ├── 세션 없음 → login.html 이동
    └── 세션 있음 → 보드 표시
            │
            ▼
    헤더: 사용자 이메일 + 로그아웃 버튼
    localStorage 키: kanban-board-{userId}

[login.html]
    ├── 이메일/비밀번호 입력 → 로그인/회원가입
    ├── Google 버튼 → Supabase → Google → callback → index.html
    └── GitHub 버튼 → Supabase → GitHub → callback → index.html
```

---

## Step 7 — config.js 작성 후 push

```bash
# config.js 작성 (Supabase 키 입력)
cp config.example.js config.js
# 에디터로 config.js 열어 URL과 key 입력

# push (config.js는 .gitignore로 제외됨)
git add .
git commit -m "feat: Supabase 인증 연동"
git push
```

---

## 검증 체크리스트

- [ ] `localhost:8080` 접속 시 `login.html`로 리다이렉트
- [ ] 이메일 + 비밀번호 회원가입 → 확인 메일 수신 → 로그인 성공
- [ ] 이메일 + 비밀번호 로그인 → 보드 진입
- [ ] 매직링크 탭 → 이메일 입력 → "이메일을 확인하세요" 화면 전환 → 메일 링크 클릭 → 보드 자동 진입
- [ ] Google 버튼 → OAuth → 보드 진입
- [ ] GitHub 버튼 → OAuth → 보드 진입
- [ ] 로그아웃 → `login.html` 이동
- [ ] 다른 계정으로 로그인 시 카드 데이터 분리 확인
- [ ] GitHub Pages URL에서 동일하게 동작 확인
