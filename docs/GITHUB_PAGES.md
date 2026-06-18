# GitHub Pages 배포 가이드
# Kanban Board

---

## 1. 개요

순수 HTML/CSS/JS로 구성된 칸반보드를 GitHub Pages로 배포하는 방법을 정리한다.  
빌드 도구가 없으므로 GitHub Actions 없이 branch에서 직접 배포한다.

- **배포 레포**: `git@github.com:kwonyj0000/kanban-board.git`
- **배포 URL**: `https://kwonyj0000.github.io/kanban-board/`

---

## 2. 새 레포 생성

기존 공유 레포(`weable-kosa/kosa-vibecoding-2026-3rd`)와 별도로 칸반보드 전용 레포를 생성한다.

1. GitHub 접속 → 우측 상단 `+` → **New repository**
2. Repository name: `kanban-board`
3. Public 선택
4. **README 초기화 없이** 빈 레포로 생성 (Create repository)
5. SSH 주소 확인: `git@github.com:kwonyj0000/kanban-board.git`

---

## 3. 칸반 코드 push

기존 공유 레포의 `kanban/` 서브디렉토리만 새 레포로 분리하여 push한다.

```bash
# 1. kanban 폴더를 임시 디렉토리에 복사 (node_modules 제외)
rsync -av --exclude='node_modules' \
  ./src/exercise/kwonyj0000/day03/kanban/ \
  /tmp/kanban-deploy/

# 2. 임시 디렉토리에서 git 초기화
cd /tmp/kanban-deploy
git init
git add .
git commit -m "feat: 칸반보드 초기 구현"

# 3. main 브랜치로 설정 후 원격 등록
git branch -M main
git remote add origin git@github.com:kwonyj0000/kanban-board.git

# 4. push
git push -u origin main
```

### .gitignore 내용

push 전 `.gitignore` 파일을 생성하여 `node_modules`를 제외한다.

```
node_modules/
```

### push된 파일 목록

```
kanban-board/
├── .gitignore
├── CLAUDE.md
├── index.html
├── style.css
├── app.js
├── app.test.js
├── package.json
├── package-lock.json
├── plan.md
└── docs/
    ├── PRD.md
    ├── TRD.md
    ├── UserFlow.md
    ├── DatabaseDesign.md
    ├── DesignSystem.md
    └── TASKS.md
```

---

## 4. GitHub Pages 활성화 (GitHub 사이트에서 직접)

1. `https://github.com/kwonyj0000/kanban-board` 접속
2. 상단 **Settings** 탭 클릭
3. 좌측 메뉴 **Pages** 클릭
4. **Source** 항목에서 아래와 같이 설정:
   - Branch: `main`
   - 폴더: `/ (root)`
5. **Save** 클릭
6. 1~2분 후 상단에 배포 URL 표시됨

```
https://kwonyj0000.github.io/kanban-board/
```

> 빌드 과정이 없는 정적 파일(HTML/CSS/JS)이므로 GitHub Actions 워크플로우 없이 branch에서 직접 배포한다.

---

## 5. 이후 코드 변경 시 배포 방법

새 레포(`kanban-board`)에서 작업하고 push하면 자동으로 Pages에 반영된다.

```bash
# /tmp/kanban-deploy 에서 작업하거나
# 새로 clone 후 작업
git clone git@github.com:kwonyj0000/kanban-board.git
cd kanban-board

# 코드 수정 후
git add .
git commit -m "수정 내용"
git push
```

push 후 약 30초~1분 내에 GitHub Pages에 자동 반영된다.

---

## 6. 현재 배포 상태

| 항목 | 내용 |
|------|------|
| 레포 | `kwonyj0000/kanban-board` |
| 브랜치 | `main` |
| 배포 URL | `https://kwonyj0000.github.io/kanban-board/` |
| Pages 활성화 | GitHub Settings > Pages에서 직접 설정 필요 |
| 빌드 도구 | 없음 (순수 정적 파일) |
