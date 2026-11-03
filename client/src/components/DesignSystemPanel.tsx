import { useState } from "react";
import { ArrowRight, Check, Circle, Layers3, Palette, Ruler, Sparkles, Type } from "lucide-react";
import { tokenSwatch, type DesignToken, type TokenCategory } from "../utils/designSystem";

interface DesignSystemPanelProps { tokens: DesignToken[]; onApply: (token: DesignToken, replacement: string) => void; error: string; }
const categories: Array<{ name: TokenCategory; icon: typeof Palette; description: string; accent: string }> = [
  { name: "Colors", icon: Palette, description: "Color utilities used across the interface", accent: "violet" },
  { name: "Typography", icon: Type, description: "Text size, weight, and rhythm", accent: "blue" },
  { name: "Spacing", icon: Ruler, description: "Padding, margins, and layout gaps", accent: "cyan" },
  { name: "Radius", icon: Circle, description: "Corner styles for interface elements", accent: "pink" },
  { name: "Shadows", icon: Layers3, description: "Depth and elevation utilities", accent: "amber" },
];

export default function DesignSystemPanel({ tokens, onApply, error }: DesignSystemPanelProps) {
  const [selected, setSelected] = useState<DesignToken | null>(null);
  const [replacement, setReplacement] = useState("");
  const selectToken = (token: DesignToken) => { setSelected(token); setReplacement(token.value); };
  const usageCount = tokens.reduce((total, token) => total + token.usage, 0);

  return <section className="design-dashboard">
    <header className="design-hero">
      <div className="design-hero-copy">
        <span className="design-kicker"><Sparkles size={14}/> DESIGN WORKSPACE</span>
        <h1>Design system</h1>
        <p>Explore and refine the reusable styles found in your generated interface.</p>
      </div>
      <div className="design-summary">
        <div><span className="design-summary-icon"><Palette size={19}/></span><strong>{tokens.length}</strong><span>unique tokens</span></div>
        <div><span className="design-summary-icon blue"><Layers3 size={19}/></span><strong>{usageCount}</strong><span>total usages</span></div>
      </div>
    </header>

    <div className="design-content">
      <div className="design-category-grid">
        {categories.map(({ name, icon: Icon, description, accent }) => {
          const categoryTokens = tokens.filter((token) => token.category === name);
          return <section className={`design-category accent-${accent}`} key={name}>
            <div className="design-category-heading">
              <span className="design-category-icon"><Icon size={19}/></span>
              <div><h2>{name}</h2><p>{description}</p></div>
              <span className="design-count">{categoryTokens.length}</span>
            </div>
            {categoryTokens.length ? <div className={`design-token-list ${name === "Colors" ? "color-token-list" : ""}`}>
              {categoryTokens.map((token) => <button key={token.value} type="button" onClick={() => selectToken(token)} className={`design-token ${selected?.category === token.category && selected.value === token.value ? "selected" : ""}`}>
                {name === "Colors" && <span className="design-swatch" style={{ backgroundColor: tokenSwatch(token.value) || "currentColor" }}/>}<span className="design-token-value">{token.value}</span><span className="design-token-usage">× {token.usage}</span>{selected?.category === token.category && selected.value === token.value && <Check className="design-token-check" size={14}/>}
              </button>)}
            </div> : <p className="design-empty">No {name.toLowerCase()} detected in the current code.</p>}
          </section>;
        })}
      </div>

      <aside className="design-editor">
        <div className="design-editor-heading"><span className="design-editor-icon"><Sparkles size={18}/></span><div><h2>Token editor</h2><p>Apply a utility change throughout your code.</p></div></div>
        {selected ? <>
          <div className="design-selected-token"><span className="design-selected-label">SELECTED TOKEN</span><div><span className="design-swatch large" style={{ backgroundColor: tokenSwatch(selected.value) || "#8b5cf6" }}/><code>{selected.value}</code><span className="design-token-usage">× {selected.usage}</span></div></div>
          <label className="design-replacement-label" htmlFor="design-replacement">Replace with</label>
          <div className="design-replacement-row"><input id="design-replacement" value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="Enter a Tailwind utility"/><button type="button" onClick={() => onApply(selected, replacement)} disabled={!replacement.trim() || /\s/.test(replacement.trim())}><span>Apply change</span><ArrowRight size={16}/></button></div>
          <p className="design-editor-hint">Every matching <code>{selected.value}</code> utility in the generated code will be updated.</p>
        </> : <div className="design-editor-empty"><span><Palette size={22}/></span><strong>Choose a token to edit</strong><p>Select any token card to prepare a project wide replacement.</p></div>}
        {error && <p role="alert" className="design-error">{error}</p>}
      </aside>
    </div>
  </section>;
}
