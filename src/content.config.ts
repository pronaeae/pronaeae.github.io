import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 글은 `content/<카테고리…>/<글 폴더>/index.md` 에 둔다.
 * 카테고리는 프론트매터가 아니라 폴더 경로에서 읽는다 (`src/lib/posts.ts`).
 */
const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './content' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(120),
      description: z.string().min(1).max(300),
      date: z.coerce.date(),
      thumbnail: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
