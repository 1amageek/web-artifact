import { artifactTypes } from "../../core/knownTypes";
import type { ArtifactRenderer } from "../../renderer/types";
import { jsonRefine } from "./refiners";

export const jsonRenderer: ArtifactRenderer = {
  id: "json",
  artifactTypes: [artifactTypes.json],
  refine: jsonRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "text",
    maxHeight: 520,
  },
  Component({ payload }) {
    return <pre className="wa-json">{prettyPrintJson(payload)}</pre>;
  },
};

function prettyPrintJson(source: string): string {
  try {
    return JSON.stringify(JSON.parse(source), null, 2);
  } catch {
    return source;
  }
}
