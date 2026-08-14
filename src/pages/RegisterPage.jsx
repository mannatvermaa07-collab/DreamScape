import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import styles from '../styles/AuthPages.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timelineStart, setTimelineStart] = useState('07:00');
  const [timelineEnd, setTimelineEnd] = useState('22:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !timelineStart || !timelineEnd) return;
    register(name, 20, email, password, timelineStart, timelineEnd);
    navigate('/app/dashboard');
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoBox}>
            <Star size={22} fill="currentColor" />
          </div>
          <h2 className={styles.title}>Create DreamScape Account</h2>
          <p className={styles.subtitle}>Enter your details once to initialize your personal workspace</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="manat@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Timeline Start</label>
              <select
                className={styles.input}
                value={timelineStart}
                onChange={(e) => {
                  setTimelineStart(e.target.value);
                  const sh = parseInt(e.target.value.split(':')[0], 10);
                  const eh = parseInt(timelineEnd.split(':')[0], 10);
                  if (eh <= sh) setTimelineEnd(`${String(sh + 1).padStart(2, '0')}:00`);
                }}
                required
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const h = String(i).padStart(2, '0') + ':00';
                  return <option key={h} value={h}>{h}</option>;
                })}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Timeline End</label>
              <select
                className={styles.input}
                value={timelineEnd}
                onChange={(e) => setTimelineEnd(e.target.value)}
                required
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const h = String(i).padStart(2, '0') + ':00';
                  const sh = parseInt(timelineStart.split(':')[0], 10);
                  return (
                    <option key={h} value={h} disabled={i <= sh}>
                      {h}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={ArrowRight}>
            Register & Initialize
          </Button>
        </form>

        <p className={styles.footerText}>
          Already registered?{' '}
          <Link to="/login" className={styles.link}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}