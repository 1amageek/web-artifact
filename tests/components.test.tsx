import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnyArtifact, ArtifactRenderer } from "../src";
import {
  ArtifactCanvas,
  ArtifactCard,
  ArtifactProvider,
  ArtifactView,
  artifactTypes,
  createDefaultRenderers,
  preRenderable,
  renderable,
} from "../src";

function artifact(input: Partial<AnyArtifact> = {}): AnyArtifact {
  return {
    id: "a",
    type: artifactTypes.markdown,
    title: "Note",
    attributes: {},
    payload: "hello",
    isComplete: true,
    ...input,
  };
}

describe("React artifact components", () => {
  it("renders a registered renderer body with the refined payload", () => {
    const renderer: ArtifactRenderer = {
      id: "test",
      artifactTypes: ["application/test"],
      refine: () => renderable("refined only"),
      Component({ payload }) {
        return <div>payload: {payload}</div>;
      },
    };

    render(
      <ArtifactProvider renderers={[renderer]}>
        <ArtifactView artifact={artifact({ type: "application/test" })} />
      </ArtifactProvider>,
    );

    expect(screen.getByText("payload: refined only")).toBeInTheDocument();
  });

  it("renders the fallback for unknown artifact types", () => {
    render(
      <ArtifactProvider renderers={[]}>
        <ArtifactView
          artifact={artifact({
            type: "application/unknown",
            payload: "raw fallback",
          })}
        />
      </ArtifactProvider>,
    );

    expect(screen.getByText("No renderer registered")).toBeInTheDocument();
    expect(screen.getByText("raw fallback")).toBeInTheDocument();
  });

  it("shows progress for pre-renderable artifacts", () => {
    const renderer: ArtifactRenderer = {
      id: "waiting",
      artifactTypes: ["application/waiting"],
      refine: () =>
        preRenderable({
          receivedCharacters: 7,
          hint: "waiting test",
        }),
      Component() {
        return <div>body</div>;
      },
    };

    render(
      <ArtifactProvider renderers={[renderer]}>
        <ArtifactView artifact={artifact({ type: "application/waiting" })} />
      </ArtifactProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("waiting test");
    expect(screen.getByRole("status")).toHaveTextContent("7 chars");
  });

  it("hides a card for an empty streaming payload", () => {
    const { container } = render(
      <ArtifactProvider renderers={createDefaultRenderers()}>
        <ArtifactCard
          artifact={artifact({
            payload: "",
            isComplete: false,
          })}
        />
      </ArtifactProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows card title, MIME type, and streaming indicator", () => {
    render(
      <ArtifactProvider renderers={createDefaultRenderers()}>
        <ArtifactCard
          artifact={artifact({
            isComplete: false,
            payload: "partial\n",
          })}
        />
      </ArtifactProvider>,
    );

    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText(artifactTypes.markdown)).toBeInTheDocument();
    expect(screen.getByText("Streaming")).toBeInTheDocument();
  });

  it("toggles disclosure without losing the card", () => {
    render(
      <ArtifactProvider renderers={createDefaultRenderers()}>
        <ArtifactCard artifact={artifact({ payload: "## Body", isComplete: true })} />
      </ArtifactProvider>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /expand/i }));
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders a canvas with text and artifact segments", () => {
    render(
      <ArtifactProvider renderers={createDefaultRenderers()}>
        <ArtifactCanvas
          message={{
            id: "message",
            segments: [
              { kind: "text", id: "t", text: "Before" },
              { kind: "artifact", id: "a", artifact: artifact() },
            ],
          }}
        />
      </ArtifactProvider>,
    );

    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
  });
});
