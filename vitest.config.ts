import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // lib 의 순수 함수만 본다. 화면은 빌드와 스모크로 확인한다.
    include: ['src/lib/**/*.test.ts'],
  },
});
