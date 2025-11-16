export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  durationMs?: number;
}

export interface SelfTestReport {
  startedAt: string;
  finishedAt: string;
  results: CheckResult[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
}
