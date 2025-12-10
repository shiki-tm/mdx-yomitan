import { findSyllableBoundaries } from "pinyin-tone-tool";

const word = "zhuǐr";
const out = findSyllableBoundaries(word);
console.log(`word: ${word}`);
console.log(
  "split",
  out.map((a) => word.slice(a.start, a.end))
);
