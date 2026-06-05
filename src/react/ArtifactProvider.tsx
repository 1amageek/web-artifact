import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { createArtifactRegistry } from "../renderer/registry";
import type {
  ArtifactRenderer,
  ArtifactRendererRegistry,
} from "../renderer/types";

const ArtifactRegistryContext = createContext<ArtifactRendererRegistry>(
  createArtifactRegistry([]),
);

export interface ArtifactProviderProps {
  renderers: readonly ArtifactRenderer[];
  children: ReactNode;
}

export function ArtifactProvider({
  renderers,
  children,
}: ArtifactProviderProps) {
  const registry = useMemo(() => createArtifactRegistry(renderers), [renderers]);
  return (
    <ArtifactRegistryContext.Provider value={registry}>
      {children}
    </ArtifactRegistryContext.Provider>
  );
}

export function useArtifactRegistry(): ArtifactRendererRegistry {
  return useContext(ArtifactRegistryContext);
}
