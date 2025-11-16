import { useState } from 'react';
import styles from './ProfileCreation.module.css';

export type Role = 'student' | 'earlyCareer' | 'midCareer';
export type Difficulty = 'easy' | 'normal' | 'hard';

interface ProfileCreationProps {
  onComplete: (profile: { role: Role; difficulty: Difficulty; name: string }) => void;
}

const ROLE_INFO = {
  student: {
    title: '🎓 Student',
    income: '$1,000/month',
    description: 'Part-time job, learning the basics',
    rent: '$400',
    emoji: '📚',
  },
  earlyCareer: {
    title: '💼 Early Career',
    income: '$2,500/month',
    description: 'Entry-level job, building your foundation',
    rent: '$900',
    emoji: '🌱',
  },
  midCareer: {
    title: '🚀 Mid Career',
    income: '$4,000/month',
    description: 'Established professional, complex decisions',
    rent: '$1,400',
    emoji: '⭐',
  },
};

const DIFFICULTY_INFO = {
  easy: {
    title: 'Relaxed',
    description: 'More income, easier to build savings',
    icon: '😌',
    color: '#4CAF50',
  },
  normal: {
    title: 'Balanced',
    description: 'Realistic income and expenses',
    icon: '🎯',
    color: '#2196F3',
  },
  hard: {
    title: 'Challenge',
    description: 'Tight budget, every choice matters',
    icon: '🔥',
    color: '#FF9800',
  },
};

export function ProfileCreation({ onComplete }: ProfileCreationProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const handleStart = () => {
    if (name.trim()) {
      setStep(2);
    }
  };

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setTimeout(() => setStep(3), 300);
  };

  const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setTimeout(() => {
      if (role && selectedDifficulty) {
        onComplete({ role, difficulty: selectedDifficulty, name });
      }
    }, 300);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Step 1: Welcome & Name */}
        {step === 1 && (
          <div className={`${styles.stepContainer} ${styles.fadeIn}`}>
            <div className={styles.logo}>💰</div>
            <h1 className={styles.title}>Welcome to FinQuest!</h1>
            <p className={styles.subtitle}>
              Master your money, one quest at a time.
            </p>
            
            <div className={styles.nameInput}>
              <label htmlFor="name" className={styles.label}>
                What should we call you?
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                autoFocus
                maxLength={20}
              />
            </div>

            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={handleStart}
              disabled={!name.trim()}
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Step 2: Select Role */}
        {step === 2 && (
          <div className={`${styles.stepContainer} ${styles.fadeIn}`}>
            <h2 className={styles.stepTitle}>
              Hi {name}! 👋<br />What's your current situation?
            </h2>
            <p className={styles.stepSubtitle}>
              This helps us match realistic income and expenses
            </p>

            <div className={styles.roleGrid}>
              {(Object.keys(ROLE_INFO) as Role[]).map((roleKey) => {
                const info = ROLE_INFO[roleKey];
                return (
                  <button
                    key={roleKey}
                    className={`${styles.roleCard} ${role === roleKey ? styles.selected : ''}`}
                    onClick={() => handleRoleSelect(roleKey)}
                  >
                    <div className={styles.roleEmoji}>{info.emoji}</div>
                    <h3 className={styles.roleTitle}>{info.title}</h3>
                    <div className={styles.roleIncome}>{info.income}</div>
                    <p className={styles.roleDescription}>{info.description}</p>
                    <div className={styles.roleDetails}>
                      <span className={styles.roleDetail}>Rent: {info.rent}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Difficulty */}
        {step === 3 && (
          <div className={`${styles.stepContainer} ${styles.fadeIn}`}>
            <h2 className={styles.stepTitle}>
              Choose your difficulty 🎯
            </h2>
            <p className={styles.stepSubtitle}>
              You can always adjust this later in settings
            </p>

            <div className={styles.difficultyGrid}>
              {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map((diffKey) => {
                const info = DIFFICULTY_INFO[diffKey];
                return (
                  <button
                    key={diffKey}
                    className={`${styles.difficultyCard} ${difficulty === diffKey ? styles.selected : ''}`}
                    onClick={() => handleDifficultySelect(diffKey)}
                    style={{ borderColor: info.color }}
                  >
                    <div className={styles.difficultyIcon}>{info.icon}</div>
                    <h3 className={styles.difficultyTitle}>{info.title}</h3>
                    <p className={styles.difficultyDescription}>{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className={styles.progress}>
          <div className={`${styles.progressDot} ${step >= 1 ? styles.active : ''}`} />
          <div className={`${styles.progressDot} ${step >= 2 ? styles.active : ''}`} />
          <div className={`${styles.progressDot} ${step >= 3 ? styles.active : ''}`} />
        </div>
      </div>
    </div>
  );
}
