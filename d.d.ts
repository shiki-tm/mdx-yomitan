declare module "pinyin-tone-tool" {
  function findSyllableBoundaries(t: string): { start: number; end: number }[];
}
