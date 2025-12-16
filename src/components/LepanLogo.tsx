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
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
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
        
        {/* Abstract L shape - representing Lepen */}
        <path
          d="M 30 25 L 30 70 L 55 70"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* AI sparkle elements */}
        <circle cx="65" cy="35" r="4" fill="url(#logoGradient)" className="animate-pulse" />
        <circle cx="72" cy="50" r="3" fill="url(#logoGradient)" className="animate-pulse" style={{ animationDelay: "0.3s" }} />
        <circle cx="60" cy="55" r="2.5" fill="url(#logoGradient)" className="animate-pulse" style={{ animationDelay: "0.6s" }} />
        
        {/* Neural network lines */}
        <line x1="55" y1="45" x2="65" y2="35" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.6" />
        <line x1="55" y1="55" x2="72" y2="50" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.6" />
        <line x1="55" y1="55" x2="60" y2="55" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.6" />
        <line x1="65" y1="35" x2="72" y2="50" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.4" />
      </svg>
    </div>
  );
};
