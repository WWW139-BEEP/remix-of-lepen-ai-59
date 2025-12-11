import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Image, Code, Sparkles, Menu, Info } from "lucide-react";
import { LepanLogo } from "@/components/LepanLogo";
import { SparkleBackground } from "@/components/SparkleEffect";
import { FeatureCard } from "@/components/FeatureCard";
import { ChatInterface } from "@/components/ChatInterface";
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
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<string>("chat");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
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

  // Auto-start chat when user is logged in
  useEffect(() => {
    const initChat = async () => {
      if (user && !convLoading && !activeConversationId) {
        // Check if there are existing conversations
        if (conversations.length > 0) {
          // Load the most recent conversation
          const recentConv = conversations[0];
          const msgs = await getMessages(recentConv.id);
          setConversationMessages(msgs);
          setActiveConversationId(recentConv.id);
          setActiveMode(recentConv.mode);
        } else {
          // Create a new conversation
          const conv = await createConversation("chat");
          if (conv) {
            setActiveConversationId(conv.id);
            setActiveMode("chat");
          }
        }
      }
    };
    initChat();
  }, [user, convLoading, conversations.length]);

  const loadConversation = useCallback(async (id: string) => {
    const msgs = await getMessages(id);
    setConversationMessages(msgs);
    setActiveConversationId(id);
    setShowLanding(false);
    
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveMode(conv.mode);
    }
  }, [getMessages, conversations]);

  const handleSelectMode = async (mode: string) => {
    setActiveMode(mode);
    setShowLanding(false);
    
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
      setShowLanding(false);
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
      // Create a new conversation after deleting
      const conv = await createConversation("chat");
      if (conv) {
        setActiveConversationId(conv.id);
        setActiveMode("chat");
      }
    }
  };

  const currentYear = new Date().getFullYear();

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
      <SparkleBackground />

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
          <div className="text-lg font-body text-foreground space-y-2">
            <p>
              <span className="font-semibold">Built by </span>
              <a 
                href="https://arkadas.netlify.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                ARKA DAS
              </a>
            </p>
            <p className="italic text-muted-foreground">Powered by Google Gemini</p>
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
        <header className="text-center mb-6 animate-float">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-card/40 p-2 mb-4 shadow-glow backdrop-blur-sm">
              <LepanLogo size="lg" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground drop-shadow-lg mb-2 tracking-wide">
              Lepen AI
            </h1>
            <p className="font-display text-xl text-foreground/90 mb-2">
              Intelligence Illuminated
            </p>
            <p className="font-body text-foreground/70 italic max-w-md">
              "Where brilliant ideas meet powerful AI capabilities"
            </p>
          </div>
        </header>

        {showLanding ? (
          <>
            {/* Feature Cards */}
            <section className="mb-8">
              <h2 className="font-display text-2xl text-center text-foreground mb-6">
                What can I help you create?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Start Chatting with Lepen
              </button>
            </section>
          </>
        ) : (
          /* Chat View */
          <div className="space-y-4">
            <ChatInterface
              mode={activeMode}
              conversationId={activeConversationId}
              initialMessages={conversationMessages}
              onSaveMessage={handleSaveMessage}
              onModeChange={handleSelectMode}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 text-foreground/50 font-sans text-sm">
          <p>&copy; {currentYear} Lepen AI - Intelligence Illuminated</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
