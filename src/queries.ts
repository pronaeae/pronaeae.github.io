import { getCollection, type CollectionEntry } from 'astro:content';
import { assertValidPost, sortedPosts, toSlug } from './lib/posts';

export type PostEntry = CollectionEntry<'posts'>;

/** 폴더 경로에서 뽑아낸 값까지 붙인 글 */
export interface Post {
  entry: PostEntry;
  slug: string;
  category: string[];
  url: string;
}

/**
 * 글 전체를 최신순으로 읽는다.
 *
 * 여기서 폴더 규칙을 검증하므로, 규칙을 어긴 글이 있으면 배포가 아니라 빌드가 죽는다.
 * 초안은 `pnpm dev` 에서만 보인다.
 */
export async function loadPosts(): Promise<Post[]> {
  const all = await getCollection('posts');

  const seen = new Map<string, string>();
  for (const entry of all) {
    const { slug } = assertValidPost(entry.id);
    const previous = seen.get(slug);
    if (previous !== undefined) {
      throw new Error(
        `slug "${slug}" 가 겹칩니다: "${previous}" 와 "${entry.id}". 글 폴더 이름을 다르게 하세요.`,
      );
    }
    seen.set(slug, entry.id);
  }

  return sortedPosts(all, { includeDrafts: import.meta.env.DEV }).map(
    (entry) => {
      const { slug, category } = assertValidPost(entry.id);
      return { entry, slug, category, url: `/posts/${slug}/` };
    },
  );
}

export function urlOf(entry: PostEntry): string {
  return `/posts/${toSlug(entry.id)}/`;
}
