import { create } from "zustand";

export type MessageAction = {
  id: string;
  label: string;
  onClick?: () => void;
};

export type MessageAttachment = {
  type: "audio" | "pdf";
  title: string;
  duration?: string; // for audio
  size?: string; // for pdf
};

export type Message = {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  actions?: MessageAction[];
  isTyping?: boolean;
  attachment?: MessageAttachment;
};

export type Contact = {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  status: "online" | "away" | "busy" | "offline";
  lastMessage: string;
  lastMessageTime: string;
  unread?: boolean;
  isAgent?: boolean;
  agentType?: "cara" | "lena";
};

export type Conversation = {
  contactId: string;
  messages: Message[];
  currentStep: number;
};

// Scripted flow for CARA demo - each step is either a user response or a time skip
type ScriptStep = {
  type: "user-response" | "time-skip";
  label: string;
  userMessage?: string;
  triggerResponse?: string;
  advanceDays?: number; // How many days to advance the demo time
  advanceHours?: number; // How many hours to advance
  crossAgentDelivery?: {
    targetAgent: "cara" | "lena";
    responseKey: string;
  };
};

const caraScript: ScriptStep[] = [
  // After intro, user says Yes
  { type: "user-response", label: "Yes", userMessage: "Yes", triggerResponse: "afterYes" },
  // Time skip to next day
  { type: "time-skip", label: "⏭ Next day — Pre-meeting prep", triggerResponse: "preMeeting", advanceDays: 1 },
  // User wants to see the technique
  { type: "user-response", label: "Show me", userMessage: "Show me", triggerResponse: "accusationAudit" },
  // User requests audio
  { type: "user-response", label: "Send 3-min audio for commute", userMessage: "Send it to me", triggerResponse: "audioSent" },
  // Time skip to after meeting
  { type: "time-skip", label: "⏭ After meeting — Debrief", triggerResponse: "postMeeting", advanceDays: 1, advanceHours: 4 },
  // User reports how it went (the "learning moment" path)
  { type: "user-response", label: "Okay, but I caved when they threatened to walk", userMessage: "Okay. Tried the Accusation Audit but caved when they threatened to walk away.", triggerResponse: "batnaExplanation" },
  // Time skip to 1 week later
  { type: "time-skip", label: "⏭ 1 week later — Spaced repetition", triggerResponse: "spacedRepetition", advanceDays: 7 },
  // User has a BATNA
  { type: "user-response", label: "I'll ask for freelancer budget instead", userMessage: "I'll ask for freelancer budget instead.", triggerResponse: "goodPivot" },
  // Time skip to 90 days
  { type: "time-skip", label: "⏭ 90 days later — Quarterly review", triggerResponse: "quarterlyReview", advanceDays: 83 },
  // User downloads PDF
  { type: "user-response", label: "Download 1-page PDF", userMessage: "Thanks, downloading now.", triggerResponse: "endDemo" },
];

const lenaScript: ScriptStep[] = [
  // Sarah asks to set up training
  { type: "user-response", label: "Set up training for 12 new managers", userMessage: "I need to set up training for 12 new first-time managers in Q1.", triggerResponse: "setupRequest" },
  // User confirms creation
  { type: "user-response", label: "Create it", userMessage: "Create it", triggerResponse: "afterCreate" },
  // User says who to send to
  { type: "user-response", label: "Send to Q1 cohort", userMessage: "Send it to the Q1 manager cohort", triggerResponse: "scheduled" },
  // Time skip - Day 1: LENA confirms sent, CARA delivers the content
  {
    type: "time-skip",
    label: "⏭ Day 1 — Training delivered",
    triggerResponse: "deliverySent",
    advanceDays: 1,
    crossAgentDelivery: { targetAgent: "cara", responseKey: "trainingDelivery" }
  },
  // Time skip - Back to Sarah view (2 weeks later)
  { type: "time-skip", label: "⏭ 2 weeks later — Progress report", triggerResponse: "report", advanceDays: 13 },
  // Sarah extends deadline for lagging learners
  { type: "user-response", label: "Extend deadline by 1 week", userMessage: "Extend by 1 week", triggerResponse: "extended" },
  // Time skip - Program complete
  { type: "time-skip", label: "⏭ 1 week later — Program complete", triggerResponse: "finalReport", advanceDays: 7 },
];

