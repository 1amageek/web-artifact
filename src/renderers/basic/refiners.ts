import { preRenderable, renderable, type RefinedPayload } from "../../renderer/types";
import type { AnyArtifact } from "../../core/types";

export function completeOnlyRefine(
  artifact: AnyArtifact,
  hint = "waiting for complete payload",
): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  return preRenderable({
    receivedCharacters: artifact.payload.length,
    hint,
  });
}

export function markdownRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  const index = artifact.payload.lastIndexOf("\n");
  if (index <= 0) {
    return preRenderable({
      receivedCharacters: artifact.payload.length,
      hint: "waiting for first complete line",
    });
  }
  return renderable(artifact.payload.slice(0, index));
}

export function jsonRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  const prefix = longestValidJsonPrefix(artifact.payload);
  if (!prefix) {
    return preRenderable({
      receivedCharacters: artifact.payload.length,
      hint: "waiting for first complete JSON value",
    });
  }
  return renderable(prefix);
}

export function csvRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  const prefix = longestValidCsvPrefix(artifact.payload);
  if (!prefix) {
    return preRenderable({
      receivedCharacters: artifact.payload.length,
      hint: "waiting for first complete row",
    });
  }
  return renderable(prefix);
}

export function htmlRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  const prefix = longestValidHtmlPrefix(artifact.payload);
  if (!prefix) {
    return preRenderable({
      receivedCharacters: artifact.payload.length,
      hint: "waiting for first complete tag",
    });
  }
  return renderable(prefix);
}

export function svgRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  const prefix = longestValidSvgPrefix(artifact.payload);
  if (!prefix) {
    return preRenderable({
      receivedCharacters: artifact.payload.length,
      hint: "waiting for <svg> opening tag",
    });
  }
  return renderable(prefix);
}

export function latexRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  const trimmed = trimTrailingIncompleteLatex(artifact.payload);
  if (!trimmed) {
    return preRenderable({
      receivedCharacters: artifact.payload.length,
      hint: "waiting for first complete token",
    });
  }
  return renderable(trimmed);
}

export function codeRefine(artifact: AnyArtifact): RefinedPayload {
  if (!artifact.payload) {
    return preRenderable({
      receivedCharacters: 0,
      hint: "waiting for source",
    });
  }
  return renderable(artifact.payload);
}

export function longestValidJsonPrefix(source: string): string | undefined {
  if (!source.trim()) {
    return undefined;
  }

  if (isValidJson(source)) {
    return source;
  }

  const partial = salvagePartialJson(source);
  if (partial && isValidJson(partial)) {
    return partial;
  }

  const candidates = collectJsonCandidateEnds(source);
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = source.slice(0, candidates[index]);
    if (isValidJson(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function salvagePartialJson(source: string): string | undefined {
  const trimmed = source.trimStart();
  if (trimmed.startsWith("{")) {
    return salvagePartialObject(trimmed);
  }
  if (trimmed.startsWith("[")) {
    return salvagePartialArray(trimmed);
  }
  return undefined;
}

function salvagePartialObject(source: string): string | undefined {
  let index = 1;
  const pairs: string[] = [];

  while (index < source.length) {
    index = skipJsonWhitespace(source, index);
    if (source[index] === "}") {
      break;
    }
    if (source[index] !== "\"") {
      break;
    }

    const keyEnd = scanJsonStringEnd(source, index);
    if (keyEnd === undefined) {
      break;
    }
    const key = source.slice(index, keyEnd);
    index = skipJsonWhitespace(source, keyEnd);
    if (source[index] !== ":") {
      break;
    }
    index = skipJsonWhitespace(source, index + 1);

    const valueEnd = scanJsonValueEnd(source, index);
    if (valueEnd === undefined) {
      break;
    }
    const value = source.slice(index, valueEnd);
    const pair = `${key}:${value}`;
    if (!isValidJson(`{${pair}}`)) {
      break;
    }
    pairs.push(pair);

    index = skipJsonWhitespace(source, valueEnd);
    if (source[index] === ",") {
      index += 1;
      continue;
    }
    if (source[index] === "}") {
      break;
    }
    break;
  }

  return pairs.length > 0 ? `{${pairs.join(",")}}` : undefined;
}

function salvagePartialArray(source: string): string | undefined {
  let index = 1;
  const values: string[] = [];

  while (index < source.length) {
    index = skipJsonWhitespace(source, index);
    if (source[index] === "]") {
      break;
    }

    const valueEnd = scanJsonValueEnd(source, index);
    if (valueEnd === undefined) {
      break;
    }
    const value = source.slice(index, valueEnd);
    if (!isValidJson(`[${value}]`)) {
      break;
    }
    values.push(value);

    index = skipJsonWhitespace(source, valueEnd);
    if (source[index] === ",") {
      index += 1;
      continue;
    }
    if (source[index] === "]") {
      break;
    }
    break;
  }

  return values.length > 0 ? `[${values.join(",")}]` : undefined;
}

function scanJsonValueEnd(source: string, start: number): number | undefined {
  const char = source[start];
  if (char === "\"") {
    return scanJsonStringEnd(source, start);
  }
  if (char === "{" || char === "[") {
    return scanBalancedJsonEnd(source, start);
  }

  const rest = source.slice(start);
  for (const literal of ["true", "false", "null"]) {
    if (rest.startsWith(literal)) {
      return start + literal.length;
    }
  }

  const numberMatch = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(rest);
  if (!numberMatch) {
    return undefined;
  }
  const end = start + numberMatch[0].length;
  const next = source[end];
  return next === undefined || /[\s,\]}]/.test(next) ? end : undefined;
}

function scanJsonStringEnd(source: string, start: number): number | undefined {
  let escaped = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "\"") {
      return index + 1;
    }
  }
  return undefined;
}

