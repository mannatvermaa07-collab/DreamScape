let conversationHistory = [];

/**
 * Send a message and get a smart response instantly.
 */
export async function sendMessage(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  const reply = getSmartResponse(userMessage);
  conversationHistory.push({ role: 'assistant', content: reply });
  return reply;
}

/**
 * Reset the chat
 */
export function resetChat() {
  conversationHistory = [];
}

/**
 * Always true — chatbot is always ready
 */
export function isAPIConfigured() {
  return true;
}

// ───────────────────────────────────────
// Smart Response Engine
// ───────────────────────────────────────

const RESPONSE_BANK = {
  greeting: [
    "Hey! 👋 I'm here to help with your goals, habits, or anything productivity-related. What's on your mind?",
    "Hello! Ready to help you stay on track. What are you working on today?",
    "Hey there! 🌟 What can I help you with — goals, habits, scheduling?"
  ],
  name: [
    "I'm DreamScape AI — your personal productivity assistant! I'm here to help you with goals, habits, journaling, and staying on track. 🚀",
    "My name is DreamScape AI! Think of me as your productivity buddy — here to help with planning, habits, and motivation."
  ],
  about: [
    "I'm DreamScape AI, built right into your workspace. I help with goal planning, habit tracking advice, journaling prompts, time management, and staying motivated. Ask me anything! 🎯",
    "I'm your built-in productivity assistant! I can help with breaking down goals, building habits, journaling strategies, and beating procrastination."
  ],
  goals: [
    "To break down a big goal: define your end result, split it into 3 milestones with 2-week deadlines each. Focus on just the first one — clarity comes from action.",
    "The best goals follow a simple formula: specific outcome + deadline + first step. Instead of \"get fit,\" try \"run 2km three times a week, starting tomorrow morning.\"",
    "Start with the end in mind, then work backwards. If you want to finish a project in 3 months, what needs to be done by month 1? By week 1? By tomorrow?",
    "One powerful trick: write your goal as if it's already done. \"I completed the project proposal by March 15.\" Then list what made that possible."
  ],
  habits: [
    "The best habit trick is stacking — attach your new habit to something you already do. \"After I pour my coffee, I'll journal for 5 minutes.\" Start tiny and build up.",
    "Don't break the chain! Track your habit visually — every day you complete it, mark it. The streak itself becomes the motivation after about 2 weeks.",
    "If you keep breaking a habit, make it embarrassingly small. Instead of \"exercise for 30 min,\" start with \"put on workout clothes.\" The rest follows naturally.",
    "The two-minute rule: if a habit takes less than 2 minutes, do it immediately. If it takes more, your starting version should take under 2 minutes."
  ],
  journal: [
    "Try these 3 prompts tonight:\n• What went well today?\n• What was challenging?\n• What's my single priority for tomorrow?\n\nKeep it under 5 minutes — consistency beats depth.",
    "Morning journaling tip: write 3 things you're grateful for, your top priority for the day, and one thing you'd like to improve. Takes 3 minutes, changes your whole day.",
    "Try the \"brain dump\" method: set a 5-minute timer and write everything on your mind without editing. Then circle the 1-2 things that actually matter.",
    "If you're new to journaling, start with just one question: \"What's the most important thing I learned today?\" You can always expand later."
  ],
  motivation: [
    "When you're stuck, shrink the task. Instead of \"write the report,\" try \"open the doc and type one sentence.\" Starting is 90% of the battle.",
    "Motivation follows action, not the other way around. Don't wait to feel ready — do the smallest version of the task, and motivation will catch up.",
    "The 5-second rule: when you know you should do something, count 5-4-3-2-1 and physically move. Don't give your brain time to talk you out of it.",
    "Remember: you don't have to be perfect, you just have to be consistent. A bad workout is better than no workout. A rough draft is better than a blank page."
  ],
  schedule: [
    "Block your top 3 priorities first thing in the morning, before meetings fill the day. Even 30-minute blocks compound over a week.",
    "Try time-boxing: assign every task a specific time slot and a hard stop. Parkinson's law says work expands to fill available time — so shrink the time.",
    "The Pomodoro technique works: 25 minutes of focused work, 5-minute break, repeat. After 4 rounds, take a 15-minute break.",
    "Schedule your hardest task during your peak energy hours. For most people, that's 9-11 AM. Save emails and admin for your low-energy afternoon."
  ],
  focus: [
    "To focus better: close all tabs except the one you need, put your phone in another room, and set a 25-minute timer. You'll be surprised how much you do.",
    "The biggest focus killer is context switching. Try to batch similar tasks — all emails at once, all writing at once, all meetings back-to-back.",
    "If your mind keeps wandering, keep a \"distraction pad\" next to you. When a random thought pops up, write it down and return to your task. Deal with the list later.",
    "Deep work needs protection. Block 2 hours on your calendar as a meeting with yourself. Treat it as non-negotiable."
  ],
  stress: [
    "When overwhelmed, use the 1-3-5 rule: pick 1 big task, 3 medium tasks, and 5 small tasks for the day. That's it. Everything else can wait.",
    "Feeling overwhelmed usually means you're thinking about too many things. Write everything down — getting it out of your head reduces anxiety immediately.",
    "Take a 5-minute walk. Research shows even brief movement resets your stress response and improves clarity. Your work will be there when you get back.",
    "You can't pour from an empty cup. If you've been grinding hard, rest isn't laziness — it's maintenance. Schedule downtime like you schedule work."
  ],
  study: [
    "Active recall beats re-reading every time. Close your notes and try to write down everything you remember. The struggle is where learning happens.",
    "The spacing effect: review material at increasing intervals (1 day, 3 days, 7 days, 14 days). This builds long-term memory far better than cramming.",
    "Try the Feynman technique: explain the concept in simple words as if teaching a child. If you can't, you don't truly understand it yet.",
    "Study in focused 25-minute blocks with 5-minute breaks. After 3-4 blocks, take a longer break. Your brain needs rest to consolidate information."
  ],
  sleep: [
    "Better sleep starts 2 hours before bed: dim the lights, stop screens, and do something calm. Your brain needs a runway to land into sleep.",
    "Keep a consistent wake time — even on weekends. It's the single most effective thing for better sleep quality.",
    "If your mind races at night, do a 5-minute brain dump before bed. Write down tomorrow's tasks and worries. Once they're on paper, your brain can let go."
  ],
  thanks: [
    "You're welcome! Keep up the great work. I'm here whenever you need a nudge. 💪",
    "Glad I could help! Remember, small steps every day. You've got this! 🎯",
    "Anytime! Consistency is your superpower — keep showing up. 🌟"
  ],
  how_are_you: [
    "I'm doing great, thanks for asking! 😊 I'm always here and ready to help. What are you working on?",
    "All good here! More importantly — how are YOU doing? Need help with anything today?"
  ],
  default: [
    "That's a great question! My suggestion: break it into the smallest next step you can take in the next 15 minutes. Small actions compound into big results.",
    "Here's a framework that works:\n1. Define what done looks like\n2. Identify the very next action\n3. Set a timer and start\n\nClarity comes from doing, not planning.",
    "The key to productivity isn't doing more — it's doing the right things. Ask yourself: \"What's the one thing that would make everything else easier?\"",
    "Good thinking! Give yourself permission to do a rough draft first. Perfectionism is the biggest productivity killer. You can always refine later.",
    "Don't rely on motivation — build systems instead. Set up your environment so the right action is the easiest action. That's how real habits stick.",
    "I'd recommend starting with your 'why' — when your reason is clear, the 'how' becomes much easier to figure out. What matters most to you about this?"
  ]
};

