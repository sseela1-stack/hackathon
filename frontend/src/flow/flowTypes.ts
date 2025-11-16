/**
 * Flow system types for guided player journey
 */

export type FlowStepId =
  | 'onboarding.role'
  | 'onboarding.mood'
  | 'onboarding.goal'
  | 'q.payEssentials'
  | 'q.buffer100'
  | 'q.makeChoice'
  | 'q.askMentor'
  | 'unlock.investing'
  | 'end.playbook';

export interface FlowState {
  current: FlowStepId;
  completed: Set<FlowStepId>;
  monthIndex: number;
  showHints: boolean;
}

export interface Quest {
  id: FlowStepId;
  title: string;
  description: string;
  icon: string;
  status: 'locked' | 'active' | 'done';
}

export interface BeaconConfig {
  targetSelector: string;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}
