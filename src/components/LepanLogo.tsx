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
          <filter id="whiteGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor="white" floodOpacity="0.9"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Radial gradient for inner light */}
          <radialGradient id="innerLight" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1">
              <animate attributeName="stop-opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>
        
        {/* Lightbulb - centered at position 50,38 */}
        <g transform="translate(50, 42)">
          {/* Outer glow effect - flickering */}
          <ellipse
            cx="0"
            cy="-8"
            rx="22"
            ry="26"
            fill="white"
            opacity="0.15"
            filter="url(#whiteGlow)"
          >
            <animate attributeName="opacity" values="0.15;0.4;0.15" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
          
          {/* Glass bulb - rounded shape */}
          <path
            d="M 0 -32 
               C -18 -32, -22 -10, -22 0
               C -22 8, -18 14, -12 18
               L -10 22
               L 10 22
               L 12 18
               C 18 14, 22 8, 22 0
               C 22 -10, 18 -32, 0 -32 Z"
            fill="hsl(var(--card))"
            fillOpacity="0.2"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          
          {/* Inner white glow - flickering */}
          <ellipse
            cx="0"
            cy="-8"
            rx="14"
            ry="18"
            fill="url(#innerLight)"
          >
            <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
          
          {/* Filament - W shape */}
          <path
            d="M -8 0 L -4 -12 L 0 0 L 4 -12 L 8 0"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate attributeName="opacity" values="0.9;1;0.6;1;0.9" dur="0.8s" repeatCount="indefinite"/>
          </path>
          
          {/* Screw base */}
          <rect x="-10" y="22" width="20" height="5" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.7"/>
          <rect x="-9" y="27" width="18" height="4" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.6"/>
          <rect x="-8" y="31" width="16" height="3" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.5"/>
          
          {/* Screw threads */}
          <line x1="-10" y1="24" x2="10" y2="24" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.3"/>
          <line x1="-9" y1="29" x2="9" y2="29" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.3"/>
        </g>
        
        {/* Pen - positioned to the right */}
        <g transform="rotate(-30, 78, 50)">
          {/* Pen body */}
          <rect
            x="68"
            y="25"
            width="9"
            height="40"
            rx="2"
            fill="url(#penGradient)"
          />
          
          {/* Pen tip (nib) */}
          <path
            d="M 68 65 L 72.5 78 L 77 65 Z"
            fill="hsl(var(--accent))"
          />
          
          {/* Pen cap */}
          <rect
            x="68"
            y="20"
            width="9"
            height="7"
            rx="2"
            fill="hsl(var(--primary))"
          />
          
          {/* Pen clip */}
          <rect
            x="77"
            y="22"
            width="2"
            height="12"
            rx="1"
            fill="hsl(var(--primary))"
            opacity="0.8"
          />
          
          {/* Pen grip lines */}
          <line x1="68" y1="50" x2="77" y2="50" stroke="hsl(var(--card))" strokeWidth="0.8" opacity="0.3"/>
          <line x1="68" y1="54" x2="77" y2="54" stroke="hsl(var(--card))" strokeWidth="0.8" opacity="0.3"/>
          <line x1="68" y1="58" x2="77" y2="58" stroke="hsl(var(--card))" strokeWidth="0.8" opacity="0.3"/>
        </g>
        
        {/* Light rays emanating from bulb */}
        <g opacity="0.5">
          <line x1="25" y1="25" x2="15" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <line x1="20" y1="42" x2="8" y2="42" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite"/>
          </line>
          <line x1="32" y1="12" x2="28" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/>
          </line>
          <line x1="68" y1="12" x2="72" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.3s" repeatCount="indefinite"/>
          </line>
        </g>
        
        {/* Sparkle dots */}
        <circle cx="12" cy="30" r="2" fill="white" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="30" cy="5" r="1.5" fill="white" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1.4s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
};
