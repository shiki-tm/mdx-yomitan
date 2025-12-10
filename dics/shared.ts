import { readFileSync } from "fs";
import { splitOnFirst } from "../utils";

export type ParsedTerm = {
  headword: string;
  xmlString: string;
};

export function readTermsFromFile(termsTextFile: string): ParsedTerm[] {
  const content = readFileSync(termsTextFile, "utf-8");
  return Array.from(
    content.matchAll(/.+?(?=<\/>)/gs).map((m) =>
      m[0]
        .replace("</>", "")
        // .replace(/<script.*?>.*?<\/script>/g, "")
        // .replace(/<link.*?rel=\"stylesheet\".*?>/g, "")
        // .replace("<hr>", "")
        .trim()
    )
  ).map((termMatch) => {
    const [headword, xmlString] = splitOnFirst(termMatch, "\n").map((l) =>
      l.trim()
    );
    if (!headword || !xmlString) {
      throw new Error(`Failed to parse term:\n${termMatch}`);
    }
    return {
      headword,
      xmlString,
    };
  });
}
