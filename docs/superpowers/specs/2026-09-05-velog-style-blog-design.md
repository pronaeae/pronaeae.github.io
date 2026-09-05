# velog 스타일 개인 기술 블로그 — 설계

- 작성일: 2026-09-05
- 저장소: `pronaeae/blog` → `pronaeae/pronaeae.github.io` 로 이름 변경 예정
- 상태: 설계 확정, 구현 계획 대기

## 1. 목적과 범위

네트워크 강의 학습 노트를 중심으로 하되, 개발 경험 글까지 함께 쌓는 **기술 블로그 겸 포트폴리오**를 만든다.
화면은 velog 개인 블로그(`velog.io/@username`)를 기준으로 재현한다.

### 성공 기준

1. 마크다운 파일을 `src/content/posts/` 에 추가하고 `main` 에 push 하면 별도 조작 없이 배포된다.
2. 프론트매터가 잘못되면 배포가 아니라 **빌드에서 실패한다**.
3. 첫 화면이 velog 개인 블로그와 같은 인상을 준다 — 프로필 헤더, 탭, 태그 사이드바, 썸네일 카드 목록.
4. 글 상세에서 목차·시리즈 네비게이션·댓글이 동작한다.
5. 라이트/다크 전환이 새로고침 후에도 유지되고, 전환 시 흰 화면이 번쩍이지 않는다.

### 이번 범위에서 제외

velog 의 다음 기능은 다중 사용자와 서버 상태를 전제하므로 만들지 않는다.

- 좋아요 수, 조회수 (사용자 결정: 댓글만 있으면 된다)
- 팔로워 / 팔로잉
- 브라우저 글쓰기 에디터
- 트렌딩 / 피드 / 다른 사용자 탐색
- 글 검색 (사용자 결정: 넣지 않는다. UI 에도 검색 입력을 두지 않는다)
- 다국어

## 2. 기술 선택과 근거

| 항목 | 선택 | 근거 |
| --- | --- | --- |
| 프레임워크 | Astro | 마크다운이 1급 시민. Content Collections 로 프론트매터를 zod 검증. 기본 출력 JS 0바이트라 필요한 곳(테마 토글·목차·giscus)만 스크립트를 붙인다 |
| 패키지 매니저 | pnpm | 기존 프로젝트와 동일 |
| 호스팅 | GitHub Pages | 비용 0, 추가 계정 불필요. 저장소 이름을 `pronaeae.github.io` 로 바꿔 루트 주소를 쓰므로 `base` 설정이 필요 없다 |
| 배포 | GitHub Actions | Pages 의 Source 를 "GitHub Actions" 로 두고 워크플로에서 빌드·업로드 |
| 댓글 | giscus | GitHub Discussions 기반. 정적 사이트에서 동작하고 무료. 다크모드와 테마 연동 |
| 코드 하이라이팅 | Shiki (Astro 내장) | 빌드 타임 처리라 런타임 JS 없음 |

### 검토했으나 채택하지 않은 것

- **Jekyll 테마 포크**: 같은 결과를 가장 빨리 얻지만 Ruby 툴체인이 필요하고, Bootstrap 3 + jQuery + LESS + Grunt 기반의 오래된 코드를 그대로 물려받는다.
- **Next.js static export**: 익숙하다는 장점이 있으나 글을 보여주는 데 React 런타임 전체가 내려가고, 이미지 최적화를 꺼야 한다.
- **Hugo**: 빌드가 빠르지만 Go 템플릿을 새로 배워야 하고 커스터마이징 비용이 크다.

## 3. 디렉터리 구조

```
pronaeae.github.io/
├── .github/workflows/deploy.yml
├── astro.config.mjs
├── package.json
├── src/
│   ├── content.config.ts          # posts 컬렉션 zod 스키마
│   ├── content/
│   │   └── posts/
│   │       └── 2026-09-03-tcp-3-way-handshake/
│   │           ├── index.md
│   │           └── thumbnail.png
│   ├── components/
│   │   ├── SiteHeader.astro       # 로고(pronaeae.log) + 테마 토글 + RSS
│   │   ├── ProfileHeader.astro    # 아바타 · 이름 · 소개 · 소셜 링크
│   │   ├── Tabs.astro             # 글 / 시리즈 / 소개
│   │   ├── TagSidebar.astro       # 태그별 글 수, 현재 태그 강조
│   │   ├── PostCard.astro         # 썸네일 · 제목 · 요약 · 태그 · 날짜
│   │   ├── Pagination.astro
│   │   ├── TableOfContents.astro  # 스크롤 추적 목차
│   │   ├── SeriesNav.astro        # 시리즈 진행 박스 + 이전/다음
│   │   ├── AuthorCard.astro
│   │   ├── Giscus.astro
│   │   └── ThemeToggle.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro       # <head>, SEO 메타, OG, 테마 초기화 스크립트
│   │   └── PostLayout.astro
│   ├── pages/
│   │   ├── index.astro            # /  글 목록 1페이지
│   │   ├── page/[page].astro      # /page/2 …
│   │   ├── posts/[...slug].astro  # /posts/tcp-3-way-handshake
│   │   ├── tags/[tag].astro
│   │   ├── tags/index.astro
│   │   ├── series/index.astro
│   │   ├── series/[slug].astro
│   │   ├── about.astro
│   │   ├── rss.xml.ts
│   │   └── 404.astro
│   ├── lib/
│   │   ├── posts.ts               # 발행글 필터·정렬
│   │   ├── tags.ts                # 태그 집계
│   │   └── series.ts              # 시리즈 묶기·순서
│   └── styles/
│       ├── tokens.css             # 색·간격 CSS 변수 (라이트/다크)
│       └── global.css
├── public/
│   ├── avatar.png
│   ├── og-default.png
│   └── favicon.svg
└── site.config.ts                 # 사이트 이름, 소개, 소셜 링크, giscus 설정
```

