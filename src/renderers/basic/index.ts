export * from "./csv";
export * from "./refiners";
export * from "./MarkdownRenderer";
export * from "./JsonRenderer";
export * from "./CsvRenderer";
export * from "./CodeRenderer";
export * from "./SvgRenderer";

import type { ArtifactRenderer } from "../../renderer/types";
import { codeRenderer } from "./CodeRenderer";
import { csvRenderer } from "./CsvRenderer";
import { jsonRenderer } from "./JsonRenderer";
import { markdownRenderer } from "./MarkdownRenderer";
import { svgRenderer } from "./SvgRenderer";

export function createBasicRenderers(): ArtifactRenderer[] {
  return [
    markdownRenderer,
    jsonRenderer,
    csvRenderer,
    codeRenderer,
    svgRenderer,
  ];
}
