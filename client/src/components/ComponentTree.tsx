import { ArrowUpRight, Blocks, Check, Layers3 } from "lucide-react";
import type { ComponentNode } from "../utils/designSystem";

interface ComponentTreeProps { components: ComponentNode[]; selectedId: string | null; onSelect: (component: ComponentNode) => void; }

export default function ComponentTree({ components, selectedId, onSelect }: ComponentTreeProps) {
  const totalMatches = components.reduce((total, component) => total + component.matches, 0);
  return <section className="component-workspace">
    <header className="component-hero">
      <span className="component-hero-icon"><Blocks size={24}/></span>
      <div className="component-hero-copy"><span className="component-kicker">CODE INSIGHTS</span><h1>Component tree</h1><p>Explore the reusable interface patterns detected in your generated code.</p></div>
      <div className="component-stats"><div><strong>{components.length}</strong><span>component types</span></div><div><strong>{totalMatches}</strong><span>detected patterns</span></div></div>
    </header>
    <div className="component-grid">{components.length ? components.map((component) => <button key={component.id} type="button" onClick={() => onSelect(component)} className={`component-card ${selectedId === component.id ? "selected" : ""}`}>
      <span className="component-card-icon"><Layers3 size={18}/></span><span className="component-card-body"><strong>{component.name}</strong><span>{component.description}</span></span><span className="component-match-count">{component.matches}<small>uses</small></span><ArrowUpRight className="component-card-arrow" size={16}/>
    </button>) : <div className="component-empty"><span><Blocks size={22}/></span><strong>No patterns detected yet</strong><p>Generate an interface to see its reusable components and structure here.</p></div>}</div>
    {selectedId && <div className="component-selection"><span><Check size={16}/></span><p><strong>{components.find((component) => component.id === selectedId)?.name}</strong> is selected. Use <b>Modify with AI</b> to make structural changes.</p></div>}
  </section>;
}
