export const API_BASE_URL = '/api';

export const DEFAULT_TIMEOUT_MS = 30_000;
export const STREAM_TIMEOUT_MS = 120_000;

export const API_ROUTES = {
  agent: {
    runMission: '/agent/run-mission',
  },
} as const;
