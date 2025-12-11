import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Loader2, Upload, X, MessageSquare, Image, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sparkle } from "./SparkleEffect";
import { MessageContent } from "./MessageContent";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/hooks/useConversations";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content: string;
  preview?: string;
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
  { id: "code", label: "Code", icon: Code },
];

export const ChatInterface = ({ mode, conversationId, initialMessages = [], onSaveMessage, onModeChange }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const getModePrompt = () => {
    switch (mode) {
      case "images":
        return "Describe the image you'd like to create, and I'll generate it for you!";
      case "code":
        return "I'm ready to help you write, debug, or explain code. What would you like to build?";
      default:
        return "Hello! I'm Lepen AI. How can I assist you today?";
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

      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          content: result,
          preview: file.type.startsWith("image/") ? result : undefined,
        };
        
        setUploadedFiles((prev) => [...prev, newFile]);
        
        toast({
          title: "File uploaded",
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

      if (file.type.startsWith("text/") || 
          file.type === "application/json" ||
          file.type === "application/javascript" ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".csv")) {
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
    
    // Build file context
    let filesContext = "";
    if (uploadedFiles.length > 0) {
      filesContext = uploadedFiles.map((f) => {
        if (f.type.startsWith("image/")) {
          return `[Image: ${f.name}] - Image data included`;
        }
        return `[File: ${f.name}]\n${f.content}`;
      }).join("\n\n");
    }

    // Create display message (without file context for cleaner UI)
    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId || "",
      role: "user",
      content: uploadedFiles.length > 0 
        ? `${userContent}\n\n📎 Attached: ${uploadedFiles.map(f => f.name).join(", ")}`
        : userContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Clear files after sending
    const filesToSend = [...uploadedFiles];
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
      toast({
        title: "Listening...",
        description: "Speak now. Click the mic again to stop.",
      });
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
      
      if (event.error === "no-speech") {
        toast({
          title: "No speech detected",
          description: "Please try speaking again",
        });
      } else if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser settings",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voice recognition error",
          description: "Please try again",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
    }
  };

  return (
    <div className="glass-strong rounded-2xl h-[550px] flex flex-col overflow-hidden">
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
                <span className="truncate max-w-[120px]">{file.name}</span>
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
                  <img
                    src={message.image_url}
                    alt="Generated"
                    className="rounded-lg mb-3 max-w-full"
                  />
                )}
                <MessageContent 
                  content={message.content} 
                  isAssistant={message.role === "assistant"} 
                />
                <p className="text-xs opacity-60 mt-2">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
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
            accept="text/*,application/json,image/*,.md,.csv,.txt,.js,.ts,.py,.html,.css"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-[60px] px-4 bg-primary/80 hover:bg-primary text-primary-foreground"
            title="Upload files"
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
