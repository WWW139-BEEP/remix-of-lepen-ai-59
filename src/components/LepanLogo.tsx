import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

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
      <img 
        src={logoImage} 
        alt="Lepen AI Logo" 
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  );
};
