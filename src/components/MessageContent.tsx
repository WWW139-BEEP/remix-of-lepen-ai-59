import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./CodeBlock";

interface MessageContentProps {
  content: string;
  isAssistant: boolean;
}

export const MessageContent = ({ content, isAssistant }: MessageContentProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "response.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse content for code blocks
  const parseContent = (text: string) => {
    const parts: { type: "text" | "code"; content: string; language?: string }[] = [];
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index).trim();
        if (textBefore) {
          parts.push({ type: "text", content: textBefore });
        }
      }

      // Add code block
      parts.push({
        type: "code",
        content: match[2].trim(),
        language: match[1] || "plaintext",
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex).trim();
      if (remaining) {
        parts.push({ type: "text", content: remaining });
      }
    }

    // If no parts found, return original as text
    if (parts.length === 0) {
      parts.push({ type: "text", content: text });
    }

    return parts;
  };

  const parts = parseContent(content);
  const hasCode = parts.some((p) => p.type === "code");

  return (
    <div className="w-full">
      {/* Content */}
      <div className="space-y-2">
        {parts.map((part, index) => (
          <div key={index}>
            {part.type === "code" ? (
              <CodeBlock code={part.content} language={part.language} />
            ) : (
              <p className="whitespace-pre-wrap break-words">{part.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* Copy/Download actions for assistant messages */}
      {isAssistant && content && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-primary/10">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copied" : "Copy All"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownloadAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
};
