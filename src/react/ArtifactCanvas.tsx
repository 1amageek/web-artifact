import type { ReactNode } from "react";
import type { AnyArtifact, ArtifactMessage } from "../core/types";
import { ArtifactCard } from "./ArtifactCard";

export interface ArtifactCanvasProps {
  message: ArtifactMessage;
  renderArtifact?: (artifact: AnyArtifact) => ReactNode;
}

export function ArtifactCanvas({
  message,
  renderArtifact,
}: ArtifactCanvasProps) {
  return (
    <div className="wa-canvas">
      {message.segments.map((segment) => {
        if (segment.kind === "text") {
          return (
            <p className="wa-canvas__text" key={segment.id}>
              {segment.text}
            </p>
          );
        }

        return (
          <div className="wa-canvas__artifact" key={segment.id}>
            {renderArtifact ? (
              renderArtifact(segment.artifact)
            ) : (
              <ArtifactCard artifact={segment.artifact} />
            )}
          </div>
        );
      })}
    </div>
  );
}