interface ChatState {
  contacts: Contact[];
  conversations: Record<string, Conversation>;
  activeContactId: string | null;
  scriptIndex: Record<string, number>;
  demoStartTime: Date; // When the demo started (reference point)
  demoTime: Date; // Current fictional time for the demo
  setActiveContact: (id: string) => void;
  addMessage: (contactId: string, message: Message) => void;
  handleAction: (contactId: string, actionId: string) => void;
  triggerAgentResponse: (contactId: string, responseKey: string) => void;
  handleUserInput: (contactId: string, text: string) => void;
  getNextScriptStep: (agentType: "cara" | "lena") => ScriptStep | null;
  executeNextStep: (contactId: string) => void;
  getDemoStartTime: () => Date;
  getDemoTime: () => Date;
}

// CARA conversation flow - no action buttons, controlled by script
const caraConversation: Record<
  string,
  { content: string; actions?: MessageAction[]; attachment?: MessageAttachment }
> = {
  intro: {
    content: `Hi Alex! I scanned your last 30 days — you had 5+ meetings with Procurement and Vendors.\n\nWant to make Negotiation your focus this quarter?`,
  },
  afterYes: {
    content: `Locked in. I'll watch your calendar and send tips before relevant meetings. Talk soon.`,
  },
  preMeeting: {
    content: `Acme Corp renewal tomorrow at 10 AM.\nYou mentioned wanting to hold firm on price.\n\n2-min refresh on the "Accusation Audit" from Never Split the Difference?`,
  },
  accusationAudit: {
    content: `The move: Open by listing everything they *might* think about you.\n\n"You probably think we're being unreasonable with this budget..."\n\nIt forces them to reassure you instead of attacking.`,
  },
  audioSent: {
    content: `Here's your 3-minute refresher. Good luck tomorrow!`,
    attachment: { type: "audio", title: "Accusation Audit - Quick Refresher", duration: "3:12" },
  },
  postMeeting: {
    content: `How did Acme go?`,
  },
  nailedIt: {
    content: `Nice work! The prep paid off. I'll log this win in your Negotiation Journal.`,
  },
  batnaExplanation: {
    content: `Classic. The "walk away" threat triggers panic.\n\nKey concept: BATNA (Best Alternative to Negotiated Agreement). If you don't know yours, you'll always cave.\n\nAction: Before next negotiation, write down what actually happens if they walk. Usually not that bad.\n\nSaved to your Negotiation Journal.`,
  },
  spacedRepetition: {
    content: `Quick one. You have a 1:1 with your Director today.\n\nDo you know your BATNA for the resource request?\nIf they say "no budget for hires" — what's Plan B?`,
  },
  goodPivot: {
    content: `Solid pivot. Good luck.`,
  },
  quarterlyReview: {
    content: `90-day check-in. Here's your Growth Snapshot:\n\n📊 Strategic Prep (BATNA) ········· High\n📊 Tactical Empathy (Accusation Audit) · Practicing\n📊 Emotional Regulation ·········· New Focus\n\n🏆 Key Win: Pivoted to freelancer budget in Week 3 when Director said no to new hires.`,
  },
  endDemo: {
    content: `Here's your Growth Snapshot. Keep going — you're building real skills. See you next quarter!`,
    attachment: { type: "pdf", title: "Alex_Growth_Snapshot_Q1.pdf", size: "142 KB" },
  },
  // Training delivery from LENA via CARA
  trainingDelivery: {
    content: `Hi Sarah! 👋\n\nYour "First-Time Manager Essentials" program starts today.\n\nModule 1 is a 10-min read on Delegation. Ready when you are!`,
    attachment: { type: "pdf", title: "Module_1_Delegation.pdf", size: "856 KB" },
  },
  trainingModuleOpened: {
    content: `Great! Let me know if you have questions. Tomorrow you'll get a quick activity to practice what you learned.`,
  },
};

