import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";
import "../stories/storybook.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    docs: {
      toc: true,
    },
  },
};

export default preview;
