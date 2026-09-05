/**
 * lib 함수가 다루는 최소한의 글 모양.
 *
 * 일부러 `astro:content` 를 import 하지 않는다. 그래야 이 파일들이
 * Astro 런타임 없이 vitest 에서 그대로 돌아간다.
 *
 * 카테고리는 프론트매터가 아니라 `id` 의 폴더 경로에서 나오므로 여기에 없다.
 */
export interface PostLike {
  /** 카테고리 폴더를 포함한 경로. 예: `네트워크/2026-09-03-tcp-3-way-handshake` */
  id: string;
  data: {
    title: string;
    description: string;
    date: Date;
    draft: boolean;
  };
}
