/**
 * 빌드가 성공했는데 산출물이 비어 있는 경우를 잡는다.
 * `astro build` 는 페이지가 하나도 없어도 종료 코드 0 을 낸다.
 */
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

const required = [
  'index.html',
  'posts/index.html',
  'about/index.html',
  '404.html',
  'rss.xml',
  'sitemap-index.xml',
];

const failures = [];

for (const file of required) {
  try {
    await access(join(dist, file));
  } catch {
    failures.push(`없음: dist/${file}`);
  }
}

// 홈에 히어로가 실제로 그려졌는지 — 레이아웃이 통째로 빠지는 사고를 잡는다
try {
  const home = await readFile(join(dist, 'index.html'), 'utf8');
  if (!home.includes('Recent Posts')) {
    failures.push('dist/index.html 에 Recent Posts 섹션이 없습니다');
  }
} catch {
  // 위에서 이미 "없음" 으로 잡혔다
}

if (failures.length > 0) {
  console.error('스모크 실패:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`스모크 통과 (${required.length}개 산출물 확인)`);
