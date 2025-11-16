/**
 * Flow engine - determines next steps and beacon targets
 */

import { FlowState, FlowStepId, BeaconConfig } from './flowTypes';

export function getInitialStep(hasProfile: boolean): FlowStepId {
  return hasProfile ? 'q.payEssentials' : 'onboarding.role';
}

export function nextStep(flow: FlowState, gameState: any): FlowStepId {
  const { current, completed } = flow;

  // Onboarding sequence
  if (current === 'onboarding.role') return 'onboarding.mood';
  if (current === 'onboarding.mood') return 'onboarding.goal';
  if (current === 'onboarding.goal') return 'q.payEssentials';

  // Quest sequence for Month 1
  if (current === 'q.payEssentials' && completed.has('q.payEssentials')) {
    return 'q.buffer100';
  }
  if (current === 'q.buffer100' && completed.has('q.buffer100')) {
    return 'q.makeChoice';
  }
  if (current === 'q.makeChoice' && completed.has('q.makeChoice')) {
    return 'q.askMentor';
  }
  if (current === 'q.askMentor' && completed.has('q.askMentor')) {
    // Check if investing should unlock
    if (gameState && shouldUnlockInvesting(gameState)) {
      return 'unlock.investing';
    }
    // Otherwise continue normal gameplay
    return current;
  }

  // Check investing unlock condition
  if (gameState && shouldUnlockInvesting(gameState) && !completed.has('unlock.investing')) {
    return 'unlock.investing';
  }

  return current;
}

export function shouldUnlockInvesting(gameState: any): boolean {
  if (!gameState) return false;
  
  const savings = gameState.accounts?.find((a: any) => a.type === 'savings')?.balance || 0;
  return gameState.health >= 55 && savings >= 300;
}

export function shouldShowBeacon(stepId: FlowStepId): BeaconConfig | null {
  const beacons: Record<FlowStepId, BeaconConfig | null> = {
    'onboarding.role': null,
    'onboarding.mood': null,
    'onboarding.goal': null,
    'q.payEssentials': {
      targetSelector: '#pay-bills',
      text: 'Pay your essential bills to build good habits 💰',
      position: 'bottom',
    },
    'q.buffer100': {
      targetSelector: '#buffer-100',
      text: 'Save your first $100 as a financial buffer 🎯',
      position: 'bottom',
    },
    'q.makeChoice': {
      targetSelector: '#choice-panel',
      text: 'Make a smart financial choice in this scenario 🤔',
      position: 'top',
    },
    'q.askMentor': {
      targetSelector: '#ask-mentor',
      text: 'Ask the Mentor for guidance on this situation 💡',
      position: 'top',
    },
    'unlock.investing': null,
    'end.playbook': null,
  };

  return beacons[stepId] || null;
}

export function detectMilestones(gameState: any, previousState: any | null): FlowStepId[] {
  const milestones: FlowStepId[] = [];

  if (!gameState) return milestones;

  // Detect bills paid (check if health didn't drop and a bill was processed)
  const recentBillPaid = gameState.history?.some((entry: any, idx: number) => {
    if (idx === 0) return false;
    const delta = entry.delta;
    return delta.bankDelta < 0 && 
           Math.abs(delta.bankDelta) < 200 && 
           (delta.healthDelta || 0) >= 0;
  });

  if (recentBillPaid) {
    milestones.push('q.payEssentials');
  }

  // Detect $100 buffer reached
  const savings = gameState.accounts?.find((a: any) => a.type === 'savings')?.balance || 0;
  const prevSavings = previousState?.accounts?.find((a: any) => a.type === 'savings')?.balance || 0;
  
  if (savings >= 100 && prevSavings < 100) {
    milestones.push('q.buffer100');
  }

  // Detect choice made
  if (gameState.history?.length > (previousState?.history?.length || 0)) {
    milestones.push('q.makeChoice');
  }

  return milestones;
}
