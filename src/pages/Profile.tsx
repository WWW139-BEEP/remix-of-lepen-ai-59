import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, Calendar, Save, Loader2, Shield, Bell, Palette, Download, Trash2 } from "lucide-react";
import { LepanLogo } from "@/components/LepanLogo";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
        }
        
        if (data?.display_name) {
          setDisplayName(data.display_name);
        }
        
        // Load preferences from localStorage
        const prefs = localStorage.getItem("lepen_preferences");
        if (prefs) {
          const parsed = JSON.parse(prefs);
          setEmailNotifications(parsed.emailNotifications ?? true);
          setDarkMode(parsed.darkMode ?? true);
          setAutoSave(parsed.autoSave ?? true);
          setBio(parsed.bio ?? "");
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      // Save preferences to localStorage
      localStorage.setItem("lepen_preferences", JSON.stringify({
        emailNotifications,
        darkMode,
        autoSave,
        bio,
      }));

      toast({
        title: "Profile updated",
        description: "Your profile and preferences have been saved.",
      });
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      // Fetch all user conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id);

      const exportData = {
        profile: {
          email: user.email,
          display_name: displayName,
          created_at: user.created_at,
        },
        preferences: {
          emailNotifications,
          darkMode,
          autoSave,
          bio,
        },
        conversations: conversations || [],
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lepen-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded.",
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Could not export your data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will delete all your conversations and data."
    );
    
    if (!confirmed) return;

    try {
      // Delete user conversations first
      if (user) {
        await supabase
          .from("conversations")
          .delete()
          .eq("user_id", user.id);

        await supabase
          .from("profiles")
          .delete()
          .eq("user_id", user.id);
      }

      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account and data have been removed.",
      });
      
      navigate("/auth");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-primary/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <LepanLogo size="sm" />
            <h1 className="font-display text-2xl text-foreground">Profile & Settings</h1>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="glass-strong border-primary/20 mb-6">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="font-display text-xl text-foreground">
              {displayName || "Your Profile"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted/50 border-primary/20 text-muted-foreground"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Display Name
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-foreground">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary min-h-[80px]"
              />
            </div>

            {/* Account Created */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Account Created
              </Label>
              <Input
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                disabled
                className="bg-muted/50 border-primary/20 text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>

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
                  <Bell className="w-4 h-4" />
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Receive updates and tips</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground">Use dark theme</p>
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
                  <Save className="w-4 h-4" />
                  Auto-save Conversations
                </Label>
                <p className="text-xs text-muted-foreground">Automatically save chat history</p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
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
              onClick={handleExportData}
              className="w-full border-primary/30 text-foreground hover:bg-primary/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
