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
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
          <linearGradient id="bulbGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="hsl(var(--card))"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          className="opacity-90"
        />
        
        {/* Lightbulb body - glass effect with animation */}
        <ellipse
          cx="42"
          cy="38"
          rx="18"
          ry="22"
          fill="url(#bulbGlow)"
          className="animate-pulse opacity-70"
          style={{ animationDuration: "2s" }}
        />
        <ellipse
          cx="42"
          cy="38"
          rx="18"
          ry="22"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          filter="url(#glow)"
          className="opacity-90"
        />
        
        {/* Lightbulb inner glow - flickering effect */}
        <ellipse
          cx="42"
          cy="35"
          rx="10"
          ry="12"
          fill="hsl(var(--accent))"
          className="animate-pulse"
          style={{ animationDuration: "1.5s", animationTimingFunction: "ease-in-out" }}
          opacity="0.5"
        />
        
        {/* Lightbulb filament */}
        <path
          d="M 36 40 Q 42 32 48 40"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-pulse"
          style={{ animationDuration: "1s" }}
        />
        
        {/* Lightbulb base/screw */}
        <rect
          x="35"
          y="58"
          width="14"
          height="8"
          rx="2"
          fill="url(#logoGradient)"
          opacity="0.8"
        />
        <line x1="35" y1="61" x2="49" y2="61" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.5" />
        <line x1="35" y1="64" x2="49" y2="64" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.5" />
        
        {/* Pen - angled, crossing lightbulb */}
        <g transform="rotate(30, 65, 55)">
          {/* Pen body */}
          <rect
            x="58"
            y="30"
            width="8"
            height="40"
            rx="2"
            fill="url(#logoGradient)"
            opacity="0.9"
          />
          {/* Pen tip */}
          <polygon
            points="62,70 58,78 66,78"
            fill="url(#logoGradient)"
          />
          {/* Pen grip lines */}
          <line x1="58" y1="55" x2="66" y2="55" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.4" />
          <line x1="58" y1="58" x2="66" y2="58" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.4" />
          <line x1="58" y1="61" x2="66" y2="61" stroke="hsl(var(--card))" strokeWidth="1" opacity="0.4" />
          {/* Pen cap */}
          <rect
            x="58"
            y="28"
            width="8"
            height="5"
            rx="1"
            fill="hsl(var(--accent))"
            opacity="0.8"
          />
        </g>
        
        {/* Sparkle/idea dots around lightbulb */}
        <circle cx="22" cy="25" r="3" fill="url(#logoGradient)" className="animate-pulse" style={{ animationDelay: "0s" }} />
        <circle cx="62" cy="20" r="2.5" fill="url(#logoGradient)" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
        <circle cx="18" cy="45" r="2" fill="url(#logoGradient)" className="animate-pulse" style={{ animationDelay: "0.8s" }} />
        
        {/* Light rays from bulb */}
        <line x1="25" y1="30" x2="18" y2="25" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.5" className="animate-pulse" />
        <line x1="28" y1="20" x2="25" y2="12" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.5" className="animate-pulse" style={{ animationDelay: "0.3s" }} />
        <line x1="56" y1="22" x2="62" y2="15" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.5" className="animate-pulse" style={{ animationDelay: "0.6s" }} />
      </svg>
    </div>
  );
};
