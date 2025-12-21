import { Pen } from "lucide-react";

export const PenCursor = () => {
  return (
    <span className="inline-flex items-center ml-1">
      <Pen className="w-4 h-4 animate-pen-flicker" />
    </span>
  );
};
