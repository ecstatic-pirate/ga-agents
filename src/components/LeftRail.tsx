"use client";

import { useState } from "react";

type RailItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

// Teams-style SVG icons
const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM3 10a7 7 0 1114 0 7 7 0 01-14 0z"/>
    <path d="M10 5.5a.5.5 0 01.5.5v4l2.5 1.5a.5.5 0 01-.5.87l-2.75-1.65A.5.5 0 019.5 10V6a.5.5 0 01.5-.5z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2c4.418 0 8 3.134 8 7s-3.582 7-8 7a8.84 8.84 0 01-3.613-.77L3 16.5l1.57-2.54A6.49 6.49 0 012 9c0-3.866 3.582-7 8-7zm0 1c-3.866 0-7 2.686-7 6 0 1.52.59 2.92 1.58 4.03l.27.3-.93 1.5 1.98-.72.23.12A7.83 7.83 0 0010 15c3.866 0 7-2.686 7-6s-3.134-6-7-6z"/>
  </svg>
);

const TeamsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8.5 3A2.5 2.5 0 006 5.5v1A2.5 2.5 0 008.5 9h3A2.5 2.5 0 0014 6.5v-1A2.5 2.5 0 0011.5 3h-3zM7 5.5A1.5 1.5 0 018.5 4h3A1.5 1.5 0 0113 5.5v1A1.5 1.5 0 0111.5 8h-3A1.5 1.5 0 017 6.5v-1z"/>
    <path d="M3 12.5A2.5 2.5 0 015.5 10h3a2.5 2.5 0 012.5 2.5v1a2.5 2.5 0 01-2.5 2.5h-3A2.5 2.5 0 013 13.5v-1zM5.5 11A1.5 1.5 0 004 12.5v1A1.5 1.5 0 005.5 15h3a1.5 1.5 0 001.5-1.5v-1A1.5 1.5 0 008.5 11h-3z"/>
    <path d="M11.5 10a2.5 2.5 0 00-2.5 2.5v1a2.5 2.5 0 002.5 2.5h3a2.5 2.5 0 002.5-2.5v-1a2.5 2.5 0 00-2.5-2.5h-3zm-1.5 2.5a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5v-1z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 2a.5.5 0 01.5.5V3h5v-.5a.5.5 0 011 0V3h1A2.5 2.5 0 0117 5.5v9a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 14.5v-9A2.5 2.5 0 015.5 3h1v-.5A.5.5 0 017 2zM5.5 4A1.5 1.5 0 004 5.5V7h12V5.5A1.5 1.5 0 0014.5 4h-9zM16 8H4v6.5A1.5 1.5 0 005.5 16h9a1.5 1.5 0 001.5-1.5V8z"/>
  </svg>
);

const CallsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4.72 3.28a1 1 0 011.32-.08l.1.08 2.5 2.5a1 1 0 01.08 1.32l-.08.1-.94.94c-.1.1-.1.26.02.42a10.6 10.6 0 003.72 3.72c.16.12.32.12.42.02l.94-.94a1 1 0 011.32-.08l.1.08 2.5 2.5a1 1 0 01.08 1.32l-.08.1-1.06 1.06a2.5 2.5 0 01-3.04.38A14.58 14.58 0 013.28 7.4a2.5 2.5 0 01.38-3.04l1.06-1.06z"/>
  </svg>
);

const OneDriveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M6.5 7a4.5 4.5 0 018.92.91 3.5 3.5 0 01-.42 6.99v.1H6a4 4 0 01-.5-7.97V7zm.58 1.02A3 3 0 006 14h8.5a2.5 2.5 0 00.5-4.95V9a3.5 3.5 0 00-6.92-1z"/>
  </svg>
);

const CopilotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z"/>
    <path d="M15 12l.75 2.25L18 15l-2.25.75L15 18l-.75-2.25L12 15l2.25-.75L15 12z" opacity="0.6"/>
  </svg>
);

const SalesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3.5a.5.5 0 01.5-.5h13a.5.5 0 010 1h-13a.5.5 0 01-.5-.5zM3 10a.5.5 0 01.5-.5h13a.5.5 0 010 1h-13A.5.5 0 013 10zm.5 6a.5.5 0 000 1h13a.5.5 0 000-1h-13z"/>
    <path d="M6 6v8l4-4 3 3 4-4v8"/>
  </svg>
);

const VivaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM3 10a7 7 0 1114 0 7 7 0 01-14 0z"/>
    <path d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z"/>
  </svg>
);

const GetAbstractIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm1 2h10v10H5V5z"/>
    <path d="M7 7h6v1H7V7zm0 2h6v1H7V9zm0 2h4v1H7v-1z"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="4" cy="10" r="1.5"/>
    <circle cx="10" cy="10" r="1.5"/>
    <circle cx="16" cy="10" r="1.5"/>
  </svg>
);

const AppsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
  </svg>
);

const railItems: RailItem[] = [
  { id: "activity", label: "Activity", icon: <ActivityIcon />, badge: 4 },
  { id: "chat", label: "Chat", icon: <ChatIcon /> },
  { id: "teams", label: "Teams", icon: <TeamsIcon /> },
  { id: "calendar", label: "Calendar", icon: <CalendarIcon /> },
  { id: "calls", label: "Calls", icon: <CallsIcon /> },
  { id: "onedrive", label: "OneDrive", icon: <OneDriveIcon /> },
  { id: "copilot", label: "Copilot", icon: <CopilotIcon /> },
  { id: "sales", label: "Sales", icon: <SalesIcon /> },
  { id: "viva", label: "Viva Insights", icon: <VivaIcon /> },
  { id: "getabstract", label: "getAbstract", icon: <GetAbstractIcon /> },
];

export default function LeftRail() {
  const [activeId, setActiveId] = useState("chat");

  return (
    <div className="w-[72px] h-full bg-[#0d0d0d] flex flex-col items-center py-2 border-r border-[#3b3a39]">
      {/* Main nav items */}
      <div className="flex-1 flex flex-col items-center w-full">
        {railItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveId(item.id)}
            className={`relative flex flex-col items-center justify-center w-full h-[52px] text-[#c8c6c4] hover:text-white hover:bg-[#3d3d3d] transition-colors ${
              activeId === item.id ? "text-white" : ""
            }`}
          >
            {/* Active indicator */}
            {activeId === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#2b2b40] rounded-r-sm" />
            )}

            {/* Badge */}
            {item.badge && (
              <div className="absolute top-1 right-3 min-w-[16px] h-[16px] bg-[#c4314b] rounded-full flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white px-1">{item.badge}</span>
              </div>
            )}

            <div className="flex items-center justify-center w-6 h-6">
              {item.icon}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom items */}
      <div className="flex flex-col items-center w-full border-t border-[#3b3a39] pt-2">
        <button className="flex flex-col items-center justify-center w-full h-[52px] text-[#c8c6c4] hover:text-white hover:bg-[#3d3d3d]">
          <MoreIcon />
        </button>
        <button className="flex flex-col items-center justify-center w-full h-[52px] text-[#c8c6c4] hover:text-white hover:bg-[#3d3d3d]">
          <AppsIcon />
          <span className="text-[10px] mt-0.5">Apps</span>
        </button>
      </div>
    </div>
  );
}
