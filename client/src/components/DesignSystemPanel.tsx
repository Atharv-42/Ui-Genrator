import { useState } from "react";
import { tokenSwatch, type DesignToken, type TokenCategory } from "../utils/designSystem";

interface DesignSystemPanelProps { tokens: DesignToken[]; onApply: (token: DesignToken, replacement: string) => void; error: string; }
const categories: TokenCategory[] = ["Colors", "Typography", "Spacing", "Radius", "Shadows"];

export default function DesignSystemPanel({ tokens, onApply, error }: DesignSystemPanelProps) {
  const [selected, setSelected] = useState<DesignToken | null>(null);
  const [replacement, setReplacement] = useState("");
  const selectToken = (token: DesignToken) => { setSelected(token); setReplacement(token.value); };
  return <section className="design-system rounded-2xl border border-gray-800 bg-gray-900 p-5"><h2 className="text-xl font-semibold">Design System</h2><p className="mt-1 text-sm text-gray-400">Reusable Tailwind values extracted from the current code.</p><div className="mt-5 grid gap-5 lg:grid-cols-2">{categories.map((category) => { const categoryTokens = tokens.filter((token) => token.category === category); return <div key={category}><h3 className="mb-2 text-sm font-medium text-gray-300">{category}</h3><div className="flex flex-wrap gap-2">{categoryTokens.length ? categoryTokens.map((token) => <button key={token.value} type="button" onClick={() => selectToken(token)} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${selected?.value === token.value ? "border-purple-500 bg-purple-500/15" : "border-gray-700 bg-gray-950 hover:border-gray-500"}`}>{category === "Colors" && <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: tokenSwatch(token.value) }} />}<span>{token.value}</span><span className="text-gray-500">�{token.usage}</span></button>) : <span className="text-xs text-gray-500">None detected</span>}</div></div>; })}</div>{selected && <div className="mt-5 rounded-xl border border-gray-700 bg-gray-950 p-4"><p className="text-sm text-gray-300">Replace every <code className="text-purple-300">{selected.value}</code> token in the current code.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={replacement} onChange={(event) => setReplacement(event.target.value)} className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-purple-500" aria-label="Replacement Tailwind utility" /><button type="button" onClick={() => onApply(selected, replacement)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700">Apply token</button></div></div>}{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}</section>;
}


