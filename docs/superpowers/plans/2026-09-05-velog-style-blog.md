# velog 스타일 블로그 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** velog 개인 블로그 화면을 그대로 재현한 정적 기술 블로그를 Astro 로 만들어 `pronaeae.github.io` 에 배포한다.

**Architecture:** 마크다운 글은 `src/content/posts/` 의 Content Collection 으로 관리하고 zod 로 프론트매터를 검증한다. 목록·태그·시리즈 계산은 `src/lib/` 의 순수 함수로 분리해 vitest 로 테스트하고, `.astro` 컴포넌트는 그 결과를 그리기만 한다. `main` 에 push 하면 GitHub Actions 가 빌드해 GitHub Pages 에 올린다.

**Tech Stack:** Astro 7.3.1, TypeScript, pnpm, vitest 5, @astrojs/sitemap, @astrojs/rss, Shiki(내장), giscus

**참조 설계:** `docs/superpowers/specs/2026-09-05-velog-style-blog-design.md`

---

## 작업 디렉터리

모든 명령은 `C:\Users\prona\Desktop\새 폴더\pronaeae.github.io` 에서 실행한다.
이 디렉터리는 이미 `git init` 되어 있고 설계 문서 커밋 1개가 있다. 원격은 아직 없다.

## Astro 7 주의사항

이 버전에서 바뀐 것 중 이 계획에 영향을 주는 것:

1. **컴파일러가 엄격해졌다.** 닫지 않은 태그는 빌드 에러다. 모든 `.astro` 템플릿의 태그를 반드시 닫는다.
2. **`compressHTML` 기본값이 `'jsx'`** 다. 인라인 요소 사이의 공백이 사라지므로, 공백이 필요하면 `{" "}` 를 명시한다. 이 계획의 템플릿은 공백에 의존하지 않도록 작성되어 있다.
3. **마크다운 파이프라인이 교체됐다.** remark/rehype 플러그인은 쓰지 않는다. 필요한 기능(제목 id 자동 생성, Shiki 하이라이팅, `render()` 의 `headings`)은 모두 기본 제공이다.

## 파일 구조

| 파일 | 책임 |
| --- | --- |
| `site.config.ts` | 사이트 이름·소개·소셜 링크·giscus 설정 한 곳에 모음 |
| `astro.config.mjs` | site URL, sitemap 통합, Shiki 이중 테마 |
| `src/content.config.ts` | posts 컬렉션 로더와 zod 스키마 |
| `src/lib/types.ts` | lib 함수가 쓰는 `PostLike` 인터페이스 (astro 의존 없음) |
| `src/lib/posts.ts` | 초안 제외·날짜 정렬 |
| `src/lib/tags.ts` | 태그 정규화·집계·필터 |
| `src/lib/series.ts` | 시리즈 묶기·슬러그·이전/다음 |
| `src/styles/tokens.css` | 라이트/다크 CSS 변수 |
| `src/styles/global.css` | 리셋, 본문 타이포, 코드 블록, 태그 pill |
| `src/layouts/BaseLayout.astro` | `<head>`, SEO/OG, 테마 초기화 스크립트, 헤더/푸터 |
| `src/layouts/PostLayout.astro` | 글 상세 골격 (제목·메타·본문 2단·하단) |
| `src/components/*.astro` | 화면 조각 |
| `src/pages/*` | 라우트 |
| `scripts/smoke.mjs` | 빌드 산출물 존재 확인 |
| `.github/workflows/deploy.yml` | 빌드·배포 |

`src/lib/*.ts` 는 `astro:content` 를 import 하지 않는다. 그래야 vitest 가 Astro 런타임 없이 돌아간다.

---

### Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.npmrc`, `site.config.ts`

- [ ] **Step 1: pnpm 프로젝트 생성**

```bash
cd "C:/Users/prona/Desktop/새 폴더/pronaeae.github.io"
pnpm init
```

- [ ] **Step 2: 의존성 설치**

```bash
pnpm add astro@7.3.1 @astrojs/rss @astrojs/sitemap
pnpm add -D typescript @astrojs/check vitest
```

- [ ] **Step 3: `package.json` 의 scripts 와 type 을 교체**

`package.json` 의 `"scripts"` 블록 전체를 아래로 바꾸고, 최상위에 `"type": "module"` 을 추가한다.

```json
{
  "name": "pronaeae-blog",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "build": "astro check && astro build && node scripts/smoke.mjs",
    "preview": "astro preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: `.gitignore` 작성**

```
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 5: `.npmrc` 작성**

Astro 는 선택적 네이티브 의존성을 쓰므로 pnpm 의 엄격한 호이스팅에서 문제가 생길 수 있다.

```
shamefully-hoist=false
auto-install-peers=true
```

- [ ] **Step 6: `tsconfig.json` 작성**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 7: `site.config.ts` 작성**

giscus 값은 Task 15 에서 발급받아 채운다. 지금은 빈 문자열로 두고, 빈 값이면 댓글 영역을 렌더하지 않는다.

```ts
export const site = {
  url: 'https://pronaeae.github.io',
  title: 'pronaeae.log',
  author: 'pronaeae',
  description: '백엔드 개발자 · 네트워크와 분산 시스템을 공부하며 기록합니다',
  avatar: '/avatar.png',
  ogImage: '/og-default.png',
  postsPerPage: 10,
  social: [
    { label: 'GitHub', href: 'https://github.com/pronaeae' },
    { label: 'Email', href: 'mailto:pronaeae@gmail.com' },
  ],
  giscus: {
    repo: '' as `${string}/${string}` | '',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
  },
};

export type SiteConfig = typeof site;
```

- [ ] **Step 8: `astro.config.mjs` 작성**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pronaeae.github.io',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
```

- [ ] **Step 9: 설치 확인**

Run: `pnpm astro --version`
Expected: `7.3.1` 출력

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "chore: Astro 프로젝트 초기화"
```

---

### Task 2: 콘텐츠 컬렉션 스키마와 샘플 글

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/posts/2026-09-03-tcp-3-way-handshake/index.md`
- Create: `src/content/posts/2026-08-28-http2-multiplexing/index.md`
- Create: `src/content/posts/2026-08-20-discord-bot-msa/index.md`

- [ ] **Step 1: `src/content.config.ts` 작성**

디렉터리 이름 앞의 날짜 접두사를 떼어 slug 로 쓴다. `series` 를 쓰면 `seriesOrder` 도 있어야 빌드가 통과한다.

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/posts',
    generateId: ({ entry }) =>
      entry.replace(/\/index\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(120),
        description: z.string().max(300),
        date: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        series: z.string().optional(),
        seriesOrder: z.number().int().positive().optional(),
        thumbnail: image().optional(),
        draft: z.boolean().default(false),
      })
      .refine((d) => d.series === undefined || d.seriesOrder !== undefined, {
        message: 'series 를 지정하면 seriesOrder 도 함께 지정해야 합니다',
        path: ['seriesOrder'],
      }),
});

export const collections = { posts };
```

- [ ] **Step 2: 샘플 글 1 — 시리즈에 속한 글**

`src/content/posts/2026-09-03-tcp-3-way-handshake/index.md`

````markdown
---
title: "TCP 3-way handshake, 왜 두 번으로는 안 되나"
description: "연결을 맺는다는 말이 실제로 무엇을 합의하는 것인지"
date: 2026-09-03
tags: [network, tcp]
series: "네트워크 강의 정리"
seriesOrder: 3
draft: false
---

TCP 연결은 왜 두 번의 메시지로 끝나지 않을까. 흔한 설명은 "양쪽이 서로를 확인해야 하니까"지만, 그 말만으로는 부족하다.

## SYN 이 실어 나르는 것

SYN 패킷은 "연결하자"는 신호만이 아니다. 초기 시퀀스 번호와 MSS 같은 협상 값을 함께 싣는다.

```bash
tcpdump -i any -n 'tcp[tcpflags] & (tcp-syn) != 0'
```

### 초기 시퀀스 번호

