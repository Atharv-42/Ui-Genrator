import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface LivePreviewProps {
  code: string;
  device: PreviewDevice;
  refreshKey: number;
}

function toPreviewModule(code: string) {
  if (/export\s+default/.test(code)) return code;
  if (/\bGeneratedUI\b/.test(code)) return `${code}\nexport default GeneratedUI;`;
  return code;
}
const deviceWidths: Record<PreviewDevice, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

/** Generated code is built and run by Sandpack in an isolated iframe. */
export default function LivePreview({ code, device, refreshKey }: LivePreviewProps) {
  return (
    <div className="flex h-[600px] items-start justify-center overflow-auto rounded-xl border border-gray-700 bg-gray-950 p-3">
      <div
        className="h-full shrink-0 overflow-hidden rounded-lg bg-white shadow-2xl transition-[width] duration-200"
        style={{ width: deviceWidths[device], maxWidth: "100%" }}
      >
        <SandpackProvider
          key={refreshKey}
          template="react-ts"
          theme="dark"
          customSetup={{ entry: "/src/main.tsx" }}
          files={{
            "/src/main.tsx": {
              code: 'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport GeneratedUI from "./GeneratedUI";\nimport "./styles.css";\n\ncreateRoot(document.getElementById("root")!).render(<GeneratedUI />);',
            },
            "/src/GeneratedUI.tsx": { code: code ? toPreviewModule(code) : "export default function GeneratedUI() { return null; }" },
            "/src/styles.css": {
              code: "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n* { box-sizing: border-box; }\nbody { margin: 0; font-family: Inter, system-ui, sans-serif; }",
            },
            "/public/index.html": { code: '<div id="root"></div><script src="https://cdn.tailwindcss.com"></script>' },
          }}
          options={{ activeFile: "/src/GeneratedUI.tsx", externalResources: ["https://cdn.tailwindcss.com"] }}
        >
          <SandpackPreview
            className="h-full [&>div]:h-full [&_iframe]:h-full"
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showNavigator={false}
          />
        </SandpackProvider>
      </div>
    </div>
  );
}

