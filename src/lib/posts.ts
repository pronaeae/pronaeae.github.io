import type { PostLike } from './types';

/**
 * `/posts/page/2` 와 겹치면 안 되는 slug.
 * 라우트가 `src/pages/posts/page/[page].astro` 이므로 `page` 하나만 막으면 된다.
 */
const RESERVED_SLUGS = new Set(['page']);

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

/**
 * 글 id 를 경로 조각으로 자른다.
 *
 * 로더 설정에 따라 `.../index` 가 붙어 오는 경우가 있어 함께 떼어낸다.
 * id 는 `네트워크/2026-09-03-tcp-3-way-handshake` 처럼 카테고리 폴더를 포함한다.
 */
function segments(id: string): string[] {
  return id
    .replace(/\/index$/, '')
    .split('/')
    .filter((part) => part !== '');
}

/**
 * 글 id 를 URL slug 로 바꾼다.
 *
 * `네트워크/2026-09-03-tcp-3-way-handshake` → `tcp-3-way-handshake`
 *
 * 날짜 접두사는 파일 탐색기에서 정렬하려고 붙이는 것이라 URL 에는 내보내지 않는다.
 * 붙이든 말든 자유이고, 없으면 폴더 이름이 그대로 slug 가 된다.
 */
export function toSlug(id: string): string {
  const parts = segments(id);
  return (parts.at(-1) ?? '').replace(DATE_PREFIX, '');
}

/**
 * 글이 놓인 폴더 경로를 카테고리로 읽는다.
 *
 * `네트워크/2026-09-03-tcp` → `['네트워크']`
 * `프로그래밍/네트워크/cors` → `['프로그래밍', '네트워크']`
 *
 * 카테고리 폴더 없이 글을 놓으면 빈 배열이 되고, `assertValidPost` 가 빌드를 세운다.
 */
export function toCategory(id: string): string[] {
  return segments(id).slice(0, -1);
}

/**
 * 글이 규칙을 지켰는지 확인한다.
 * 어기면 배포가 아니라 빌드에서 죽는 것이 목적이므로 예외를 던진다.
 */
export function assertValidPost(id: string): {
  slug: string;
  category: string[];
} {
  const slug = toSlug(id);
  const category = toCategory(id);

  if (slug === '') {
    throw new Error(
      `글 "${id}" 의 slug 가 비어 있습니다. 폴더 이름이 날짜 접두사만으로 되어 있지 않은지 확인하세요.`,
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(
      `글 "${id}" 의 slug "${slug}" 는 라우트와 충돌합니다. 폴더 이름을 다르게 하세요.`,
    );
  }
  if (category.length === 0) {
    throw new Error(
      `글 "${id}" 에 카테고리가 없습니다. content/<카테고리>/<글 폴더>/index.md 형태로 두세요.`,
    );
  }
  return { slug, category };
}

/** 초안을 걸러내고 최신순으로 정렬한다. */
export function sortedPosts<T extends PostLike>(
  posts: readonly T[],
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): T[] {
  return posts
    .filter((post) => includeDrafts || !post.data.draft)
    .slice()
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * 목록을 페이지 단위로 자른다.
 * 글이 하나도 없어도 빈 1페이지를 돌려준다 — 목록 라우트가 사라지면 안 되기 때문이다.
 */
export function paginate<T>(items: readonly T[], perPage: number): T[][] {
  if (perPage < 1) {
    throw new Error(`perPage 는 1 이상이어야 합니다: ${perPage}`);
  }
  if (items.length === 0) {
    return [[]];
  }
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

/**
 * 정렬된 목록에서 이전/다음 글을 찾는다.
 *
 * 목록이 최신순이므로 배열 앞쪽이 더 최신이다. `next` 는 더 최신 글,
 * `prev` 는 더 오래된 글을 가리킨다.
 */
export function neighbors<T extends PostLike>(
  sorted: readonly T[],
  slug: string,
): { prev: T | null; next: T | null } {
  const index = sorted.findIndex((post) => toSlug(post.id) === slug);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    next: sorted[index - 1] ?? null,
    prev: sorted[index + 1] ?? null,
  };
}
