export const site = {
  url: 'https://pronaeae.github.io',
  /** 브라우저 탭과 헤더 왼쪽에 쓰는 사이트 이름 */
  title: "Doooong's Library",
  /** 히어로 가운데의 큰 세리프 이름 */
  nickname: 'Doooong',
  email: 'pronaeae@gmail.com',
  description: '네트워크와 분산 시스템을 공부하며 기록합니다',
  avatar: '/avatar.png',
  /** 링크 공유 시 미리보기 이미지. 전용 이미지를 만들면 여기만 바꾸면 된다 */
  ogImage: '/avatar.png',
  postsPerPage: 10,
  recentPostCount: 10,
  giscus: {
    repo: '' as `${string}/${string}` | '',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
  },
};

export type SiteConfig = typeof site;