`src/lib/*.ts` 는 순수 함수로만 두고 vitest 로 테스트한다. 컴포넌트는 이 함수들의 결과를 받아 그리기만 한다.

## 4. 콘텐츠 모델

### 프론트매터 스키마 (`src/content.config.ts`)

```ts
const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string().max(120),
    description: z.string().max(300),      // 목록 요약 · OG description
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    series: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
    thumbnail: image().optional(),
    draft: z.boolean().default(false),
  }).refine(d => !d.series || d.seriesOrder !== undefined, {
    message: 'series 를 쓰면 seriesOrder 도 있어야 합니다',
  }),
});
```

`series` 만 있고 `seriesOrder` 가 없으면 시리즈 안에서 순서를 정할 수 없으므로 빌드를 실패시킨다.

### 글 파일 예시

```markdown
---
title: "TCP 3-way handshake, 왜 두 번으로는 안 되나"
description: "연결을 맺는다는 말이 실제로 무엇을 합의하는 것인지"
date: 2026-09-03
tags: [network, tcp]
series: "네트워크 강의 정리"
seriesOrder: 3
thumbnail: "./thumbnail.png"
draft: false
---

본문…
```

### slug 규칙

디렉터리 이름 `2026-09-03-tcp-3-way-handshake` 에서 앞의 날짜를 떼어낸 `tcp-3-way-handshake` 를 slug 로 쓴다.
날짜 접두사는 파일 탐색기에서 정렬을 위한 것이고 URL 에는 노출하지 않는다.

### draft 처리

`draft: true` 인 글은 `import.meta.env.PROD` 일 때 목록·상세·RSS·sitemap 모두에서 제외한다.
`pnpm dev` 에서는 보이므로 쓰는 중인 글을 미리 볼 수 있다.

## 5. 라우팅

| 경로 | 화면 | 비고 |
| --- | --- | --- |
| `/` | 글 목록 (최신순 10개) | 프로필 헤더 + 탭 + 태그 사이드바 |
| `/page/2` … | 글 목록 다음 페이지 | 10개 단위 |
| `/posts/[slug]` | 글 상세 | 목차 · 시리즈 네비 · 작성자 카드 · giscus |
| `/tags` | 태그 전체 목록 | |
| `/tags/[tag]` | 해당 태그 글 목록 | 사이드바에서 현재 태그 강조 |
| `/series` | 시리즈 목록 | 시리즈명 · 글 수 · 대표 썸네일 |
| `/series/[slug]` | 시리즈 내 글을 `seriesOrder` 순서로 | |
| `/about` | 소개 | velog 의 "소개" 탭에 해당 |
| `/rss.xml` | RSS 피드 | |
| `/sitemap-index.xml` | 사이트맵 | `@astrojs/sitemap` |
| `/404` | 404 | |

velog 는 `/@username/slug` 형태지만 개인 도메인에서는 `@pronaeae` 가 중복이므로 `/posts/slug` 를 쓴다 (사용자 확정).

## 6. 디자인 토큰

`:root` 에 라이트 값을 정의하고 `[data-theme="dark"]` 에서 같은 변수만 덮어쓴다.

| 역할 | 변수 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 페이지 배경 | `--bg` | `#ffffff` | `#1e1e1e` |
| 본문 글자 | `--text` | `#212529` | `#ECECEC` |
| 보조 글자 | `--text-sub` | `#495057` | `#ACACAC` |
| 흐린 글자 (날짜·수량) | `--text-muted` | `#868e96` | `#666666` |
| 경계선 | `--border` | `#f1f3f5` | `#303030` |
| 태그 pill 배경 | `--chip-bg` | `#f1f3f5` | `#303030` |
| 강조 (링크·현재 태그) | `--accent` | `#12B886` | `#12B886` |

- 본문 폰트: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", "Malgun Gothic", sans-serif`
- 코드 폰트: `Consolas, Menlo, monospace`, 코드 블록은 다크 배경 고정 (`#1e1e1e`)
- 본문 최대 폭 768px, 목록 영역과 태그 사이드바는 `flex` 2단

### 테마 전환

