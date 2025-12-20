import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Palette, Download, Shield, Sun, Moon, Save, Bell, Zap } from "lucide-react";
import { LepanLogo } from "@/components/LepanLogo";
import { SparkleBackground } from "@/components/SparkleEffect";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Preferences
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("lepen_theme");
    return saved !== "light";
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    const saved = localStorage.getItem("lepen_preferences");
    return saved ? JSON.parse(saved).soundEffects ?? true : true;
  });
  const [animations, setAnimations] = useState(() => {
    const saved = localStorage.getItem("lepen_preferences");
    return saved ? JSON.parse(saved).animations ?? true : true;
  });

  // Apply theme changes immediately
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      localStorage.setItem("lepen_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("lepen_theme", "light");
    }
  }, [darkMode]);

  const handleSavePreferences = () => {
    localStorage.setItem("lepen_preferences", JSON.stringify({
      darkMode,
      soundEffects,
      animations,
    }));
    
    toast({
      title: "Preferences saved",
      description: "Your settings have been updated.",
    });
  };

  const handleDownloadChat = () => {
    const chatData = sessionStorage.getItem("lepen_current_chat");
    
    if (!chatData) {
      toast({
        title: "No chat data",
        description: "Start a conversation first to download chat history.",
      });
      return;
    }

    const blob = new Blob([chatData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lepen-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Chat downloaded",
      description: "Your chat history has been saved.",
    });
  };

  const handleDownloadPrompts = () => {
    const chatData = sessionStorage.getItem("lepen_current_chat");
    
    if (!chatData) {
      toast({
        title: "No data",
        description: "Start a conversation first.",
      });
      return;
    }

    try {
      const messages = JSON.parse(chatData);
      const prompts = messages
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .join("\n\n---\n\n");

      const blob = new Blob([prompts], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lepen-prompts-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Prompts downloaded",
        description: "Your prompts have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Could not export prompts.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen gradient-main relative overflow-hidden">
      <SparkleBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-primary/20 border border-primary/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <LepanLogo size="sm" />
            <h1 className="font-display text-2xl text-foreground">Settings</h1>
          </div>
        </div>

        {/* Preferences Card */}
        <Card className="glass-strong border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground flex items-center gap-2">
                  {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Sound Effects
                </Label>
                <p className="text-xs text-muted-foreground">Play sounds on actions</p>
              </div>
              <Switch
                checked={soundEffects}
                onCheckedChange={setSoundEffects}
              />
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Animations
                </Label>
                <p className="text-xs text-muted-foreground">Enable UI animations</p>
              </div>
              <Switch
                checked={animations}
                onCheckedChange={setAnimations}
              />
            </div>

            <Button
              onClick={handleSavePreferences}
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy Card */}
        <Card className="glass-strong border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleDownloadChat}
              className="w-full border-primary/30 text-foreground hover:bg-primary/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Chat History
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadPrompts}
              className="w-full border-primary/30 text-foreground hover:bg-primary/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Prompts
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-8 text-foreground/50 font-sans text-sm">
          <p>
            &copy; {new Date().getFullYear()} Lepen AI - Built by{" "}
            <a 
              href="https://arkadas.netlify.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="name-glow"
              style={{
                background: 'linear-gradient(90deg, #22c55e, #3b82f6, #22c55e)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'nameGlow 3s ease-in-out infinite',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {" "}𝒜𝑅𝒦𝒜 𝒟𝒜𝒮{" "}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Settings;
