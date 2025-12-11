import { cn } from "@/lib/utils";
import { MessageSquare, Image, Code } from "lucide-react";

const modes = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "images", label: "Images", icon: Image },
  { id: "code", label: "Code", icon: Code },
];

interface ModeSelectorProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

export const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 p-2 glass rounded-xl">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-sm transition-all duration-200",
            activeMode === id
              ? "bg-primary text-primary-foreground shadow-gold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};
