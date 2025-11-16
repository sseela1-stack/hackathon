/**
 * Progress Path - Journey ribbon showing player's progression
 */

import { FlowState } from '../../flow/flowTypes';
import styles from './ProgressPath.module.css';

interface ProgressPathProps {
  flow: FlowState;
  investingUnlocked: boolean;
}

interface PathNode {
  id: string;
  label: string;
  icon: string;
  status: 'completed' | 'active' | 'locked';
}

export function ProgressPath({ flow, investingUnlocked }: ProgressPathProps) {
  // Determine onboarding status
  const onboardingComplete = flow.current !== 'onboarding.role' && 
                             flow.current !== 'onboarding.mood' && 
                             flow.current !== 'onboarding.goal';

  // Determine Month 1 status
  const month1Quests: Array<'q.payEssentials' | 'q.buffer100' | 'q.makeChoice' | 'q.askMentor'> = 
    ['q.payEssentials', 'q.buffer100', 'q.makeChoice', 'q.askMentor'];
  const month1Complete = month1Quests.every(q => flow.completed.has(q));

  // Build path nodes
  const nodes: PathNode[] = [
    {
      id: 'onboarding',
      label: 'Onboard',
      icon: '🎯',
      status: onboardingComplete ? 'completed' : 'active',
    },
    {
      id: 'month1',
      label: 'Month 1',
      icon: '📋',
      status: month1Complete ? 'completed' : onboardingComplete ? 'active' : 'locked',
    },
    {
      id: 'investing',
      label: 'Investing',
      icon: '📈',
      status: investingUnlocked ? 'active' : 'locked',
    },
    {
      id: 'playbook',
      label: 'Playbook',
      icon: '📖',
      status: 'locked', // Unlocks at end of game
    },
  ];

  return (
    <div className={styles.container} role="navigation" aria-label="Progress Path">
      <div className={styles.path}>
        {nodes.map((node, index) => (
          <div key={node.id} className={styles.nodeWrapper}>
            <div className={`${styles.node} ${styles[node.status]}`}>
              <span className={styles.icon} aria-hidden="true">{node.icon}</span>
              <span className={styles.label}>{node.label}</span>
              {node.status === 'completed' && (
                <span className={styles.checkmark} aria-label="Completed">✓</span>
              )}
              {node.status === 'locked' && (
                <span className={styles.lock} aria-label="Locked">🔒</span>
              )}
            </div>

            {index < nodes.length - 1 && (
              <div className={`${styles.connector} ${node.status === 'completed' ? styles.connectorCompleted : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
