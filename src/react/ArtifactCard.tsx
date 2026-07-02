import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AnyArtifact } from "../core/types";
import { ArtifactBody } from "./ArtifactBody";

export interface ArtifactCardProps {
  artifact: AnyArtifact;
  children?: ReactNode;
  actions?: ReactNode;
  initiallyExpanded?: boolean;
  hideWhenEmptyStreaming?: boolean;
}

export function ArtifactCard({
  artifact,
  children,
  actions,
  initiallyExpanded = true,
  hideWhenEmptyStreaming = true,
}: ArtifactCardProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const displayTitle = artifact.title.trim() || "Artifact";

  if (
    hideWhenEmptyStreaming &&
    !artifact.isComplete &&
    artifact.payload.length === 0
  ) {
    return null;
  }

  return (
    <section className="wa-card" data-artifact-type={artifact.type}>
      <header className="wa-card__header">
        <div className="wa-card__heading">
          <div className="wa-card__title">{displayTitle}</div>
          <div className="wa-card__type">{artifact.type}</div>
        </div>
        {!artifact.isComplete ? (
          <span className="wa-card__streaming" aria-label="Streaming">
            Streaming
          </span>
        ) : null}
        {actions ? <div className="wa-card__actions">{actions}</div> : null}
        <button
          type="button"
          className="wa-icon-button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-label={isExpanded ? "Collapse artifact" : "Expand artifact"}
          title={isExpanded ? "Collapse artifact" : "Expand artifact"}
        >
          {isExpanded ? (
            <ChevronUp aria-hidden="true" size={16} />
          ) : (
            <ChevronDown aria-hidden="true" size={16} />
          )}
        </button>
      </header>
      {isExpanded ? (
        <ArtifactBody artifact={artifact} className="wa-card__body">
          {children}
        </ArtifactBody>
      ) : null}
    </section>
  );
}
