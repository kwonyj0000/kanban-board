# Design System
# Kanban Board

---

## 1. 색상 (Colors)

### 컬럼 헤더 색상
| 컬럼 | 색상 | Hex |
|------|------|-----|
| To-do | 파랑 | `#3498db` |
| In-progress | 주황 | `#e67e22` |
| Done | 초록 | `#27ae60` |

### 배경 / 표면
| 용도 | Hex |
|------|-----|
| 페이지 배경 | `#f0f2f5` |
| 컬럼 배경 | `#ebecf0` |
| 카드 배경 | `#ffffff` |
| 헤더 바 | `#2c3e50` |

### 상태 색상
| 상태 | Hex | 용도 |
|------|-----|------|
| 드롭 하이라이트 | `#4a90d9` | 드래그 중 컬럼 테두리 |
| 드롭 배경 | `#dce8f5` | 드래그 중 컬럼 배경 |
| 삭제 버튼 hover | `#e74c3c` | × 버튼 활성 색상 |
| 삭제 버튼 hover 배경 | `#fdecea` | × 버튼 활성 배경 |

### 텍스트
| 용도 | Hex |
|------|-----|
| 카드 본문 | `#333333` |
| 삭제 버튼 기본 | `#aaaaaa` |
| 헤더 타이틀 | `#ffffff` |

---

## 2. 타이포그래피 (Typography)

| 요소 | Font | Size | Weight |
|------|------|------|--------|
| 페이지 제목 (h1) | Segoe UI, sans-serif | `1.5rem` | 600 |
| 컬럼 제목 (h2) | Segoe UI, sans-serif | `1rem` | 700 |
| 카드 본문 | Segoe UI, sans-serif | `0.9rem` | 400 |

- Line-height (카드): `1.4`
- Letter-spacing (h1): `0.5px`
- Letter-spacing (h2): `0.3px`
- word-break: `break-word` (카드 텍스트 줄바꿈)

---

## 3. 간격 (Spacing)

| 용도 | 값 |
|------|-----|
| 보드 패딩 | `24px` |
| 컬럼 간격 (gap) | `20px` |
| 컬럼 헤더 패딩 | `14px 16px` |
| 카드 리스트 패딩 | `10px` |
| 카드 패딩 | `12px 14px` |
| 카드 간격 (margin-bottom) | `8px` |
| 카드 내부 gap (텍스트 ↔ 버튼) | `8px` |

---

## 4. 컴포넌트 (Components)

### 4.1 컬럼 (`.column`)
```
border-radius : 10px
box-shadow    : 0 2px 6px rgba(0,0,0,0.1)
min-width     : 280px
```
**상태 — `.drag-over`**
```
box-shadow    : 0 0 0 2px #4a90d9, 0 4px 12px rgba(74,144,217,0.3)
background    : #dce8f5
```

### 4.2 카드 (`.card`)
```
border-radius : 6px
box-shadow    : 0 1px 3px rgba(0,0,0,0.12)
cursor        : grab
display       : flex  (텍스트 + 삭제 버튼 배치)
```
**상태 — hover**
```
box-shadow    : 0 3px 8px rgba(0,0,0,0.18)
transform     : translateY(-1px)
```
**상태 — `.dragging`**
```
opacity       : 0.4
transform     : rotate(2deg) scale(1.02)
box-shadow    : 0 8px 20px rgba(0,0,0,0.2)
```

### 4.3 추가 버튼 (`.add-btn`)
```
width         : 28px
height        : 28px
border-radius : 50%
background    : rgba(255,255,255,0.3)
color         : white
font-size     : 1.3rem
```
**hover**
```
background    : rgba(255,255,255,0.5)
```

### 4.4 삭제 버튼 (`.delete-btn`)
```
visibility    : hidden  (카드 hover 시 visible로 전환)
color         : #aaaaaa
font-size     : 1.1rem
border-radius : 3px
```
**hover**
```
color         : #e74c3c
background    : #fdecea
```

---

## 5. 반응형 브레이크포인트 (Breakpoints)

| 구간 | 조건 | 주요 변경 |
|------|------|---------|
| 모바일 | `max-width: 767px` | 컬럼 세로 쌓기, 패딩 16px, 삭제 버튼 항상 표시 |
| 태블릿 | `768px ~ 1023px` | 패딩/간격 16px, 컬럼 min-width 220px |
| 데스크탑 | `≥ 1024px` | 기본 스타일 유지 |
| 터치 기기 | `(hover: none)` | `.delete-btn` visibility: visible 강제 |

### 터치 고스트 (`.touch-ghost`)
```
position      : fixed
pointer-events: none
z-index       : 1000
opacity       : 0.75
border-radius : 6px
background    : #ffffff
box-shadow    : 0 8px 20px rgba(0,0,0,0.2)
transform     : rotate(2deg) scale(1.02)
padding       : 12px 14px
```

---

## 6. 트랜지션 (Transitions)

| 대상 | 속성 | 시간 |
|------|------|------|
| 카드 | box-shadow, transform, opacity | `0.15s ~ 0.2s` |
| 컬럼 | box-shadow | `0.2s` |
| 추가 버튼 | background-color | `0.2s` |
| 삭제 버튼 | color, background-color | `0.15s` |
