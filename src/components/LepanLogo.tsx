import { cn } from "@/lib/utils";

interface LepanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const LepanLogo = ({ className, size = "md" }: LepanLogoProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Lightbulb with pen */}
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
          <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(166 76% 45%)" />
            <stop offset="100%" stopColor="hsl(166 76% 32%)" />
          </linearGradient>
        </defs>
        
        {/* Outer glow */}
        <circle cx="42" cy="35" r="30" fill="url(#bulbGlow)" className="animate-pulse-glow" />
        
        {/* Bulb glass */}
        <path
          d="M42 8 C25 8 16 23 16 35 C16 44 21 51 26 56 L26 61 L58 61 L58 56 C63 51 68 44 68 35 C68 23 59 8 42 8Z"
          fill="url(#bulbGlass)"
          stroke="hsl(45 93% 58%)"
          strokeWidth="2"
        />
        
        {/* Bulb base */}
        <rect x="28" y="61" width="28" height="5" rx="1" fill="hsl(45 70% 45%)" />
        <rect x="30" y="66" width="24" height="4" rx="1" fill="hsl(45 60% 40%)" />
        <rect x="32" y="70" width="20" height="4" rx="2" fill="hsl(45 50% 35%)" />
        <path d="M36 74 L42 79 L48 74" stroke="hsl(45 50% 35%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        
        {/* Filament inside bulb */}
        <g className="animate-neuron">
          <path
            d="M36 45 Q42 30 48 45"
            stroke="hsl(45 93% 70%)"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M38 42 Q42 32 46 42"
            stroke="hsl(45 93% 80%)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
        </g>
        
        {/* Pen - positioned diagonally across the bulb */}
        <g transform="rotate(45, 70, 50)">
          {/* Pen body */}
          <rect x="60" y="20" width="8" height="50" rx="1" fill="url(#penGradient)" />
          
          {/* Pen tip */}
          <path
            d="M60 70 L64 82 L68 70"
            fill="hsl(45 70% 50%)"
          />
          
          {/* Pen grip rings */}
          <rect x="60" y="55" width="8" height="2" fill="hsl(166 76% 25%)" />
          <rect x="60" y="50" width="8" height="2" fill="hsl(166 76% 25%)" />
          
          {/* Pen cap */}
          <rect x="59" y="18" width="10" height="6" rx="1" fill="hsl(166 76% 40%)" />
          <rect x="61" y="14" width="6" height="5" rx="3" fill="hsl(166 76% 35%)" />
        </g>
        
        {/* Sparkle effect near pen tip */}
        <circle cx="78" cy="72" r="2" fill="hsl(45 93% 70%)" className="animate-sparkle" />
        <circle cx="82" cy="68" r="1.5" fill="hsl(45 93% 60%)" className="animate-sparkle delay-200" />
      </svg>
    </div>
  );
};
