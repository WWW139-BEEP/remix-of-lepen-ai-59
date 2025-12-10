import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: FeatureCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group glass-strong rounded-xl p-6 text-left transition-all duration-300",
        "hover:scale-105 hover:shadow-gold hover:border-primary/50",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
    >
      <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-xl text-foreground mb-2">{title}</h3>
      <p className="font-body text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </button>
  );
};
