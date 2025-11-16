/**
 * Flow state persistence via localStorage
 */

import { FlowState, FlowStepId } from './flowTypes';

const STORAGE_KEY = 'finquest_flow_v1';

function serializeFlowState(flow: FlowState): string {
  return JSON.stringify({
    ...flow,
    completed: Array.from(flow.completed),
  });
}

function deserializeFlowState(json: string): FlowState {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    completed: new Set(parsed.completed || []),
  };
}

export function getFlow(): FlowState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return deserializeFlowState(stored);
  } catch (e) {
    console.error('Failed to load flow state:', e);
    return null;
  }
}

export function setFlow(flow: FlowState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeFlowState(flow));
  } catch (e) {
    console.error('Failed to save flow state:', e);
  }
}

export function complete(stepId: FlowStepId): void {
  const flow = getFlow();
  if (!flow) return;
  
  flow.completed.add(stepId);
  setFlow(flow);
}

export function reset(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function initializeFlow(monthIndex: number = 0): FlowState {
  return {
    current: 'onboarding.role',
    completed: new Set(),
    monthIndex,
    showHints: true,
  };
}
