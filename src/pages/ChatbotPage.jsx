import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RotateCcw } from 'lucide-react';
import { sendMessage, resetChat } from '../lib/gemini';
import { Button } from '../components/ui/Button';
import styles from '../styles/ChatbotPage.module.css';

const SUGGESTED_PROMPTS = [
  "How do I break down a big goal into weekly steps?",
  "I keep breaking my habit streak — any tips?",
  "Give me 3 journaling prompts for tonight",
  "How to stop procrastinating on hard tasks?"
];

export function ChatbotPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hey! I'm your DreamScape AI assistant. Ask me anything about your goals, habits, scheduling, or productivity — I'm here to help."
    }
  ]);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(messageText);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: response }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: "Sorry, something went wrong. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewChat = () => {
    resetChat();
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: "Fresh start! What would you like to work on?"
      }
    ]);
    inputRef.current?.focus();
  };



  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.botInfo}>
          <div className={styles.botAvatar}>
            <Bot size={20} />
          </div>
          <div>
            <h3 className={styles.botTitle}>DreamScape AI</h3>
            <span className={styles.botStatus}>
              <Sparkles size={12} />
              Active & Ready
            </span>
          </div>
        </div>
        <button
          className={styles.newChatBtn}
          onClick={handleNewChat}
          title="New conversation"
        >
          <RotateCcw size={16} />
          <span>New chat</span>
        </button>
      </div>

      {/* Messages */}
      <div className={styles.chatArea}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.messageRow} ${
              m.sender === 'user' ? styles.userRow : styles.assistantRow
            }`}
          >
            {m.sender === 'assistant' && (
              <div className={styles.msgAvatar}>
                <Bot size={16} />
              </div>
            )}
            <div
              className={`${styles.messageContent} ${
                m.sender === 'user' ? styles.userContent : styles.assistantContent
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={styles.msgAvatar}>
              <Bot size={16} />
            </div>
            <div className={`${styles.messageContent} ${styles.assistantContent}`}>
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts — only show if few messages */}
      {messages.length <= 2 && (
        <div className={styles.promptChips}>
          {SUGGESTED_PROMPTS.map((p, i) => (
            <button
              key={i}
              className={styles.chip}
              onClick={() => handleSend(p)}
              disabled={isLoading}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.inputFooter}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className={styles.form}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={isLoading ? 'Thinking...' : 'Type a message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />
          <Button type="submit" variant="primary" icon={Send} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
