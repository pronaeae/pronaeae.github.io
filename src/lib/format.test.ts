import { describe, expect, it } from 'vitest';
import { formatCategory, formatDate, toIsoDate } from './format';

describe('formatDate', () => {
  it('Sep 03, 2026 형식으로 쓴다', () => {
    expect(formatDate(new Date('2026-09-03'))).toBe('Sep 03, 2026');
  });

  it('한 자리 날짜에 0 을 채운다', () => {
    expect(formatDate(new Date('2026-01-07'))).toBe('Jan 07, 2026');
  });

  it('UTC 자정을 로컬 시간대 때문에 하루 전으로 밀지 않는다', () => {
    expect(formatDate(new Date('2026-03-01T00:00:00Z'))).toBe('Mar 01, 2026');
  });
});

describe('toIsoDate', () => {
  it('YYYY-MM-DD 만 남긴다', () => {
    expect(toIsoDate(new Date('2026-09-03T12:34:56Z'))).toBe('2026-09-03');
  });
});

describe('formatCategory', () => {
  it('슬래시로 잇는다', () => {
    expect(formatCategory(['프로그래밍', '네트워크'])).toBe(
      '프로그래밍 / 네트워크',
    );
  });

  it('하나뿐이면 그대로', () => {
    expect(formatCategory(['회고'])).toBe('회고');
  });
});
