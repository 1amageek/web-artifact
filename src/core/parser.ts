import {
  ArtifactParseError,
  type AnyArtifact,
  type ArtifactIdentifier,
  type ArtifactMessage,
  type ArtifactSegment,
  type ArtifactStreamEvent,
  artifactSegment,
  createId,
  textSegment,
} from "./types";

const openMarker = "<artifact";
const closeMarker = "</artifact>";

interface ParsedOpenTag {
  identifier: ArtifactIdentifier;
  type: string;
  title: string;
  attributes: Record<string, string>;
}

export class ArtifactStreamParserCore {
  private inputBuffer = "";
  private committedSegments: ArtifactSegment[] = [];
  private pendingText = "";
  private current: AnyArtifact | undefined;

  constructor(private readonly messageId: string = createId()) {}

  feed(chunk: string): ArtifactMessage {
    this.feedEvents(chunk);
    return this.snapshot();
  }

  feedEvents(chunk: string): ArtifactStreamEvent[] {
    this.inputBuffer += chunk;
    return this.drain();
  }

  reset(): void {
    this.inputBuffer = "";
    this.committedSegments = [];
    this.pendingText = "";
    this.current = undefined;
  }

  finalize(): ArtifactMessage {
    if (this.current) {
      throw new ArtifactParseError(
        "unterminatedArtifact",
        `Artifact "${this.current.id}" was not closed before end of input.`,
        this.current.id,
      );
    }

    if (this.inputBuffer.length > 0) {
      this.pendingText += this.inputBuffer;
      this.inputBuffer = "";
    }

    this.commitPendingText();
    return {
      id: this.messageId,
      segments: [...this.committedSegments],
    };
  }

  snapshot(): ArtifactMessage {
    const segments = [...this.committedSegments];
    if (this.pendingText.length > 0) {
      segments.push(textSegment(this.pendingText));
    }
    if (this.current) {
      segments.push(artifactSegment(this.current));
    }
    return {
      id: this.messageId,
      segments,
    };
  }

  private drain(): ArtifactStreamEvent[] {
    const events: ArtifactStreamEvent[] = [];

    while (true) {
      const advanced = this.current
        ? this.stepInsideArtifact(events)
        : this.stepText(events);
      if (!advanced) {
        break;
      }
    }

    return events;
  }

  private stepText(events: ArtifactStreamEvent[]): boolean {
    if (this.inputBuffer.length === 0) {
      return false;
    }

    const openIndex = this.inputBuffer.indexOf(openMarker);
    if (openIndex >= 0) {
      if (openIndex > 0) {
        const prefix = this.inputBuffer.slice(0, openIndex);
        this.appendText(prefix, events);
        this.inputBuffer = this.inputBuffer.slice(openIndex);
      }

      const tagEnd = scanToClosingAngle(this.inputBuffer, openMarker.length);
      if (tagEnd < 0) {
        return false;
      }

      const openTagString = this.inputBuffer.slice(0, tagEnd + 1);
      this.inputBuffer = this.inputBuffer.slice(tagEnd + 1);

      const parsed = parseOpenTag(openTagString);
      if (parsed) {
        this.commitPendingText();
        const artifact: AnyArtifact = {
          id: parsed.identifier,
          type: parsed.type,
          title: parsed.title,
          attributes: parsed.attributes,
          payload: "",
          isComplete: false,
        };
        this.current = artifact;
        events.push({ kind: "opened", artifact });
      } else {
        this.appendText(openTagString, events);
      }
      return true;
    }

    const partial = longestPartialMatch(this.inputBuffer, openMarker);
    const safeCount = this.inputBuffer.length - partial;
    if (safeCount > 0) {
      const safe = this.inputBuffer.slice(0, safeCount);
      this.appendText(safe, events);
      this.inputBuffer = this.inputBuffer.slice(safeCount);
    }

    return false;
  }

  private stepInsideArtifact(events: ArtifactStreamEvent[]): boolean {
    const artifact = this.current;
    if (!artifact || this.inputBuffer.length === 0) {
      return false;
    }

    const closeIndex = this.inputBuffer.indexOf(closeMarker);
    if (closeIndex >= 0) {
      let nextArtifact = artifact;
      if (closeIndex > 0) {
        const chunk = this.inputBuffer.slice(0, closeIndex);
        nextArtifact = appendPayload(nextArtifact, chunk);
        events.push({ kind: "delta", id: nextArtifact.id, chunk });
      }

      this.inputBuffer = this.inputBuffer.slice(closeIndex + closeMarker.length);
      const completed = completeArtifact(nextArtifact);
      this.committedSegments.push(artifactSegment(completed));
      events.push({ kind: "closed", id: completed.id });
      this.current = undefined;
      return true;
    }

    const partial = longestPartialMatch(this.inputBuffer, closeMarker);
    const safeCount = this.inputBuffer.length - partial;
    if (safeCount > 0) {
      const chunk = this.inputBuffer.slice(0, safeCount);
      const nextArtifact = appendPayload(artifact, chunk);
      this.current = nextArtifact;
      events.push({ kind: "delta", id: nextArtifact.id, chunk });
      this.inputBuffer = this.inputBuffer.slice(safeCount);
    }

    return false;
  }

