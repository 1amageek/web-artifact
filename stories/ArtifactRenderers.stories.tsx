import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArtifactCanvas,
  ArtifactCard,
  ArtifactProvider,
  artifactTypes,
  createDefaultRenderers,
  parseArtifactMessage,
  type AnyArtifact,
  type ArtifactMessage,
} from "../src";

interface RendererStoryProps {
  artifact: AnyArtifact;
}

const defaultRenderers = createDefaultRenderers();

const samples = {
  markdown: artifact({
    id: "markdown-preview",
    type: artifactTypes.markdown,
    title: "Markdown report",
    payload: [
      "## Renderer status",
      "",
      "| Surface | State |",
      "| --- | --- |",
      "| Markdown | Rendered |",
      "| Sandbox | Isolated |",
      "",
      "- Streams can show stable prefixes.",
      "- GitHub-flavored tables are enabled.",
    ].join("\n"),
  }),
  json: artifact({
    id: "json-preview",
    type: artifactTypes.json,
    title: "Structured payload",
    payload: JSON.stringify(
      {
        renderer: "json",
        status: "ready",
        counts: {
          artifacts: 10,
          sandboxed: 5,
        },
      },
      null,
      2,
    ),
  }),
  csv: artifact({
    id: "csv-preview",
    type: artifactTypes.csv,
    title: "CSV metrics",
    payload: [
      "renderer,latency_ms,complete",
      "markdown,12,true",
      "json,9,true",
      "html sandbox,44,true",
      "react sandbox,62,true",
    ].join("\n"),
  }),
  code: artifact({
    id: "code-preview",
    type: artifactTypes.code,
    title: "renderer.ts",
    attributes: {
      language: "ts",
    },
    payload: [
      "export interface RendererAdapter {",
      "  readonly id: string;",
      "  canRender(type: string): boolean;",
      "  render(payload: string): Promise<void>;",
      "}",
    ].join("\n"),
  }),
  svg: artifact({
    id: "svg-preview",
    type: artifactTypes.svg,
    title: "SVG badge",
    payload: [
      '<svg viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Web artifact SVG preview">',
      '  <rect width="360" height="180" rx="8" fill="#fffefa"/>',
      '  <path d="M64 116L128 48L192 116L256 48L320 116" fill="none" stroke="#0f766e" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>',
      '  <circle cx="64" cy="116" r="14" fill="#0f766e"/>',
      '  <circle cx="192" cy="116" r="14" fill="#0f766e"/>',
      '  <text x="28" y="154" fill="#24231f" font-family="ui-monospace, monospace" font-size="18">image/svg+xml</text>',
      "</svg>",
    ].join("\n"),
  }),
  html: artifact({
    id: "html-preview",
    type: artifactTypes.html,
    title: "HTML sandbox",
    payload: [
      '<main style="background:#fffefa;color:#24231f;font:14px system-ui,sans-serif;">',
      '  <section style="width:100%;box-sizing:border-box;border:1px solid #d8d4c8;border-radius:8px;padding:18px;background:white;">',
      '    <h1 style="margin:0 0 8px;font-size:22px;">Sandbox HTML</h1>',
      '    <p style="margin:0 0 12px;line-height:1.55;color:#6d6a60;">The iframe surface keeps arbitrary markup isolated from the host React tree.</p>',
      '    <button style="border:0;border-radius:6px;padding:9px 12px;background:#0f766e;color:white;">Primary action</button>',
      "  </section>",
      "</main>",
    ].join("\n"),
  }),
  react: artifact({
    id: "react-preview",
    type: artifactTypes.react,
    title: "React sandbox",
    payload: [
      "export default function Counter() {",
      "  const [count, setCount] = React.useState(2);",
      "  return (",
      "    <section style={{ display: 'grid', gap: 12, width: '100%', boxSizing: 'border-box', padding: 18, border: '1px solid #d8d4c8', borderRadius: 8, background: 'white', color: '#24231f' }}>",
      "      <strong>React sandbox</strong>",
      "      <span style={{ color: '#6d6a60' }}>The component mounts inside an iframe.</span>",
      "      <button onClick={() => setCount(count + 1)} style={{ border: 0, borderRadius: 6, padding: '9px 12px', background: '#0f766e', color: 'white' }}>Count {count}</button>",
      "    </section>",
      "  );",
      "}",
    ].join("\n"),
  }),
  mermaid: artifact({
    id: "mermaid-preview",
    type: artifactTypes.mermaid,
    title: "Renderer flow",
    payload: [
      "flowchart LR",
      "  A[Artifact] --> B[Registry]",
      "  B --> C{Renderer}",
      "  C --> D[Refine]",
      "  D --> E[Render]",
    ].join("\n"),
  }),
  latex: artifact({
    id: "latex-preview",
    type: artifactTypes.latex,
    title: "LaTeX expression",
    attributes: {
      displayMode: "block",
    },
    payload: String.raw`\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}`,
  }),
  vegaLite: artifact({
    id: "vega-lite-preview",
    type: artifactTypes.vegaLite,
    title: "Vega-Lite chart",
    payload: JSON.stringify({
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      autosize: {
        type: "fit",
        contains: "padding",
      },
      width: "container",
      height: 180,
      data: {
        values: [
          { renderer: "Markdown", count: 18 },
          { renderer: "JSON", count: 12 },
          { renderer: "Sandbox", count: 9 },
          { renderer: "Fallback", count: 3 },
        ],
      },
      mark: {
        type: "bar",
        cornerRadiusEnd: 4,
        color: "#0f766e",
      },
      encoding: {
        x: { field: "renderer", type: "nominal", axis: { labelAngle: 0 } },
        y: { field: "count", type: "quantitative" },
      },
    }),
  }),
  unknown: artifact({
    id: "unknown-preview",
    type: "application/x-web-artifact-preview",
    title: "Fallback payload",
    payload: "No renderer is registered for this artifact type yet.",
  }),
  streaming: artifact({
    id: "streaming-preview",
    type: artifactTypes.react,
    title: "Incomplete React payload",
    isComplete: false,
    payload: "export default function App() {",
  }),
};

