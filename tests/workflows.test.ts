import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readWorkflow = (name: string) =>
  readFileSync(join(process.cwd(), ".github", "workflows", name), "utf8");

describe("GitHub workflows", () => {
  it("runs package verification on push and pull requests", () => {
    const workflow = readWorkflow("ci.yml");

    expect(workflow).toContain("name: CI");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("node-version: 20");
    expect(workflow).toContain("run: npm ci");
    expect(workflow).toContain("run: npm run verify");
  });

  it("publishes to npm when a GitHub release is published", () => {
    const workflow = readWorkflow("npm-publish.yml");

    expect(workflow).toContain("release:");
    expect(workflow).toContain("types:");
    expect(workflow).toContain("- published");
    expect(workflow).toContain("ref: ${{ github.event.release.tag_name }}");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("registry-url: https://registry.npmjs.org");
    expect(workflow).toContain("run: npm run verify");
    expect(workflow).toContain("run: npm publish --access public --provenance");
    expect(workflow).toContain("NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}");
  });
});