  private appendText(value: string, events: ArtifactStreamEvent[]): void {
    if (value.length === 0) {
      return;
    }
    this.pendingText += value;
    events.push({ kind: "text", text: value });
  }

  private commitPendingText(): void {
    if (this.pendingText.length === 0) {
      return;
    }
    this.committedSegments.push(textSegment(this.pendingText));
    this.pendingText = "";
  }
}

export function parseArtifactMessage(source: string): ArtifactMessage {
  const parser = new ArtifactStreamParserCore();
  parser.feed(source);
  return parser.finalize();
}

export function parseOneArtifact(source: string): AnyArtifact {
  const message = parseArtifactMessage(source);
  const artifact = message.segments.find((segment) => segment.kind === "artifact");
  if (!artifact || artifact.kind !== "artifact") {
    throw new ArtifactParseError("noArtifactFound", "No artifact tag was found.");
  }
  return artifact.artifact;
}

export function parseOpenTag(raw: string): ParsedOpenTag | undefined {
  if (!raw.startsWith(openMarker) || !raw.endsWith(">")) {
    return undefined;
  }

  let body = raw.slice(openMarker.length, -1);
  if (body.endsWith("/")) {
    body = body.slice(0, -1);
  }

  const attributes = scanAttributes(body);
  const type = attributes.type;
  if (!type) {
    return undefined;
  }

  delete attributes.type;
  const identifier = attributes.identifier || createId();
  delete attributes.identifier;
  const title = attributes.title || "";
  delete attributes.title;

  return {
    identifier,
    type,
    title,
    attributes,
  };
}

function scanAttributes(input: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  let index = 0;

  while (index < input.length) {
    index = skipWhitespace(input, index);
    if (index >= input.length) {
      break;
    }

    const keyStart = index;
    while (index < input.length && !/[\s=/>]/.test(input[index] ?? "")) {
      index += 1;
    }
    const key = input.slice(keyStart, index);
    if (!key) {
      index += 1;
      continue;
    }

    index = skipWhitespace(input, index);
    if (input[index] !== "=") {
      attributes[key] = "";
      continue;
    }
    index += 1;
    index = skipWhitespace(input, index);

    const quote = input[index];
    if (quote === "\"" || quote === "'") {
      index += 1;
      const valueStart = index;
      while (index < input.length && input[index] !== quote) {
        index += 1;
      }
      attributes[key] = decodeXmlEntities(input.slice(valueStart, index));
      if (input[index] === quote) {
        index += 1;
      }
    } else {
      const valueStart = index;
      while (index < input.length && !/[\s>]/.test(input[index] ?? "")) {
        index += 1;
      }
      attributes[key] = decodeXmlEntities(input.slice(valueStart, index));
    }
  }

  return attributes;
}

function skipWhitespace(input: string, start: number): number {
  let index = start;
  while (index < input.length && /\s/.test(input[index] ?? "")) {
    index += 1;
  }
  return index;
}

function scanToClosingAngle(input: string, start: number): number {
  let quote: string | undefined;
  for (let index = start; index < input.length; index += 1) {
    const char = input[index];
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
  return -1;
}

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g,
    (match, entity: string) => {
      switch (entity) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return "\"";
        case "apos":
          return "'";
        default:
          if (entity.startsWith("#x")) {
            return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
          }
          if (entity.startsWith("#")) {
            return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
          }
          return match;
      }
    },
  );
}

function longestPartialMatch(value: string, marker: string): number {
  const maxLength = Math.min(value.length, marker.length - 1);
  for (let length = maxLength; length > 0; length -= 1) {
    if (marker.startsWith(value.slice(value.length - length))) {
      return length;
    }
  }
  return 0;
}

function appendPayload(artifact: AnyArtifact, chunk: string): AnyArtifact {
  return {
    ...artifact,
    payload: artifact.payload + chunk,
  };
}

function completeArtifact(artifact: AnyArtifact): AnyArtifact {
  return {
    ...artifact,
    isComplete: true,
  };
}
