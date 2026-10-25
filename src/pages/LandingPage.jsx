import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  Flame,
  BookOpen,
  Calendar,
  Brain,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/Button';
import styles from '../styles/LandingPage.module.css';

const FEATURES = [
  {
    icon: Flame,
    title: 'Habits',
    description: 'Build consistency with daily streaks that hold you accountable.',
    accent: '#C7566F'
  },
  {
    icon: BookOpen,
    title: 'Notes',
    description: 'Capture your thoughts, reflections, and ideas in one place.',
    accent: '#4A8C5E'
  },
  {
    icon: Calendar,
    title: 'Timeline',
    description: 'See your week clearly — what\'s planned, done, and what slipped.',
    accent: '#4878A8'
  },
  {
    icon: Brain,
    title: 'AI Copilot',
    description: 'Get nudges, plans, and check-ins tailored to your goals.',
    accent: '#7B5EA7'
  },
  {
    icon: TrendingUp,
    title: 'Progress',
    description: 'Track completion rates and trends to see how far you\'ve come.',
    accent: '#A88C3E'
  }
];

// Mon → Sun. level 0-4 drives how "lit up" that day's square is.
const WEEK = [
  { letter: 'M', name: 'Monday', level: 2, note: 'Morning run + wrote 400 words.' },
  { letter: 'T', name: 'Tuesday', level: 1, note: 'Rest day — logged it anyway.' },
  { letter: 'W', name: 'Wednesday', level: 4, note: 'Finished the portfolio wireframes.' },
  { letter: 'T', name: 'Thursday', level: 3, note: 'Added a note — a short gratitude list.' },
  { letter: 'F', name: 'Friday', level: 4, note: 'Long run, felt strong the whole way.' },
  { letter: 'S', name: 'Saturday', level: 0, note: 'Off. No streak lost for taking it.' },
  { letter: 'S', name: 'Sunday', level: 2, note: 'Planned out next week\u2019s goals.' }
];

const LEVEL_COLORS = [
  'rgba(204, 228, 255, 0.14)',
  'rgba(204, 228, 255, 0.32)',
  'rgba(204, 228, 255, 0.5)',
  'rgba(204, 228, 255, 0.72)',
  'rgba(204, 228, 255, 0.95)'
];

