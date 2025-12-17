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
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for pen and accents */}
          <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          
          {/* White glow filter for flickering */}
          <filter id="whiteGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="white" floodOpacity="0.8"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Soft glow for bulb */}
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Radial gradient for inner light */}
          <radialGradient id="innerLight" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9">
              <animate attributeName="stop-opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.9"
        />
        
        {/* Lightbulb - Glass bulb (transparent) */}
        <path
          d="M 35 20 
             C 20 20, 15 40, 25 55 
             L 28 60 
             L 42 60 
             L 45 55 
             C 55 40, 50 20, 35 20 Z"
          fill="hsl(var(--card))"
          fillOpacity="0.3"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
        
        {/* Inner white glow - flickering */}
        <ellipse
          cx="35"
          cy="38"
          rx="10"
          ry="14"
          fill="url(#innerLight)"
          filter="url(#whiteGlow)"
        >
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>
        
        {/* Filament */}
        <path
          d="M 30 42 Q 35 35, 40 42"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        >
          <animate attributeName="opacity" values="0.8;1;0.6;1;0.8" dur="1s" repeatCount="indefinite"/>
        </path>
        
        {/* Lightbulb screw base */}
        <rect x="27" y="60" width="16" height="4" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.7"/>
        <rect x="28" y="64" width="14" height="3" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.6"/>
        <rect x="29" y="67" width="12" height="3" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.5"/>
        
        {/* Pen - positioned diagonally */}
        <g transform="rotate(-25, 65, 50)">
          {/* Pen body */}
          <rect
            x="55"
            y="25"
            width="10"
            height="45"
            rx="2"
            fill="url(#penGradient)"
          />
          
          {/* Pen tip (nib) */}
          <path
            d="M 55 70 L 60 82 L 65 70 Z"
            fill="hsl(var(--accent))"
          />
          
          {/* Pen cap */}
          <rect
            x="55"
            y="20"
            width="10"
            height="8"
            rx="2"
            fill="hsl(var(--primary))"
          />
          
          {/* Pen clip */}
          <rect
            x="65"
            y="22"
            width="2"
            height="15"
            rx="1"
            fill="hsl(var(--primary))"
            opacity="0.8"
          />
          
          {/* Pen grip texture */}
          <line x1="55" y1="52" x2="65" y2="52" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.3"/>
          <line x1="55" y1="56" x2="65" y2="56" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.3"/>
          <line x1="55" y1="60" x2="65" y2="60" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.3"/>
        </g>
        
        {/* Light rays emanating from bulb */}
        <g opacity="0.6">
          <line x1="18" y1="30" x2="10" y2="25" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite"/>
          </line>
          <line x1="15" y1="45" x2="6" y2="45" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <line x1="20" y1="15" x2="15" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.8s" repeatCount="indefinite"/>
          </line>
          <line x1="45" y1="12" x2="48" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.4s" repeatCount="indefinite"/>
          </line>
        </g>
        
        {/* Sparkle dots */}
        <circle cx="12" cy="35" r="2" fill="white" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="48" cy="8" r="1.5" fill="white" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.6s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
};
