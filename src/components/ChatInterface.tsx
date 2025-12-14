import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Loader2, Upload, X, MessageSquare, Image, Hammer, Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sparkle } from "./SparkleEffect";
import { MessageContent } from "./MessageContent";
import { MapView } from "./MapView";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/hooks/useConversations";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  category: string;
  content: string;
  preview?: string;
  canRead: boolean;
}

interface ChatInterfaceProps {
  mode: string;
  conversationId: string | null;
  initialMessages?: Message[];
  onSaveMessage?: (role: "user" | "assistant", content: string, imageUrl?: string) => Promise<void>;
  onModeChange?: (mode: string) => void;
}

const modes = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "images", label: "Images", icon: Image },
  { id: "code", label: "Build", icon: Hammer },
];

interface MapData {
  message?: string;
  locations: Array<{
    name: string;
    lat: number;
    lng: number;
    description?: string;
    type?: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  route?: {
    from: string;
    to: string;
    waypoints?: string[];
  };
}

// Detect file type from extension
function getFileTypeInfo(filename: string, mimeType: string): { type: string; category: string; canRead: boolean } {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  // Image types - supported: jpg, jpeg, png, svg
  const supportedImageExts = ['jpg', 'jpeg', 'png', 'svg'];
  const otherImageExts = ['gif', 'webp', 'bmp', 'ico', 'heic', 'heif'];
  
  if (supportedImageExts.includes(ext)) {
    return { type: 'image', category: ext.toUpperCase() + ' Image', canRead: true };
  }
  if (otherImageExts.includes(ext) || mimeType.startsWith('image/')) {
    return { type: 'image', category: ext.toUpperCase() + ' Image (unsupported format)', canRead: false };
  }
  
  // Code types
  const codeExts: Record<string, string> = {
    'js': 'JavaScript', 'jsx': 'JSX', 'ts': 'TypeScript', 'tsx': 'TSX',
    'py': 'Python', 'java': 'Java', 'cpp': 'C++', 'c': 'C', 'cs': 'C#',
    'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP', 'swift': 'Swift',
    'kt': 'Kotlin', 'scala': 'Scala', 'r': 'R', 'sql': 'SQL', 'sh': 'Shell',
    'bash': 'Bash', 'ps1': 'PowerShell', 'lua': 'Lua', 'perl': 'Perl'
  };
  if (codeExts[ext]) {
    return { type: 'code', category: codeExts[ext], canRead: true };
  }
  
  // Markup types
  const markupExts: Record<string, string> = {
    'html': 'HTML', 'htm': 'HTML', 'xml': 'XML', 'xhtml': 'XHTML',
    'css': 'CSS', 'scss': 'SCSS', 'sass': 'Sass', 'less': 'LESS',
    'md': 'Markdown', 'markdown': 'Markdown', 'yaml': 'YAML', 'yml': 'YAML',
    'json': 'JSON', 'toml': 'TOML', 'ini': 'INI', 'cfg': 'Config'
  };
  if (markupExts[ext]) {
    return { type: 'markup', category: markupExts[ext], canRead: true };
  }
  
  // Text types
  const textExts = ['txt', 'log', 'csv', 'tsv', 'rtf', 'tex', 'rst'];
  if (textExts.includes(ext) || mimeType.startsWith('text/')) {
    return { type: 'text', category: 'Text File', canRead: true };
  }
  
  // Document types
  const docExts: Record<string, string> = {
    'pdf': 'PDF Document', 'doc': 'Word Document', 'docx': 'Word Document',
    'xls': 'Excel Spreadsheet', 'xlsx': 'Excel Spreadsheet',
    'ppt': 'PowerPoint', 'pptx': 'PowerPoint'
  };
  if (docExts[ext]) {
    return { type: 'document', category: docExts[ext], canRead: false };
  }
  
  return { type: 'unknown', category: 'File', canRead: false };
}

export const ChatInterface = ({ mode, conversationId, initialMessages = [], onSaveMessage, onModeChange }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const toastIdRef = useRef<string | null>(null);
  const { toast, dismiss } = useToast();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (toastIdRef.current) {
        dismiss(toastIdRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, [dismiss]);

  const getModePrompt = () => {
    switch (mode) {
      case "images":
        return "Describe the image you'd like to create, and I'll generate it for you!";
      case "code":
        return "I'm ready to help you build, debug, or explain code. What would you like to create?";
      default:
        return "Hello! I'm Lepen AI. Ask me anything - I can search the web, show locations on maps, get weather info, and more!";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        continue;
      }

      const fileInfo = getFileTypeInfo(file.name, file.type);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: fileInfo.type,
          category: fileInfo.category,
          content: result,
          preview: fileInfo.type === 'image' ? result : undefined,
          canRead: fileInfo.canRead,
        };
        
        setUploadedFiles((prev) => [...prev, newFile]);
        
        toast({
          title: `${fileInfo.category} uploaded`,
          description: `${file.name} added to context`,
        });
      };

      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: `Could not read ${file.name}`,
          variant: "destructive",
        });
      };

      // Read as base64 for images, text for readable files
      if (fileInfo.type === 'image') {
        reader.readAsDataURL(file);
      } else if (fileInfo.canRead) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    window.speechSynthesis.cancel();
    
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/`[^`]+`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#*_~]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const streamChat = useCallback(async (userContent: string, filesContext: string) => {
    const chatMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let contextualContent = userContent;
    if (filesContext) {
      contextualContent = `[Attached files context]\n${filesContext}\n\n[User message]\n${userContent}`;
    }

    chatMessages.push({ role: "user", content: contextualContent });

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, mode }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get response");
    }

    const contentType = response.headers.get("content-type");
    
    // Check if it's a JSON response (contains map data)
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      if (data.mapData) {
        setMapData(data.mapData);
      }
      return data.content || data.message || "";
    }

    // Stream response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let assistantContent = "";
    let buffer = "";

    const assistantMessage: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId || "",
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }
        } catch {
          // Incomplete JSON
        }
      }
    }

    return assistantContent;
  }, [messages, mode, conversationId]);

  const generateImage = useCallback(async (prompt: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate image");
    }

    return await response.json();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    
    // Build file context with improved type information
    let filesContext = "";
    if (uploadedFiles.length > 0) {
      filesContext = uploadedFiles.map((f) => {
        const typeInfo = `[File Type: ${f.category}]`;
        
        if (f.type === 'image' && f.canRead) {
          // Supported image - send base64 for analysis
          return `${typeInfo}\n[Image: ${f.name}]\nAnalyze this image:\n${f.content}`;
        } else if (f.type === 'image') {
          return `${typeInfo}\n[Image: ${f.name}] - Unsupported image format. Please convert to JPG, PNG, or SVG.`;
        } else if (f.canRead) {
          // Readable file - send content
          return `${typeInfo}\n[File: ${f.name}]\nContent:\n${f.content}`;
        } else {
          return `${typeInfo}\n[File: ${f.name}] - This file type cannot be read directly.`;
        }
      }).join("\n\n");
    }

    // Create display message
    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId || "",
      role: "user",
      content: uploadedFiles.length > 0 
        ? `${userContent}\n\n📎 Attached: ${uploadedFiles.map(f => `${f.name} (${f.category})`).join(", ")}`
        : userContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMapData(null);

    setUploadedFiles([]);

    try {
      if (onSaveMessage) {
        await onSaveMessage("user", userMessage.content);
      }

      if (mode === "images") {
        const result = await generateImage(userContent);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          conversation_id: conversationId || "",
          role: "assistant",
          content: result.text || "Here's your generated image!",
          image_url: result.imageUrl,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (onSaveMessage) {
          await onSaveMessage("assistant", assistantMessage.content, result.imageUrl);
        }
      } else {
        const assistantContent = await streamChat(userContent, filesContext);
        
        if (onSaveMessage && assistantContent) {
          await onSaveMessage("assistant", assistantContent);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      if (toastIdRef.current) {
        dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      const { id } = toast({
        title: "Listening...",
        description: "Speak now. Click the mic again to stop.",
        duration: 60000,
      });
      toastIdRef.current = id;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      
      setInput(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (toastIdRef.current) {
        dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      
      if (event.error === "no-speech") {
        toast({
          title: "No speech detected",
          description: "Please try speaking again",
          duration: 3000,
        });
      } else if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser settings",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Voice recognition error",
          description: "Please try again",
          variant: "destructive",
          duration: 3000,
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (toastIdRef.current) {
        dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
    }
  };

  return (
    <div className="glass-strong rounded-2xl h-[550px] flex flex-col overflow-hidden relative" style={{ zIndex: 10 }}>
      {/* Mode Selector */}
      <div className="px-4 py-3 border-b border-primary/20 flex gap-2 justify-center flex-wrap">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onModeChange?.(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-sm transition-all duration-200",
              mode === id
                ? "bg-primary text-primary-foreground shadow-gold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* File Memory Panel */}
      {uploadedFiles.length > 0 && (
        <div className="p-3 border-b border-primary/20 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground/80 font-body">
              Attached ({uploadedFiles.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-full text-sm text-foreground"
              >
                {file.preview && (
                  <img src={file.preview} alt="" className="w-5 h-5 rounded object-cover" />
                )}
                <span className="truncate max-w-[100px]">{file.name}</span>
                <span className="text-xs text-muted-foreground">({file.category})</span>
                <button 
                  onClick={() => removeFile(file.id)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-card/60 rounded-2xl p-8 max-w-md shadow-gold">
              <div className="relative mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <Sparkle size={48} />
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">
                Welcome to Lepen AI
              </h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                {getModePrompt()}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] px-5 py-3 rounded-2xl font-sans text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "glass border-primary/20 text-foreground"
                )}
              >
                {message.image_url && (
                  <div className="relative group mb-3">
                    <img
                      src={message.image_url}
                      alt="Generated"
                      className="rounded-lg max-w-full"
                    />
                    <a
                      href={message.image_url}
                      download={`lepen-ai-image-${Date.now()}.png`}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Download image"
                    >
                      <Download className="w-4 h-4 text-foreground" />
                    </a>
                  </div>
                )}
                <MessageContent 
                  content={message.content} 
                  isAssistant={message.role === "assistant"} 
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs opacity-60">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {message.role === "assistant" && message.content && (
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                      className={cn(
                        "p-1 rounded hover:bg-primary/20 transition-colors",
                        isSpeaking && "text-primary animate-pulse"
                      )}
                      title={isSpeaking ? "Stop speaking" : "Listen to response"}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Map View - shown when mapData exists */}
        {mapData && mapData.locations && mapData.locations.length > 0 && (
          <div className="mt-4">
            <MapView
              locations={mapData.locations}
              center={mapData.center}
              zoom={mapData.zoom}
              route={mapData.route}
              message={mapData.message}
            />
          </div>
        )}
        
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="glass border-primary/20 px-5 py-3 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-primary/20">
        <div className="flex gap-3 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="text/*,application/json,image/jpeg,image/jpg,image/png,image/svg+xml,.md,.csv,.txt,.js,.ts,.py,.html,.css,.jsx,.tsx,.json,.xml,.yaml,.yml"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-[60px] px-4 bg-primary/80 hover:bg-primary text-primary-foreground"
            title="Upload files (JPG, PNG, SVG, or text/code files)"
          >
            <Upload className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                uploadedFiles.length > 0
                  ? `Ask about your files...`
                  : "Ask Lepen AI anything..."
              }
              className="min-h-[60px] max-h-[120px] resize-none bg-muted/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary pr-12"
              rows={2}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={startVoiceInput}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 hover:bg-primary/10",
                isListening && "bg-primary/20 animate-pulse"
              )}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-[60px] px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
