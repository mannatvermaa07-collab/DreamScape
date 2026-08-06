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
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !age || !email || !password) return;
    register(name, age, email, password);
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
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Manat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Age</label>
            <input
              type="number"
              className={styles.input}
              placeholder="e.g. 19"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="10"
              max="120"
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