function scanBalancedJsonEnd(source: string, start: number): number | undefined {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
    } else if (char === "}" || char === "]") {
      const expected = stack.pop();
      if (expected !== char) {
        return undefined;
      }
      if (stack.length === 0) {
        return index + 1;
      }
    }
  }

  return undefined;
}

function skipJsonWhitespace(source: string, start: number): number {
  let index = start;
  while (index < source.length && /\s/.test(source[index] ?? "")) {
    index += 1;
  }
  return index;
}

function collectJsonCandidateEnds(source: string): number[] {
  const candidates: number[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
        if (depth === 0) {
          candidates.push(index + 1);
        }
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0) {
        candidates.push(index + 1);
      }
      if (depth < 0) {
        break;
      }
    } else if (depth === 0 && /[\s,]/.test(char)) {
      const candidate = source.slice(0, index).trimEnd();
      if (candidate) {
        candidates.push(candidate.length);
      }
    }
  }

  return [...new Set(candidates)].sort((left, right) => left - right);
}

function isValidJson(source: string): boolean {
  try {
    JSON.parse(source);
    return true;
  } catch {
    return false;
  }
}

export function longestValidCsvPrefix(source: string): string | undefined {
  let state: "between" | "inField" | "inQuotedField" | "maybeEscapedQuote" =
    "between";
  let lastRowEnd: number | undefined;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    switch (state) {
      case "between":
        if (char === "\"") {
          state = "inQuotedField";
        } else if (char === ",") {
          state = "between";
        } else if (char === "\n") {
          lastRowEnd = index;
          state = "between";
        } else if (char !== "\r") {
          state = "inField";
        }
        break;
      case "inField":
        if (char === ",") {
          state = "between";
        } else if (char === "\n") {
          lastRowEnd = index;
          state = "between";
        }
        break;
      case "inQuotedField":
        if (char === "\"") {
          state = "maybeEscapedQuote";
        }
        break;
      case "maybeEscapedQuote":
        if (char === "\"") {
          state = "inQuotedField";
        } else if (char === ",") {
          state = "between";
        } else if (char === "\n") {
          lastRowEnd = index;
          state = "between";
        } else if (char !== "\r") {
          state = "inField";
        }
        break;
    }
  }

  if (lastRowEnd === undefined) {
    return undefined;
  }

  let end = lastRowEnd;
  if (end > 0 && source[end - 1] === "\r") {
    end -= 1;
  }

  return end > 0 ? source.slice(0, end) : undefined;
}

export function longestValidHtmlPrefix(source: string): string | undefined {
  let index = 0;
  let lastCompleted = 0;

  while (index < source.length) {
    const char = source[index];
    if (char !== "<") {
      index += 1;
      lastCompleted = index;
      continue;
    }

    const next = source[index + 1];
    if (next && !/[A-Za-z/!?]/.test(next)) {
      index += 1;
      lastCompleted = index;
      continue;
    }

    const remaining = source.slice(index);
    if (remaining.startsWith("<!--")) {
      const close = source.indexOf("-->", index + 4);
      if (close < 0) break;
      index = close + 3;
      lastCompleted = index;
      continue;
    }

    if (remaining.startsWith("<![CDATA[")) {
      const close = source.indexOf("]]>", index + 9);
      if (close < 0) break;
      index = close + 3;
      lastCompleted = index;
      continue;
    }

    if (remaining.startsWith("<?")) {
      const close = source.indexOf("?>", index + 2);
      if (close < 0) break;
      index = close + 2;
      lastCompleted = index;
      continue;
    }

    const tagEnd = scanToClosingAngle(source, index);
    if (tagEnd === undefined) {
      break;
    }

    const tag = source.slice(index, tagEnd + 1);
    const afterTag = tagEnd + 1;
    if (!tag.startsWith("</")) {
      const name = extractStartTagName(tag).toLowerCase();
      const isSelfClosing = tag.slice(0, -1).trimEnd().endsWith("/");
      if (!isSelfClosing && rawTextElements.has(name)) {
        const closeRange = findRawTextCloseTag(name, source, afterTag);
        if (!closeRange) {
          break;
        }
        index = closeRange.end;
        lastCompleted = index;
        continue;
      }
    }

    index = afterTag;
    lastCompleted = index;
  }

  return lastCompleted === 0 ? undefined : source.slice(0, lastCompleted);
}

