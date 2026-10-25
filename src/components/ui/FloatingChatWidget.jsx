import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../../lib/gemini';
import styles from '../../styles/FloatingChatWidget.module.css';

export function FloatingChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hey! I'm your DreamScape AI assistant. How can I help you today?"
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(currentInput);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: response }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: 'Sorry, something went wrong. Try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.floatingContainer}>
      {isOpen && (
        <div className={styles.chatPopup}>
          <div className={styles.popupHeader}>
            <div className={styles.titleBox}>
              <Bot size={18} style={{ color: 'var(--primary)' }} />
              <span>DreamScape AI</span>
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
            {isLoading && (
              <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                <span className={styles.typingDots}>
                  <span /><span /><span />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className={styles.inputRow}>
            <input
              type="text"
              placeholder={isLoading ? 'Thinking...' : 'Ask AI assistant...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.chatInput}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              title="Send Message"
              disabled={isLoading || !input.trim()}
            >
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
