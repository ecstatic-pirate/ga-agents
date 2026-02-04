"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import Avatar from "./Avatar";
import {
  MoreHorizontal,
  Video,
  Phone,
  UserPlus,
  Pin,
  Share2,
  Smile,
  Paperclip,
  Send,
  Plus,
} from "lucide-react";

// Format toggle icon (A with pen)
const FormatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 14.5L7.5 4h1.3l4.5 10.5h-1.4l-1.1-2.7H5.5L4.4 14.5H3zm3-4h3.3L7.6 6.3h-.1L6 10.5z"/>
    <path d="M14 11l3 3m0-3l-3 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

// GIF/Sticker icon
const GifIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z"/>
    <path d="M5 8.5h1.5v3H5v-3zm2.5 0H9v1h-.5v1h.5v1H7.5v-3zm2 0h1.5v1H10v2h-.5v-3z"/>
  </svg>
);

// Loop/Lasso icon
const LoopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="10" r="5"/>
    <path d="M12 14l4 4"/>
  </svg>
);

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="typing-dot w-1.5 h-1.5 bg-[#a19f9d] rounded-full" />
      <div className="typing-dot w-1.5 h-1.5 bg-[#a19f9d] rounded-full" />
      <div className="typing-dot w-1.5 h-1.5 bg-[#a19f9d] rounded-full" />
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Simple markdown renderer for bold text and line breaks
function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split by **text** pattern for bold
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    // Add bold text
    parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
}

function formatDate(date: Date, demoStartDate?: Date): string {
  if (!demoStartDate) {
    // For non-agent chats, use regular date formatting
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // For agent demos, show relative time from demo start
  const diffMs = date.getTime() - demoStartDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Next day";
  } else if (diffDays <= 3) {
    return `${diffDays} days later`;
  } else if (diffDays <= 10) {
    return "1 week later";
  } else if (diffDays <= 60) {
    return `${Math.round(diffDays / 7)} weeks later`;
  } else {
    return `${Math.round(diffDays / 30)} months later`;
  }
}

// Fast forward icon
const FastForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 18V6l8 6-8 6zm9 0V6l8 6-8 6z"/>
  </svg>
);