const galleryArtifacts = [
  samples.markdown,
  samples.json,
  samples.csv,
  samples.code,
  samples.svg,
  samples.html,
  samples.react,
  samples.mermaid,
  samples.latex,
  samples.vegaLite,
  samples.unknown,
  samples.streaming,
];

const mixedMessage: ArtifactMessage = parseArtifactMessage([
  "The canvas keeps plain text and artifacts in source order.",
  "",
  artifactTag(samples.markdown),
  "",
  "Sandbox output can be inspected without leaving the artifact flow.",
  "",
  artifactTag(samples.html),
].join("\n"));

function RendererStory({ artifact }: RendererStoryProps) {
  return (
    <ArtifactProvider renderers={defaultRenderers}>
      <div className="story-shell">
        <div className="story-shell__inner">
          <ArtifactCard artifact={artifact} />
        </div>
      </div>
    </ArtifactProvider>
  );
}

function GalleryStory() {
  return (
    <ArtifactProvider renderers={defaultRenderers}>
      <div className="story-shell">
        <div className="story-shell__inner">
          <div className="story-heading">
            <h1>Renderer gallery</h1>
            <p>
              Every registered renderer is shown with a representative artifact.
              Sandbox renderers are isolated in iframes.
            </p>
          </div>
          <div className="story-grid">
            {galleryArtifacts.map((artifact) => (
              <div className="story-item" key={artifact.id}>
                <div className="story-label">{artifact.type}</div>
                <ArtifactCard artifact={artifact} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ArtifactProvider>
  );
}

function CanvasStory() {
  return (
    <ArtifactProvider renderers={defaultRenderers}>
      <div className="story-shell">
        <div className="story-shell__inner">
          <div className="story-heading">
            <h1>Artifact canvas</h1>
            <p>
              Mixed text and artifacts use the same renderer registry as single
              artifact cards.
            </p>
          </div>
          <ArtifactCanvas message={mixedMessage} />
        </div>
      </div>
    </ArtifactProvider>
  );
}

function artifact(
  input: Omit<AnyArtifact, "attributes" | "isComplete"> &
    Partial<Pick<AnyArtifact, "attributes" | "isComplete">>,
): AnyArtifact {
  return {
    attributes: {},
    isComplete: true,
    ...input,
  };
}

function artifactTag(artifact: AnyArtifact): string {
  const title = escapeAttribute(artifact.title);
  return [
    `<artifact identifier="${artifact.id}" type="${artifact.type}" title="${title}">`,
    artifact.payload,
    "</artifact>",
  ].join("\n");
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}

const meta = {
  title: "web-artifact/Renderers",
  component: RendererStory,
  parameters: {
    docs: {
      description: {
        component:
          "Visual inspection stories for web-artifact renderer coverage.",
      },
    },
  },
} satisfies Meta<typeof RendererStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  args: {
    artifact: samples.markdown,
  },
  render: () => <GalleryStory />,
};

export const Canvas: Story = {
  args: {
    artifact: samples.markdown,
  },
  render: () => <CanvasStory />,
};

export const Markdown: Story = {
  args: {
    artifact: samples.markdown,
  },
};

export const Json: Story = {
  args: {
    artifact: samples.json,
  },
};

export const Csv: Story = {
  args: {
    artifact: samples.csv,
  },
};

export const Code: Story = {
  args: {
    artifact: samples.code,
  },
};

export const Svg: Story = {
  args: {
    artifact: samples.svg,
  },
};

export const HtmlSandbox: Story = {
  args: {
    artifact: samples.html,
  },
};

export const ReactSandbox: Story = {
  args: {
    artifact: samples.react,
  },
};

export const MermaidSandbox: Story = {
  args: {
    artifact: samples.mermaid,
  },
};

export const LatexSandbox: Story = {
  args: {
    artifact: samples.latex,
  },
};

export const VegaLiteSandbox: Story = {
  args: {
    artifact: samples.vegaLite,
  },
};

export const Fallback: Story = {
  args: {
    artifact: samples.unknown,
  },
};

export const StreamingPlaceholder: Story = {
  args: {
    artifact: samples.streaming,
  },
};
