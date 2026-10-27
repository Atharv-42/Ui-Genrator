import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Copy, Download, FolderOpen, LoaderCircle, LogOut, Monitor, RefreshCw, RotateCcw, Save, Smartphone, Sparkles, Tablet, Undo2, Upload, Wand2 } from "lucide-react";
import { generateUI, modifyUI, type UIAnalysis } from "./services/api";
import CodeEditor from "./components/CodeEditor";
import LivePreview, { type PreviewDevice } from "./components/LivePreview";
import ComponentTree from "./components/ComponentTree";
import DesignSystemPanel from "./components/DesignSystemPanel";
import { extractComponentTree, extractDesignTokens, replaceToken, type ComponentNode, type DesignToken } from "./utils/designSystem";
import { supabase, supabaseConfigured, type AuthUser } from "./lib/supabase";
import { deleteProject, downloadProjectExport, getProject, listProjects, restoreVersion, saveProject, versions, type Project, type Version } from "./services/projects";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function App() {
  const [user, setUser] = useState<AuthUser | null>(null); const [authReady, setAuthReady] = useState(false); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [authError, setAuthError] = useState(""); const [authBusy, setAuthBusy] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null); const [projectName, setProjectName] = useState("Untitled project"); const [saving, setSaving] = useState(false); const [saveError, setSaveError] = useState("");
  const [dashboard, setDashboard] = useState(false); const [projects, setProjects] = useState<Project[]>([]); const [exportingId, setExportingId] = useState<string | null>(null); const [exportMessage, setExportMessage] = useState(""); const [history, setHistory] = useState<Version[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [prompt, setPrompt] = useState("Recreate this UI using React and Tailwind CSS.");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [analysis, setAnalysis] = useState<UIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [modifying, setModifying] = useState(false);
  const [modificationError, setModificationError] = useState("");
  const [previousCode, setPreviousCode] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentNode | null>(null);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (!supabase) { setAuthReady(true); return; } supabase.auth.getUser().then(({ data }) => { setUser(data.user ? { id: data.user.id, email: data.user.email } : null); setAuthReady(true); }); const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)); return () => listener.subscription.unsubscribe(); }, []);

  const componentTree = useMemo(() => extractComponentTree(code), [code]);
  const designTokens = useMemo(() => extractDesignTokens(code), [code]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) return setError("Please upload a PNG, JPG, or WEBP image.");
    if (file.size > MAX_FILE_SIZE) return setError("Image must be 5 MB or smaller.");
    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!image) return setError("Please upload a screenshot first.");
    setLoading(true);
    setError("");
    try {
      const result = await generateUI(image, prompt);
      setAnalysis(result.analysis);
      setCode(result.code);
      setGeneratedCode(result.code);
      setPreviousCode(null);
      setModificationError("");
      setModificationPrompt("");
      setPreviewRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to generate UI.");
    } finally {
      setLoading(false);
    }
  };

  const handleModify = async () => {
    const instruction = modificationPrompt.trim();
    if (!instruction) return setModificationError("Describe the change you want to make.");
    setModifying(true);
    setModificationError("");
    try {
      const result = await modifyUI(code, instruction);
      setPreviousCode(code);
      setCode(result.code);
      setModificationPrompt("");
      setPreviewRefreshKey((key) => key + 1);
    } catch (requestError) {
      setModificationError(requestError instanceof Error ? requestError.message : "Failed to modify UI.");
    } finally {
      setModifying(false);
    }
  };

  const handleUndoModification = () => {
    if (!previousCode) return;
    setCode(previousCode);
    setPreviousCode(null);
    setPreviewRefreshKey((key) => key + 1);
  };
  const handleTokenApply = (token: DesignToken, replacement: string) => {
    try {
      const updatedCode = replaceToken(code, token.value, replacement);
      if (updatedCode === code) return setTokenError("This token was not found in the current code.");
      setPreviousCode(code);
      setCode(updatedCode);
      setTokenError("");
      setPreviewRefreshKey((key) => key + 1);
    } catch (tokenApplyError) {
      setTokenError(tokenApplyError instanceof Error ? tokenApplyError.message : "Unable to apply this token.");
    }
  };
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const authenticate = async (signup: boolean) => { if (!supabase) return; setAuthBusy(true); setAuthError(""); const result = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password }); setAuthBusy(false); if (result.error) setAuthError(result.error.message); else if (signup && !result.data.session) setAuthError("Check your email to confirm your account, then sign in."); };
  const loadDashboard = async () => { try { setProjects(await listProjects()); setDashboard(true); } catch (e) { setSaveError(e instanceof Error ? e.message : "Could not load projects."); } };
  const handleSave = async () => { if (!code) return; setSaving(true); setSaveError(""); try { const saved = await saveProject({ name: projectName, code, generatedCode, analysis, designSettings: { tokens: designTokens }, image }, projectId || undefined); setProjectId(saved.id); setProjectName(saved.name); setHistory(await versions(saved.id)); } catch (e) { setSaveError(e instanceof Error ? e.message : "Could not save project."); } finally { setSaving(false); } };
  const handleExport = async (project: Pick<Project, "id" | "name">) => { setExportingId(project.id); setExportMessage(""); try { await downloadProjectExport(project.id, project.name); setExportMessage(`${project.name} was downloaded as a ZIP.`); } catch (e) { setExportMessage(e instanceof Error ? e.message : "Could not export project."); } finally { setExportingId(null); } };
  const openProject = async (id: string) => { const project = await getProject(id); setProjectId(project.id); setProjectName(project.name); setCode(project.current_code); setGeneratedCode(project.generated_code); setAnalysis(project.analysis); setHistory(await versions(project.id)); setPreviewRefreshKey((key) => key + 1); setDashboard(false); };
  const restore = async (version: Version) => { if (!projectId) return; const project = await restoreVersion(projectId, version.id); setCode(project.current_code); setGeneratedCode(project.generated_code); setAnalysis(project.analysis); setHistory(await versions(project.id)); setPreviewRefreshKey((key) => key + 1); };
  if (!authReady) return <div className="min-h-screen bg-gray-950 p-10 text-white">Loading PixelForge?</div>;
  if (!supabaseConfigured) return <div className="min-h-screen bg-gray-950 p-10 text-white">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env.</div>;
  if (!user) return <main className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white"><form onSubmit={(e) => { e.preventDefault(); void authenticate(false); }} className="w-full max-w-md space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6"><h1 className="text-2xl font-bold">PixelForge AI</h1><p className="text-sm text-gray-400">Sign in to save projects and version history.</p><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3"/><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3"/>{authError && <p className="text-sm text-red-300">{authError}</p>}<div className="flex gap-3"><button disabled={authBusy} className="rounded-lg bg-purple-600 px-4 py-2">Sign in</button><button type="button" disabled={authBusy} onClick={() => void authenticate(true)} className="rounded-lg border border-gray-700 px-4 py-2">Create account</button></div></form></main>;
  if (dashboard) return <main className="min-h-screen bg-gray-950 p-6 text-white"><div className="mx-auto max-w-4xl"><div className="mb-6 flex justify-between"><h1 className="text-2xl font-bold">Your projects</h1><button onClick={() => setDashboard(false)} className="rounded-lg border border-gray-700 px-3 py-2">Back to editor</button></div>{projects.map((p) => <div key={p.id} className="mb-3 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"><div><p className="font-medium">{p.name}</p><p className="text-xs text-gray-400">Updated {new Date(p.updated_at).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={() => void openProject(p.id)} className="rounded bg-purple-600 px-3 py-2 text-sm">Open</button><button disabled={exportingId === p.id} onClick={() => void handleExport(p)} className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm disabled:opacity-50">{exportingId === p.id ? <LoaderCircle size={15} className="animate-spin"/> : <Download size={15}/>} {exportingId === p.id ? "Exporting…" : "Export ZIP"}</button><button onClick={async () => { if (confirm(`Delete ${p.name}?`)) { await deleteProject(p.id); void loadDashboard(); } }} className="rounded border border-red-800 px-3 py-2 text-sm text-red-300">Delete</button></div></div>)}{exportMessage && <p role="status" className="mb-3 text-sm text-purple-200">{exportMessage}</p>}{!projects.length && <p className="text-gray-400">No saved projects yet.</p>}</div></main>;
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div><h1 className="text-2xl font-bold">PixelForge AI</h1><p className="text-sm text-gray-400">Screenshot ? React UI Generator</p></div>
          <div className="flex items-center gap-2"><button onClick={() => void loadDashboard()} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm"><FolderOpen size={16}/>Projects</button><button onClick={() => projectId && void handleExport({ id: projectId, name: projectName })} disabled={!projectId || exportingId === projectId} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm disabled:opacity-50"><Download size={16}/>{exportingId === projectId ? "Exporting…" : "Export ZIP"}</button><button onClick={() => void handleSave()} disabled={!code || saving} className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm disabled:opacity-50"><Save size={16}/>{saving ? "Saving?" : "Save"}</button><button onClick={() => void supabase?.auth.signOut()} className="rounded-lg border border-gray-700 p-2" aria-label="Sign out"><LogOut size={16}/></button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {projectId && <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4"><div className="mb-3 flex items-center justify-between"><input value={projectName} onChange={(e) => setProjectName(e.target.value)} aria-label="Project name" className="rounded border border-gray-700 bg-gray-950 px-3 py-2"/><span className="text-sm text-gray-400">Version history</span></div>{history.map((version) => <div key={version.id} className="mb-2 flex items-center justify-between text-sm"><span>Version {version.version_number} · {new Date(version.created_at).toLocaleString()}</span><button onClick={() => void restore(version)} className="rounded border border-gray-700 px-2 py-1">Restore</button></div>)}</section>}
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        {exportMessage && <div role="status" className="rounded-lg border border-purple-900 bg-purple-950/50 p-3 text-sm text-purple-100">{exportMessage}</div>}{saveError && <div role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{saveError}</div>}
          <h2 className="mb-4 text-xl font-semibold">1. Upload Screenshot</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-10 transition hover:border-purple-500">
            <Upload size={40} className="mb-3 text-gray-400" />
            <span className="text-gray-300">Click to upload screenshot</span>
            <span className="mt-2 text-sm text-gray-500">PNG, JPG, or WEBP Â· maximum 5 MB</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload} />
          </label>
          {image && <p className="mt-3 text-sm text-gray-400">Selected: {image.name}</p>}
          {preview && <img src={preview} alt="Uploaded screenshot" className="mt-6 max-h-[400px] rounded-xl border border-gray-700" />}
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">2. AI Instructions</h2>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} className="w-full rounded-xl border border-gray-700 bg-gray-950 p-4 outline-none focus:border-purple-500" placeholder="Tell AI how you want the UI generated..." />
          <button onClick={handleGenerate} disabled={loading} className="mt-5 flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-medium transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}{loading ? "Analyzing screenshotâ€¦" : "Generate React UI"}
          </button>
          {error && <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200"><AlertCircle size={18} />{error}</div>}
        </section>
        {analysis && <AnalysisPanel analysis={analysis} />}
        {code && <section>
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Generated React UI</h2><button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800">{copied ? <><Check size={16} />Copied</> : <><Copy size={16} />Copy Code</>}</button></div>
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-gray-400">Code Editor</p>
              <CodeEditor code={code} onChange={setCode} />
            </div>
            <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="font-semibold text-white">Modify with AI</h3><p className="text-sm text-gray-400">Describe a focused change; your current editor code will be preserved until it succeeds.</p></div>
                <button type="button" onClick={handleUndoModification} disabled={!previousCode || modifying} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><Undo2 size={16} />Undo change</button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input value={modificationPrompt} onChange={(event) => setModificationPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleModify(); } }} disabled={modifying} className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-purple-500 disabled:opacity-60" placeholder="e.g. Make the navbar blue and keep everything else unchanged" />
                <button type="button" onClick={() => void handleModify()} disabled={modifying || !modificationPrompt.trim()} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-medium hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{modifying ? <LoaderCircle size={17} className="animate-spin" /> : <Wand2 size={17} />}{modifying ? "Updating UI…" : "Apply change"}</button>
              </div>
              {modificationError && <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200"><AlertCircle size={17} />{modificationError}</div>}
            </section>
            <div>
              <p className="mb-3 text-sm text-gray-400">Live Preview</p>
              <LivePreview code={code} device={previewDevice} refreshKey={previewRefreshKey} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-gray-700 bg-gray-900 p-1 sm:w-auto" role="group" aria-label="Preview device size">
                  {([ ["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"] ] as const).map(([device, Icon, label]) => (
                    <button key={device} type="button" onClick={() => setPreviewDevice(device)} title={label} aria-label={label} className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition sm:text-sm ${previewDevice === device ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}><Icon size={16} /><span>{label}</span></button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setPreviewRefreshKey((key) => key + 1)} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800"><RefreshCw size={15} />Refresh preview</button>
                  <button type="button" onClick={() => { setCode(generatedCode); setPreviewRefreshKey((key) => key + 1); }} disabled={code === generatedCode} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw size={15} />Reset code</button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Edits update automatically. Build errors are shown inside the isolated preview.</p>
            </div>
          </div>
        </section>}
        {code && <div className="space-y-6">
          <ComponentTree components={componentTree} selectedId={selectedComponent?.id || null} onSelect={setSelectedComponent} />
          <DesignSystemPanel tokens={designTokens} onApply={handleTokenApply} error={tokenError} />
        </div>}
      </main>
    </div>
  );
}

function AnalysisPanel({ analysis }: { analysis: UIAnalysis }) {
  const details = [["Layout", analysis.layout], ["Typography", analysis.typography], ["Spacing", analysis.spacing], ["Responsive behavior", analysis.responsiveBehavior]];
  return <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6"><h2 className="mb-5 text-xl font-semibold">AI Analysis</h2><div className="grid gap-4 md:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-xl bg-gray-950 p-4"><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-gray-200">{value}</p></div>)}<div className="rounded-xl bg-gray-950 p-4"><p className="mb-2 text-sm text-gray-500">Components</p><div className="flex flex-wrap gap-2">{analysis.components.map((component) => <span key={component} className="rounded-full bg-purple-600/20 px-3 py-1 text-sm text-purple-300">{component}</span>)}</div></div><div className="rounded-xl bg-gray-950 p-4"><p className="mb-2 text-sm text-gray-500">Colors</p><div className="flex flex-wrap gap-3">{analysis.colors.map((color) => <div key={color} className="flex items-center gap-2"><span className="h-6 w-6 rounded-full border border-gray-600" style={{ backgroundColor: color }} /><span className="text-sm">{color}</span></div>)}</div></div></div></section>;
}

export default App;









