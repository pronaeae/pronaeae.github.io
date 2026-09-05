/**
 * `Sep 03, 2026` 형식.
 *
 * 프론트매터의 `2026-09-03` 은 UTC 자정으로 파싱된다. 로컬 시간대로 포맷하면
 * 음수 오프셋 지역에서 하루 전으로 밀리므로 UTC 로 고정한다.
 */
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** `<time datetime>` 에 넣을 `2026-09-03` */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `[프로그래밍, 네트워크]` → `프로그래밍 / 네트워크` */
export function formatCategory(category: readonly string[]): string {
  return category.join(' / ');
}
