import { useState } from 'react';
import { MessageSquare, X, Send, Bot, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/FloatingChatWidget.module.css';

export function FloatingChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your DreamScape AI Copilot. How can I help optimize your goals, habits, or schedule today?"
    }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // Simulated responsive static response
    setTimeout(() => {
      let botReply = "I've noted that in your growth log! Consistency in daily focus sessions is key.";
      const lower = currentInput.toLowerCase();
      if (lower.includes('goal') || lower.includes('target')) {
        botReply = "Great question regarding goals! Deconstructing targets into 14-day milestones increases completion probability by 40%.";
      } else if (lower.includes('habit') || lower.includes('streak')) {
        botReply = "Maintaining a habit streak compounds exponentially. Make sure to check off your routine before 9 PM today.";
      } else if (lower.includes('calendar') || lower.includes('schedule')) {
        botReply = "You can view all your logged entries and daily progress inside the dedicated Calendar view!";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: botReply }
      ]);
    }, 500);
  };

  return (
    <div className={styles.floatingContainer}>
      {isOpen && (
        <div className={styles.chatPopup}>
          <div className={styles.popupHeader}>
            <div className={styles.titleBox}>
              <Bot size={18} style={{ color: 'var(--primary)' }} />
              <span>DreamScape AI Assistant</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setIsOpen(false);
                  navigate('/app/chatbot');
                }}
                title="Expand to Full Page"
              >
                <ExternalLink size={15} />
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                title="Close Chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className={styles.messagesList}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageBubble} ${
                  m.sender === 'user' ? styles.userBubble : styles.assistantBubble
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className={styles.inputRow}>
            <input
              type="text"
              placeholder="Ask AI assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.chatInput}
            />
            <button type="submit" className={styles.sendBtn} title="Send Message">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        className={styles.floatingBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
        title="AI Assistant"
      >
        <MessageSquare size={22} />
      </button>
    </div>
  );
}
