'use client';

import { Copy } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

export function CopyButton({ textToCopy, className }: CopyButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <button
      className={className || "px-3 py-2 bg-white text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.12)] border border-[rgba(55,50,47,0.08)] hover:bg-gray-50 rounded-full transition-colors"}
      onClick={handleCopy}
    >
      <Copy className="w-4 h-4" />
    </button>
  );
}


