import { describe, expect, it } from 'vitest';
import {
  assertValidPost,
  neighbors,
  paginate,
  sortedPosts,
  toCategory,
  toSlug,
} from './posts';
import type { PostLike } from './types';

function post(id: string, date: string, draft = false): PostLike {
  return {
    id,
    data: {
      title: id,
      description: id,
      date: new Date(date),
      draft,
    },
  };
}

describe('toSlug', () => {
  it('카테고리 폴더를 떼고 마지막 조각만 쓴다', () => {
    expect(toSlug('네트워크/2026-09-03-tcp-3-way-handshake')).toBe(
      'tcp-3-way-handshake',
    );
  });

  it('로더가 붙인 /index 를 떼어낸다', () => {
    expect(toSlug('네트워크/2026-09-03-tcp-3-way-handshake/index')).toBe(
      'tcp-3-way-handshake',
    );
  });

  it('날짜 접두사는 선택이다', () => {
    expect(toSlug('네트워크/cors')).toBe('cors');
  });

  it('제목 안의 날짜처럼 생긴 부분은 건드리지 않는다', () => {
    expect(toSlug('회고/2026-09-03-retro-2025-12-31')).toBe(
      'retro-2025-12-31',
    );
  });
});

describe('toCategory', () => {
  it('한 단계 폴더를 카테고리로 읽는다', () => {
    expect(toCategory('네트워크/2026-09-03-tcp')).toEqual(['네트워크']);
  });

  it('중첩 폴더를 순서대로 읽는다', () => {
    expect(toCategory('프로그래밍/네트워크/웹/cors/index')).toEqual([
      '프로그래밍',
      '네트워크',
      '웹',
    ]);
  });

  it('카테고리 폴더가 없으면 빈 배열', () => {
    expect(toCategory('hello-world')).toEqual([]);
  });
});

describe('assertValidPost', () => {
  it('정상 글은 slug 와 카테고리를 돌려준다', () => {
    expect(assertValidPost('네트워크/2026-09-03-tcp/index')).toEqual({
      slug: 'tcp',
      category: ['네트워크'],
    });
  });

  it('카테고리 폴더 없이 놓인 글은 빌드를 세운다', () => {
    expect(() => assertValidPost('hello/index')).toThrow(/카테고리가 없습니다/);
  });

  it('빈 slug 는 빌드를 세운다', () => {
    expect(() => assertValidPost('네트워크/2026-09-03-')).toThrow(
      /비어 있습니다/,
    );
  });

  it('페이지네이션 라우트와 겹치는 slug 는 빌드를 세운다', () => {
    expect(() => assertValidPost('네트워크/page')).toThrow(/충돌/);
  });
});

describe('sortedPosts', () => {
  const posts = [
    post('c/a', '2026-01-01'),
    post('c/c', '2026-03-01'),
    post('c/b', '2026-02-01'),
    post('c/d', '2026-04-01', true),
  ];

  it('최신순으로 정렬한다', () => {
    expect(sortedPosts(posts).map((p) => p.id)).toEqual(['c/c', 'c/b', 'c/a']);
  });

  it('기본적으로 초안을 뺀다', () => {
    expect(sortedPosts(posts).some((p) => p.id === 'c/d')).toBe(false);
  });

  it('요청하면 초안도 포함한다', () => {
    expect(sortedPosts(posts, { includeDrafts: true }).map((p) => p.id)).toEqual(
      ['c/d', 'c/c', 'c/b', 'c/a'],
    );
  });

  it('원본 배열을 건드리지 않는다', () => {
    const original = posts.map((p) => p.id);
    sortedPosts(posts);
    expect(posts.map((p) => p.id)).toEqual(original);
  });
});

describe('paginate', () => {
  it('perPage 단위로 자른다', () => {
    expect(paginate([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('딱 나누어떨어지면 빈 페이지를 만들지 않는다', () => {
    expect(paginate([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('글이 없어도 빈 1페이지를 돌려준다', () => {
    expect(paginate([], 10)).toEqual([[]]);
  });

  it('perPage 가 0 이하면 던진다', () => {
    expect(() => paginate([1], 0)).toThrow();
  });
});

describe('neighbors', () => {
  const sorted = sortedPosts([
    post('네트워크/2026-01-01-a', '2026-01-01'),
    post('네트워크/2026-02-01-b', '2026-02-01'),
    post('회고/2026-03-01-c', '2026-03-01'),
  ]);

  it('가운데 글은 양쪽을 모두 가진다', () => {
    const { prev, next } = neighbors(sorted, 'b');
    expect(next?.id).toBe('회고/2026-03-01-c');
    expect(prev?.id).toBe('네트워크/2026-01-01-a');
  });

  it('가장 최신 글에는 next 가 없다', () => {
    expect(neighbors(sorted, 'c').next).toBeNull();
  });

  it('가장 오래된 글에는 prev 가 없다', () => {
    expect(neighbors(sorted, 'a').prev).toBeNull();
  });

  it('없는 slug 는 양쪽 다 null', () => {
    expect(neighbors(sorted, 'zzz')).toEqual({ prev: null, next: null });
  });
});
