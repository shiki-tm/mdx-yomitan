import { TermEntry, type Dictionary } from "yomichan-dict-builder";
import { splitByElement } from "../../utils";
import type { ParsedTerm } from "../shared";
import * as cheerio from "cheerio";
import type { StructuredContentNode } from "yomichan-dict-builder/dist/types/yomitan/termbank";
import { ElementType } from "domelementtype";
import type { AnyNode, Element, Text } from "domhandler";

// x-pr = reading
// dt = definition parent
// x-sn = definition number
// x-f = dot?
// dd = example parent, .classes = inner structure?
// x-ex = example outer
// x-key = example inner (target word)
// x-lb = example divider line
// x-sbl = -> example structural arrow
// x-sblt = example structural triangle (showing the example content)
// x-gram, x-g = part of speech
// x-sbl0 = zero??

function traverse($: cheerio.CheerioAPI, node: AnyNode): StructuredContentNode {
  switch (node.type) {
    case ElementType.Text:
      return node.data.trim();
    case ElementType.Tag:
      const contents = $(node).contents();
      switch (node.tagName) {
        // ignore
        case "x-hw":
        case "x-hws":
        case "x-hwp":
        case "x-pr":
        case "script":
          return "";
        default:
          return {
            tag: "span",
            content: contents
              .map((_, el) => traverse($, el))
              .toArray()
              .filter((c) => c !== ""),
            data: { guifan: node.tagName ?? "no-tag" },
          };
      }
    case ElementType.Script:
      return "";
    default:
      throw new Error(`what is this? node type: ${node.type}`);
  }
}

// todo: add separate terms for non erhua variants where possible
export async function processGuifan(
  terms: ParsedTerm[],
  pinyinDic: Dictionary
) {
  let i = 0;
  for (const term of terms /* .filter((t) => t.headword === "埃") */) {
    let linkMatch: RegExpMatchArray | null = null;
    if ((linkMatch = term.xmlString.match(/@@@LINK=(.+?)/))) {
      const linkedTerm = linkMatch[1]!;
      const termEntry = new TermEntry(term.headword)
        .setReading("")
        .addDetailedDefinition({
          type: "structured-content",
          content: { tag: "span", content: `→${linkedTerm}`, lang: "zh-CN" },
        });
      await pinyinDic.addTerm(termEntry.build());
      continue;
    }
    const $ = cheerio.load(term.xmlString);
    for (let definitionSection of splitByElement($, $(".HYGF2"), "hr").map(
      (section) =>
        section.filter(
          (e) => !(e.type === ElementType.Text && $(e).text() === "\n")
        )
    )) {
      const readingNode = definitionSection.find(
        (d) => d.type === ElementType.Tag && d.tagName === "x-pr"
      );
      const reading = readingNode ? $(readingNode).text() : "";
      const tradNode = definitionSection.find(
        (d) =>
          d.type === ElementType.Text &&
          $(d)
            .text()
            .match(/（.+?）/g)
      );
      definitionSection = definitionSection.filter((e) => e !== tradNode);
      const definitionsMain = definitionSection
        .map((e) => traverse($, e))
        .filter((n) => n !== "") as StructuredContentNode[];
      if (tradNode) {
        definitionsMain.unshift({
          tag: "div",
          content: $(tradNode).text().trim(),
          data: { guifan: "trad" },
        });
      } else {
        definitionsMain.unshift({
          tag: "div",
          content: "",
          data: { guifan: "start-definitions-new-line" },
        });
      }
      const definitionContentsForReading = {
        tag: "span",
        content: definitionsMain,
        data: { guifan: "definitions-parent" },
        lang: "zh-CN",
      } satisfies StructuredContentNode;

      const pinyinTermEntry = new TermEntry(term.headword)
        .setReading(reading ?? "")
        .addDetailedDefinition({
          type: "structured-content",
          content: definitionContentsForReading,
        });
      await pinyinDic.addTerm(pinyinTermEntry.build());
      continue;
    }
    if (++i % 10000 === 0) {
      console.log(`Processed ${i} terms.`);
    }
  }
}
