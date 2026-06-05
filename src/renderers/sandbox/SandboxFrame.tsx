export interface SandboxFrameProps {
  title: string;
  srcDoc: string;
  minHeight?: number;
  sandbox?: string;
}

export function SandboxFrame({
  title,
  srcDoc,
  minHeight = 280,
  sandbox = "allow-scripts",
}: SandboxFrameProps) {
  return (
    <iframe
      className="wa-sandbox"
      title={title}
      srcDoc={srcDoc}
      sandbox={sandbox}
      referrerPolicy="no-referrer"
      style={{ minHeight }}
    />
  );
}
