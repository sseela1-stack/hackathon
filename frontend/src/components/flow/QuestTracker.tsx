/**
 * Quest Tracker - Horizontal rail showing Month 1 quests
 */

import { useState } from 'react';
import { FlowState, Quest } from '../../flow/flowTypes';
import styles from './QuestTracker.module.css';

interface QuestTrackerProps {
  flow: FlowState;
}

const QUESTS: Quest[] = [
  {
    id: 'q.payEssentials',
    title: 'Pay Essentials',
    description: 'Pay your rent, food, and utilities on time',
    icon: '🏠',
    status: 'locked',
  },
  {
    id: 'q.buffer100',
    title: 'Buffer $100',
    description: 'Save your first $100 as an emergency fund',
    icon: '💰',
    status: 'locked',
  },
  {
    id: 'q.makeChoice',
    title: 'Make a Choice',
    description: 'Make a smart decision in a financial scenario',
    icon: '🤔',
    status: 'locked',
  },
  {
    id: 'q.askMentor',
    title: 'Ask Mentor',
    description: 'Consult the Mentor for guidance',
    icon: '💡',
    status: 'locked',
  },
];

export function QuestTracker({ flow }: QuestTrackerProps) {
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  const questsWithStatus = QUESTS.map((quest) => {
    let status: 'locked' | 'active' | 'done' = 'locked';
    
    if (flow.completed.has(quest.id)) {
      status = 'done';
    } else if (flow.current === quest.id) {
      status = 'active';
    } else {
      // Check if it's the next quest in sequence
      const questIndex = QUESTS.findIndex(q => q.id === quest.id);
      const currentIndex = QUESTS.findIndex(q => q.id === flow.current);
      if (questIndex <= currentIndex + 1) {
        status = 'active';
      }
    }

    return { ...quest, status };
  });

  const completedCount = questsWithStatus.filter(q => q.status === 'done').length;

  return (
    <div className={styles.container} role="region" aria-label="Month 1 Quests">
      <div className={styles.header}>
        <h3 className={styles.title}>Month 1 Quest Line</h3>
        <span className={styles.progress} aria-live="polite">
          {completedCount}/{QUESTS.length}
        </span>
      </div>

      <div className={styles.rail}>
        {questsWithStatus.map((quest, index) => (
          <div key={quest.id} className={styles.questWrapper}>
            <button
              className={`${styles.questChip} ${styles[quest.status]}`}
              onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
              aria-label={`${quest.title}: ${quest.status}`}
              aria-expanded={expandedQuest === quest.id}
            >
              <span className={styles.questIcon}>{quest.icon}</span>
              <span className={styles.questTitle}>{quest.title}</span>
              {quest.status === 'done' && (
                <span className={styles.checkmark} aria-hidden="true">✓</span>
              )}
              {quest.status === 'active' && (
                <span className={styles.pulse} aria-hidden="true" />
              )}
            </button>

            {expandedQuest === quest.id && (
              <div className={styles.tooltip} role="tooltip">
                {quest.description}
              </div>
            )}

            {index < QUESTS.length - 1 && (
              <div className={`${styles.connector} ${quest.status === 'done' ? styles.connectorDone : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
