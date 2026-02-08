import { readFileSync, writeFileSync } from "fs";
export function mergeCssFiles(files: string[], outputFile: string) {
  let merged = "";
  files.forEach((file) => (merged += readFileSync(file, "utf-8")));
  writeFileSync(outputFile, merged);
}
