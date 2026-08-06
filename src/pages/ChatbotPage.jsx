import { useState } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from '../styles/ChatbotPage.module.css';

const SUGGESTED_PROMPTS = [
  "How can I break down my long-term engineering goal?",
  "Tips to increase my daily habit streak compliance",
  "Summarize effective reflective journaling strategies",
  "How to avoid cognitive fatigue during deep work"
];

export function ChatbotPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Greetings! I am your DreamScape AI Productivity Advisor. Ask me anything about goal milestone planning, habit formation strategies, or reflective workflows."
    }
  ]);

  const handleSend = (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      let botReply = "I have analyzed your query. To maximize compounding gains, focus on 15-minute daily iterations rather than overwhelming tasks.";
      const lower = messageText.toLowerCase();

      if (lower.includes('goal') || lower.includes('break down')) {
        botReply = "To effectively break down a major goal: 1) Define the end milestone, 2) Split into 3 micro-outcomes, 3) Attach a 14-day target date to each.";
      } else if (lower.includes('habit') || lower.includes('streak')) {
        botReply = "Habit compliance increases when anchored to an existing routine (Habit Stacking). Try pairing your habit with your morning coffee.";
      } else if (lower.includes('journal') || lower.includes('reflection')) {
        botReply = "Effective journaling relies on 3 prompts: What moved the needle today? What caused friction? What is tomorrow's single priority?";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: botReply }
      ]);
    }, 600);
  };

  return (
    <div className={styles.container}>
      {/* Bot Header */}
      <div className={styles.header}>
        <div className={styles.botInfo}>
          <div className={styles.botAvatar}>
            <Bot size={20} />
          </div>
          <div>
            <h3 className={styles.botTitle}>DreamScape AI Intelligence Copilot</h3>
            <span className={styles.botStatus}>
              <Sparkles size={12} /> Active & Ready
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className={styles.chatArea}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.messageRow} ${
              m.sender === 'user' ? styles.userRow : styles.assistantRow
            }`}
          >
            <div
              className={`${styles.messageContent} ${
                m.sender === 'user' ? styles.userContent : styles.assistantContent
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Prompt Chips */}
      <div className={styles.promptChips}>
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button key={i} className={styles.chip} onClick={() => handleSend(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <div className={styles.inputFooter}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className={styles.form}
        >
          <input
            type="text"
            placeholder="Ask AI Copilot for advice..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.input}
          />
          <Button type="submit" variant="primary" icon={Send}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
