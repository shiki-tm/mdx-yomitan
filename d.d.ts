declare module "pinyin-tone-tool" {
  function findSyllableBoundaries(t: string): { start: number; end: number }[];
}

declare module "pinyin-to-zhuyin" {
  function p2z(s: string): string;
}