export default function ChatArea() {
  const { contacts, conversations, activeContactId, handleAction, handleUserInput, getNextScriptStep, executeNextStep, getDemoStartTime } =
    useChatStore();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find((c) => c.id === activeContactId);
  const conversation = activeContactId
    ? conversations[activeContactId]
    : undefined;
  const messages = conversation?.messages || [];
  const demoStartTime = getDemoStartTime();

  const nextStep = activeContact?.isAgent && activeContact?.agentType
    ? getNextScriptStep(activeContact.agentType)
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !activeContactId) return;
    if (activeContact?.isAgent) {
      handleUserInput(activeContactId, inputValue);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeContact) {
    return (
      <div className="flex-1 bg-[#1f1f1f] flex items-center justify-center">
        <p className="text-[#a19f9d]">Select a chat to start messaging</p>
      </div>
    );
  }

  let lastDate = "";

  return (
    <div className="flex-1 bg-[#1f1f1f] flex flex-col h-full">
      {/* Chat Header */}
      <div className="h-12 px-4 flex items-center border-b border-[#3b3a39] bg-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <Avatar
            initials={activeContact.initials}
            isAgent={activeContact.isAgent}
            agentType={activeContact.agentType}
          />
          <span className="font-semibold text-white text-sm">{activeContact.name}</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 ml-6">
          <button className="px-1 py-3 text-sm text-white border-b-2 border-[#2b2b40] -mb-[1px]">
            Chat
          </button>
          <button className="px-1 py-3 text-sm text-[#c8c6c4] hover:text-white">
            Shared
          </button>
          <button className="px-1 py-3 text-sm text-[#c8c6c4] hover:text-white">
            Storyline
          </button>
          <button className="p-1 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Plus size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Video size={18} />
          </button>
          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Phone size={18} />
          </button>
          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <UserPlus size={18} />
          </button>
          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Pin size={18} />
          </button>
          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <Share2 size={18} />
          </button>
          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#c8c6c4]">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-[200px] py-4">
        {messages.map((message) => {
          const messageDate = formatDate(message.timestamp, activeContact?.isAgent ? demoStartTime : undefined);
          const showDateSeparator = messageDate !== lastDate;
          lastDate = messageDate;

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <span className="text-sm text-[#a19f9d]">
                    {messageDate}
                  </span>
                </div>
              )}

              {message.isTyping ? (
                <div className="mb-3 message-animate">
                  {/* Name row - aligned with message bubble (after avatar) */}
                  <div className="flex items-baseline gap-2 mb-1 ml-10">
                    <span className="text-xs text-[#a19f9d]">
                      {activeContact.name}
                    </span>
                  </div>
                  {/* Avatar and typing indicator row */}
                  <div className="flex items-start gap-2">
                    <Avatar
                      initials={activeContact.initials}
                      size="sm"
                      isAgent={activeContact.isAgent}
                      agentType={activeContact.agentType}
                    />
                    <div className="bg-[#292929] rounded-md">
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              ) : message.sender === "agent" ? (
                <div className="mb-3 message-animate">
                  {/* Name and time row - aligned with message bubble (after avatar) */}
                  <div className="flex items-baseline gap-2 mb-1 ml-10">
                    <span className="text-xs text-[#a19f9d]">
                      {activeContact.name}
                    </span>
                    <span className="text-xs text-[#a19f9d]">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  {/* Avatar and message row */}
                  <div className="flex items-start gap-2">
                    <Avatar
                      initials={activeContact.initials}
                      size="sm"
                      isAgent={activeContact.isAgent}
                      agentType={activeContact.agentType}
                    />
                    <div className="bg-[#292929] rounded-md px-3 py-2 max-w-[85%]">
                      <p className="text-sm text-white whitespace-pre-wrap leading-5">
                        {renderMarkdown(message.content)}
                      </p>
                      {/* Audio attachment */}
                      {message.attachment?.type === "audio" && (
                        <div className="mt-3 bg-[#1f1f1f] rounded-md p-3 flex items-center gap-3">
                          <button className="w-10 h-10 bg-[#2b2b40] rounded-full flex items-center justify-center text-white hover:bg-[#3d3d5c] transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{message.attachment.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 bg-[#484644] rounded-full">
                                <div className="w-0 h-1 bg-[#2b2b40] rounded-full"></div>
                              </div>
                              <span className="text-xs text-[#a19f9d]">{message.attachment.duration}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* PDF attachment */}
                      {message.attachment?.type === "pdf" && (
                        <div className="mt-3 bg-[#1f1f1f] rounded-md p-3 flex items-center gap-3 hover:bg-[#292929] cursor-pointer transition-colors">
                          <div className="w-10 h-12 bg-[#c4314b] rounded flex items-center justify-center text-white text-xs font-bold">
                            PDF
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{message.attachment.title}</p>
                            <span className="text-xs text-[#a19f9d]">{message.attachment.size}</span>
                          </div>
                          <button className="p-2 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        </div>
                      )}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap">
                          {message.actions.map((action) => (
                            <button
                              key={action.id}
                              className="action-button"
                              onClick={() =>
                                handleAction(activeContactId!, action.id)
                              }
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end mb-3 message-animate">
                  <div className="max-w-[85%]">
                    <div className="flex items-baseline justify-end gap-2 mb-1">
                      <span className="text-xs text-[#a19f9d]">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="bg-[#2b2b40] rounded-md px-3 py-2">
                      <p className="text-sm text-white whitespace-pre-wrap leading-5">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Next step button - for scripted agent demos */}
      {activeContact?.isAgent && nextStep && (
        <div className="px-[200px] pb-3 flex justify-end">
          <button
            onClick={() => executeNextStep(activeContactId!)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border transition-colors ${
              nextStep.type === "time-skip"
                ? "text-[#a19f9d] hover:text-white hover:bg-[#3b3a39] border-[#484644]"
                : "text-white bg-[#2b2b40] hover:bg-[#3d3d5c] border-[#2b2b40]"
            }`}
          >
            {nextStep.type === "time-skip" ? (
              <FastForwardIcon />
            ) : (
              <Send size={14} />
            )}
            <span>{nextStep.label}</span>
          </button>
        </div>
      )}

      {/* Simple Input Area - Teams style */}
      <div className="px-[200px] pb-4">
        <div className="flex items-center bg-[#292929] rounded-md border border-[#484644] px-3 py-2">
          {/* Input field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#a19f9d]"
          />

          {/* Right side icons */}
          <div className="flex items-center gap-1 ml-3">
            <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
              <FormatIcon />
            </button>
            <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
              <Smile size={20} />
            </button>
            <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
              <GifIcon />
            </button>
            <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
              <LoopIcon />
            </button>
            <button className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d]">
              <Plus size={20} />
            </button>
            {/* Separator */}
            <div className="w-px h-5 bg-[#484644] mx-1" />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-1.5 hover:bg-[#3b3a39] rounded text-[#a19f9d] disabled:opacity-40"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
