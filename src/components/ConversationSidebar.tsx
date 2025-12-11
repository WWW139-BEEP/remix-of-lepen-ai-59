import { useState } from "react";
import { MessageSquare, Plus, Trash2, LogOut, X, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Conversation } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: ConversationSidebarProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getModeIcon = (mode: string) => {
    return <MessageSquare className="w-4 h-4" />;
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-72 glass-strong z-50 transform transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-primary/20 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Chat History</h2>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-primary/30"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-2">
          <Button
            onClick={onNewConversation}
            className="w-full bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredConversations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                    activeConversationId === conv.id
                      ? "bg-primary/20 text-foreground"
                      : "hover:bg-primary/10 text-foreground/80"
                  )}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  {getModeIcon(conv.mode)}
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  {hoveredId === conv.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-primary/20 space-y-2">
          <div className="text-sm text-foreground/60 truncate">
            {user?.email}
          </div>
          <Button
            onClick={() => {
              navigate("/settings");
              onClose();
            }}
            variant="ghost"
            className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-primary/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-primary/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
};