`BaseLayout` 의 `<head>` 최상단에 인라인 스크립트를 넣어, 페이지가 그려지기 전에
`localStorage.theme` 또는 `prefers-color-scheme` 을 읽어 `<html data-theme>` 를 설정한다.
이 스크립트가 `<body>` 뒤에 있으면 다크모드 사용자에게 흰 화면이 한 번 번쩍이므로 위치가 중요하다.

giscus 도 테마 전환 시 `postMessage` 로 `setConfig` 를 보내 같이 바꾼다.

## 7. 화면 구성

### 홈 (`/`)

1. **사이트 헤더** — 왼쪽 `pronaeae.log` (800 weight), 오른쪽 테마 토글 · RSS
2. **프로필 헤더** — 96px 원형 아바타, 이름(26px/800), 한 줄 소개, 소셜 링크(GitHub · Email · Portfolio)
3. **탭** — `글` / `시리즈` / `소개`. 현재 탭은 아래 2px 실선으로 표시. 검색 입력은 두지 않는다
4. **본문 2단** — 왼쪽 태그 사이드바(고정 폭 150px, 태그별 글 수, 현재 태그 민트색), 오른쪽 글 카드 목록
5. **글 카드** — 썸네일(있을 때만) → 제목(21px/800) → 요약(2~3줄) → 태그 pill → `2026년 9월 3일 · 3개의 댓글`

댓글 수는 정적으로 알 수 없으므로 **카드에는 날짜만 표시한다.** 목업에 있던 "N개의 댓글"은 넣지 않는다.

### 글 상세 (`/posts/[slug]`)

1. 제목(34px/800), `pronaeae · 2026년 9월 3일`, 태그 pill
2. 시리즈에 속한 글이면 시리즈 박스 — `SERIES · 네트워크 강의 정리`, `3 / 12`, 이전 글 제목
3. 본문 2단 — 왼쪽 본문, 오른쪽 목차(170px). 목차는 `IntersectionObserver` 로 현재 위치를 굵게 표시
4. 하단 — 이전/다음 글, 작성자 카드, giscus

좋아요·공유 플로팅 바는 만들지 않는다.

### 소개 (`/about`)

마크다운 한 장으로 쓰고, 자기소개 · 기술 스택 · 프로젝트(디스코드봇 MSA 등)를 담는다.

## 8. 배포 파이프라인

`.github/workflows/deploy.yml`

```
on: push (main), workflow_dispatch
build:  pnpm/action-setup → setup-node(cache: pnpm) → pnpm install --frozen-lockfile
        → pnpm build → actions/upload-pages-artifact (./dist)
deploy: actions/deploy-pages
permissions: contents: read, pages: write, id-token: write
concurrency: group "pages", cancel-in-progress false
```

저장소 Settings > Pages 의 Source 를 **GitHub Actions** 로 설정해야 한다. 기본값(`Deploy from a branch`)이면 워크플로가 성공해도 사이트가 바뀌지 않는다.

## 9. 오류 처리와 검증

| 위험 | 방지 |
| --- | --- |
| 프론트매터 오타·누락 | zod 스키마 → `astro build` 실패 |
| `series` 있는데 `seriesOrder` 없음 | 스키마 `refine` 으로 빌드 실패 |
| 타입 오류 | `astro check` 를 빌드 전에 실행 |
| 정렬·집계 로직 회귀 | `src/lib/*.ts` 를 vitest 로 테스트 |
| 빌드는 되는데 산출물이 비었음 | `dist/index.html`, `dist/rss.xml`, `dist/sitemap-index.xml` 존재를 확인하는 스모크 스크립트 |
| 다크모드 흰 화면 번쩍임 | 테마 스크립트를 `<head>` 최상단 인라인으로 |
| giscus 미설정 시 빈 영역 | 설정값이 없으면 컴포넌트를 렌더하지 않는다 |
| 태그 이름의 대소문자·공백 편차 | 집계 시 소문자·trim 으로 정규화 |

정적 블로그에 화면 단위 테스트까지 두르는 것은 과잉이므로, 테스트는 `src/lib` 의 순수 함수에 한정한다.

## 10. 사람이 직접 해야 하는 작업

1. **저장소 이름 변경** `blog` → `pronaeae.github.io` (실행 전 별도 확인)
2. **Pages Source 를 GitHub Actions 로 변경** (`gh api` 로 가능)
3. **Discussions 활성화** (`gh api` 로 가능)
4. **giscus 앱 설치** — https://github.com/apps/giscus 에서 직접 설치해야 하며, 설치 후 https://giscus.app 에서 `repoId` 와 `categoryId` 를 발급받아 `site.config.ts` 에 넣는다
5. **아바타 이미지와 소개 문구 제공** — 없으면 GitHub 프로필 사진과 임시 문구로 채운다

## 11. 열린 항목

- 첫 글로 넣을 내용: 저장소 설명이 "네트워크 강의를 보면서 학습한 내용" 이므로 네트워크 시리즈 1편을 샘플로 넣되, 실제 내용은 사용자가 채운다
- 커스텀 도메인은 이번 범위 밖. 나중에 붙일 경우 `CNAME` 파일과 `site` 설정만 바꾸면 된다
