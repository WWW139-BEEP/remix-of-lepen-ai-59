import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Image, Hammer, Sparkles, Info, Menu, Settings, Home } from "lucide-react";
import { LepanLogo } from "@/components/LepanLogo";
import { SparkleBackground } from "@/components/SparkleEffect";
import { FeatureCard } from "@/components/FeatureCard";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    icon: Hammer,
    title: "Build Apps",
    description: "Write, debug, and optimize code across multiple programming languages.",
  },
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<string>("chat");
  const [showChat, setShowChat] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectMode = (mode: string) => {
    setActiveMode(mode);
    setShowChat(true);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen gradient-main relative overflow-hidden">
      <SparkleBackground />

      {/* Menu Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-6 left-6 z-30 bg-card/90 hover:bg-primary/20 text-foreground border border-primary/30"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => setShowChat(false)} className="cursor-pointer">
            <Home className="w-4 h-4 mr-2" />
            Home
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Info Button */}
      <button
        onClick={() => setInfoOpen(true)}
        className="fixed top-6 right-8 z-30 bg-card/90 hover:bg-primary/20 text-primary border border-primary rounded-full p-2.5 shadow-gold transition-all"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Info Modal */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="glass-strong border-primary/30 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 animate-sparkle" />
              💡 Abouts
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm font-body text-foreground space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-foreground">What is LEPEN?</p>
              <p className="text-muted-foreground">
                LEPEN is an advanced AI assistant designed with a focus on intelligence, clarity, and practical usefulness. It thinks logically, responds thoughtfully, and evolves through continuous improvement.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-foreground">Core Capabilities:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>AI Chat</strong> - Intelligent conversations with context awareness</li>
                <li><strong>Image Generation</strong> - Create & edit visuals from text descriptions</li>
                <li><strong>Code Building</strong> - Write, debug, and explain code</li>
                <li><strong>Web Search</strong> - Real-time information from the internet</li>
                <li><strong>Maps & Locations</strong> - Geographic data and directions</li>
                <li><strong>Weather</strong> - Current conditions and forecasts</li>
                <li><strong>Math & Equations</strong> - Beautifully formatted mathematical expressions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-foreground">Design Principles:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Smart reasoning and problem-solving</li>
                <li>Clean, scalable system design</li>
                <li>Ethical and responsible AI behavior</li>
                <li>Simplicity combined with modern technology</li>
                <li>No data collection - your privacy matters</li>
              </ul>
            </div>
            
            <div className="border-t border-primary/20 pt-4">
              <p className="font-medium text-primary">Vision:</p>
              <p className="italic text-muted-foreground">
                "To build an AI that turns ideas into understanding—where knowledge meets clarity."
              </p>
            </div>
            
            <div className="border-t border-primary/20 pt-4 text-xs text-muted-foreground">
              <p>
                Created by{" "}
                <a 
                  href="https://arkadas.netlify.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="name-glow font-bold text-base"
                  style={{
                    background: 'linear-gradient(90deg, #ff3333, #ffcc00, #3399ff, #ff3333)',
                    backgroundSize: '300% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'nameGlow 2s ease-in-out infinite',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  𝒜𝑅𝒦𝒜 𝒟𝒜𝒮
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative" style={{ zIndex: 10 }}>
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

        {!showChat ? (
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
          /* Chat View - Full Screen */
          <div className="space-y-4">
            <ChatInterface
              mode={activeMode}
              onModeChange={setActiveMode}
              onBack={() => setShowChat(false)}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 text-foreground/50 font-sans text-sm">
          <p>
            &copy; {currentYear} Lepen AI - Built by{" "}
            <a 
              href="https://arkadas.netlify.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="name-glow font-bold"
              style={{
                background: 'linear-gradient(90deg, #ff3333, #ffcc00, #3399ff, #ff3333)',
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'nameGlow 2s ease-in-out infinite',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '0.05em',
              }}
            >
              𝒜𝑅𝒦𝒜 𝒟𝒜𝒮
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
