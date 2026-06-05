import { artifactTypes } from "../../core/knownTypes";
import type { AnyArtifact } from "../../core/types";
import type { ArtifactRenderer } from "../../renderer/types";
import { codeRefine } from "./refiners";

export const codeRenderer: ArtifactRenderer = {
  id: "code",
  artifactTypes: [artifactTypes.code],
  refine: codeRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "text",
    maxHeight: 560,
  },
  Component({ artifact, payload }) {
    const isDiff = isDiffArtifact(artifact, payload);
    return (
      <pre className="wa-code" data-diff={isDiff ? "true" : "false"}>
        {payload.split("\n").map((line, index) => (
          <span
            className="wa-code__line"
            data-kind={diffLineKind(line)}
            key={index}
          >
            {line || " "}
          </span>
        ))}
      </pre>
    );
  },
};

function isDiffArtifact(artifact: AnyArtifact, payload: string): boolean {
  const candidates = [
    artifact.attributes.language,
    artifact.attributes.lang,
    artifact.attributes.fileExtension,
    artifact.attributes.filename,
    artifact.attributes.fileName,
    artifact.title,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (
    candidates.some((value) =>
      ["diff", "patch", "udiff", "unified-diff"].some((signal) =>
        value.endsWith(signal),
      ),
    )
  ) {
    return true;
  }

  return /^@@ -\d+,\d+ \+\d+,\d+ @@/m.test(payload);
}

function diffLineKind(line: string): "add" | "delete" | "context" {
  if (line.startsWith("+") && !line.startsWith("+++")) {
    return "add";
  }
  if (line.startsWith("-") && !line.startsWith("---")) {
    return "delete";
  }
  return "context";
}
