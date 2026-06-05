import type { ArtifactRenderer } from "../renderer/types";
import { createBasicRenderers } from "./basic";
import { createSandboxRenderers } from "./sandbox";

export * from "./basic";
export * from "./sandbox";

export function createDefaultRenderers(): ArtifactRenderer[] {
  return [...createBasicRenderers(), ...createSandboxRenderers()];
}
