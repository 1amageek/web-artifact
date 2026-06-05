export type ArtifactType = string;
export type ArtifactIdentifier = string;

export interface AnyArtifact {
  id: ArtifactIdentifier;
  type: ArtifactType;
  title: string;
  attributes: Record<string, string>;
  payload: string;
  isComplete: boolean;
}

export type ArtifactSegment =
  | {
      kind: "text";
      id: string;
      text: string;
    }
  | {
      kind: "artifact";
      id: string;
      artifact: AnyArtifact;
    };

export interface ArtifactMessage {
  id: string;
  segments: ArtifactSegment[];
}

export type ArtifactStreamEvent =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "opened";
      artifact: AnyArtifact;
    }
  | {
      kind: "delta";
      id: ArtifactIdentifier;
      chunk: string;
    }
  | {
      kind: "closed";
      id: ArtifactIdentifier;
    };

export type ArtifactParseErrorCode =
  | "noArtifactFound"
  | "unterminatedArtifact"
  | "malformedOpenTag"
  | "missingRequiredAttribute";

export class ArtifactParseError extends Error {
  readonly code: ArtifactParseErrorCode;
  readonly details?: string;

  constructor(code: ArtifactParseErrorCode, message: string, details?: string) {
    super(message);
    this.name = "ArtifactParseError";
    this.code = code;
    this.details = details;
  }
}

export function createArtifact(
  input: Partial<AnyArtifact> & Pick<AnyArtifact, "id" | "type">,
): AnyArtifact {
  return {
    title: "",
    attributes: {},
    payload: "",
    isComplete: false,
    ...input,
  };
}

export function createMessage(segments: ArtifactSegment[] = []): ArtifactMessage {
  return {
    id: createId(),
    segments,
  };
}

export function textSegment(text: string): ArtifactSegment {
  return {
    kind: "text",
    id: `text:${stableHash(text)}`,
    text,
  };
}

export function artifactSegment(artifact: AnyArtifact): ArtifactSegment {
  return {
    kind: "artifact",
    id: `artifact:${artifact.id}`,
    artifact,
  };
}

export function createId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") {
    return randomUUID.call(globalThis.crypto);
  }
  return `artifact-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

export function getMessageArtifacts(message: ArtifactMessage): AnyArtifact[] {
  return message.segments.flatMap((segment) =>
    segment.kind === "artifact" ? [segment.artifact] : [],
  );
}

export function getMessagePlainText(message: ArtifactMessage): string {
  return message.segments
    .flatMap((segment) => (segment.kind === "text" ? [segment.text] : []))
    .join("");
}
