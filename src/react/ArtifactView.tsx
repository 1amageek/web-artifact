import type { AnyArtifact } from "../core/types";
import { ArtifactProgressView } from "./ArtifactProgressView";
import { DefaultArtifactView } from "./DefaultArtifactView";
import { useArtifactRegistry } from "./ArtifactProvider";

export interface ArtifactViewProps {
  artifact: AnyArtifact;
}

export function ArtifactView({ artifact }: ArtifactViewProps) {
  const registry = useArtifactRegistry();
  const renderer = registry.resolve(artifact);

  if (!renderer) {
    return <DefaultArtifactView artifact={artifact} />;
  }

  const refined = renderer.refine(artifact);
  if (refined.state === "preRenderable") {
    const PreRenderable =
      renderer.PreRenderableComponent ?? ArtifactProgressView;
    return (
      <PreRenderable artifact={artifact} progress={refined.progress} />
    );
  }

  const RendererComponent = renderer.Component;
  return (
    <RendererComponent artifact={artifact} payload={refined.payload} />
  );
}