// LENA conversation flow - no action buttons, controlled by script
const lenaConversation: Record<
  string,
  { content: string; actions?: MessageAction[]; attachment?: MessageAttachment }
> = {
  intro: {
    content: `Hi Sarah! I'm LENA, your Learning Enablement Agent. How can I help you today?`,
  },
  setupRequest: {
    content: `On it. Here's what I'll create in Studio:\n\n**Learning Path: "First-Time Manager Essentials"**\n├─ Module 1: Delegation (Summary + Skill Boost)\n├─ Module 2: Feedback (Summary + AI Coaching)\n└─ Module 3: Running 1:1s (Custom Page + Activity)\n\n+ Activity Calendar: 2 weeks, daily micro-tasks\n+ AI Coaching: Practice difficult conversations`,
  },
  afterCreate: {
    content: `Done! ✅ 3 modules, ~45 min total.\n\nWho should I send this to?`,
    attachment: { type: "pdf" as const, title: "First-Time_Manager_Essentials.pdf", size: "2.4 MB" },
  },
  scheduled: {
    content: `Scheduled for 12 learners. Each one gets:\n\n📅 Day 1 → Welcome + Module 1\n📅 Day 2 → Activity: "Delegate one task today"\n📅 Day 4 → Module 2 + reminder\n📅 Day 5 → AI Coaching invite\n📅 Day 8-10 → Module 3 + wrap-up\n\nI'll handle all reminders automatically.`,
  },
  deliverySent: {
    content: `Content sent to all 12 learners! ✅\n\nYou're also enrolled, so you'll receive your copy via CARA.\n\nI'll send you progress updates as they complete modules.`,
  },
  moduleOpened: {
    content: `Great! Let me know if you have questions. Tomorrow you'll get a quick activity to practice what you learned.`,
  },
  report: {
    content: `Program update — 2 weeks in:\n\n📊 **Completion:** 10/12 finished all modules (83%)\n📊 **AI Coaching:** 8/12 did at least 1 practice session\n📊 **Top Activity:** "Delegate one task" — 11/12 done\n\n⚠️ **Lagging:** Jamie, Priya (stuck on Module 2)`,
  },
  extended: {
    content: `Done. Jamie and Priya now have until Friday.\nI'll nudge them Monday + Wednesday.`,
  },
  finalReport: {
    content: `Program complete! 🎉\n\n**Final Results:**\n✅ 12/12 completed all modules (100%)\n✅ 10/12 completed AI Coaching\n✅ Average satisfaction: 4.6/5\n\nHere's the full report for your records.`,
    attachment: { type: "pdf" as const, title: "Q1_Manager_Training_Report.pdf", size: "1.2 MB" },
  },
};

