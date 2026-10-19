import { useMemo } from "react";
import * as Babel from "@babel/standalone";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface LivePreviewProps {
  code: string;
  device: PreviewDevice;
  refreshKey: number;
}

const deviceWidths: Record<PreviewDevice, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

function toPreviewModule(code: string) {
  // React is loaded as a global inside the sandboxed iframe, so generated code
  // does not need a package import that a Blob module cannot resolve.
  const withoutReactImport = code.replace(/import\s+React\s+from\s+["']react["'];?\s*/g, "");
  if (/export\s+default/.test(withoutReactImport)) return withoutReactImport;
  if (/\bGeneratedUI\b/.test(withoutReactImport)) return `${withoutReactImport}\nexport default GeneratedUI;`;
  return withoutReactImport;
}
function createPreviewDocument(compiledCode: string) {
  const safeCode = JSON.stringify(compiledCode).replaceAll("</script", "<\\/script");

  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<style>body{margin:0;font-family:Inter,system-ui,sans-serif}#preview-error{padding:16px;color:#b91c1c;white-space:pre-wrap;font-family:ui-monospace,monospace}</style>
</head><body><div id="root"></div><script type="module">
const showError = (error) => { document.getElementById("root").innerHTML = '<div id="preview-error">Preview error: ' + String(error?.message || error) + '</div>'; };
try {
  const source = ${safeCode};
  const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  const { default: GeneratedUI } = await import(moduleUrl);
  URL.revokeObjectURL(moduleUrl);
  if (!GeneratedUI) throw new Error("The generated code must export a React component.");
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(GeneratedUI));
} catch (error) { showError(error); }
</script></body></html>`;
}

/** Compiles TSX locally; generated code executes only in the sandboxed iframe. */
export default function LivePreview({ code, device, refreshKey }: LivePreviewProps) {
  const result = useMemo(() => {
    try {
      const transformed = Babel.transform(toPreviewModule(code), {
        filename: "GeneratedUI.tsx",
        presets: [["typescript", { ignoreExtensions: true }], ["react", { runtime: "classic" }]],
        sourceType: "module",
      });
      if (!transformed) throw new Error("The preview compiler did not return output.");
      return { html: createPreviewDocument(transformed.code || ""), error: "" };
    } catch (error) {
      return { html: "", error: error instanceof Error ? error.message : "Unable to compile the preview." };
    }
  }, [code, refreshKey]);

  return (
    <div className="flex h-[600px] items-start justify-center overflow-auto rounded-xl border border-gray-700 bg-gray-950 p-3">
      <div className="h-full shrink-0 overflow-hidden rounded-lg bg-white shadow-2xl transition-[width] duration-200" style={{ width: deviceWidths[device] }}>
        {result.error ? (
          <pre className="m-0 h-full overflow-auto bg-red-950 p-4 text-sm whitespace-pre-wrap text-red-100">Preview compilation error: {result.error}</pre>
        ) : (
          <iframe key={refreshKey} title="Generated UI Preview" srcDoc={result.html} sandbox="allow-scripts" className="h-full w-full border-0" />
        )}
      </div>
    </div>
  );
}





