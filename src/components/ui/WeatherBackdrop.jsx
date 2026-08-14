import { useMemo } from 'react';
import styles from '../../styles/WeatherBackdrop.module.css';

// Deterministic pseudo-random so cloud/rain layout doesn't reshuffle on
// every re-render (no Math.random() jitter).
function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const WEATHER_BY_MOOD = {
  Great: 'sun',
  Good: 'partly',
  Neutral: 'cloudy',
  Bad: 'rain',
  'Very Bad': 'storm'
};

// Full-viewport animated weather layer, driven by a mood value. Mounted
// as position:fixed so it covers the whole page regardless of where in
// the DOM it sits; pointer-events:none so it never blocks clicks.
export function WeatherBackdrop({ mood }) {
  const kind = WEATHER_BY_MOOD[mood] || 'cloudy';

  const clouds = useMemo(() => {
    const count = kind === 'partly' ? 2 : kind === 'cloudy' ? 5 : kind === 'rain' || kind === 'storm' ? 6 : 0;
    return Array.from({ length: count }, (_, i) => ({
      top: 8 + seededRandom(i * 3.1) * 55,
      scale: 0.7 + seededRandom(i * 5.7) * 0.9,
      duration: 40 + seededRandom(i * 2.2) * 50,
      delay: -seededRandom(i * 7.3) * 60,
      opacity: 0.25 + seededRandom(i * 4.4) * 0.35
    }));
  }, [kind]);

  const raindrops = useMemo(() => {
    if (kind !== 'rain' && kind !== 'storm') return [];
    const count = kind === 'storm' ? 70 : 45;
    return Array.from({ length: count }, (_, i) => ({
      left: seededRandom(i * 1.7) * 100,
      duration: 0.6 + seededRandom(i * 3.3) * 0.5,
      delay: -seededRandom(i * 5.1) * 2,
      height: 14 + seededRandom(i * 6.6) * 18
    }));
  }, [kind]);

  return (
    <div className={`${styles.backdrop} ${styles[kind]}`} aria-hidden="true">
      {kind === 'sun' && (
        <div className={styles.sunWrap}>
          <div className={styles.sunGlow} />
          <div className={styles.sunRays} />
        </div>
      )}

      {kind === 'partly' && (
        <div className={styles.sunWrap} style={{ opacity: 0.7 }}>
          <div className={styles.sunGlow} />
        </div>
      )}

      {clouds.map((c, i) => (
        <div
          key={i}
          className={styles.cloud}
          style={{
            top: `${c.top}%`,
            opacity: c.opacity,
            '--s': c.scale,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`
          }}
        />
      ))}

      {raindrops.map((r, i) => (
        <div
          key={i}
          className={styles.raindrop}
          style={{
            left: `${r.left}%`,
            height: `${r.height}px`,
            animationDuration: `${r.duration}s`,
            animationDelay: `${r.delay}s`
          }}
        />
      ))}

      {kind === 'storm' && <div className={styles.lightningFlash} />}
    </div>
  );
}