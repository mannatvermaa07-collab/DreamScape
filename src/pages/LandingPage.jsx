import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  Sparkles,
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
    description: 'Show up daily. Streaks track consistency, not just good intentions.',
    bg: '#FDECF1',
    accent: '#E0699B'
  },
  {
    icon: BookOpen,
    title: 'Notes',
    description: 'Capture thoughts, track moods, and review your personal growth over time.',
    bg: '#EAF7EB',
    accent: '#57A66E'
  },
  {
    icon: Calendar,
    title: 'Timeline',
    description: 'Your week, laid out honestly \u2014 what\u2019s planned, what\u2019s done, what slipped.',
    bg: '#E9F1FD',
    accent: '#4C82C9'
  },
  {
    icon: Brain,
    title: 'AI copilot',
    description: 'Ask for a plan, a nudge, or a gut check. It already knows your goals.',
    bg: '#F3ECFB',
    accent: '#8862C7'
  },
  {
    icon: TrendingUp,
    title: 'Progress',
    description: 'Momentum you can point to \u2014 completion rates, trends, quiet wins.',
    bg: '#FDF6DE',
    accent: '#C99A2E'
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

// Fixed-but-scattered star positions so the sky doesn't re-shuffle on re-render.
const STARS = [
  { top: '8%', left: '12%', sd: '0s', so: 0.8 },
  { top: '15%', left: '82%', sd: '0.6s', so: 0.6 },
  { top: '28%', left: '48%', sd: '1.1s', so: 0.7 },
  { top: '40%', left: '6%', sd: '1.7s', so: 0.5 },
  { top: '35%', left: '92%', sd: '0.3s', so: 0.9 },
  { top: '55%', left: '20%', sd: '2.1s', so: 0.6 },
  { top: '62%', left: '70%', sd: '0.9s', so: 0.7 },
  { top: '75%', left: '40%', sd: '1.4s', so: 0.5 },
  { top: '80%', left: '88%', sd: '1.9s', so: 0.8 },
  { top: '18%', left: '60%', sd: '2.4s', so: 0.6 }
];

const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// Scattered stars/sparkles for background flavor — fixed positions, never move.
const DECOR_MARKS = [
  { top: '10%', left: '6%', char: '✦', size: '18px', rotate: '-8deg', color: '#CCE4FF', opacity: 0.55 },
  { top: '6%', left: '46%', char: '✺', size: '13px', rotate: '10deg', color: '#B78C3F', opacity: 0.4 },
  { top: '22%', left: '92%', char: '○', size: '15px', rotate: '0deg', color: '#5C7C93', opacity: 0.4 },
  { top: '48%', left: '3%', char: '✦', size: '12px', rotate: '14deg', color: '#6D8F61', opacity: 0.4 },
  { top: '68%', left: '95%', char: '✺', size: '20px', rotate: '-14deg', color: '#8B689B', opacity: 0.4 },
  { top: '80%', left: '10%', char: '◇', size: '14px', rotate: '8deg', color: '#D2665F', opacity: 0.4 },
  { top: '88%', left: '55%', char: '✦', size: '16px', rotate: '-6deg', color: '#CCE4FF', opacity: 0.55 },
  { top: '34%', left: '80%', char: '○', size: '10px', rotate: '0deg', color: '#6D8F61', opacity: 0.35 },
  { top: '58%', left: '38%', char: '✺', size: '11px', rotate: '20deg', color: '#5C7C93', opacity: 0.3 }
];

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
  const [burst, setBurst] = useState(0);

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
    setBurst((b) => b + 1);
    toggleGlobalTheme();
  };

  const handleDemo = () => {
    startDemo();
    navigate('/app/dashboard');
  };

  const activeDay = WEEK[selectedDay];

  return (
    <div ref={pageRef} className={`${styles.page} ${loaded ? styles.loaded : ''} ${dark ? styles.dark : ''}`}>
      <div className={styles.auroraField} aria-hidden="true">
        <span className={styles.auroraBlob} />
        <span className={styles.auroraBlob} />
        <span className={styles.auroraBlob} />
      </div>
      <div className={styles.decorField} aria-hidden="true">
        {DECOR_MARKS.map((m, i) => (
          <span
            key={i}
            className={styles.decorMark}
            style={{
              top: m.top,
              left: m.left,
              '--s': m.size,
              '--r': m.rotate,
              '--c': m.color,
              '--o': m.opacity
            }}
          >
            {m.char}
          </span>
        ))}
      </div>
      <div className={styles.grainOverlay} aria-hidden="true" />

      <div className={styles.starField} aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={styles.star}
            style={{ top: s.top, left: s.left, '--sd': s.sd, '--so': s.so }}
          />
        ))}
      </div>

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>
            <Star size={23} fill="currentColor" strokeWidth={0} />
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
            {burst > 0 &&
              SPARK_ANGLES.map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const dist = 20;
                return (
                  <span
                    key={`${burst}-${i}`}
                    className={styles.burstSpark}
                    style={{
                      '--tx': `${Math.cos(rad) * dist}px`,
                      '--ty': `${Math.sin(rad) * dist}px`,
                      '--spark-color': dark ? '#F3EAE3' : 'var(--accent)'
                    }}
                  />
                );
              })}
          </button>
          <button className={styles.navLink} onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heroGrid}>
          <section className={styles.heroLeft}>
            <span className={styles.heroGlow} aria-hidden="true" />
            <p className={styles.eyebrow}>
              <Sparkles size={12} className={styles.eyebrowSpark} />
              A quieter way to build a life
            </p>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroLine}><span>Turn what you imagine</span></span>
              <span className={styles.heroLine}><span>into <em className={styles.heroAccent}>what you do</em>.</span></span>
            </h1>
            <p className={styles.heroSubtitle}>
              Habits, notes, and your week — one calm workspace, no noise.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryBtn} onClick={() => navigate('/register')}>
                Start for free
                <ArrowRight size={16} />
              </button>
              <button className={styles.ghostBtn} onClick={handleDemo}>
                Explore the demo
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

        {/* Features as compact, pastel cards — the copy is written out so
            nothing needs a hover to be understood. */}
        <section className={styles.journey}>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.title}
                  className={styles.featureCard}
                  style={{ '--f-bg': f.bg, '--f-accent': f.accent }}
                >
                  <span className={styles.featureIconWrap}>
                    <Icon size={15} strokeWidth={1.7} />
                  </span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.description}</p>
                </button>
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