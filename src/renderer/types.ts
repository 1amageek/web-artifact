import type { ComponentType, ReactNode } from "react";
import type { AnyArtifact, ArtifactType } from "../core/types";

export interface PreRenderableProgress {
  receivedCharacters: number;
  hint?: string;
}

export type RefinedPayload =
  | {
      state: "preRenderable";
      progress: PreRenderableProgress;
    }
  | {
      state: "renderable";
      payload: string;
    };

export interface ArtifactRenderProps {
  artifact: AnyArtifact;
  payload: string;
}

export interface ArtifactPreRenderableProps {
  artifact: AnyArtifact;
  progress: PreRenderableProgress;
}

export interface ArtifactRendererChrome {
  preferredContentInsets?: "default" | "none";
  minHeight?: number;
  maxHeight?: number;
  surface?: "text" | "table" | "media" | "sandbox" | "interactive";
}

export interface ArtifactRenderer {
  id: string;
  artifactTypes: readonly ArtifactType[];
  refine: (artifact: AnyArtifact) => RefinedPayload;
  Component: ComponentType<ArtifactRenderProps>;
  PreRenderableComponent?: ComponentType<ArtifactPreRenderableProps>;
  chrome?: ArtifactRendererChrome;
}

export interface ArtifactRendererRegistry {
  renderers: readonly ArtifactRenderer[];
  resolve: (artifact: AnyArtifact) => ArtifactRenderer | undefined;
}

export interface ArtifactAction {
  id: string;
  label: string;
  render: (artifact: AnyArtifact) => ReactNode;
}

export function renderable(payload: string): RefinedPayload {
  return {
    state: "renderable",
    payload,
  };
}

export function preRenderable(progress: PreRenderableProgress): RefinedPayload {
  return {
    state: "preRenderable",
    progress,
  };
}

export function defaultRefine(artifact: AnyArtifact): RefinedPayload {
  if (artifact.isComplete) {
    return renderable(artifact.payload);
  }
  return preRenderable({
    receivedCharacters: artifact.payload.length,
  });
}
