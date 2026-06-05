import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "WebArtifact",
      fileName: "web-artifact",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "lucide-react",
        "react-markdown",
        "remark-gfm",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
          "lucide-react": "LucideReact",
          "react-markdown": "ReactMarkdown",
          "remark-gfm": "remarkGfm",
        },
      },
    },
  },
});