const initialContacts: Contact[] = [
  {
    id: "cara",
    name: "CARA",
    avatar: "",
    initials: "CA",
    status: "online",
    lastMessage: "Want to make Negotiation your fo...",
    lastMessageTime: "10:15",
    isAgent: true,
    agentType: "cara",
  },
  {
    id: "lena",
    name: "LENA",
    avatar: "",
    initials: "LE",
    status: "online",
    lastMessage: "Hi Sarah! I'm LENA, your Learning...",
    lastMessageTime: "09:30",
    isAgent: true,
    agentType: "lena",
  },
  {
    id: "angelique",
    name: "Angelique Marcelli",
    avatar: "",
    initials: "AM",
    status: "online",
    lastMessage: "That's great, thank you!",
    lastMessageTime: "15:06",
  },
  {
    id: "petra",
    name: "Petra Imgraben",
    avatar: "",
    initials: "PI",
    status: "away",
    lastMessage: "That is great, thank you very much...",
    lastMessageTime: "15:02",
  },
  {
    id: "jan",
    name: "Jan Meyer-Veden",
    avatar: "",
    initials: "JM",
    status: "online",
    lastMessage: "You: cool - let me know how it goes",
    lastMessageTime: "15:05",
  },
  {
    id: "raul",
    name: "Ra\u00fal Bergen",
    avatar: "",
    initials: "RB",
    status: "busy",
    lastMessage: "You: Let me know if something else is...",
    lastMessageTime: "14:57",
  },
  {
    id: "patrick",
    name: "Patrick Brigger",
    avatar: "",
    initials: "PB",
    status: "offline",
    lastMessage: "You: https://copilotstudio.microsoft...",
    lastMessageTime: "14:17",
  },
  {
    id: "thomas",
    name: "Thomas Bergen",
    avatar: "",
    initials: "TB",
    status: "away",
    lastMessage: "You: Hey Thomas - she is recovering...",
    lastMessageTime: "09:46",
  },
];

const initialConversations: Record<string, Conversation> = {
  cara: {
    contactId: "cara",
    messages: [
      {
        id: "cara-1",
        content: caraConversation.intro.content,
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        actions: caraConversation.intro.actions,
      },
    ],
    currentStep: 0,
  },
  lena: {
    contactId: "lena",
    messages: [
      {
        id: "lena-1",
        content: lenaConversation.intro.content,
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
    currentStep: 0,
  },
  angelique: {
    contactId: "angelique",
    messages: [
      {
        id: "ang-1",
        content: "Hi! Did you get a chance to review the Q1 marketing proposal?",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: "ang-2",
        content: "Yes, just finished going through it. Really solid work on the campaign structure.",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
      },
      {
        id: "ang-3",
        content: "Thanks! I wanted to make sure the budget allocation made sense. Any concerns there?",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: "ang-4",
        content: "The digital spend looks good. Maybe we should discuss the event budget in our sync tomorrow?",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "ang-5",
        content: "That's great, thank you!",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 6),
      },
    ],
    currentStep: 0,
  },
  petra: {
    contactId: "petra",
    messages: [
      {
        id: "pet-1",
        content: "Hey Petra, quick question about the vendor contracts",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "pet-2",
        content: "Sure, what do you need?",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.8),
      },
      {
        id: "pet-3",
        content: "Can you send me the updated terms for the Acme Corp renewal?",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      },
      {
        id: "pet-4",
        content: "Of course! I'll email it over in the next hour. They made some changes to the SLA section.",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: "pet-5",
        content: "Perfect, thanks for the heads up",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
      },
      {
        id: "pet-6",
        content: "That is great, thank you very much Shantanu! Let me know if you need anything else.",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
      },
    ],
    currentStep: 0,
  },
  jan: {
    contactId: "jan",
    messages: [
      {
        id: "jan-1",
        content: "Hey, are we still on for the project review tomorrow?",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        id: "jan-2",
        content: "Yes! 2pm works for me",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
      },
      {
        id: "jan-3",
        content: "Perfect. I'll send the calendar invite",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "jan-4",
        content: "Sounds good, see you then",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
    currentStep: 0,
  },
  raul: {
    contactId: "raul",
    messages: [
      {
        id: "raul-1",
        content: "The API integration is ready for testing",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        id: "raul-2",
        content: "Great! I'll run through the test cases this afternoon",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.5),
      },
      {
        id: "raul-3",
        content: "Found a small issue with the auth token refresh. Should be fixed now.",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: "raul-4",
        content: "Confirmed, it's working now. Nice catch!",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
      },
      {
        id: "raul-5",
        content: "Let me know if something else is required for the release",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 57),
      },
    ],
    currentStep: 0,
  },
  patrick: {
    contactId: "patrick",
    messages: [
      {
        id: "pat-1",
        content: "Have you seen the new Copilot Studio features?",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: "pat-2",
        content: "Not yet, anything interesting?",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5.5),
      },
      {
        id: "pat-3",
        content: "Yes! The new plugin architecture looks promising for our use case",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        id: "pat-4",
        content: "Send me the link?",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.5),
      },
      {
        id: "pat-5",
        content: "https://copilotstudio.microsoft.com/",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 17),
      },
    ],
    currentStep: 0,
  },
  thomas: {
    contactId: "thomas",
    messages: [
      {
        id: "tho-1",
        content: "How's Sarah doing? Heard she was under the weather",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        id: "tho-2",
        content: "Hey Thomas - she is recovering well, thanks for asking!",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10),
      },
      {
        id: "tho-3",
        content: "Glad to hear that. Tell her we're all thinking of her",
        sender: "agent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9.5),
      },
      {
        id: "tho-4",
        content: "Will do! She should be back next week",
        sender: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9),
      },
    ],
    currentStep: 0,
  },
};

