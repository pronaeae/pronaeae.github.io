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
