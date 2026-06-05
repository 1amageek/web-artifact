import { describe, expect, it } from "vitest";
import {
  ArtifactParseError,
  ArtifactStreamParserCore,
  getMessageArtifacts,
  getMessagePlainText,
  parseArtifactMessage,
  parseOneArtifact,
} from "../src";

describe("Artifact parser", () => {
  it("parses plain text only", () => {
    const message = parseArtifactMessage("No artifacts here.");
    expect(message.segments).toHaveLength(1);
    expect(message.segments[0]).toMatchObject({
      kind: "text",
      text: "No artifacts here.",
    });
    expect(getMessagePlainText(message)).toBe("No artifacts here.");
  });

  it("parses a single artifact with metadata and decoded attributes", () => {
    const artifact = parseOneArtifact(
      '<artifact type="text/markdown" identifier="m1" title="A &amp; B" data-label="&lt;ok&gt;"># Hi</artifact>',
    );

    expect(artifact).toEqual({
      id: "m1",
      type: "text/markdown",
      title: "A & B",
      attributes: {
        "data-label": "<ok>",
      },
      payload: "# Hi",
      isComplete: true,
    });
  });

  it("parses quoted greater-than signs in open tag attributes", () => {
    const artifact = parseOneArtifact(
      '<artifact type="text/html" identifier="h" title="A > B" data-rule="x > y"><p>ok</p></artifact>',
    );

    expect(artifact).toMatchObject({
      id: "h",
      type: "text/html",
      title: "A > B",
      attributes: {
        "data-rule": "x > y",
      },
      payload: "<p>ok</p>",
      isComplete: true,
    });
  });

  it("parses multiple artifacts with interleaved text", () => {
    const message = parseArtifactMessage(
      'Before <artifact type="application/json" identifier="j">{"ok":true}</artifact> middle <artifact type="text/csv" identifier="c">a,b\n1,2</artifact> after',
    );

    expect(message.segments.map((segment) => segment.kind)).toEqual([
      "text",
      "artifact",
      "text",
      "artifact",
      "text",
    ]);
    expect(getMessageArtifacts(message).map((artifact) => artifact.id)).toEqual([
      "j",
      "c",
    ]);
  });

  it("throws when parseOne has no artifact", () => {
    expect(() => parseOneArtifact("plain")).toThrow(ArtifactParseError);
  });

  it("treats malformed open tags as text", () => {
    const message = parseArtifactMessage(
      '<artifact identifier="missing-type">body</artifact>',
    );
    expect(message.segments).toHaveLength(1);
    expect(message.segments[0]).toMatchObject({
      kind: "text",
      text: '<artifact identifier="missing-type">body</artifact>',
    });
  });

  it("throws on unterminated artifacts", () => {
    expect(() =>
      parseArtifactMessage('<artifact type="text/html" identifier="h">open'),
    ).toThrow(/not closed/);
  });
});

describe("Artifact streaming parser", () => {
  it("emits text, opened, delta, and closed events in order", () => {
    const parser = new ArtifactStreamParserCore("message");
    const events = parser.feedEvents(
      'Hi <artifact type="text/markdown" identifier="m"># A</artifact>',
    );

    expect(events.map((event) => event.kind)).toEqual([
      "text",
      "opened",
      "delta",
      "closed",
    ]);
    const snapshot = parser.snapshot();
    expect(snapshot.segments).toHaveLength(2);
    expect(getMessageArtifacts(snapshot)[0]).toMatchObject({
      id: "m",
      payload: "# A",
      isComplete: true,
    });
  });

  it("handles an open marker split across chunks", () => {
    const parser = new ArtifactStreamParserCore("message");
    parser.feed("Before <arti");
    parser.feed('fact type="application/json" identifier="j">');
    parser.feed('{"a":1}');
    parser.feed("</artifact>");

    const artifact = getMessageArtifacts(parser.snapshot())[0];
    expect(artifact).toMatchObject({
      id: "j",
      type: "application/json",
      payload: '{"a":1}',
      isComplete: true,
    });
  });

  it("holds back a close marker split across chunks", () => {
    const parser = new ArtifactStreamParserCore("message");
    parser.feed('<artifact type="text/html" identifier="h">body</arti');
    let artifact = getMessageArtifacts(parser.snapshot())[0];
    expect(artifact.payload).toBe("body");
    expect(artifact.isComplete).toBe(false);

    parser.feed("fact>");
    artifact = getMessageArtifacts(parser.snapshot())[0];
    expect(artifact.payload).toBe("body");
    expect(artifact.isComplete).toBe(true);
  });

  it("resets streaming state", () => {
    const parser = new ArtifactStreamParserCore("message");
    parser.feed('<artifact type="text/html">body');
    parser.reset();
    expect(parser.snapshot().segments).toEqual([]);
  });
});
