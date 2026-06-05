import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { artifactTypes } from "../../core/knownTypes";
import type { ArtifactRenderer } from "../../renderer/types";
import { markdownRefine } from "./refiners";

export const markdownRenderer: ArtifactRenderer = {
  id: "markdown",
  artifactTypes: [artifactTypes.markdown],
  refine: markdownRefine,
  chrome: {
    preferredContentInsets: "default",
    surface: "text",
  },
  Component({ payload }) {
    return (
      <div className="wa-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{payload}</ReactMarkdown>
      </div>
    );
  },
};
