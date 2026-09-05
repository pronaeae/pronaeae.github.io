import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { formatCategory } from '../lib/format';
import { loadPosts } from '../queries';
import { site } from '../../site.config';

export const GET: APIRoute = async (context) => {
  const posts = await loadPosts();

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.entry.data.title,
      description: post.entry.data.description,
      pubDate: post.entry.data.date,
      link: post.url,
      categories: [formatCategory(post.category)],
    })),
    customData: '<language>ko</language>',
  });
};
