import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { AnyArtifact } from "../core/types";
import { ArtifactView } from "./ArtifactView";
import { useArtifactRegistry } from "./ArtifactProvider";

export interface ArtifactBodyProps {
  artifact: AnyArtifact;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ArtifactBody({
  artifact,
  children,
  className,
  style,
}: ArtifactBodyProps) {
  const registry = useArtifactRegistry();
  const renderer = registry.resolve(artifact);
  const contentInsets = renderer?.chrome?.preferredContentInsets ?? "default";
  const bodyStyle = useMemo(
    () => ({
      minHeight: renderer?.chrome?.minHeight,
      maxHeight: renderer?.chrome?.maxHeight,
      ...style,
    }),
    [renderer?.chrome?.maxHeight, renderer?.chrome?.minHeight, style],
  );
  const bodyClassName = ["wa-artifact-body", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={bodyClassName}
      data-insets={contentInsets}
      style={bodyStyle}
    >
      {children ?? <ArtifactView artifact={artifact} />}
    </div>
  );
}
