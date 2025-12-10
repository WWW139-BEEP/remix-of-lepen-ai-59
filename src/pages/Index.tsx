import { useState } from "react";
import { MessageSquare, Image, Code, AppWindow, Video, Sparkles } from "lucide-react";
import { LevaoLogo } from "@/components/LevaoLogo";
import { SparkleBackground } from "@/components/SparkleEffect";
import { FeatureCard } from "@/components/FeatureCard";
import { ChatInterface } from "@/components/ChatInterface";
import { ModeSelector } from "@/components/ModeSelector";

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

  return (
    <div className="min-h-screen gradient-main relative overflow-hidden">
      {/* Sparkle decorations */}
      <SparkleBackground />

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* Header */}
        <header className="text-center mb-12 animate-float">
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-full bg-card/40 p-2 mb-4 shadow-glow backdrop-blur-sm">
              <LevaoLogo size="lg" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground drop-shadow-lg mb-3 tracking-wide">
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveMode(null)}
                className="text-primary hover:text-primary/80 font-sans flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Back to Home
              </button>
            </div>
            
            <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />
            
            <ChatInterface mode={activeMode} />
          </div>
        ) : (
          /* Landing View */
          <>
            {/* Feature Cards */}
            <section className="mb-12">
              <h2 className="font-display text-2xl text-center text-foreground mb-8">
                What can I help you create?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    onClick={() => setActiveMode(feature.id)}
                  />
                ))}
              </div>
            </section>

            {/* Quick Start CTA */}
            <section className="text-center">
              <button
                onClick={() => setActiveMode("chat")}
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-sans text-lg rounded-xl shadow-gold hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                <MessageSquare className="w-6 h-6" />
                Start Chatting with Levao
              </button>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 text-foreground/50 font-sans text-sm">
          <p>&copy; 2025 Levao AI - Intelligence Illuminated</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
