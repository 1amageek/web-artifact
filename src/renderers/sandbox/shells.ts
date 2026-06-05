export function htmlShell(payload: string): string {
  return payload;
}

export function reactShell(payload: string): string {
  const source = escapeClosingScript(normalizeReactSource(payload));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <style>
    :root { color-scheme: light dark; }
    html, body { margin: 0; background: transparent; color: light-dark(#24231f, #f4f1e8); font: 14px ui-sans-serif, system-ui, sans-serif; }
    body { box-sizing: border-box; }
    button, input, select, textarea { font: inherit; }
    #root:empty::before { content: "React artifact did not mount a component."; color: #6d6a60; }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="env,react">
    const exports = {};
    const module = { exports };
    ${source}
    const __rootElement = document.getElementById("root");
    const __alreadyMounted = __rootElement && __rootElement.childNodes.length > 0;
    const __candidate =
      exports.default ||
      (module.exports && module.exports.default) ||
      window.ArtifactComponent ||
      (typeof App !== "undefined" && App) ||
      (typeof Counter !== "undefined" && Counter);
    if (!__alreadyMounted && __candidate && typeof __candidate !== "object") {
      ReactDOM.createRoot(__rootElement).render(React.createElement(__candidate));
    }
  </script>
</body>
</html>`;
}

export function mermaidShell(payload: string): string {
  const source = scriptJson(payload);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <style>
    :root { color-scheme: light dark; }
    html, body { margin: 0; background: transparent; color: light-dark(#24231f, #f4f1e8); font: 14px ui-sans-serif, system-ui, sans-serif; }
    body { box-sizing: border-box; padding: 8px; }
    #diagram { display: inline-block; overflow: auto; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
  <div id="diagram" class="mermaid"></div>
  <script>
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default" });
    const source = ${source};
    mermaid.render("artifact-mermaid", source)
      .then(({ svg }) => { document.getElementById("diagram").innerHTML = svg; })
      .catch((error) => { document.getElementById("diagram").textContent = error.message || String(error); });
  </script>
</body>
</html>`;
}

export function latexShell(payload: string, displayMode: boolean): string {
  const source = scriptJson(payload);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <style>
    :root { color-scheme: light dark; }
    html, body { margin: 0; background: transparent; color: light-dark(#24231f, #f4f1e8); font: 16px ui-sans-serif, system-ui, sans-serif; }
    body { box-sizing: border-box; padding: 8px; }
    #math { display: inline-block; }
    .katex-display { margin: 0; }
  </style>
</head>
<body>
  <div id="math"></div>
  <script>
    window.addEventListener("DOMContentLoaded", () => {
      katex.render(${source}, document.getElementById("math"), { throwOnError: false, displayMode: ${displayMode ? "true" : "false"} });
    });
  </script>
</body>
</html>`;
}

export function vegaLiteShell(payload: string): string {
  const source = scriptJson(payload);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <style>
    :root { color-scheme: light dark; }
    html, body { margin: 0; background: transparent; color: light-dark(#24231f, #f4f1e8); font: 14px ui-sans-serif, system-ui, sans-serif; }
    body { box-sizing: border-box; }
    #chart { width: 100%; overflow: auto; line-height: 0; }
    .vega-embed { width: 100%; line-height: normal; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
</head>
<body>
  <div id="chart"></div>
  <script>
    const chart = document.getElementById("chart");
    try {
      const spec = JSON.parse(${source});
      vegaEmbed("#chart", spec, { actions: false }).catch((error) => {
        chart.textContent = error.message || String(error);
      });
    } catch (error) {
      chart.textContent = error.message || String(error);
    }
  </script>
</body>
</html>`;
}

function escapeClosingScript(source: string): string {
  return source.replaceAll("</script>", "<\\/script>");
}

function scriptJson(value: string): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003C")
    .replaceAll(">", "\\u003E")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function normalizeReactSource(source: string): string {
  return source
    .replace(/^\s*import\s+.*?from\s+["']react["'];?\s*$/gm, "")
    .replace(/^\s*import\s+.*?from\s+["']react-dom(?:\/client)?["'];?\s*$/gm, "")
    .replace(
      /export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(/,
      "exports.default = function $1(",
    )
    .replace(
      /export\s+default\s+function\s*\(/,
      "exports.default = function (",
    )
    .replace(
      /export\s+default\s+class\s+([A-Za-z_$][\w$]*)/,
      "exports.default = class $1",
    )
    .replace(/export\s+default\s+/g, "exports.default = ");
}
