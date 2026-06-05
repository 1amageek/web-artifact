import type { AnyArtifact } from "../core/types";
import type { ArtifactRenderer, ArtifactRendererRegistry } from "./types";

export function createArtifactRegistry(
  renderers: readonly ArtifactRenderer[],
): ArtifactRendererRegistry {
  const byType = new Map<string, ArtifactRenderer>();

  for (const renderer of renderers) {
    for (const artifactType of renderer.artifactTypes) {
      byType.set(artifactType, renderer);
    }
  }

  return {
    renderers,
    resolve(artifact: AnyArtifact) {
      return byType.get(artifact.type);
    },
  };
}
