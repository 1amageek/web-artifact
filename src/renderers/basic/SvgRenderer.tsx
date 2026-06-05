import { artifactTypes } from "../../core/knownTypes";
import type { ArtifactRenderer } from "../../renderer/types";
import { svgRefine } from "./refiners";

export const svgRenderer: ArtifactRenderer = {
  id: "svg",
  artifactTypes: [artifactTypes.svg],
  refine: svgRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "media",
    minHeight: 160,
  },
  Component({ artifact, payload }) {
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(payload)}`;
    return (
      <div className="wa-svg">
        <img src={src} alt={artifact.title || "SVG artifact"} />
      </div>
    );
  },
};
