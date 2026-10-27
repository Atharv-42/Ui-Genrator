import type { ComponentNode } from "../utils/designSystem";

interface ComponentTreeProps { components: ComponentNode[]; selectedId: string | null; onSelect: (component: ComponentNode) => void; }

export default function ComponentTree({ components, selectedId, onSelect }: ComponentTreeProps) {
  return <section className="component-tree rounded-2xl border border-gray-800 bg-gray-900 p-5"><h2 className="text-xl font-semibold">Component Tree</h2><p className="mt-1 text-sm text-gray-400">Detected from the code currently open in Monaco.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{components.length ? components.map((component) => <button key={component.id} type="button" onClick={() => onSelect(component)} className={`rounded-xl border p-3 text-left transition ${selectedId === component.id ? "border-purple-500 bg-purple-500/15" : "border-gray-700 bg-gray-950 hover:border-gray-500"}`}><div className="flex items-center justify-between"><span className="font-medium">{component.name}</span><span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{component.matches}</span></div><p className="mt-1 text-xs text-gray-400">{component.description}</p></button>) : <p className="text-sm text-gray-400">No common UI components were detected yet.</p>}</div>{selectedId && <p className="mt-4 rounded-lg bg-gray-950 p-3 text-sm text-gray-300">Selected component: <span className="font-medium text-white">{components.find((component) => component.id === selectedId)?.name}</span>. Use �Modify with AI� above for structural changes.</p>}</section>;
}

