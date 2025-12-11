import { useState } from "react";
import { Copy, Download, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = "plaintext" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isHtml = language.toLowerCase() === "html" || code.trim().startsWith("<!DOCTYPE") || code.trim().startsWith("<html");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = getExtension(language);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getExtension = (lang: string) => {
    const map: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      jsx: "jsx",
      tsx: "tsx",
      markdown: "md",
      sql: "sql",
      bash: "sh",
      shell: "sh",
    };
    return map[lang.toLowerCase()] || "txt";
  };

  return (
    <div className="rounded-lg overflow-hidden border border-primary/30 bg-background/80 my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-primary/20">
        <span className="text-xs font-mono text-muted-foreground uppercase">
          {language}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-7 px-2 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          {isHtml && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
              className={cn("h-7 px-2 text-xs", showPreview && "bg-primary/20")}
            >
              <Play className="w-3 h-3 mr-1" />
              {showPreview ? "Hide Preview" : "Run"}
            </Button>
          )}
        </div>
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto text-sm font-mono text-foreground/90 max-h-[400px] overflow-y-auto">
        <code>{code}</code>
      </pre>

      {/* HTML Preview */}
      {isHtml && showPreview && (
        <div className="border-t border-primary/20">
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
            Preview
          </div>
          <iframe
            srcDoc={code}
            className="w-full h-64 bg-white"
            sandbox="allow-scripts"
            title="HTML Preview"
          />
        </div>
      )}
    </div>
  );
};
