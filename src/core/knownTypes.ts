import type { ArtifactType } from "./types";

export const artifactTypes = {
  html: "text/html",
  react: "application/vnd.ant.react",
  svg: "image/svg+xml",
  mermaid: "application/vnd.ant.mermaid",
  markdown: "text/markdown",
  code: "application/vnd.ant.code",
  json: "application/json",
  csv: "text/csv",
  vegaLite: "application/vnd.vegalite.v5+json",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
  geoJSON: "application/geo+json",
  latex: "application/x-latex",
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  tiff: "image/tiff",
  heic: "image/heic",
  bmp: "image/bmp",
  turtle: "text/turtle",
  trig: "application/trig",
  nQuads: "application/n-quads",
  rdfXML: "application/rdf+xml",
  jsonLD: "application/ld+json",
} as const satisfies Record<string, ArtifactType>;

export type KnownArtifactTypeName = keyof typeof artifactTypes;
