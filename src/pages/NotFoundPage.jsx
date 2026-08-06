import { useNavigate } from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from '../styles/NotFoundPage.module.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.codeBadge}>404</div>
      <h2 className={styles.title}>Coordinates Outside Workspace</h2>
      <p className={styles.desc}>
        The requested path does not exist in DreamScape space. Return to safety or head straight to your command dashboard.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" icon={Home} onClick={() => navigate('/app/dashboard')}>
          Executive Dashboard
        </Button>
      </div>
    </div>
  );
}
