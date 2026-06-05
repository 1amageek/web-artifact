import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

type PublishablePackageJson = typeof packageJson & {
  private?: boolean;
  files: string[];
  scripts: Record<string, string>;
  sideEffects: string[];
  exports: {
    ".": {
      types: string;
      import: string;
      require: string;
    };
    "./styles.css": string;
  };
};

const manifest = packageJson as PublishablePackageJson;

describe("npm package metadata", () => {
  it("is configured as a public publishable package", () => {
    expect(manifest.private).not.toBe(true);
    expect(manifest.name).toBe("web-artifact");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(manifest.files).toEqual(expect.arrayContaining(["dist", "README.md"]));
    expect(manifest.repository.url).toContain("github.com/1amageek/web-artifact");
  });

  it("exports JavaScript, declarations, and stylesheet entrypoints", () => {
    expect(manifest.main).toBe("./dist/web-artifact.umd.cjs");
    expect(manifest.module).toBe("./dist/web-artifact.js");
    expect(manifest.types).toBe("./dist/types/index.d.ts");
    expect(manifest.exports["."]).toEqual({
      types: "./dist/types/index.d.ts",
      import: "./dist/web-artifact.js",
      require: "./dist/web-artifact.umd.cjs",
    });
    expect(manifest.exports["./styles.css"]).toBe("./dist/web-artifact.css");
    expect(manifest.sideEffects).toContain("**/*.css");
  });

  it("guards release publishing with verification scripts", () => {
    expect(manifest.scripts.prepublishOnly).toContain("npm run typecheck");
    expect(manifest.scripts.prepublishOnly).toContain("npm test");
    expect(manifest.scripts.prepublishOnly).toContain("npm run build");
    expect(manifest.scripts.verify).toContain("npm run build:storybook");
    expect(manifest.scripts.verify).toContain("npm run pack:dry-run");
  });
});
