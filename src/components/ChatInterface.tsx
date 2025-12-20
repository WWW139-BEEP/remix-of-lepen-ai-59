import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Paperclip, X, MessageSquare, Image, Code2, Download, Square, Mic, MicOff, RectangleHorizontal, RectangleVertical, Square as SquareIcon, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sparkle } from "./SparkleEffect";
import { MessageContent } from "./MessageContent";
import { MapView } from "./MapView";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  category: string;
  content: string;
  preview?: string;
  canRead: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  created_at: string;
}

interface ChatInterfaceProps {
  mode: string;
  onModeChange?: (mode: string) => void;
  onBack?: () => void;
}

const modes = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "images", label: "Images", icon: Image },
  { id: "code", label: "Build", icon: Code2 },
];

const aspectRatios = [
  { id: "1:1", label: "1:1", icon: SquareIcon, size: "1024x1024" },
  { id: "16:9", label: "16:9", icon: RectangleHorizontal, size: "1536x1024" },
  { id: "9:16", label: "9:16", icon: RectangleVertical, size: "1024x1536" },
];

interface MapData {
  message?: string;
  locations: Array<{
    name: string;
    lat: number;
    lng: number;
    description?: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
}

function getFileTypeInfo(filename: string, mimeType: string): { type: string; category: string; canRead: boolean } {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const supportedImageExts = ['jpg', 'jpeg', 'png', 'svg'];
  
  if (supportedImageExts.includes(ext)) {
    return { type: 'image', category: ext.toUpperCase() + ' Image', canRead: true };
  }
  if (mimeType.startsWith('image/')) {
    return { type: 'image', category: ext.toUpperCase() + ' Image', canRead: false };
  }
  
  const codeExts: Record<string, string> = {
    'js': 'JavaScript', 'jsx': 'JSX', 'ts': 'TypeScript', 'tsx': 'TSX',
    'py': 'Python', 'java': 'Java', 'cpp': 'C++', 'html': 'HTML', 'css': 'CSS'
  };
  if (codeExts[ext]) return { type: 'code', category: codeExts[ext], canRead: true };
  
  if (['txt', 'md', 'json', 'csv'].includes(ext) || mimeType.startsWith('text/')) {
    return { type: 'text', category: 'Text File', canRead: true };
  }
  
  return { type: 'unknown', category: 'File', canRead: false };
}

// Get Supabase URL for edge functions
function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || '';
}
export const ChatInterface = ({ mode, onModeChange, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageQuality, setImageQuality] = useState<"low" | "medium" | "high">("medium");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false; // Changed to false to prevent doubling
      recognitionRef.current.interimResults = false; // Changed to false to prevent doubling
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        // Get only the final result to prevent doubling
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const transcript = result[0].transcript;
          setInput(prev => prev + transcript + ' ');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: event.error === 'not-allowed' ? 'Microphone access denied' : 'Could not recognize speech',
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now. Click again to stop.",
      });
    }
  }, [isListening, toast]);


  // Save to session storage for download
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("lepen_current_chat", JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getModePrompt = () => {
    switch (mode) {
      case "images":
        return "Describe the image you'd like to create, and I'll generate it for you!";
      case "code":
        return "I'm ready to help you build, debug, or explain code. What would you like to create?";
      default:
        return "Hello! I'm Lepen AI. Ask me anything!";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} is larger than 10MB`, variant: "destructive" });
        continue;
      }

      const fileInfo = getFileTypeInfo(file.name, file.type);
      
      if (mode === "images") {
        const ext = file.name.toLowerCase().split('.').pop() || '';
        if (!['jpg', 'jpeg', 'png', 'svg'].includes(ext)) {
          toast({ title: "Unsupported", description: "Only JPG, PNG, SVG allowed in Image mode", variant: "destructive" });
          continue;
        }
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: fileInfo.type,
          category: fileInfo.category,
          content: result,
          preview: fileInfo.type === 'image' && fileInfo.canRead ? result : undefined,
          canRead: fileInfo.canRead,
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };

      if (fileInfo.type === 'image') {
        reader.readAsDataURL(file);
      } else if (fileInfo.canRead) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const streamChat = useCallback(async (userContent: string, filesContext: string, imageData?: string) => {
    const baseUrl = getSupabaseUrl();
    
    if (!baseUrl) {
      throw new Error('Supabase is not configured');
    }
    
    const chatMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    let contextualContent = filesContext ? `[Files]\n${filesContext}\n\n${userContent}` : userContent;
    
    // If there's image data, include it in the content
    if (imageData) {
      contextualContent = `${imageData}\nAnalyze this image:\n${contextualContent}`;
    }
    
    chatMessages.push({ role: "user", content: contextualContent });

    const response = await fetch(`${baseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ messages: chatMessages, mode }),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get response");
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      if (data.mapData) setMapData(data.mapData);
      return data.content || data.message || "";
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");

    const decoder = new TextDecoder();
    let assistantContent = "";
    let buffer = "";

    const assistantMessage: Message = {
      id: Date.now().toString(),
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
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)
            );
          }
        } catch {}
      }
    }
    return assistantContent;
  }, [messages, mode]);

  const generateImage = useCallback(async (prompt: string, imageData?: string) => {
    const baseUrl = getSupabaseUrl();
    
    if (!baseUrl) {
      throw new Error('Supabase is not configured');
    }

    const selectedRatio = aspectRatios.find(r => r.id === aspectRatio);
    const size = selectedRatio?.size || "1024x1024";

    const response = await fetch(`${baseUrl}/functions/v1/generate-image`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ prompt, imageData, size, quality: imageQuality }),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate image");
    }
    return await response.json();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const baseUrl = getSupabaseUrl();
    if (!baseUrl) {
      toast({ 
        title: "Configuration error", 
        description: "Supabase is not configured", 
        variant: "destructive" 
      });
      return;
    }

    const userContent = input.trim();
    let filesContext = "";
    if (uploadedFiles.length > 0) {
      filesContext = uploadedFiles.map((f) => {
        if (f.type === 'image' && f.canRead) return `[Image: ${f.name}]`;
        if (f.canRead) return `[File: ${f.name}]\n${f.content}`;
        return `[File: ${f.name}]`;
      }).join("\n\n");
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: uploadedFiles.length > 0 
        ? `${userContent}\n\n📎 ${uploadedFiles.map(f => f.name).join(", ")}`
        : userContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMapData(null);
    abortControllerRef.current = new AbortController();

    const imageFile = uploadedFiles.find(f => f.type === 'image' && f.canRead);
    const imageData = imageFile?.content;
    setUploadedFiles([]);

    try {
      if (mode === "images") {
        const result = await generateImage(userContent, imageData);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.text || "Here's your image!",
          image_url: result.imageUrl,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        await streamChat(userContent, filesContext, imageData);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      }
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

  return (
    <div className="glass-strong rounded-2xl h-[calc(100vh-120px)] min-h-[600px] flex flex-col overflow-hidden relative" style={{ zIndex: 10 }}>
      {/* Header with Mode Selector */}
      <div className="px-4 py-3 border-b border-primary/20 flex items-center justify-center">
        <div className="flex gap-3">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onModeChange?.(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm transition-all duration-200",
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
      </div>

      {/* File Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-3 border-b border-primary/20 bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 bg-card/80 border border-primary/20 px-3 py-2 rounded-lg text-sm">
                {file.preview ? (
                  <img src={file.preview} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[80px] text-foreground">{file.name}</span>
                <button onClick={() => removeFile(file.id)} className="p-1 hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-card/60 rounded-2xl p-8 max-w-md shadow-gold">
              <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <Sparkle size={48} />
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">Welcome to Lepen AI</h3>
              <p className="text-muted-foreground font-body">{getModePrompt()}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[90%] md:max-w-[85%] px-4 py-3 rounded-2xl font-sans text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground shadow-gold"
                  : "glass border-primary/20 text-foreground"
              )}>
                {message.image_url && (
                  <div className="relative group mb-3">
                    <img src={message.image_url} alt="Generated" className="rounded-lg max-w-full" />
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = message.image_url!;
                        link.download = `lepen-image-${Date.now()}.png`;
                        link.click();
                      }}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <MessageContent content={message.content} isAssistant={message.role === "assistant"} />
              </div>
            </div>
          ))
        )}
        
        {mapData && mapData.locations?.length > 0 && (
          <MapView locations={mapData.locations} center={mapData.center} zoom={mapData.zoom} message={mapData.message} />
        )}
        
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="glass border-primary/20 px-5 py-3 rounded-2xl flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {mode === "images" ? "Creating your vision..." : "Refining response..."}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-primary/20">
        {/* Aspect Ratio Selector - only in image mode, above the input row */}
        {mode === "images" && (
          <div className="flex gap-1 justify-center mb-2">
            {aspectRatios.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setAspectRatio(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  aspectRatio === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
          <div className="flex flex-col gap-1 justify-end">
            {/* Quality selector - only in image mode */}
            {mode === "images" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2 bg-muted/50 hover:bg-muted">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  <DropdownMenuItem 
                    onClick={() => setImageQuality("low")}
                    className={cn(imageQuality === "low" && "bg-primary/20")}
                  >
                    Low Quality
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setImageQuality("medium")}
                    className={cn(imageQuality === "medium" && "bg-primary/20")}
                  >
                    Medium Quality
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setImageQuality("high")}
                    className={cn(imageQuality === "high" && "bg-primary/20")}
                  >
                    High Quality
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={() => fileInputRef.current?.click()} className="h-[50px] px-3 bg-primary/80 hover:bg-primary">
              <Paperclip className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            onClick={toggleVoiceInput} 
            className={cn(
              "h-[50px] px-3 transition-all self-end",
              isListening 
                ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                : "bg-primary/80 hover:bg-primary"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... speak now" : "Ask Lepen AI anything..."}
              className="min-h-[50px] max-h-[150px] resize-none bg-muted/50 border-primary/30 text-foreground"
              rows={2}
            />
          </div>
          {isLoading ? (
            <Button onClick={stopGeneration} className="h-[50px] px-4 bg-destructive hover:bg-destructive/90 self-end">
              <Square className="w-5 h-5" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim()} className="h-[50px] px-4 bg-primary hover:bg-primary/90 self-end">
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
