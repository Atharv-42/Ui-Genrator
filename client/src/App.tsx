import { useState } from "react";
import { Upload, Sparkles, Copy, Check } from "lucide-react";

import { generateUI } from "./services/api";

import CodeEditor from "./components/CodeEditor";
import LivePreview from "./components/LivePreview";

function App() {
  const [image, setImage] = useState<File | null>(null);

  const [preview, setPreview] = useState("");

  const [prompt, setPrompt] = useState(
    "Recreate this UI using React and Tailwind CSS."
  );

  const [code, setCode] = useState("");

  const [analysis, setAnalysis] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);

    setPreview(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!image) {
      alert("Please upload a screenshot first.");
      return;
    }

    try {
      setLoading(true);

      const result = await generateUI(image, prompt);

      setAnalysis(result.analysis);

      setCode(result.code);
    } catch (error) {
      console.error(error);

      alert("Failed to generate UI.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}

      <header className="border-b border-gray-800 px-8 py-5">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              PixelForge AI
            </h1>

            <p className="text-sm text-gray-400">
              Screenshot → React UI Generator
            </p>
          </div>

          <Sparkles className="text-purple-400" />

        </div>

      </header>


      {/* Main */}

      <main className="mx-auto max-w-7xl space-y-8 px-8 py-8">

        {/* Upload */}

        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

          <h2 className="mb-4 text-xl font-semibold">
            1. Upload Screenshot
          </h2>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-10 transition hover:border-purple-500">

            <Upload size={40} className="mb-3 text-gray-400" />

            <span className="text-gray-300">
              Click to upload screenshot
            </span>

            <span className="mt-2 text-sm text-gray-500">
              PNG, JPG or WEBP
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />

          </label>


          {preview && (
            <div className="mt-6">

              <img
                src={preview}
                alt="Uploaded screenshot"
                className="max-h-[400px] rounded-xl border border-gray-700"
              />

            </div>
          )}

        </section>


        {/* Prompt */}

        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

          <h2 className="mb-4 text-xl font-semibold">
            2. AI Instructions
          </h2>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-700 bg-gray-950 p-4 outline-none focus:border-purple-500"
            placeholder="Tell AI how you want the UI generated..."
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-medium transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Sparkles size={18} />

            {loading
              ? "Generating..."
              : "Generate React UI"}

          </button>

        </section>


        {/* Analysis */}

        {analysis && (

          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

            <h2 className="mb-5 text-xl font-semibold">
              AI Analysis
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <div className="rounded-xl bg-gray-950 p-4">

                <p className="text-sm text-gray-500">
                  Layout
                </p>

                <p className="mt-1">
                  {analysis.layout}
                </p>

              </div>


              <div className="rounded-xl bg-gray-950 p-4">

                <p className="text-sm text-gray-500">
                  Typography
                </p>

                <p className="mt-1">
                  {analysis.typography}
                </p>

              </div>


              <div className="rounded-xl bg-gray-950 p-4">

                <p className="mb-2 text-sm text-gray-500">
                  Components
                </p>

                <div className="flex flex-wrap gap-2">

                  {analysis.components.map(
                    (component: string) => (
                      <span
                        key={component}
                        className="rounded-full bg-purple-600/20 px-3 py-1 text-sm text-purple-300"
                      >
                        {component}
                      </span>
                    )
                  )}

                </div>

              </div>


              <div className="rounded-xl bg-gray-950 p-4">

                <p className="mb-2 text-sm text-gray-500">
                  Colors
                </p>

                <div className="flex gap-3">

                  {analysis.colors.map(
                    (color: string) => (
                      <div
                        key={color}
                        className="flex items-center gap-2"
                      >

                        <div
                          className="h-7 w-7 rounded-full border border-gray-600"
                          style={{
                            backgroundColor: color,
                          }}
                        />

                        <span className="text-sm">
                          {color}
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

          </section>

        )}


        {/* Editor + Preview */}

        {code && (

          <section>

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-semibold">
                Generated React UI
              </h2>

              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
              >

                {copied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Code
                  </>
                )}

              </button>

            </div>


            <div className="grid gap-6 lg:grid-cols-2">

              <div>

                <p className="mb-3 text-sm text-gray-400">
                  Code Editor
                </p>

                <CodeEditor
                  code={code}
                  onChange={setCode}
                />

              </div>


              <div>

                <p className="mb-3 text-sm text-gray-400">
                  Live Preview
                </p>

                <LivePreview code={code} />

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;  