// t = 1 -> light, t = 0 -> dark
const LIGHT = { paper: '#FAF7F3', surface: '#F1EAE2', ink: '#211C18', inkMute: '#8A7E74', line: '#E3DBD1' };
const DARK = { paper: '#15100D', surface: '#1E1712', ink: '#F3EAE3', inkMute: '#9C8E82', line: '#332821' };

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
function lerpHex(hexA, hexB, t) {
  const a = hexA.match(/\w\w/g).map((h) => parseInt(h, 16));
  const b = hexB.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${lerp(a[0], b[0], t)}, ${lerp(a[1], b[1], t)}, ${lerp(a[2], b[2], t)})`;
}
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function LandingPage() {
  const navigate = useNavigate();
  const { startDemo } = useAuth();

  // Shared, persisted theme — the same source of truth used across the
  // rest of the app (auth pages, dashboard, etc). Toggling here updates
  // localStorage/user settings, so the choice sticks everywhere.
  const { theme, toggleTheme: toggleGlobalTheme } = useTheme();
  const dark = theme === 'dark';

  const pageRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(theme === 'dark' ? 0 : 1);

  const [loaded, setLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(3);

  // Which of the two overlapping hero cards is currently on top.
  const [frontCard, setFrontCard] = useState('week');

  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(id);
  }, []);

  const applyTheme = (t) => {
    const el = pageRef.current;
    if (!el) return;
    el.style.setProperty('--paper', lerpHex(DARK.paper, LIGHT.paper, t));
    el.style.setProperty('--surface', lerpHex(DARK.surface, LIGHT.surface, t));
    el.style.setProperty('--ink', lerpHex(DARK.ink, LIGHT.ink, t));
    el.style.setProperty('--ink-mute', lerpHex(DARK.inkMute, LIGHT.inkMute, t));
    el.style.setProperty('--line', lerpHex(DARK.line, LIGHT.line, t));
  };

  // On mount, snap the crossfaded colors straight to whatever theme was
  // already stored — no animation, just matching the state instantly so
  // there's no flash of the wrong theme.
  useEffect(() => {
    applyTheme(tRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One click sweeps every color smoothly from where it is to the target —
  // same crossfade feel as a drag, without needing the drag itself.
  const animateTo = (target) => {
    cancelAnimationFrame(rafRef.current);
    const start = tRef.current;
    const startTime = performance.now();
    const duration = 480;
    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const eased = easeInOutCubic(p);
      const t = start + (target - start) * eased;
      tRef.current = t;
      applyTheme(t);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const toggleTheme = () => {
    const next = !dark;
    animateTo(next ? 0 : 1);
    toggleGlobalTheme();
  };

  const handleDemo = () => {
    startDemo();
    navigate('/app/dashboard');
  };

  const activeDay = WEEK[selectedDay];

  return (
    <div ref={pageRef} className={`${styles.page} ${loaded ? styles.loaded : ''} ${dark ? styles.dark : ''}`}>

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>
            <Star size={20} fill="currentColor" strokeWidth={0} />
          </span>
          DreamScape
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.themeToggle} ${dark ? styles.dark : ''}`}
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={dark}
          >
            <span className={styles.themeIconClip}>
              <span className={`${styles.themeIcon} ${styles.themeIconSun}`}><Sun size={17} /></span>
              <span className={`${styles.themeIcon} ${styles.themeIconMoon}`}><Moon size={16} /></span>
            </span>
          </button>
          <button className={styles.navLink} onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heroGrid}>
          <section className={styles.heroLeft}>
            <p className={styles.eyebrow}>Your personal workspace</p>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroLine}><span>Organize your days,</span></span>
              <span className={styles.heroLine}><span>build <em className={styles.heroAccent}>real habits</em>.</span></span>
            </h1>
            <p className={styles.heroSubtitle}>
              A calm space to track habits, write notes, and plan your week — without the clutter.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryBtn} onClick={() => navigate('/register')}>
                Get started
                <ArrowRight size={16} />
              </button>
              <button className={styles.ghostBtn} onClick={handleDemo}>
                Try the demo
              </button>
            </div>
          </section>

          <section className={styles.heroRight}>
            {/* Two same-size cards, overlapping in a loose stack. Tap
                either one to bring it to the front. */}
            <div className={styles.cardStack}>
              <div
                className={`${styles.miniCard} ${frontCard === 'mini' ? styles.isFront : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setFrontCard('mini')}
                onMouseEnter={() => setFrontCard('mini')}
                onFocus={() => setFrontCard('mini')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFrontCard('mini');
                  }
                }}
                aria-label="Copilot nudge card"
              >
                <div className={styles.miniCardHead}>
                  <span className={styles.miniCardIcon}><Brain size={12} /></span>
                  Copilot
                </div>
                <p className={styles.miniCardText}>Nice pace this week — try a short walk before dinner.</p>
              </div>

              <div
                className={`${styles.weekCard} ${frontCard === 'week' ? styles.isFront : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setFrontCard('week')}
                onMouseEnter={() => setFrontCard('week')}
                onFocus={() => setFrontCard('week')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFrontCard('week');
                  }
                }}
                aria-label="This week's activity card"
              >
                <div className={styles.weekHead}>
                  <span className={styles.weekTitle}>This week</span>
                  <span className={styles.streakBadge}>
                    <span className={styles.streakFlame}><Flame size={13} fill="currentColor" strokeWidth={0} /></span>
                    12-day streak
                  </span>
                </div>

                <div className={styles.weekGrid}>
                  {WEEK.map((d, i) => (
                    <button
                      key={d.name}
                      className={`${styles.dayCell} ${selectedDay === i ? styles.daySelected : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(i);
                        setFrontCard('week');
                      }}
                      aria-label={`${d.name}: ${d.note}`}
                      aria-pressed={selectedDay === i}
                    >
                      <span className={styles.daySquare} style={{ '--lvl-color': LEVEL_COLORS[d.level] }} />
                      <span className={styles.dayLetter}>{d.letter}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.weekNote}>
                  <p className={styles.weekNoteDay}>{activeDay.name}</p>
                  <p className={styles.weekNoteText} key={selectedDay}>{activeDay.note}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Features as clean, static cards */}
        <section className={styles.journey}>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={styles.featureCard}
                  style={{ '--f-accent': f.accent }}
                >
                  <span className={styles.featureIconWrap}>
                    <Icon size={15} strokeWidth={1.7} />
                  </span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>DreamScape</span>
        <span>© 2026 — data stays on your device</span>
      </footer>
    </div>
  );
}