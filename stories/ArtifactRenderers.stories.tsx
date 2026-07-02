import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArtifactBody,
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
    title: "Markdown QA document",
    payload: [
      "# Renderer status",
      "",
      "This fixture exercises the default Markdown renderer with GitHub-flavored Markdown, longer copy, dense lists, inline formatting, tables, and code blocks. It should remain readable without story-specific styling.",
      "",
      "## Summary",
      "",
      "| Surface | State | Coverage | Score |",
      "| :--- | :---: | --- | ---: |",
      "| Markdown | Rendered | headings, lists, tables | 98 |",
      "| JSON | Rendered | structured source | 94 |",
      "| Sandbox | Isolated | iframe shells | 91 |",
      "",
      "## Checklist",
      "",
      "- [x] Tables use visible cell borders and header styling.",
      "- [x] Inline `code` remains legible inside prose.",
      "- [ ] Long paragraphs and task lists do not collide with card chrome.",
      "",
      "## Notes",
      "",
      "> Streaming renderers should preserve stable prefixes while the final payload is still arriving. The preview should make partial content obvious without making completed content feel unfinished.",
      "",
      "1. Parse artifact tags into message segments.",
      "2. Resolve a renderer by MIME type.",
      "3. Refine the payload before rendering.",
      "4. Render with default chrome unless a host app overrides it.",
      "",
      "### Inline styles",
      "",
      "Use **strong text**, _emphasis_, `inline identifiers`, and [documentation links](https://github.com/1amageek/web-artifact) without breaking line height.",
      "",
      "### Code block",
      "",
      "```ts",
      "type RendererState = \"preRenderable\" | \"renderable\";",
      "",
      "export function isRenderable(state: RendererState): boolean {",
      "  return state === \"renderable\";",
      "}",
      "```",
      "",
      "---",
      "",
      "The final paragraph checks spacing after a horizontal rule and keeps enough text on screen to inspect wrapping, table density, list rhythm, and code contrast in the same card.",
    ].join("\n"),
  }),
  json: artifact({
    id: "json-preview",
    type: artifactTypes.json,
    title: "Structured payload log",
    payload: createJsonPayload(),
  }),
  csv: artifact({
    id: "csv-preview",
    type: artifactTypes.csv,
    title: "CSV renderer metrics",
    payload: createCsvPayload(),
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

function RendererContentStory({ artifact }: RendererStoryProps) {
  return (
    <ArtifactProvider renderers={defaultRenderers}>
      <div className="story-shell">
        <div className="story-shell__inner">
          <RendererBody artifact={artifact} />
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

function ContentGalleryStory() {
  return (
    <ArtifactProvider renderers={defaultRenderers}>
      <div className="story-shell">
        <div className="story-shell__inner">
          <div className="story-heading">
            <h1>Renderer content gallery</h1>
            <p>
              Renderer bodies are shown without card chrome while preserving
              each renderer's default body sizing and inset policy.
            </p>
          </div>
          <div className="story-grid">
            {galleryArtifacts.map((artifact) => (
              <div className="story-item" key={artifact.id}>
                <div className="story-label">{artifact.type}</div>
                <RendererBody artifact={artifact} />
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

function RendererBody({ artifact }: RendererStoryProps) {
  return (
    <ArtifactBody artifact={artifact} className="story-renderer-body" />
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

function createJsonPayload(): string {
  return JSON.stringify(
    {
      renderer: "json",
      status: "ready",
      counts: {
        artifacts: 48,
        sandboxed: 18,
        warnings: 3,
      },
      runs: Array.from({ length: 36 }, (_, index) => ({
        id: `render-${String(index + 1).padStart(2, "0")}`,
        type: index % 3 === 0 ? "text/markdown" : "application/json",
        durationMs: 8 + index * 3,
        state: index % 7 === 0 ? "streaming" : "rendered",
        checks: {
          refined: true,
          scrollable: index % 2 === 0,
          isolated: index % 5 === 0,
        },
      })),
    },
    null,
    2,
  );
}

function createCsvPayload(): string {
  const rows = Array.from({ length: 54 }, (_, index) => {
    const renderer = ["Markdown", "JSON", "CSV", "Code", "Sandbox"][index % 5];
    const latency = 9 + ((index * 7) % 64);
    const rowsRendered = 12 + index * 3;
    const state = index % 9 === 0 ? "streaming" : "complete";
    return [
      `case-${String(index + 1).padStart(2, "0")}`,
      renderer,
      latency,
      rowsRendered,
      state,
      index % 4 === 0 ? "scroll boundary" : "baseline",
    ].join(",");
  });

  return [
    "case_id,renderer,latency_ms,rows_rendered,state,note",
    ...rows,
  ].join("\n");
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

export const ContentGallery: Story = {
  args: {
    artifact: samples.markdown,
  },
  render: () => <ContentGalleryStory />,
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

export const MarkdownContent: Story = {
  args: {
    artifact: samples.markdown,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const Json: Story = {
  args: {
    artifact: samples.json,
  },
};

export const JsonContent: Story = {
  args: {
    artifact: samples.json,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const Csv: Story = {
  args: {
    artifact: samples.csv,
  },
};

export const CsvContent: Story = {
  args: {
    artifact: samples.csv,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const Code: Story = {
  args: {
    artifact: samples.code,
  },
};

export const CodeContent: Story = {
  args: {
    artifact: samples.code,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const Svg: Story = {
  args: {
    artifact: samples.svg,
  },
};

export const SvgContent: Story = {
  args: {
    artifact: samples.svg,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const HtmlSandbox: Story = {
  args: {
    artifact: samples.html,
  },
};

export const HtmlSandboxContent: Story = {
  args: {
    artifact: samples.html,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const ReactSandbox: Story = {
  args: {
    artifact: samples.react,
  },
};

export const ReactSandboxContent: Story = {
  args: {
    artifact: samples.react,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const MermaidSandbox: Story = {
  args: {
    artifact: samples.mermaid,
  },
};

export const MermaidSandboxContent: Story = {
  args: {
    artifact: samples.mermaid,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const LatexSandbox: Story = {
  args: {
    artifact: samples.latex,
  },
};

export const LatexSandboxContent: Story = {
  args: {
    artifact: samples.latex,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const VegaLiteSandbox: Story = {
  args: {
    artifact: samples.vegaLite,
  },
};

export const VegaLiteSandboxContent: Story = {
  args: {
    artifact: samples.vegaLite,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const Fallback: Story = {
  args: {
    artifact: samples.unknown,
  },
};

export const FallbackContent: Story = {
  args: {
    artifact: samples.unknown,
  },
  render: (args) => <RendererContentStory {...args} />,
};

export const StreamingPlaceholder: Story = {
  args: {
    artifact: samples.streaming,
  },
};

export const StreamingPlaceholderContent: Story = {
  args: {
    artifact: samples.streaming,
  },
  render: (args) => <RendererContentStory {...args} />,
};
