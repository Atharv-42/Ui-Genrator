import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({
  code,
  onChange,
}: CodeEditorProps) {
  return (
    <div className="code-editor h-[600px] overflow-hidden rounded-xl border border-gray-700">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
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
