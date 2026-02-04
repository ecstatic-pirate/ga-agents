"use client";

import { Search, MoreHorizontal } from "lucide-react";
import Avatar from "./Avatar";

// Waffle menu icon (9 dots grid)
const WaffleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="4" cy="4" r="1.5"/>
    <circle cx="10" cy="4" r="1.5"/>
    <circle cx="16" cy="4" r="1.5"/>
    <circle cx="4" cy="10" r="1.5"/>
    <circle cx="10" cy="10" r="1.5"/>
    <circle cx="16" cy="10" r="1.5"/>
    <circle cx="4" cy="16" r="1.5"/>
    <circle cx="10" cy="16" r="1.5"/>
    <circle cx="16" cy="16" r="1.5"/>
  </svg>
);

// Teams logo
const TeamsLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20.625 8.5h-5.25a.375.375 0 00-.375.375v10.5c0 .207.168.375.375.375h5.25a.375.375 0 00.375-.375v-10.5a.375.375 0 00-.375-.375z" fill="#5059C9"/>
    <path d="M18 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#5059C9"/>
    <path d="M13.5 6h-9a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 004.5 18h9a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0013.5 6z" fill="#7B83EB"/>
    <path d="M11.5 9.5h-5v1.25h1.75v4.75h1.5v-4.75H11.5V9.5z" fill="white"/>
    <path d="M22 10a2 2 0 100-4 2 2 0 000 4z" fill="#7B83EB"/>
  </svg>
);

export default function TitleBar() {
  return (
    <div className="h-12 bg-[#0d0d0d] flex items-center justify-between px-4 border-b border-[#3b3a39]">
      {/* Left side - waffle menu, navigation */}
      <div className="flex items-center gap-3">
        {/* Waffle menu */}
        <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
          <WaffleIcon />
        </button>

        {/* Teams logo */}
        <div className="flex items-center">
          <TeamsLogo />
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 flex justify-center max-w-lg mx-8">
        <div className="flex items-center gap-2 bg-[#3b3a39] rounded px-3 py-1.5 w-full border border-[#484644]">
          <Search size={14} className="text-[#a19f9d]" />
          <span className="text-sm text-[#a19f9d]">Press</span>
          <kbd className="text-xs text-[#a19f9d] bg-[#292828] px-1.5 py-0.5 rounded border border-[#484644]">⌥</kbd>
          <kbd className="text-xs text-[#a19f9d] bg-[#292828] px-1.5 py-0.5 rounded border border-[#484644]">⌘</kbd>
          <kbd className="text-xs text-[#a19f9d] bg-[#292828] px-1.5 py-0.5 rounded border border-[#484644]">G</kbd>
          <span className="text-sm text-[#a19f9d]">to go right to a chat or channel</span>
        </div>
      </div>

      {/* Right side - More and profile */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
          <MoreHorizontal size={18} />
        </button>
        <div className="ml-2">
          <Avatar initials="SG" size="sm" status="online" />
        </div>
      </div>
    </div>
  );
}
