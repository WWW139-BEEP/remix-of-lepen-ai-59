import { cn } from "@/lib/utils";

interface SparkleProps {
  className?: string;
  size?: number;
}

export const Sparkle = ({ className, size = 24 }: SparkleProps) => (
  <div className={cn("relative text-primary pointer-events-none", className)}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-sparkle"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size * 0.35}
      height={size * 0.35}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="absolute -top-1 -left-1 animate-sparkle delay-100"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size * 0.25}
      height={size * 0.25}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="absolute -bottom-0.5 -right-0.5 animate-sparkle delay-300"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  </div>
);

export const SparkleBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
    <Sparkle className="absolute top-[5%] left-[5%]" size={24} />
    <Sparkle className="absolute top-[8%] right-[8%] delay-200" size={20} />
    <Sparkle className="absolute bottom-[15%] left-[8%] delay-2000" size={28} />
    <Sparkle className="absolute bottom-[10%] right-[5%] delay-500" size={22} />
    <Sparkle className="absolute top-[40%] left-[3%] delay-700" size={16} />
    <Sparkle className="absolute top-[60%] right-[3%] delay-1000" size={18} />
    <Sparkle className="absolute top-[25%] right-[15%] delay-300" size={14} />
    <Sparkle className="absolute bottom-[30%] left-[15%] delay-500" size={16} />
  </div>
);