양쪽이 각자의 시작 번호를 정하고, 상대가 그것을 받았음을 확인해야 한다.

### MSS 협상

한 세그먼트에 실을 수 있는 최대 크기를 서로 알린다.

## 왜 2-way 로는 안 되는가

한쪽의 시작 번호만 확인되면 반대 방향의 순서를 보장할 수 없다.

## 정리

3-way 는 "양방향 각각에 대해 시작 번호를 보내고 확인받는" 최소 횟수다.
````

- [ ] **Step 3: 샘플 글 2 — 같은 시리즈의 다른 글**

`src/content/posts/2026-08-28-http2-multiplexing/index.md`

```markdown
---
title: "HTTP/2 멀티플렉싱과 head-of-line blocking"
description: "파이프라이닝이 실패한 자리에서 HTTP/2 가 다시 시도한 것"
date: 2026-08-28
tags: [network, http]
series: "네트워크 강의 정리"
seriesOrder: 4
draft: false
---

HTTP/1.1 의 파이프라이닝은 왜 실패했고, HTTP/2 는 무엇을 다르게 했는가.

## 스트림과 프레임

하나의 TCP 연결 위에 여러 스트림을 겹쳐 보낸다.

## TCP 레벨의 HOL blocking 은 남는다

애플리케이션 레벨에서 줄을 없앴어도 TCP 재전송 대기는 그대로다. QUIC 이 등장한 이유다.
```

- [ ] **Step 4: 샘플 글 3 — 시리즈에 속하지 않은 글**

`src/content/posts/2026-08-20-discord-bot-msa/index.md`

```markdown
---
title: "디스코드 봇을 MSA로 쪼갠 이유"
description: "모놀리식으로 시작해 8개 서비스가 되기까지"
date: 2026-08-20
tags: [architecture, NestJS]
draft: false
---

처음에는 하나의 NestJS 앱이었다.

## 쪼갠 기준

배포 주기가 다른 것부터 떼어냈다.

## 공용 Redis 에서 키가 충돌했다

서로 다른 서비스가 같은 캐시 키를 다른 형식으로 썼다.
```

세 번째 글의 태그가 일부러 `NestJS` 로 대문자다. Task 4 의 태그 정규화가 동작하는지 확인하는 데 쓴다.

- [ ] **Step 5: 스키마 검증이 도는지 확인**

Run: `pnpm astro sync`
Expected: 에러 없이 완료. `.astro/` 에 타입이 생성된다.

- [ ] **Step 6: 스키마가 실제로 잘못된 글을 막는지 확인**

`src/content/posts/2026-08-20-discord-bot-msa/index.md` 의 프론트매터에 `series: "임시"` 한 줄을 임시로 추가한 뒤:

Run: `pnpm astro sync`
Expected: FAIL — `seriesOrder` 관련 메시지와 함께 실패

확인 후 방금 추가한 `series: "임시"` 줄을 **삭제하고** 다시 `pnpm astro sync` 가 통과하는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: posts 컬렉션 스키마와 샘플 글 3편"
```

---

### Task 3: 글 목록 로직 (`src/lib/posts.ts`)

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/posts.ts`
- Create: `src/lib/posts.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: `vitest.config.ts` 작성**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: `src/lib/types.ts` 작성**

`astro:content` 의 실제 엔트리는 이 인터페이스를 만족하므로 그대로 넘겨 쓸 수 있다.

```ts
export interface PostLike {
  id: string;
  data: {
    title: string;
    description: string;
    date: Date;
    tags: string[];
    series?: string;
    seriesOrder?: number;
    draft: boolean;
  };
}
```

- [ ] **Step 3: 실패하는 테스트 작성**

`src/lib/posts.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { sortByDateDesc, visiblePosts } from './posts';
import type { PostLike } from './types';

function post(id: string, date: string, draft = false): PostLike {
  return {
    id,
    data: {
      title: id,
      description: `${id} 요약`,
      date: new Date(date),
      tags: [],
      draft,
    },
  };
}

