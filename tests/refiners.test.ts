import { describe, expect, it } from "vitest";
import type { AnyArtifact } from "../src";
import {
  csvRefine,
  htmlRefine,
  jsonRefine,
  latexRefine,
  longestValidSvgPrefix,
  markdownRefine,
  svgRefine,
} from "../src";

function artifact(payload: string, isComplete = false): AnyArtifact {
  return {
    id: "a",
    type: "application/test",
    title: "",
    attributes: {},
    payload,
    isComplete,
  };
}

describe("renderer refiners", () => {
  it("returns complete JSON payload verbatim", () => {
    expect(jsonRefine(artifact('{"a":1}', true))).toEqual({
      state: "renderable",
      payload: '{"a":1}',
    });
  });

  it("salvages completed pairs from a partial JSON object", () => {
    expect(jsonRefine(artifact('{"a":1,"b":"ok","c":'))).toEqual({
      state: "renderable",
      payload: '{"a":1,"b":"ok"}',
    });
  });

  it("does not emit invalid JSON before a safe prefix exists", () => {
    const result = jsonRefine(artifact('{"a":'));
    expect(result.state).toBe("preRenderable");
  });

  it("trims CSV at the last unquoted newline", () => {
    const result = csvRefine(artifact('name,bio\n"Alice","loves\nhiking"\nBob,'));
    expect(result).toEqual({
      state: "renderable",
      payload: 'name,bio\n"Alice","loves\nhiking"',
    });
  });

  it("waits for a first CSV row boundary", () => {
    expect(csvRefine(artifact("a,b,c")).state).toBe("preRenderable");
  });

  it("trims HTML incomplete trailing tags", () => {
    expect(htmlRefine(artifact('<p>Hi</p><div class="hea'))).toEqual({
      state: "renderable",
      payload: "<p>Hi</p>",
    });
  });

  it("drops unclosed raw text blocks in HTML", () => {
    expect(htmlRefine(artifact("<p>Hi</p><script>window.x ="))).toEqual({
      state: "renderable",
      payload: "<p>Hi</p>",
    });
  });

  it("treats less-than text as text in HTML", () => {
    expect(htmlRefine(artifact("Less than < 5"))).toEqual({
      state: "renderable",
      payload: "Less than < 5",
    });
  });

  it("waits for a complete SVG open tag", () => {
    expect(svgRefine(artifact("<svg viewBox=\"0 0")).state).toBe("preRenderable");
  });

  it("synthesizes a root close for partial SVG", () => {
    expect(longestValidSvgPrefix("<svg><circle cx=\"4\" /></sv")).toBe(
      '<svg><circle cx="4" /></svg>',
    );
  });

  it("tracks nested SVG elements by depth", () => {
    expect(
      longestValidSvgPrefix("<svg><g><g><circle /></g></g><rect"),
    ).toBe("<svg><g><g><circle /></g></g></svg>");
  });

  it("trims Markdown at the last newline", () => {
    expect(markdownRefine(artifact("## Title\npartial"))).toEqual({
      state: "renderable",
      payload: "## Title",
    });
  });

  it("waits for the first complete Markdown line", () => {
    expect(markdownRefine(artifact("partial")).state).toBe("preRenderable");
  });

  it("trims dangling LaTeX commands and unbalanced braces", () => {
    expect(latexRefine(artifact("\\frac{a}{b} \\sqr"))).toEqual({
      state: "renderable",
      payload: "\\frac{a}{b} ",
    });
    expect(latexRefine(artifact("x + {y"))).toEqual({
      state: "renderable",
      payload: "x + ",
    });
  });
});
