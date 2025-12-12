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
      {/* Lightbulb with pen - glowing white then transparent glass effect */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow effect - bright white */}
        <defs>
          <radialGradient id="bulbGlowWhite" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1">
              <animate attributeName="stop-opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5">
              <animate attributeName="stop-opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bulbGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(166 76% 45%)" />
            <stop offset="100%" stopColor="hsl(166 76% 32%)" />
          </linearGradient>
        </defs>
        
        {/* Outer glow - bright white pulsing */}
        <circle cx="42" cy="35" r="35" fill="url(#bulbGlowWhite)" />
        
        {/* Bulb glass - transparent with white highlights */}
        <path
          d="M42 8 C25 8 16 23 16 35 C16 44 21 51 26 56 L26 61 L58 61 L58 56 C63 51 68 44 68 35 C68 23 59 8 42 8Z"
          fill="url(#bulbGlass)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        
        {/* Glass reflection highlight */}
        <ellipse cx="32" cy="28" rx="8" ry="12" fill="url(#glassReflection)" />
        
        {/* Bulb base - metallic */}
        <rect x="28" y="61" width="28" height="5" rx="1" fill="hsl(45 70% 45%)" />
        <rect x="30" y="66" width="24" height="4" rx="1" fill="hsl(45 60% 40%)" />
        <rect x="32" y="70" width="20" height="4" rx="2" fill="hsl(45 50% 35%)" />
        <path d="M36 74 L42 79 L48 74" stroke="hsl(45 50% 35%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        
        {/* Filament inside bulb - glowing white */}
        <g>
          <path
            d="M36 45 Q42 30 48 45"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            fill="none"
            opacity="0.95"
          >
            <animate attributeName="opacity" values="0.95;0.6;0.95" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path
            d="M38 42 Q42 32 46 42"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          >
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite" />
          </path>
          {/* Inner glow point */}
          <circle cx="42" cy="37" r="4" fill="#FFFFFF" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.3;0.6" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />
          </circle>
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
        
        {/* Sparkle effects near bulb */}
        <circle cx="22" cy="22" r="2" fill="#FFFFFF">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="62" cy="18" r="1.5" fill="#FFFFFF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="78" cy="72" r="2" fill="hsl(45 93% 70%)">
          <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};
