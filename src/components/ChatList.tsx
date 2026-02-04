"use client";

import { useChatStore } from "@/store/chatStore";
import Avatar from "./Avatar";
import { Search, MoreHorizontal, ChevronDown, Plus } from "lucide-react";

// Copilot sparkle icon - monochrome like Mentions
const CopilotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" fill="#c8c6c4" />
    <path d="M18 14L18.75 16.25L21 17L18.75 17.75L18 20L17.25 17.75L15 17L17.25 16.25L18 14Z" fill="#c8c6c4" opacity="0.6" />
  </svg>
);

// Mentions @ icon - simple text-based
const MentionsIcon = () => (
  <span className="text-[16px] text-[#c8c6c4] font-normal leading-none">@</span>
);

// Filter icon
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 3h14v1.5H1V3zm2 4.5h10V9H3V7.5zm2 4.5h6v1.5H5V12z"/>
  </svg>
);

export default function ChatList() {
  const { contacts, activeContactId, setActiveContact } = useChatStore();

  // Separate agents from regular contacts
  const agents = contacts.filter((c) => c.isAgent);
  const regularContacts = contacts.filter((c) => !c.isAgent);

  return (
    <div className="w-[320px] h-full bg-[#1a1a1a] border-r border-[#3b3a39] flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between">
        <h1 className="text-base font-semibold text-white">Chat</h1>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <MoreHorizontal size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Search size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Divider under header */}
      <div className="mx-4 border-b border-[#3b3a39]" />

      {/* Filters - single row */}
      <div className="px-4 py-3 flex gap-1.5">
        {["Unread", "Chats", "Unmuted", "Meeting chats"].map((filter) => (
          <button
            key={filter}
            className="px-2 py-0.5 text-[11px] text-[#c8c6c4] bg-transparent border border-[#484644] rounded-full hover:bg-[#3b3a39] hover:text-white transition-colors whitespace-nowrap"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Divider under filters */}
      <div className="mx-4 border-b border-[#3b3a39]" />

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {/* Copilot */}
        <div className="px-4 py-2 flex items-center cursor-pointer hover:bg-[#3b3a39] mx-2 rounded">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            <CopilotIcon />
          </div>
          <span className="ml-3 text-sm text-[#c8c6c4]">Copilot</span>
        </div>

        {/* Mentions */}
        <div className="px-4 py-2 flex items-center cursor-pointer hover:bg-[#3b3a39] mx-2 rounded">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            <MentionsIcon />
          </div>
          <span className="ml-3 text-sm text-[#c8c6c4]">Mentions</span>
        </div>

        {/* Separator line */}
        <div className="mx-4 my-2 border-b border-[#3b3a39]" />

        {/* Favorites section - agents only */}
        <div>
          <div className="section-header">
            <ChevronDown size={12} />
            <span>Favorites</span>
          </div>
          {agents.map((contact) => (
            <div key={contact.id} className="px-2">
              <div
                className={`chat-item ${activeContactId === contact.id ? "active" : ""}`}
                onClick={() => setActiveContact(contact.id)}
              >
                <Avatar
                  initials={contact.initials}
                  status={contact.status}
                  isAgent={contact.isAgent}
                  agentType={contact.agentType}
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm truncate">
                      {contact.name}
                    </span>
                    <span className="text-xs text-[#a19f9d] ml-2 flex-shrink-0">
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <div className="text-xs text-[#a19f9d] truncate mt-0.5">
                    {contact.lastMessage}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chats section - all regular contacts */}
        <div className="mt-1">
          <div className="section-header">
            <ChevronDown size={12} />
            <span>Chats</span>
          </div>
          {regularContacts.map((contact) => (
            <div key={contact.id} className="px-2">
              <div
                className={`chat-item ${activeContactId === contact.id ? "active" : ""}`}
                onClick={() => setActiveContact(contact.id)}
              >
                <Avatar initials={contact.initials} status={contact.status} />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm truncate">
                      {contact.name}
                    </span>
                    <span className="text-xs text-[#a19f9d] ml-2 flex-shrink-0">
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <div className="text-xs text-[#a19f9d] truncate mt-0.5">
                    {contact.lastMessage}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
