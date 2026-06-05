import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnyArtifact } from "../src";
import {
  ArtifactProvider,
  ArtifactView,
  artifactTypes,
  createDefaultRenderers,
  csvRenderer,
  htmlSandboxRenderer,
  jsonRenderer,
  latexSandboxRenderer,
  mermaidSandboxRenderer,
  reactSandboxRenderer,
  reactShell,
  svgRenderer,
  vegaLiteSandboxRenderer,
  vegaLiteShell,
} from "../src";

function artifact(input: Partial<AnyArtifact>): AnyArtifact {
  return {
    id: "a",
    type: "application/test",
    title: "",
    attributes: {},
    payload: "",
    isComplete: true,
    ...input,
  };
}

describe("basic renderers", () => {
  it("pretty-prints JSON", () => {
    render(
      <ArtifactProvider renderers={[jsonRenderer]}>
        <ArtifactView
          artifact={artifact({
            type: artifactTypes.json,
            payload: '{"z":2,"a":1}',
          })}
        />
      </ArtifactProvider>,
    );

    expect(screen.getByText(/"z": 2/)).toBeInTheDocument();
    expect(screen.getByText(/"a": 1/)).toBeInTheDocument();
  });

  it("renders CSV as a typed table", () => {
    render(
      <ArtifactProvider renderers={[csvRenderer]}>
        <ArtifactView
          artifact={artifact({
            type: artifactTypes.csv,
            payload: "name,score\nAlice,12\nBob,9",
          })}
        />
      </ArtifactProvider>,
    );

    expect(screen.getByRole("columnheader", { name: "name" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "12" })).toHaveAttribute(
      "data-kind",
      "number",
    );
  });

  it("renders SVG through a data URL image", () => {
    render(
      <ArtifactProvider renderers={[svgRenderer]}>
        <ArtifactView
          artifact={artifact({
            type: artifactTypes.svg,
            title: "Logo",
            payload: "<svg><circle /></svg>",
          })}
        />
      </ArtifactProvider>,
    );

    const image = screen.getByRole("img", { name: "Logo" });
    expect(image).toHaveAttribute("src", expect.stringContaining("data:image/svg+xml"));
  });
});

describe("sandbox renderers", () => {
  it("passes only refined HTML payload into the sandbox", () => {
    render(
      <ArtifactProvider renderers={[htmlSandboxRenderer]}>
        <ArtifactView
          artifact={artifact({
            type: artifactTypes.html,
            payload: "<p>safe</p><script>unterminated",
            isComplete: false,
          })}
        />
      </ArtifactProvider>,
    );

    const frame = screen.getByTitle("HTML artifact");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame.getAttribute("srcdoc")).toBe("<p>safe</p>");
  });

  it("waits for complete React payload", () => {
    render(
      <ArtifactProvider renderers={[reactSandboxRenderer]}>
        <ArtifactView
          artifact={artifact({
            type: artifactTypes.react,
            payload: "function App() { return <div />",
            isComplete: false,
          })}
        />
      </ArtifactProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "waiting for complete JSX source",
    );
    expect(screen.queryByTitle("React artifact")).not.toBeInTheDocument();
  });

  it("creates React, Vega-Lite, and default sandbox frames", () => {
    const reactArtifact = artifact({
      type: artifactTypes.react,
      title: "Counter.jsx",
      payload: "function App(){ return <button>Click</button> }",
    });
    const vegaArtifact = artifact({
      type: artifactTypes.vegaLite,
      title: "Chart",
      payload: '{"mark":"bar","data":{"values":[]}}',
    });

    const { rerender } = render(
      <ArtifactProvider renderers={createDefaultRenderers()}>
        <ArtifactView artifact={reactArtifact} />
      </ArtifactProvider>,
    );
    expect(screen.getByTitle("Counter.jsx").getAttribute("srcdoc")).toContain(
      "ReactDOM.createRoot",
    );

    rerender(
      <ArtifactProvider renderers={[vegaLiteSandboxRenderer]}>
        <ArtifactView artifact={vegaArtifact} />
      </ArtifactProvider>,
    );
    expect(screen.getByTitle("Chart").getAttribute("srcdoc")).toContain(
      "vegaEmbed",
    );
  });

  it("normalizes React export default payloads", () => {
    const shell = reactShell("export default function App(){ return <div /> }");
    expect(shell).toContain("exports.default = function App()");
    expect(shell).not.toContain("export default function");
  });

  it("passes Vega-Lite specs through JSON.parse instead of direct code execution", () => {
    const shell = vegaLiteShell('{"mark":"bar","title":"</script>"};window.__pwned=1');
    expect(shell).toContain("JSON.parse");
    expect(shell).toContain("\\u003C");
    expect(shell).not.toContain('const spec = {"mark":"bar"};window.__pwned=1');
  });

  it("creates Mermaid and LaTeX sandbox frames", () => {
    const mermaidArtifact = artifact({
      type: artifactTypes.mermaid,
      title: "Flow",
      payload: "flowchart LR\nA-->B\n",
    });
    const latexArtifact = artifact({
      type: artifactTypes.latex,
      title: "Formula",
      payload: "\\frac{a}{b}",
    });

    const { rerender } = render(
      <ArtifactProvider renderers={[mermaidSandboxRenderer]}>
        <ArtifactView artifact={mermaidArtifact} />
      </ArtifactProvider>,
    );
    expect(screen.getByTitle("Flow").getAttribute("srcdoc")).toContain(
      "mermaid.render",
    );

    rerender(
      <ArtifactProvider renderers={[latexSandboxRenderer]}>
        <ArtifactView artifact={latexArtifact} />
      </ArtifactProvider>,
    );
    expect(screen.getByTitle("Formula").getAttribute("srcdoc")).toContain(
      "katex.render",
    );
  });
});
