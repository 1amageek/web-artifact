import type { AnyArtifact } from "../core/types";

export interface DefaultArtifactViewProps {
  artifact: AnyArtifact;
}

export function DefaultArtifactView({ artifact }: DefaultArtifactViewProps) {
  return (
    <div className="wa-default-view">
      <div className="wa-default-view__notice">No renderer registered</div>
      <pre className="wa-source-block">{artifact.payload}</pre>
    </div>
  );
}