function getSmartResponse(message) {
  const lower = message.toLowerCase();
  let category = 'default';

  if (/\b(what('?s| is) your name|who are you)\b/.test(lower)) category = 'name';
  else if (/\b(what (can|do) you|tell me about yourself|what are you)\b/.test(lower)) category = 'about';
  else if (/\b(how are you|how('?re| are) you doing)\b/.test(lower)) category = 'how_are_you';
  else if (/\b(hi|hello|hey|howdy|sup|what'?s up)\b/.test(lower)) category = 'greeting';
  else if (/\b(goal|target|milestone|break down|achieve|ambition|objective|dream)\b/.test(lower)) category = 'goals';
  else if (/\b(habit|streak|routine|daily|consistency|consistent|track|repeat)\b/.test(lower)) category = 'habits';
  else if (/\b(journal|reflect|write|diary|note|prompt|gratitude|morning pages)\b/.test(lower)) category = 'journal';
  else if (/\b(motivat|stuck|procrastinat|lazy|can'?t start|unmotivated|struggle|give up)\b/.test(lower)) category = 'motivation';
  else if (/\b(schedule|time manage|calendar|plan|planner|organize|prioriti|todo|to-do)\b/.test(lower)) category = 'schedule';
  else if (/\b(focus|distract|concentrat|attention|deep work|pomodoro|flow)\b/.test(lower)) category = 'focus';
  else if (/\b(stress|overwhelm|anxious|burnout|tired|exhaust|too much|overload)\b/.test(lower)) category = 'stress';
  else if (/\b(study|exam|learn|revision|memorize|remember|test prep|homework)\b/.test(lower)) category = 'study';
  else if (/\b(sleep|insomnia|tired|rest|nap|bedtime|wake up)\b/.test(lower)) category = 'sleep';
  else if (/\b(thank|thanks|thx|appreciate)\b/.test(lower)) category = 'thanks';

  const responses = RESPONSE_BANK[category];
  return responses[Math.floor(Math.random() * responses.length)];
}
