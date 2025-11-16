import { apiRequest } from '../api/http';
import { CheckResult, SelfTestReport } from './types';

const now = () => performance.now();

const timed = async <T>(
  fn: () => Promise<T>
): Promise<[T, number]> => {
  const s = now();
  const r = await fn();
  return [r, now() - s];
};

async function checkManifest(): Promise<CheckResult> {
  try {
    const [res, ms] = await timed(async () =>
      fetch('/manifest.webmanifest', { cache: 'no-store' })
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return {
      id: 'pwa.manifest',
      label: 'Manifest available',
      status: 'pass',
      durationMs: ms,
    };
  } catch (e: any) {
    return {
      id: 'pwa.manifest',
      label: 'Manifest available',
      status: 'fail',
      detail: e.message,
    };
  }
}

async function checkServiceWorker(): Promise<CheckResult> {
  try {
    if (!('serviceWorker' in navigator)) {
      return {
        id: 'pwa.sw',
        label: 'Service worker support',
        status: 'warn',
        detail: 'Navigator lacks serviceWorker',
      };
    }
    const [reg, ms] = await timed(() =>
      navigator.serviceWorker.getRegistration()
    );
    if (!reg) {
      return {
        id: 'pwa.sw',
        label: 'Service worker registered',
        status: 'warn',
        durationMs: ms,
        detail: 'No registration yet (open preview build or reload once)',
      };
    }
    const controlling = !!navigator.serviceWorker.controller;
    return {
      id: 'pwa.sw',
      label: controlling ? 'SW controlling page' : 'SW registered (not controlling yet)',
      status: controlling ? 'pass' : 'warn',
      durationMs: ms,
    };
  } catch (e: any) {
    return {
      id: 'pwa.sw',
      label: 'Service worker registered',
      status: 'fail',
      detail: e.message,
    };
  }
}

async function checkDisplayMode(): Promise<CheckResult> {
  try {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    return {
      id: 'pwa.displayMode',
      label: 'Display mode',
      status: standalone ? 'pass' : 'warn',
      detail: standalone ? 'standalone' : 'browser tab',
    };
  } catch (e: any) {
    return {
      id: 'pwa.displayMode',
      label: 'Display mode',
      status: 'warn',
      detail: 'Cannot detect',
    };
  }
}

async function checkOfflineBasics(): Promise<CheckResult> {
  try {
    const hasCaches = 'caches' in window;
    const hasSync = 'serviceWorker' in navigator && 'SyncManager' in window;
    const detail = `caches=${hasCaches}, backgroundSync=${hasSync}`;
    return {
      id: 'pwa.offline',
      label: 'Offline readiness (capabilities)',
      status: hasCaches ? 'pass' : 'warn',
      detail,
    };
  } catch (e: any) {
    return {
      id: 'pwa.offline',
      label: 'Offline readiness',
      status: 'warn',
      detail: e.message,
    };
  }
}

async function checkViewportMeta(): Promise<CheckResult> {
  const el = document.querySelector('meta[name="viewport"]');
  const ok = !!el && (el as HTMLMetaElement).content.includes('viewport-fit=cover');
  return {
    id: 'ui.viewport',
    label: 'Viewport + safe-area meta',
    status: ok ? 'pass' : 'warn',
    detail: ok ? 'viewport-fit=cover' : 'Missing or incomplete',
  };
}

// Backend checks
async function checkApiHealth(): Promise<CheckResult> {
  try {
    const [_, ms] = await timed(() => apiRequest('/api/health'));
    return {
      id: 'api.health',
      label: 'Backend /api/health',
      status: 'pass',
      durationMs: ms,
    };
  } catch (e: any) {
    return {
      id: 'api.health',
      label: 'Backend /api/health',
      status: 'fail',
      detail: e.message,
    };
  }
}

async function checkGameState(): Promise<CheckResult> {
  try {
    const [data, ms] = await timed(() => apiRequest<any>('/api/game/state'));
    const ok = data && (data.state || data.accounts || data.player || data.health);
    return {
      id: 'api.game.state',
      label: 'GET /api/game/state',
      status: ok ? 'pass' : 'fail',
      durationMs: ms,
      detail: ok ? 'shape ok' : 'unexpected response',
    };
  } catch (e: any) {
    return {
      id: 'api.game.state',
      label: 'GET /api/game/state',
      status: 'fail',
      detail: e.message,
    };
  }
}

async function checkAgentMentor(): Promise<CheckResult> {
  try {
    const [data, ms] = await timed(() =>
      apiRequest<any>('/api/agent/mentor', {
        method: 'POST',
        body: JSON.stringify({ input: 'Quick tip about building an emergency fund.' }),
      })
    );
    const ok = data && (data.message || data.agent);
    return {
      id: 'api.agent.mentor',
      label: 'POST /api/agent/mentor',
      status: ok ? 'pass' : 'fail',
      durationMs: ms,
    };
  } catch (e: any) {
    return {
      id: 'api.agent.mentor',
      label: 'POST /api/agent/mentor',
      status: 'fail',
      detail: e.message,
    };
  }
}

async function checkPlaybook(): Promise<CheckResult> {
  try {
    const [data, ms] = await timed(() =>
      apiRequest<any>('/api/game/playbook')
    );
    const ok = data && (data.playbook?.patterns || data.patterns);
    return {
      id: 'api.game.playbook',
      label: 'GET /api/game/playbook',
      status: ok ? 'pass' : 'warn',
      durationMs: ms,
      detail: ok ? '' : 'Empty or unexpected',
    };
  } catch (e: any) {
    return {
      id: 'api.game.playbook',
      label: 'GET /api/game/playbook',
      status: 'fail',
      detail: e.message,
    };
  }
}

async function tryPostChoiceIfAvailable(): Promise<CheckResult> {
  try {
    const state = await apiRequest<any>('/api/game/state');
    const scenarioId = state?.state?.lastScenario?.id ?? state?.lastScenario?.id ?? null;
    const choiceId = 'test-choice-1'; // Mock choice for testing
    
    if (!scenarioId) {
      return {
        id: 'api.game.choice',
        label: 'POST /api/game/choice (conditional)',
        status: 'warn',
        detail: 'No discoverable scenarioId; skipping',
      };
    }
    
    const [data, ms] = await timed(() =>
      apiRequest<any>('/api/game/choice', {
        method: 'POST',
        body: JSON.stringify({ scenarioId, choiceId }),
      })
    );
    const ok = data && data.state;
    return {
      id: 'api.game.choice',
      label: 'POST /api/game/choice',
      status: ok ? 'pass' : 'fail',
      durationMs: ms,
    };
  } catch (e: any) {
    return {
      id: 'api.game.choice',
      label: 'POST /api/game/choice',
      status: 'fail',
      detail: e.message,
    };
  }
}

export async function runAllChecks(): Promise<SelfTestReport> {
  const startedAt = new Date().toISOString();
  
  const checks = [
    checkManifest(),
    checkServiceWorker(),
    checkDisplayMode(),
    checkOfflineBasics(),
    checkViewportMeta(),
    checkApiHealth(),
    checkGameState(),
    tryPostChoiceIfAvailable(),
    checkPlaybook(),
    checkAgentMentor(),
  ];
  
  const results = await Promise.all(checks);
  
  const summary = results.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 } as Record<'pass' | 'warn' | 'fail', number>
  );
  
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    results,
    summary: {
      pass: summary.pass,
      warn: summary.warn,
      fail: summary.fail,
    },
  };
}