describe('visiblePosts', () => {
  it('프로덕션에서는 draft 를 제외한다', () => {
    const all = [post('a', '2026-01-01'), post('b', '2026-01-02', true)];
    expect(visiblePosts(all, false).map((p) => p.id)).toEqual(['a']);
  });

  it('개발 중에는 draft 도 포함한다', () => {
    const all = [post('a', '2026-01-01'), post('b', '2026-01-02', true)];
    expect(visiblePosts(all, true).map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  it('최신 글이 앞에 오도록 정렬한다', () => {
    const all = [post('old', '2026-01-01'), post('new', '2026-03-01')];
    expect(visiblePosts(all, false).map((p) => p.id)).toEqual(['new', 'old']);
  });
});

describe('sortByDateDesc', () => {
  it('원본 배열을 바꾸지 않는다', () => {
    const all = [post('old', '2026-01-01'), post('new', '2026-03-01')];
    sortByDateDesc(all);
    expect(all.map((p) => p.id)).toEqual(['old', 'new']);
  });

  it('날짜가 같으면 id 오름차순으로 안정 정렬한다', () => {
    const all = [post('b', '2026-01-01'), post('a', '2026-01-01')];
    expect(sortByDateDesc(all).map((p) => p.id)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./posts"`

- [ ] **Step 5: `src/lib/posts.ts` 구현**

```ts
import type { PostLike } from './types';

export function sortByDateDesc<T extends PostLike>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => {
    const diff = b.data.date.getTime() - a.data.date.getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

export function visiblePosts<T extends PostLike>(
  posts: readonly T[],
  includeDrafts: boolean,
): T[] {
  const kept = includeDrafts ? [...posts] : posts.filter((p) => !p.data.draft);
  return sortByDateDesc(kept);
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm test`
Expected: PASS — 5 tests

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 글 목록 정렬·초안 필터 유틸"
```

---

### Task 4: 태그 로직 (`src/lib/tags.ts`)

**Files:**
- Create: `src/lib/tags.ts`
- Create: `src/lib/tags.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/tags.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { collectTags, normalizeTag, postsByTag } from './tags';
import type { PostLike } from './types';

function post(id: string, tags: string[]): PostLike {
  return {
    id,
    data: {
      title: id,
      description: `${id} 요약`,
      date: new Date('2026-01-01'),
      tags,
      draft: false,
    },
  };
}

describe('normalizeTag', () => {
  it('소문자로 바꾸고 앞뒤 공백을 없앤다', () => {
    expect(normalizeTag('  NestJS ')).toBe('nestjs');
  });

  it('가운데 공백은 하이픈으로 바꾼다', () => {
    expect(normalizeTag('web performance')).toBe('web-performance');
  });
});

describe('collectTags', () => {
  it('대소문자가 달라도 같은 태그로 센다', () => {
    const all = [post('a', ['NestJS']), post('b', ['nestjs'])];
    expect(collectTags(all)).toEqual([{ tag: 'nestjs', count: 2 }]);
  });

  it('글 수가 많은 순, 같으면 이름 오름차순으로 정렬한다', () => {
    const all = [
      post('a', ['network', 'tcp']),
      post('b', ['network']),
      post('c', ['redis']),
    ];
    expect(collectTags(all)).toEqual([
      { tag: 'network', count: 2 },
      { tag: 'redis', count: 1 },
      { tag: 'tcp', count: 1 },
    ]);
  });

  it('태그가 없는 글은 아무것도 더하지 않는다', () => {
    expect(collectTags([post('a', [])])).toEqual([]);
  });

  it('한 글에 같은 태그가 두 번 있어도 한 번만 센다', () => {
    expect(collectTags([post('a', ['tcp', 'TCP'])])).toEqual([
      { tag: 'tcp', count: 1 },
    ]);
  });
});

describe('postsByTag', () => {
  it('정규화된 이름으로 글을 고른다', () => {
    const all = [post('a', ['NestJS']), post('b', ['redis'])];
    expect(postsByTag(all, 'nestjs').map((p) => p.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./tags"`

- [ ] **Step 3: `src/lib/tags.ts` 구현**

```ts
import type { PostLike } from './types';

export interface TagCount {
  tag: string;
  count: number;
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

export function collectTags(posts: readonly PostLike[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const unique = new Set(post.data.tags.map(normalizeTag));
    for (const tag of unique) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function postsByTag<T extends PostLike>(
  posts: readonly T[],
  tag: string,
): T[] {
  const target = normalizeTag(tag);
  return posts.filter((p) => p.data.tags.some((t) => normalizeTag(t) === target));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test`
Expected: PASS — 12 tests (posts 5 + tags 7)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 태그 정규화·집계 유틸"
```

---

### Task 5: 시리즈 로직 (`src/lib/series.ts`)

**Files:**
- Create: `src/lib/series.ts`
- Create: `src/lib/series.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/series.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { collectSeries, seriesNavigation, seriesSlug } from './series';
import type { PostLike } from './types';

function post(id: string, series?: string, seriesOrder?: number): PostLike {
  return {
    id,
    data: {
      title: id,
      description: `${id} 요약`,
      date: new Date('2026-01-01'),
      tags: [],
      series,
      seriesOrder,
      draft: false,
    },
  };
}

describe('seriesSlug', () => {
  it('공백을 하이픈으로 바꾼다', () => {
    expect(seriesSlug('네트워크 강의 정리')).toBe('네트워크-강의-정리');
  });

  it('영문은 소문자로 만든다', () => {
    expect(seriesSlug('Deep Dive')).toBe('deep-dive');
  });

  it('문장부호를 없앤다', () => {
    expect(seriesSlug('TCP/IP: 기초!')).toBe('tcpip-기초');
  });
});

describe('collectSeries', () => {
  it('시리즈가 없는 글은 제외한다', () => {
    expect(collectSeries([post('a')])).toEqual([]);
  });

  it('seriesOrder 오름차순으로 글을 묶는다', () => {
    const all = [post('c', '네트워크', 3), post('a', '네트워크', 1)];
    const result = collectSeries(all);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('네트워크');
    expect(result[0]!.slug).toBe('네트워크');
    expect(result[0]!.posts.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('시리즈는 글 수가 많은 순, 같으면 이름 오름차순으로 정렬한다', () => {
    const all = [
      post('a', 'B시리즈', 1),
      post('b', 'A시리즈', 1),
      post('c', 'A시리즈', 2),
    ];
    expect(collectSeries(all).map((s) => s.name)).toEqual(['A시리즈', 'B시리즈']);
  });
});

describe('seriesNavigation', () => {
  const ordered = [post('a', 'S', 1), post('b', 'S', 2), post('c', 'S', 3)];

  it('가운데 글은 앞뒤가 모두 있다', () => {
    const nav = seriesNavigation(ordered, 'b');
    expect(nav).not.toBeNull();
    expect(nav!.index).toBe(2);
    expect(nav!.total).toBe(3);
    expect(nav!.prev!.id).toBe('a');
    expect(nav!.next!.id).toBe('c');
  });

  it('첫 글은 이전이 없다', () => {
    const nav = seriesNavigation(ordered, 'a');
    expect(nav!.prev).toBeNull();
    expect(nav!.next!.id).toBe('b');
  });

  it('마지막 글은 다음이 없다', () => {
    const nav = seriesNavigation(ordered, 'c');
    expect(nav!.prev!.id).toBe('b');
    expect(nav!.next).toBeNull();
  });

  it('시리즈에 없는 글이면 null 이다', () => {
    expect(seriesNavigation(ordered, 'zzz')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./series"`

- [ ] **Step 3: `src/lib/series.ts` 구현**

```ts
import type { PostLike } from './types';

export interface Series<T extends PostLike = PostLike> {
  name: string;
  slug: string;
  posts: T[];
}

export interface SeriesNavigation<T extends PostLike = PostLike> {
  index: number;
  total: number;
  prev: T | null;
  next: T | null;
}

export function seriesSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');
}

export function collectSeries<T extends PostLike>(
  posts: readonly T[],
): Series<T>[] {
  const groups = new Map<string, T[]>();

  for (const post of posts) {
    const name = post.data.series;
    if (name === undefined) continue;
    const bucket = groups.get(name);
    if (bucket) bucket.push(post);
    else groups.set(name, [post]);
  }

  return [...groups.entries()]
    .map(([name, items]) => ({
      name,
      slug: seriesSlug(name),
      posts: [...items].sort(
        (a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0),
      ),
    }))
    .sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name));
}

export function seriesNavigation<T extends PostLike>(
  orderedPosts: readonly T[],
  currentId: string,
): SeriesNavigation<T> | null {
  const at = orderedPosts.findIndex((p) => p.id === currentId);
  if (at === -1) return null;

  return {
    index: at + 1,
    total: orderedPosts.length,
    prev: orderedPosts[at - 1] ?? null,
    next: orderedPosts[at + 1] ?? null,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test`
Expected: PASS — 22 tests (posts 5 + tags 7 + series 10)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 시리즈 묶기·이전다음 유틸"
```

---

### Task 6: 디자인 토큰과 전역 스타일

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

- [ ] **Step 1: `src/styles/tokens.css` 작성**

```css
:root {
  --bg: #ffffff;
  --text: #212529;
  --text-sub: #495057;
  --text-muted: #868e96;
  --border: #f1f3f5;
  --chip-bg: #f1f3f5;
  --chip-text: #495057;
  --accent: #12b886;
  --code-bg: #1e1e1e;

  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR',
    'Malgun Gothic', sans-serif;
  --font-mono: Consolas, Menlo, 'D2Coding', monospace;

  --content-width: 768px;
  --sidebar-width: 150px;
  --toc-width: 170px;
}

[data-theme='dark'] {
  --bg: #1e1e1e;
  --text: #ececec;
  --text-sub: #acacac;
  --text-muted: #666666;
  --border: #303030;
  --chip-bg: #303030;
  --chip-text: #acacac;
  --accent: #12b886;
  --code-bg: #161616;
}
```

- [ ] **Step 2: `src/styles/global.css` 작성**

Shiki 이중 테마는 `--shiki-dark` 변수를 심어두므로, 다크일 때 그 값을 쓰도록 덮어쓴다. Astro 가 붙이는 클래스는 `.shiki` 가 아니라 `.astro-code` 다.

```css
@import './tokens.css';

* {
  box-sizing: border-box;
}

html {
  background: var(--bg);
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.chip {
  display: inline-block;
  background: var(--chip-bg);
  color: var(--chip-text);
  font-size: 12px;
  line-height: 1.6;
  padding: 4px 12px;
  border-radius: 999px;
  margin: 0 6px 6px 0;
}

.chip:hover {
  text-decoration: none;
  color: var(--accent);
}

.prose {
  color: var(--text);
  font-size: 16px;
  line-height: 1.9;
  word-break: break-word;
}

.prose h2 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 40px 0 12px;
  scroll-margin-top: 24px;
}

.prose h3 {
  font-size: 19px;
  font-weight: 700;
  margin: 28px 0 10px;
  scroll-margin-top: 24px;
}

.prose p {
  margin: 0 0 18px;
}

.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.prose blockquote {
  margin: 20px 0;
  padding: 4px 0 4px 16px;
  border-left: 3px solid var(--accent);
  color: var(--text-sub);
}

.prose :not(pre) > code {
  background: var(--chip-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 2px 5px;
  border-radius: 3px;
}

.prose pre {
  background: var(--code-bg);
  border-radius: 4px;
  padding: 16px 18px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.7;
}

.prose pre code {
  font-family: var(--font-mono);
}

[data-theme='dark'] .astro-code,
[data-theme='dark'] .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: 라이트/다크 디자인 토큰과 전역 스타일"
```

---

### Task 7: BaseLayout 과 테마 토글

**Files:**
- Create: `src/components/ThemeToggle.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/layouts/BaseLayout.astro`
- Create: `public/avatar.png`, `public/og-default.png`, `public/favicon.svg`

- [ ] **Step 1: 이미지 자리 채우기**

아바타가 아직 없으므로 GitHub 프로필 사진을 내려받아 쓴다.

```bash
mkdir -p public
curl -L -o public/avatar.png https://github.com/pronaeae.png
cp public/avatar.png public/og-default.png
```

`public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#12b886"/>
  <text x="16" y="22" font-family="sans-serif" font-size="17" font-weight="700"
        fill="#ffffff" text-anchor="middle">p</text>
</svg>
```

- [ ] **Step 2: `src/components/ThemeToggle.astro` 작성**

```astro
<button id="theme-toggle" type="button" aria-label="테마 전환">
  <span class="icon light">☀</span>
  <span class="icon dark">☾</span>
</button>

<style>
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-sub);
    font-size: 17px;
    line-height: 1;
    padding: 4px;
  }
  .icon.dark {
    display: none;
  }
  :global([data-theme='dark']) .icon.light {
    display: none;
  }
  :global([data-theme='dark']) .icon.dark {
    display: inline;
  }
</style>

<script>
  const button = document.getElementById('theme-toggle');

  button?.addEventListener('click', () => {
    const next =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  });
</script>
```

- [ ] **Step 3: `src/components/SiteHeader.astro` 작성**

```astro
---
import { site } from '../../site.config';
import ThemeToggle from './ThemeToggle.astro';
---

<header>
  <div class="container inner">
    <a class="logo" href="/">{site.title}</a>
    <div class="actions">
      <a class="rss" href="/rss.xml" aria-label="RSS">RSS</a>
      <ThemeToggle />
    </div>
  </div>
</header>

<style>
  header {
    border-bottom: 1px solid var(--border);
  }
  .inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
  }
  .logo {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .rss {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-sub);
  }
</style>
```

- [ ] **Step 4: `src/layouts/BaseLayout.astro` 작성**

테마 스크립트는 `<head>` 안, 스타일보다 먼저 실행되도록 `is:inline` 으로 넣는다. 이게 `<body>` 아래로 내려가면 다크모드 사용자에게 흰 화면이 한 번 번쩍인다.

```astro
---
import { site } from '../../site.config';
import SiteHeader from '../components/SiteHeader.astro';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

const {
  title,
  description = site.description,
  ogImage = site.ogImage,
  ogType = 'website',
} = Astro.props;

const pageTitle = title ? `${title} | ${site.title}` : site.title;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImageUrl = new URL(ogImage, Astro.site);
---

<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title={site.title} href="/rss.xml" />

    <meta property="og:type" content={ogType} />
    <meta property="og:title" content={title ?? site.title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImageUrl} />
    <meta name="twitter:card" content="summary_large_image" />

    <script is:inline>
      (function () {
        var stored = null;
        try {
          stored = localStorage.getItem('theme');
        } catch (e) {}
        var prefersDark =
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme =
          stored === 'light' || stored === 'dark'
            ? stored
            : prefersDark
              ? 'dark'
              : 'light';
      })();
    </script>
  </head>
  <body>
    <SiteHeader />
    <main>
      <slot />
    </main>
    <footer>
      <div class="container">© 2026 {site.author}</div>
    </footer>
  </body>
</html>

<style>
  main {
    min-height: 60vh;
  }
  footer {
    border-top: 1px solid var(--border);
    margin-top: 60px;
    padding: 24px 0;
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
  }
</style>
```

- [ ] **Step 5: 임시 홈으로 렌더 확인**

`src/pages/index.astro` 를 임시로 만든다. Task 9 에서 실제 내용으로 교체한다.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <div class="container">
    <p>레이아웃 확인용 임시 페이지</p>
  </div>
</BaseLayout>
```

Run: `pnpm dev`
Expected: `http://localhost:4321` 에서 헤더·푸터가 보이고, 테마 버튼을 누르면 배경이 `#1e1e1e` 로 바뀐다. 새로고침해도 다크가 유지되고 흰 화면이 번쩍이지 않는다.

확인 후 `Ctrl+C` 로 종료한다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: BaseLayout·사이트 헤더·테마 토글"
```

---

### Task 8: 프로필 헤더와 탭

**Files:**
- Create: `src/components/ProfileHeader.astro`
- Create: `src/components/Tabs.astro`

- [ ] **Step 1: `src/components/ProfileHeader.astro` 작성**

```astro
---
import { site } from '../../site.config';
---

<section class="profile">
  <img class="avatar" src={site.avatar} alt={site.author} width="96" height="96" />
  <h1 class="name">{site.author}</h1>
  <p class="desc">{site.description}</p>
  <nav class="social">
    {
      site.social.map((item) => (
        <a href={item.href} rel="me noopener">
          {item.label}
        </a>
      ))
    }
  </nav>
</section>

<style>
  .profile {
    padding: 32px 0 0;
  }
  .avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }
  .name {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 16px 0 6px;
  }
  .desc {
    margin: 0;
    color: var(--text-sub);
    font-size: 15px;
  }
  .social {
    display: flex;
    gap: 14px;
    margin-top: 14px;
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
```

- [ ] **Step 2: `src/components/Tabs.astro` 작성**

```astro
---
interface Props {
  current: 'posts' | 'series' | 'about';
}

const { current } = Astro.props;

const tabs = [
  { key: 'posts', label: '글', href: '/' },
  { key: 'series', label: '시리즈', href: '/series' },
  { key: 'about', label: '소개', href: '/about' },
] as const;
---

<nav class="tabs">
  {
    tabs.map((tab) => (
      <a href={tab.href} class={tab.key === current ? 'tab on' : 'tab'}>
        {tab.label}
      </a>
    ))
  }
</nav>

<style>
  .tabs {
    display: flex;
    gap: 22px;
    border-bottom: 1px solid var(--border);
    margin-top: 24px;
  }
  .tab {
    position: relative;
    padding: 10px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .tab:hover {
    text-decoration: none;
    color: var(--text);
  }
  .tab.on {
    color: var(--text);
  }
  .tab.on::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: var(--text);
  }
</style>
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: 프로필 헤더와 글/시리즈/소개 탭"
```

---

### Task 9: 글 카드·태그 사이드바·홈 목록

**Files:**
- Create: `src/components/PostCard.astro`
- Create: `src/components/TagSidebar.astro`
- Create: `src/components/PostListPage.astro`
- Create: `src/components/Pagination.astro`
- Modify: `src/pages/index.astro` (Task 7 의 임시 내용을 교체)
- Create: `src/pages/page/[page].astro`

- [ ] **Step 1: `src/components/PostCard.astro` 작성**

썸네일이 있을 때만 그린다. 댓글 수는 빌드 시점에 알 수 없으므로 날짜만 표시한다.

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { normalizeTag } from '../lib/tags';

interface Props {
  id: string;
  title: string;
  description: string;
  date: Date;
  tags: string[];
  thumbnail?: ImageMetadata;
}

const { id, title, description, date, tags, thumbnail } = Astro.props;

const formatted = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(date);
---

<article class="card">
  {
    thumbnail && (
      <a href={`/posts/${id}`} class="thumb-link">
        <Image class="thumb" src={thumbnail} alt="" />
      </a>
    )
  }
  <h2 class="title"><a href={`/posts/${id}`}>{title}</a></h2>
  <p class="desc">{description}</p>
  <div class="tags">
    {
      tags.map((tag) => (
        <a class="chip" href={`/tags/${normalizeTag(tag)}`}>
          {tag}
        </a>
      ))
    }
  </div>
  <div class="meta">
    <time datetime={date.toISOString()}>{formatted}</time>
  </div>
</article>

<style>
  .card {
    padding-bottom: 28px;
    margin-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }
  .card:last-child {
    border-bottom: none;
  }
  .thumb-link {
    display: block;
    margin-bottom: 16px;
  }
  .thumb {
    width: 100%;
    height: auto;
    border-radius: 4px;
  }
  .title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.4;
    margin: 0 0 8px;
  }
  .desc {
    margin: 0 0 14px;
    color: var(--text-sub);
    font-size: 15px;
    line-height: 1.8;
  }
  .tags {
    margin-bottom: 12px;
  }
  .meta {
    color: var(--text-muted);
    font-size: 13px;
  }
</style>
```

- [ ] **Step 2: `src/components/TagSidebar.astro` 작성**

```astro
---
import type { TagCount } from '../lib/tags';

interface Props {
  tags: TagCount[];
  total: number;
  current?: string;
}

const { tags, total, current } = Astro.props;
---

<aside class="side">
  <h3>태그 목록</h3>
  <ul>
    <li>
      <a href="/" class={current === undefined ? 'on' : ''}>
        전체보기 <span class="n">({total})</span>
      </a>
    </li>
    {
      tags.map((t) => (
        <li>
          <a href={`/tags/${t.tag}`} class={t.tag === current ? 'on' : ''}>
            {t.tag} <span class="n">({t.count})</span>
          </a>
        </li>
      ))
    }
  </ul>
</aside>

<style>
  .side {
    width: var(--sidebar-width);
    flex: none;
  }
  h3 {
    font-size: 13px;
    font-weight: 800;
    margin: 0 0 10px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 14px;
    line-height: 2.1;
  }
  a {
    color: var(--text-sub);
  }
  a.on {
    color: var(--accent);
    font-weight: 700;
  }
  .n {
    color: var(--text-muted);
    font-size: 12px;
  }

  @media (max-width: 860px) {
    .side {
      display: none;
    }
  }
</style>
```

- [ ] **Step 3: `src/components/Pagination.astro` 작성**

```astro
---
interface Props {
  prev?: string | undefined;
  next?: string | undefined;
}

const { prev, next } = Astro.props;
---

{
  (prev || next) && (
    <nav class="pager">
      {prev ? <a href={prev}>← 이전</a> : <span class="off">← 이전</span>}
      {next ? <a href={next}>다음 →</a> : <span class="off">다음 →</span>}
    </nav>
  )
}

<style>
  .pager {
    display: flex;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 14px;
  }
  .off {
    color: var(--text-muted);
  }
</style>
```

- [ ] **Step 4: `src/components/PostListPage.astro` 작성**

`index.astro` 와 `page/[page].astro` 가 같은 화면을 그리므로 한 곳에 모은다.

```astro
---
import type { CollectionEntry } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import ProfileHeader from './ProfileHeader.astro';
import Tabs from './Tabs.astro';
import TagSidebar from './TagSidebar.astro';
import PostCard from './PostCard.astro';
import Pagination from './Pagination.astro';
import type { TagCount } from '../lib/tags';

interface Props {
  posts: CollectionEntry<'posts'>[];
  tags: TagCount[];
  total: number;
  prev?: string | undefined;
  next?: string | undefined;
}

const { posts, tags, total, prev, next } = Astro.props;
---

<BaseLayout>
  <div class="container">
    <ProfileHeader />
    <Tabs current="posts" />
    <div class="body">
      <TagSidebar tags={tags} total={total} />
      <div class="list">
        {
          posts.map((post) => (
            <PostCard
              id={post.id}
              title={post.data.title}
              description={post.data.description}
              date={post.data.date}
              tags={post.data.tags}
              thumbnail={post.data.thumbnail}
            />
          ))
        }
        <Pagination prev={prev} next={next} />
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .body {
    display: flex;
    gap: 32px;
    padding: 26px 0 40px;
  }
  .list {
    flex: 1;
    min-width: 0;
    max-width: var(--content-width);
  }
</style>
```

- [ ] **Step 5: `src/pages/index.astro` 교체**

```astro
---
import { getCollection } from 'astro:content';
import PostListPage from '../components/PostListPage.astro';
import { visiblePosts } from '../lib/posts';
import { collectTags } from '../lib/tags';
import { site } from '../../site.config';

const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);
const tags = collectTags(all);
const pageSize = site.postsPerPage;
const posts = all.slice(0, pageSize);
const next = all.length > pageSize ? '/page/2' : undefined;
---

<PostListPage posts={posts} tags={tags} total={all.length} next={next} />
```

- [ ] **Step 6: `src/pages/page/[page].astro` 작성**

1페이지는 `/` 가 담당하므로 2페이지부터 만든다.

```astro
---
import type { GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import PostListPage from '../../components/PostListPage.astro';
import { visiblePosts } from '../../lib/posts';
import { collectTags } from '../../lib/tags';
import { site } from '../../../site.config';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);
  const pageSize = site.postsPerPage;
  const pageCount = Math.ceil(all.length / pageSize);

  return Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => {
    const pageNumber = i + 2;
    const start = (pageNumber - 1) * pageSize;
    return {
      params: { page: String(pageNumber) },
      props: {
        posts: all.slice(start, start + pageSize),
        total: all.length,
        tags: collectTags(all),
        prev: pageNumber === 2 ? '/' : `/page/${pageNumber - 1}`,
        next: pageNumber < pageCount ? `/page/${pageNumber + 1}` : undefined,
      },
    };
  });
};

const { posts, tags, total, prev, next } = Astro.props;
---

<PostListPage posts={posts} tags={tags} total={total} prev={prev} next={next} />
```

- [ ] **Step 7: 렌더 확인**

Run: `pnpm dev`
Expected: `http://localhost:4321` 에 프로필·탭·태그 사이드바(`전체보기 (3)`, `network (2)`, `architecture (1)`, `http (1)`, `nestjs (1)`, `tcp (1)`)와 글 카드 3개가 최신순으로 보인다. 태그 `NestJS` 는 사이드바에 `nestjs` 로 나온다.

확인 후 종료한다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: 홈 글 목록·태그 사이드바·페이지네이션"
```

---

### Task 10: 태그 페이지

**Files:**
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: `src/pages/tags/[tag].astro` 작성**

```astro
---
import type { GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProfileHeader from '../../components/ProfileHeader.astro';
import Tabs from '../../components/Tabs.astro';
import TagSidebar from '../../components/TagSidebar.astro';
import PostCard from '../../components/PostCard.astro';
import { visiblePosts } from '../../lib/posts';
import { collectTags, postsByTag } from '../../lib/tags';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);
  const tags = collectTags(all);

  return tags.map((t) => ({
    params: { tag: t.tag },
    props: { tag: t.tag, posts: postsByTag(all, t.tag), tags, total: all.length },
  }));
};

const { tag, posts, tags, total } = Astro.props;
---

<BaseLayout title={`#${tag}`} description={`${tag} 태그가 붙은 글 ${posts.length}개`}>
  <div class="container">
    <ProfileHeader />
    <Tabs current="posts" />
    <div class="body">
      <TagSidebar tags={tags} total={total} current={tag} />
      <div class="list">
        <h2 class="heading">#{tag}</h2>
        {
          posts.map((post) => (
            <PostCard
              id={post.id}
              title={post.data.title}
              description={post.data.description}
              date={post.data.date}
              tags={post.data.tags}
              thumbnail={post.data.thumbnail}
            />
          ))
        }
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .body {
    display: flex;
    gap: 32px;
    padding: 26px 0 40px;
  }
  .list {
    flex: 1;
    min-width: 0;
    max-width: var(--content-width);
  }
  .heading {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 22px;
  }
</style>
```

- [ ] **Step 2: `src/pages/tags/index.astro` 작성**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProfileHeader from '../../components/ProfileHeader.astro';
import Tabs from '../../components/Tabs.astro';
import { visiblePosts } from '../../lib/posts';
import { collectTags } from '../../lib/tags';

const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);
const tags = collectTags(all);
---

<BaseLayout title="태그" description="태그 전체 목록">
  <div class="container">
    <ProfileHeader />
    <Tabs current="posts" />
    <div class="wrap">
      <h2 class="heading">태그 전체</h2>
      <div>
        {
          tags.map((t) => (
            <a class="chip" href={`/tags/${t.tag}`}>
              {t.tag} ({t.count})
            </a>
          ))
        }
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .wrap {
    padding: 26px 0 40px;
    max-width: var(--content-width);
  }
  .heading {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 18px;
  }
</style>
```

- [ ] **Step 3: 렌더 확인**

Run: `pnpm dev`
Expected: `http://localhost:4321/tags/network` 에 글 2개가 보이고 사이드바의 `network` 가 민트색으로 강조된다. `/tags` 에는 태그 5개(`network`, `architecture`, `http`, `nestjs`, `tcp`)가 pill 로 보인다.

확인 후 종료한다.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: 태그 목록·태그별 글 페이지"
```

---

### Task 11: 목차 컴포넌트

**Files:**
- Create: `src/components/TableOfContents.astro`

- [ ] **Step 1: `src/components/TableOfContents.astro` 작성**

Astro 가 제목에 자동으로 `id` 를 붙이므로 그 slug 로 앵커를 만든다. `depth` 2·3 만 쓴다.

```astro
---
import type { MarkdownHeading } from 'astro';

interface Props {
  headings: MarkdownHeading[];
}

const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---

{
  items.length > 0 && (
    <nav class="toc" aria-label="목차">
      <ul>
        {items.map((h) => (
          <li class={h.depth === 3 ? 'sub' : ''}>
            <a href={`#${h.slug}`} data-slug={h.slug}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

<style>
  .toc {
    width: var(--toc-width);
    flex: none;
    position: sticky;
    top: 24px;
    align-self: flex-start;
    border-left: 2px solid var(--border);
    padding-left: 14px;
    font-size: 13px;
    line-height: 1.9;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li.sub {
    padding-left: 12px;
  }
  a {
    color: var(--text-muted);
  }
  a:hover {
    text-decoration: none;
    color: var(--text-sub);
  }
  a.active {
    color: var(--text);
    font-weight: 700;
  }

  @media (max-width: 1080px) {
    .toc {
      display: none;
    }
  }
</style>

<script>
  const links = document.querySelectorAll<HTMLAnchorElement>('.toc a[data-slug]');
  if (links.length > 0) {
    const bySlug = new Map<string, HTMLAnchorElement>();
    for (const link of links) {
      bySlug.set(link.dataset.slug!, link);
    }

    const headings = [...bySlug.keys()]
      .map((slug) => document.getElementById(slug))
      .filter((el): el is HTMLElement => el !== null);

    const visible = new Set<string>();

    const setActive = () => {
      let activeId: string | null = null;
      for (const heading of headings) {
        if (visible.has(heading.id)) {
          activeId = heading.id;
          break;
        }
      }
      for (const [slug, link] of bySlug) {
        link.classList.toggle('active', slug === activeId);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActive();
      },
      { rootMargin: '0px 0px -70% 0px' },
    );

    for (const heading of headings) observer.observe(heading);
  }
</script>
```

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "feat: 스크롤을 따라오는 목차"
```

---

### Task 12: 글 상세 페이지

**Files:**
- Create: `src/components/SeriesNav.astro`
- Create: `src/components/AuthorCard.astro`
- Create: `src/layouts/PostLayout.astro`
- Create: `src/pages/posts/[...id].astro`

- [ ] **Step 1: `src/components/SeriesNav.astro` 작성**

```astro
---
interface Props {
  name: string;
  slug: string;
  index: number;
  total: number;
  prevTitle?: string | undefined;
  prevId?: string | undefined;
}

const { name, slug, index, total, prevTitle, prevId } = Astro.props;
---

<section class="series">
  <a class="label" href={`/series/${slug}`}>SERIES · {name}</a>
  <p class="progress">
    {index} / {total}
    {prevId && prevTitle ? <span> — 이전: <a href={`/posts/${prevId}`}>{prevTitle}</a></span> : null}
  </p>
</section>

<style>
  .series {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 14px 16px;
    margin: 24px 0;
  }
  .label {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--accent);
    margin-bottom: 6px;
  }
  .progress {
    margin: 0;
    font-size: 14px;
    color: var(--text-sub);
  }
</style>
```

- [ ] **Step 2: `src/components/AuthorCard.astro` 작성**

```astro
---
import { site } from '../../site.config';
---

<section class="author">
  <img src={site.avatar} alt={site.author} width="52" height="52" />
  <div>
    <p class="name">{site.author}</p>
    <p class="desc">{site.description}</p>
  </div>
</section>

<style>
  .author {
    display: flex;
    gap: 14px;
    align-items: center;
    border-top: 1px solid var(--border);
    padding-top: 20px;
    margin-top: 40px;
  }
  img {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
  }
  .name {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }
  .desc {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-sub);
  }
</style>
```

- [ ] **Step 3: `src/layouts/PostLayout.astro` 작성**

댓글은 Task 15 에서 붙이므로 지금은 자리만 비워둔다. `Giscus` 컴포넌트는 Task 15 에서 import 를 추가한다.

```astro
---
import type { MarkdownHeading } from 'astro';
import BaseLayout from './BaseLayout.astro';
import TableOfContents from '../components/TableOfContents.astro';
import SeriesNav from '../components/SeriesNav.astro';
import AuthorCard from '../components/AuthorCard.astro';
import { normalizeTag } from '../lib/tags';
import { site } from '../../site.config';

interface Props {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  headings: MarkdownHeading[];
  series?:
    | {
        name: string;
        slug: string;
        index: number;
        total: number;
        prevTitle?: string | undefined;
        prevId?: string | undefined;
        nextTitle?: string | undefined;
        nextId?: string | undefined;
      }
    | undefined;
}

const { title, description, date, tags, headings, series } = Astro.props;

const formatted = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(date);
---

<BaseLayout title={title} description={description} ogType="article">
  <div class="container">
    <article class="post">
      <h1>{title}</h1>
      <p class="byline"><b>{site.author}</b> · <time datetime={date.toISOString()}>{formatted}</time></p>
      <div class="tags">
        {
          tags.map((tag) => (
            <a class="chip" href={`/tags/${normalizeTag(tag)}`}>
              {tag}
            </a>
          ))
        }
      </div>

      {
        series && (
          <SeriesNav
            name={series.name}
            slug={series.slug}
            index={series.index}
            total={series.total}
            prevTitle={series.prevTitle}
            prevId={series.prevId}
          />
        )
      }

      <div class="cols">
        <div class="main">
          <div class="prose">
            <slot />
          </div>

          {
            series && (series.prevId || series.nextId) && (
              <nav class="adjacent">
                {series.prevId ? (
                  <a href={`/posts/${series.prevId}`}>← {series.prevTitle}</a>
                ) : (
                  <span />
                )}
                {series.nextId ? (
                  <a href={`/posts/${series.nextId}`}>{series.nextTitle} →</a>
                ) : (
                  <span />
                )}
              </nav>
            )
          }

          <AuthorCard />
        </div>
        <TableOfContents headings={headings} />
      </div>
    </article>
  </div>
</BaseLayout>

<style>
  .post {
    padding: 40px 0 0;
  }
  h1 {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.35;
    margin: 0 0 16px;
  }
  .byline {
    margin: 0 0 16px;
    font-size: 14px;
    color: var(--text-sub);
  }
  .tags {
    margin-bottom: 8px;
  }
  .cols {
    display: flex;
    gap: 32px;
    margin-top: 28px;
  }
  .main {
    flex: 1;
    min-width: 0;
    max-width: var(--content-width);
  }
  .adjacent {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 36px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 14px;
    color: var(--text-sub);
  }
</style>
```

- [ ] **Step 4: `src/pages/posts/[...id].astro` 작성**

```astro
---
import type { GetStaticPaths } from 'astro';
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';
import { visiblePosts } from '../../lib/posts';
import { collectSeries, seriesNavigation } from '../../lib/series';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);
  const seriesList = collectSeries(all);

  return all.map((post) => {
    const group = seriesList.find((s) => s.name === post.data.series);
    const nav = group ? seriesNavigation(group.posts, post.id) : null;

    return {
      params: { id: post.id },
      props: {
        post,
        series:
          group && nav
            ? {
                name: group.name,
                slug: group.slug,
                index: nav.index,
                total: nav.total,
                prevId: nav.prev?.id,
                prevTitle: nav.prev?.data.title,
                nextId: nav.next?.id,
                nextTitle: nav.next?.data.title,
              }
            : undefined,
      },
    };
  });
};

const { post, series } = Astro.props;
const { Content, headings } = await render(post);
---

<PostLayout
  title={post.data.title}
  description={post.data.description}
  date={post.data.date}
  tags={post.data.tags}
  headings={headings}
  series={series}
>
  <Content />
</PostLayout>
```

- [ ] **Step 5: 렌더 확인**

Run: `pnpm dev`
Expected: `http://localhost:4321/posts/tcp-3-way-handshake` 에서
- 제목·날짜·태그가 보인다
- 시리즈 박스에 `SERIES · 네트워크 강의 정리`, `3 / 12` 가 아닌 `1 / 2` 가 보인다 (시리즈에 글이 2편이므로 정상)
- 오른쪽 목차에 `SYN 이 실어 나르는 것`, `초기 시퀀스 번호`(들여쓰기), `MSS 협상`, `왜 2-way 로는 안 되는가`, `정리` 가 보이고, 스크롤하면 현재 위치가 굵어진다
- 코드 블록이 하이라이팅되고, 다크모드로 바꾸면 코드 색이 함께 바뀐다

확인 후 종료한다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 글 상세 페이지·시리즈 네비·작성자 카드"
```

---

### Task 13: 시리즈 페이지와 소개·404

**Files:**
- Create: `src/pages/series/index.astro`
- Create: `src/pages/series/[slug].astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/404.astro`

- [ ] **Step 1: `src/pages/series/index.astro` 작성**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProfileHeader from '../../components/ProfileHeader.astro';
import Tabs from '../../components/Tabs.astro';
import { visiblePosts } from '../../lib/posts';
import { collectSeries } from '../../lib/series';

const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);
const seriesList = collectSeries(all);
---

<BaseLayout title="시리즈" description="시리즈 목록">
  <div class="container">
    <ProfileHeader />
    <Tabs current="series" />
    <div class="wrap">
      {
        seriesList.length === 0 ? (
          <p class="empty">아직 시리즈가 없습니다.</p>
        ) : (
          seriesList.map((s) => (
            <a class="item" href={`/series/${s.slug}`}>
              <span class="name">{s.name}</span>
              <span class="count">{s.posts.length}개의 글</span>
            </a>
          ))
        )
      }
    </div>
  </div>
</BaseLayout>

<style>
  .wrap {
    padding: 26px 0 40px;
    max-width: var(--content-width);
  }
  .item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 18px 0;
    border-bottom: 1px solid var(--border);
  }
  .item:hover {
    text-decoration: none;
  }
  .name {
    font-size: 19px;
    font-weight: 800;
  }
  .count {
    font-size: 13px;
    color: var(--text-muted);
  }
  .empty {
    color: var(--text-muted);
  }
</style>
```

- [ ] **Step 2: `src/pages/series/[slug].astro` 작성**

```astro
---
import type { GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProfileHeader from '../../components/ProfileHeader.astro';
import Tabs from '../../components/Tabs.astro';
import PostCard from '../../components/PostCard.astro';
import { visiblePosts } from '../../lib/posts';
import { collectSeries } from '../../lib/series';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = visiblePosts(await getCollection('posts'), import.meta.env.DEV);

  return collectSeries(all).map((s) => ({
    params: { slug: s.slug },
    props: { name: s.name, posts: s.posts },
  }));
};

const { name, posts } = Astro.props;
---

<BaseLayout title={name} description={`${name} 시리즈의 글 ${posts.length}개`}>
  <div class="container">
    <ProfileHeader />
    <Tabs current="series" />
    <div class="wrap">
      <h2 class="heading">{name}</h2>
      <p class="count">{posts.length}개의 글</p>
      {
        posts.map((post) => (
          <PostCard
            id={post.id}
            title={post.data.title}
            description={post.data.description}
            date={post.data.date}
            tags={post.data.tags}
            thumbnail={post.data.thumbnail}
          />
        ))
      }
    </div>
  </div>
</BaseLayout>

<style>
  .wrap {
    padding: 26px 0 40px;
    max-width: var(--content-width);
  }
  .heading {
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 6px;
  }
  .count {
    margin: 0 0 26px;
    color: var(--text-muted);
    font-size: 13px;
  }
</style>
```

시리즈 페이지는 `seriesOrder` 순서를 유지한다. `collectSeries` 가 이미 정렬해 준다.

- [ ] **Step 3: `src/pages/about.astro` 작성**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProfileHeader from '../components/ProfileHeader.astro';
import Tabs from '../components/Tabs.astro';
---

<BaseLayout title="소개" description="pronaeae 소개">
  <div class="container">
    <ProfileHeader />
    <Tabs current="about" />
    <div class="wrap prose">
      <h2>어떤 개발자인가</h2>
      <p>
        NestJS 기반 마이크로서비스를 만들고 운영합니다. 네트워크와 분산 시스템을
        공부하며 배운 것을 여기에 정리합니다.
      </p>

      <h2>기술 스택</h2>
      <p>TypeScript · NestJS · PostgreSQL · Redis · Docker · GCP</p>

      <h2>프로젝트</h2>
      <p>
        <b>Discord TTS Bot</b> — 8개 서비스로 나눈 NestJS 마이크로서비스. gRPC 로
        서비스 간 통신하고 Redis 로 캐시와 분산락을 다룹니다.
      </p>
    </div>
  </div>
</BaseLayout>

<style>
  .wrap {
    padding: 26px 0 40px;
    max-width: var(--content-width);
  }
</style>
```

- [ ] **Step 4: `src/pages/404.astro` 작성**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="404" description="페이지를 찾을 수 없습니다">
  <div class="container wrap">
    <h1>404</h1>
    <p>찾으시는 페이지가 없습니다.</p>
    <a href="/">홈으로</a>
  </div>
</BaseLayout>

<style>
  .wrap {
    padding: 80px 0;
    text-align: center;
  }
  h1 {
    font-size: 56px;
    font-weight: 800;
    margin: 0 0 8px;
  }
  p {
    color: var(--text-sub);
  }
</style>
```

- [ ] **Step 5: 렌더 확인**

Run: `pnpm dev`
Expected: `/series` 에 `네트워크 강의 정리 — 2개의 글`, `/series/네트워크-강의-정리` 에 글 2개가 `seriesOrder` 순(3번 글이 먼저, 4번 글이 다음)으로 보인다. `/about` 과 `/asdf`(404) 도 뜬다.

확인 후 종료한다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 시리즈 페이지·소개·404"
```

---

### Task 14: RSS 와 빌드 스모크 검사

**Files:**
- Create: `src/pages/rss.xml.ts`
- Create: `scripts/smoke.mjs`

- [ ] **Step 1: `src/pages/rss.xml.ts` 작성**

```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { visiblePosts } from '../lib/posts';
import { site } from '../../site.config';

export async function GET(context: APIContext) {
  const posts = visiblePosts(await getCollection('posts'), false);

  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}`,
    })),
  });
}
```

RSS 는 개발 중에도 초안을 넣지 않으므로 `visiblePosts(..., false)` 로 고정한다.

- [ ] **Step 2: `scripts/smoke.mjs` 작성**

빌드는 성공했는데 산출물이 비어 있는 경우를 잡는다.

```js
import { access } from 'node:fs/promises';
import { join } from 'node:path';

const required = [
  'index.html',
  'rss.xml',
  'sitemap-index.xml',
  '404.html',
  'posts/tcp-3-way-handshake/index.html',
];

const missing = [];

for (const file of required) {
  try {
    await access(join('dist', file));
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error('빌드 산출물에 다음 파일이 없습니다:');
  for (const file of missing) console.error(`  - ${file}`);
  process.exit(1);
}

console.log(`smoke: ${required.length}개 산출물 확인 완료`);
```

- [ ] **Step 3: 전체 빌드 실행**

Run: `pnpm build`
Expected: `astro check` 통과 → `astro build` 완료 → `smoke: 5개 산출물 확인 완료`

`astro check` 에서 타입 오류가 나오면 그 자리에서 고친다. 오류를 무시하고 넘어가지 않는다.

- [ ] **Step 4: 스모크 검사가 실제로 잡는지 확인**

```bash
rm dist/rss.xml
node scripts/smoke.mjs
```

Expected: FAIL — `빌드 산출물에 다음 파일이 없습니다:` 와 `- rss.xml`, 종료 코드 1

확인 후 `pnpm build` 를 다시 돌려 통과시킨다.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: RSS 피드와 빌드 산출물 스모크 검사"
```

---

### Task 15: giscus 댓글

**Files:**
- Create: `src/components/Giscus.astro`
- Modify: `src/layouts/PostLayout.astro` (import 추가, `<AuthorCard />` 아래에 배치)
- Modify: `site.config.ts` (giscus 값 채우기)

- [ ] **Step 1: GitHub 쪽 준비 (사람이 하는 작업)**

Task 17 에서 저장소 이름을 바꾸고 원격에 push 한 뒤여야 giscus 설정이 가능하다.
**이 Task 는 Task 17 이후에 진행한다.** 순서를 바꿔 실행하는 경우 Step 1~2 를 건너뛰고 Step 3~5 만 먼저 해도 된다 (설정값이 비어 있으면 댓글 영역이 렌더되지 않는다).

1. https://github.com/apps/giscus 에서 `pronaeae/pronaeae.github.io` 에 giscus 앱을 설치한다
2. Discussions 를 켠다: `gh api -X PATCH repos/pronaeae/pronaeae.github.io -f has_discussions=true`
3. https://giscus.app 에서 저장소를 입력하고 `data-repo-id` 와 `data-category-id` 를 받아 적는다

- [ ] **Step 2: `site.config.ts` 의 giscus 값 채우기**

Step 1 에서 받은 값으로 교체한다.

```ts
  giscus: {
    repo: 'pronaeae/pronaeae.github.io' as `${string}/${string}` | '',
    repoId: 'R_kgDO...',        // giscus.app 에서 받은 값
    category: 'Announcements',
    categoryId: 'DIC_kwDO...',  // giscus.app 에서 받은 값
  },
```

- [ ] **Step 3: `src/components/Giscus.astro` 작성**

설정이 비어 있으면 아무것도 그리지 않는다. 테마는 `themechange` 이벤트를 받아 iframe 에 `postMessage` 로 전달한다.

```astro
---
import { site } from '../../site.config';

const enabled = site.giscus.repo !== '' && site.giscus.repoId !== '';
---

{
  enabled && (
    <section class="comments">
      <script
        src="https://giscus.app/client.js"
        data-repo={site.giscus.repo}
        data-repo-id={site.giscus.repoId}
        data-category={site.giscus.category}
        data-category-id={site.giscus.categoryId}
        data-mapping="pathname"
        data-strict="1"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-lang="ko"
        data-loading="lazy"
        crossorigin="anonymous"
        async
      />
    </section>
  )
}

<style>
  .comments {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }
</style>

<script>
  function giscusTheme() {
    return document.documentElement.dataset.theme === 'dark'
      ? 'dark_dimmed'
      : 'light';
  }

  function applyTheme() {
    const frame = document.querySelector<HTMLIFrameElement>(
      'iframe.giscus-frame',
    );
    frame?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusTheme() } } },
      'https://giscus.app',
    );
  }

  window.addEventListener('themechange', applyTheme);

  window.addEventListener('message', (event) => {
    if (event.origin === 'https://giscus.app') applyTheme();
  });
</script>
```

giscus 스크립트 태그에는 초기 `data-theme` 을 넣지 않는다. 로드 직후 `message` 이벤트를 받아 현재 테마를 곧바로 적용하기 때문이다.

- [ ] **Step 4: `src/layouts/PostLayout.astro` 수정**

import 목록에 한 줄을 추가한다.

```astro
import Giscus from '../components/Giscus.astro';
```

그리고 `<AuthorCard />` 바로 아래에 한 줄을 추가한다.

```astro
          <AuthorCard />
          <Giscus />
```

- [ ] **Step 5: 확인**

Run: `pnpm build`
Expected: 통과

giscus 설정을 채운 뒤라면 `pnpm dev` 로 글 상세를 열어 댓글 영역이 뜨는지, 테마 토글에 맞춰 댓글 배경도 바뀌는지 확인한다. 설정이 비어 있으면 댓글 영역 자체가 없는 것이 정상이다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: giscus 댓글과 테마 연동"
```

---

### Task 16: 배포 워크플로

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: `.github/workflows/deploy.yml` 작성**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm test

      - run: pnpm build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v4
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 로컬에서 워크플로가 하는 일을 그대로 재현**

Run: `pnpm install --frozen-lockfile && pnpm test && pnpm build`
Expected: 세 단계 모두 통과

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "ci: GitHub Pages 배포 워크플로"
```

---

### Task 17: 저장소 이름 변경과 첫 배포

**주의:** 이 Task 는 GitHub 에 실제 변경을 가한다. Step 1 을 실행하기 전에 사용자에게 확인을 받는다.

- [ ] **Step 1: 저장소 이름 변경 (사용자 확인 필수)**

```bash
gh api -X PATCH repos/pronaeae/blog -f name=pronaeae.github.io
```

Expected: JSON 응답의 `"name": "pronaeae.github.io"`

- [ ] **Step 2: 원격 연결과 push**

```bash
cd "C:/Users/prona/Desktop/새 폴더/pronaeae.github.io"
git remote add origin https://github.com/pronaeae/pronaeae.github.io.git
git push -u origin main
```

- [ ] **Step 3: Pages 소스를 GitHub Actions 로 설정**

```bash
gh api -X POST repos/pronaeae/pronaeae.github.io/pages -f build_type=workflow
```

이미 Pages 가 켜져 있어 409 가 나면 아래로 바꾼다.

```bash
gh api -X PUT repos/pronaeae/pronaeae.github.io/pages -f build_type=workflow
```

Expected: `"build_type": "workflow"`

- [ ] **Step 4: Discussions 활성화**

```bash
gh api -X PATCH repos/pronaeae/pronaeae.github.io -F has_discussions=true
```

Expected: `"has_discussions": true`

- [ ] **Step 5: 배포 확인**

```bash
gh run watch
```

Expected: `build` 와 `deploy` 잡이 모두 성공

- [ ] **Step 6: 사이트 확인**

Run: `curl -sSI https://pronaeae.github.io/ | head -1`
Expected: `HTTP/2 200`

브라우저로 열어 홈·글 상세·태그·시리즈·다크모드를 확인한다.

- [ ] **Step 7: 저장소 설명 갱신**

```bash
gh api -X PATCH repos/pronaeae/pronaeae.github.io \
  -f description="개발 블로그 · 네트워크와 분산 시스템 학습 기록" \
  -f homepage="https://pronaeae.github.io"
```

---

## 완료 기준

- [ ] `pnpm test` 통과 (22 tests)
- [ ] `pnpm build` 통과 (astro check → build → smoke)
- [ ] `https://pronaeae.github.io/` 가 200 을 반환하고 글 3편이 보인다
- [ ] 다크모드 전환이 새로고침 후에도 유지되고 흰 화면 번쩍임이 없다
- [ ] 글 상세에서 목차가 스크롤을 따라오고, 시리즈 글에 이전/다음이 보인다
- [ ] giscus 댓글이 뜨고 테마가 함께 바뀐다
- [ ] `/rss.xml`, `/sitemap-index.xml` 이 유효하다
