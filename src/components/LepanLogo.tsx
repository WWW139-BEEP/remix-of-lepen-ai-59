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
          {/* Gradient for pen */}
          <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          
          {/* White glow filter */}
          <filter id="whiteGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="white" floodOpacity="0.8"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Inner glow */}
          <radialGradient id="innerGlow" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9">
              <animate attributeName="stop-opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>
        
        {/* Centered Lightbulb at (50, 45) */}
        <g transform="translate(50, 45)">
          {/* Outer glow - flickering */}
          <circle
            cx="0"
            cy="-8"
            r="24"
            fill="white"
            opacity="0.2"
            filter="url(#whiteGlow)"
          >
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          
          {/* Round glass bulb - transparent with stroke */}
          <ellipse
            cx="0"
            cy="-10"
            rx="18"
            ry="22"
            fill="transparent"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          
          {/* Inner white glow - flickering */}
          <ellipse
            cx="0"
            cy="-10"
            rx="12"
            ry="15"
            fill="url(#innerGlow)"
          >
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
          </ellipse>
          
          {/* Filament */}
          <path
            d="M -6 -5 L -3 -15 L 0 -5 L 3 -15 L 6 -5"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </path>
          
          {/* Neck connector */}
          <path
            d="M -10 12 Q -10 8, -8 8 L 8 8 Q 10 8, 10 12"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          
          {/* Screw base */}
          <rect x="-9" y="12" width="18" height="4" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.7"/>
          <rect x="-8" y="16" width="16" height="3" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.6"/>
          <rect x="-7" y="19" width="14" height="3" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.5"/>
          
          {/* Screw threads */}
          <line x1="-9" y1="14" x2="9" y2="14" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.4"/>
          <line x1="-8" y1="17.5" x2="8" y2="17.5" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.4"/>
        </g>
        
        {/* Pen - positioned to the right */}
        <g transform="rotate(-25, 80, 55)">
          {/* Pen body */}
          <rect
            x="72"
            y="30"
            width="8"
            height="35"
            rx="2"
            fill="url(#penGradient)"
          />
          
          {/* Pen tip */}
          <path
            d="M 72 65 L 76 78 L 80 65 Z"
            fill="hsl(var(--accent))"
          />
          
          {/* Pen cap */}
          <rect
            x="72"
            y="25"
            width="8"
            height="6"
            rx="2"
            fill="hsl(var(--primary))"
          />
          
          {/* Pen clip */}
          <rect
            x="80"
            y="27"
            width="2"
            height="10"
            rx="1"
            fill="hsl(var(--primary))"
            opacity="0.8"
          />
          
          {/* Grip lines */}
          <line x1="72" y1="52" x2="80" y2="52" stroke="hsl(var(--card))" strokeWidth="0.6" opacity="0.3"/>
          <line x1="72" y1="55" x2="80" y2="55" stroke="hsl(var(--card))" strokeWidth="0.6" opacity="0.3"/>
          <line x1="72" y1="58" x2="80" y2="58" stroke="hsl(var(--card))" strokeWidth="0.6" opacity="0.3"/>
        </g>
        
        {/* Light rays */}
        <g opacity="0.6">
          <line x1="28" y1="28" x2="18" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite"/>
          </line>
          <line x1="22" y1="42" x2="10" y2="42" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <line x1="35" y1="18" x2="30" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.8s" repeatCount="indefinite"/>
          </line>
        </g>
        
        {/* Sparkle dots */}
        <circle cx="15" cy="32" r="2" fill="white" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="32" cy="10" r="1.5" fill="white" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.6s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
};
