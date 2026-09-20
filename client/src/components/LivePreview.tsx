interface LivePreviewProps {
  code: string;
}

export default function LivePreview({
  code,
}: LivePreviewProps) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body>
  <div id="root"></div>

  <script type="module">
    ${code}
  </script>
</body>
</html>
`;

  return (
    <div className="h-[600px] overflow-hidden rounded-xl border bg-white">
      <iframe
        title="Generated UI Preview"
        srcDoc={html}
        className="h-full w-full"
        sandbox="allow-scripts"
      />
    </div>
  );
}