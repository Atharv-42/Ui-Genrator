import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  theme: "light" | "dark";
}

export default function CodeEditor({
  code,
  onChange,
  theme,
}: CodeEditorProps) {
  return (
    <div className="code-editor h-[600px] overflow-hidden rounded-xl border border-gray-700">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme={theme === "dark" ? "vs-dark" : "vs"}
        value={code}
        onChange={(value) => onChange(value || "")}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          automaticLayout: true,
          wordWrap: "on",
          padding: {
            top: 15,
          },
        }}
      />
    </div>
  );
}
