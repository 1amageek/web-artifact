import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SandboxFrameProps {
  title: string;
  srcDoc: string;
  minHeight?: number;
  sandbox?: string;
}

interface SandboxResizeMessage {
  type: "web-artifact:sandbox-resize";
  token: string;
  height: number;
}

export function SandboxFrame({
  title,
  srcDoc,
  minHeight,
  sandbox = "allow-scripts",
}: SandboxFrameProps) {
  const token = useId();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const fallbackHeight = Math.max(1, minHeight ?? 1);
  const [height, setHeight] = useState(fallbackHeight);
  const bridgedSrcDoc = useMemo(
    () => injectResizeBridge(srcDoc, token),
    [srcDoc, token],
  );

  useEffect(() => {
    setHeight(fallbackHeight);
  }, [bridgedSrcDoc, fallbackHeight]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (event.source !== frameRef.current?.contentWindow) {
        return;
      }
      if (!isSandboxResizeMessage(event.data) || event.data.token !== token) {
        return;
      }

      const nextHeight = Math.max(
        1,
        minHeight ?? 0,
        Math.ceil(event.data.height),
      );
      setHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [minHeight, token]);

  return (
    <iframe
      ref={frameRef}
      className="wa-sandbox"
      title={title}
      srcDoc={bridgedSrcDoc}
      sandbox={sandbox}
      referrerPolicy="no-referrer"
      loading="eager"
      style={{ height, minHeight }}
    />
  );
}

function isSandboxResizeMessage(
  value: unknown,
): value is SandboxResizeMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SandboxResizeMessage>;
  return (
    candidate.type === "web-artifact:sandbox-resize" &&
    typeof candidate.token === "string" &&
    typeof candidate.height === "number" &&
    Number.isFinite(candidate.height)
  );
}

function injectResizeBridge(srcDoc: string, token: string): string {
  const bridge = `<script>${resizeBridgeScript(token)}</script>`;
  if (/<\/body\s*>/i.test(srcDoc)) {
    return srcDoc.replace(/<\/body\s*>/i, `${bridge}</body>`);
  }
  if (/<\/html\s*>/i.test(srcDoc)) {
    return srcDoc.replace(/<\/html\s*>/i, `${bridge}</html>`);
  }
  return `${srcDoc}${bridge}`;
}

function resizeBridgeScript(token: string): string {
  return `
(() => {
  const token = ${JSON.stringify(token)};
  const type = "web-artifact:sandbox-resize";
  let scheduled = false;

  function numeric(value) {
    return Number.isFinite(value) ? value : 0;
  }

  function measure() {
    const body = document.body;
    const root = document.documentElement;
    const bodyRect = body ? body.getBoundingClientRect() : { height: 0 };
    const rootRect = root ? root.getBoundingClientRect() : { height: 0 };
    return Math.max(
      1,
      numeric(body ? body.scrollHeight : 0),
      numeric(body ? body.offsetHeight : 0),
      numeric(bodyRect.height),
      numeric(root ? root.scrollHeight : 0),
      numeric(root ? root.offsetHeight : 0),
      numeric(rootRect.height),
    );
  }

  function postHeight() {
    scheduled = false;
    parent.postMessage({ type, token, height: measure() }, "*");
  }

  function schedule() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(postHeight);
  }

  function observe() {
    const root = document.documentElement;
    const body = document.body;
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(schedule);
      if (root) {
        resizeObserver.observe(root);
      }
      if (body) {
        resizeObserver.observe(body);
      }
    }
    if (window.MutationObserver && root) {
      new MutationObserver(schedule).observe(root, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    observe();
    schedule();
  });
  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(schedule).catch(() => undefined);
  }
  observe();
  schedule();
  setTimeout(schedule, 50);
  setTimeout(schedule, 250);
  setTimeout(schedule, 1000);
})();`;
}
