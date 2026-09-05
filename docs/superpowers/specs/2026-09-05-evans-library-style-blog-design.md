# Evans Library 계열 개인 기술 블로그 — 설계

- 작성일: 2026-09-05
- 저장소: 새로 만드는 `pronaeae/pronaeae.github.io`
- 상태: 설계 확정
- 대체: `2026-09-05-velog-style-blog-design.md` (velog 스타일 안은 폐기)

## 1. 목적과 범위

네트워크 강의 학습 노트를 중심으로 개발 경험 글까지 쌓는 정적 기술 블로그를 만든다.
화면은 `evan-moon.github.io`(Evans Library)를 기준으로 삼는다.

### 성공 기준

1. 마크다운을 `src/content/posts/` 에 넣고 `main` 에 push 하면 별도 조작 없이 배포된다.
2. 프론트매터가 잘못되면 배포가 아니라 빌드에서 실패한다.
3. 첫 화면이 Evans Library 와 같은 인상을 준다 — 종이색 바탕, 세리프 제목, 테두리 없는 가로형 글 목록.
4. 히어로에 깃헙 프로필 사진 · 닉네임 · 이메일이 있다.
5. 라이트/다크 전환이 새로고침 후에도 유지되고, 전환 시 흰 화면이 번쩍이지 않는다.

### 만들지 않는 것 (사용자 확정)

- **Books 섹션** — 쓴 책이 없다
- **Steady Sellers 섹션** — 조회수를 정적으로 알 수 없고, 순위를 손으로 관리할 생각이 없다
- **시리즈** — 목록·상세·진행 박스 전부
- **태그 페이지** — 카테고리는 카드에 표시만 하고 링크하지 않는다
- **히어로 격자 배경** — 원본에는 모눈종이 배경이 있으나 쓰지 않는다
- 좋아요·조회수·검색·다국어·브라우저 에디터

홈에는 Recent Posts 섹션 하나만 둔다.

## 2. 기술 선택

이미 초기화된 프로젝트를 그대로 쓴다. 아래는 확정된 스택이며 이번 설계에서 바꾸지 않는다.

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 프레임워크 | Astro 7.3.1 | 마크다운이 1급 시민. Content Collections 로 프론트매터를 zod 검증. 기본 출력 JS 0바이트 |
| 패키지 매니저 | pnpm | 기존 프로젝트와 동일 |
| 호스팅 | GitHub Pages | 저장소 이름이 `pronaeae.github.io` 라 루트 주소를 쓰므로 `base` 설정이 필요 없다 |
| 배포 | GitHub Actions | Pages Source 를 "GitHub Actions" 로 두고 워크플로에서 빌드·업로드 |
| 댓글 | giscus | 정적 사이트에서 동작하고 무료. 테마 연동 가능 |
| 하이라이팅 | Shiki (Astro 내장) | 빌드 타임 처리라 런타임 JS 없음 |

### 버전 제약

- **Node 22.12.0 이상.** Astro 7 은 그 아래에서 경고가 아니라 즉시 종료한다. `.nvmrc` 에 기록돼 있다.
- **`typescript` 는 6.x 고정.** `@astrojs/check@0.9.10` 이 쓰는 프로그래매틱 API 를 TypeScript 7 이 제공하지 않아 `astro check` 가 진단 전에 죽고, `build` 가 `astro check && …` 이므로 CI 전체가 실패한다.
- **Astro 7 컴파일러는 닫지 않은 태그를 에러로 본다.** 모든 `.astro` 태그를 닫는다.
- **`compressHTML` 기본값이 `'jsx'`** 라 인라인 요소 사이 공백이 사라진다. 공백이 필요하면 `{" "}` 를 명시한다. 이 설계의 화면은 공백에 의존하지 않는다.
- remark/rehype 플러그인은 쓰지 않는다. 제목 id 자동 생성, Shiki, `render()` 의 `headings` 는 모두 기본 제공이다.

