import type { AnyArtifact } from "../core/types";
import type { PreRenderableProgress } from "../renderer/types";

export interface ArtifactProgressViewProps {
  artifact: AnyArtifact;
  progress: PreRenderableProgress;
}

export function ArtifactProgressView({
  artifact,
  progress,
}: ArtifactProgressViewProps) {
  const label = progress.hint || "Waiting for renderable content";
  return (
    <div
      className="wa-progress"
      role="status"
      aria-label={`${artifact.type}: ${label}`}
    >
      <span className="wa-progress__pulse" aria-hidden="true" />
      <span>{label}</span>
      <span className="wa-progress__count">
        {progress.receivedCharacters.toLocaleString()} chars
      </span>
    </div>
  );
}
