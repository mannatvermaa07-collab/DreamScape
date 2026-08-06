import { useState, useEffect } from 'react';
import styles from '../../styles/QuoteWidget.module.css';

const CERTIFIED_QUOTES = [
  {
    text: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius"
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    author: "Steve Jobs"
  },
  {
    text: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca"
  },
  {
    text: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci"
  },
  {
    text: "Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't... pays it.",
    author: "Albert Einstein"
  },
  {
    text: "You may not control all the events that happen to you, but you can decide not to be reduced by them.",
    author: "Maya Angelou"
  },
  {
    text: "Simplicity is prerequisite for reliability. Structure dictates behavior.",
    author: "Edsger W. Dijkstra"
  },
  {
    text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.",
    author: "Socrates"
  }
];

export function QuoteWidget() {
  const [quote, setQuote] = useState(CERTIFIED_QUOTES[0]);

  useEffect(() => {
    // Select a random quote every time the website is opened/loaded
    const randomIndex = Math.floor(Math.random() * CERTIFIED_QUOTES.length);
    setQuote(CERTIFIED_QUOTES[randomIndex]);
  }, []);

  return (
    <div className={styles.card}>
      <p className={styles.quoteText}>"{quote.text}"</p>
      <div className={styles.authorRow}>
        <span>— {quote.author}</span>
      </div>
    </div>
  );
}