## 3. 디자인 토큰

실제 사이트의 MUI 팔레트에서 뽑은 값이다. `:root` 에 라이트를 정의하고 `[data-theme="dark"]` 에서 같은 변수만 덮어쓴다.

| 역할 | 변수 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 배경 | `--bg` | `#FAF9F5` | `#111111` |
| 본문 글자 | `--text` | `#2C2B28` | `#E8E6E1` |
| 보조 글자 (날짜·카테고리·이메일) | `--text-sub` | `#6B6760` | `#9E9A93` |
| 요약문 | `--text-body` | `#616161` | `#B5B1AA` |
| 구분선 | `--border` | `rgba(0,0,0,.12)` | `rgba(255,255,255,.15)` |
| hover 배경 | `--hover` | `rgba(0,0,0,.03)` | `rgba(255,255,255,.04)` |

**강조색을 두지 않는다.** 링크는 색이 아니라 밑줄과 굵기로 구분한다. 이것이 이 디자인의 성격이며, 민트·파랑 같은 강조색을 넣는 순간 인상이 무너진다.

### 타이포그래피

| 용도 | 스택 |
| --- | --- |
| 제목 (닉네임·글 제목·섹션 제목) | `"Cormorant Garamond", "Noto Serif KR", serif` |
| 메타 (카테고리·요약·날짜·이메일) | `Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| 코드 | `Consolas, Menlo, monospace` |

세리프와 산세리프의 대비가 이 디자인 인상의 핵심이다. 한쪽으로 통일하면 안 된다.

`Cormorant Garamond` 와 `Noto Serif KR` 은 Google Fonts, `Pretendard` 는 jsDelivr 의 `pretendard/dist/web/variable` 에서 받는다. 셋 다 `<link rel="preconnect">` 를 걸고 `display=swap` 으로 로드한다.

간격 단위는 8px, 본문 컨테이너 최대 폭 1200px, 글 상세 본문은 720px.

## 4. 화면

### 헤더 (모든 페이지)

왼쪽에 사이트 이름, 오른쪽에 `Home` · `Posts` · `About` 과 테마 토글. 아래에 1px 구분선.
현재 페이지에 해당하는 항목은 굵게 표시한다.

### 홈 (`/`)

1. **히어로** — 가운데 정렬. 96px 원형 아바타 → 닉네임(세리프, `clamp(2.43rem, 4.2vw, 2.95rem)`, 600, letter-spacing `-0.012em`) → 이메일(Pretendard 0.92rem, `--text-sub`, `mailto:` 링크) → 64px 폭 하이라인(`--text-sub`, opacity 0.2). 배경 장식은 두지 않는다.
2. **Recent Posts** — 섹션 제목(세리프 700)과 오른쪽 `View all →`. 최신 10개를 카드로 나열한다.

### 글 카드

테두리와 그림자가 없다. 카드 사이를 1px 구분선으로만 나눈다.

```
프로그래밍 / 네트워크                      ┌──────────┐
TCP 3-way handshake, 왜 두 번으로는 안 되나    │  thumb   │
연결을 맺는다는 말이 실제로 무엇을 합의하는 것인지  │          │
Sep 03, 2026                              └──────────┘
```

- 카테고리: Pretendard 0.857rem, `--text-sub`, 배열을 `/` 로 연결. 링크가 아니다
- 제목: 세리프 700, `clamp(1.42rem, 2vw, 1.5rem)`, letter-spacing `-0.016em`
- 요약: Pretendard, `--text-body`, `-webkit-line-clamp: 3`
- 날짜: Pretendard 0.92rem, `--text-sub`, `Sep 03, 2026` 형식
- 썸네일: 900px 이상에서 오른쪽 176px 고정 폭(`padding-bottom: 68%`), 미만에서는 텍스트 위로 올라가 가로 전체(`padding-bottom: 54%`)
- 썸네일이 없으면 오른쪽 칸을 렌더하지 않고 텍스트가 전체 폭을 쓴다
- 카드 전체가 링크이고 hover 시 `--hover` 배경

### 글 목록 (`/posts`, `/posts/[page]`)

히어로 없이 같은 카드를 전체 글에 대해 10개씩. 아래에 이전/다음 페이지.

### 글 상세 (`/posts/[slug]`)

1. 제목(세리프, `clamp(2rem, 3.2vw, 2.6rem)`, 700)
2. `프로그래밍 / 네트워크 · Sep 03, 2026`
3. 본문 720px. 오른쪽에 목차 176px — `IntersectionObserver` 로 현재 위치를 굵게. 900px 미만에서는 숨긴다
4. 이전/다음 글
5. giscus

### 소개 (`/about`)

마크다운 한 장. 자기소개 · 기술 스택 · 프로젝트.

### 테마 전환

`BaseLayout` 의 `<head>` 최상단에 인라인 스크립트를 넣어, 페이지가 그려지기 전에 `localStorage.theme` 또는 `prefers-color-scheme` 을 읽어 `<html data-theme>` 를 설정한다. 이 스크립트가 `<body>` 뒤에 있으면 다크모드 사용자에게 흰 화면이 한 번 번쩍이므로 위치가 중요하다.

giscus 도 전환 시 `postMessage` 로 `setConfig` 를 보내 같이 바꾼다.

## 5. 콘텐츠 모델

```ts
const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string().max(120),
    description: z.string().max(300),
    date: z.coerce.date(),
    category: z.array(z.string()).min(1).max(3),
    thumbnail: image().optional(),
    draft: z.boolean().default(false),
  }),
});
```

`category` 는 큰 갈래에서 작은 갈래 순서로 쓴다: `[프로그래밍, 네트워크, 웹]` → `프로그래밍 / 네트워크 / 웹`.

### slug 규칙

디렉터리 `2026-09-03-tcp-3-way-handshake` 에서 날짜 접두사를 뗀 `tcp-3-way-handshake` 를 slug 로 쓴다.
날짜 접두사는 파일 탐색기 정렬용이고 URL 에는 노출하지 않는다.

### draft

`draft: true` 는 `import.meta.env.PROD` 일 때 목록·상세·RSS·sitemap 모두에서 제외한다. `pnpm dev` 에서는 보인다.

## 6. 라우팅

| 경로 | 화면 |
| --- | --- |
| `/` | 히어로 + Recent Posts 10개 |
| `/posts` | 전체 글 1페이지 |
| `/posts/[page]` | `/posts/2` … |
| `/posts/[slug]` | 글 상세 |
| `/about` | 소개 |
| `/rss.xml` | RSS |
| `/sitemap-index.xml` | `@astrojs/sitemap` |
| `/404` | 404 |

`/posts/[page]` 와 `/posts/[slug]` 가 같은 자리를 놓고 겹친다. `[page]` 를 `getStaticPaths` 에서 숫자만 생성하고 slug 에 숫자를 쓰지 않는 것으로 충돌을 피한다. 이를 위해 **slug 는 숫자로만 이루어질 수 없다**는 제약을 콘텐츠 로딩 단계에서 검사해 빌드를 실패시킨다.

## 7. 코드 구조

| 파일 | 책임 |
| --- | --- |
| `site.config.ts` | 사이트 이름·닉네임·이메일·아바타·giscus 설정 |
| `astro.config.mjs` | site URL, sitemap, Shiki 이중 테마 |
| `src/content.config.ts` | posts 컬렉션 로더와 zod 스키마 |
| `src/lib/types.ts` | lib 함수가 쓰는 `PostLike` 인터페이스 (astro 의존 없음) |
| `src/lib/posts.ts` | 초안 제외·날짜 정렬·slug 계산·slug 검증·페이지 분할 |
| `src/lib/format.ts` | `Sep 03, 2026` 날짜 포맷, 카테고리 `/` 연결 |
| `src/styles/tokens.css` | 라이트/다크 CSS 변수, 폰트 스택 |
| `src/styles/global.css` | 리셋, 본문 타이포, 코드 블록 |
| `src/layouts/BaseLayout.astro` | `<head>`, SEO/OG, 테마 초기화 스크립트, 헤더/푸터 |
| `src/layouts/PostLayout.astro` | 글 상세 골격 |
| `src/components/SiteHeader.astro` | 로고 + 네비 + 테마 토글 |
| `src/components/Hero.astro` | 아바타 · 닉네임 · 이메일 · 구분선 |
| `src/components/SectionHeader.astro` | 섹션 제목 + `View all →` |
| `src/components/PostCard.astro` | 가로형 글 카드 |
| `src/components/Pagination.astro` | 이전/다음 페이지 |
| `src/components/TableOfContents.astro` | 스크롤 추적 목차 |
| `src/components/Giscus.astro` | 댓글 (설정 없으면 렌더 안 함) |
| `src/components/ThemeToggle.astro` | 테마 토글 버튼 |
| `src/pages/*` | 라우트 |
| `scripts/smoke.mjs` | 빌드 산출물 존재 확인 |
| `.github/workflows/deploy.yml` | 빌드·배포 |

`src/lib/*.ts` 는 `astro:content` 를 import 하지 않는다. 그래야 vitest 가 Astro 런타임 없이 돌아간다.
`.astro` 컴포넌트는 lib 함수의 결과를 받아 그리기만 한다.

## 8. 오류 처리와 검증

| 위험 | 방지 |
| --- | --- |
| 프론트매터 오타·누락 | zod 스키마 → `astro build` 실패 |
| 숫자로만 된 slug 가 `/posts/2` 와 충돌 | 로딩 단계에서 검사해 빌드 실패 |
| 타입 오류 | `astro check` 를 빌드 전에 실행 |
| 정렬·페이지 분할 회귀 | `src/lib/*.ts` 를 vitest 로 테스트 |
| 빌드는 되는데 산출물이 비었음 | `dist/index.html`, `dist/rss.xml`, `dist/sitemap-index.xml` 존재 확인 |
| 다크모드 흰 화면 번쩍임 | 테마 스크립트를 `<head>` 최상단 인라인으로 |
| giscus 미설정 시 빈 영역 | 설정값이 없으면 렌더하지 않는다 |
| 폰트 로딩 전 레이아웃 흔들림 | `display=swap` + preconnect |

화면 단위 테스트는 두지 않는다. 테스트는 `src/lib` 의 순수 함수에 한정한다.

## 9. 배포

`.github/workflows/deploy.yml`

```
on: push (main), workflow_dispatch
build:  pnpm/action-setup → setup-node(22, cache: pnpm) → pnpm install --frozen-lockfile
        → pnpm build → actions/upload-pages-artifact (./dist)
deploy: actions/deploy-pages
permissions: contents: read, pages: write, id-token: write
concurrency: group "pages", cancel-in-progress false
```

저장소는 `gh repo create pronaeae/pronaeae.github.io --public` 로 새로 만든다.
Pages Source 를 **GitHub Actions** 로 설정해야 한다. 기본값(`Deploy from a branch`)이면 워크플로가 성공해도 사이트가 바뀌지 않는다. `gh api` 로 설정한다.

## 10. 사람이 직접 해야 하는 작업

1. **giscus 앱 설치** — https://github.com/apps/giscus 에서 직접 설치하고, https://giscus.app 에서 `repoId` 와 `categoryId` 를 발급받아 `site.config.ts` 에 넣는다. 그 전까지 댓글 영역은 나오지 않는다.
2. **소개글과 첫 글 내용 작성** — 형식과 자리는 만들어 두고, 내용은 사용자가 채운다.

## 11. 열린 항목

- 커스텀 도메인은 범위 밖. 붙일 경우 `CNAME` 과 `site` 설정만 바꾸면 된다.
