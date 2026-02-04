"use client";

import TitleBar from "@/components/TitleBar";
import LeftRail from "@/components/LeftRail";
import ChatList from "@/components/ChatList";
import ChatArea from "@/components/ChatArea";

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d0d0d]">
      {/* Title bar */}
      <TitleBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left navigation rail */}
        <LeftRail />

        {/* Chat list panel */}
        <ChatList />

        {/* Chat area */}
        <ChatArea />
      </div>
    </main>
  );
}
