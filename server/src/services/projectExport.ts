import { ZipArchive } from "archiver";
import type { Response } from "express";
import { supabaseAdmin } from "./supabase";

const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "pixelforge-project";
const cleanName = (value: string) => value.replace(/[<>:&"']/g, "").slice(0, 120) || "PixelForge project";
const component = (value: unknown) => {
  const code = typeof value === "string" ? value.trim().replace(/^```(?:tsx?|typescript|javascript|jsx)?\s*/i, "").replace(/\s*```$/, "") : "";
  if (!code || code.length > 100_000) throw new Error("This project does not contain exportable component code.");
  if (!/\bGeneratedUI\b/.test(code) || /<script|ReactDOM\.createRoot|^\s*import\s/im.test(code)) throw new Error("Saved code must be a self-contained GeneratedUI component without imports or scripts.");
  return /export\s+default\s+GeneratedUI\s*;?\s*$/.test(code) ? code : `${code}\n\nexport default GeneratedUI;`;
};
const imageExtension = (type: string) => type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
const validImage = (data: Buffer, type: string) => (type === "image/png" && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) || (type === "image/jpeg" && data.subarray(0, 3).equals(Buffer.from([255,216,255]))) || (type === "image/webp" && data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP");
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

export async function streamProjectExport(res: Response, project: any) {
  const projectName = cleanName(String(project.name || "PixelForge project"));
  const folder = slug(projectName);
  const code = component(project.current_code);
  const files: Record<string, string> = {
    "package.json": json({ name: folder, private: true, version: "1.0.0", type: "module", scripts: { dev: "vite", build: "tsc -b && vite build", preview: "vite preview" }, dependencies: { "@tailwindcss/vite": "^4.3.3", "@vitejs/plugin-react": "^6.1.1", react: "^19.2.8", "react-dom": "^19.2.8", tailwindcss: "^4.3.3", typescript: "~6.0.2", vite: "^8.3.0" }, devDependencies: { "@types/react": "^19.2.18", "@types/react-dom": "^19.2.7" } }),
    "vite.config.ts": 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] });\n',
    "tailwind.config.js": 'export default { content: ["./index.html", "./src/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] };\n',
    "tsconfig.json": json({ files: [], references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }] }),
    "tsconfig.app.json": json({ compilerOptions: { target: "ES2022", useDefineForClassFields: true, lib: ["ES2022", "DOM", "DOM.Iterable"], skipLibCheck: true, strict: true, noEmit: true, jsx: "react-jsx", module: "ESNext", moduleResolution: "Bundler", isolatedModules: true }, include: ["src"] }),
    "tsconfig.node.json": json({ compilerOptions: { target: "ES2023", module: "ESNext", skipLibCheck: true, moduleResolution: "Bundler", noEmit: true, strict: true }, include: ["vite.config.ts"] }),
    "index.html": `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${projectName}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
    "src/main.tsx": 'import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport "./index.css";\nimport App from "./App";\n\ncreateRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);\n',
    "src/App.tsx": 'import GeneratedUI from "./GeneratedUI";\n\nexport default function App() { return <GeneratedUI />; }\n',
    "src/GeneratedUI.tsx": `${code}\n`,
    "src/index.css": '@import "tailwindcss";\n\n:root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #f8fafc; background: #030712; }\nbody { margin: 0; min-width: 320px; min-height: 100vh; }\n* { box-sizing: border-box; }\n',
    ".gitignore": "node_modules\ndist\n.env\n",
    "README.md": `# ${projectName}\n\nStandalone React, TypeScript, Vite, and Tailwind CSS project exported from PixelForge AI.\n\n## Requirements\n\n- Node.js 20.19+ (or 22.12+)\n- npm 10+\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen the local URL reported by Vite.\n\n## Production build\n\n\`\`\`bash\nnpm run build\nnpm run preview\n\`\`\`\n\nThe generated UI is in \`src/GeneratedUI.tsx\`. If included, the original reference screenshot is in \`src/assets/\`.\n`
  };
  let asset: { buffer: Buffer; extension: string } | undefined;
  if (project.reference_image_path) {
    const { data, error } = await supabaseAdmin().storage.from("project-references").download(project.reference_image_path);
    if (error || !data) throw new Error("The project reference asset could not be included in the export.");
    const type = data.type; const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024 || !validImage(buffer, type)) throw new Error("The stored reference asset is not a supported image.");
    asset = { buffer, extension: imageExtension(type) };
  }
  res.attachment(`${folder}.zip`); res.type("application/zip");
  const zip = new ZipArchive({ zlib: { level: 9 } });
  zip.pipe(res);
  for (const [path, contents] of Object.entries(files)) zip.append(contents, { name: `${folder}/${path}` });
  if (asset) zip.append(asset.buffer, { name: `${folder}/src/assets/reference.${asset.extension}` });
  await zip.finalize();
}
