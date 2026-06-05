import { artifactTypes } from "../../core/knownTypes";
import type { ArtifactRenderer } from "../../renderer/types";
import {
  completeOnlyRefine,
  htmlRefine,
  latexRefine,
  markdownRefine,
} from "../basic/refiners";
import { SandboxFrame } from "./SandboxFrame";
import {
  htmlShell,
  latexShell,
  mermaidShell,
  reactShell,
  vegaLiteShell,
} from "./shells";

export const htmlSandboxRenderer: ArtifactRenderer = {
  id: "sandbox-html",
  artifactTypes: [artifactTypes.html],
  refine: htmlRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "sandbox",
  },
  Component({ artifact, payload }) {
    return (
      <SandboxFrame
        title={artifact.title || "HTML artifact"}
        srcDoc={htmlShell(payload)}
      />
    );
  },
};

export const reactSandboxRenderer: ArtifactRenderer = {
  id: "sandbox-react",
  artifactTypes: [artifactTypes.react],
  refine: (artifact) => completeOnlyRefine(
    artifact,
    "waiting for complete JSX source",
  ),
  chrome: {
    preferredContentInsets: "none",
    surface: "sandbox",
  },
  Component({ artifact, payload }) {
    return (
      <SandboxFrame
        title={artifact.title || "React artifact"}
        srcDoc={reactShell(payload)}
      />
    );
  },
};

export const mermaidSandboxRenderer: ArtifactRenderer = {
  id: "sandbox-mermaid",
  artifactTypes: [artifactTypes.mermaid],
  refine: markdownRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "sandbox",
  },
  Component({ artifact, payload }) {
    return (
      <SandboxFrame
        title={artifact.title || "Mermaid artifact"}
        srcDoc={mermaidShell(payload)}
      />
    );
  },
};

export const latexSandboxRenderer: ArtifactRenderer = {
  id: "sandbox-latex",
  artifactTypes: [artifactTypes.latex],
  refine: latexRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "sandbox",
  },
  Component({ artifact, payload }) {
    const displayMode = (artifact.attributes.displayMode ?? "block") !== "inline";
    return (
      <SandboxFrame
        title={artifact.title || "LaTeX artifact"}
        srcDoc={latexShell(payload, displayMode)}
      />
    );
  },
};

export const vegaLiteSandboxRenderer: ArtifactRenderer = {
  id: "sandbox-vega-lite",
  artifactTypes: [artifactTypes.vegaLite],
  refine: (artifact) => completeOnlyRefine(
    artifact,
    "waiting for complete Vega-Lite spec",
  ),
  chrome: {
    preferredContentInsets: "none",
    surface: "sandbox",
  },
  Component({ artifact, payload }) {
    return (
      <SandboxFrame
        title={artifact.title || "Vega-Lite artifact"}
        srcDoc={vegaLiteShell(payload)}
      />
    );
  },
};

export function createSandboxRenderers(): ArtifactRenderer[] {
  return [
    htmlSandboxRenderer,
    reactSandboxRenderer,
    mermaidSandboxRenderer,
    latexSandboxRenderer,
    vegaLiteSandboxRenderer,
  ];
}
