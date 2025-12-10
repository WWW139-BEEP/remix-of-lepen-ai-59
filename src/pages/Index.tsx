import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Image, Code, AppWindow, Video, Sparkles, Menu, Info } from "lucide-react";
import { LevaoLogo } from "@/components/LevaoLogo";
import { SparkleBackground } from "@/components/SparkleEffect";
import { FeatureCard } from "@/components/FeatureCard";
import { ChatInterface } from "@/components/ChatInterface";
import { ModeSelector } from "@/components/ModeSelector";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, Message } from "@/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const features = [
  {
    id: "chat",
    icon: MessageSquare,
    title: "AI Chat",
    description: "Have intelligent conversations with advanced AI that understands context and nuance.",
  },
  {
    id: "images",
    icon: Image,
    title: "Image Generation",
    description: "Create stunning visuals from text descriptions using cutting-edge AI models.",
  },
  {
    id: "code",
    icon: Code,
    title: "Code Assistant",
    description: "Write, debug, and optimize code across multiple programming languages.",
  },
  {
    id: "apps",
    icon: AppWindow,
    title: "App Builder",
    description: "Build functional applications with AI guidance and code generation.",
  },
  {
    id: "video",
    icon: Video,
    title: "Video Animation",
    description: "Animate and create video content with AI-powered tools.",
  },
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    conversations,
    loading: convLoading,
    createConversation,
    deleteConversation,
    getMessages,
    addMessage,
  } = useConversations();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const loadConversation = useCallback(async (id: string) => {
    const msgs = await getMessages(id);
    setConversationMessages(msgs);
    setActiveConversationId(id);
    
    // Find the conversation to get its mode
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveMode(conv.mode);
    }
  }, [getMessages, conversations]);

  const handleSelectMode = async (mode: string) => {
    setActiveMode(mode);
    
    // Create a new conversation for this mode
    const conv = await createConversation(mode);
    if (conv) {
      setActiveConversationId(conv.id);
      setConversationMessages([]);
    }
  };

  const handleNewConversation = async () => {
    const mode = activeMode || "chat";
    const conv = await createConversation(mode);
    if (conv) {
      setActiveConversationId(conv.id);
      setConversationMessages([]);
      setActiveMode(mode);
    }
    setSidebarOpen(false);
  };

  const handleSaveMessage = async (role: "user" | "assistant", content: string, imageUrl?: string) => {
    if (!activeConversationId) return;
    await addMessage(activeConversationId, role, content, imageUrl);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setConversationMessages([]);
      setActiveMode(null);
    }
  };

  if (authLoading || convLoading) {
    return (
      <div className="min-h-screen gradient-main flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-main relative overflow-hidden">
      {/* Sparkle decorations */}
      <SparkleBackground />

      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Info Button */}
      <button
        onClick={() => setInfoOpen(true)}
        className="fixed top-6 right-8 z-30 bg-card/90 hover:bg-primary/20 text-primary border border-primary rounded-full p-2.5 shadow-gold transition-all"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Info Modal */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="glass-strong border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 animate-sparkle" />
              Builder Info
            </DialogTitle>
          </DialogHeader>
          <div className="text-lg font-body text-foreground">
            <span className="font-semibold">Built with </span>
            Lovable AI
            <br />
            <span className="italic text-primary">Powered by Google Gemini</span>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 left-6 z-30 bg-card/90 hover:bg-primary/20 text-foreground border border-primary/30"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Header */}
        <header className="text-center mb-8 animate-float">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-card/40 p-2 mb-4 shadow-glow backdrop-blur-sm">
              <LevaoLogo size="lg" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground drop-shadow-lg mb-2 tracking-wide">
              Levao AI
            </h1>
            <p className="font-display text-xl text-foreground/90 mb-2">
              Intelligence Illuminated
            </p>
            <p className="font-body text-foreground/70 italic max-w-md">
              "Where brilliant ideas meet powerful AI capabilities"
            </p>
          </div>
        </header>

        {activeMode ? (
          /* Chat View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveMode(null);
                  setActiveConversationId(null);
                  setConversationMessages([]);
                }}
                className="text-primary hover:text-primary/80 font-sans flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Back to Home
              </button>
            </div>
            
            <ModeSelector activeMode={activeMode} onModeChange={handleSelectMode} />
            
            <ChatInterface
              mode={activeMode}
              conversationId={activeConversationId}
              initialMessages={conversationMessages}
              onSaveMessage={handleSaveMessage}
            />
          </div>
        ) : (
          /* Landing View */
          <>
            {/* Feature Cards */}
            <section className="mb-8">
              <h2 className="font-display text-2xl text-center text-foreground mb-6">
                What can I help you create?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    onClick={() => handleSelectMode(feature.id)}
                  />
                ))}
              </div>
            </section>

            {/* Quick Start CTA */}
            <section className="text-center">
              <button
                onClick={() => handleSelectMode("chat")}
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-sans text-lg rounded-xl shadow-gold hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                <MessageSquare className="w-6 h-6" />
                Start Chatting with Levao
              </button>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-foreground/50 font-sans text-sm">
          <p>&copy; 2025 Levao AI - Intelligence Illuminated</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
