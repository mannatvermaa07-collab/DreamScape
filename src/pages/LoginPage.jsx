import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import styles from '../styles/AuthPages.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    login(email, password);
    navigate('/app/dashboard');
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoBox}>
            <Star size={22} fill="currentColor" />
          </div>
          <h2 className={styles.title}>Sign In to DreamScape</h2>
          <p className={styles.subtitle}>Enter your email address to load your personal workspace</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="user@gmail.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={ArrowRight}>
            Enter Workspace
          </Button>
        </form>

        <p className={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
