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
  // User opts in to coaching
  { type: "user-response", label: "Yes, let's do it!", userMessage: "Yes, let's do it! I could definitely use some help with negotiations.", triggerResponse: "afterYes" },
  // Time skip to next morning - pre-meeting prep
  { type: "time-skip", label: "⏭ Next morning — Day of Acme meeting", triggerResponse: "preMeeting", advanceDays: 1 },
  // User wants to learn the technique
  { type: "user-response", label: "Yes, show me how", userMessage: "Yes, show me how to apply this to Acme.", triggerResponse: "accusationAudit" },
  // User requests the audio
  { type: "user-response", label: "Send me the audio", userMessage: "This is great — send me the audio, I'll listen on the way.", triggerResponse: "audioSent" },
  // Time skip to after the meeting
  { type: "time-skip", label: "⏭ After the meeting — Debrief time", triggerResponse: "postMeeting", advanceHours: 4 },
  // User shares what happened (the learning moment)
  { type: "user-response", label: "It went okay, but I caved at the end...", userMessage: "It went okay at first. I tried the Accusation Audit and they seemed disarmed. But then they threatened to walk and I panicked — ended up giving 15% more discount than I wanted.", triggerResponse: "batnaExplanation" },
  // Time skip to 1 week later - spaced repetition
  { type: "time-skip", label: "⏭ 1 week later — CARA checks in", triggerResponse: "spacedRepetition", advanceDays: 7 },
  // User shows they learned BATNA
  { type: "user-response", label: "Freelancer budget — that's my Plan B", userMessage: "If they say no to headcount, I'll pivot to asking for freelancer budget. Same outcome, different path.", triggerResponse: "goodPivot" },
  // Time skip to 90 days - quarterly review
  { type: "time-skip", label: "⏭ 90 days later — Quarterly review", triggerResponse: "quarterlyReview", advanceDays: 83 },
  // User receives their growth snapshot
  { type: "user-response", label: "This is amazing — thanks CARA!", userMessage: "Wow, this is amazing to see laid out like this. Thanks CARA!", triggerResponse: "endDemo" },
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
    content: `Hey Alex! 👋

I'm CARA, your personal coaching agent. I've been looking at your calendar and noticed something interesting — over the last month, you've had 7 meetings tagged as "vendor," "contract," or "procurement."

That's a lot of negotiation happening. Some people love it, some dread it — but either way, it's a skill that compounds. Get 10% better at negotiating, and it pays dividends in every deal for the rest of your career.

Want to make Negotiation your growth focus this quarter? I'll send you the right insight at the right moment — like a coach in your corner before big meetings.`,
  },
  afterYes: {
    content: `Love it. Here's how this works:

📅 **Before key meetings** — I'll send you a quick technique to try, based on what's on your calendar and what you're working on.

💬 **After meetings** — Quick debrief. What worked? What didn't? I'll help you extract the lesson.

🔁 **Between meetings** — Spaced repetition. I'll quiz you on concepts so they stick when pressure hits.

I'm pulling from the best sources — Chris Voss, Harvard PON, Stuart Diamond — but distilled into things you can actually use in the next 24 hours.

First up: I see you have the Acme Corp renewal tomorrow. I'll reach out in the morning with something useful. Talk soon! 🤝`,
  },
  preMeeting: {
    content: `Good morning! ☀️

Acme Corp renewal is at 10 AM. Looked at your notes from last time — you mentioned they always push hard on price and last quarter you gave more ground than you wanted.

I want to share a technique that's perfect for this. It's called the **Accusation Audit** — comes from Chris Voss (former FBI hostage negotiator, wrote "Never Split the Difference").

The idea: Start by listing every negative thing they *might* be thinking about you. Sounds counterintuitive, right? But it works because it:

1. Takes the sting out of their objections before they raise them
2. Makes you look self-aware and reasonable
3. Often prompts them to *reassure you* instead of attack

Want me to show you how to apply this to Acme specifically?`,
  },
  accusationAudit: {
    content: `Here's how to open with Acme:

*"Before we dive in, I want to acknowledge something. You're probably thinking we're going to give you the same runaround on pricing. You might feel like we don't fully appreciate how tight budgets are right now. And honestly, you might be wondering if this partnership is even worth renewing at these rates..."*

Then — stop. Let the silence work.

What usually happens: They start *disagreeing* with your negative assumptions. "No, no, we value the partnership..." And suddenly they're advocating for the deal instead of against it.

**Your one move:** Write down 3 things they might be thinking negatively about you or this deal. Then say them out loud at the start.

Here's a 3-minute audio refresher you can listen to on your way in. I break down exactly how to deliver it with the right tone.`,
  },
  audioSent: {
    content: `🎧 Here's your audio refresher — 3 minutes on the Accusation Audit with examples.

One more thing: Remember, the goal isn't to "win." It's to understand what they actually need and find a path that works for both sides. Go in curious, not combative.

You've got this. I'll check in after to hear how it went! 💪`,
    attachment: { type: "audio", title: "Accusation Audit - Quick Refresher", duration: "3:12" },
  },
  postMeeting: {
    content: `Hey! Acme meeting wrapped up — how'd it go?

I'm curious:
• Did you try the Accusation Audit?
• How did they respond?
• Where did you feel strong vs. where did it get tricky?

No judgment — the goal is to learn. Even the "failures" are data. 📊`,
  },
  nailedIt: {
    content: `YES! 🎉 That's what I'm talking about!

This is exactly how skills compound. You:
1. Learned a technique (Accusation Audit)
2. Applied it in a real situation
3. Saw it work

That's not theoretical knowledge anymore — it's *experience*. Your brain now has a success pattern to draw from next time the pressure's on.

I'm logging this in your Negotiation Journal as a win. We'll reference it when we do your quarterly review.

Enjoy this one. You earned it. 🏆`,
  },
  batnaExplanation: {
    content: `Ah, the classic "walk away" moment. Don't beat yourself up — this is the #1 place people cave, even experienced negotiators.

Here's what happened neurologically: When they threatened to walk, your brain triggered a loss-aversion response. The fear of losing the deal overwhelmed your rational assessment of whether the deal was even good.

**The concept you need: BATNA**
(Best Alternative To a Negotiated Agreement)

Before any negotiation, you need to know: *What happens if this falls through?* Not in a vague "that would be bad" way, but specifically:

• Is there another vendor?
• What's the cost of delay?
• What's the actual worst case?

When you know your BATNA, the "walk away" threat loses its power. Because you can calmly think: "Okay, if they walk... I'll do X. That's not ideal, but it's survivable."

**Your homework for next time:**
Before any negotiation, write down in one sentence: "If this falls through, I will ___."

I've saved this learning moment to your Negotiation Journal. This is actually great progress — you identified exactly where you need to grow. That's rare. Most people just feel vaguely bad and move on. 📝`,
  },
  spacedRepetition: {
    content: `Quick pulse check! 🎯

I see you have a 1:1 with your Director at 2pm. Looking at your notes, you're planning to ask for more headcount.

Pop quiz: **What's your BATNA?**

If they say "no budget for new hires" — what's your Plan B?

(Not a trap — I'm helping you prepare in real-time. The answer you give me now is the prep you'll wish you'd done.)`,
  },
  goodPivot: {
    content: `Freelancer budget — that's a *great* pivot. 💡

You just demonstrated what we call "creative problem-solving under constraint." Instead of:
❌ Accepting a flat "no"
❌ Getting frustrated and disengaging
❌ Asking for the same thing louder

You found a third door. Same outcome (more capacity), different path (freelancers vs. FTEs).

This is advanced negotiation. You're not just applying techniques — you're thinking flexibly.

Go get it. Let me know how it lands. 🚀`,
  },
  quarterlyReview: {
    content: `Alex — it's been 90 days. Time for your Growth Snapshot. 📊

**Where You Started:**
You came in with natural instincts but no structured framework. Your pattern was: prepare mentally, but wing it tactically. When pressure hit, you'd default to accommodation.

**What You've Built:**

🟢 **Strategic Preparation (BATNA)** — Strong
You now consistently identify alternatives before negotiations. This showed up in Week 3 when you pivoted to freelancer budget without missing a beat.

🟡 **Tactical Empathy (Accusation Audit)** — Practicing
You've used this 3 times. Hit rate: 2/3. The miss was the Acme call where timing was off — but you self-corrected in the debrief.

🔵 **Emotional Regulation** — Emerging
The "walk away" trigger still gets you. This is your next growth edge. We'll work on this next quarter.

**Highlight Reel:**
🏆 Held firm on Acme pricing (first time in 3 quarters)
🏆 Pivoted to freelancer budget when headcount was denied
🏆 Completed 4 pre-meeting preps with technique application

You're not the same negotiator you were 90 days ago. The data shows it, and more importantly — you can *feel* it in the room now.`,
  },
  endDemo: {
    content: `Here's your full Growth Snapshot PDF — good for sharing with your manager or just keeping for yourself.

**Next quarter preview:** We're going to work on emotional regulation — staying grounded when the other side escalates. I've got some techniques from high-stakes hostage negotiation that translate beautifully to vendor calls. 😄

Keep going, Alex. Real skills compound. Every negotiation from here on out benefits from what you built this quarter.

See you next week. 🤝`,
    attachment: { type: "pdf", title: "Alex_Growth_Snapshot_Q1.pdf", size: "142 KB" },
  },
  // Training delivery from LENA via CARA
  trainingDelivery: {
    content: `Hi Sarah! 👋

Your "First-Time Manager Essentials" program starts today.

Module 1 is a 10-min read on Delegation — specifically, why most new managers either delegate too little (and burn out) or delegate too much (and lose quality). There's a sweet spot, and we'll help you find it.

Ready when you are!`,
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
    set((state) => ({
      activeContactId: id,
      // Clear unread when opening chat
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, unread: false } : c
      ),
    }));
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

      // Don't update lastMessage for typing indicators (empty content)
      const shouldUpdateLastMessage = !message.isTyping && message.content;

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
                ...(shouldUpdateLastMessage && {
                  lastMessage:
                    message.sender === "user"
                      ? `You: ${message.content.substring(0, 35)}`
                      : message.content.substring(0, 35),
                  lastMessageTime: new Date().toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }),
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
