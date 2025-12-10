import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Loader2, Upload, Volume2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sparkle } from "./SparkleEffect";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/hooks/useConversations";

interface UploadedFile {
  id: string;
  name: string;
  content: string;
}

interface ChatInterfaceProps {
  mode: string;
  conversationId: string | null;
  initialMessages?: Message[];
  onSaveMessage?: (role: "user" | "assistant", content: string, imageUrl?: string) => Promise<void>;
}

export const ChatInterface = ({ mode, conversationId, initialMessages = [], onSaveMessage }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const getModePrompt = () => {
    switch (mode) {
      case "images":
        return "Describe the image you'd like to create, and I'll generate it for you!";
      case "code":
        return "I'm ready to help you write, debug, or explain code. What would you like to build?";
      case "apps":
        return "Let's build something amazing! Describe the app you want to create.";
      case "video":
        return "I can help with video concepts, scripts, and storyboards. What's your vision?";
      default:
        return "Hello! I'm Levao AI. How can I assist you today?";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setUploadedFiles((prev) => [
          ...prev,
          { id: Date.now().toString(), name: file.name, content },
        ]);
      };

      if (file.type.startsWith("text/") || file.type === "application/json") {
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

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const streamChat = useCallback(async (userContent: string) => {
    const chatMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add file context if any
    let contextualContent = userContent;
    if (uploadedFiles.length > 0) {
      const fileContext = uploadedFiles
        .map((f) => `[File: ${f.name}]\n${f.content}`)
        .join("\n\n");
      contextualContent = `Context from uploaded files:\n${fileContext}\n\nUser message: ${userContent}`;
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

    // Create assistant message placeholder
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
          // Incomplete JSON, wait for more data
        }
      }
    }

    return assistantContent;
  }, [messages, uploadedFiles, mode, conversationId]);

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
    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId || "",
      role: "user",
      content: userContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message
      if (onSaveMessage) {
        await onSaveMessage("user", userContent);
      }

      if (mode === "images") {
        // Generate image
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
        // Stream chat response
        const assistantContent = await streamChat(userContent);
        
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
      
      // Remove the last assistant message if it failed
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
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Error",
        description: "Voice recognition failed",
        variant: "destructive",
      });
    };

    recognition.start();
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const clearMessages = () => {
    setMessages([]);
    setUploadedFiles([]);
  };

  return (
    <div className="glass-strong rounded-2xl h-[500px] flex flex-col overflow-hidden">
      {/* File Memory Panel */}
      {uploadedFiles.length > 0 && (
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground/80 font-body">
              AI Memory ({uploadedFiles.length} files)
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAllFiles}
              className="text-foreground/60 hover:text-foreground"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-full text-sm text-foreground"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removeFile(file.id)}>
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
                Welcome to Levao AI
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
                  "max-w-[80%] px-5 py-3 rounded-2xl font-sans text-sm leading-relaxed",
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
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs opacity-60">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {message.role === "assistant" && message.content && (
                    <button
                      onClick={() => speakText(message.content)}
                      className="text-xs opacity-60 hover:opacity-100"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
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

      {/* Controls */}
      <div className="px-4 py-2 border-t border-primary/20 flex gap-2 justify-center flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => speakText(messages.filter(m => m.role === "assistant").pop()?.content || "")}
          className="text-foreground/80 hover:bg-primary/10"
          disabled={!messages.some(m => m.role === "assistant")}
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Speak Wisdom
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={startVoiceInput}
          className={cn(
            "text-foreground/80 hover:bg-primary/10",
            isListening && "bg-primary/20 text-primary"
          )}
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice Spell
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearMessages}
          className="text-foreground/80 hover:bg-primary/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Scrolls
        </Button>
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
            accept="text/*,application/json,image/*"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-[60px] px-4 bg-primary/80 hover:bg-primary text-primary-foreground"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload
          </Button>
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                uploadedFiles.length > 0
                  ? `Files in memory: ${uploadedFiles.map((f) => f.name).join(", ")} - Ask your question...`
                  : "Speak your query to Levao AI..."
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
                isListening && "bg-primary/20"
              )}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-[60px] px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
          >
            <Send className="w-5 h-5 mr-2" />
            Cast
          </Button>
        </div>
      </div>
    </div>
  );
};
