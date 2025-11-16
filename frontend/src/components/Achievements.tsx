import styles from './Achievements.module.css';

/**
 * Achievement definitions with metadata
 */
const ACHIEVEMENT_DATA: Record<string, { title: string; description: string; icon: string }> = {
  'crisis-survived': {
    title: 'Crisis Survived',
    description: 'Successfully navigated a financial crisis',
    icon: '🛡️',
  },
  'first-100-saved': {
    title: 'First $100 Saved',
    description: 'Reached $100 in your savings account',
    icon: '💰',
  },
  'stayed-the-course': {
    title: 'Stayed the Course',
    description: 'Held investments during market crash',
    icon: '📈',
  },
  'emergency-fund': {
    title: 'Emergency Fund',
    description: 'Saved 3 months of expenses',
    icon: '🏦',
  },
  'perfect-month': {
    title: 'Perfect Month',
    description: 'Completed a month with no health loss',
    icon: '⭐',
  },
};

interface AchievementsProps {
  /** Array of earned achievement IDs */
  earned: string[];
  
  /** Show all achievements (earned + locked) */
  showAll?: boolean;
}

/**
 * Achievement Badge Component
 * Displays earned and locked achievements
 */
export function Achievements({ earned, showAll = false }: AchievementsProps) {
  const allAchievementIds = Object.keys(ACHIEVEMENT_DATA);
  const displayIds = showAll ? allAchievementIds : earned;

  if (displayIds.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          Complete challenges to earn achievements!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Achievements</h2>
      <div className={styles.grid}>
        {displayIds.map((id) => {
          const achievement = ACHIEVEMENT_DATA[id];
          const isEarned = earned.includes(id);
          
          if (!achievement) return null;
          
          return (
            <div
              key={id}
              className={`${styles.badge} ${isEarned ? styles.earned : styles.locked}`}
              role="img"
              aria-label={`${achievement.title}: ${achievement.description}${isEarned ? ' (earned)' : ' (locked)'}`}
            >
              <div className={styles.icon}>{achievement.icon}</div>
              <div className={styles.info}>
                <h3 className={styles.badgeTitle}>{achievement.title}</h3>
                <p className={styles.description}>{achievement.description}</p>
              </div>
              {isEarned && (
                <div className={styles.checkmark} aria-hidden="true">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact Achievement Counter
 * Shows count of earned achievements
 */
export function AchievementCounter({ earned }: { earned: string[] }) {
  const total = Object.keys(ACHIEVEMENT_DATA).length;
  const earnedCount = earned.length;

  return (
    <div className={styles.counter} aria-label={`${earnedCount} of ${total} achievements earned`}>
      <span className={styles.counterIcon}>🏆</span>
      <span className={styles.counterText}>
        {earnedCount}/{total}
      </span>
    </div>
  );
}

/**
 * New Achievement Toast
 * Shows when player earns a new achievement
 */
export function AchievementToast({ achievementId }: { achievementId: string }) {
  const achievement = ACHIEVEMENT_DATA[achievementId];

  if (!achievement) return null;

  return (
    <div className={styles.toast} role="alert" aria-live="polite">
      <div className={styles.toastIcon}>{achievement.icon}</div>
      <div className={styles.toastInfo}>
        <h3 className={styles.toastTitle}>Achievement Unlocked!</h3>
        <p className={styles.toastDescription}>{achievement.title}</p>
      </div>
    </div>
  );
}

export default Achievements;