export const useChatStore = create<ChatState>((set, get) => ({
  contacts: initialContacts,
  conversations: initialConversations,
  activeContactId: "cara",
  scriptIndex: { cara: 0, lena: 0 },
  demoStartTime: new Date(), // Reference point for relative dates
  demoTime: new Date(), // Current fictional time

  setActiveContact: (id: string) => {
    set({ activeContactId: id });
  },

  getDemoStartTime: () => {
    return get().demoStartTime;
  },

  getDemoTime: () => {
    return get().demoTime;
  },

  getNextScriptStep: (agentType: "cara" | "lena") => {
    const script = agentType === "cara" ? caraScript : lenaScript;
    const index = get().scriptIndex[agentType] || 0;
    return index < script.length ? script[index] : null;
  },

  executeNextStep: (contactId: string) => {
    const contact = get().contacts.find((c) => c.id === contactId);
    if (!contact?.isAgent || !contact.agentType) return;

    const script = contact.agentType === "cara" ? caraScript : lenaScript;
    const currentIndex = get().scriptIndex[contact.agentType] || 0;

    if (currentIndex >= script.length) return;

    const step = script[currentIndex];

    // Advance demo time if this is a time skip
    let newDemoTime = get().demoTime;
    if (step.advanceDays || step.advanceHours) {
      newDemoTime = new Date(newDemoTime);
      if (step.advanceDays) {
        newDemoTime.setDate(newDemoTime.getDate() + step.advanceDays);
      }
      if (step.advanceHours) {
        newDemoTime.setHours(newDemoTime.getHours() + step.advanceHours);
      }
      set({ demoTime: newDemoTime });
    }

    if (step.type === "user-response" && step.userMessage) {
      // Send user message first with demo time
      get().addMessage(contactId, {
        id: `user-${Date.now()}`,
        content: step.userMessage,
        sender: "user",
        timestamp: new Date(newDemoTime),
      });
    }

    // Trigger agent response
    if (step.triggerResponse) {
      get().triggerAgentResponse(contactId, step.triggerResponse);
    }

    // Handle cross-agent delivery (e.g., LENA sends training, CARA delivers it)
    if (step.crossAgentDelivery) {
      const { targetAgent, responseKey } = step.crossAgentDelivery;
      // Add message to target agent's chat after a short delay
      setTimeout(() => {
        get().triggerAgentResponse(targetAgent, responseKey);
        // Mark target agent as having unread message
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === targetAgent ? { ...c, unread: true } : c
          ),
        }));
      }, 2000); // Slight delay after LENA's confirmation
    }

    // Advance script index
    set((state) => ({
      scriptIndex: {
        ...state.scriptIndex,
        [contact.agentType!]: currentIndex + 1,
      },
    }));
  },

  addMessage: (contactId: string, message: Message) => {
    set((state) => {
      const conversation = state.conversations[contactId] || {
        contactId,
        messages: [],
        currentStep: 0,
      };

      return {
        conversations: {
          ...state.conversations,
          [contactId]: {
            ...conversation,
            messages: [...conversation.messages, message],
          },
        },
        contacts: state.contacts.map((c) =>
          c.id === contactId
            ? {
                ...c,
                lastMessage:
                  message.sender === "user"
                    ? `You: ${message.content.substring(0, 30)}...`
                    : message.content.substring(0, 30) + "...",
                lastMessageTime: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }),
              }
            : c
        ),
      };
    });
  },

  triggerAgentResponse: (contactId: string, responseKey: string) => {
    const contact = get().contacts.find((c) => c.id === contactId);
    if (!contact?.isAgent) return;

    const conversationData =
      contact.agentType === "cara" ? caraConversation : lenaConversation;
    const response = conversationData[responseKey] as { content: string; actions?: MessageAction[]; attachment?: MessageAttachment };

    if (response) {
      // Add typing indicator
      const demoTime = get().demoTime;
      const typingMessage: Message = {
        id: `typing-${Date.now()}`,
        content: "",
        sender: "agent",
        timestamp: new Date(demoTime),
        isTyping: true,
      };
      get().addMessage(contactId, typingMessage);

      // Remove typing and add real message after delay
      setTimeout(() => {
        set((state) => {
          const conversation = state.conversations[contactId];
          const messagesWithoutTyping = conversation.messages.filter(
            (m) => !m.isTyping
          );

          const newMessage: Message = {
            id: `${contactId}-${Date.now()}`,
            content: response.content,
            sender: "agent",
            timestamp: new Date(state.demoTime),
            actions: response.actions,
            attachment: response.attachment,
          };

          return {
            conversations: {
              ...state.conversations,
              [contactId]: {
                ...conversation,
                messages: [...messagesWithoutTyping, newMessage],
                currentStep: conversation.currentStep + 1,
              },
            },
          };
        });
      }, 1500);
    }
  },

  handleAction: (contactId: string, actionId: string) => {
    const { triggerAgentResponse, addMessage } = get();

    // Map action IDs to responses and user messages
    const actionMap: Record<string, { userMessage: string; response: string }> =
      {
        // CARA actions
        "cara-yes": { userMessage: "Yes.", response: "afterYes" },
        "cara-other": { userMessage: "Something else.", response: "afterYes" },
        "cara-showme": { userMessage: "Show me.", response: "accusationAudit" },
        "cara-notnow": { userMessage: "Not now.", response: "preMeeting" },
        "cara-audio": {
          userMessage: "Send it to me.",
          response: "postMeeting",
        },
        "cara-nailed": { userMessage: "Nailed it!", response: "spacedRepetition" },
        "cara-okay": {
          userMessage:
            "Okay. Tried the Accusation Audit but caved when they threatened to walk away.",
          response: "batnaExplanation",
        },
        "cara-rough": { userMessage: "Rough.", response: "batnaExplanation" },
        "cara-haveit": {
          userMessage: "I'll ask for freelancer budget instead.",
          response: "goodPivot",
        },
        "cara-help": { userMessage: "Help me think.", response: "goodPivot" },
        "cara-pdf": {
          userMessage: "Thanks, downloading now.",
          response: "quarterlyReview",
        },
        // LENA actions
        "lena-create": { userMessage: "Create it.", response: "afterCreate" },
        "lena-adjust": { userMessage: "Let me adjust.", response: "setupRequest" },
        "lena-openmodule": {
          userMessage: "Opening Module 1...",
          response: "report",
        },
        "lena-remind": { userMessage: "Remind me tomorrow.", response: "report" },
        "lena-remindthem": {
          userMessage: "Remind them.",
          response: "extended",
        },
        "lena-extend": {
          userMessage: "Extend by 1 week.",
          response: "extended",
        },
        "lena-fullreport": {
          userMessage: "Show me the full report.",
          response: "extended",
        },
        // Additional trigger actions from generic responses
        "cara-premeeting-trigger": { userMessage: "Help me prep for a meeting.", response: "preMeeting" },
        "cara-review-trigger": { userMessage: "Show me my progress.", response: "quarterlyReview" },
        "lena-setup-trigger": { userMessage: "I need to set up training for my team.", response: "setupRequest" },
        "lena-report-trigger": { userMessage: "Show me the training reports.", response: "report" },
      };

    const action = actionMap[actionId];
    if (action) {
      // Add user message
      addMessage(contactId, {
        id: `user-${Date.now()}`,
        content: action.userMessage,
        sender: "user",
        timestamp: new Date(),
      });

      // Trigger agent response
      triggerAgentResponse(contactId, action.response);
    }
  },

  handleUserInput: (contactId: string, text: string) => {
    const { addMessage, triggerAgentResponse, contacts } = get();
    const contact = contacts.find((c) => c.id === contactId);

    if (!contact?.isAgent) return;

    // Add user message
    addMessage(contactId, {
      id: `user-${Date.now()}`,
      content: text,
      sender: "user",
      timestamp: new Date(),
    });

    // Determine response based on keywords
    const lowerText = text.toLowerCase();

    if (contact.agentType === "cara") {
      // CARA contextual responses
      if (lowerText.includes("negotiation") || lowerText.includes("negotiate")) {
        triggerAgentResponse(contactId, "intro");
      } else if (lowerText.includes("meeting") || lowerText.includes("prep") || lowerText.includes("acme")) {
        triggerAgentResponse(contactId, "preMeeting");
      } else if (lowerText.includes("batna") || lowerText.includes("walk away")) {
        triggerAgentResponse(contactId, "batnaExplanation");
      } else if (lowerText.includes("review") || lowerText.includes("progress") || lowerText.includes("90 day")) {
        triggerAgentResponse(contactId, "quarterlyReview");
      } else if (lowerText.includes("yes") || lowerText.includes("sure") || lowerText.includes("ok")) {
        triggerAgentResponse(contactId, "afterYes");
      } else {
        // Generic helpful response
        setTimeout(() => {
          addMessage(contactId, {
            id: `cara-${Date.now()}`,
            content: "Got it. I'm here to help you with negotiation skills, meeting prep, and personal development. What would you like to focus on?",
            sender: "agent",
            timestamp: new Date(),
            actions: [
              { id: "cara-premeeting-trigger", label: "Meeting prep" },
              { id: "cara-review-trigger", label: "Review progress" },
            ],
          });
        }, 1000);
      }
    } else if (contact.agentType === "lena") {
      // LENA contextual responses
      if (lowerText.includes("training") || lowerText.includes("manager") || lowerText.includes("new hire") || lowerText.includes("12 new")) {
        triggerAgentResponse(contactId, "setupRequest");
      } else if (lowerText.includes("send") || lowerText.includes("team") || lowerText.includes("q1")) {
        triggerAgentResponse(contactId, "scheduled");
      } else if (lowerText.includes("report") || lowerText.includes("progress") || lowerText.includes("how") || lowerText.includes("status")) {
        triggerAgentResponse(contactId, "report");
      } else if (lowerText.includes("yes") || lowerText.includes("create") || lowerText.includes("do it")) {
        triggerAgentResponse(contactId, "afterCreate");
      } else {
        // Generic helpful response
        setTimeout(() => {
          addMessage(contactId, {
            id: `lena-${Date.now()}`,
            content: "I'm LENA, your Learning Enablement Agent. I can help you design training programs, schedule learning paths for your team, and track their progress. What would you like to do?",
            sender: "agent",
            timestamp: new Date(),
            actions: [
              { id: "lena-setup-trigger", label: "Set up training" },
              { id: "lena-report-trigger", label: "View reports" },
            ],
          });
        }, 1000);
      }
    }
  },
}));
