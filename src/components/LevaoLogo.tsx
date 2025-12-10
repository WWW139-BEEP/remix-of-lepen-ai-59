import { cn } from "@/lib/utils";

interface LevaoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const LevaoLogo = ({ className, size = "md" }: LevaoLogoProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Lightbulb with neurons */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow effect */}
        <defs>
          <radialGradient id="bulbGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="hsl(45 93% 58%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(45 93% 58%)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bulbGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 93% 70%)" />
            <stop offset="100%" stopColor="hsl(45 93% 50%)" />
          </linearGradient>
        </defs>
        
        {/* Outer glow */}
        <circle cx="50" cy="38" r="35" fill="url(#bulbGlow)" className="animate-pulse-glow" />
        
        {/* Bulb glass */}
        <path
          d="M50 10 C30 10 20 28 20 42 C20 52 26 60 32 66 L32 72 L68 72 L68 66 C74 60 80 52 80 42 C80 28 70 10 50 10Z"
          fill="url(#bulbGlass)"
          stroke="hsl(45 93% 58%)"
          strokeWidth="2"
        />
        
        {/* Bulb base */}
        <rect x="34" y="72" width="32" height="6" rx="1" fill="hsl(45 70% 45%)" />
        <rect x="36" y="78" width="28" height="4" rx="1" fill="hsl(45 60% 40%)" />
        <rect x="38" y="82" width="24" height="4" rx="2" fill="hsl(45 50% 35%)" />
        <path d="M42 86 L50 92 L58 86" stroke="hsl(45 50% 35%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        
        {/* Neural network inside */}
        <g className="animate-neuron">
          {/* Central neuron */}
          <circle cx="50" cy="40" r="6" fill="hsl(166 76% 32%)" />
          
          {/* Surrounding neurons */}
          <circle cx="35" cy="32" r="4" fill="hsl(142 71% 45%)" className="animate-neuron delay-100" />
          <circle cx="65" cy="32" r="4" fill="hsl(142 71% 45%)" className="animate-neuron delay-200" />
          <circle cx="38" cy="52" r="4" fill="hsl(142 71% 45%)" className="animate-neuron delay-300" />
          <circle cx="62" cy="52" r="4" fill="hsl(142 71% 45%)" className="animate-neuron delay-500" />
          <circle cx="50" cy="25" r="3" fill="hsl(166 76% 40%)" className="animate-neuron delay-700" />
          
          {/* Neural connections */}
          <line x1="50" y1="40" x2="35" y2="32" stroke="hsl(142 71% 45%)" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="40" x2="65" y2="32" stroke="hsl(142 71% 45%)" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="40" x2="38" y2="52" stroke="hsl(142 71% 45%)" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="40" x2="62" y2="52" stroke="hsl(142 71% 45%)" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="40" x2="50" y2="25" stroke="hsl(166 76% 40%)" strokeWidth="1.5" opacity="0.7" />
          <line x1="35" y1="32" x2="50" y2="25" stroke="hsl(166 76% 40%)" strokeWidth="1" opacity="0.5" />
          <line x1="65" y1="32" x2="50" y2="25" stroke="hsl(166 76% 40%)" strokeWidth="1" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
};
