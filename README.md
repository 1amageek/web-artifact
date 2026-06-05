# web-artifact

React component library for rendering LLM-generated `<artifact>` blocks.

```mermaid
flowchart LR
  A["artifact source"] --> B["ArtifactStreamParserCore"]
  B --> C["ArtifactMessage"]
  C --> D["ArtifactCanvas"]
  D --> E["ArtifactCard"]
  E --> F["ArtifactView"]
  F --> G["ArtifactRenderer"]
```

## Usage

```tsx
import {
  ArtifactCanvas,
  ArtifactProvider,
  createDefaultRenderers,
  parseArtifactMessage,
} from "web-artifact";
import "web-artifact/styles.css";

const message = parseArtifactMessage(source);

export function MessageArtifactView() {
  return (
    <ArtifactProvider renderers={createDefaultRenderers()}>
      <ArtifactCanvas message={message} />
    </ArtifactProvider>
  );
}
```

## Renderer contract

Renderers are registered by MIME type. `Component` receives only the refined
payload, not the raw streaming payload.

```tsx
import type { ArtifactRenderer } from "web-artifact";
import { preRenderable, renderable } from "web-artifact";

export const textRenderer: ArtifactRenderer = {
  id: "text",
  artifactTypes: ["text/plain"],
  refine(artifact) {
    if (!artifact.payload && !artifact.isComplete) {
      return preRenderable({
        receivedCharacters: 0,
        hint: "waiting for text",
      });
    }
    return renderable(artifact.payload);
  },
  chrome: {
    preferredContentInsets: "default",
    surface: "text",
  },
  Component({ payload }) {
    return <pre>{payload}</pre>;
  },
};
```

## Included renderers

| Group | Renderers |
|---|---|
| Basic | Markdown, JSON, CSV, Code, SVG |
| Sandbox | HTML, React, Mermaid, LaTeX, Vega-Lite |

Sandbox renderers use `iframe srcDoc` without `allow-same-origin`.

## Visual inspection

Storybook includes a renderer gallery and single-renderer stories.

```bash
npm run storybook
npm run build:storybook
```

Open `http://127.0.0.1:6006/?path=/story/web-artifact-renderers--gallery`
to inspect the current renderer set.
