import { useState, useEffect, useRef } from "react";
import { Copy, Download, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./CodeBlock";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MessageContentProps {
  content: string;
  isAssistant: boolean;
}

// Render math expressions using KaTeX
const renderMath = (text: string): string => {
  // Block math: $$...$$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="math-block my-2">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="math-block my-2">${math}</div>`;
    }
  });
  
  // Inline math: $...$
  text = text.replace(/\$([^$\n]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return math;
    }
  });
  
  // Square root: sqrt(x) or √x
  text = text.replace(/sqrt\(([^)]+)\)/gi, (_, content) => {
    try {
      return katex.renderToString(`\\sqrt{${content}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `√(${content})`;
    }
  });
  
  // Nth root: root(n,x) or nthroot(n,x)
  text = text.replace(/(?:root|nthroot)\((\d+),\s*([^)]+)\)/gi, (_, n, content) => {
    try {
      return katex.renderToString(`\\sqrt[${n}]{${content}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `${n}√(${content})`;
    }
  });
  
  // Unicode root symbol: √x
  text = text.replace(/√(\w+|\([^)]+\))/g, (_, content) => {
    const inner = content.startsWith('(') ? content.slice(1, -1) : content;
    try {
      return katex.renderToString(`\\sqrt{${inner}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `√${content}`;
    }
  });
  
  // Power notation: ^2, ^{n+1}, x^n, etc.
  text = text.replace(/(\w+)\^(\{[^}]+\}|\d+)/g, (_, base, exp) => {
    const exponent = exp.startsWith('{') ? exp.slice(1, -1) : exp;
    try {
      return katex.renderToString(`${base}^{${exponent}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `${base}<sup>${exponent}</sup>`;
    }
  });
  
  // Standalone power: ^2, ^{n+1}
  text = text.replace(/\^(\{[^}]+\}|\d+)/g, (_, exp) => {
    const exponent = exp.startsWith('{') ? exp.slice(1, -1) : exp;
    try {
      return katex.renderToString(`^{${exponent}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `<sup>${exponent}</sup>`;
    }
  });
  
  return text;
};

// Parse markdown-like formatting
const parseFormatting = (text: string): string => {
  // Bold: **text** or __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/(?<![a-zA-Z])_([^_]+)_(?![a-zA-Z])/g, '<em>$1</em>');
  
  // Underline: ++text++
  text = text.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
  
  // Strikethrough: ~~text~~
  text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  
  // Horizontal rule
  text = text.replace(/^---$/gm, '<hr class="my-3 border-primary/20" />');
  
  // Headers: # ## ###
  text = text.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
  
  // Lists: - or * or numbered
  text = text.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  
  // Line breaks
  text = text.replace(/\n/g, '<br />');
  
  return text;
};

// Detect PPT/DOCX content blocks
interface DocumentBlock {
  type: 'ppt' | 'docx';
  title: string;
  content: string;
}

const parseDocumentBlocks = (text: string): { blocks: DocumentBlock[]; remainingText: string } => {
  const blocks: DocumentBlock[] = [];
  let remaining = text;
  
  // PPT block: ```ppt or [PPT: title]
  const pptRegex = /```ppt\n([\s\S]*?)```|\[PPT:\s*([^\]]+)\]\n([\s\S]*?)(?=\[\/PPT\]|\n\n|$)/gi;
  remaining = remaining.replace(pptRegex, (match, content1, title, content2) => {
    blocks.push({
      type: 'ppt',
      title: title || 'Presentation',
      content: content1 || content2 || ''
    });
    return '';
  });
  
  // DOCX block: ```docx or [DOCX: title]
  const docxRegex = /```docx\n([\s\S]*?)```|\[DOCX:\s*([^\]]+)\]\n([\s\S]*?)(?=\[\/DOCX\]|\n\n|$)/gi;
  remaining = remaining.replace(docxRegex, (match, content1, title, content2) => {
    blocks.push({
      type: 'docx',
      title: title || 'Document',
      content: content1 || content2 || ''
    });
    return '';
  });
  
  return { blocks, remainingText: remaining.trim() };
};

const DocumentBlockComponent = ({ block }: { block: DocumentBlock }) => {
  const handleDownload = () => {
    const filename = `${block.title.replace(/[^a-z0-9]/gi, '_')}.${block.type === 'ppt' ? 'txt' : 'txt'}`;
    const blob = new Blob([block.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="my-3 rounded-lg border border-primary/30 bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{block.title}</span>
          <span className="text-xs text-muted-foreground uppercase">
            ({block.type === 'ppt' ? 'Presentation' : 'Document'})
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          className="h-7 px-3 text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
      </div>
      <div className="p-4 text-sm whitespace-pre-wrap text-foreground/90 max-h-[200px] overflow-y-auto">
        {block.content}
      </div>
    </div>
  );
};

export const MessageContent = ({ content, isAssistant }: MessageContentProps) => {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
    // First extract document blocks
    const { blocks: docBlocks, remainingText } = parseDocumentBlocks(text);
    
    const parts: { type: "text" | "code" | "document"; content: string; language?: string; docBlock?: DocumentBlock }[] = [];
    
    // Add document blocks
    docBlocks.forEach(block => {
      parts.push({ type: "document", content: "", docBlock: block });
    });
    
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    const textToProcess = remainingText;

    while ((match = codeBlockRegex.exec(textToProcess)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = textToProcess.slice(lastIndex, match.index).trim();
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
    if (lastIndex < textToProcess.length) {
      const remaining = textToProcess.slice(lastIndex).trim();
      if (remaining) {
        parts.push({ type: "text", content: remaining });
      }
    }

    // If no parts found from code parsing, return original as text
    if (parts.length === 0 || (parts.length === docBlocks.length && docBlocks.length > 0)) {
      if (textToProcess) {
        parts.push({ type: "text", content: textToProcess });
      }
    }

    return parts;
  };

  const renderText = (text: string) => {
    let processed = text;
    processed = renderMath(processed);
    processed = parseFormatting(processed);
    return processed;
  };

  const parts = parseContent(content);

  return (
    <div className="w-full">
      {/* Content */}
      <div className="space-y-2">
        {parts.map((part, index) => (
          <div key={index}>
            {part.type === "code" ? (
              <CodeBlock code={part.content} language={part.language} />
            ) : part.type === "document" && part.docBlock ? (
              <DocumentBlockComponent block={part.docBlock} />
            ) : (
              <div 
                className="whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderText(part.content) }}
              />
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
