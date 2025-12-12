import { useState, useEffect, useRef } from "react";
import { Copy, Download, Play, Check, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = "plaintext" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [displayCode, setDisplayCode] = useState(code);
  const codeRef = useRef<HTMLElement>(null);

  const isHtml = language.toLowerCase() === "html" || code.trim().startsWith("<!DOCTYPE") || code.trim().startsWith("<html");

  useEffect(() => {
    if (codeRef.current && !isEditing) {
      Prism.highlightElement(codeRef.current);
    }
  }, [displayCode, language, isEditing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = getExtension(language);
    const blob = new Blob([displayCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    setDisplayCode(editedCode);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedCode(displayCode);
    setIsEditing(false);
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

  const getPrismLanguage = (lang: string) => {
    const map: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      sh: "bash",
      shell: "bash",
    };
    return map[lang.toLowerCase()] || lang.toLowerCase();
  };

  return (
    <div className="rounded-lg overflow-hidden border border-primary/30 my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-primary/20">
        <span className="text-xs font-mono text-muted-foreground uppercase">
          {language}
        </span>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveEdit}
                className="h-7 px-2 text-xs text-accent"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-7 px-2 text-xs text-destructive"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2 text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
              {isHtml && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn("h-7 px-2 text-xs", showPreview && "bg-primary/20")}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {showPreview ? "Hide" : "Run"}
                </Button>
              )}
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
            </>
          )}
        </div>
      </div>

      {/* Code */}
      {isEditing ? (
        <textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className="w-full p-4 bg-white text-gray-900 font-mono text-sm min-h-[200px] max-h-[400px] resize-y focus:outline-none"
          spellCheck={false}
        />
      ) : (
        <pre className="p-4 overflow-x-auto text-sm font-mono max-h-[400px] overflow-y-auto bg-white">
          <code
            ref={codeRef}
            className={`language-${getPrismLanguage(language)} text-gray-900`}
          >
            {displayCode}
          </code>
        </pre>
      )}

      {/* HTML Preview */}
      {isHtml && showPreview && !isEditing && (
        <div className="border-t border-primary/20">
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
            Preview
          </div>
          <iframe
            srcDoc={displayCode}
            className="w-full h-64 bg-white"
            sandbox="allow-scripts"
            title="HTML Preview"
          />
        </div>
      )}
    </div>
  );
};
