import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Target,
  CheckSquare,
  BookOpen,
  Calendar as CalendarIcon,
  MessageSquare,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from '../styles/LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Navigation Header */}
      <header className={styles.navHeader}>
        <div className={styles.brand}>
          <div className={styles.logoBox}>
            <Star size={18} fill="currentColor" />
          </div>
          <span className={styles.brandName}>DreamScape</span>
        </div>

        <nav className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#metrics" className={styles.navLink}>Metrics</a>
        </nav>

        <div className={styles.authButtons}>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Zap size={14} />
          <span>Engineered for Peak Performance & Pure Black Aesthetics</span>
        </div>

        <h1 className={styles.heroTitle}>
          Your Personal Growth Operating System
        </h1>

        <p className={styles.heroSubtitle}>
          DreamScape unifies goal setting, habit compounding, interactive calendar scheduling, and daily reflective journaling into a single, high-density split-view workspace.
        </p>

        <div className={styles.heroCta}>
          <Button size="lg" variant="primary" icon={ArrowRight} onClick={() => navigate('/app/dashboard')}>
            Launch Workspace
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
            Create Account
          </Button>
        </div>

        {/* Mockup Preview Element */}
        <div className={styles.previewFrame}>
          <div className={styles.previewInner}>
            <div className={styles.previewBar}>
              <div className={`${styles.dot} ${styles.dotRed}`} />
              <div className={`${styles.dot} ${styles.dotYellow}`} />
              <div className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#111111', padding: '16px', borderRadius: '10px', border: '1px solid #222222', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#EB9D86', fontWeight: 600 }}>SPLIT-VIEW DESIGN</div>
                <div style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0' }}>Akiflow & Linear Inspired</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Left Sidebar + Right Calendar</div>
              </div>
              <div style={{ background: '#111111', padding: '16px', borderRadius: '10px', border: '1px solid #222222', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#F2BDA8', fontWeight: 600 }}>PURE LOCAL STATE</div>
                <div style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0' }}>Zero Placeholder Data</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Clean slate for user creation</div>
              </div>
              <div style={{ background: '#111111', padding: '16px', borderRadius: '10px', border: '1px solid #222222', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>AI COPILOT ASSISTANT</div>
                <div style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0' }}>Chatbot & Floating Widget</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Instant advice & planning</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Precision Tools for Modern Productivity</h2>
          <p className={styles.sectionSubtitle}>Designed with extreme attention to detail, typography, and pure black theme contrast.</p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Target size={20} />
            </div>
            <h3 className={styles.featureCardTitle}>Milestone & Goal Tracking</h3>
            <p className={styles.featureCardDesc}>
              Deconstruct long-term ambitions into quantifiable progress bars with target dates and category filters.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <CheckSquare size={20} />
            </div>
            <h3 className={styles.featureCardTitle}>Compounding Habit Grid</h3>
            <p className={styles.featureCardDesc}>
              Track daily consistency with weekly dot-matrix toggles and automated streak counters.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <CalendarIcon size={20} />
            </div>
            <h3 className={styles.featureCardTitle}>Interactive Calendar</h3>
            <p className={styles.featureCardDesc}>
              Monthly, weekly, and daily scheduling views with clickable day detail modals for entries & notes.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <MessageSquare size={20} />
            </div>
            <h3 className={styles.featureCardTitle}>AI Copilot Assistant</h3>
            <p className={styles.featureCardDesc}>
              Dedicated Chatbot workspace and floating action button for quick productivity coaching.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>
          <span>© 2026 DreamScape Operating System. Inspired by Akiflow & Linear.</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className={styles.navLink}>Sign In</Link>
          <Link to="/app/dashboard" className={styles.navLink}>Demo App</Link>
        </div>
      </footer>
    </div>
  );
}