const rawTextElements = new Set([
  "script",
  "style",
  "textarea",
  "title",
  "noscript",
  "iframe",
]);

export function longestValidSvgPrefix(source: string): string | undefined {
  const svgStart = source.toLowerCase().indexOf("<svg");
  if (svgStart < 0) {
    return undefined;
  }

  const openTagEnd = scanToClosingAngle(source, svgStart + 4);
  if (openTagEnd === undefined) {
    return undefined;
  }

  if (source[openTagEnd - 1] === "/") {
    return source.slice(svgStart, openTagEnd + 1);
  }

  const openTag = source.slice(svgStart, openTagEnd + 1);
  const contentStart = openTagEnd + 1;
  const result = walkSvg(source, contentStart);
  const content = source.slice(contentStart, result.lastCompleted);

  if (result.rootClosed) {
    return `${openTag}${content}`;
  }

  return `${openTag}${content}</svg>`;
}

function walkSvg(
  source: string,
  start: number,
): { lastCompleted: number; rootClosed: boolean } {
  const stack: string[] = [];
  let lastCompleted = start;
  let index = start;

  while (index < source.length) {
    if (source[index] !== "<") {
      index += 1;
      continue;
    }

    const remaining = source.slice(index);
    if (remaining.startsWith("<!--")) {
      const close = source.indexOf("-->", index + 4);
      if (close < 0) break;
      index = close + 3;
      if (stack.length === 0) lastCompleted = index;
      continue;
    }

    if (remaining.startsWith("<![CDATA[")) {
      const close = source.indexOf("]]>", index + 9);
      if (close < 0) break;
      index = close + 3;
      if (stack.length === 0) lastCompleted = index;
      continue;
    }

    if (remaining.startsWith("<?")) {
      const close = source.indexOf("?>", index + 2);
      if (close < 0) break;
      index = close + 2;
      if (stack.length === 0) lastCompleted = index;
      continue;
    }

    const tagEnd = scanToClosingAngle(source, index);
    if (tagEnd === undefined) {
      break;
    }

    const tag = source.slice(index, tagEnd + 1);
    const afterTag = tagEnd + 1;
    if (tag.startsWith("</")) {
      const name = extractEndTagName(tag).toLowerCase();
      if (stack.length === 0) {
        if (name === "svg") {
          return { lastCompleted: afterTag, rootClosed: true };
        }
        break;
      }
      if (stack[stack.length - 1] !== name) {
        break;
      }
      stack.pop();
      if (stack.length === 0) {
        lastCompleted = afterTag;
      }
      index = afterTag;
      continue;
    }

    if (tag.slice(0, -1).trimEnd().endsWith("/")) {
      if (stack.length === 0) {
        lastCompleted = afterTag;
      }
      index = afterTag;
      continue;
    }

    const name = extractStartTagName(tag).toLowerCase();
    if (!name) {
      break;
    }
    stack.push(name);
    index = afterTag;
  }

  return { lastCompleted, rootClosed: false };
}

function scanToClosingAngle(source: string, start: number): number | undefined {
  let quote: string | undefined;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote) {
        quote = undefined;
      }
    } else if (char === "\"" || char === "'") {
      quote = char;
    } else if (char === ">") {
      return index;
    }
  }
  return undefined;
}

function extractStartTagName(tag: string): string {
  const match = /^<([^\s/>]+)/.exec(tag);
  return match?.[1] ?? "";
}

function extractEndTagName(tag: string): string {
  const match = /^<\/([^\s>]+)/.exec(tag);
  return match?.[1] ?? "";
}

function findRawTextCloseTag(
  name: string,
  source: string,
  start: number,
): { start: number; end: number } | undefined {
  const pattern = `</${name}`;
  let searchStart = start;

  while (searchStart < source.length) {
    const prefixStart = source.toLowerCase().indexOf(pattern, searchStart);
    if (prefixStart < 0) {
      return undefined;
    }
    const afterName = prefixStart + pattern.length;
    const boundary = source[afterName];
    if (boundary && !/[>\s/]/.test(boundary)) {
      searchStart = prefixStart + 1;
      continue;
    }
    const close = scanToClosingAngle(source, afterName);
    if (close === undefined) {
      return undefined;
    }
    return { start: prefixStart, end: close + 1 };
  }

  return undefined;
}

export function trimTrailingIncompleteLatex(source: string): string {
  let depth = 0;
  let lastBalanced = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth = Math.max(0, depth - 1);
    }
    if (depth === 0) {
      lastBalanced = index + 1;
    }
  }

  let prefix = source.slice(0, lastBalanced);
  const backslash = prefix.lastIndexOf("\\");
  if (backslash >= 0) {
    const suffix = prefix.slice(backslash + 1);
    if (suffix.length > 0 && /^[A-Za-z]+$/.test(suffix)) {
      prefix = prefix.slice(0, backslash);
    }
  }

  return prefix;
}
