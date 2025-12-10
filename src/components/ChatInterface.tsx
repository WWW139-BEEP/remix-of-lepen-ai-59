import { useState, useRef, useEffect } from "react";
import { Send, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sparkle } from "./SparkleEffect";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  mode: string;
  onSendMessage?: (message: string) => Promise<string>;
}

export const ChatInterface = ({ mode, onSendMessage }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getModePrompt = () => {
    switch (mode) {
      case "images":
        return "I can help you generate and edit images. Describe what you'd like to create!";
      case "code":
        return "I'm ready to help you write, debug, or explain code. What would you like to build?";
      case "apps":
        return "Let's build something amazing! Describe the app you want to create.";
      case "video":
        return "I can help animate and create video content. What's your vision?";
      default:
        return "Hello! I'm Levao AI. How can I assist you today?";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (will be connected to actual API later)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I received your message about "${userMessage.content.slice(0, 50)}...". To enable full AI capabilities, please connect Lovable Cloud which will provide access to Google's Gemini AI for ${mode === "chat" ? "conversations" : mode}.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-strong rounded-2xl h-[500px] flex flex-col overflow-hidden">
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
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
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
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[60px] max-h-[120px] resize-none bg-muted/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary pr-12"
              rows={2}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 hover:bg-primary/10"
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
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
